import type { CertificateConfig } from './renderCertificate'
import { google } from 'googleapis'

/**
 * TEMP implementation (Google Sheets)
 * Later this becomes a DB query without changing callers
 */
export async function getCertificateConfigForOrg(
    organizationId?: string
): Promise<CertificateConfig> {
    // TODO: scope by organizationId (future)
    // For now: single-org assumption

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
     * Expected sheet: CertificateConfig
     *
     * key | value
     * -------------------------
     * title | Certificate of Participation
     * eventType | FDP
     * orientation | landscape
     * signatureCount | 2
     * watermarkEnabled | true
     */
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'CertificateConfig!A:B',
    })

    const rows = res.data.values ?? []

    const map = Object.fromEntries(rows.slice(1))

    return {
        title: map.title || 'Certificate of Participation',
        eventType: map.eventType || 'Event',
        orientation:
            map.orientation === 'portrait' ? 'portrait' : 'landscape',
        signatureCount: [0, 1, 2].includes(Number(map.signatureCount))
            ? (Number(map.signatureCount) as 0 | 1 | 2)
            : 2,
        watermarkEnabled: map.watermarkEnabled === 'true',
    }
}
