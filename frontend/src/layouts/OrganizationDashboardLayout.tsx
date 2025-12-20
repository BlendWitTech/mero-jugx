import { Outlet, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../contexts/ThemeContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Mail,
  Shield,
  Package,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Activity,
  User,
  BookOpen,
  MessageSquare,
  Ticket,
  Clock,
  Hash,
  Plus,
  Search,
  Cog,
  RefreshCw,
  BarChart3,
  HelpCircle,
  Grid3x3,
  X,
  Sun,
  Moon,
  CreditCard,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import * as React from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import NotificationDropdown from '../components/NotificationDropdown';
import { usePermissions } from '../hooks/usePermissions';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../services/api';
import OrganizationSwitcher from '../components/OrganizationSwitcher';
import MembersList from '../components/MembersList';
import RightSidebar from '../components/RightSidebar';
import ChatManager from '../components/ChatManager';
import { HelpCenter } from '../components/HelpCenter/HelpCenter';
import { marketplaceService } from '../services/marketplaceService';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, permission: null },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, permission: 'organizations.view' },
  { name: 'Users', href: '/users', icon: Users, permission: 'users.view' },
  { name: 'Organizations', href: '/organizations', icon: Building2, permission: null },
  { name: 'Invitations', href: '/invitations', icon: Mail, permission: 'invitations.view' },
  { name: 'Roles', href: '/roles', icon: Shield, permission: 'roles.view' },
  { name: 'Packages', href: '/packages', icon: Package, permission: 'packages.view' },
  { name: 'Billing', href: '/billing', icon: CreditCard, permission: 'packages.view' },
  { name: 'Apps', href: '/apps', icon: Grid3x3, permission: 'apps.view' },
  { name: 'Audit Logs', href: '/audit-logs', icon: Activity, permission: 'audit.view' },
  { name: 'Documentation and API', href: '/documentation', icon: BookOpen, permission: null },
  { name: 'Settings', href: '/settings', icon: Settings, permission: null },
];

