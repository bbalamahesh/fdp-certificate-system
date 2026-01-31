import { NextResponse } from 'next/server'
import { registrationSchema } from '@/components/registration/schema'
import addRegistrationToSheet from '@/lib/googleSheets'
import { generateCertificate } from '@/lib/pdfGenerator-dynamic'
import { sendCertificateEmail } from '@/lib/emailService'
import { getCertificateSettings } from '@/lib/certificateSettings'

const settings = await getCertificateSettings()
export async function POST(req: Request) {
  try {
    // 1️⃣ Parse request body
    const body = await req.json()

    // 2️⃣ Validate using Zod
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

    // 3️⃣ Save to Google Sheets
    await addRegistrationToSheet(data)

    // 4️⃣ Generate certificate PDF
const pdfBuffer = await generateCertificate(data)

// 5️⃣ Send email (non-blocking)
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


    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Registration error:', error)

    return NextResponse.json(
      { message: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}
