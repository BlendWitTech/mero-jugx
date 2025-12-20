import { useState } from 'react';
import { BookOpen, Search, FileText, HelpCircle, Settings, Users, Shield, Package, Mail, Activity, Code, Code2, Lock, CheckCircle2, Grid3x3 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { logger } from '../../utils/logger';

// Main Dashboard Documentation (no login/register since they're already logged in)
const mainDocumentationSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: HelpCircle,
    content: `
# Getting Started

## Welcome to Your Dashboard

Once you're logged in, you can start managing your organization right away.

## First Steps

1. **Complete Your Profile**
   - Go to **Profile** from the sidebar
   - Update your name, email, and profile picture
   - Set up two-factor authentication for security

2. **Invite Team Members**
   - Navigate to **Invitations**
   - Click "Invite User"
   - Enter email and assign role
   - Send invitation

3. **Set Up Roles**
   - Go to **Roles**
   - Create custom roles based on your needs
   - Assign permissions to each role

4. **Explore Apps**
   - Visit **Apps** to see available applications
   - Subscribe to apps that fit your needs
   - Manage app access for your team
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
4. Select subscription period
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
    id: 'apps',
    title: 'Apps & Integrations',
    icon: Grid3x3,
    content: `
# Apps & Integrations

## Browsing Apps

1. Go to **Apps** from the sidebar
2. Browse available apps in the marketplace
3. Use filters to find apps by category
4. Search for specific apps

## Subscribing to Apps

1. Find the app you want
2. Click on the app to view details
3. Review features, pricing, and requirements
4. Click "Subscribe" or "Start Trial"
5. Complete payment if required
6. App is activated for your organization

## Managing App Access

1. Go to **Apps** → Select your subscribed app
2. Click "Manage Access"
3. Grant or revoke access for team members
4. Control who can use the app

## App Documentation

Each app has its own documentation that becomes available after you subscribe. Access it from the app's detail page or from this documentation section.
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

// Main Dashboard API Documentation
const mainApiEndpoints = [
  {
    id: 'auth',
    title: 'Authentication',
    method: 'POST',
    endpoint: '/api/v1/auth/login',
    description: 'Login to your organization account',
    request: {
      body: {
        email: 'string (required)',
        password: 'string (required)',
        organization_id: 'string (optional)',
      },
    },
    response: {
      success: {
        access_token: 'string',
        refresh_token: 'string',
        user: {
          id: 'string',
          email: 'string',
          first_name: 'string',
          last_name: 'string',
        },
        organization: {
          id: 'string',
          name: 'string',
          slug: 'string',
        },
      },
      error: {
        message: 'string',
        status: 401,
      },
    },
  },
  {
    id: 'users',
    title: 'Users',
    method: 'GET',
    endpoint: '/api/v1/users',
    description: 'Get all users in your organization',
    request: {
      headers: {
        Authorization: 'Bearer {access_token}',
      },
    },
    response: {
      success: [
        {
          id: 'string',
          email: 'string',
          first_name: 'string',
          last_name: 'string',
          role: {
            id: 'number',
            name: 'string',
          },
          status: 'active | inactive',
        },
      ],
    },
  },
  {
    id: 'invitations',
    title: 'Invitations',
    method: 'POST',
    endpoint: '/api/v1/invitations',
    description: 'Send an invitation to a new user',
    request: {
      headers: {
        Authorization: 'Bearer {access_token}',
      },
      body: {
        email: 'string (required)',
        role_id: 'number (required)',
        message: 'string (optional)',
      },
    },
    response: {
      success: {
        id: 'string',
        email: 'string',
        status: 'pending',
        expires_at: 'string (ISO date)',
      },
    },
  },
  {
    id: 'roles',
    title: 'Roles',
    method: 'GET',
    endpoint: '/api/v1/roles',
    description: 'Get all roles in your organization',
    request: {
      headers: {
        Authorization: 'Bearer {access_token}',
      },
    },
    response: {
      success: [
        {
          id: 'number',
          name: 'string',
          slug: 'string',
          hierarchy_level: 'number',
          permissions: ['string'],
        },
      ],
    },
  },
  {
    id: 'organizations',
    title: 'Organizations',
    method: 'GET',
    endpoint: '/api/v1/organizations/me',
    description: 'Get current organization details',
    request: {
      headers: {
        Authorization: 'Bearer {access_token}',
      },
    },
    response: {
      success: {
        id: 'string',
        name: 'string',
        slug: 'string',
        email: 'string',
        package: {
          id: 'number',
          name: 'string',
        },
      },
    },
  },
];

interface App {
  id: number;
  name: string;
  slug: string;
  description: string;
  documentation_url: string | null;
}

interface OrganizationApp {
  id: number;
  app_id: number;
  app: App;
  status: 'trial' | 'active' | 'cancelled' | 'expired';
}

export default function DocumentationPage() {
  const { theme } = useTheme();
  const { organization } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'documentation' | 'api'>('documentation');
  const [selectedSection, setSelectedSection] = useState(mainDocumentationSections[0]);
  const [selectedApiEndpoint, setSelectedApiEndpoint] = useState(mainApiEndpoints[0]);
  const [selectedApp, setSelectedApp] = useState<OrganizationApp | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch organization's subscribed apps
  const { data: orgAppsData } = useQuery({
    queryKey: ['organization-apps-docs', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      try {
        const response = await api.get(`/organizations/${organization.id}/apps?status=active`);
        return response.data?.apps || response.data || [];
      } catch (error) {
        logger.error('Failed to fetch organization apps:', error);
        return [];
      }
    },
    enabled: !!organization?.id,
  });

  const subscribedApps = (orgAppsData || []).filter(
    (app: OrganizationApp) => app.status === 'active' || app.status === 'trial'
  ) as OrganizationApp[];

  const filteredSections = mainDocumentationSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredApiEndpoints = mainApiEndpoints.filter(endpoint =>
    endpoint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    endpoint.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
    endpoint.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // App-specific documentation (placeholder - will be fetched from app's documentation_url)
  const getAppDocumentation = (app: OrganizationApp) => {
    return {
      id: `app-${app.app.id}`,
      title: `${app.app.name} Documentation`,
      icon: FileText,
      content: app.app.documentation_url
        ? `# ${app.app.name} Documentation\n\nDocumentation is available at: ${app.app.documentation_url}\n\nPlease visit the link above for complete documentation.`
        : `# ${app.app.name} Documentation\n\nDocumentation for this app is coming soon. Check back later for detailed guides and tutorials.`,
    };
  };

  // App-specific API documentation (placeholder)
  const getAppApiDocumentation = (app: OrganizationApp) => {
    return {
      id: `app-api-${app.app.id}`,
      title: `${app.app.name} API`,
      method: 'GET',
      endpoint: `/api/v1/apps/${app.app.id}/...`,
      description: `API endpoints for ${app.app.name}`,
      request: {
        headers: {
          Authorization: 'Bearer {access_token}',
          'X-App-Session': 'string (app session token)',
        },
      },
      response: {
        success: 'App-specific response format',
      },
    };
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: theme.colors.background }}>
      {/* Header */}
      <div className="px-6 py-4 flex-shrink-0" style={{ backgroundColor: theme.colors.surface, borderBottom: `1px solid ${theme.colors.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary }}>
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>Documentation and API</h1>
              <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>Learn how to use Mero Jugx and integrate with our API</p>
            </div>
          </div>
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: theme.colors.textSecondary }} />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{ 
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text,
              }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('documentation')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap"
            style={activeTab === 'documentation'
              ? { 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  boxShadow: `0 4px 6px -1px ${theme.colors.border}33`
                }
              : { 
                  color: theme.colors.textSecondary
                }
            }
          >
            <FileText className="h-4 w-4" />
            <span className="font-medium text-sm">Documentation</span>
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap"
            style={activeTab === 'api'
              ? { 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  boxShadow: `0 4px 6px -1px ${theme.colors.border}33`
                }
              : { 
                  color: theme.colors.textSecondary
                }
            }
          >
            <Code2 className="h-4 w-4" />
            <span className="font-medium text-sm">API Reference</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 overflow-y-auto border-r" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <div className="p-4">
            {activeTab === 'documentation' ? (
              <>
                <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                  Main Dashboard
                </h3>
                <div className="space-y-1 mb-6">
                  {filteredSections.map((section) => {
                    const Icon = section.icon;
                    const isActive = selectedSection.id === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setSelectedSection(section)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors"
                        style={isActive
                          ? { 
                              backgroundColor: theme.colors.primary + '20',
                              color: theme.colors.primary
                            }
                          : { 
                              color: theme.colors.textSecondary
                            }
                        }
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{section.title}</span>
                      </button>
                    );
                  })}
                </div>

                {/* App-specific documentation */}
                {subscribedApps.length > 0 && (
                  <>
                    <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider flex items-center gap-2" style={{ color: theme.colors.textSecondary }}>
                      <Lock className="h-3 w-3" />
                      App Documentation
                    </h3>
                    <div className="space-y-1">
                      {subscribedApps.map((app) => {
                        const isActive = selectedApp?.app.id === app.app.id;
                        return (
                          <button
                            key={app.app.id}
                            onClick={() => setSelectedApp(app)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors"
                            style={isActive
                              ? { 
                                  backgroundColor: theme.colors.primary + '20',
                                  color: theme.colors.primary
                                }
                              : { 
                                  color: theme.colors.textSecondary
                                }
                            }
                          >
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: theme.colors.primary }} />
                            <span className="text-sm font-medium truncate">{app.app.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                  Main Dashboard API
                </h3>
                <div className="space-y-1 mb-6">
                  {filteredApiEndpoints.map((endpoint) => {
                    const isActive = selectedApiEndpoint.id === endpoint.id;
                    return (
                      <button
                        key={endpoint.id}
                        onClick={() => setSelectedApiEndpoint(endpoint)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors"
                        style={isActive
                          ? { 
                              backgroundColor: theme.colors.primary + '20',
                              color: theme.colors.primary
                            }
                          : { 
                              color: theme.colors.textSecondary
                            }
                        }
                      >
                        <Code className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{endpoint.title}</span>
                      </button>
                    );
                  })}
                </div>

                {/* App-specific API */}
                {subscribedApps.length > 0 && (
                  <>
                    <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider flex items-center gap-2" style={{ color: theme.colors.textSecondary }}>
                      <Lock className="h-3 w-3" />
                      App APIs
                    </h3>
                    <div className="space-y-1">
                      {subscribedApps.map((app) => {
                        const isActive = selectedApp?.app.id === app.app.id;
                        return (
                          <button
                            key={app.app.id}
                            onClick={() => setSelectedApp(app)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors"
                            style={isActive
                              ? { 
                                  backgroundColor: theme.colors.primary + '20',
                                  color: theme.colors.primary
                                }
                              : { 
                                  color: theme.colors.textSecondary
                                }
                            }
                          >
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: theme.colors.primary }} />
                            <span className="text-sm font-medium truncate">{app.app.name} API</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: theme.colors.background }}>
          <div className="max-w-4xl mx-auto">
            {activeTab === 'documentation' ? (
              selectedApp ? (
                // App-specific documentation
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary }}>
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>
                        {selectedApp.app.name} Documentation
                      </h1>
                      <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                        App-specific guides and tutorials
                      </p>
                    </div>
                  </div>
                  <div className="markdown-content" style={{ color: theme.colors.textSecondary }}>
                    {getAppDocumentation(selectedApp).content.split('\n').map((line, index) => {
                      if (line.startsWith('# ')) {
                        return <h1 key={index} className="text-3xl font-bold mt-8 mb-4" style={{ color: theme.colors.text }}>{line.substring(2)}</h1>;
                      }
                      if (line.startsWith('## ')) {
                        return <h2 key={index} className="text-2xl font-bold mt-6 mb-3" style={{ color: theme.colors.text }}>{line.substring(3)}</h2>;
                      }
                      if (line.trim() === '') {
                        return <br key={index} />;
                      }
                      return (
                        <p key={index} className="mb-3 leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // Main documentation
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    {selectedSection.icon && (
                      <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary }}>
                        <selectedSection.icon className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <h1 className="text-3xl font-bold mb-0" style={{ color: theme.colors.text }}>{selectedSection.title}</h1>
                  </div>
                  <div className="markdown-content" style={{ color: theme.colors.textSecondary }}>
                    {selectedSection.content.split('\n').map((line, index) => {
                      if (line.startsWith('# ')) {
                        return <h1 key={index} className="text-3xl font-bold mt-8 mb-4" style={{ color: theme.colors.text }}>{line.substring(2)}</h1>;
                      }
                      if (line.startsWith('## ')) {
                        return <h2 key={index} className="text-2xl font-bold mt-6 mb-3" style={{ color: theme.colors.text }}>{line.substring(3)}</h2>;
                      }
                      if (line.startsWith('### ')) {
                        return <h3 key={index} className="text-xl font-semibold mt-4 mb-2" style={{ color: theme.colors.text }}>{line.substring(4)}</h3>;
                      }
                      if (line.startsWith('- ') || line.startsWith('* ')) {
                        return <li key={index} className="ml-6 list-disc mb-1" style={{ color: theme.colors.textSecondary }}>{line.substring(2)}</li>;
                      }
                      if (/^\d+\. /.test(line)) {
                        return <li key={index} className="ml-6 list-decimal mb-1" style={{ color: theme.colors.textSecondary }}>{line.replace(/^\d+\. /, '')}</li>;
                      }
                      if (line.trim() === '') {
                        return <br key={index} />;
                      }
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <p key={index} className="mb-3 leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                          {parts.map((part, partIndex) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={partIndex} className="font-semibold" style={{ color: theme.colors.text }}>{part.slice(2, -2)}</strong>;
                            }
                            return <span key={partIndex}>{part}</span>;
                          })}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )
            ) : (
              selectedApp ? (
                // App-specific API
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary }}>
                      <Code2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>
                        {selectedApp.app.name} API
                      </h1>
                      <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                        API endpoints for {selectedApp.app.name}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="p-6 rounded-lg" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 rounded text-sm font-mono font-semibold" style={{ backgroundColor: theme.colors.primary, color: 'white' }}>
                          {getAppApiDocumentation(selectedApp).method}
                        </span>
                        <code className="text-lg font-mono" style={{ color: theme.colors.text }}>
                          {getAppApiDocumentation(selectedApp).endpoint}
                        </code>
                      </div>
                      <p className="mb-4" style={{ color: theme.colors.textSecondary }}>
                        {getAppApiDocumentation(selectedApp).description}
                      </p>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-2" style={{ color: theme.colors.text }}>Request Headers</h3>
                          <pre className="p-4 rounded text-sm overflow-x-auto" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
                            {JSON.stringify(getAppApiDocumentation(selectedApp).request.headers, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2" style={{ color: theme.colors.text }}>Response</h3>
                          <pre className="p-4 rounded text-sm overflow-x-auto" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
                            {JSON.stringify(getAppApiDocumentation(selectedApp).response, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Main API documentation
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary }}>
                      <Code2 className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold mb-0" style={{ color: theme.colors.text }}>{selectedApiEndpoint.title}</h1>
                  </div>
                  <div className="space-y-6">
                    <div className="p-6 rounded-lg" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 rounded text-sm font-mono font-semibold" style={{ backgroundColor: theme.colors.primary, color: 'white' }}>
                          {selectedApiEndpoint.method}
                        </span>
                        <code className="text-lg font-mono" style={{ color: theme.colors.text }}>
                          {selectedApiEndpoint.endpoint}
                        </code>
                      </div>
                      <p className="mb-4" style={{ color: theme.colors.textSecondary }}>
                        {selectedApiEndpoint.description}
                      </p>
                      <div className="space-y-4">
                        {selectedApiEndpoint.request.body && (
                          <div>
                            <h3 className="font-semibold mb-2" style={{ color: theme.colors.text }}>Request Body</h3>
                            <pre className="p-4 rounded text-sm overflow-x-auto" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
                              {JSON.stringify(selectedApiEndpoint.request.body, null, 2)}
                            </pre>
                          </div>
                        )}
                        {selectedApiEndpoint.request.headers && (
                          <div>
                            <h3 className="font-semibold mb-2" style={{ color: theme.colors.text }}>Request Headers</h3>
                            <pre className="p-4 rounded text-sm overflow-x-auto" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
                              {JSON.stringify(selectedApiEndpoint.request.headers, null, 2)}
                            </pre>
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold mb-2" style={{ color: theme.colors.text }}>Response</h3>
                          <pre className="p-4 rounded text-sm overflow-x-auto" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
                            {JSON.stringify(selectedApiEndpoint.response, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
