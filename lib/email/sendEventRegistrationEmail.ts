import nodemailer from 'nodemailer'
import { buildEventIcs } from '@/lib/events'

type Args = {
  to: string
  participantName: string
  eventName: string
  fromDate: Date
  toDate: Date
  mode: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  contactEmail: string
  contactMobile: string
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEventRegistrationEmail(args: Args) {
  const ics = buildEventIcs({
    uid: `${Date.now()}-${args.to}`,
    title: args.eventName,
    description: `Registration confirmed for ${args.eventName}. Mode: ${args.mode}. Contact: ${args.contactEmail}, ${args.contactMobile}`,
    start: args.fromDate,
    end: args.toDate,
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: args.to,
    subject: `Registration confirmed: ${args.eventName}`,
    html: `
      <p>Hi ${args.participantName},</p>
      <p>Your registration is confirmed for <strong>${args.eventName}</strong>.</p>
      <p><strong>Mode:</strong> ${args.mode}</p>
      <p><strong>Dates:</strong> ${args.fromDate.toDateString()} to ${args.toDate.toDateString()}</p>
      <p>For support, contact ${args.contactEmail} / ${args.contactMobile}.</p>
    `,
    attachments: [
      {
        filename: 'event.ics',
        content: ics,
        contentType: 'text/calendar; charset=utf-8',
      },
    ],
  })
}
