# Quick Reference Guide

## Common Commands

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Quick Links

### Google Cloud Console
- Project: https://console.cloud.google.com/
- APIs & Services: https://console.cloud.google.com/apis/dashboard
- Service Accounts: https://console.cloud.google.com/iam-admin/serviceaccounts

### Google Sheets
- Your Sheet: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit

### Resend Dashboard
- Dashboard: https://resend.com/dashboard
- API Keys: https://resend.com/api-keys
- Domains: https://resend.com/domains

## Environment Variables Quick Copy

```env
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEET_ID=
RESEND_API_KEY=
FROM_EMAIL=
```

## Testing Checklist

- [ ] Form validation works
- [ ] Data saves to Google Sheets
- [ ] Email is received
- [ ] PDF downloads and opens correctly
- [ ] Mobile responsive
- [ ] Error messages display
- [ ] Loading states work

## Deployment Checklist

- [ ] All environment variables set
- [ ] Production build works locally
- [ ] Domain verified in Resend
- [ ] Service account has sheet access
- [ ] Test registration end-to-end
- [ ] Check email deliverability
- [ ] Monitor error logs

## Common Customizations

### Change Program Name
Edit: `app/page.tsx` - Line ~66 and PDF template

### Change Dates
Edit: `app/page.tsx` - Line ~68 and `lib/pdfGenerator.ts`

### Change Organization
Edit: `lib/pdfGenerator.ts` - Line ~78

### Add Form Fields
1. Add to state in `app/page.tsx`
2. Add input field in form
3. Update validation in `app/api/register/route.ts`
4. Update Google Sheets columns in `lib/googleSheets.ts`

### Change Certificate Design
Edit: `lib/pdfGenerator.ts` - Modify colors, fonts, layout

### Change Email Template
Edit: `lib/emailService.ts` - Modify HTML content

## Troubleshooting Quick Fixes

### Google Sheets Not Working
1. Check service account email is shared with sheet
2. Verify `GOOGLE_CLIENT_EMAIL` is correct
3. Check `GOOGLE_PRIVATE_KEY` has `\n` preserved
4. Ensure Google Sheets API is enabled

### Email Not Sending
1. Verify `RESEND_API_KEY` is correct
2. Check domain is verified (or use onboarding@resend.dev)
3. Check Resend dashboard for errors
4. Verify `FROM_EMAIL` matches verified domain

### Build Errors
1. Delete `node_modules` and `.next` folder
2. Run `npm install` again
3. Clear cache: `npm run build -- --no-cache`
4. Check TypeScript errors

### Environment Variables Not Loading
1. Restart development server
2. Check file name is exactly `.env.local`
3. No spaces around `=` signs
4. Wrapped in quotes if contains special characters

## File Locations

| What | Where |
|------|-------|
| Registration Form | `/app/page.tsx` |
| API Endpoint | `/app/api/register/route.ts` |
| PDF Generator | `/lib/pdfGenerator.ts` |
| Email Service | `/lib/emailService.ts` |
| Google Sheets | `/lib/googleSheets.ts` |
| Styles | `/app/globals.css` |
| Config | `.env.local` |

## Support Resources

- Next.js Docs: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Resend Docs: https://resend.com/docs
- Google Sheets API: https://developers.google.com/sheets/api
- PDFKit Docs: https://pdfkit.org/docs/getting_started.html
