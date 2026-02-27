import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { logAuditEvent } from '@/lib/audit/logAuditEvent'
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!
const DEFAULT_DATA = {
    programName: '',
    institution: '',
    department: '',
    faculty: '',
    address: '',
    location: '',
    startDate: '',
    endDate: '',
    programDates: '',
    coordinatorName: '',
    hodName: '',
    footerText: '',
    logoDataUrl: '',
    coordinatorSignatureDataUrl: '',
    hodSignatureDataUrl: '',
}

function isMissingRangeError(error: any) {
    const message = error?.message || ''
    const gaxiosMessage = error?.errors?.[0]?.message || ''
    return (
        message.includes('Unable to parse range') ||
        gaxiosMessage.includes('Unable to parse range')
    )
}

function sheetName(eventId: string) {
    return `CertificateContent_${eventId}`
}

async function createSettingsSheetIfMissing(eventId: string) {
    try {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
                requests: [
                    {
                        addSheet: {
                            properties: { title: sheetName(eventId) },
                        },
                    },
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

/* -----------------------------------------
   GET – Fetch certificate settings
------------------------------------------ */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const eventId = searchParams.get('eventId') || 'default-event'
        const SHEET_NAME = sheetName(eventId)
        let rows: string[][] = []
        try {
            const res = await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_NAME}!A:B`,
            })
            rows = (res.data.values || []) as string[][]
        } catch (error) {
            if (!isMissingRangeError(error)) throw error
        }

        const raw: Record<string, string> = {}
        rows.forEach(([key, value]) => {
            if (key) raw[key] = value ?? ''
        })
        const data = { ...DEFAULT_DATA, ...raw }

        return NextResponse.json({
            success: true,
            data,
        })
    } catch (error) {
        console.error('CERT SETTINGS GET ERROR:', error)
        return NextResponse.json(
            {
                error: 'Failed to fetch certificate settings',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}

/* -----------------------------------------
   POST – Update certificate settings
------------------------------------------ */
export async function POST(req: Request) {
    try {
        const { eventId = 'default-event', data } = await req.json()

        if (!data || typeof data !== 'object') {
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 }
            )
        }

        const SHEET_NAME = sheetName(eventId)
        const merged = { ...DEFAULT_DATA, ...data }
        const values = Object.entries(merged).map(([key, value]) => [
            key,
            value ?? '',
        ])

        try {
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_NAME}!A:B`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values,
                },
            })
        } catch (error) {
            if (!isMissingRangeError(error)) throw error
            await createSettingsSheetIfMissing(eventId)
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_NAME}!A:B`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values,
                },
            })
        }

        await logAuditEvent({
            action: 'SETTINGS_UPDATED',
            actor: 'admin',
            target: eventId,
        })

        return NextResponse.json({
            success: true,
        })
    } catch (error) {
        console.error('CERT SETTINGS UPDATE ERROR:', error)
        return NextResponse.json(
            {
                error: 'Failed to update certificate settings',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
