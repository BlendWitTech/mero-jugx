# Login Access Guide

## Overview

This guide explains how to access the Mero Jugx system, including initial setup, login procedures, and troubleshooting.

## Initial Setup

### 1. Register an Organization

When you first access the system, you need to register an organization:

1. Navigate to the registration page
2. Fill in organization details:
   - **Organization Name**: Your company/organization name
   - **Organization Slug**: URL-friendly identifier (e.g., "acme-corp")
   - **Organization Email**: Contact email for the organization
3. Fill in your user details:
   - **Email**: Your email address (will be your login email)
   - **Password**: Create a strong password
   - **First Name**: Your first name
   - **Last Name**: Your last name
4. Click "Register"
5. Check your email for verification link
6. Click the verification link to verify your email

### 2. Verify Email

After registration:

1. Check your email inbox (and spam folder)
2. Click the verification link in the email
3. You'll be redirected to the login page
4. Your email is now verified

**Note**: You can still login without verifying, but some features may be limited.

## Login Process

### Standard Login

1. Navigate to the login page
2. Enter your **email address**
3. Enter your **password**
4. If you belong to multiple organizations, select the organization
5. Click "Login"

### Login with MFA (Multi-Factor Authentication)

If MFA is enabled for your account:

1. Enter email and password
2. Click "Login"
3. You'll be prompted for a 6-digit code
4. Open your authenticator app (Google Authenticator, Authy, etc.)
5. Enter the code from your authenticator app
6. Click "Verify"

**Note**: You can also use backup codes if you've saved them.

## Accessing the System

### Web Application

**Development**:
- URL: http://localhost:3001
- API: http://localhost:3000

**Production**:
- URL: https://yourdomain.com
- API: https://api.yourdomain.com

### API Access

**Base URL**:
```
Development: http://localhost:3000/api/v1
Production: https://api.yourdomain.com/api/v1
```

**Authentication**:
Include JWT token in Authorization header:
```
Authorization: Bearer {your_access_token}
```

## Default Credentials (Development Only)

After running seeds, you may have default test accounts. **These should never be used in production!**

Check seed files for default credentials if available.

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## Password Reset

### If You Forgot Your Password

1. Go to the login page
2. Click "Forgot Password"
3. Enter your email address
4. Check your email for reset link
5. Click the reset link
6. Enter your new password
7. Confirm your new password
8. Click "Reset Password"
9. Login with your new password

**Note**: Reset links expire after a certain time (typically 1 hour).

## MFA Setup

### Enable MFA

1. Login to your account
2. Go to Settings → Security
3. Click "Enable Two-Factor Authentication"
4. Scan the QR code with your authenticator app
5. Enter the verification code
6. Save your backup codes securely
7. MFA is now enabled

### Authenticator Apps

Recommended apps:
- **Google Authenticator** (iOS/Android)
- **Authy** (iOS/Android/Desktop)
- **Microsoft Authenticator** (iOS/Android)
- **1Password** (if you use 1Password)

### Backup Codes

When you enable MFA, you'll receive backup codes. **Save these securely!**

- Use backup codes if you lose access to your authenticator
- Each code can only be used once
- Generate new codes if you run out

### Disable MFA

1. Go to Settings → Security
2. Click "Disable Two-Factor Authentication"
3. Enter your password to confirm
4. MFA is disabled

## Organization Access

### Multiple Organizations

If you belong to multiple organizations:

1. After login, you'll see organization selector
2. Select the organization you want to access
3. You can switch organizations from the dashboard

### Organization Roles

Your access level depends on your role:
- **Owner**: Full access to organization
- **Admin**: Most permissions except owner-only actions
- **Member**: Limited permissions based on role
- **Custom Roles**: Permissions defined by organization admin

## Session Management

### Session Duration

- **Access Token**: Valid for 15 minutes
- **Refresh Token**: Valid for 7 days
- **Session**: Active until logout or expiration

### Stay Logged In

The system uses refresh tokens to keep you logged in. Your session will automatically refresh as long as:
- You're active within 7 days
- Your refresh token is valid
- You haven't logged out

### Logout

1. Click your profile menu
2. Click "Logout"
3. You'll be logged out and redirected to login

**Note**: Logging out invalidates your current session.

## Troubleshooting

### Can't Login

**Check**:
1. Email address is correct
2. Password is correct (check caps lock)
3. Email is verified (if required)
4. Account is not suspended
5. Organization is active

**Solutions**:
- Reset your password if forgotten
- Check email for verification link
- Contact organization admin if account is suspended

### MFA Code Not Working

**Check**:
1. Time on your device is correct (TOTP is time-based)
2. You're using the correct authenticator app
3. Code hasn't expired (codes refresh every 30 seconds)

**Solutions**:
- Sync time on your device
- Wait for new code
- Use backup code if available
- Contact support if issues persist

### Email Not Received

**Check**:
1. Check spam/junk folder
2. Email address is correct
3. Email service is working

**Solutions**:
- Check spam folder
- Verify email address
- Request new email
- Contact support if persistent

### Account Locked

If you've made too many failed login attempts:

1. Wait 15-30 minutes
2. Try logging in again
3. If still locked, contact support

### Organization Access Denied

**Possible Reasons**:
- You're not a member of the organization
- Your membership was revoked
- Organization is suspended

**Solutions**:
- Contact organization admin
- Request invitation if needed
- Check organization status

## Security Best Practices

1. **Use Strong Passwords**: Follow password requirements
2. **Enable MFA**: Add an extra layer of security
3. **Don't Share Credentials**: Keep your login details private
4. **Logout on Shared Devices**: Always logout on public computers
5. **Save Backup Codes**: Store MFA backup codes securely
6. **Regular Password Updates**: Change password periodically
7. **Monitor Account Activity**: Check for suspicious activity

## API Access

### Getting API Token

1. Login via web interface
2. Get access token from response or localStorage
3. Use token in API requests

### Using API Token

```bash
# Example API call
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     https://api.yourdomain.com/api/v1/users/me
```

### Token Refresh

```bash
# Refresh expired token
curl -X POST https://api.yourdomain.com/api/v1/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refresh_token": "YOUR_REFRESH_TOKEN"}'
```

## Support

If you need help:

1. Check this documentation
2. Review [Troubleshooting](#troubleshooting) section
3. Contact your organization admin
4. Submit a support ticket
5. Check API documentation at `/api/docs`

## Quick Reference

### Login URLs

- **Development**: http://localhost:3001/login
- **Production**: https://yourdomain.com/login

### Password Reset

- **Development**: http://localhost:3001/forgot-password
- **Production**: https://yourdomain.com/forgot-password

### API Documentation

- **Development**: http://localhost:3000/api/docs
- **Production**: https://api.yourdomain.com/api/docs

