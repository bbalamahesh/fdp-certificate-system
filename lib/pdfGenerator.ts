import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import path from 'path';
import fs from 'fs';

export async function generateCertificate(data: {
  title: string;
  name: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const regularFont = path.join(
        process.cwd(),
        'public/fonts/Roboto-Regular.ttf'
      );
      const boldFont = path.join(
        process.cwd(),
        'public/fonts/Roboto-Bold.ttf'
      );
      const italicFont = path.join(
        process.cwd(),
        'public/fonts/Roboto-Italic.ttf'
      );

      if (!fs.existsSync(regularFont) || !fs.existsSync(boldFont)) {
        throw new Error('Roboto fonts not found in public/fonts');
      }

      // 🔴 CRITICAL FIX: set font at construction time
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 50,
        font: regularFont, // 👈 THIS disables Helvetica completely
      });

      const stream = new PassThrough();
      const chunks: Buffer[] = [];

      stream.on('data', (c) => chunks.push(c));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);

      doc.pipe(stream);

      doc.registerFont('regular', regularFont);
      doc.registerFont('bold', boldFont);
      doc.registerFont('italic', italicFont);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const centerX = pageWidth / 2;

      // Border
      doc.lineWidth(3).strokeColor('#1e40af')
        .rect(30, 30, pageWidth - 60, pageHeight - 60).stroke();

      doc.lineWidth(1).strokeColor('#3b82f6')
        .rect(40, 40, pageWidth - 80, pageHeight - 80).stroke();

      // Title
      doc.font('bold').fontSize(32).fillColor('#1e40af')
        .text('CERTIFICATE OF PARTICIPATION', 0, 100, {
          width: pageWidth,
          align: 'center',
        });

      doc.moveTo(centerX - 150, 150)
        .lineTo(centerX + 150, 150)
        .strokeColor('#3b82f6')
        .lineWidth(2)
        .stroke();

      doc.font('regular').fontSize(14).fillColor('#374151')
        .text('This is to certify that', 0, 200, {
          width: pageWidth,
          align: 'center',
        });

      doc.font('bold').fontSize(28).fillColor('#1e40af')
        .text(`${data.title} ${data.name}`, 0, 240, {
          width: pageWidth,
          align: 'center',
        });

      const description =
        'has participated in the two days certification program on "MASTERING DATA\n' +
        'ANALYSIS USING R STUDIO" organised by Department of Business\n' +
        'Administration, Faculty of Management, SRM Institute Of Science And Technology,\n' +
        'Ramapuram, Chennai on 25-03-2025 and 26-03-2025.';

      doc.font('regular').fontSize(13).fillColor('#374151')
        .text(description, 0, 300, {
          width: pageWidth,
          align: 'center',
          lineGap: 5,
        });

      const footerY = pageHeight - 150;

      doc.font('bold').fontSize(11)
        .text('_____________________', 120, footerY, { width: 200, align: 'center' });

      doc.font('regular').fontSize(10)
        .text('Coordinator', 120, footerY + 20, { width: 200, align: 'center' });

      doc.font('bold').fontSize(11)
        .text('_____________________', pageWidth - 320, footerY, { width: 200, align: 'center' });

      doc.font('regular').fontSize(10)
        .text('Head of Department', pageWidth - 320, footerY + 20, { width: 200, align: 'center' });

      doc.font('italic').fontSize(9).fillColor('#6b7280')
        .text(
          'SRM Institute of Science and Technology, Ramapuram, Chennai',
          0,
          pageHeight - 60,
          { width: pageWidth, align: 'center' }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
