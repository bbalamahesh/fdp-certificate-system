import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { renderCertificate } from '@/lib/certificates/renderCertificate'
import { getCertificateConfigForOrg } from '@/lib/certificates/getCertificateConfig'
import { getCertificateContentForEvent } from '@/lib/certificates/getCertificateContentForEvent'
import { sendCertificateEmail } from '@/lib/email/sendCertificateEmail'
import { nanoid } from 'nanoid'
const SHEET_NAME = 'Registrations'
export async function POST(req: Request) {
    try {
        const { sheetRow, name, email, eventId } = await req.json()

        if (!sheetRow || !name || !email) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        /* ---------------- GOOGLE SHEETS ---------------- */
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        })

        const sheets = google.sheets({ version: 'v4', auth })
        const spreadsheetId = process.env.GOOGLE_SHEET_ID!

        /* ---------------- BACKEND GUARD ---------------- */
        // Check if certificate already issued
        const existing = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${SHEET_NAME}!G${sheetRow}:H${sheetRow}`,
        })

        const [existingCertificateId] =
            existing.data.values?.[0] || []

        if (existingCertificateId) {
            return NextResponse.json(
                { error: 'Certificate already issued' },
                { status: 409 }
            )
        }

        /* ---------------- LOAD CONFIG + CONTENT ---------------- */
        const layout = await getCertificateConfigForOrg()
        const content = await getCertificateContentForEvent(eventId)

        /* ---------------- CERTIFICATE META ---------------- */
        const certificateId = `CERT-${nanoid(8).toUpperCase()}`
        const issuedAtISO = new Date().toISOString()
        const issuedAtDisplay = new Date().toLocaleDateString()

        /* ---------------- PDF ---------------- */
        const doc = renderCertificate({
            recipientName: name,
            certificateId,
            issuedAt: issuedAtDisplay,
            layout,
            content,
        })

        const chunks: Buffer[] = []
        doc.on('data', (c) => chunks.push(c))
        doc.end()

        const pdfBuffer = await new Promise<Buffer>((resolve) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)))
        })

        /* ---------------- UPDATE GOOGLE SHEET ---------------- */
        // G → certificateId
        // H → certificateIssuedAt
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${SHEET_NAME}!G${sheetRow}:H${sheetRow}`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[certificateId, issuedAtISO]],
            },
        })

        /* ---------------- EMAIL ---------------- */
        await sendCertificateEmail({
            to: email,
            recipientName: name,
            programName: content.programName,
            institution: content.institution,
            pdfBuffer,
        })

        return NextResponse.json({
            success: true,
            certificateId,
            issuedAt: issuedAtISO,
        })
    } catch (error: any) {
        console.error('CERT GENERATE ERROR:', error)

        return NextResponse.json(
            {
                error: 'Failed to generate certificate',
                details: error?.message,
            },
            { status: 500 }
        )
    }
}
