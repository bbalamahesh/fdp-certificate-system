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
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!

const DEFAULT_CONTENT: CertificateContent = {
    programName: '',
    institution: '',
    department: '',
    faculty: '',
    location: '',
    address: '',
    programDates: '',
    footerText: '',
    coordinatorName: '',
    hodName: '',
    logoDataUrl: '',
    coordinatorSignatureDataUrl: '',
    hodSignatureDataUrl: '',
}

export async function getCertificateContentForEvent(eventId: string) {
    try {
        const safeEventId = eventId || 'default-event'
        const SHEET_NAME = `CertificateContent_${safeEventId}`

        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:B`,
        })

        const rows = res.data.values || []

        const raw: Record<string, string> = {}
        rows.forEach(([key, value]) => {
            if (key) raw[key] = value ?? ''
        })

        const startDate = raw.startDate
        const endDate = raw.endDate

        const programDates =
            startDate && endDate
                ? `${startDate} and ${endDate}`
                : raw.programDates || ''

        const footerText =
            raw.footerText ||
            [raw.coordinatorName, raw.hodName]
                .filter(Boolean)
                .join(' • ')

        return {
            ...DEFAULT_CONTENT,
            programName: raw.programName || '',
            institution: raw.institution || '',
            department: raw.department || '',
            faculty: raw.faculty || '',
            location: raw.location || '',
            address: raw.address || '',
            startDate: startDate || '',
            endDate: endDate || '',
            programDates,
            footerText,
            coordinatorName: raw.coordinatorName || '',
            hodName: raw.hodName || '',
            logoDataUrl: raw.logoDataUrl || '',
            coordinatorSignatureDataUrl:
                raw.coordinatorSignatureDataUrl || '',
            hodSignatureDataUrl: raw.hodSignatureDataUrl || '',
        }
    } catch (error) {
        console.warn('[CertificateContent] Falling back to defaults', error)
        return DEFAULT_CONTENT
    }
}
