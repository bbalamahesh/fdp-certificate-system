import { NextResponse } from 'next/server'
import { getCertificateSettings } from '@/lib/certificateSettings'
import { generateCertificate } from '@/lib/pdfGenerator-dynamic'
import { sendCertificateEmail } from '@/lib/emailService'
import { getRegistrationByEmail } from '@/lib/googleSheets'

export async function POST(req: Request) {
    try {
        const { email } = await req.json()

        if (!email) {
            return NextResponse.json(
                { message: 'Email is required' },
                { status: 400 }
            )
        }

        // 1️⃣ Fetch participant from Google Sheets
        const registration = await getRegistrationByEmail(email)

        if (!registration) {
            return NextResponse.json(
                { message: 'Registration not found' },
                { status: 404 }
            )
        }

        // 2️⃣ Load latest settings
        const settings = await getCertificateSettings()

        // 3️⃣ Generate certificate again
        const pdfBuffer = await generateCertificate({
            name: registration.name,
            ...settings,
            title: '',
            certificate_id: ''
        })

        // 4️⃣ Resend email
        await sendCertificateEmail({
            recipientEmail: registration.email,
            recipientName: registration.name,
            certificatePdf: pdfBuffer,
            settings,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Resend failed:', error)
        return NextResponse.json(
            { message: 'Failed to resend certificate' },
            { status: 500 }
        )
    }
}
