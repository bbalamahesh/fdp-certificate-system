import { NextResponse } from 'next/server'
import { google, sheets_v4 } from 'googleapis'

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets: sheets_v4.Sheets = google.sheets({
    version: 'v4',
    auth,
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { sheetRow, name, email } = body

        if (!sheetRow) {
            return NextResponse.json(
                { error: 'Missing sheetRow' },
                { status: 400 }
            )
        }

        const spreadsheetId = process.env.GOOGLE_SHEET_ID

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Sheet1!C${sheetRow}:D${sheetRow}`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[name, email]],
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('UPDATE ERROR:', error)
        return NextResponse.json(
            { error: 'Failed to update registration' },
            { status: 500 }
        )
    }
}
