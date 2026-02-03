interface CertificateEmailTemplateArgs {
    recipientName: string
    programName: string
    institution: string
}

export function certificateEmailTemplate({
    recipientName,
    programName,
    institution,
}: CertificateEmailTemplateArgs) {
    return `
  <div style="font-family: Arial, sans-serif; background:#f6f8fb; padding:24px">
    <div style="max-width:600px; margin:auto; background:#ffffff; padding:32px; border-radius:8px">
      
      <h2 style="margin-top:0; color:#1f2937">
        🎓 Your Certificate is Ready
      </h2>

      <p style="color:#374151">
        Dear <strong>${recipientName}</strong>,
      </p>

      <p style="color:#374151">
        Congratulations on successfully participating in
        <strong>${programName}</strong> conducted by
        <strong>${institution}</strong>.
      </p>

      <p style="color:#374151">
        Please find your certificate attached to this email.
      </p>

      <hr style="margin:24px 0"/>

      <p style="font-size:12px; color:#6b7280">
        This certificate was generated via <strong>CertifyED</strong><br/>
        A modern certificate & credential platform
      </p>

    </div>
  </div>
  `
}
