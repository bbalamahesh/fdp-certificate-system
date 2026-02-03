import nodemailer from 'nodemailer'
import { certificateEmailTemplate } from './templates/certificateEmailTemplate'

interface SendCertificateEmailArgs {
    to: string
    recipientName: string
    programName: string
    institution: string
    pdfBuffer: Buffer
}

export async function sendCertificateEmail({
    to,
    recipientName,
    programName,
    institution,
    pdfBuffer,
}: SendCertificateEmailArgs) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    })

    await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject: `Your Certificate – ${programName}`,
        html: certificateEmailTemplate({
            recipientName,
            programName,
            institution,
        }),
        attachments: [
            {
                filename: 'certificate.pdf',
                content: pdfBuffer,
            },
        ],
    })
}
