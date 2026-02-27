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
  verification_code: string
  verification_url: string
  certificate_status: string
}) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        new Date().toISOString(),   // A timestamp
        data.title,                 // B
        data.name,                  // C
        data.email,                 // D
        data.phone,                 // E
        data.organization,          // F
        data.certificate_id,        // G
        new Date().toISOString(),   // H certificate_issued_at
        data.verification_code,     // I
        data.verification_url,      // J
        data.certificate_status,    // K
      ]],
    },
  })
}
export async function getRegistrationByVerificationCode(code: string) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  })

  const rows = res.data.values
  if (!rows || rows.length < 2) return null

  const headers = rows[0].map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, '_')
  )

  const idx = (name: string) => headers.indexOf(name)

  const verificationIdx = idx('verification_code')
  if (verificationIdx === -1) {
    console.error('verification_code column not found', headers)
    return null
  }

  const match = rows.slice(1).find(
    (row) => row[verificationIdx]?.trim() === code.trim()
  )

  if (!match) return null

  return {
    name: match[idx('name')] ?? '',
    title: match[idx('title')] ?? '',
    email: match[idx('email')] ?? '',
    organization: match[idx('organization')] ?? '',
    certificate_id: match[idx('certificate_id')] ?? '',
    certificate_issued_at: match[idx('certificate_issued_at')] ?? '',
    certificate_status: match[idx('certificate_status')] ?? '',
  }
}
/* -------------------- INITIALIZE SHEET -------------------- */
export async function initializeSheet() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:K1`,
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
            'Certificate_issued_at',
            'Verification_code',
            'Verification_URL',
            'Certificate_status',
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
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  })

  const rows = res.data.values
  if (!rows || rows.length < 2) return []

  // normalize headers
  const headers = rows[0].map((h) => h.trim().toLowerCase())
  const idx = (name: string) => headers.indexOf(name)

  return rows.slice(1).map((row, index) => ({
    id: index + 1,
    timestamp: row[idx('timestamp')] ?? '',
    title: row[idx('title')] ?? '',
    name: row[idx('name')] ?? '',
    email: row[idx('email')] ?? '',
    phone: row[idx('phone')] ?? '',
    organization: row[idx('organization')] ?? '',
    certificate_id: row[idx('certificate id')] ?? '',
    certificate_issued_at: row[idx('certificate_issued_at')] ?? '',
  }))
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
    spreadsheetId: SPREADSHEET_ID,
    range: 'Registrations!A:Z',
  })

  const rows = res.data.values
  if (!rows || rows.length < 2) return null

  // normalize headers
  const headers = rows[0].map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, '_')
  )

  const idx = (name: string) => headers.indexOf(name)

  const certIdx = idx('certificate_id')
  if (certIdx === -1) {
    console.error('certificate_id column not found', headers)
    return null
  }

  const match = rows.slice(1).find(
    (row) => row[certIdx]?.trim() === certificateId.trim()
  )

  if (!match) return null

  return {
    name: match[idx('name')] ?? '',
    title: match[idx('title')] ?? '',
    email: match[idx('email')] ?? '',
    organization: match[idx('organization')] ?? '',
    certificate_id: match[certIdx],
    certificate_issued_at:
      match[idx('certificate_issued_at')] ?? '',
  }
}
