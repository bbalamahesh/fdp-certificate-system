import { NextRequest, NextResponse } from 'next/server';
import {
  getCertificateSettings,
  saveCertificateSettings,
  initializeSettingsSheet,
} from '@/lib/certificateSettings';

export async function GET() {
  try {
    await initializeSettingsSheet();
    const settings = await getCertificateSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await saveCertificateSettings(body);
    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
