import { useState, useEffect } from 'react';
import { BookOpen, Search, FileText, HelpCircle, Settings, Users, Shield, Package, Mail, Activity, Code, Api, Lock, CheckCircle2, TrendingUp, Star, Grid3x3, Sparkles } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { logger } from '../../utils/logger';
import { useNavigate } from 'react-router-dom';

// Main Dashboard Documentation
const mainDocumentationSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: HelpCircle,
    views: 0,
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
    views: 0,
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
    views: 0,
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
4. Customize permissions
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
    views: 0,
    content: `
# Invitations

## Sending Invitations

1. Go to **Invitations**
2. Click "Invite User"
3. Fill in details: email, role, optional message
4. Click "Send Invitation"

## Managing Invitations

**Invitation Status:**
- **Pending**: Waiting for user to accept
- **Accepted**: User has joined
- **Expired**: Invitation expired (3 days)
- **Cancelled**: Invitation was cancelled

**Actions:**
- **Resend**: Click "Resend" to send new invitation email
- **Cancel**: Click "Cancel" to cancel invitation
    `,
  },
  {
    id: 'packages',
    title: 'Packages & Subscriptions',
    icon: Package,
    views: 0,
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
2. View current package details, limits, expiration, and features

## Upgrading Your Package

1. Go to **Packages**
2. View available packages
3. Click "Upgrade" on desired package
4. Select subscription period
5. Complete payment

**Note**: You can upgrade mid-subscription. The system calculates prorated credit for unused time.
    `,
  },
  {
    id: 'apps',
    title: 'Apps & Integrations',
    icon: Grid3x3,
    views: 0,
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

Each app has its own documentation that becomes available after you subscribe. Access it from the app's detail page or from this help center.
    `,
  },
  {
    id: 'chat',
    title: 'Chat & Communication',
    icon: MessageCircle,
    views: 0,
    content: `
# Chat & Communication

## Starting a Chat

**Direct Chat:**
1. Go to **Chat** from the sidebar
2. Click on a user from the members list
3. Start typing your message
4. Press Enter to send

**Group Chat:**
1. Go to **Chat** → Click "Create Group"
2. Enter group name
3. Select members to add
4. Create the group
5. Start chatting

## Mentioning Users

In group chats, you can mention users using @username:
- Type **@** followed by the user's name
- Select the user from the dropdown
- The mentioned user will receive a notification
- You can mention multiple users in one message

## Chat Features

- **File Sharing**: Click the attachment icon to share files
- **Message Reactions**: React to messages with emojis
- **Read Receipts**: See when messages are read
- **Search**: Search through chat history
    `,
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    views: 0,
    content: `
# Settings

## Organization Settings

**Update Organization Information:**
1. Go to **Organizations**
2. Click "Edit Organization"
3. Update: name, email, phone, address, website, description
4. Save changes

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
    views: 0,
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
    views: 0,
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
    views: 0,
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
    views: 0,
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
    views: 0,
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

export default function HelpCenterPage() {
  const { theme } = useTheme();
  const { organization } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'documentation' | 'api'>('documentation');
  const [selectedSection, setSelectedSection] = useState(mainDocumentationSections[0]);
  const [selectedApiEndpoint, setSelectedApiEndpoint] = useState(mainApiEndpoints[0]);
  const [selectedApp, setSelectedApp] = useState<OrganizationApp | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mostViewed, setMostViewed] = useState<string[]>([]);

  // Load most viewed from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('help_center_most_viewed');
    if (stored) {
      try {
        setMostViewed(JSON.parse(stored));
      } catch {
        setMostViewed([]);
      }
    }
  }, []);

  // Track view when section is selected
  useEffect(() => {
    if (selectedSection) {
      const key = `doc_${selectedSection.id}`;
      const currentViews = mostViewed.filter(id => id !== key);
      setMostViewed([key, ...currentViews].slice(0, 10));
      localStorage.setItem('help_center_most_viewed', JSON.stringify([key, ...currentViews].slice(0, 10)));
    }
  }, [selectedSection.id]);

  useEffect(() => {
    if (selectedApiEndpoint) {
      const key = `api_${selectedApiEndpoint.id}`;
      const currentViews = mostViewed.filter(id => id !== key);
      setMostViewed([key, ...currentViews].slice(0, 10));
      localStorage.setItem('help_center_most_viewed', JSON.stringify([key, ...currentViews].slice(0, 10)));
    }
  }, [selectedApiEndpoint.id]);

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

  // Get most viewed sections
  const getMostViewedSections = () => {
    const viewed = mostViewed.slice(0, 5);
    return viewed.map(id => {
      if (id.startsWith('doc_')) {
        const docId = id.replace('doc_', '');
        return mainDocumentationSections.find(s => s.id === docId);
      } else if (id.startsWith('api_')) {
        const apiId = id.replace('api_', '');
        return mainApiEndpoints.find(e => e.id === apiId);
      }
      return null;
    }).filter(Boolean);
  };

  const filteredSections = mainDocumentationSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredApiEndpoints = mainApiEndpoints.filter(endpoint =>
    endpoint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    endpoint.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
    endpoint.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // App-specific documentation
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

  // App-specific API documentation
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

  const mostViewedItems = getMostViewedSections();

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: theme.colors.background }}>
      {/* Header */}
      <div className="px-8 py-6 flex-shrink-0" style={{ backgroundColor: theme.colors.surface, borderBottom: `1px solid ${theme.colors.border}` }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl" style={{ background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)` }}>
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>Help Center</h1>
              <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>Documentation, guides, and API reference for Mero Jugx</p>
            </div>
          </div>
          {/* Search */}
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: theme.colors.textSecondary }} />
            <input
              type="text"
              placeholder="Search documentation and API..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all"
              style={{ 
                backgroundColor: theme.colors.background,
                border: `2px solid ${theme.colors.border}`,
                color: theme.colors.text,
              }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('documentation')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200"
            style={activeTab === 'documentation'
              ? { 
                  backgroundColor: theme.colors.primary,
                  color: 'white',
                  boxShadow: `0 4px 12px ${theme.colors.primary}40`
                }
              : { 
                  color: theme.colors.textSecondary,
                  backgroundColor: 'transparent'
                }
            }
          >
            <FileText className="h-5 w-5" />
            <span>Documentation</span>
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200"
            style={activeTab === 'api'
              ? { 
                  backgroundColor: theme.colors.primary,
                  color: 'white',
                  boxShadow: `0 4px 12px ${theme.colors.primary}40`
                }
              : { 
                  color: theme.colors.textSecondary,
                  backgroundColor: 'transparent'
                }
            }
          >
            <Api className="h-5 w-5" />
            <span>API Reference</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 overflow-y-auto border-r" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <div className="p-6">
            {/* Most Viewed */}
            {mostViewedItems.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4" style={{ color: theme.colors.primary }} />
                  <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                    Most Viewed
                  </h3>
                </div>
                <div className="space-y-2">
                  {mostViewedItems.map((item: any, index) => {
                    if (!item) return null;
                    const Icon = item.icon || Code;
                    return (
                      <button
                        key={`${item.id}-${index}`}
                        onClick={() => {
                          if (item.content) {
                            setActiveTab('documentation');
                            setSelectedSection(item);
                          } else if (item.endpoint) {
                            setActiveTab('api');
                            setSelectedApiEndpoint(item);
                          }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all group"
                        style={{ 
                          backgroundColor: 'transparent',
                          color: theme.colors.textSecondary
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme.colors.background;
                          e.currentTarget.style.color = theme.colors.text;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = theme.colors.textSecondary;
                        }}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium truncate flex-1">{item.title}</span>
                        <Star className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: theme.colors.primary }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'documentation' ? (
              <>
                <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                  Main Dashboard
                </h3>
                <div className="space-y-1 mb-6">
                  {filteredSections.map((section) => {
                    const Icon = section.icon;
                    const isActive = selectedSection.id === section.id && !selectedApp;
                    return (
                      <button
                        key={section.id}
                        onClick={() => {
                          setSelectedSection(section);
                          setSelectedApp(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all"
                        style={isActive
                          ? { 
                              backgroundColor: theme.colors.primary + '15',
                              color: theme.colors.primary,
                              borderLeft: `3px solid ${theme.colors.primary}`
                            }
                          : { 
                              color: theme.colors.textSecondary,
                              backgroundColor: 'transparent'
                            }
                        }
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = theme.colors.background;
                            e.currentTarget.style.color = theme.colors.text;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = theme.colors.textSecondary;
                          }
                        }}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{section.title}</span>
                      </button>
                    );
                  })}
                </div>

                {/* App-specific documentation */}
                {subscribedApps.length > 0 && (
                  <>
                    <div className="h-px my-6" style={{ backgroundColor: theme.colors.border }}></div>
                    <div className="flex items-center gap-2 mb-4">
                      <Lock className="h-4 w-4" style={{ color: theme.colors.primary }} />
                      <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                        App Documentation
                      </h3>
                    </div>
                    <div className="space-y-1">
                      {subscribedApps.map((app) => {
                        const isActive = selectedApp?.app.id === app.app.id;
                        return (
                          <button
                            key={app.app.id}
                            onClick={() => {
                              setSelectedApp(app);
                              setActiveTab('documentation');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all"
                            style={isActive
                              ? { 
                                  backgroundColor: theme.colors.primary + '15',
                                  color: theme.colors.primary,
                                  borderLeft: `3px solid ${theme.colors.primary}`
                                }
                              : { 
                                  color: theme.colors.textSecondary,
                                  backgroundColor: 'transparent'
                                }
                            }
                            onMouseEnter={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.backgroundColor = theme.colors.background;
                                e.currentTarget.style.color = theme.colors.text;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = theme.colors.textSecondary;
                              }
                            }}
                          >
                            <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: theme.colors.primary }} />
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
                <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                  Main Dashboard API
                </h3>
                <div className="space-y-1 mb-6">
                  {filteredApiEndpoints.map((endpoint) => {
                    const isActive = selectedApiEndpoint.id === endpoint.id && !selectedApp;
                    return (
                      <button
                        key={endpoint.id}
                        onClick={() => {
                          setSelectedApiEndpoint(endpoint);
                          setSelectedApp(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all"
                        style={isActive
                          ? { 
                              backgroundColor: theme.colors.primary + '15',
                              color: theme.colors.primary,
                              borderLeft: `3px solid ${theme.colors.primary}`
                            }
                          : { 
                              color: theme.colors.textSecondary,
                              backgroundColor: 'transparent'
                            }
                        }
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = theme.colors.background;
                            e.currentTarget.style.color = theme.colors.text;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = theme.colors.textSecondary;
                          }
                        }}
                      >
                        <Code className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{endpoint.title}</span>
                      </button>
                    );
                  })}
                </div>

                {/* App-specific API */}
                {subscribedApps.length > 0 && (
                  <>
                    <div className="h-px my-6" style={{ backgroundColor: theme.colors.border }}></div>
                    <div className="flex items-center gap-2 mb-4">
                      <Lock className="h-4 w-4" style={{ color: theme.colors.primary }} />
                      <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                        App APIs
                      </h3>
                    </div>
                    <div className="space-y-1">
                      {subscribedApps.map((app) => {
                        const isActive = selectedApp?.app.id === app.app.id;
                        return (
                          <button
                            key={app.app.id}
                            onClick={() => {
                              setSelectedApp(app);
                              setActiveTab('api');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all"
                            style={isActive
                              ? { 
                                  backgroundColor: theme.colors.primary + '15',
                                  color: theme.colors.primary,
                                  borderLeft: `3px solid ${theme.colors.primary}`
                                }
                              : { 
                                  color: theme.colors.textSecondary,
                                  backgroundColor: 'transparent'
                                }
                            }
                            onMouseEnter={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.backgroundColor = theme.colors.background;
                                e.currentTarget.style.color = theme.colors.text;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = theme.colors.textSecondary;
                              }
                            }}
                          >
                            <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: theme.colors.primary }} />
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
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: theme.colors.background }}>
          <div className="max-w-5xl mx-auto p-8">
            {activeTab === 'documentation' ? (
              selectedApp ? (
                // App-specific documentation
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-xl" style={{ background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)` }}>
                      <FileText className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold mb-2" style={{ color: theme.colors.text }}>
                        {selectedApp.app.name} Documentation
                      </h1>
                      <p className="text-base" style={{ color: theme.colors.textSecondary }}>
                        App-specific guides and tutorials
                      </p>
                    </div>
                  </div>
                  <div className="prose prose-lg max-w-none" style={{ color: theme.colors.textSecondary }}>
                    {getAppDocumentation(selectedApp).content.split('\n').map((line, index) => {
                      if (line.startsWith('# ')) {
                        return <h1 key={index} className="text-4xl font-bold mt-10 mb-6" style={{ color: theme.colors.text }}>{line.substring(2)}</h1>;
                      }
                      if (line.startsWith('## ')) {
                        return <h2 key={index} className="text-3xl font-bold mt-8 mb-4" style={{ color: theme.colors.text }}>{line.substring(3)}</h2>;
                      }
                      if (line.trim() === '') {
                        return <br key={index} />;
                      }
                      return (
                        <p key={index} className="mb-4 leading-relaxed text-lg" style={{ color: theme.colors.textSecondary }}>
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // Main documentation
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-8">
                    {selectedSection.icon && (
                      <div className="p-3 rounded-xl" style={{ background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)` }}>
                        <selectedSection.icon className="h-7 w-7 text-white" />
                      </div>
                    )}
                    <div>
                      <h1 className="text-4xl font-bold mb-2" style={{ color: theme.colors.text }}>{selectedSection.title}</h1>
                      <p className="text-base" style={{ color: theme.colors.textSecondary }}>Step-by-step guides and tutorials</p>
                    </div>
                  </div>
                  <div className="prose prose-lg max-w-none" style={{ color: theme.colors.textSecondary }}>
                    {selectedSection.content.split('\n').map((line, index) => {
                      if (line.startsWith('# ')) {
                        return <h1 key={index} className="text-4xl font-bold mt-10 mb-6" style={{ color: theme.colors.text }}>{line.substring(2)}</h1>;
                      }
                      if (line.startsWith('## ')) {
                        return <h2 key={index} className="text-3xl font-bold mt-8 mb-4" style={{ color: theme.colors.text }}>{line.substring(3)}</h2>;
                      }
                      if (line.startsWith('### ')) {
                        return <h3 key={index} className="text-2xl font-semibold mt-6 mb-3" style={{ color: theme.colors.text }}>{line.substring(4)}</h3>;
                      }
                      if (line.startsWith('- ') || line.startsWith('* ')) {
                        return <li key={index} className="ml-8 list-disc mb-2 text-lg" style={{ color: theme.colors.textSecondary }}>{line.substring(2)}</li>;
                      }
                      if (/^\d+\. /.test(line)) {
                        return <li key={index} className="ml-8 list-decimal mb-2 text-lg" style={{ color: theme.colors.textSecondary }}>{line.replace(/^\d+\. /, '')}</li>;
                      }
                      if (line.trim() === '') {
                        return <br key={index} />;
                      }
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <p key={index} className="mb-4 leading-relaxed text-lg" style={{ color: theme.colors.textSecondary }}>
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
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-xl" style={{ background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)` }}>
                      <Api className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold mb-2" style={{ color: theme.colors.text }}>
                        {selectedApp.app.name} API
                      </h1>
                      <p className="text-base" style={{ color: theme.colors.textSecondary }}>
                        API endpoints for {selectedApp.app.name}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="p-8 rounded-2xl shadow-lg" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
                      <div className="flex items-center gap-3 mb-6">
                        <span className="px-4 py-2 rounded-lg text-sm font-mono font-bold" style={{ backgroundColor: theme.colors.primary, color: 'white' }}>
                          {getAppApiDocumentation(selectedApp).method}
                        </span>
                        <code className="text-xl font-mono font-semibold" style={{ color: theme.colors.text }}>
                          {getAppApiDocumentation(selectedApp).endpoint}
                        </code>
                      </div>
                      <p className="mb-6 text-lg" style={{ color: theme.colors.textSecondary }}>
                        {getAppApiDocumentation(selectedApp).description}
                      </p>
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-bold mb-3 text-lg" style={{ color: theme.colors.text }}>Request Headers</h3>
                          <pre className="p-5 rounded-xl text-sm overflow-x-auto font-mono" style={{ backgroundColor: theme.colors.background, color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}>
                            {JSON.stringify(getAppApiDocumentation(selectedApp).request.headers, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h3 className="font-bold mb-3 text-lg" style={{ color: theme.colors.text }}>Response</h3>
                          <pre className="p-5 rounded-xl text-sm overflow-x-auto font-mono" style={{ backgroundColor: theme.colors.background, color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}>
                            {JSON.stringify(getAppApiDocumentation(selectedApp).response, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Main API documentation
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-xl" style={{ background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)` }}>
                      <Api className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold mb-2" style={{ color: theme.colors.text }}>{selectedApiEndpoint.title}</h1>
                      <p className="text-base" style={{ color: theme.colors.textSecondary }}>API endpoint reference</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="p-8 rounded-2xl shadow-lg" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
                      <div className="flex items-center gap-3 mb-6">
                        <span className="px-4 py-2 rounded-lg text-sm font-mono font-bold" style={{ backgroundColor: theme.colors.primary, color: 'white' }}>
                          {selectedApiEndpoint.method}
                        </span>
                        <code className="text-xl font-mono font-semibold" style={{ color: theme.colors.text }}>
                          {selectedApiEndpoint.endpoint}
                        </code>
                      </div>
                      <p className="mb-6 text-lg" style={{ color: theme.colors.textSecondary }}>
                        {selectedApiEndpoint.description}
                      </p>
                      <div className="space-y-6">
                        {selectedApiEndpoint.request.body && (
                          <div>
                            <h3 className="font-bold mb-3 text-lg" style={{ color: theme.colors.text }}>Request Body</h3>
                            <pre className="p-5 rounded-xl text-sm overflow-x-auto font-mono" style={{ backgroundColor: theme.colors.background, color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}>
                              {JSON.stringify(selectedApiEndpoint.request.body, null, 2)}
                            </pre>
                          </div>
                        )}
                        {selectedApiEndpoint.request.headers && (
                          <div>
                            <h3 className="font-bold mb-3 text-lg" style={{ color: theme.colors.text }}>Request Headers</h3>
                            <pre className="p-5 rounded-xl text-sm overflow-x-auto font-mono" style={{ backgroundColor: theme.colors.background, color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}>
                              {JSON.stringify(selectedApiEndpoint.request.headers, null, 2)}
                            </pre>
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold mb-3 text-lg" style={{ color: theme.colors.text }}>Response</h3>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2 text-base" style={{ color: theme.colors.text }}>Success Response</h4>
                              <pre className="p-5 rounded-xl text-sm overflow-x-auto font-mono" style={{ backgroundColor: theme.colors.background, color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}>
                                {JSON.stringify(selectedApiEndpoint.response.success, null, 2)}
                              </pre>
                            </div>
                            {selectedApiEndpoint.response.error && (
                              <div>
                                <h4 className="font-semibold mb-2 text-base" style={{ color: theme.colors.text }}>Error Response</h4>
                                <pre className="p-5 rounded-xl text-sm overflow-x-auto font-mono" style={{ backgroundColor: theme.colors.background, color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}>
                                  {JSON.stringify(selectedApiEndpoint.response.error, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
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

