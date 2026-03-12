import nodemailer from 'nodemailer'

type Args = {
  to: string
  participantName: string
  eventName: string
  fromDate: Date
  toDate: Date
  mode: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  contactEmail: string
  contactMobile: string
  meetingLink?: string | null
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

export async function sendEventUpdateEmail(args: Args) {
  const meetingSection = args.meetingLink
    ? `<p><strong>Meeting Link:</strong> <a href="${args.meetingLink}">${args.meetingLink}</a></p>`
    : ''

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: args.to,
    subject: `Event Updated: ${args.eventName}`,
    html: `
      <p>Hi ${args.participantName},</p>
      <p>The event details were updated for <strong>${args.eventName}</strong>.</p>
      <p><strong>Mode:</strong> ${args.mode}</p>
      <p><strong>Dates:</strong> ${args.fromDate.toDateString()} to ${args.toDate.toDateString()}</p>
      ${meetingSection}
      <p>Contact: ${args.contactEmail} / ${args.contactMobile}</p>
    `,
  })
}
