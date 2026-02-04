import PDFDocument from 'pdfkit'
import path from 'path'
import type { CertificateContent } from './types'

export interface CertificateConfig {
    title: string
    eventType: string
    orientation: 'landscape' | 'portrait'
    signatureCount: 0 | 1 | 2
    watermarkEnabled: boolean
}

interface RenderArgs {
    recipientName: string
    certificateId: string
    issuedAt: string
    layout: CertificateConfig
    content: CertificateContent
}

export function renderCertificate({
    recipientName,
    certificateId,
    issuedAt,
    layout,
    content,
}: RenderArgs) {
    const fontsDir = path.join(process.cwd(), 'public/fonts')

    // ✅ IMPORTANT: provide font at construction time
    const doc = new PDFDocument({
        size: 'A4',
        layout: layout.orientation,
        margin: 50,
        font: path.join(fontsDir, 'Roboto-Regular.ttf'),
    })

    /* -------------------- FONTS -------------------- */
    doc.registerFont('regular', path.join(fontsDir, 'Roboto-Regular.ttf'))
    doc.registerFont('bold', path.join(fontsDir, 'Roboto-Bold.ttf'))
    doc.registerFont('italic', path.join(fontsDir, 'Roboto-Italic.ttf'))

    // 🚨 MUST set default font immediately
    doc.font('regular')

    /* -------------------- HEADER -------------------- */
    doc
        .font('bold')
        .fontSize(26)
        .text(layout.title, { align: 'center' })
        .moveDown(1)

    doc
        .font('italic')
        .fontSize(16)
        .text(`(${layout.eventType})`, { align: 'center' })
        .moveDown(2)

    /* -------------------- BODY -------------------- */
    doc
        .font('regular')
        .fontSize(14)
        .text(
            `This is to certify that ${recipientName} has successfully participated in the program titled`,
            { align: 'center' }
        )

    doc
        .moveDown(0.8)
        .font('bold')
        .fontSize(16)
        .text(content.programName, { align: 'center' })
        .moveDown(1)

    doc
        .font('regular')
        .fontSize(14)
        .text(
            `conducted by the ${content.department}, ${content.faculty}, ${content.institution}`,
            { align: 'center' }
        )

    doc
        .moveDown(0.5)
        .text(
            `from ${content.programDates} at ${content.location}.`,
            { align: 'center' }
        )

    /* -------------------- FOOTER -------------------- */
    doc.moveDown(3)

    doc
        .font('regular')
        .fontSize(10)
        .text(`Issued on: ${issuedAt}`, { align: 'left' })

    doc
        .font('regular')
        .fontSize(10)
        .text(`Certificate ID: ${certificateId}`, { align: 'right' })

    /* -------------------- SIGNATURES -------------------- */
    if (layout.signatureCount > 0) {
        doc.moveDown(3)
        doc
            .font('bold')
            .fontSize(12)
            .text(
                layout.signatureCount === 2
                    ? 'Coordinator • Head of Department'
                    : 'Coordinator',
                { align: 'center' }
            )
    }

    return doc
}
