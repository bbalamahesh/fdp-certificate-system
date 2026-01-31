import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function GET() {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A:G', // 👈 include Certificate ID
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, registrations: [] });
    }

    const registrations = rows.slice(1).map((row, index) => ({
      id: index + 1,
      timestamp: row[0] || '',
      title: row[1] || '',
      name: row[2] || '',
      email: row[3] || '',
      phone: row[4] || '',
      organization: row[5] || '',
      certificateId: row[6] || '', // ✅ added
    }));

    return NextResponse.json({ success: true, registrations });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
}
