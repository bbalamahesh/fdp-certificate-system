import { NextResponse } from 'next/server'
import { getCertificateSettings } from '@/lib/certificateSettings'
import { buildCertificateEmailTemplate } from '@/lib/emailTemplates/certificateEmail'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const name = searchParams.get('name') || 'Test Participant'

    const settings = await getCertificateSettings()

    const html = buildCertificateEmailTemplate({
      recipientName: name,
      settings,
    })

    return NextResponse.json({ html })
  } catch (error) {
    console.error('Email preview error:', error)
    return NextResponse.json(
      { message: 'Failed to generate preview' },
      { status: 500 }
    )
  }
}
