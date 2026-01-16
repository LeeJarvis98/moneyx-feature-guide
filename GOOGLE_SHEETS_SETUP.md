# Google Sheets Integration Setup

This guide explains how to set up Google Sheets integration for the Partner Sign-Up feature.

**Note:** The partner signup feature uses the same service account as the license management system. The service account credentials are already embedded in the code.

## Prerequisites

- The spreadsheet ID: `1OwiPWGUgMo8Sc6tG69x3AeUQGZ-Phv_0GgwjK-OXwF0`
- Service account email: `vnclc-360@thermal-loop-468609-u1.iam.gserviceaccount.com`

## Quick Setup

### Step 1: Share Google Sheet with Service Account

1. Open your Google Sheet: [https://docs.google.com/spreadsheets/d/1OwiPWGUgMo8Sc6tG69x3AeUQGZ-Phv_0GgwjK-OXwF0](https://docs.google.com/spreadsheets/d/1OwiPWGUgMo8Sc6tG69x3AeUQGZ-Phv_0GgwjK-OXwF0/edit)
2. Click **Share** button
3. Add this email: `vnclc-360@thermal-loop-468609-u1.iam.gserviceaccount.com`
4. Give it **Editor** permissions
5. Click **Send**

### Step 2: Set Up Google Sheet Headers

Make sure your Google Sheet has a sheet named **"AndyBao"** with the following column headers in the first row:

| Timestamp | Partner ID | Partner Password | Platform Credentials | Status |
|-----------|------------|------------------|---------------------|--------|

**Note:** Partner ID contains only alphanumeric characters (letters and numbers only - no spaces, underscores, hyphens, or other special characters).

### Step 3: Test the Integration

1. Restart your Next.js development server (if needed):
   ```bash
   npm run dev
   ```

2. Navigate to the partner login page
3. Click "Sign up here"
4. Fill out the form and submit
5. Check your Google Sheet's "AndyBao" tab - a new row should appear with the submitted data

## Troubleshooting

### Error: "Permission denied"
- Ensure the service account email `vnclc-360@thermal-loop-468609-u1.iam.gserviceaccount.com` has Editor permissions on the Google Sheet
- Check that you shared the sheet with the correct service account email
- Make sure the "AndyBao" sheet exists in your spreadsheet

### Error: "Sheet not found"
- Verify that a sheet named "AndyBao" exists in your Google Spreadsheet
- Check the sheet name spelling (case-sensitive)

### No data appearing in the sheet
- Check the browser console for error messages
- Verify the spreadsheet ID is correct: `1OwiPWGUgMo8Sc6tG69x3AeUQGZ-Phv_0GgwjK-OXwF0`
- Ensure the service account has proper permissions

## Data Format

When a partner signs up, the following data is saved to the sheet:

- **Timestamp**: ISO 8601 format (e.g., `2026-01-16T08:30:00.000Z`)
- **Partner ID**: Unique identifier (alphanumeric only - e.g., `johndoe123`)
- **Partner Password**: Password created by the partner (store securely!)
- **Platform Credentials**: List of verified platforms with usernames and passwords (e.g., `exness: user123 / pass456; fxpro: user789 / pass012`)
- **Status**: Initially set to "Pending", can be manually updated to "Approved" or "Rejected"

**Security Warning**: This stores sensitive credentials including passwords. Ensure your Google Sheet has restricted access and consider encryption for production use.

## Security Notes

- The service account credentials are embedded in the code for this specific use case
- **Never commit** additional sensitive credentials to version control
- Restrict access to your Google Sheet to only necessary users
- Consider encrypting sensitive data like passwords before storing them in the sheet
- The service account only has access to sheets explicitly shared with it
- Regularly audit who has access to your Google Sheets

## Next Steps

After setup, you can:
1. Monitor new partner applications in real-time in the "AndyBao" sheet
2. Update the "Status" column to approve/reject applications
3. Set up email notifications using Google Apps Script
4. Create automated workflows with Google Sheets formulas
