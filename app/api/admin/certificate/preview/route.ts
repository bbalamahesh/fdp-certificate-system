import { NextResponse } from 'next/server'
import { renderCertificate } from '@/lib/certificates/renderCertificate'
import { getCertificateConfigForOrg } from '@/lib/certificates/getCertificateConfig'
import { getCertificateContentForEvent } from '@/lib/certificates/getCertificateContentForEvent'
import { getRegistrationByCertificateId } from '@/lib/googleSheets'
import QRCode from 'qrcode'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)

        const eventId = searchParams.get('eventId')
        const certificate_id = searchParams.get('certificate_id')
        const download = searchParams.get('download') === '1'

        const configEventId = eventId || 'default-event'
        const layout = await getCertificateConfigForOrg(configEventId)

        let content
        let certificateData: {
            recipientName: string
            certificateId: string
            issuedAt: string
            verificationUrl: string
        }

        /* ---------------- ISSUED CERTIFICATE PREVIEW ---------------- */
        if (certificate_id) {
            const registration =
                await getRegistrationByCertificateId(certificate_id)

            if (!registration) {
                return NextResponse.json(
                    { error: 'Certificate not found' },
                    { status: 404 }
                )
            }

            content = await getCertificateContentForEvent(configEventId)

            const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify/PREVIEW-${certificate_id}`

            certificateData = {
                recipientName: registration.name,
                certificateId: registration.certificate_id,
                issuedAt:
                    registration.certificate_issued_at ||
                    new Date().toLocaleDateString(),
                verificationUrl,
            }
        }

        /* ---------------- LIVE EVENT PREVIEW ---------------- */
        else if (eventId) {
            content = await getCertificateContentForEvent(eventId)

            const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify/PREVIEW-0001`

            certificateData = {
                recipientName: 'Test Participant',
                certificateId: 'CERT-PREVIEW-0001',
                issuedAt: new Date().toLocaleDateString(),
                verificationUrl,
            }
        }

        else {
            return NextResponse.json(
                { error: 'Missing eventId or certificate_id' },
                { status: 400 }
            )
        }

        /* ---------------- GENERATE QR FOR PREVIEW ---------------- */
        const qrCodeDataUrl = await QRCode.toDataURL(
            certificateData.verificationUrl
        )

        /* ---------------- RENDER PDF ---------------- */
        const doc = renderCertificate({
            recipientName: certificateData.recipientName,
            certificateId: certificateData.certificateId,
            issuedAt: certificateData.issuedAt,
            layout,
            content,
            qrCode: qrCodeDataUrl,
        })

        const chunks: Buffer[] = []

        return new Promise<Response>((resolve) => {
            doc.on('data', (chunk) => chunks.push(chunk))
            doc.on('end', () => {
                resolve(
                    new NextResponse(Buffer.concat(chunks), {
                        headers: {
                            'Content-Type': 'application/pdf',
                            'Content-Disposition': download
                                ? `attachment; filename="${certificateData.certificateId}.pdf"`
                                : 'inline; filename="certificate-preview.pdf"',
                        },
                    })
                )
            })
            doc.end()
        })
    } catch (error) {
        console.error('CERTIFICATE PREVIEW ERROR:', error)

        return NextResponse.json(
            {
                error: 'Failed to generate preview',
                message:
                    error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}
