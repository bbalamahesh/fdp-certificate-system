import type { CertificateContent } from './types'
import { renderCertificate } from './renderCertificate'
import { getCertificateConfigForOrg } from './getCertificateConfig'
import { getCertificateContentForEvent } from './getCertificateContent'

interface GenerateArgs {
    recipientName: string
    certificateId: string
    issuedAt: string
    eventId: string
}

export async function generateFinalCertificate({
    recipientName,
    certificateId,
    issuedAt,
    eventId,
}: GenerateArgs): Promise<{
    pdfBuffer: Buffer
    content: CertificateContent
}> {
    const layout = await getCertificateConfigForOrg()
    const content = await getCertificateContentForEvent(eventId)

    const doc = renderCertificate({
        recipientName,
        certificateId,
        issuedAt,
        layout,
        content,
    })

    const chunks: Buffer[] = []

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        doc.on('data', (chunk) => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', reject)
        doc.end()
    })

    return { pdfBuffer, content }
}
