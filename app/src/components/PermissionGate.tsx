import { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface PermissionGateProps {
  permission: string | string[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 * Hides content if user doesn't have the required permission(s)
 */
export function PermissionGate({ 
  permission, 
  requireAll = false, 
  children, 
  fallback = null 
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  const hasAccess = Array.isArray(permission)
    ? (requireAll ? hasAllPermissions(permission) : hasAnyPermission(permission))
    : hasPermission(permission);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook to check permissions in components
 */
export { usePermissions } from '../hooks/usePermissions';

