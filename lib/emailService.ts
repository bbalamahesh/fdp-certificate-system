import nodemailer from 'nodemailer'
import { CertificateSettings } from '@/lib/certificateSettings'
import { buildCertificateEmailTemplate } from './emailTemplates/certificateEmail'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER!,
    pass: process.env.GMAIL_APP_PASSWORD!,
  },
})

type SendCertificateEmailInput = {
  recipientEmail: string
  recipientName: string
  certificatePdf: Buffer
  settings: CertificateSettings
}

export async function sendCertificateEmail({
  recipientEmail,
  recipientName,
  certificatePdf,
  settings,
}: SendCertificateEmailInput) {
  const html = buildCertificateEmailTemplate({
    recipientName,
    settings,
  })

  return transporter.sendMail({
    from: `"FDP Certificate System" <${process.env.GMAIL_USER}>`,
    to: recipientEmail,
    subject: `Your Certificate – ${settings.program_name}`,
    html,
    attachments: [
      {
        filename: 'FDP-Certificate.pdf',
        content: certificatePdf,
      },
    ],
  })
}
