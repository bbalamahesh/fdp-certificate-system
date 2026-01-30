import { google } from "googleapis";

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

export async function saveToGoogleSheets(data: {
  title: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
}) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Sheet1!A:F",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        new Date().toISOString(),
        data.title,
        data.name,
        data.email,
        data.phone,
        data.organization,
      ]],
    },
  });
}

export async function initializeSheet() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A1:F1",
    });

    if (!res.data.values) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Sheet1!A1:F1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["Timestamp", "Title", "Name", "Email", "Phone", "Organization"]],
        },
      });
    }
  } catch {
    // Safe to ignore if sheet exists
  }
}
