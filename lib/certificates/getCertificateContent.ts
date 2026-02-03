import { google } from 'googleapis'
import type { CertificateContent } from './types'

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })
const spreadsheetId = process.env.GOOGLE_SHEET_ID!

const sheetName = (eventId: string) =>
    `CertificateContent_${eventId}`

export async function getCertificateContentForEvent(
    eventId: string
): Promise<CertificateContent> {
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName(eventId)}!A:B`,
    })

    const rows = res.data.values ?? []
    const map = Object.fromEntries(rows.slice(1))

    return {
        programName: map.programName || '',
        programDates: map.programDates || '',
        department: map.department || '',
        faculty: map.faculty || '',
        institution: map.institution || '',
        location: map.location || '',
        coordinatorName: map.coordinatorName || '',
        hodName: map.hodName || '',
    }
}
