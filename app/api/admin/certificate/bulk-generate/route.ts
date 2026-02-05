import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { renderCertificate } from '@/lib/certificates/renderCertificate'
import { getCertificateConfigForOrg } from '@/lib/certificates/getCertificateConfig'
import { getCertificateContentForEvent } from '@/lib/certificates/getCertificateContentForEvent'
import { sendCertificateEmail } from '@/lib/email/sendCertificateEmail'
import { nanoid } from 'nanoid'

export async function POST(req: Request) {
    try {
        const { rows, eventId } = await req.json()

        if (!Array.isArray(rows) || rows.length === 0) {
            return NextResponse.json(
                { error: 'No rows provided' },
                { status: 400 }
            )
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        })

        const sheets = google.sheets({ version: 'v4', auth })
        const spreadsheetId = process.env.GOOGLE_SHEET_ID!

        const layout = await getCertificateConfigForOrg()
        const content = await getCertificateContentForEvent(eventId)

        const summary = {
            generated: 0,
            skipped: 0,
            failed: 0,
            errors: [] as string[],
        }

        for (const row of rows) {
            const { sheetRow, name, email } = row

            try {
                // Check existing certificate
                const existing = await sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range: `Registrations!G${sheetRow}:H${sheetRow}`,
                })

                const [existingCertificateId] =
                    existing.data.values?.[0] || []

                if (existingCertificateId) {
                    summary.skipped++
                    continue
                }

                const certificateId = `CERT-${nanoid(8).toUpperCase()}`
                const issuedAtISO = new Date().toISOString()
                const issuedAtDisplay = new Date().toLocaleDateString()

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

                const pdfBuffer = await new Promise<Buffer>((resolve) =>
                    doc.on('end', () => resolve(Buffer.concat(chunks)))
                )

                // Update sheet
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `Registrations!G${sheetRow}:H${sheetRow}`,
                    valueInputOption: 'RAW',
                    requestBody: {
                        values: [[certificateId, issuedAtISO]],
                    },
                })

                // Email
                await sendCertificateEmail({
                    to: email,
                    recipientName: name,
                    programName: content.programName,
                    institution: content.institution,
                    pdfBuffer,
                })

                summary.generated++
            } catch (err: any) {
                summary.failed++
                summary.errors.push(
                    `Row ${row.sheetRow}: ${err?.message || 'Unknown error'}`
                )
            }
        }

        return NextResponse.json({
            success: true,
            summary,
        })
    } catch (error: any) {
        console.error('BULK GENERATE ERROR:', error)
        return NextResponse.json(
            { error: 'Bulk generation failed' },
            { status: 500 }
        )
    }
}
