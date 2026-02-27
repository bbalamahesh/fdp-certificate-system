import PDFDocument from 'pdfkit'
import path from 'path'
import type { CertificateContent } from './types'

export interface CertificateConfig {
    title: string
    eventType: string
    subtitle1?: string
    subtitle2?: string
    orientation: 'landscape' | 'portrait'
    signatureCount: 0 | 1 | 2
    watermarkEnabled: boolean
    showQrCode: boolean
    logoPosition?: 'left' | 'right'
    backgroundTemplate?: string
    customBackgroundUrl?: string
    textStyles?: Record<
        string,
        {
            fontSize?: number
            color?: string
        }
    >
}

interface RenderArgs {
    recipientName: string
    certificateId: string
    issuedAt: string
    layout: CertificateConfig
    content: CertificateContent
    qrCode?: string
}

function fitFontSize({
    doc,
    text,
    font,
    maxSize,
    minSize,
    maxWidth,
}: {
    doc: PDFKit.PDFDocument
    text: string
    font: 'regular' | 'bold' | 'italic'
    maxSize: number
    minSize: number
    maxWidth: number
}) {
    let size = maxSize
    while (size > minSize) {
        doc.font(font).fontSize(size)
        if (doc.widthOfString(text) <= maxWidth) break
        size -= 1
    }
    return size
}

function styleFor(layout: CertificateConfig, key: string) {
    return layout.textStyles?.[key] || {}
}

function applyTextStyle(
    doc: PDFKit.PDFDocument,
    layout: CertificateConfig,
    key: string
) {
    const s = styleFor(layout, key)
    if (s.color) doc.fillColor(s.color)
    else doc.fillColor('black')
    if (s.fontSize) doc.fontSize(s.fontSize)
}

