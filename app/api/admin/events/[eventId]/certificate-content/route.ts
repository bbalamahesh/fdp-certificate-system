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
const DEFAULT_CONTENT: CertificateContent = {
    programName: '',
    programDates: '',
    department: '',
    faculty: '',
    institution: '',
    location: '',
    address: '',
    coordinatorName: '',
    hodName: '',
    footerText: '',
    logoDataUrl: '',
    coordinatorSignatureDataUrl: '',
    hodSignatureDataUrl: '',
}

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

function isMissingRangeError(error: any) {
    const message = error?.message || ''
    const gaxiosMessage = error?.errors?.[0]?.message || ''
    return (
        message.includes('Unable to parse range') ||
        gaxiosMessage.includes('Unable to parse range')
    )
}

async function createSheetIfMissing(eventId: string) {
    try {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    { addSheet: { properties: { title: sheetName(eventId) } } },
                ],
            },
        })
    } catch (error: any) {
        const msg = error?.message || error?.errors?.[0]?.message || ''
        if (!msg.toLowerCase().includes('already exists')) {
            throw error
        }
    }
}

/* -------------------- GET -------------------- */
export async function GET(
    _req: Request,
    { params }: { params: { eventId: string } }
) {
    try {
        let rows: string[][] = []
        try {
            const res = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${sheetName(params.eventId)}!A:B`,
            })
            rows = (res.data.values ?? []) as string[][]
        } catch (error) {
            if (!isMissingRangeError(error)) throw error
        }

        const map = Object.fromEntries(rows.slice(1))

        const content: CertificateContent = {
            ...DEFAULT_CONTENT,
            programName: map.programName || '',
            programDates: map.programDates || '',
            department: map.department || '',
            faculty: map.faculty || '',
            institution: map.institution || '',
            location: map.location || '',
            address: map.address || '',
            coordinatorName: map.coordinatorName || '',
            hodName: map.hodName || '',
            footerText: map.footerText || '',
            logoDataUrl: map.logoDataUrl || '',
            coordinatorSignatureDataUrl:
                map.coordinatorSignatureDataUrl || '',
            hodSignatureDataUrl: map.hodSignatureDataUrl || '',
        }

        return NextResponse.json({ success: true, content })
    } catch (error) {
        console.error('GET CERT CONTENT ERROR:', error)
        return NextResponse.json(
            {
                error: 'Failed to fetch certificate content',
                details: error instanceof Error ? error.message : String(error),
            },
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
            ['address', body.address || ''],
            ['coordinatorName', body.coordinatorName || ''],
            ['hodName', body.hodName || ''],
            ['footerText', body.footerText || ''],
            ['logoDataUrl', body.logoDataUrl || ''],
            [
                'coordinatorSignatureDataUrl',
                body.coordinatorSignatureDataUrl || '',
            ],
            ['hodSignatureDataUrl', body.hodSignatureDataUrl || ''],
        ]

        try {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName(params.eventId)}!A:B`,
                valueInputOption: 'RAW',
                requestBody: { values },
            })
        } catch (error) {
            if (!isMissingRangeError(error)) throw error
            await createSheetIfMissing(params.eventId)
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName(params.eventId)}!A:B`,
                valueInputOption: 'RAW',
                requestBody: { values },
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('SAVE CERT CONTENT ERROR:', error)
        return NextResponse.json(
            {
                error: 'Failed to save certificate content',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
