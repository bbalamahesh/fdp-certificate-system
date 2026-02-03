import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import type { CertificateContent } from '@/lib/certificates/types'

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })
const spreadsheetId = process.env.GOOGLE_SHEET_ID!

/**
 * Sheet naming strategy (temporary, DB-friendly):
 * CertificateContent_<eventId>
 *
 * Example:
 * CertificateContent_default-event
 */
function sheetName(eventId: string) {
    return `CertificateContent_${eventId}`
}

/* -------------------- GET -------------------- */
export async function GET(
    _req: Request,
    { params }: { params: { eventId: string } }
) {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName(params.eventId)}!A:B`,
        })

        const rows = res.data.values ?? []

        if (rows.length <= 1) {
            return NextResponse.json({ success: true, content: null })
        }

        const map = Object.fromEntries(rows.slice(1))

        const content: CertificateContent = {
            programName: map.programName || '',
            programDates: map.programDates || '',
            department: map.department || '',
            faculty: map.faculty || '',
            institution: map.institution || '',
            location: map.location || '',
            coordinatorName: map.coordinatorName || '',
            hodName: map.hodName || '',
        }

        return NextResponse.json({ success: true, content })
    } catch (error) {
        console.error('GET CERT CONTENT ERROR:', error)
        return NextResponse.json(
            { error: 'Failed to fetch certificate content' },
            { status: 500 }
        )
    }
}

/* -------------------- POST -------------------- */
export async function POST(
    req: Request,
    { params }: { params: { eventId: string } }
) {
    try {
        const body = (await req.json()) as CertificateContent

        const values = [
            ['key', 'value'],
            ['programName', body.programName],
            ['programDates', body.programDates],
            ['department', body.department],
            ['faculty', body.faculty],
            ['institution', body.institution],
            ['location', body.location],
            ['coordinatorName', body.coordinatorName || ''],
            ['hodName', body.hodName || ''],
        ]

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName(params.eventId)}!A:B`,
            valueInputOption: 'RAW',
            requestBody: { values },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('SAVE CERT CONTENT ERROR:', error)
        return NextResponse.json(
            { error: 'Failed to save certificate content' },
            { status: 500 }
        )
    }
}
