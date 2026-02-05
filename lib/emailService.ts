import nodemailer from 'nodemailer'
import { CertificateSettings } from '@/lib/certificateSettings'
import { buildCertificateEmailTemplate } from './emailTemplates/certificateEmail'

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export type SendCertificateEmailInput = {
  recipientEmail: string
  recipientName: string
  certificatePdf: Buffer
  settings: CertificateSettings
}

export async function sendCertificateEmail(
  input: SendCertificateEmailInput
) {
  const {
    recipientEmail,
    recipientName,
    certificatePdf,
    settings,
  } = input

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
