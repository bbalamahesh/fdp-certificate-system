# FDP Certificate System - Complete Setup Guide

This guide will walk you through setting up the complete FDP (Faculty Development Program) certificate system with Google Sheets integration, PDF generation, and email automation.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Google Cloud Setup](#google-cloud-setup)
3. [Google Sheets Setup](#google-sheets-setup)
4. [Resend Email Setup](#resend-email-setup)
5. [Local Development Setup](#local-development-setup)
6. [Deployment](#deployment)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ installed
- A Google account
- Basic knowledge of terminal/command line

## 🔧 Google Cloud Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name: "FDP Certificate System"
5. Click "Create"

### Step 2: Enable Google Sheets API

1. In your project, go to "APIs & Services" > "Library"
2. Search for "Google Sheets API"
3. Click on it and click "Enable"

### Step 3: Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in details:
   - Service account name: `fdp-certificate-service`
   - Service account ID: (auto-generated)
   - Click "Create and Continue"
4. Grant role: "Editor" (for full access to sheets)
5. Click "Continue" then "Done"

### Step 4: Create Service Account Key

1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select "JSON" format
5. Click "Create" - this will download a JSON file
6. **IMPORTANT**: Keep this file secure! It contains credentials.

### Step 5: Extract Credentials from JSON

Open the downloaded JSON file and find:
- `client_email`: This is your `GOOGLE_CLIENT_EMAIL`
- `private_key`: This is your `GOOGLE_PRIVATE_KEY`

## 📊 Google Sheets Setup

### Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it: "FDP Registrations"
4. Note the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
   ```

### Step 2: Share Sheet with Service Account

1. Click "Share" button in your sheet
2. Paste the `client_email` from your service account JSON
3. Give "Editor" permissions
4. Uncheck "Notify people"
5. Click "Share"

### Step 3: Prepare Sheet Structure

The sheet will auto-create headers, but you can manually add them:
- Column A: Timestamp
- Column B: Title
- Column C: Name
- Column D: Email
- Column E: Phone
- Column F: Organization

## 📧 Resend Email Setup

### Step 1: Create Resend Account

1. Go to [Resend](https://resend.com/)
2. Sign up for a free account
3. Verify your email

### Step 2: Add Domain (Optional but Recommended)

For production use:
1. Go to "Domains" in Resend dashboard
2. Click "Add Domain"
3. Enter your domain name
4. Follow DNS verification steps
5. Wait for verification (can take a few minutes)

For testing, you can skip this and use the default `onboarding@resend.dev` sender.

### Step 3: Get API Key

1. Go to "API Keys" in Resend dashboard
2. Click "Create API Key"
3. Name it: "FDP Certificate System"
4. Copy the API key (starts with `re_`)
5. **IMPORTANT**: Save this key - you can't see it again!

## 💻 Local Development Setup

### Step 1: Clone/Download the Project

```bash
cd fdp-certificate-system
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

1. Copy the example env file:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and fill in your credentials:

```env
# Google Sheets API
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-google-sheet-id

# Resend API
RESEND_API_KEY=re_your_resend_api_key

# Email Configuration
FROM_EMAIL=noreply@yourdomain.com
```

**IMPORTANT NOTES:**
- For `GOOGLE_PRIVATE_KEY`: Copy the entire private key from the JSON file, including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep the `\n` characters in the private key string
- For `GOOGLE_SHEET_ID`: Get from the Google Sheets URL
- For `FROM_EMAIL`: Use your verified domain email or `onboarding@resend.dev` for testing

### Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel settings:
   - Go to Project Settings > Environment Variables
   - Add all variables from your `.env.local` file
5. Deploy!

### Deploy to Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Render
- etc.

Make sure to add all environment variables in your hosting platform's settings.

## 🧪 Testing

### Test the Registration Flow

1. Fill out the form with test data
2. Use your real email for testing
3. Submit the form
4. Check:
   - ✅ Data appears in Google Sheets
   - ✅ Email received with PDF certificate
   - ✅ PDF opens correctly and shows participant name

### Test Email Template

Before going live, send test emails to ensure:
- Email formatting looks good
- PDF attachment works
- Links and text are correct

## 🐛 Troubleshooting

### Common Issues

#### 1. "Failed to save to Google Sheets"

**Solutions:**
- Verify service account email is shared with edit access on the sheet
- Check `GOOGLE_CLIENT_EMAIL` is correct
- Ensure `GOOGLE_PRIVATE_KEY` has proper line breaks (`\n`)
- Verify Google Sheets API is enabled in Google Cloud Console

#### 2. "Failed to send email"

**Solutions:**
- Check `RESEND_API_KEY` is correct
- Verify domain is verified in Resend (if using custom domain)
- Check Resend dashboard for error logs
- For testing, use `onboarding@resend.dev` as FROM_EMAIL

#### 3. "PDF generation failed"

**Solutions:**
- Ensure all required fields are provided
- Check server logs for specific PDF errors
- Verify PDFKit is properly installed

#### 4. Environment Variables Not Loading

**Solutions:**
- Restart development server after changing `.env.local`
- Check file is named exactly `.env.local`
- Ensure file is in root directory
- For deployment, verify all env vars are set in hosting platform

### Testing Individual Components

You can test components separately:

**Test Google Sheets Connection:**
```javascript
// Create a test API route to verify connection
```

**Test Email Sending:**
- Use a test endpoint to send a sample email

**Test PDF Generation:**
- Create a route that only generates and downloads PDF

## 📝 Customization

### Change Certificate Design

Edit `/lib/pdfGenerator.ts` to modify:
- Colors
- Fonts
- Layout
- Text content
- Add logos (you'll need to include image files)

### Change Email Template

Edit `/lib/emailService.ts` to modify:
- Email subject
- Email body HTML
- Styling

### Add More Form Fields

1. Add fields to the form in `/app/page.tsx`
2. Update the state and handleChange
3. Update API route in `/app/api/register/route.ts`
4. Update Google Sheets columns in `/lib/googleSheets.ts`

## 🔒 Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore` for a reason
2. **Rotate API keys** regularly
3. **Use environment variables** for all sensitive data
4. **Limit service account permissions** to only what's needed
5. **Enable CORS** only for your domain in production
6. **Add rate limiting** to prevent abuse
7. **Validate all inputs** on the server side

## 📊 Monitoring

### Check Registration Data

- Access your Google Sheet to see all registrations
- Data includes timestamp, name, email, phone, organization

### Email Delivery

- Check Resend dashboard for email delivery status
- Monitor bounce rates and failures

## 🎯 Production Checklist

Before going live:

- [ ] Test complete registration flow
- [ ] Verify Google Sheets integration
- [ ] Test email delivery
- [ ] Check PDF certificate generation
- [ ] Verify all environment variables are set
- [ ] Test on different devices/browsers
- [ ] Set up custom domain for emails (optional)
- [ ] Add error tracking (Sentry, etc.)
- [ ] Set up analytics (optional)
- [ ] Add rate limiting
- [ ] Enable HTTPS
- [ ] Test with real user data

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs
3. Check Google Cloud Console logs
4. Check Resend dashboard for email errors
5. Verify all environment variables

## 📄 License

This project is provided as-is for educational purposes.

---

**Happy Coding! 🚀**
