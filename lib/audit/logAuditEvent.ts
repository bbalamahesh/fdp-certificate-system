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
const SHEET_NAME = 'AuditLog'

async function ensureAuditSheetExists() {
    const meta = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
    })

    const sheetExists = meta.data.sheets?.some(
        (s) => s.properties?.title === SHEET_NAME
    )

    if (!sheetExists) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
                requests: [
                    {
                        addSheet: {
                            properties: {
                                title: SHEET_NAME,
                            },
                        },
                    },
                ],
            },
        })

        // Add header row
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A1:E1`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[
                    'timestamp',
                    'action',
                    'actor',
                    'target',
                    'metadata',
                ]],
            },
        })
    }
}

export async function logAuditEvent({
    action,
    actor,
    target,
    metadata = {},
}: {
    action: string
    actor: string
    target: string
    metadata?: Record<string, any>
}) {
    try {
        await ensureAuditSheetExists()

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:E`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    new Date().toISOString(),
                    action,
                    actor,
                    target,
                    JSON.stringify(metadata),
                ]],
            },
        })
    } catch (error) {
        // NEVER block main flow
        console.error('AUDIT LOG ERROR:', error)
    }
}