function resolveImageSource(value?: string) {
    if (!value) return ''
    if (value.startsWith('/')) {
        return path.join(process.cwd(), 'public', value.replace(/^\//, ''))
    }
    return value
}

const BACKGROUND_TEMPLATES: Record<string, string> = {
    none: '',
    classic: '/certificate-templates/template-classic.png',
    blue: '/certificate-templates/template-blue.png',
    minimal: '/certificate-templates/template-minimal.png',
}

export function renderCertificate({
    recipientName,
    certificateId,
    issuedAt,
    layout,
    content,
    qrCode,
}: RenderArgs) {
    const fontsDir = path.join(process.cwd(), 'public/fonts')

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

    doc.font('regular')

    const templateSrc = BACKGROUND_TEMPLATES[layout.backgroundTemplate || 'none']
    const backgroundSrc = resolveImageSource(
        layout.backgroundTemplate === 'custom'
            ? layout.customBackgroundUrl
            : templateSrc
    )

    if (backgroundSrc) {
        try {
            doc.image(backgroundSrc, 0, 0, {
                width: doc.page.width,
                height: doc.page.height,
            })
        } catch (error) {
            console.warn('Background render failed:', error)
        }
    }

    /* -------------------- HEADER -------------------- */
    const contentX = 60
    const contentWidth = doc.page.width - 120
    const safeTextWidth = contentWidth - 24
    const orgParts = [
        content.department,
        content.faculty,
        content.institution,
    ].filter(Boolean)
    const orgLine =
        orgParts.length > 0
            ? `conducted by ${orgParts.join(', ')}`
            : ''
    const placeLine = [content.location, content.address]
        .filter(Boolean)
        .join(', ')
    const dateLine = content.programDates
        ? `from ${content.programDates}${placeLine ? ` at ${placeLine}` : ''}.`
        : placeLine
            ? `held at ${placeLine}.`
            : ''
    const footerLine =
        content.footerText ||
        [content.coordinatorName, content.hodName]
            .filter(Boolean)
            .join(' • ')

    const titleSize = fitFontSize({
        doc,
        text: layout.title,
        font: 'bold',
        maxSize: 26,
        minSize: 20,
        maxWidth: safeTextWidth,
    })

    const eventTypeSize = fitFontSize({
        doc,
        text: `(${layout.eventType})`,
        font: 'italic',
        maxSize: 16,
        minSize: 12,
        maxWidth: safeTextWidth,
    })

    const nameSize = fitFontSize({
        doc,
        text: recipientName,
        font: 'bold',
        maxSize: 24,
        minSize: 14,
        maxWidth: safeTextWidth,
    })

    const programSize = fitFontSize({
        doc,
        text: content.programName,
        font: 'bold',
        maxSize: 16,
        minSize: 12,
        maxWidth: safeTextWidth,
    })

    const orgSize = fitFontSize({
        doc,
        text: orgLine || ' ',
        font: 'regular',
        maxSize: 14,
        minSize: 11,
        maxWidth: safeTextWidth,
    })

    const dateSize = fitFontSize({
        doc,
        text: dateLine || ' ',
        font: 'regular',
        maxSize: 14,
        minSize: 11,
        maxWidth: safeTextWidth,
    })

    const logoSource = resolveImageSource(content.logoDataUrl)
    if (logoSource) {
        try {
            const logoWidth = 78
            const logoHeight = 78
            const logoX =
                layout.logoPosition === 'right'
                    ? doc.page.width - logoWidth - 70
                    : 70
            const logoY = 22
            doc.image(logoSource, logoX, logoY, {
                fit: [logoWidth, logoHeight],
                align: layout.logoPosition === 'right' ? 'right' : 'center',
                valign: 'center',
            })
        } catch (error) {
            console.warn('Logo render failed:', error)
        }
    }

    doc.font('bold').fontSize(titleSize)
    applyTextStyle(doc, layout, 'title')
    doc.text(layout.title, contentX, doc.y, { width: contentWidth, align: 'center' })
        .moveDown(0.5)

    if (layout.subtitle1) {
        doc.font('regular').fontSize(14)
        applyTextStyle(doc, layout, 'subtitle1')
        doc.text(layout.subtitle1, contentX, doc.y, {
            width: contentWidth,
            align: 'center',
        }).moveDown(0.2)
    }

    if (layout.subtitle2) {
        doc.font('regular').fontSize(12)
        applyTextStyle(doc, layout, 'subtitle2')
        doc.text(layout.subtitle2, contentX, doc.y, {
            width: contentWidth,
            align: 'center',
        }).moveDown(0.2)
    }

    if (layout.eventType?.trim()) {
        doc.font('italic').fontSize(eventTypeSize)
        applyTextStyle(doc, layout, 'eventType')
        doc.text(`(${layout.eventType})`, contentX, doc.y, {
            width: contentWidth,
            align: 'center',
        })
            .moveDown(1.2)
    } else {
        doc.moveDown(1.2)
    }

    /* -------------------- BODY -------------------- */
    doc.font('regular').fontSize(13)
    applyTextStyle(doc, layout, 'body')
    doc.text('This is to certify that', contentX, doc.y, { width: contentWidth, align: 'center' })

    doc
        .moveDown(0.2)
        .font('bold')
        .fontSize(nameSize)
    applyTextStyle(doc, layout, 'recipientName')
    doc
        .text(recipientName, contentX, doc.y, {
            width: contentWidth,
            align: 'center',
        })

    doc
        .moveDown(0.35)
        .font('regular')
        .fontSize(13)
    applyTextStyle(doc, layout, 'body')
    doc
        .text('has successfully participated in the program titled', contentX, doc.y, {
            width: contentWidth,
            align: 'center',
        })

    doc
        .moveDown(0.45)
        .font('bold')
        .fontSize(programSize)
    applyTextStyle(doc, layout, 'programName')
    doc
        .text(content.programName, contentX, doc.y, {
            width: contentWidth,
            align: 'center',
        })
        .moveDown(0.75)

    if (orgLine) {
        doc
            .font('regular')
            .fontSize(orgSize)
        applyTextStyle(doc, layout, 'orgLine')
        doc
            .text(orgLine, contentX, doc.y, { width: contentWidth, align: 'center' })
    }

    if (dateLine) {
        doc
            .moveDown(0.5)
            .font('regular')
            .fontSize(dateSize)
        applyTextStyle(doc, layout, 'dateLine')
        doc
            .text(dateLine, contentX, doc.y, { width: contentWidth, align: 'center' })
    }

    doc.text('', { continued: false })

    /* =======================================================
       FROM HERE → NO MORE moveDown()
       EVERYTHING POSITIONED ABSOLUTELY
       ======================================================= */

    // 🔒 Lock internal cursor to prevent auto overflow
    doc.y = doc.page.height - 150

    const footerY = doc.page.height - 100
    const qrSize = 80
    const qrX = doc.page.width - qrSize - 50
    const qrY = doc.page.height - qrSize - 95
    const hasQr = layout.showQrCode && !!qrCode

    /* -------------------- FOOTER TEXT -------------------- */
    doc
        .font('regular')
        .fontSize(10)
    applyTextStyle(doc, layout, 'issuedOn')
    doc
        .text(`Issued on: ${issuedAt}`, 50, footerY)

    if (footerLine) {
        doc
            .font('italic')
            .fontSize(9)
        applyTextStyle(doc, layout, 'footer')
        doc
            .text(footerLine, 0, footerY - 16, { align: 'center' })
    }

    if (hasQr) {
        // Keep certificate ID clear of the QR block.
        const certTextRightEdge = qrX - 16
        doc
            .font('regular')
            .fontSize(10)
        applyTextStyle(doc, layout, 'certificateId')
        doc
            .text(`Certificate ID: ${certificateId}`, 50, footerY, {
                width: certTextRightEdge - 50,
                align: 'right',
                lineBreak: false,
            })
    } else {
        doc
            .font('regular')
            .fontSize(10)
        applyTextStyle(doc, layout, 'certificateId')
        doc
            .text(`Certificate ID: ${certificateId}`, doc.page.width - 260, footerY)
    }

    /* -------------------- QR CODE -------------------- */
    if (hasQr) {
        try {
            const base64Data = qrCode.split(',')[1]
            const qrBuffer = Buffer.from(base64Data, 'base64')

            // Border
            doc.rect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10).stroke()

            doc.image(qrBuffer, qrX, qrY, {
                width: qrSize,
                height: qrSize,
            })

            doc
                .fontSize(7)
                .fillColor('gray')
                .text(
                    'Scan to verify',
                    qrX,
                    qrY + qrSize + 4,
                    { width: qrSize, align: 'center', lineBreak: false }
                )

            doc.fillColor('black')
        } catch (err) {
            console.error('QR render error:', err)
        }
    }

    /* -------------------- SIGNATURE -------------------- */
    if (layout.signatureCount > 0) {
        const signatureText =
            layout.signatureCount === 2
                ? [
                    content.coordinatorName || 'Coordinator',
                    content.hodName || 'Head of Department',
                ].join(' • ')
                : content.coordinatorName || 'Coordinator'

        const sigY = doc.page.height - 96
        const sigImageW = 120
        const sigImageH = 34
        const leftSigX = doc.page.width * 0.23
        const rightSigX = doc.page.width * 0.62

        const coordinatorSigSource = resolveImageSource(
            content.coordinatorSignatureDataUrl
        )
        if (layout.signatureCount >= 1 && coordinatorSigSource) {
            try {
                doc.image(coordinatorSigSource, leftSigX, sigY - 24, {
                    fit: [sigImageW, sigImageH],
                })
            } catch {}
        }

        const hodSigSource = resolveImageSource(content.hodSignatureDataUrl)
        if (layout.signatureCount === 2 && hodSigSource) {
            try {
                doc.image(hodSigSource, rightSigX, sigY - 24, {
                    fit: [sigImageW, sigImageH],
                })
            } catch {}
        }

        doc.font('bold').fontSize(11)
        applyTextStyle(doc, layout, 'signature')
        doc.text(signatureText, 0, doc.page.height - 90, { align: 'center' })
    }

    return doc
}
