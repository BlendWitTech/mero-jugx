import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Taskbar from '../Taskbar/Taskbar';
import { AppHeader } from '../AppHeader';

interface MeroJugxLayoutProps {
  children?: ReactNode;
  showRightSidebar?: boolean;
  rightSidebar?: ReactNode;
  isAppOpen?: boolean;
  appName?: string;
  organizationSlug?: string;
  onAppClose?: () => void;
  // Dependencies
  theme: {
    colors: {
      surface: string;
      border: string;
      background: string;
      text: string;
      textSecondary: string;
      primary: string;
    };
  };
  organization?: {
    slug?: string;
  } | null;
  navigate: (path: string, options?: any) => void;
  getActiveAppIds: () => number[];
  removeAppSession: (appId: number) => void;
}

export function MeroJugxLayout({
  children,
  showRightSidebar = true,
  rightSidebar,
  isAppOpen = false,
  appName,
  organizationSlug,
  onAppClose,
  theme,
  organization,
  navigate,
  getActiveAppIds,
  removeAppSession,
}: MeroJugxLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Taskbar - Small Left Sidebar */}
      <Taskbar 
        position="left" 
        visibility="always"
        theme={theme}
        organization={organization}
        navigate={navigate}
        getActiveAppIds={getActiveAppIds}
        removeAppSession={removeAppSession}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* App Header - Only shown when app is open */}
        {isAppOpen && appName && (
          <AppHeader
            appName={appName}
            organizationSlug={organizationSlug}
            onClose={onAppClose}
            theme={theme}
            navigate={navigate}
          />
        )}
        
        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Navigation */}
          <div className="flex-shrink-0">
            {children}
          </div>
          
          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
          
          {/* Right Sidebar - Only shown when not in app and showRightSidebar is true */}
          {!isAppOpen && showRightSidebar && rightSidebar && (
            <div className="flex-shrink-0">
              {rightSidebar}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