export default function OrganizationDashboardLayout() {
  const { user, logout, accessToken, organization: orgFromStore, _hasHydrated, isAuthenticated } = useAuthStore();
  const { theme, isDark, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();
  const { hasPermission, isLoadingPermissions } = usePermissions();
  
  // Get organization slug from URL or store
  const orgSlug = slug || orgFromStore?.slug || '';

  // Pinned apps for left sidebar
  const { data: pinnedApps } = useQuery({
    queryKey: ['marketplace-pinned'],
    queryFn: marketplaceService.getPinned,
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  // Get last used apps (for opened apps section)
  const { data: lastUsedApps } = useQuery({
    queryKey: ['marketplace-last-used'],
    queryFn: marketplaceService.getLastUsed,
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  // Detect currently opened app from URL
  const currentAppId = React.useMemo(() => {
    const urlParams = new URLSearchParams(location.search);
    const appIdParam = urlParams.get('appId');
    if (appIdParam) return parseInt(appIdParam, 10);
    
    // Also check if path contains /apps/:id
    const pathMatch = location.pathname.match(/\/apps\/(\d+)/);
    if (pathMatch) return parseInt(pathMatch[1], 10);
    
    return null;
  }, [location.pathname, location.search]);

  const { mutate: recordUsage } = useMutation({
    mutationFn: (appId: number) => marketplaceService.recordUsage(appId),
  });

  const handleOpenApp = (app: any) => {
    if (!app) return;
    recordUsage(app.id);
    const path = orgSlug ? `/org/${orgSlug}/apps/${app.id}` : `/apps/${app.id}`;
    navigate(path);
  };

  const handleCloseApp = () => {
    // Remove app session when closing
    if (currentAppId) {
      // Dynamically import to avoid circular dependency
      import('../services/appSessionService').then(({ removeAppSession }) => {
        removeAppSession(currentAppId);
        delete api.defaults.headers.common['X-App-Session'];
      });
    }
    
    // Navigate to dashboard when closing app
    const path = orgSlug ? `/org/${orgSlug}` : '/';
    navigate(path);
  };

  // Fetch current organization details
  const { data: currentOrganization } = useQuery<{ id: string; name: string; slug: string }>({
    queryKey: ['current-organization'],
    queryFn: async () => {
      const response = await api.get('/organizations/me');
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  // Update organization in store with slug if it's missing
  useEffect(() => {
    if (currentOrganization && currentOrganization.slug && (!orgFromStore?.slug || orgFromStore.slug !== currentOrganization.slug)) {
      useAuthStore.getState().setOrganization({
        id: currentOrganization.id,
        name: currentOrganization.name || '',
        slug: currentOrganization.slug,
      });
    }
  }, [currentOrganization, orgFromStore?.slug]);

  // Use fetched organization or fallback to store organization
  const organization = currentOrganization || orgFromStore;
  
  // If we have a slug in URL but it doesn't match organization slug, redirect
  useEffect(() => {
    if (!_hasHydrated || !isAuthenticated || !accessToken) return;
    if (slug && organization?.slug && slug !== organization.slug) {
      navigate(`/org/${organization.slug}${location.pathname.replace(`/org/${slug}`, '')}`, { replace: true });
    } else if (!slug && organization?.slug) {
      navigate(`/org/${organization.slug}${location.pathname}`, { replace: true });
    }
  }, [slug, organization?.slug, _hasHydrated, isAuthenticated, accessToken, navigate, location.pathname]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      logout();
      navigate('/login');
    }
  };

  // Determine active channel based on current route
  useEffect(() => {
    const path = location.pathname.split('/')[1] || 'dashboard';
    setSelectedChannel(path);
  }, [location.pathname]);

  // Check if app is currently open
  const isAppOpen = currentAppId !== null;
  
  return (
    <div 
      className="flex h-screen text-gray-100 overflow-hidden transition-colors duration-300"
      style={{ 
        backgroundColor: theme.colors.background,
        color: theme.colors.text 
      }}
    >
      {/* Left Sidebar - Channels/Applications */}
      <div 
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-[72px] flex flex-col items-center py-2 space-y-2 flex-shrink-0 transition-all duration-300`}
        style={{ backgroundColor: theme.colors.border }}
      >
        {/* Organization Switcher Icon */}
        <div className="mb-2">
          <OrganizationSwitcher compact={true} />
        </div>

        {/* Dashboard Link - Only show when app is open */}
        {isAppOpen && (
          <Link
            to={orgSlug ? `/org/${orgSlug}` : '/'}
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.primary;
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.surface;
              e.currentTarget.style.color = theme.colors.text;
            }}
            title="Dashboard"
          >
            <LayoutDashboard className="h-5 w-5" />
          </Link>
        )}

        {/* Divider */}
        <div className="w-8 h-[2px] rounded-full mx-auto mb-2" style={{ backgroundColor: theme.colors.border }}></div>

        {/* Pinned apps + Currently opened app */}
        <div className="flex-1 flex flex-col min-h-0 w-full items-center">
          {/* Pinned apps section */}
          {pinnedApps && pinnedApps.length > 0 && (
            <div className="space-y-2 mb-2 w-full flex flex-col items-center">
              {pinnedApps.map((app: any) => {
                const isActive = currentAppId === app.id;
                const initial = app.name?.[0]?.toUpperCase() || 'A';
                return (
                  <div key={`pinned-${app.id}`} className="group relative">
                    <button
                      onClick={() => isActive ? handleCloseApp() : handleOpenApp(app)}
                      className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 mx-auto`}
                      style={{
                        ...(isActive ? {
                        backgroundColor: theme.colors.primary,
                        color: '#ffffff'
                      } : {
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text
                        }),
                        ...(app.icon_url ? {
                          backgroundImage: `url(${app.icon_url})`,
                          backgroundSize: 'cover'
                        } : {})
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = theme.colors.primary;
                          e.currentTarget.style.color = '#ffffff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = theme.colors.surface;
                          e.currentTarget.style.color = theme.colors.text;
                        }
                      }}
                      title={isActive ? `Close ${app.name}` : app.name}
                    >
                      {!app.icon_url && <span className="text-sm font-semibold">{initial}</span>}
                      {!isActive && (
                        <div 
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 rounded-r-full group-hover:h-5 transition-all duration-200"
                          style={{ backgroundColor: theme.colors.text }}
                        ></div>
                      )}
                    </button>
                    {isActive && (
                      <div 
                        className="absolute -top-1 -right-1 w-4 h-4 bg-[#ed4245] rounded-full border-2 flex items-center justify-center"
                        style={{ borderColor: theme.colors.surface }}
                      >
                        <X className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Currently opened app section (scrollable) */}
          {lastUsedApps && lastUsedApps.length > 0 && (
            <>
              {pinnedApps && pinnedApps.length > 0 && (
                <div className="w-8 h-[2px] rounded-full mx-auto my-2" style={{ backgroundColor: theme.colors.border }}></div>
              )}
              <div className="flex-1 space-y-2 overflow-y-auto w-full scrollbar-thin scrollbar-track-transparent min-h-0 flex flex-col items-center" style={{ scrollbarColor: `${theme.colors.surface} transparent` }}>
                {lastUsedApps
                  .filter((app: any) => !pinnedApps?.some((p: any) => p.id === app.id)) // Exclude pinned apps
                  .map((app: any) => {
                    const isActive = currentAppId === app.id;
                    const initial = app.name?.[0]?.toUpperCase() || 'A';
                    return (
                      <div key={`opened-${app.id}`} className="group relative">
                        <button
                          onClick={() => isActive ? handleCloseApp() : handleOpenApp(app)}
                          className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 mx-auto`}
                          style={{
                            ...(isActive ? {
                            backgroundColor: theme.colors.primary,
                            color: '#ffffff'
                          } : {
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.text
                            }),
                            ...(app.icon_url ? {
                              backgroundImage: `url(${app.icon_url})`,
                              backgroundSize: 'cover'
                            } : {})
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = theme.colors.primary;
                              e.currentTarget.style.color = '#ffffff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = theme.colors.surface;
                              e.currentTarget.style.color = theme.colors.text;
                            }
                          }}
                          title={isActive ? `Close ${app.name}` : app.name}
                        >
                          {!app.icon_url && <span className="text-sm font-semibold">{initial}</span>}
                          {!isActive && (
                            <div 
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 rounded-r-full group-hover:h-5 transition-all duration-200"
                              style={{ backgroundColor: theme.colors.text }}
                            ></div>
                          )}
                        </button>
                        {isActive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCloseApp();
                            }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-[#ed4245] rounded-full border-2 flex items-center justify-center hover:bg-[#c03537] transition-colors"
                            style={{ borderColor: theme.colors.surface }}
                            title="Close App"
                          >
                            <X className="h-2.5 w-2.5 text-white" />
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </>
          )}

          {/* Empty state */}
          {(!pinnedApps || pinnedApps.length === 0) && (!lastUsedApps || lastUsedApps.length === 0) && (
            <div className="text-[10px] px-2 text-center leading-tight" style={{ color: theme.colors.textSecondary }}>Pin apps to quick launch</div>
          )}
        </div>

        {/* Logout Button - aligned with app buttons */}
        <div className="mt-auto pt-2 w-full flex justify-center">
          <button
            onClick={handleLogout}
            className="w-12 h-12 rounded-2xl bg-[#ed4245] text-white flex items-center justify-center hover:bg-[#c03537] transition-all duration-200 shadow-sm hover:shadow-md"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Second Sidebar - Navigation & Members - Hide when app is open */}
      {!isAppOpen && (
        <div 
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-[72px] md:left-0 z-30 flex flex-col flex-shrink-0 transition-all duration-300 ${
            leftSidebarCollapsed ? 'w-[72px]' : 'w-[240px]'
          }`}
          style={{ backgroundColor: theme.colors.surface }}
        >
        {/* Navigation Section */}
        <div className={`px-2 pt-2 pb-2 ${leftSidebarCollapsed ? 'px-1' : ''}`}>
          <div className={`px-2 py-1.5 mb-1 ${leftSidebarCollapsed ? 'px-0' : ''} flex items-center justify-between`}>
            {!leftSidebarCollapsed ? (
              <>
                <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.colors.textSecondary }}>
                  {organization?.name || 'No Organization'}
                </h2>
                <button
                  onClick={() => setLeftSidebarCollapsed(true)}
                  className="transition-colors"
                  style={{ color: theme.colors.textSecondary }}
                  onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text}
                  onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setLeftSidebarCollapsed(false)}
                className="w-full flex items-center justify-center p-1.5 rounded transition-colors"
                style={{ color: theme.colors.textSecondary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.colors.text;
                  e.currentTarget.style.backgroundColor = theme.colors.border;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.colors.textSecondary;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title={organization?.name || 'Expand sidebar'}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
          <nav className={`space-y-0.5 ${leftSidebarCollapsed ? 'space-y-2' : ''}`}>
            {!isLoadingPermissions && navigation
              .filter((item) => !item.permission || hasPermission(item.permission))
              .map((item) => {
                const Icon = item.icon;
                // Build href with organization slug
                const href = orgSlug ? `/org/${orgSlug}${item.href === '/' ? '' : item.href}` : item.href;
                // Check if current path matches (accounting for slug)
                const currentPath = location.pathname;
                const isActive = currentPath === href || 
                  (item.href === '/' && (currentPath === `/org/${orgSlug}` || currentPath === `/org/${orgSlug}/`)) ||
                  (item.href !== '/' && currentPath.startsWith(href));
                return (
                  <Link
                    key={item.name}
                    to={href}
                    className={`group flex items-center ${leftSidebarCollapsed ? 'justify-center' : 'gap-2'} px-2 py-1.5 rounded text-sm font-medium transition-colors relative`}
                    style={isActive ? {
                      backgroundColor: theme.colors.border,
                      color: theme.colors.text
                    } : {
                      color: theme.colors.textSecondary
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = theme.colors.border;
                        e.currentTarget.style.color = theme.colors.text;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.colors.textSecondary;
                      }
                    }}
                    title={leftSidebarCollapsed ? item.name : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!leftSidebarCollapsed && <span className="truncate">{item.name}</span>}
                    {leftSidebarCollapsed && !isActive && (
                      <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 rounded-r-full group-hover:h-5 transition-all duration-200"
                        style={{ backgroundColor: theme.colors.text }}
                      ></div>
                    )}
                  </Link>
                );
              })}
          </nav>
        </div>

        {/* Divider */}
        <div className="h-[1px] mx-2 my-2" style={{ backgroundColor: theme.colors.border }}></div>

        {/* Members Section */}
        <div className={`flex-1 overflow-hidden flex flex-col ${leftSidebarCollapsed ? 'hidden' : ''}`}>
          <div className="px-2 py-1.5">
            <div className="px-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.colors.textSecondary }}>
                Members
              </h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 scrollbar-thin scrollbar-track-transparent" style={{ scrollbarColor: `${theme.colors.border} transparent` }}>
            <MembersList />
          </div>
        </div>

        {/* User Panel at Bottom */}
        <div className={`px-2 py-2 ${leftSidebarCollapsed ? 'hidden' : ''}`} style={{ backgroundColor: theme.colors.border }}>
          <div 
            className="flex items-center gap-2 px-2 py-1.5 rounded transition-colors group cursor-pointer"
            style={{ backgroundColor: theme.colors.background }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.surface;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.background;
            }}
          >
            <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.colors.primary }}>
              <span className="text-xs font-semibold text-white">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: theme.colors.text }}>
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs truncate" style={{ color: theme.colors.textSecondary }}>#{user?.id}</p>
            </div>
            <Link
              to={orgSlug ? `/org/${orgSlug}/profile` : '/profile'}
              className="p-1.5 rounded transition-colors"
              style={{ color: theme.colors.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.colors.text;
                e.currentTarget.style.backgroundColor = theme.colors.border;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.colors.textSecondary;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={(e) => e.stopPropagation()}
              title="Profile Settings"
            >
              <Cog className="h-4 w-4" />
            </Link>
          </div>
        </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div 
        className="flex-1 flex flex-col overflow-hidden md:ml-0 ml-0 transition-colors duration-300"
        style={{ 
          backgroundColor: theme.colors.background 
        }}
      >
        {/* Top Bar */}
        <div 
          className="h-12 md:h-12 mt-12 md:mt-0 border-b px-4 flex items-center justify-between flex-shrink-0 transition-colors duration-300"
          style={{ 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border 
          }}
        >
          <div className="flex items-center gap-2">
            {leftSidebarCollapsed && (
              <button
                onClick={() => setLeftSidebarCollapsed(false)}
                className="p-1.5 rounded transition-colors"
                style={{ 
                  color: theme.colors.textSecondary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.colors.text;
                  e.currentTarget.style.backgroundColor = theme.colors.border;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.colors.textSecondary;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Expand sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <Hash className="h-5 w-5" style={{ color: theme.colors.textSecondary }} />
            <h1 className="text-base font-semibold" style={{ color: theme.colors.text }}>
              {navigation.find(n => 
                n.href === location.pathname || 
                (n.href === '/' && location.pathname === '/') ||
                (n.href !== '/' && location.pathname.startsWith(n.href))
              )?.name || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md transition-all duration-200"
              aria-label="Toggle theme"
              title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              style={{ 
                color: theme.colors.textSecondary,
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                opacity: 0.7
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.colors.text;
                e.currentTarget.style.backgroundColor = theme.colors.border;
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.colors.textSecondary;
                e.currentTarget.style.backgroundColor = theme.colors.surface;
                e.currentTarget.style.opacity = '0.7';
              }}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setShowHelpCenter(true)}
              className="p-2 rounded-lg transition-colors"
              aria-label="Help Center"
              title="Help Center"
              style={{ 
                color: theme.colors.textSecondary,
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.colors.text;
                e.currentTarget.style.backgroundColor = theme.colors.border;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.colors.textSecondary;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <HelpCircle className="h-5 w-5" />
            </button>
            <NotificationDropdown />
          </div>
        </div>

        {/* Page Content */}
        <div 
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent transition-colors duration-300"
          style={{ 
            backgroundColor: theme.colors.background 
          }}
        >
          <main className="h-full">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Right Sidebar - Hide when app is open */}
      {!isAppOpen && (
        <div className="relative">
          {rightSidebarCollapsed ? (
            <button
              onClick={() => setRightSidebarCollapsed(false)}
              className="w-12 h-12 border-l flex items-center justify-center transition-colors"
              style={{ 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.textSecondary
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.colors.text;
                e.currentTarget.style.backgroundColor = theme.colors.border;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.colors.textSecondary;
                e.currentTarget.style.backgroundColor = theme.colors.surface;
              }}
              title="Expand right sidebar"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <RightSidebar 
              isCollapsed={rightSidebarCollapsed}
              onCollapse={() => setRightSidebarCollapsed(true)}
              onExpand={() => setRightSidebarCollapsed(false)}
            />
          )}
        </div>
      )}

      {/* Chat Manager - Handles multiple chat windows */}
      <ChatManager />
      {showHelpCenter && <HelpCenter onClose={() => setShowHelpCenter(false)} />}
    </div>
  );
}

