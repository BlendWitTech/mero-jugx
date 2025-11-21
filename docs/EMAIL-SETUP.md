# Email Setup Guide

This project supports multiple email sending methods:

## Development Mode

### Option 1: Resend API (Recommended for Development)

Resend is a modern email API service that's easy to set up and use in development.

1. **Add Resend API Key to `.env` file:**
   ```env
   RESEND_API_KEY=re_fWJxXubs_FJyYxLzVNWTUN98s12HjASGG
   SMTP_FROM=noreply@yourdomain.com
   SMTP_FROM_NAME=Your App Name
   ```

2. **Install Resend package:**
   ```bash
   npm install resend
   ```

3. The email service will automatically use Resend if:
   - `NODE_ENV=development`
   - `RESEND_API_KEY` is set in environment variables

### Option 2: SMTP (Traditional)

If you prefer to use SMTP in development:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME=Your App Name
```

### Option 3: Console Logging (Fallback)

If neither Resend nor SMTP is configured in development mode, emails will be logged to the console for debugging purposes.

## Production Mode

In production, you **must** configure either:
- `RESEND_API_KEY` (recommended)
- OR SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`)

## Email Types Supported

The system sends the following types of emails:

1. **Email Verification** - Sent when users register
2. **Password Reset** - Sent when users request password reset
3. **Invitations** - Sent when users are invited to join an organization
4. **Access Revoked** - Sent when user access is revoked
5. **MFA Enabled** - Sent when MFA is enabled for an organization
6. **Data Transferred** - Sent when data ownership is transferred

## Resend Setup

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add it to your `.env` file as `RESEND_API_KEY`
4. **Verify a Domain** (Required for sending to any email address):
   - Go to Resend Dashboard → Domains → Add Domain
   - Enter your domain (e.g., `mero-jugx.com` or `dev.mero-jugx.com`)
   - Add the DNS records provided by Resend to your domain's DNS settings:
     - **SPF Record**: `v=spf1 include:resend.com ~all`
     - **DKIM Record**: (provided by Resend)
     - **DMARC Record**: `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com`
   - Wait for verification (usually takes a few minutes)
5. Update `SMTP_FROM` in your `.env` to use your verified domain:
   ```env
   SMTP_FROM=noreply@yourdomain.com
   ```

### ⚠️ Important: Localhost Development Limitation

**You cannot verify `localhost` as a domain.** Here are your options:

#### Option A: Use a Real Domain (Recommended)
- Verify a domain you own (even if it's just for development)
- Use a subdomain like `dev.yourdomain.com` or `test.yourdomain.com`
- This allows you to send emails to any recipient

#### Option B: Use Resend Test Domain (Limited)
- When using `onboarding@resend.dev`, you can **only send to your own email address** (the one registered with Resend)
- This is a Resend limitation for the test domain
- To send to other recipients, you **must** verify a real domain

#### Option C: Console Logging (Development Only)
- If neither Resend nor SMTP is configured, emails will be logged to console
- Useful for development when you don't need actual email delivery

## Troubleshooting

### Resend Not Working

- Check that `RESEND_API_KEY` is set correctly in `.env`
- Verify the API key is valid in Resend dashboard
- Check that your "From" email is verified in Resend
- Look for error messages in the console logs

### SMTP Not Working

- Verify SMTP credentials are correct
- Check firewall/network settings
- For Gmail, use an "App Password" instead of your regular password
- Ensure `SMTP_SECURE` matches your server's SSL/TLS configuration

### Emails Not Sending

- Check console logs for error messages
- Verify environment variables are loaded correctly
- In development, emails may be logged to console instead of sent
- Check that `NODE_ENV` is set correctly

