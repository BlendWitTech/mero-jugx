import { Outlet, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
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
} from 'lucide-react';
import { useState, useEffect } from 'react';
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

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, permission: null },
  { name: 'Users', href: '/users', icon: Users, permission: 'users.view' },
  { name: 'Organizations', href: '/organizations', icon: Building2, permission: null },
  { name: 'Invitations', href: '/invitations', icon: Mail, permission: 'invitations.view' },
  { name: 'Roles', href: '/roles', icon: Shield, permission: 'roles.view' },
  { name: 'Packages', href: '/packages', icon: Package, permission: 'packages.view' },
  { name: 'Audit Logs', href: '/audit-logs', icon: Activity, permission: 'audit.view' },
  { name: 'Documentation', href: '/documentation', icon: BookOpen, permission: null },
  { name: 'Settings', href: '/settings', icon: Settings, permission: null },
];

// Channels/applications - empty for now, will be populated when applications are opened
const channels: Array<{ id: string; name: string; icon: any }> = [];

export default function OrganizationDashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const { user, logout, accessToken, organization: orgFromStore, _hasHydrated, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();
  const { hasPermission } = usePermissions();
  
  // Get organization slug from URL or store
  const orgSlug = slug || orgFromStore?.slug || '';

  // Fetch current organization details
  const { data: currentOrganization } = useQuery({
    queryKey: ['current-organization'],
    queryFn: async () => {
      const response = await api.get('/organizations/me');
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    onSuccess: (data) => {
      // Update organization in store with slug if it's missing
      if (data && data.slug && (!orgFromStore?.slug || orgFromStore.slug !== data.slug)) {
        useAuthStore.getState().setOrganization({
          id: data.id,
          name: data.name || '',
          slug: data.slug,
        });
      }
    },
  });

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

  return (
    <div className="flex h-screen bg-[#36393f] text-gray-100 overflow-hidden">
      {/* Left Sidebar - Channels/Applications */}
      <div className="w-[72px] bg-[#202225] flex flex-col items-center py-2 space-y-2 flex-shrink-0">
        {/* Organization Switcher Icon */}
        <div className="mb-2">
          <OrganizationSwitcher compact={true} />
        </div>

        {/* Divider */}
        <div className="w-8 h-[2px] bg-[#36393f] rounded-full mx-auto mb-2"></div>

        {/* Channels/Applications - Will show opened applications here */}
        {channels.length > 0 && (
          <div className="flex-1 space-y-2 overflow-y-auto w-full scrollbar-thin scrollbar-thumb-[#36393f] scrollbar-track-transparent">
            {channels.map((channel) => {
              const Icon = channel.icon;
              const isActive = selectedChannel === channel.id;
              return (
                <button
                  key={channel.id}
                  onClick={() => {
                    setSelectedChannel(channel.id);
                    const path = channel.id === 'dashboard' ? '' : channel.id;
                    navigate(orgSlug ? `/org/${orgSlug}${path ? `/${path}` : ''}` : `/${path}`);
                  }}
                  className={`group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? 'bg-[#5865f2] text-white rounded-2xl'
                      : 'bg-[#36393f] text-[#dcddde] hover:bg-[#5865f2] hover:rounded-2xl hover:text-white'
                  }`}
                  title={channel.name}
                >
                  <Icon className="h-6 w-6" />
                  {!isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-white rounded-r-full group-hover:h-5 transition-all duration-200"></div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Logout Button */}
        <div className="mt-auto pt-2">
          <button
            onClick={handleLogout}
            className="w-12 h-12 rounded-2xl bg-[#ed4245] text-white flex items-center justify-center hover:bg-[#c03537] transition-all duration-200 shadow-sm hover:shadow-md"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Second Sidebar - Navigation & Members */}
      <div className={`bg-[#2f3136] flex flex-col flex-shrink-0 transition-all duration-300 ${
        leftSidebarCollapsed ? 'w-[72px]' : 'w-[240px]'
      }`}>
        {/* Navigation Section */}
        <div className={`px-2 pt-2 pb-2 ${leftSidebarCollapsed ? 'px-1' : ''}`}>
          <div className={`px-2 py-1.5 mb-1 ${leftSidebarCollapsed ? 'px-0' : ''} flex items-center justify-between`}>
            {!leftSidebarCollapsed ? (
              <>
                <h2 className="text-xs font-semibold text-[#8e9297] uppercase tracking-wide">
                  {organization?.name || 'No Organization'}
                </h2>
                <button
                  onClick={() => setLeftSidebarCollapsed(true)}
                  className="text-[#8e9297] hover:text-[#dcddde] transition-colors"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setLeftSidebarCollapsed(false)}
                className="w-full flex items-center justify-center p-1.5 text-[#8e9297] hover:text-[#dcddde] hover:bg-[#393c43] rounded transition-colors"
                title={organization?.name || 'Expand sidebar'}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
          <nav className={`space-y-0.5 ${leftSidebarCollapsed ? 'space-y-2' : ''}`}>
            {navigation
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
                    className={`group flex items-center ${leftSidebarCollapsed ? 'justify-center' : 'gap-2'} px-2 py-1.5 rounded text-sm font-medium transition-colors relative ${
                      isActive
                        ? 'bg-[#393c43] text-white'
                        : 'text-[#96989d] hover:bg-[#393c43] hover:text-[#dcddde]'
                    }`}
                    title={leftSidebarCollapsed ? item.name : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!leftSidebarCollapsed && <span className="truncate">{item.name}</span>}
                    {leftSidebarCollapsed && !isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-white rounded-r-full group-hover:h-5 transition-all duration-200"></div>
                    )}
                  </Link>
                );
              })}
          </nav>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-[#202225] mx-2 my-2"></div>

        {/* Members Section */}
        <div className={`flex-1 overflow-hidden flex flex-col ${leftSidebarCollapsed ? 'hidden' : ''}`}>
          <div className="px-2 py-1.5">
            <div className="px-2">
              <h2 className="text-xs font-semibold text-[#8e9297] uppercase tracking-wide">
                Members
              </h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 scrollbar-thin scrollbar-thumb-[#202225] scrollbar-track-transparent">
            <MembersList />
          </div>
        </div>

        {/* User Panel at Bottom */}
        <div className={`bg-[#292b2f] px-2 py-2 ${leftSidebarCollapsed ? 'hidden' : ''}`}>
          <div className="flex items-center gap-2 px-2 py-1.5 bg-[#18191c] rounded hover:bg-[#2d2f33] transition-colors group cursor-pointer">
            <div className="h-8 w-8 rounded-full bg-[#5865f2] flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-white">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-[#b9bbbe] truncate">#{user?.id}</p>
            </div>
            <Link
              to={orgSlug ? `/org/${orgSlug}/profile` : '/profile'}
              className="p-1.5 text-[#b9bbbe] hover:text-white hover:bg-[#393c43] rounded transition-colors"
              onClick={(e) => e.stopPropagation()}
              title="Profile Settings"
            >
              <Cog className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-12 bg-[#36393f] border-b border-[#202225] px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            {leftSidebarCollapsed && (
              <button
                onClick={() => setLeftSidebarCollapsed(false)}
                className="p-1.5 text-[#8e9297] hover:text-white hover:bg-[#393c43] rounded transition-colors"
                title="Expand sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <Hash className="h-5 w-5 text-[#8e9297]" />
            <h1 className="text-base font-semibold text-white">
              {navigation.find(n => 
                n.href === location.pathname || 
                (n.href === '/' && location.pathname === '/') ||
                (n.href !== '/' && location.pathname.startsWith(n.href))
              )?.name || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationDropdown />
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-[#36393f] scrollbar-thin scrollbar-thumb-[#202225] scrollbar-track-transparent">
          <main className="h-full">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="relative">
        {rightSidebarCollapsed ? (
          <button
            onClick={() => setRightSidebarCollapsed(false)}
            className="w-12 h-12 bg-[#2f3136] border-l border-[#202225] text-[#8e9297] hover:text-white hover:bg-[#393c43] flex items-center justify-center transition-colors"
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

      {/* Chat Manager - Handles multiple chat windows */}
      <ChatManager />
    </div>
  );
}

