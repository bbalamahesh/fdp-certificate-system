import { NextRequest, NextResponse } from 'next/server';
import { saveToGoogleSheets, initializeSheet } from '@/lib/googleSheets';
import { generateCertificate } from '@/lib/pdfGenerator';
import { sendCertificateEmail } from '@/lib/emailService';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, name, email, phone, organization } = body;

    // Validate required fields
    if (!title || !name || !email || !phone || !organization) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Step 1: Save to Google Sheets
    console.log('Saving to Google Sheets...');
    await initializeSheet();
    await saveToGoogleSheets({ title, name, email, phone, organization });
    console.log('Data saved to Google Sheets');

    // Step 2: Generate PDF Certificate
    console.log('Generating certificate...');
    const certificatePdf = await generateCertificate({ title, name });
    console.log('Certificate generated');

    // Step 3: Send email with certificate
    console.log('Sending email...');
    await sendCertificateEmail(email, name, certificatePdf);
    console.log('Email sent successfully');

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful! Certificate sent to your email.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to process registration. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
