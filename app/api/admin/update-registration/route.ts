import { NextResponse } from 'next/server'
import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!
const SHEET_NAME = 'Registrations'

export async function POST(req: Request) {
    try {
        const {
            sheetRow,
            title,
            name,
            email,
            phone,
            organization,
        } = await req.json()

        if (!sheetRow) {
            return NextResponse.json(
                { error: 'sheetRow is required' },
                { status: 400 }
            )
        }

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!B${sheetRow}:F${sheetRow}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    title ?? '',
                    name ?? '',
                    email ?? '',
                    phone ?? '',
                    organization ?? '',
                ]],
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('UPDATE REGISTRATION ERROR:', error)
        return NextResponse.json(
            { error: 'Failed to update registration' },
            { status: 500 }
        )
    }
}
