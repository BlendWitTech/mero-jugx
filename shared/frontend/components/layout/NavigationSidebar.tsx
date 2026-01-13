import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LucideIcon, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  permission?: string | null;
}

export interface NavigationSidebarProps {
  items: NavigationItem[];
  title: string;
  organizationName?: string; // Add organization name prop
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
  };
  profileHref?: string;
  membersSection?: React.ReactNode;
  theme: {
    colors: {
      surface: string;
      border: string;
      text: string;
      textSecondary: string;
      background: string;
      primary: string;
    };
  };
  defaultCollapsed?: boolean;
  sidebarBehavior?: 'lock' | 'hover'; // 'lock' = always visible, 'hover' = show on hover when collapsed
  buildHref?: (href: string) => string;
  checkActive?: (href: string, currentPath: string) => boolean;
  hasPermission?: (permission: string) => boolean;
  isLoadingPermissions?: boolean;
  className?: string;
  onLogout?: () => void; // Add logout handler prop
}

export function NavigationSidebar({
  items,
  title,
  organizationName,
  user,
  profileHref,
  membersSection,
  theme,
  defaultCollapsed = false,
  sidebarBehavior = 'lock',
  buildHref,
  checkActive,
  hasPermission,
  isLoadingPermissions = false,
  className = '',
  onLogout,
}: NavigationSidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setCollapsed(saved === 'true');
    }
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', collapsed.toString());
  }, [collapsed]);

  const isActive = (href: string): boolean => {
    if (checkActive) {
      return checkActive(href, location.pathname);
    }
    const finalHref = buildHref ? buildHref(href) : href;
    const currentPath = location.pathname;
    return currentPath === finalHref || (href !== '/' && currentPath.startsWith(finalHref));
  };

  const shouldShowExpanded = sidebarBehavior === 'lock' ? !collapsed : (!collapsed || isHovered);

  return (
    <div
      className={`flex flex-col flex-shrink-0 transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[240px]'
      } ${className}`}
      style={{ backgroundColor: theme.colors.surface }}
      onMouseEnter={() => {
        if (sidebarBehavior === 'hover' && collapsed) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => {
        if (sidebarBehavior === 'hover') {
          setIsHovered(false);
        }
      }}
    >
      {/* Navigation Section */}
      <div className={`px-2 pt-2 pb-2 ${collapsed ? 'px-1' : ''}`}>
        <div className={`px-2 py-1.5 mb-1 ${collapsed ? 'px-0' : ''} flex items-center justify-between`}>
          {shouldShowExpanded ? (
            <>
              <h2
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: theme.colors.textSecondary }}
              >
                {organizationName || title}
              </h2>
              {sidebarBehavior === 'lock' && (
                <button
                  onClick={() => setCollapsed(true)}
                  className="transition-colors"
                  style={{ color: theme.colors.textSecondary }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = theme.colors.text)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = theme.colors.textSecondary)}
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
            </>
          ) : (
            sidebarBehavior === 'lock' && (
              <button
                onClick={() => setCollapsed(false)}
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
                title={title || 'Expand sidebar'}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )
          )}
        </div>
        <nav className={`space-y-0.5 ${collapsed && !isHovered ? 'space-y-2' : ''}`}>
          {!isLoadingPermissions &&
            items
              .filter((item) => !item.permission || (hasPermission && hasPermission(item.permission)))
              .map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const finalHref = buildHref ? buildHref(item.href) : item.href;
                const showExpanded = shouldShowExpanded;

                return (
                  <Link
                    key={item.name}
                    to={finalHref}
                    className={`group flex items-center ${
                      collapsed && !isHovered ? 'justify-center' : 'gap-2'
                    } px-2 py-1.5 rounded text-sm font-medium transition-colors relative`}
                    style={
                      active
                        ? {
                            backgroundColor: theme.colors.border,
                            color: theme.colors.text,
                          }
                        : {
                            color: theme.colors.textSecondary,
                          }
                    }
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = theme.colors.border;
                        e.currentTarget.style.color = theme.colors.text;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.colors.textSecondary;
                      }
                    }}
                    title={collapsed && !isHovered ? item.name : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {showExpanded && <span className="truncate">{item.name}</span>}
                    {collapsed && !isHovered && !active && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 rounded-r-full group-hover:h-5 transition-all duration-200"
                        style={{ backgroundColor: theme.colors.text }}
                      />
                    )}
                  </Link>
                );
              })}
        </nav>
      </div>

      {/* Divider */}
      {shouldShowExpanded && <div className="h-[1px] mx-2 my-2" style={{ backgroundColor: theme.colors.border }} />}

      {/* Members Section */}
      {shouldShowExpanded && membersSection && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-2 py-1.5">
            <div className="px-2">
              <h2
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: theme.colors.textSecondary }}
              >
                Members
              </h2>
            </div>
          </div>
          <div
            className="flex-1 overflow-y-auto px-2 scrollbar-thin scrollbar-track-transparent"
            style={{ scrollbarColor: `${theme.colors.border} transparent` }}
          >
            {membersSection}
          </div>
        </div>
      )}

      {/* User Panel at Bottom */}
      {shouldShowExpanded && user && (
        <div className="px-2 py-2" style={{ backgroundColor: theme.colors.border }}>
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
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <span className="text-xs font-semibold text-white">
                {user?.first_name?.[0]}
                {user?.last_name?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: theme.colors.text }}>
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs truncate" style={{ color: theme.colors.textSecondary }}>
                {user?.email || `#${user?.id}`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {onLogout && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLogout();
                  }}
                  className="p-1.5 rounded transition-colors"
                  style={{ color: theme.colors.textSecondary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ed4245';
                    e.currentTarget.style.backgroundColor = theme.colors.border;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = theme.colors.textSecondary;
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

