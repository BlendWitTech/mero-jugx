# Organization User Guide

Complete guide for organizations using Mero Jugx platform.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [User Management](#user-management)
4. [Role Management](#role-management)
5. [Invitations](#invitations)
6. [Packages & Subscriptions](#packages--subscriptions)
7. [Payment & Billing](#payment--billing)
8. [Notifications](#notifications)
9. [Settings](#settings)
10. [Best Practices](#best-practices)

---

## Getting Started

### Creating Your Organization

1. **Register Your Organization**
   - Go to the registration page
   - Fill in organization details:
     - Organization Name
     - Organization Email
     - Organization Slug (URL-friendly identifier)
   - Create your admin account:
     - Email address
     - Password
     - First Name and Last Name
   - Click "Register"

2. **Verify Your Email**
   - Check your email inbox
   - Click the verification link
   - Verify both your personal email and organization email

3. **Complete Setup**
   - Login with your credentials
   - Complete your profile
   - Set up two-factor authentication (recommended)

### First Login

After registration:
1. You'll be automatically logged in
2. You'll have **Organization Owner** role
3. You can start inviting team members
4. Your organization starts with the **Freemium** package

---

## Dashboard Overview

### Main Dashboard

The dashboard provides an overview of your organization:

- **Organization Statistics**
  - Total users
  - Active users
  - Total roles
  - Current package

- **Recent Activity**
  - Recent user additions
  - Recent invitations
  - Recent role changes

- **Quick Actions**
  - Invite new users
  - Create new roles
  - Upgrade package
  - View audit logs

### Navigation

The sidebar provides access to:
- **Dashboard** - Overview and statistics
- **Users** - Manage organization members
- **Organizations** - Organization settings
- **Invitations** - Manage user invitations
- **Roles** - Role and permission management
- **Packages** - Package and subscription management
- **Audit Logs** - View activity history
- **Settings** - Organization and user settings

---

## User Management

### Viewing Users

1. Navigate to **Users** from the sidebar
2. View all organization members
3. See user details:
   - Name and email
   - Assigned role
   - Status (Active/Inactive)
   - Join date

### Adding Users

**Method 1: Invite Users (Recommended)**
1. Go to **Invitations**
2. Click "Invite User"
3. Enter user email
4. Select role
5. Add optional message
6. Send invitation

**Method 2: Direct Addition**
1. Go to **Users**
2. Click "Add User"
3. Enter user details
4. Assign role
5. User receives invitation email

### Managing Users

**Update User Information**
1. Go to **Users**
2. Click on a user
3. Click "Edit"
4. Update information
5. Save changes

**Change User Role**
1. Go to **Users**
2. Click on a user
3. Click "Change Role"
4. Select new role
5. Confirm change

**Remove User**
1. Go to **Users**
2. Click on a user
3. Click "Remove"
4. Confirm removal
5. User's access is revoked immediately

**Important**: Removing a user transfers their data ownership to you (Organization Owner).

---

## Role Management

### Understanding Roles

**Default Roles:**
- **Organization Owner** - Full access, cannot be removed
- **Admin** - Administrative access with most permissions

**Custom Roles:**
- Created by Organization Owner or users with role creation permission
- Can have custom permissions
- Based on role templates

### Creating Roles

1. Go to **Roles**
2. Click "Create Role"
3. Select a role template
4. Customize permissions:
   - Use template defaults
   - Add additional permissions
   - Or use custom permissions (override template)
5. Name your role
6. Save

### Managing Roles

**View Role Details**
- Click on any role to see:
  - Assigned permissions
  - Users with this role
  - Role description

**Edit Role**
1. Click on a role
2. Click "Edit"
3. Modify permissions
4. Save changes

**Delete Role**
1. Click on a role
2. Click "Delete"
3. Confirm deletion
4. Users with this role will need a new role assigned

**Note**: Default roles (Owner, Admin) cannot be deleted or modified.

### Role Templates

Role templates provide pre-configured permission sets:
- **Manager** - Team management permissions
- **Editor** - Content editing permissions
- **Viewer** - Read-only permissions
- And more...

You can customize any template when creating a role.

---

## Invitations

### Sending Invitations

1. Go to **Invitations**
2. Click "Invite User"
3. Fill in details:
   - **Email**: User's email address
   - **Role**: Role to assign
   - **Message**: Optional welcome message
4. Click "Send Invitation"

### Managing Invitations

**View Invitation Status**
- **Pending**: Waiting for user to accept
- **Accepted**: User has joined
- **Expired**: Invitation expired (3 days)
- **Cancelled**: Invitation was cancelled

**Resend Invitation**
1. Find the invitation
2. Click "Resend"
3. New invitation email is sent

**Cancel Invitation**
1. Find the invitation
2. Click "Cancel"
3. Invitation is cancelled
4. If user already joined, they will be removed

### Accepting Invitations

**For New Users:**
1. Receive invitation email
2. Click "Accept Invitation"
3. Create account:
   - Set password
   - Enter name
   - Complete profile
4. Automatically join organization

**For Existing Users:**
1. Receive invitation email
2. Click "Accept Invitation"
3. Login if needed
4. Automatically join organization

---

## Packages & Subscriptions

### Understanding Packages

**Package Tiers:**
- **Freemium** - Free tier with basic features
- **Basic** - Entry-level paid package
- **Premium** - Advanced features
- **Enterprise** - Full feature access

**Package Features:**
- User limits
- Role limits
- Additional features (user upgrades, role upgrades)

### Viewing Your Package

1. Go to **Packages**
2. View current package:
   - Package name and description
   - User and role limits
   - Expiration date
   - Auto-renewal status
   - Active features
   - Total monthly cost

### Upgrading Your Package

1. Go to **Packages**
2. View available packages
3. Click "Upgrade" on desired package
4. Select subscription period:
   - 3 months
   - 6 months (4% discount)
   - 1 year (7.5% discount)
   - Custom period (10% discount for >1 year)
5. Review pricing:
   - New package price
   - Period discount
   - Prorated credit (if upgrading mid-subscription)
   - Final price
6. Choose payment method (eSewa or Stripe)
7. Complete payment
8. Package is upgraded immediately

**Note**: You can upgrade mid-subscription. The system calculates prorated credit for unused time.

### Package Features

**Purchasing Features:**
1. Go to **Packages**
2. Scroll to "Available Features"
3. Click "Purchase" on desired feature
4. Complete payment
5. Feature is activated immediately

**Cancelling Features:**
1. Go to **Packages**
2. Find active feature
3. Click "Cancel"
4. Confirm cancellation
5. Feature expires at end of billing period

**Important**: Ensure you don't exceed limits when cancelling features.

### Auto-Renewal

**Enable Auto-Renewal:**
1. Go to **Packages**
2. Expand "Current Package"
3. Toggle "Auto-Renewal" ON
4. Package will automatically renew before expiration

**Disable Auto-Renewal:**
1. Toggle "Auto-Renewal" OFF
2. Package will expire at end of period
3. Organization reverts to Freemium

### Package Expiration

**Notifications:**
- 7 days before expiration: One notification
- 3 days before expiration: Daily notifications
- Email notifications to organization email and admin

**After Expiration:**
- Organization reverts to Freemium package
- Some features may be limited
- Upgrade anytime to restore access

---

## Payment & Billing

### Payment Methods

**eSewa** (Nepal):
- Select eSewa as payment method
- Redirected to eSewa payment page
- Complete payment
- Automatically redirected back

**Stripe** (International):
- Select Stripe as payment method
- Enter card details
- Complete payment
- Automatically processed

### Payment History

1. Go to **Packages**
2. View payment history
3. See all transactions:
   - Date and time
   - Amount
   - Payment method
   - Status
   - Related package/feature

### Payment Verification

- Payments are automatically verified
- You'll receive email confirmation
- Package/feature is activated immediately
- If payment fails, you'll be notified

---

## Notifications

### Notification Types

**In-App Notifications:**
- User invitations
- Role assignments
- Package updates
- Security alerts
- And more...

**Email Notifications:**
- Invitation emails
- Package expiration warnings
- Payment confirmations
- Security alerts
- And more...

### Managing Notifications

**View Notifications:**
1. Click notification bell icon (top right)
2. View all notifications
3. Mark as read
4. Click to view details

**Notification Preferences:**
1. Go to **Settings**
2. Navigate to "Notifications"
3. Configure preferences:
   - Enable/disable email notifications
   - Enable/disable in-app notifications
   - Set preferences by notification type
4. Save preferences

**Organization-Level Preferences:**
- Organization Owner can set organization-wide preferences
- Applies to all organization members
- Can override personal preferences

---

## Settings

### Organization Settings

**Update Organization Information:**
1. Go to **Organizations**
2. Click "Edit Organization"
3. Update:
   - Organization name
   - Organization email
   - Phone number
   - Address
   - Website
   - Description
4. Save changes

**Organization Documents:**
1. Go to **Organizations**
2. Navigate to "Documents"
3. Upload documents:
   - Click "Upload Document"
   - Select file
   - Add description
   - Upload
4. View documents in gallery
5. Delete documents if needed

### User Settings

**Update Profile:**
1. Click on your profile (sidebar)
2. Go to **Profile**
3. Update:
   - First name and last name
   - Email address
   - Phone number
   - Profile picture (if available)
4. Save changes

**Change Password:**
1. Go to **Profile**
2. Click "Change Password"
3. Enter current password
4. Enter new password
5. Confirm new password
6. Save

**Two-Factor Authentication (2FA):**
1. Go to **Profile** or **Settings**
2. Navigate to "Security"
3. Click "Enable 2FA"
4. Scan QR code with authenticator app
5. Enter verification code
6. Complete setup

**Disable 2FA:**
1. Go to **Profile** or **Settings**
2. Navigate to "Security"
3. Click "Disable 2FA"
4. Enter verification code
5. Confirm disable

---

## Best Practices

### Security

1. **Enable 2FA**
   - Protect your account with two-factor authentication
   - Use authenticator apps (Google Authenticator, Authy)

2. **Strong Passwords**
   - Use complex passwords
   - Change passwords regularly
   - Don't share passwords

3. **Role Management**
   - Assign minimum required permissions
   - Review role assignments regularly
   - Remove access for former team members

4. **Monitor Activity**
   - Regularly review audit logs
   - Check for suspicious activity
   - Review user access periodically

### User Management

1. **Invite Before Adding**
   - Always use invitations for new users
   - Allows users to set up their own accounts
   - Better security and user experience

2. **Role Assignment**
   - Assign appropriate roles
   - Don't give excessive permissions
   - Use custom roles for specific needs

3. **Regular Cleanup**
   - Remove inactive users
   - Cancel unused features
   - Review package usage

### Package Management

1. **Monitor Usage**
   - Check user and role limits regularly
   - Upgrade before hitting limits
   - Plan for growth

2. **Subscription Planning**
   - Choose appropriate subscription period
   - Enable auto-renewal for convenience
   - Review package needs periodically

3. **Feature Management**
   - Only purchase needed features
   - Cancel unused features
   - Monitor feature usage

### Communication

1. **Use Invitation Messages**
   - Add welcome messages to invitations
   - Provide context for new users
   - Include organization information

2. **Notification Preferences**
   - Configure notification preferences
   - Don't disable important notifications
   - Review preferences regularly

---

## Troubleshooting

### Common Issues

**Can't Login:**
- Check email and password
- Verify email is verified
- Check if account is active
- Contact organization admin

**Can't Invite Users:**
- Check user limit in package
- Verify you have invitation permission
- Check if email is already a member

**Package Not Upgrading:**
- Verify payment completed
- Check payment status
- Contact support if issue persists

**Notifications Not Working:**
- Check notification preferences
- Verify email settings
- Check spam folder

### Getting Help

1. **Check Documentation**
   - Review this guide
   - Check FAQ section
   - Review API documentation

2. **Contact Support**
   - Email: support@merojugx.com
   - Include organization details
   - Describe issue clearly

3. **Audit Logs**
   - Review audit logs for activity
   - Check for error messages
   - Identify issue patterns

---

## Quick Reference

### Keyboard Shortcuts

- `Ctrl/Cmd + K` - Quick search (if available)
- `Esc` - Close modals/dropdowns

### Important Links

- Dashboard: `/`
- Users: `/users`
- Roles: `/roles`
- Packages: `/packages`
- Settings: `/settings`
- Profile: `/profile`

### Support

- Email: support@merojugx.com
- Documentation: Available in dashboard
- API Docs: http://your-domain.com/api/docs

---

**Last Updated**: 2025-01-22

**Version**: 1.0.0

