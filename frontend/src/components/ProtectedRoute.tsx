import React from 'react';
import { useLocation } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { UnauthorizedAccess } from './UnauthorizedAccess';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string | null;
  featureName?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  featureName,
}) => {
  const { hasPermission, isOwner, isLoadingPermissions } = usePermissions();
  const location = useLocation();
  const { _hasHydrated } = useAuthStore();

  // Wait for hydration and permission loading
  if (!_hasHydrated || isLoadingPermissions) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#36393f', color: '#ffffff' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // If no permission required, allow access
  if (!requiredPermission) {
    return <>{children}</>;
  }

  // Owner has all permissions
  if (isOwner) {
    return <>{children}</>;
  }

  // Check if user has permission
  if (!hasPermission(requiredPermission)) {
    return (
      <UnauthorizedAccess
        feature={featureName || location.pathname}
        message={`You do not have permission to access this page. Please ask your organization owner to set up the "${requiredPermission}" permission for your role.`}
      />
    );
  }

  return <>{children}</>;
};

