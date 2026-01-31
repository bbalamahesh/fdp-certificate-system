import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export interface CertificateSettings {
  program_name: string;
  program_dates: string;
  department: string;
  faculty: string;
  institution: string;
  location: string;
  coordinator_name: string;
  hod_name: string;
  border_color: string;
  title_color: string;
  background_color: string;
}

const DEFAULT_SETTINGS: CertificateSettings = {
  program_name: 'MASTERING DATA ANALYSIS USING R STUDIO',
  program_dates: '25-03-2025 and 26-03-2025',
  department: 'Department of Business Administration',
  faculty: 'Faculty of Management',
  institution: 'SRM Institute Of Science And Technology',
  location: 'Ramapuram, Chennai',
  coordinator_name: '',
  hod_name: '',
  border_color: '#DAA520',
  title_color: '#1e3a8a',
  background_color: '#ffffff',
};

export async function getCertificateSettings(): Promise<CertificateSettings> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Settings!A:B',
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return DEFAULT_SETTINGS;
    }

    const settings: any = {};
    rows.forEach((row) => {
      if (row[0] && row[1]) {
        settings[row[0]] = row[1];
      }
    });

    return { ...DEFAULT_SETTINGS, ...settings };
  } catch (error) {
    console.error('Error getting certificate settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveCertificateSettings(
  settings: Partial<CertificateSettings>
): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  try {
    const currentSettings = await getCertificateSettings();
    const updatedSettings = { ...currentSettings, ...settings };

    const values = Object.entries(updatedSettings).map(([key, value]) => [
      key,
      value,
    ]);

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Settings!A:B',
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Settings!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });
  } catch (error) {
    console.error('Error saving certificate settings:', error);
    throw error;
  }
}

export async function initializeSettingsSheet(): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const settingsSheet = response.data.sheets?.find(
      (sheet) => sheet.properties?.title === 'Settings'
    );

    if (!settingsSheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'Settings',
                },
              },
            },
          ],
        },
      });

      await saveCertificateSettings(DEFAULT_SETTINGS);
    }
  } catch (error) {
    console.error('Error initializing settings sheet:', error);
  }
}
