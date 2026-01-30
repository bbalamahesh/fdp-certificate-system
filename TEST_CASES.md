# Test Data for Manual Testing

Use these test records to verify the system is working correctly.

## Test Case 1: Basic Registration

```json
{
  "title": "Mr.",
  "name": "Test User One",
  "email": "your-email+test1@example.com",
  "phone": "+91 9876543210",
  "organization": "Test University"
}
```

**Expected Results:**
- ✅ Form submits successfully
- ✅ Data appears in Google Sheets with timestamp
- ✅ Email received at specified address
- ✅ PDF certificate attached with correct name
- ✅ PDF shows "Mr. Test User One"

## Test Case 2: Female Title

```json
{
  "title": "Ms.",
  "name": "Jane Smith",
  "email": "your-email+test2@example.com",
  "phone": "+91 9876543211",
  "organization": "Example College"
}
```

**Expected Results:**
- ✅ Certificate shows "Ms. Jane Smith"

## Test Case 3: Professor Title

```json
{
  "title": "Prof.",
  "name": "John Academic",
  "email": "your-email+test3@example.com",
  "phone": "+91 9876543212",
  "organization": "Research Institute"
}
```

**Expected Results:**
- ✅ Certificate shows "Prof. John Academic"

## Test Case 4: Doctor Title

```json
{
  "title": "Dr.",
  "name": "Sarah Medical",
  "email": "your-email+test4@example.com",
  "phone": "+91 9876543213",
  "organization": "Medical College"
}
```

**Expected Results:**
- ✅ Certificate shows "Dr. Sarah Medical"

## Test Case 5: Long Name

```json
{
  "title": "Dr.",
  "name": "Thirumalai Venkatachari Ramakrishnan",
  "email": "your-email+test5@example.com",
  "phone": "+91 9876543214",
  "organization": "SRM Institute of Science and Technology"
}
```

**Expected Results:**
- ✅ Long name displays properly on certificate
- ✅ No text overflow issues

## Test Case 6: Special Characters in Name

```json
{
  "title": "Mr.",
  "name": "O'Brien-Smith",
  "email": "your-email+test6@example.com",
  "phone": "+91 9876543215",
  "organization": "St. Mary's College"
}
```

**Expected Results:**
- ✅ Special characters handled correctly
- ✅ PDF generates without errors

## Validation Tests

### Invalid Email
```json
{
  "title": "Mr.",
  "name": "Test User",
  "email": "invalid-email",
  "phone": "+91 9876543210",
  "organization": "Test Org"
}
```
**Expected:** ❌ Form validation error

### Empty Fields
```json
{
  "title": "",
  "name": "",
  "email": "",
  "phone": "",
  "organization": ""
}
```
**Expected:** ❌ Form validation error on all required fields

### Missing Field
```json
{
  "title": "Mr.",
  "name": "Test User",
  "email": "test@example.com",
  "phone": ""
}
```
**Expected:** ❌ Form validation error for phone

## Load Testing

### Rapid Submissions
Submit 5 registrations in quick succession to test:
- Rate limiting (if implemented)
- Concurrent Google Sheets writes
- Email queue handling

### Large Volume
Test with 20+ registrations to verify:
- No data loss
- All emails sent
- Google Sheets performance

## Email Testing Tips

### Using Email Aliases
If using Gmail, you can test multiple registrations with one email:
- `youremail+test1@gmail.com`
- `youremail+test2@gmail.com`
- `youremail+test3@gmail.com`

All will arrive at `youremail@gmail.com`

### Check Email Content
Verify in received emails:
- ✅ Subject is correct
- ✅ Recipient name is personalized
- ✅ HTML formatting displays properly
- ✅ PDF attachment present
- ✅ PDF filename is correct format
- ✅ PDF opens without errors

## Google Sheets Verification

After each test, verify in Google Sheets:
1. New row added
2. Timestamp is correct
3. All fields populated
4. No duplicate entries
5. Data formatting is correct

## PDF Certificate Verification

For each generated certificate, check:
- ✅ Border displays correctly
- ✅ Title and name are correct
- ✅ Program name matches
- ✅ Dates are correct
- ✅ Organization name is correct
- ✅ Signature placeholders present
- ✅ No text overlap
- ✅ Professional appearance

## Mobile Testing

Test on different devices:
- ✅ iPhone (Safari)
- ✅ Android (Chrome)
- ✅ iPad/Tablet
- ✅ Different screen sizes

Verify:
- Form is responsive
- All fields accessible
- Submit button works
- Success message displays

## Browser Testing

Test on:
- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge

## Performance Testing

Measure:
- Form submission time
- PDF generation time
- Email delivery time
- Total process time (should be < 5 seconds)

## Error Scenario Testing

### Google Sheets Unavailable
1. Temporarily remove sheet access
2. Submit form
3. Verify error message displays

### Invalid API Key
1. Use wrong Resend API key
2. Submit form
3. Verify error handling

### Network Issues
1. Disconnect internet during submission
2. Verify error message

## Post-Deployment Testing

After deploying to production:
- [ ] Test complete registration flow
- [ ] Verify all environment variables work
- [ ] Check email delivery in production
- [ ] Test from different locations
- [ ] Monitor server logs
- [ ] Check error tracking (if configured)

## Automated Testing Script (Optional)

You can create a simple script to automate testing:

```javascript
// test-registration.js
const testData = {
  title: "Mr.",
  name: "Automated Test User",
  email: "your-email+auto@example.com",
  phone: "+91 9876543216",
  organization: "Test Automation Org"
};

fetch('http://localhost:3000/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

Run with: `node test-registration.js`
