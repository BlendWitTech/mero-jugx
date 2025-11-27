import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export function usePermissions() {
  const { isAuthenticated, accessToken, _hasHydrated } = useAuthStore();

  const { data: userData } = useQuery({
    queryKey: ['current-user-permissions'],
    queryFn: async () => {
      const response = await api.get('/users/me');
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  const permissions = userData?.permissions || [];
  const isOrganizationOwner = userData?.role?.is_organization_owner || false;

  const hasPermission = (permission: string): boolean => {
    if (isOrganizationOwner) {
      return true; // Organization owners have all permissions
    }
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList: string[]): boolean => {
    if (isOrganizationOwner) {
      return true;
    }
    return permissionList.some((perm) => permissions.includes(perm));
  };

  const hasAllPermissions = (permissionList: string[]): boolean => {
    if (isOrganizationOwner) {
      return true;
    }
    return permissionList.every((perm) => permissions.includes(perm));
  };

  return {
    permissions,
    isOrganizationOwner,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isLoading: !userData && _hasHydrated && isAuthenticated,
    userData, // Export userData so components can access current user's role
  };
}

