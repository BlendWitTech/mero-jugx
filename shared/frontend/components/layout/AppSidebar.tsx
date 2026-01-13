import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LucideIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export interface AppSidebarItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  children?: AppSidebarItem[];
  permission?: string | null;
}

export interface SidebarThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
}

export interface AppSidebarProps {
  items: AppSidebarItem[];
  title?: string;
  defaultCollapsed?: boolean;
  onItemClick?: (item: AppSidebarItem) => void;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
  showCollapseButton?: boolean;
  buildHref?: (href: string) => string;
  checkActive?: (href: string, currentPath: string) => boolean;
  theme?: {
    colors: SidebarThemeColors;
  };
}

const defaultTheme: { colors: SidebarThemeColors } = {
  colors: {
    primary: '#5865f2',
    secondary: '#4752c4',
    background: '#ffffff',
    surface: '#f8f9fa',
    text: '#1a1c20',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    accent: '#5865f2',
  },
};

export function AppSidebar({
  items,
  title,
  defaultCollapsed = false,
  onItemClick,
  footer,
  header,
  className = '',
  showCollapseButton = true,
  buildHref,
  checkActive,
  theme: themeProp,
}: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const theme = themeProp || defaultTheme;
  const location = useLocation();

  const isActive = (href: string): boolean => {
    if (checkActive) {
      return checkActive(href, location.pathname);
    }
    const currentPath = location.pathname;
    const finalHref = buildHref ? buildHref(href) : href;
    return currentPath === finalHref || (href !== '/' && currentPath.startsWith(finalHref));
  };

  const renderItem = (item: AppSidebarItem, level: number = 0) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    const finalHref = buildHref ? buildHref(item.href) : item.href;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.name} className={level > 0 ? 'ml-4' : ''}>
        <Link
          to={finalHref}
          onClick={() => onItemClick?.(item)}
          className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-2'
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
          title={collapsed ? item.name : undefined}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="truncate flex-1">{item.name}</span>
              {item.badge && (
                <span
                  className="px-2 py-0.5 text-xs font-semibold rounded-full"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: '#ffffff',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </>
          )}
          {collapsed && !active && (
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 rounded-r-full group-hover:h-5 transition-all duration-200"
              style={{ backgroundColor: theme.colors.text }}
            />
          )}
        </Link>
        {!collapsed && hasChildren && (
          <div className="mt-0.5 space-y-0.5">
            {item.children!.map((child) => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[240px]'
        } ${className}`}
      style={{ backgroundColor: theme.colors.surface }}
    >
      {/* Header */}
      {(title || header || showCollapseButton) && (
        <div className={`px-2 pt-2 pb-2 ${collapsed ? 'px-1' : ''}`}>
          <div
            className={`px-2 py-1.5 mb-1 ${collapsed ? 'px-0' : ''} flex items-center justify-between`}
          >
            {!collapsed ? (
              <>
                {title && (
                  <h2
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {title}
                  </h2>
                )}
                {header}
                {showCollapseButton && (
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
              showCollapseButton && (
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
        </div>
      )}

      {/* Navigation Items */}
      <nav className={`flex-1 overflow-y-auto px-2 space-y-0.5 ${collapsed ? 'space-y-2' : ''} scrollbar-thin scrollbar-track-transparent`} style={{ scrollbarColor: `${theme.colors.border} transparent` }}>
        {items.map((item) => renderItem(item))}
      </nav>

      {/* Footer */}
      {footer && !collapsed && <div className="px-2 py-2">{footer}</div>}
      {footer && collapsed && (
        <div className="px-2 py-2 flex justify-center">{footer}</div>
      )}
    </div>
  );
}

