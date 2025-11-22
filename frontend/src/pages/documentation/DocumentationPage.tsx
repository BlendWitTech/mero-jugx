import { useState } from 'react';
import { BookOpen, ChevronRight, Search, FileText, HelpCircle, Settings, Users, Shield, Package, Mail, Activity } from 'lucide-react';

const documentationSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: HelpCircle,
    content: `
# Getting Started

## Creating Your Organization

1. **Register Your Organization**
   - Go to the registration page
   - Fill in organization details (name, email, slug)
   - Create your admin account
   - Click "Register"

2. **Verify Your Email**
   - Check your email inbox
   - Click the verification link
   - Verify both personal and organization emails

3. **Complete Setup**
   - Login with your credentials
   - Complete your profile
   - Set up two-factor authentication (recommended)

## First Login

After registration:
- You'll be automatically logged in
- You'll have **Organization Owner** role
- You can start inviting team members
- Your organization starts with the **Freemium** package
    `,
  },
  {
    id: 'user-management',
    title: 'User Management',
    icon: Users,
    content: `
# User Management

## Viewing Users

1. Navigate to **Users** from the sidebar
2. View all organization members
3. See user details: name, email, role, status, join date

## Adding Users

**Method 1: Invite Users (Recommended)**
1. Go to **Invitations**
2. Click "Invite User"
3. Enter user email and select role
4. Add optional message
5. Send invitation

**Method 2: Direct Addition**
1. Go to **Users**
2. Click "Add User"
3. Enter user details and assign role
4. User receives invitation email

## Managing Users

- **Update User Information**: Click on user → Edit → Update → Save
- **Change User Role**: Click on user → Change Role → Select new role
- **Remove User**: Click on user → Remove → Confirm

**Important**: Removing a user transfers their data ownership to you (Organization Owner).
    `,
  },
  {
    id: 'role-management',
    title: 'Role Management',
    icon: Shield,
    content: `
# Role Management

## Understanding Roles

**Default Roles:**
- **Organization Owner** - Full access, cannot be removed
- **Admin** - Administrative access with most permissions

**Custom Roles:**
- Created by Organization Owner or users with role creation permission
- Can have custom permissions
- Based on role templates

## Creating Roles

1. Go to **Roles**
2. Click "Create Role"
3. Select a role template
4. Customize permissions:
   - Use template defaults
   - Add additional permissions
   - Or use custom permissions (override template)
5. Name your role and save

## Managing Roles

- **View Role Details**: Click on any role to see permissions and assigned users
- **Edit Role**: Click on role → Edit → Modify permissions → Save
- **Delete Role**: Click on role → Delete → Confirm

**Note**: Default roles (Owner, Admin) cannot be deleted or modified.
    `,
  },
  {
    id: 'invitations',
    title: 'Invitations',
    icon: Mail,
    content: `
# Invitations

## Sending Invitations

1. Go to **Invitations**
2. Click "Invite User"
3. Fill in details:
   - **Email**: User's email address
   - **Role**: Role to assign
   - **Message**: Optional welcome message
4. Click "Send Invitation"

## Managing Invitations

**Invitation Status:**
- **Pending**: Waiting for user to accept
- **Accepted**: User has joined
- **Expired**: Invitation expired (3 days)
- **Cancelled**: Invitation was cancelled

**Actions:**
- **Resend**: Click "Resend" to send new invitation email
- **Cancel**: Click "Cancel" to cancel invitation (removes user if already joined)

## Accepting Invitations

**For New Users:**
1. Receive invitation email
2. Click "Accept Invitation"
3. Create account (set password, enter name)
4. Automatically join organization

**For Existing Users:**
1. Receive invitation email
2. Click "Accept Invitation"
3. Login if needed
4. Automatically join organization
    `,
  },
  {
    id: 'packages',
    title: 'Packages & Subscriptions',
    icon: Package,
    content: `
# Packages & Subscriptions

## Understanding Packages

**Package Tiers:**
- **Freemium** - Free tier with basic features
- **Basic** - Entry-level paid package
- **Premium** - Advanced features
- **Enterprise** - Full feature access

## Viewing Your Package

1. Go to **Packages**
2. View current package:
   - Package name and description
   - User and role limits
   - Expiration date
   - Auto-renewal status
   - Active features
   - Total monthly cost

## Upgrading Your Package

1. Go to **Packages**
2. View available packages
3. Click "Upgrade" on desired package
4. Select subscription period:
   - 3 months
   - 6 months (4% discount)
   - 1 year (7.5% discount)
   - Custom period (10% discount for >1 year)
5. Review pricing and choose payment method
6. Complete payment
7. Package is upgraded immediately

**Note**: You can upgrade mid-subscription. The system calculates prorated credit for unused time.

## Package Features

**Purchasing Features:**
1. Go to **Packages** → "Available Features"
2. Click "Purchase" on desired feature
3. Complete payment
4. Feature is activated immediately

**Cancelling Features:**
1. Find active feature
2. Click "Cancel"
3. Confirm cancellation
4. Feature expires at end of billing period

## Auto-Renewal

- **Enable**: Toggle "Auto-Renewal" ON in Current Package section
- **Disable**: Toggle OFF - package expires at end of period, reverts to Freemium
    `,
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Activity,
    content: `
# Notifications

## Notification Types

**In-App Notifications:**
- User invitations
- Role assignments
- Package updates
- Security alerts

**Email Notifications:**
- Invitation emails
- Package expiration warnings
- Payment confirmations
- Security alerts

## Managing Notifications

**View Notifications:**
1. Click notification bell icon (top right)
2. View all notifications
3. Mark as read
4. Click to view details

**Notification Preferences:**
1. Go to **Settings** → "Notifications"
2. Configure preferences:
   - Enable/disable email notifications
   - Enable/disable in-app notifications
   - Set preferences by notification type
3. Save preferences

**Organization-Level Preferences:**
- Organization Owner can set organization-wide preferences
- Applies to all organization members
- Can override personal preferences
    `,
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    content: `
# Settings

## Organization Settings

**Update Organization Information:**
1. Go to **Organizations**
2. Click "Edit Organization"
3. Update: name, email, phone, address, website, description
4. Save changes

**Organization Documents:**
1. Go to **Organizations** → "Documents"
2. Upload documents: Click "Upload Document" → Select file → Add description → Upload
3. View documents in gallery
4. Delete documents if needed

## User Settings

**Update Profile:**
1. Click on your profile (sidebar) → **Profile**
2. Update: name, email, phone, profile picture
3. Save changes

**Change Password:**
1. Go to **Profile** → "Change Password"
2. Enter current password
3. Enter and confirm new password
4. Save

**Two-Factor Authentication (2FA):**
1. Go to **Profile** or **Settings** → "Security"
2. Click "Enable 2FA"
3. Scan QR code with authenticator app
4. Enter verification code
5. Complete setup

**Disable 2FA:**
1. Go to **Profile** or **Settings** → "Security"
2. Click "Disable 2FA"
3. Enter verification code
4. Confirm disable
    `,
  },
];

