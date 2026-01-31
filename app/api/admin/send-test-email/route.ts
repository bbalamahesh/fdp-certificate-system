import { NextResponse } from 'next/server'
import { getCertificateSettings } from '@/lib/certificateSettings'
import { generateCertificate } from '@/lib/pdfGenerator-dynamic'
import { sendCertificateEmail } from '@/lib/emailService'

export async function POST() {
  try {
    const settings = await getCertificateSettings()

    const dummyUser = {
      name: 'Test Participant',
      email: process.env.GMAIL_USER!, // 👈 admin Gmail only
    }

    const pdfBuffer = await generateCertificate({
        name: dummyUser.name,
        ...settings,
        title: ''
    })

    await sendCertificateEmail({
      recipientEmail: dummyUser.email,
      recipientName: dummyUser.name,
      certificatePdf: pdfBuffer,
      settings,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Test email failed:', error)
    return NextResponse.json(
      { message: 'Failed to send test email' },
      { status: 500 }
    )
  }
}
