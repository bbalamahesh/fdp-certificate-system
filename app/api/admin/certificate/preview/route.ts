import { NextResponse } from 'next/server'
import { renderCertificate } from '@/lib/certificates/renderCertificate'
import { getCertificateConfigForOrg } from '@/lib/certificates/getCertificateConfig'
import { getCertificateContentForEvent } from '@/lib/certificates/getCertificateContent'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const eventId = searchParams.get('eventId') || 'default-event'

        const layout = await getCertificateConfigForOrg()
        const content = await getCertificateContentForEvent(eventId)

        const doc = renderCertificate({
            recipientName: 'Test Participant',
            certificateId: 'CERT-PREVIEW-0001',
            issuedAt: new Date().toLocaleDateString(),
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
