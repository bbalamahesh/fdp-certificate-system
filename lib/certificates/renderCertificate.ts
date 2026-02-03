import PDFDocument from 'pdfkit'
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
    const doc = new PDFDocument({
        size: layout.orientation === 'landscape' ? 'A4' : 'A4',
        layout: layout.orientation,
        margin: 50,
    })

    /* -------------------- HEADER -------------------- */
    doc
        .fontSize(26)
        .font('Times-Bold')
        .text(layout.title, { align: 'center' })
        .moveDown(1)

    doc
        .fontSize(16)
        .font('Times-Italic')
        .text(`(${layout.eventType})`, { align: 'center' })
        .moveDown(2)

    /* -------------------- BODY -------------------- */
    doc.fontSize(14).font('Times-Roman')

    doc.text(
        `This is to certify that ${recipientName} has successfully participated in the program titled`,
        { align: 'center' }
    )

    doc
        .moveDown(0.8)
        .font('Times-Bold')
        .fontSize(16)
        .text(content.programName, { align: 'center' })
        .moveDown(1)

    doc.font('Times-Roman').fontSize(14)

    doc.text(
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

    doc.text(`Issued on: ${issuedAt}`, { align: 'left' })
    doc.text(`Certificate ID: ${certificateId}`, { align: 'right' })

    /* -------------------- SIGNATURES -------------------- */
    if (layout.signatureCount > 0) {
        doc.moveDown(3)
        doc.text(
            layout.signatureCount === 2
                ? 'Coordinator Head of Department'
                : 'Coordinator',
            { align: 'center' }
        )
    }

    return doc
}
