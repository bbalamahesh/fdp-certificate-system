import { NextResponse } from 'next/server'
import { registrationSchema } from '@/components/registration/schema'
import addRegistrationToSheet from '@/lib/googleSheets'
import { generateCertificate } from '@/lib/pdfGenerator-dynamic'
import { sendCertificateEmail } from '@/lib/emailService'
import { getCertificateSettings } from '@/lib/certificateSettings'
import { generateCertificateId } from '@/lib/utils'

export async function POST(req: Request) {
  try {
    // 1️⃣ Parse request body
    const body = await req.json()

    // 2️⃣ Validate
    const parsed = registrationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          type: 'validation',
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const data = parsed.data

    // 3️⃣ Generate certificate ID
    const certificateId = generateCertificateId()

    // 4️⃣ Load settings ONCE
    const settings = await getCertificateSettings()

    // 5️⃣ Save to Google Sheets
    await addRegistrationToSheet({
      ...data,
      certificate_id: certificateId,
    })

    // 6️⃣ Generate PDF
    const pdfBuffer = await generateCertificate({
      title: data.title,
      name: data.name,
      certificate_id: certificateId,
    })

    // 7️⃣ Send email (object-based call)
    try {
      await sendCertificateEmail({
        recipientEmail: data.email,
        recipientName: data.name,
        certificatePdf: pdfBuffer,
        settings,
      })
    } catch (err) {
      console.error('Email failed:', err)
    }

    return NextResponse.json({
      success: true,
      certificate_id: certificateId,
    })
  } catch (error) {
    console.error('Registration error:', error)

    return NextResponse.json(
      { message: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}
