import { X, ChevronLeft, Minimize2, Hash, Menu } from 'lucide-react';
import React from 'react';

interface AppHeaderProps {
  appName: string;
  organizationSlug?: string;
  onClose?: () => void;
  onMinimize?: () => void;
  notificationsComponent?: React.ReactNode;
  theme: {
    colors: {
      surface: string;
      border: string;
      text: string;
      textSecondary: string;
    };
  };
  navigate: (path: string, options?: any) => void;
  showCloseMinimize?: boolean; // Show close/minimize buttons in header (when right sidebar is not available)
  sidebarCollapsed?: boolean; // Whether the sidebar is collapsed
  onToggleSidebar?: () => void; // Function to toggle sidebar
}

export function AppHeader({
  appName,
  organizationSlug,
  onClose,
  onMinimize,
  notificationsComponent,
  theme,
  navigate,
  showCloseMinimize = false,
  sidebarCollapsed = false,
  onToggleSidebar,
}: AppHeaderProps) {
  const handleClose = () => {
    // onClose should handle confirmation dialog in parent component
    if (onClose) {
      onClose();
    } else if (organizationSlug) {
      navigate(`/org/${organizationSlug}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div
      className="h-12 border-b flex items-center justify-between px-4 flex-shrink-0 transition-colors duration-300"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={handleClose}
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
          title="Back to Dashboard"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        {/* Menu button - only show when sidebar is collapsed */}
        {sidebarCollapsed && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
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
          {appName}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {notificationsComponent}
        {/* Close and minimize buttons - show when right sidebar is not available (e.g., mero-board) */}
        {showCloseMinimize && (
          <>
            {onMinimize && (
              <button
                onClick={onMinimize}
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
                title="Minimize App"
              >
                <Minimize2 className="h-5 w-5" />
              </button>
            )}
            {onClose && (
              <button
                onClick={handleClose}
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
                title="Close App"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

