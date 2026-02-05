import { NextResponse } from 'next/server'
import { renderCertificate } from '@/lib/certificates/renderCertificate'
import { getCertificateConfigForOrg } from '@/lib/certificates/getCertificateConfig'
import { getCertificateContentForEvent } from '@/lib/certificates/getCertificateContent'
import { getRegistrationByCertificateId } from '@/lib/googleSheets'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const eventId = searchParams.get('eventId')
        const certificate_id = searchParams.get('certificate_id')

        const layout = await getCertificateConfigForOrg()

        let content
        let certificateData: {
            recipientName: string
            certificateId: string
            issuedAt: string
        }

        /**
         * ✅ Issued certificate preview (row-specific)
         */
        if (certificate_id) {
            const registration =
                await getRegistrationByCertificateId(certificate_id)

            if (!registration) {
                return NextResponse.json(
                    { error: 'Certificate not found' },
                    { status: 404 }
                )
            }

            // 🔑 single-event system → reuse default event
            content = await getCertificateContentForEvent('default-event')

            certificateData = {
                recipientName: registration.name,
                certificateId: registration.certificate_id,
                issuedAt: new Date().toLocaleDateString(),
            }
        }

        /**
         * ✅ Live preview (event-level)
         */
        else if (eventId) {
            content = await getCertificateContentForEvent(eventId)

            certificateData = {
                recipientName: 'Test Participant',
                certificateId: 'CERT-PREVIEW-0001',
                issuedAt: new Date().toLocaleDateString(),
            }
        }

        /**
         * ❌ Invalid request
         */
        else {
            return NextResponse.json(
                { error: 'Missing eventId or certificate_id' },
                { status: 400 }
            )
        }

        const doc = renderCertificate({
            recipientName: certificateData.recipientName,
            certificateId: certificateData.certificateId,
            issuedAt: certificateData.issuedAt,
            layout,
            content,
        })

        const chunks: Buffer[] = []

        return new Promise<Response>((resolve) => {
            doc.on('data', (chunk) => chunks.push(chunk))
            doc.on('end', () => {
                resolve(
                    new NextResponse(Buffer.concat(chunks), {
                        headers: {
                            'Content-Type': 'application/pdf',
                            'Content-Disposition':
                                'inline; filename="certificate-preview.pdf"',
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
