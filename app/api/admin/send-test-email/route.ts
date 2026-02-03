import { NextResponse } from 'next/server'
import { generateFinalCertificate } from '@/lib/certificates/generateFinalCertificate'
import { sendCertificateEmail } from '@/lib/email/sendCertificateEmail'

export async function POST(req: Request) {
  try {
    const { email, name, certificateId } = await req.json()

    const eventId = 'default-event'

    const { pdfBuffer, content } = await generateFinalCertificate({
      recipientName: name,
      certificateId,
      issuedAt: new Date().toLocaleDateString(),
      eventId: 'default-event',
    })

    await sendCertificateEmail({
      to: email,
      recipientName: name,
      programName: content.programName,
      institution: content.institution,
      pdfBuffer,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('TEST EMAIL ERROR:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}
