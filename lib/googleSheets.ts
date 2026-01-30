import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function saveToGoogleSheets(data: {
  title: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
}) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  try {
    // Prepare the row data
    const values = [
      [
        new Date().toISOString(),
        data.title,
        data.name,
        data.email,
        data.phone,
        data.organization,
      ],
    ];

    // Append data to the sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:F', // Adjust range as needed
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    throw error;
  }
}

export async function initializeSheet() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  try {
    // Check if headers exist
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A1:F1',
    });

    // If no headers, add them
    if (!response.data.values || response.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Sheet1!A1:F1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['Timestamp', 'Title', 'Name', 'Email', 'Phone', 'Organization']],
        },
      });
    }
  } catch (error) {
    console.error('Error initializing sheet:', error);
    // If sheet doesn't exist, this will fail, but that's okay
  }
}
