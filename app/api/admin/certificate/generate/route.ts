import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { renderCertificate } from '@/lib/certificates/renderCertificate'
import { getCertificateConfigForOrg } from '@/lib/certificates/getCertificateConfig'
import { getCertificateContentForEvent } from '@/lib/certificates/getCertificateContentForEvent'
import { sendCertificateEmail } from '@/lib/email/sendCertificateEmail'
import { nanoid } from 'nanoid'
import { logAuditEvent } from '@/lib/audit/logAuditEvent'
import crypto from 'crypto'
import QRCode from 'qrcode'

const SHEET_NAME = 'Registrations'

function generateVerificationCode() {
    return crypto.randomUUID()
}

export async function POST(req: Request) {
    try {
        const { sheetRow, name, email, eventId } = await req.json()
        const safeEventId = eventId || 'default-event'

        if (!sheetRow || !name || !email) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        /* ---------------- GOOGLE SHEETS AUTH ---------------- */
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key:
                    process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        })

        const sheets = google.sheets({ version: 'v4', auth })
        const spreadsheetId = process.env.GOOGLE_SHEET_ID!

        /* ---------------- PREVENT DUPLICATE CERTIFICATE ---------------- */
        const existing = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${SHEET_NAME}!G${sheetRow}:G${sheetRow}`,
        })

        const existingCertificateId =
            existing.data.values?.[0]?.[0]

        if (existingCertificateId) {
            return NextResponse.json(
                { error: 'Certificate already issued' },
                { status: 409 }
            )
        }

        /* ---------------- GENERATE CERTIFICATE META ---------------- */
        const certificateId = `CERT-${nanoid(8).toUpperCase()}`
        const issuedAtISO = new Date().toISOString()
        const issuedAtDisplay = new Date().toLocaleDateString()

        const verificationCode = generateVerificationCode()

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin
        const verificationUrl = `${baseUrl}/verify/${verificationCode}`

        /* ---------------- GENERATE QR CODE ---------------- */
        const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl)

        /* ---------------- LOAD CONFIG + CONTENT ---------------- */
        const layout = await getCertificateConfigForOrg()
        const content = await getCertificateContentForEvent(safeEventId)

        /* ---------------- GENERATE PDF ---------------- */
        const doc = renderCertificate({
            recipientName: name,
            certificateId,
            issuedAt: issuedAtDisplay,
            layout,
            content,
            qrCode: qrCodeDataUrl, // 🔥 NEW
        })

        const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = []
            doc.on('data', (c: Buffer) => chunks.push(c))
            doc.on('end', () => resolve(Buffer.concat(chunks)))
            doc.on('error', reject)
            doc.end()
        })
        console.log("QR LENGTH:", qrCodeDataUrl?.length)
        /* ---------------- UPDATE GOOGLE SHEET (G → K) ---------------- */
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${SHEET_NAME}!G${sheetRow}:K${sheetRow}`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[
                    certificateId,      // G
                    issuedAtISO,        // H
                    verificationCode,   // I
                    verificationUrl,    // J
                    'ACTIVE',           // K
                ]],
            },
        })

        /* ---------------- SEND EMAIL ---------------- */
        await sendCertificateEmail({
            to: email,
            recipientName: name,
            programName: content.programName || '',
            institution: content.institution || '',
            pdfBuffer,
        })

        /* ---------------- AUDIT LOGS ---------------- */
        await logAuditEvent({
            action: 'CERT_GENERATED',
            actor: 'admin',
            target: certificateId,
            metadata: {
                sheetRow,
                recipientEmail: email,
                eventId: safeEventId,
            },
        })

        await logAuditEvent({
            action: 'CERT_GENERATED',
            actor: email,
            target: certificateId,
            metadata: {
                sheetRow,
                recipientEmail: email,
            },
        })
        console.log("Verification URL:", verificationUrl)
        console.log("QR Generated:", qrCodeDataUrl?.substring(0, 50))
        return NextResponse.json({
            success: true,
            certificateId,
            issuedAt: issuedAtISO,
            verificationUrl,
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