export default function DocumentationPage() {
  const [selectedSection, setSelectedSection] = useState(documentationSections[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = documentationSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Documentation & Guides</h1>
                <p className="text-sm text-gray-500 mt-1">Learn how to use Mero Jugx platform</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-12rem)]">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-200 overflow-y-auto">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Sections List */}
            <nav className="p-4 space-y-1">
              {filteredSections.map((section) => {
                const Icon = section.icon;
                const isActive = selectedSection.id === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 border border-primary-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{section.title}</span>
                    {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-lg max-w-none">
                <div className="flex items-center gap-3 mb-6">
                  {selectedSection.icon && (
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <selectedSection.icon className="h-6 w-6 text-primary-600" />
                    </div>
                  )}
                  <h1 className="text-3xl font-bold text-gray-900 mb-0">{selectedSection.title}</h1>
                </div>
                <div className="markdown-content">
                  {selectedSection.content.split('\n').map((line, index) => {
                    // Simple markdown rendering
                    if (line.startsWith('# ')) {
                      return <h1 key={index} className="text-3xl font-bold mt-8 mb-4 text-gray-900">{line.substring(2)}</h1>;
                    }
                    if (line.startsWith('## ')) {
                      return <h2 key={index} className="text-2xl font-bold mt-6 mb-3 text-gray-900">{line.substring(3)}</h2>;
                    }
                    if (line.startsWith('### ')) {
                      return <h3 key={index} className="text-xl font-semibold mt-4 mb-2 text-gray-900">{line.substring(4)}</h3>;
                    }
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                      return <li key={index} className="ml-6 list-disc mb-1 text-gray-700">{line.substring(2)}</li>;
                    }
                    if (/^\d+\. /.test(line)) {
                      return <li key={index} className="ml-6 list-decimal mb-1 text-gray-700">{line.replace(/^\d+\. /, '')}</li>;
                    }
                    if (line.trim() === '') {
                      return <br key={index} />;
                    }
                    // Handle bold text
                    const parts = line.split(/(\*\*.*?\*\*)/g);
                    return (
                      <p key={index} className="mb-3 text-gray-700 leading-relaxed">
                        {parts.map((part, partIndex) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={partIndex} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
                          }
                          return <span key={partIndex}>{part}</span>;
                        })}
                      </p>
                    );
                  })}
                </div>
              </div>

              {/* Quick Links */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
                <div className="grid grid-cols-2 gap-4">
                  {documentationSections
                    .filter((s) => s.id !== selectedSection.id)
                    .slice(0, 4)
                    .map((section) => {
                      const Icon = section.icon;
                      return (
                        <button
                          key={section.id}
                          onClick={() => setSelectedSection(section)}
                          className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                        >
                          <Icon className="h-5 w-5 text-primary-600 flex-shrink-0" />
                          <span className="font-medium text-gray-900">{section.title}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

