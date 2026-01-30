# FDP Certificate System 🎓

An automated system for Faculty Development Program (FDP) registration that generates and emails participation certificates while saving registration data to Google Sheets.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## ✨ Features

- 📝 **Beautiful Registration Form** - Clean, responsive UI with Tailwind CSS
- 📊 **Google Sheets Integration** - Automatic data storage
- 📄 **PDF Certificate Generation** - Professional certificates with participant names
- 📧 **Email Automation** - Automated email delivery with Resend
- ⚡ **Real-time Processing** - Instant certificate generation and delivery
- 🎨 **Customizable Design** - Easy to modify certificate template
- 🔒 **Secure** - Environment-based configuration
- 📱 **Mobile Responsive** - Works on all devices

## 🏗️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Google Sheets (via Google Sheets API)
- **PDF Generation**: PDFKit
- **Email Service**: Resend
- **Hosting**: Vercel (recommended) or any Next.js compatible platform

## 📸 Screenshots

### Registration Form
- Clean, modern interface
- Real-time validation
- Loading states
- Success/error messages

### Generated Certificate
- Professional design matching your template
- Participant name with title
- Program details
- Dates and organization info

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Google Cloud account
- Resend account

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd fdp-certificate-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your credentials (see [SETUP_GUIDE.md](./SETUP_GUIDE.md) for details).

4. **Run development server**
```bash
npm run dev
```

5. **Open your browser**
```
http://localhost:3000
```

## 📖 Detailed Setup

For complete setup instructions including:
- Google Cloud Project setup
- Service Account creation
- Google Sheets configuration
- Resend email setup
- Deployment guide

Please see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## 🎨 Customization

### Certificate Template

Edit `lib/pdfGenerator.ts` to customize:
- Certificate design and layout
- Colors and fonts
- Text content
- Add logos or images
- Signature placeholders

### Email Template

Edit `lib/emailService.ts` to customize:
- Email subject
- Email body content
- HTML styling
- Attachment filename

### Form Fields

Edit `app/page.tsx` to add or modify:
- Form fields
- Validation rules
- UI styling
- Success/error messages

## 📊 Data Structure

### Google Sheets Columns
| Column | Data |
|--------|------|
| A | Timestamp |
| B | Title (Prof./Dr./Mr./Ms.) |
| C | Name |
| D | Email |
| E | Phone |
| F | Organization |

### Form Data
```typescript
{
  title: string;        // Prof./Dr./Mr./Ms.
  name: string;         // Full name
  email: string;        // Email address
  phone: string;        // Phone number
  organization: string; // Institution name
}
```

## 🔧 API Endpoints

### POST `/api/register`

Handles registration, certificate generation, and email sending.

**Request Body:**
```json
{
  "title": "Mr.",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 1234567890",
  "organization": "Example University"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful! Certificate sent to your email."
}
```

## 🧪 Testing

### Manual Testing
1. Fill out the registration form
2. Check Google Sheets for data
3. Verify email received
4. Check PDF certificate

### Unit Testing (Optional)
```bash
npm test
```

## 🐛 Troubleshooting

Common issues and solutions are documented in [SETUP_GUIDE.md](./SETUP_GUIDE.md#troubleshooting)

Quick checks:
- ✅ Google Sheets API enabled?
- ✅ Service account has access to sheet?
- ✅ All environment variables set?
- ✅ Resend API key valid?
- ✅ Domain verified in Resend?

## 📁 Project Structure

```
fdp-certificate-system/
├── app/
│   ├── api/
│   │   └── register/
│   │       └── route.ts          # Registration API endpoint
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Registration form
├── lib/
│   ├── emailService.ts           # Email sending logic
│   ├── googleSheets.ts           # Google Sheets integration
│   └── pdfGenerator.ts           # PDF certificate generation
├── .env.local.example            # Environment variables template
├── package.json                  # Dependencies
├── SETUP_GUIDE.md               # Detailed setup instructions
├── README.md                     # This file
└── tsconfig.json                # TypeScript configuration
```

## 🔒 Security

- Never commit `.env.local`
- Store all credentials in environment variables
- Use service accounts with minimal permissions
- Validate all user inputs
- Sanitize data before storing
- Use HTTPS in production
- Consider adding rate limiting

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import repository to Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Compatible with:
- Netlify
- AWS Amplify
- Railway
- Render
- Any platform supporting Next.js

## 📝 Environment Variables

Required environment variables:

```env
GOOGLE_CLIENT_EMAIL=          # Service account email
GOOGLE_PRIVATE_KEY=           # Service account private key
GOOGLE_SHEET_ID=              # Google Sheet ID
RESEND_API_KEY=               # Resend API key
FROM_EMAIL=                   # Sender email address
```

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- SRM Institute of Science and Technology
- Department of Business Administration
- Next.js team for the amazing framework
- Resend for email infrastructure
- Google for Sheets API

## 📧 Support

For support and questions:
- Check [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- Review troubleshooting section
- Check server logs
- Verify environment variables

## 🎯 Roadmap

Future enhancements:
- [ ] Admin dashboard for viewing registrations
- [ ] Bulk certificate generation
- [ ] Multiple certificate templates
- [ ] SMS notifications
- [ ] QR code on certificates for verification
- [ ] Analytics dashboard
- [ ] Export data to Excel
- [ ] Multi-language support

---

**Built with ❤️ for FDP Programs**

For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)
