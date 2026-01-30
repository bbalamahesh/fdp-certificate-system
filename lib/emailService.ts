import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendCertificateEmail(
  recipientEmail: string,
  recipientName: string,
  certificatePdf: Buffer
) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'FDP Program <onboarding@resend.dev>',
      to: recipientEmail,
      subject: 'Your FDP Participation Certificate - Mastering Data Analysis Using R Studio',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Congratulations! 🎉</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
              <p style="font-size: 16px; margin-bottom: 20px;">Dear ${recipientName},</p>
              
              <p style="font-size: 15px; margin-bottom: 15px;">
                Thank you for participating in the two days certification program on 
                <strong>"Mastering Data Analysis Using R Studio"</strong>.
              </p>
              
              <p style="font-size: 15px; margin-bottom: 15px;">
                We are pleased to attach your certificate of participation. This certificate 
                acknowledges your commitment to learning and professional development.
              </p>
              
              <div style="background: white; border-left: 4px solid #667eea; padding: 15px; margin: 25px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #666;">
                  <strong>Program Details:</strong><br>
                  📅 Dates: 25-03-2025 & 26-03-2025<br>
                  🏛️ Organized by: Department of Business Administration<br>
                  🎓 SRM Institute of Science and Technology, Ramapuram
                </p>
              </div>
              
              <p style="font-size: 15px; margin-bottom: 15px;">
                We hope this program has been valuable to you and wish you all the best 
                in your future endeavors.
              </p>
              
              <p style="font-size: 15px; margin-top: 30px;">
                Best regards,<br>
                <strong>Department of Business Administration</strong><br>
                SRM Institute of Science and Technology
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 12px;">
              <p style="margin: 5px 0;">This is an automated email. Please do not reply to this message.</p>
              <p style="margin: 5px 0;">If you have any questions, please contact the program coordinator.</p>
            </div>
          </body>
        </html>
      `,
      attachments: [
        {
          filename: `${recipientName.replace(/\s+/g, '_')}_Certificate.pdf`,
          content: certificatePdf,
        },
      ],
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in sendCertificateEmail:', error);
    throw error;
  }
}
