import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Hook to check if current user has a specific permission
 */
export function usePermissions() {
  const { organization, isAuthenticated, _hasHydrated } = useAuthStore();

  // Fetch current user with role and permissions
  const { data: currentUser, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['current-user-permissions'],
    queryFn: async () => {
      const response = await api.get('/users/me');
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const permissions = useMemo(() => {
    if (!isAuthenticated || !organization || !currentUser) {
      return new Set<string>();
    }

    // Check if user has permissions array directly (from getCurrentUser API)
    if (currentUser.permissions && Array.isArray(currentUser.permissions)) {
      return new Set(currentUser.permissions);
    }

    const userRole = currentUser?.role || currentUser?.membership?.role;

    // Organization owner has all permissions
    if (userRole?.is_organization_owner) {
      return new Set(['*']); // Wildcard means all permissions
    }

    // Get permissions from user's role
    const rolePermissions = userRole?.role_permissions || [];
    const permissionSlugs = rolePermissions
      .map((rp: any) => {
        // Handle both direct permission object and nested permission object
        if (rp.permission?.slug) {
          return rp.permission.slug;
        }
        if (typeof rp === 'string') {
          return rp;
        }
        return null;
      })
      .filter((slug: string | null) => slug);

    // Debug logging in development (only when explicitly enabled via localStorage)
    // To enable: localStorage.setItem('debug-permissions', 'true')
    if (import.meta.env.MODE === 'development' && typeof window !== 'undefined' && window.localStorage?.getItem('debug-permissions') === 'true') {
      console.log('[usePermissions] Current user role:', userRole);
      console.log('[usePermissions] Role permissions:', rolePermissions);
      console.log('[usePermissions] Permission slugs:', permissionSlugs);
    }

    return new Set(permissionSlugs);
  }, [currentUser, organization, isAuthenticated]);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permissionSlug: string): boolean => {
    if (!isAuthenticated) return false;

    // If we don't have currentUser yet and we're still loading, return false
    // This prevents showing buttons before we know the user's permissions
    if (isLoadingPermissions && currentUser === undefined) {
      return false;
    }

    // If we have currentUser but permissions set is empty and we're not an owner,
    // it might mean permissions haven't loaded yet, so return false to be safe
    // But if currentUser exists and has no permissions array and no role_permissions,
    // then the user truly has no permissions
    if (currentUser && permissions.size === 0 && !isLoadingPermissions) {
      // User exists but has no permissions - this is valid (user truly has no permissions)
      return false;
    }

    // Wildcard means all permissions
    if (permissions.has('*')) return true;

    const hasPerm = permissions.has(permissionSlug);

    // Debug logging in development (only when explicitly enabled via localStorage)
    // To enable: localStorage.setItem('debug-permissions', 'true')
    // To disable: localStorage.removeItem('debug-permissions')
    if (import.meta.env.MODE === 'development' && typeof window !== 'undefined' && window.localStorage?.getItem('debug-permissions') === 'true') {
      console.log(`[usePermissions] Checking permission "${permissionSlug}":`, {
        hasPermission: hasPerm,
        availablePermissions: Array.from(permissions),
        currentUser: currentUser ? { id: currentUser.id, email: currentUser.email } : null,
        userRole: currentUser?.role ? { id: currentUser.role.id, name: currentUser.role.name, is_organization_owner: currentUser.role.is_organization_owner } : null,
        permissionsArray: currentUser?.permissions,
        rolePermissions: currentUser?.role?.role_permissions?.length || 0,
        isLoading: isLoadingPermissions,
      });
    }

    return hasPerm;
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (permissionSlugs: string[]): boolean => {
    if (!isAuthenticated) return false;
    if (permissions.has('*')) return true;
    return permissionSlugs.some(slug => permissions.has(slug));
  };

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (permissionSlugs: string[]): boolean => {
    if (!isAuthenticated) return false;
    if (permissions.has('*')) return true;
    return permissionSlugs.every(slug => permissions.has(slug));
  };

  const userRole = currentUser?.role || currentUser?.membership?.role;

  // Check if permissions are actually loaded (not just if query is loading)
  const permissionsLoaded = !isLoadingPermissions && (currentUser !== undefined);

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isOwner: userRole?.is_organization_owner || false,
    userRole,
    userData: currentUser,
    isOrganizationOwner: userRole?.is_organization_owner || false,
    isLoadingPermissions: isLoadingPermissions || (!currentUser && _hasHydrated && isAuthenticated),
    permissionsLoaded,
  };
}

/**
 * Higher-order component to conditionally render based on permissions
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: string
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => {
    const { hasPermission } = usePermissions();

    if (!hasPermission(requiredPermission)) {
      return null;
    }

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withPermission(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}
