import { CertificateSettings } from '@/lib/certificateSettings'

type CertificateEmailTemplateInput = {
  recipientName: string
  settings: CertificateSettings
}

export function buildCertificateEmailTemplate({
  recipientName,
  settings,
}: CertificateEmailTemplateInput) {
  return `
  <div style="max-width: 600px; margin: auto; border-radious: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0;">Congratulations 🎉</h1>
    </div>

    <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
      <p style="font-size: 16px;">Dear ${recipientName},</p>

      <p>
        Thank you for participating in the certification program on
        <strong>${settings.program_name}</strong>.
      </p>

      <div style="background: white; border-left: 4px solid ${settings.border_color}; padding: 15px; margin: 25px 0;">
        <p style="margin: 0; font-size: 14px;">
          <strong>Program Details</strong><br/>
          📅 Dates: ${settings.program_dates}<br/>
          🏛️ Department: ${settings.department}<br/>
          🎓 Institution: ${settings.institution}<br/>
          📍 Location: ${settings.location}
        </p>
      </div>

      <p>
        We hope this program has been valuable to you and wish you continued success.
      </p>

      <p style="margin-top: 30px;">
        Best regards,<br/>
        <strong>${settings.department}</strong><br/>
        ${settings.institution}
      </p>
    </div>

    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280;">
      <p>This is an automated email. Please do not reply.</p>
    </div>
    </div>
  `
}
