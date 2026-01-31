import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { getCertificateSettings } from './certificateSettings'

export async function generateCertificate(data: {
  title: string
  name: string
  certificate_id: string
}): Promise<Buffer> {
  // Get current settings from Google Sheets
  const settings = await getCertificateSettings()

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([842, 595]) // A4 landscape

  const { width, height } = page.getSize()

  // Embed fonts
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  const timesRomanItalicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)

  // Parse colors from settings
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? rgb(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
      )
      : rgb(0.855, 0.647, 0.125)
  }

  const borderColor = hexToRgb(settings.border_color)
  const titleColor = hexToRgb(settings.title_color)
  const black = rgb(0, 0, 0)
  const darkGray = rgb(0.2, 0.2, 0.2)

  // Double border
  page.drawRectangle({
    x: 40,
    y: 40,
    width: width - 80,
    height: height - 80,
    borderColor,
    borderWidth: 4,
  })

  page.drawRectangle({
    x: 50,
    y: 50,
    width: width - 100,
    height: height - 100,
    borderColor,
    borderWidth: 2,
  })

  let yPosition = height - 120

  // CERTIFICATE
  const certText = 'CERTIFICATE'
  const certFontSize = 38
  const certWidth = timesRomanBoldFont.widthOfTextAtSize(certText, certFontSize)
  page.drawText(certText, {
    x: (width - certWidth) / 2,
    y: yPosition,
    size: certFontSize,
    font: timesRomanBoldFont,
    color: titleColor,
  })

  yPosition -= 10
  page.drawLine({
    start: { x: width / 2 - 100, y: yPosition },
    end: { x: width / 2 + 100, y: yPosition },
    thickness: 2,
    color: borderColor,
  })

  yPosition -= 30

  // OF PARTICIPATION
  const ofPartText = 'OF PARTICIPATION'
  const ofPartFontSize = 20
  const ofPartWidth = timesRomanItalicFont.widthOfTextAtSize(
    ofPartText,
    ofPartFontSize
  )
  page.drawText(ofPartText, {
    x: (width - ofPartWidth) / 2,
    y: yPosition,
    size: ofPartFontSize,
    font: timesRomanItalicFont,
    color: darkGray,
  })

  yPosition -= 50

  // This is to certify that
  const certifyText = 'This is to certify that'
  const certifyFontSize = 14
  const certifyWidth = timesRomanFont.widthOfTextAtSize(
    certifyText,
    certifyFontSize
  )
  page.drawText(certifyText, {
    x: (width - certifyWidth) / 2,
    y: yPosition,
    size: certifyFontSize,
    font: timesRomanFont,
    color: black,
  })

  yPosition -= 40

  // Title and Name
  const fullName = `${data.title} ${data.name}`
  const nameFontSize = 32
  const nameWidth = timesRomanBoldFont.widthOfTextAtSize(
    fullName,
    nameFontSize
  )
  page.drawText(fullName, {
    x: (width - nameWidth) / 2,
    y: yPosition,
    size: nameFontSize,
    font: timesRomanBoldFont,
    color: titleColor,
  })

  page.drawLine({
    start: { x: (width - nameWidth) / 2, y: yPosition - 5 },
    end: { x: (width + nameWidth) / 2, y: yPosition - 5 },
    thickness: 1,
    color: darkGray,
  })

  yPosition -= 50

  // Main certificate text
  const bodyFontSize = 13
  const lineHeight = 20

  const lines = [
    `has participated in the two days certification program on`,
    `"${settings.program_name}"`,
    `organised by ${settings.department},`,
    `${settings.faculty}, ${settings.institution},`,
    `${settings.location} on ${settings.program_dates}.`,
  ]

  lines.forEach((line, index) => {
    const isTitle = index === 1
    const font = isTitle ? timesRomanBoldFont : timesRomanFont
    const lineWidth = font.widthOfTextAtSize(line, bodyFontSize)

    page.drawText(line, {
      x: (width - lineWidth) / 2,
      y: yPosition,
      size: bodyFontSize,
      font,
      color: black,
    })

    yPosition -= lineHeight
  })

  // Signatures
  yPosition = 120

  page.drawLine({
    start: { x: 150, y: yPosition },
    end: { x: 280, y: yPosition },
    thickness: 1,
    color: black,
  })

  const coordinatorName = settings.coordinator_name || 'Coordinator'
  page.drawText(coordinatorName, {
    x: 150 + (130 - timesRomanFont.widthOfTextAtSize(coordinatorName, 10)) / 2,
    y: yPosition - 20,
    size: 10,
    font: timesRomanFont,
    color: black,
  })

  page.drawLine({
    start: { x: width - 280, y: yPosition },
    end: { x: width - 150, y: yPosition },
    thickness: 1,
    color: black,
  })

  const hodName = settings.hod_name || 'Head of Department'
  page.drawText(hodName, {
    x:
      width -
      280 +
      (130 - timesRomanFont.widthOfTextAtSize(hodName, 10)) / 2,
    y: yPosition - 20,
    size: 10,
    font: timesRomanFont,
    color: black,
  })

  // Footer
  const footerText = `${settings.institution}, ${settings.location}`
  const footerWidth = timesRomanItalicFont.widthOfTextAtSize(footerText, 9)
  page.drawText(footerText, {
    x: (width - footerWidth) / 2,
    y: 60,
    size: 9,
    font: timesRomanItalicFont,
    color: darkGray,
  })

  // 🔑 Certificate ID (footer – subtle)
  const certIdText = `Certificate ID: ${data.certificate_id}`
  const certIdWidth = timesRomanFont.widthOfTextAtSize(certIdText, 9)
  page.drawText(certIdText, {
    x: (width - certIdWidth) / 2,
    y: 40,
    size: 9,
    font: timesRomanFont,
    color: darkGray,
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
