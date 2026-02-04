import { google } from 'googleapis'

export interface CertificateContent {
    programName: string
    programDates: string
    department: string
    faculty: string
    institution: string
    location: string
    coordinatorName?: string
    hodName?: string
}

export async function getCertificateContentForEvent(
    eventId: string
): Promise<CertificateContent> {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        })

        const sheets = google.sheets({ version: 'v4', auth })
        const spreadsheetId = process.env.GOOGLE_SHEET_ID!

        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `CertificateContent_${eventId}!A:B`,
        })

        const rows = res.data.values ?? []
        const map = Object.fromEntries(rows.slice(1))

        return {
            programName: map.programName || 'Program Name',
            programDates: map.programDates || 'Program Dates',
            department: map.department || '',
            faculty: map.faculty || '',
            institution: map.institution || '',
            location: map.location || '',
            coordinatorName: map.coordinatorName || '',
            hodName: map.hodName || '',
        }
    } catch (error) {
        console.warn(
            `[CertificateContent] Falling back to defaults for event ${eventId}`,
            error
        )

        // ✅ SAFE DEFAULTS — preview will always work
        return {
            programName: 'Sample Program',
            programDates: '01 Jan 2025 – 02 Jan 2025',
            department: 'Department Name',
            faculty: 'Faculty Name',
            institution: 'Institution Name',
            location: 'Location',
            coordinatorName: '',
            hodName: '',
        }
    }
}
