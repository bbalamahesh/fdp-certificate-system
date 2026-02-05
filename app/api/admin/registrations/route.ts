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
const RANGE = `${SHEET_NAME}!A:Z`

export async function GET() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    })

    const rows = response.data.values
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ success: true, registrations: [] })
    }

    const headers = rows[0].map((h) => h.trim().toLowerCase())
    const idx = (name: string) => headers.indexOf(name.toLowerCase())

    const registrations = rows.slice(1).map((row, index) => ({
      id: index + 1,
      sheetRow: index + 2,

      timestamp: row[idx('timestamp')] ?? '',
      title: row[idx('title')] ?? '',
      name: row[idx('name')] ?? '',
      email: row[idx('email')] ?? '',
      phone: row[idx('phone')] ?? '',
      organization: row[idx('organization')] ?? '',

      certificateId: row[idx('certificate_id')] ?? '',
      certificateIssuedAt: row[idx('certificate_issued_at')] ?? '',
    }))

    return NextResponse.json({
      success: true,
      registrations,
    })
  } catch (error) {
    console.error('Error fetching registrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    )
  }
}
