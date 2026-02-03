import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import type { CertificateConfig } from '@/lib/certificates/renderCertificate'

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })
const spreadsheetId = process.env.GOOGLE_SHEET_ID!

const SHEET_NAME = 'CertificateConfig'

/* -------------------- GET -------------------- */
export async function GET() {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${SHEET_NAME}!A:B`,
        })

        const rows = res.data.values ?? []

        if (rows.length <= 1) {
            return NextResponse.json({
                success: true,
                config: null,
            })
        }

        const map = Object.fromEntries(rows.slice(1))

        const config: CertificateConfig = {
            title: map.title || 'Certificate of Participation',
            eventType: map.eventType || 'Event',
            orientation:
                map.orientation === 'portrait' ? 'portrait' : 'landscape',
            signatureCount: [0, 1, 2].includes(Number(map.signatureCount))
                ? (Number(map.signatureCount) as 0 | 1 | 2)
                : 2,
            watermarkEnabled: map.watermarkEnabled === 'true',
        }

        return NextResponse.json({
            success: true,
            config,
        })
    } catch (error) {
        console.error('GET CERT CONFIG ERROR:', error)
        return NextResponse.json(
            { error: 'Failed to fetch certificate config' },
            { status: 500 }
        )
    }
}

/* -------------------- POST -------------------- */
export async function POST(req: Request) {
    try {
        const body = (await req.json()) as CertificateConfig

        const values = [
            ['key', 'value'],
            ['title', body.title],
            ['eventType', body.eventType],
            ['orientation', body.orientation],
            ['signatureCount', String(body.signatureCount)],
            ['watermarkEnabled', String(body.watermarkEnabled)],
        ]

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${SHEET_NAME}!A:B`,
            valueInputOption: 'RAW',
            requestBody: { values },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('SAVE CERT CONFIG ERROR:', error)
        return NextResponse.json(
            { error: 'Failed to save certificate config' },
            { status: 500 }
        )
    }
}
