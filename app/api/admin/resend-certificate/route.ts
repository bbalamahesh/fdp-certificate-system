import { NextResponse } from 'next/server'
import { getRegistrationByCertificateId } from '@/lib/googleSheets'
import { renderCertificate } from '@/lib/certificates/renderCertificate'
import { getCertificateConfigForOrg } from '@/lib/certificates/getCertificateConfig'
import { getCertificateContentForEvent } from '@/lib/certificates/getCertificateContent'
import { sendCertificateEmail } from '@/lib/email/sendCertificateEmail'

export async function POST(req: Request) {
    try {
        const { certificate_id } = await req.json()

        if (!certificate_id) {
            return NextResponse.json(
                { error: 'certificate_id is required' },
                { status: 400 }
            )
        }

        const registration =
            await getRegistrationByCertificateId(certificate_id)

        if (!registration) {
            return NextResponse.json(
                { error: 'Certificate not found' },
                { status: 404 }
            )
        }

        // Event-level data (same as generation)
        const layout = await getCertificateConfigForOrg()
        const content = await getCertificateContentForEvent('default-event')

        // Generate PDF again (read-only, no writes)
        const pdfDoc = renderCertificate({
            recipientName: registration.name,
            certificateId: certificate_id,
            issuedAt: new Date().toLocaleDateString(),
            layout,
            content,
        })

        const chunks: Buffer[] = []

        await new Promise<void>((resolve) => {
            pdfDoc.on('data', (c) => chunks.push(c))
            pdfDoc.on('end', resolve)
            pdfDoc.end()
        })

        const pdfBuffer = Buffer.concat(chunks)

        // ✅ NOW matches SendCertificateEmailArgs exactly
        await sendCertificateEmail({
            to: registration.email,
            recipientName: registration.name,
            programName: content.programName,     // ← from certificate content
            institution: content.institution,     // ← from certificate content
            pdfBuffer,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('RESEND CERTIFICATE ERROR:', error)

        return NextResponse.json(
            { error: 'Failed to resend certificate' },
            { status: 500 }
        )
    }
}
