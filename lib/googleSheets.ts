import { google } from 'googleapis'

/* -------------------- AUTH -------------------- */
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!

/**
 * IMPORTANT:
 * We standardize on ONE sheet name.
 * Rename your Google Sheet tab to: "Registrations"
 */
const SHEET_NAME = 'Registrations'
const RANGE = `${SHEET_NAME}!A:Z`

/* -------------------- ADD REGISTRATION -------------------- */
export default async function addRegistrationToSheet(data: {
  title: string
  name: string
  email: string
  phone: string
  organization: string
  certificate_id: string
}) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        new Date().toISOString(), // Timestamp (A)
        data.title,              // Title (B)
        data.name,               // Name (C)
        data.email,              // Email (D)
        data.phone,              // Phone (E)
        data.organization,       // Organization (F)
        data.certificate_id,     // Certificate ID (G)
      ]],
    },
  })
}

/* -------------------- INITIALIZE SHEET -------------------- */
export async function initializeSheet() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:G1`,
    })

    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:G1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            'Timestamp',
            'Title',
            'Name',
            'Email',
            'Phone',
            'Organization',
            'Certificate ID',
          ]],
        },
      })
    }
  } catch {
    // Safe to ignore if sheet already exists
  }
}

/* -------------------- GET REGISTRATION BY EMAIL -------------------- */
export async function getRegistrationByEmail(email: string) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  })

  const rows = res.data.values || []
  const [, ...dataRows] = rows

  const match = dataRows.find((row) => row[3] === email)

  if (!match) return null

  return {
    timestamp: match[0],
    title: match[1],
    name: match[2],
    email: match[3],
    phone: match[4],
    organization: match[5],
    certificate_id: match[6],
  }
}

/* -------------------- GET ALL REGISTRATIONS (ADMIN TABLE) -------------------- */
export async function getAllRegistrations() {
  console.log('👉 getAllRegistrations CALLED')

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  })

  const rows = res.data.values
  console.log('👉 RAW ROWS COUNT:', rows?.length)
  console.log('👉 HEADERS:', rows?.[0])
  console.log('👉 FIRST DATA ROW:', rows?.[1])

  if (!rows || rows.length < 2) return []

  const headers = rows[0]
  const idx = (name: string) => headers.indexOf(name)

  const mapped = rows.slice(1).map((row, index) => ({
    id: index + 1,
    timestamp: row[idx('Timestamp')] ?? '',
    title: row[idx('Title')] ?? '',
    name: row[idx('Name')] ?? '',
    email: row[idx('Email')] ?? '',
    phone: row[idx('Phone')] ?? '',
    organization: row[idx('Organization')] ?? '',
    certificate_id: row[idx('Certificate ID')] ?? '',
    certificate_issued_at: row[idx('certificateIssuedAt')] ?? '',
  }))

  console.log('👉 MAPPED COUNT:', mapped.length)
  console.log('👉 FIRST MAPPED ROW:', mapped[0])

  return mapped
}



/* -------------------- DELETE REGISTRATION BY EMAIL -------------------- */
export async function deleteRegistrationByEmail(email: string) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  })

  const rows = res.data.values || []
  const [, ...dataRows] = rows

  const rowIndex = dataRows.findIndex((row) => row[3] === email)
  if (rowIndex === -1) return

  // Header row + 1-based index
  const sheetRowNumber = rowIndex + 2

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 0, // usually 0 if first sheet
              dimension: 'ROWS',
              startIndex: sheetRowNumber - 1,
              endIndex: sheetRowNumber,
            },
          },
        },
      ],
    },
  })
}


export async function getRegistrationByCertificateId(certificateId: string) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID!,
    range: 'Registrations!A:Z',
  })

  const rows = res.data.values
  if (!rows || rows.length < 2) return null

  const headers = rows[0].map((h) => h.trim().toLowerCase())

  const idx = (name: string) => headers.indexOf(name)

  const certIndex = idx('certificate_id')
  if (certIndex === -1) return null

  const match = rows.slice(1).find(
    (row) => row[certIndex]?.trim() === certificateId.trim()
  )

  if (!match) return null

  return {
    name: match[idx('name')] || '',
    title: match[idx('title')] || '',
    email: match[idx('email')] || '',
    organization: match[idx('organization')] || '',
    certificate_id: match[certIndex],
    issued_at: match[idx('certificate_issued_at')] || '',
  }
}

