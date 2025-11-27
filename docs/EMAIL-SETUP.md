# Email Setup Guide

## Overview

Mero Jugx supports two email service options: **SMTP** (traditional) and **Resend** (API-based). This guide covers both setups.

## Option 1: SMTP (Traditional)

### Gmail Setup

1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Mero Jugx"
   - Copy the 16-character password

3. Configure `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   SMTP_FROM=noreply@mero-jugx.com
   SMTP_FROM_NAME=Mero Jugx
   ```

### Other SMTP Providers

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
```

## Option 2: Resend (Recommended)

### Setup

1. Sign up: https://resend.com
2. Get API key from dashboard
3. Verify domain (optional, for better deliverability)
4. Configure `.env`:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   SMTP_FROM=noreply@yourdomain.com
   SMTP_FROM_NAME=Mero Jugx
   ```

### Advantages

- Better deliverability
- Email analytics
- Simpler configuration
- No SMTP server management

## Email Types

### 1. Email Verification

**Trigger**: User registration  
**Template**: Welcome email with verification link  
**Link Format**: `{FRONTEND_URL}/verify-email?token={token}`

### 2. Password Reset

**Trigger**: User requests password reset  
**Template**: Password reset email with reset link  
**Link Format**: `{FRONTEND_URL}/reset-password?token={token}`

### 3. Invitation

**Trigger**: User invites another user  
**Template**: Invitation email with acceptance link  
**Link Format**: `{FRONTEND_URL}/accept-invitation?token={token}`

### 4. Notifications

**Trigger**: Various system events  
**Templates**: Custom based on notification type  
**Examples**:
- User added to organization
- Role changed
- Package upgraded
- Security alerts

## Testing Email

### Test Email Sending

```bash
# Check email service logs
# Backend console will show email sending status
```

### Verify Configuration

1. Register a new user
2. Check email inbox (and spam folder)
3. Verify email link works
4. Check email formatting

### Common Issues

#### Gmail Not Sending

- **Issue**: "Less secure app" error
- **Solution**: Use App Password (not regular password)
- **Issue**: Rate limiting
- **Solution**: Use Resend or dedicated SMTP service

#### Emails in Spam

- **Solution**: Verify domain (SPF, DKIM records)
- **Solution**: Use Resend with domain verification
- **Solution**: Configure proper FROM address

#### SMTP Connection Failed

- **Check**: SMTP host and port
- **Check**: Firewall rules
- **Check**: Credentials
- **Check**: TLS/SSL settings

## Production Setup

### Domain Verification

For production, verify your domain:

1. **SPF Record**: Add to DNS
   ```
   v=spf1 include:_spf.resend.com ~all
   ```

2. **DKIM Record**: Add to DNS (provided by Resend)

3. **DMARC Record**: Add to DNS
   ```
   v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
   ```

### Email Templates

Customize email templates in:
- `src/auth/auth.service.ts` (verification, password reset)
- `src/invitations/invitations.service.ts` (invitations)
- `src/notifications/notifications.service.ts` (notifications)

### Monitoring

Monitor email delivery:
- Resend dashboard (if using Resend)
- SMTP server logs
- Application logs
- Bounce/complaint handling

## Best Practices

1. **Use Resend** for better deliverability
2. **Verify domain** for production
3. **Monitor bounce rates**
4. **Handle unsubscribes** (for marketing emails)
5. **Rate limiting** to prevent abuse
6. **Email queue** for high volume
7. **Retry logic** for failed sends
8. **Logging** for debugging

## Environment Variables Summary

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@mero-jugx.com
SMTP_FROM_NAME=Mero Jugx

# Resend Configuration (Alternative)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Application URLs (for email links)
FRONTEND_URL=http://localhost:3001
APP_URL=http://localhost:3000
```

