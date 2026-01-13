import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Shield,
  Check,
  X,
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  Users,
  Settings,
  Lock,
  Plus,
  ChevronDown,
  ChevronUp,
  Edit2
} from 'lucide-react';
import toast from '@shared/hooks/useToast';
import { Button } from '@shared/components/ui';

// System admin permissions that should be filtered out for organization use
const SYSTEM_ADMIN_PERMISSIONS = [
  'apps.create',
  'apps.edit',
  'apps.delete',
];

export function PermissionsReviewTab() {
  const { isAuthenticated, accessToken, _hasHydrated, organization } = useAuthStore();
  const { isOrganizationOwner, hasPermission } = usePermissions();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'permissions' | 'roles'>('permissions');
  const [expandedRoles, setExpandedRoles] = useState<Set<number>>(new Set());
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<number | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
  const [editingRoleName, setEditingRoleName] = useState<number | null>(null);
  const [roleNameValue, setRoleNameValue] = useState<string>('');
  const [editingHierarchyLevel, setEditingHierarchyLevel] = useState<number | null>(null);
  const [hierarchyLevelValue, setHierarchyLevelValue] = useState<string>('');

  // Fetch package info to determine if organization can create roles
  const { data: packageInfo } = useQuery({
    queryKey: ['current-package'],
    queryFn: async () => {
      const response = await api.get('/organizations/me/package');
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    refetchOnWindowFocus: true,
  });

  const isFreemium = packageInfo?.package?.slug === 'freemium';
  const canCreateRoles = !isFreemium;

  // Check if user has permission to view roles (required for role templates)
  const canViewRoles = isOrganizationOwner || hasPermission('roles.view');
  // Check if user has permission to edit roles
  const canEditRoles = isOrganizationOwner || hasPermission('roles.edit');
  // Note: canCreateRolesPermission is checked in the mutation and UI, but we fetch templates if user can view roles

  // Fetch role templates (only if user has roles.view permission and package allows role creation)
  const { data: roleTemplates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['role-templates'],
    queryFn: async () => {
      try {
        const response = await api.get('/role-templates');
        return Array.isArray(response.data) ? response.data : [];
      } catch (error: any) {
        // If 403, user doesn't have permission - return empty array silently
        if (error.response?.status === 403) {
          return [];
        }
        throw error;
      }
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken && canViewRoles && canCreateRoles,
    retry: false, // Don't retry on permission errors
  });

  // Create role from template mutation
  const createFromTemplateMutation = useMutation({
    mutationFn: async (data: { template_id: number; additional_permission_ids?: number[] }) => {
      const response = await api.post('/role-templates/create-role', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role created successfully from template');
      setShowTemplateModal(false);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create role from template';
      // If it's a duplicate role error, provide more context
      if (errorMessage.includes('already exists') || errorMessage.includes('slug')) {
        toast.error(`Cannot create role: ${errorMessage}. Please edit the existing role or choose a different template.`);
      } else {
        toast.error(errorMessage);
      }
    },
  });

  // Update role permissions mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: number; permissionIds: number[] }) => {
      const response = await api.put(`/roles/${roleId}`, { permission_ids: permissionIds });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role permissions updated successfully');
      setEditingRole(null);
      setSelectedPermissions(new Set());
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update role permissions');
    },
  });

  // Update role name mutation
  const updateRoleNameMutation = useMutation({
    mutationFn: async ({ roleId, name }: { roleId: number; name: string }) => {
      const response = await api.put(`/roles/${roleId}`, { name });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role name updated successfully');
      setEditingRoleName(null);
      setRoleNameValue('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update role name');
    },
  });

  // Update role hierarchy level mutation
  const updateHierarchyLevelMutation = useMutation({
    mutationFn: async ({ roleId, hierarchyLevel }: { roleId: number; hierarchyLevel: number }) => {
      const response = await api.put(`/roles/${roleId}`, { hierarchy_level: hierarchyLevel });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Hierarchy level updated successfully');
      setEditingHierarchyLevel(null);
      setHierarchyLevelValue('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update hierarchy level');
    },
  });

  // Fetch all permissions
  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await api.get('/roles/permissions');
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  // Fetch all roles
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  // Filter out system admin permissions - these should NEVER be shown to organization users
  const organizationPermissions = permissions?.filter(
    (p: any) => !SYSTEM_ADMIN_PERMISSIONS.includes(p.slug)
  ) || [];

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(organizationPermissions.map((p: any) => p.category)))];

  // Filter permissions by search and category
  const filteredPermissions = organizationPermissions.filter((p: any) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group permissions by category
  const permissionsByCategory = filteredPermissions.reduce((acc: any, perm: any) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {});

  // Get permissions for a role
  const getRolePermissions = (role: any) => {
    // Handle different permission structures
    if (role.role_permissions && Array.isArray(role.role_permissions)) {
      return role.role_permissions
        .map((rp: any) => rp.permission?.slug || rp.permission_slug)
        .filter((slug: string) => slug && !SYSTEM_ADMIN_PERMISSIONS.includes(slug));
    }
    if (role.permissions && Array.isArray(role.permissions)) {
      return role.permissions
        .map((p: any) => p.slug || p.permission?.slug)
        .filter((slug: string) => slug && !SYSTEM_ADMIN_PERMISSIONS.includes(slug));
    }
    // If role is organization owner, return all organization permissions (not system admin)
    if (role.is_organization_owner) {
      return organizationPermissions.map((p: any) => p.slug);
    }
    return [];
  };

  // Check if role has permission
  const roleHasPermission = (role: any, permissionSlug: string) => {
    const rolePerms = getRolePermissions(role);
    return rolePerms.includes(permissionSlug);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!roles || !organizationPermissions) return;

    const csvRows: string[] = [];
    // Header row
    const header = ['Permission', 'Category', 'Description', ...roles.map((r: any) => r.name)];
    csvRows.push(header.join(','));

    // Data rows
    organizationPermissions.forEach((perm: any) => {
      const row = [
        `"${perm.name}"`,
        `"${perm.category}"`,
        `"${perm.description || ''}"`,
        ...roles.map((role: any) => roleHasPermission(role, perm.slug) ? 'Yes' : 'No')
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `permissions-review-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Permissions exported to CSV');
  };

  if (permissionsLoading || rolesLoading) {
    return (
      <div className="w-full p-6" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: theme.colors.primary }}></div>
          <p className="mt-4" style={{ color: theme.colors.textSecondary }}>Loading permissions and roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary }}>
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: theme.colors.text }}>
                Permissions & Roles Review
              </h1>
              <p className="mt-2 text-sm sm:text-base" style={{ color: theme.colors.textSecondary }}>
                Review all permissions and role assignments for {organization?.name || 'your organization'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text
              }}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            {canCreateRoles && (
              <>
                {isLoadingTemplates ? (
                  <Button disabled variant="primary" isLoading leftIcon={<Shield className="h-4 w-4" />}>
                    Loading Templates...
                  </Button>
                ) : roleTemplates && roleTemplates.length > 0 ? (
                  <Button
                    onClick={() => setShowTemplateModal(true)}
                    variant="primary"
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Create Role
                  </Button>
                ) : (
                  <div className="text-sm rounded-lg px-4 py-2" style={{
                    backgroundColor: theme.colors.primary + '1A',
                    border: `1px solid ${theme.colors.primary}33`,
                    color: theme.colors.textSecondary
                  }}>
                    <p className="font-medium" style={{ color: theme.colors.primary }}>No Templates Available</p>
                    <p style={{ color: theme.colors.textSecondary }}>No role templates are available for your current package.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Freemium Limitation Box */}
      {isFreemium && (
        <div className="card rounded-lg p-4 mb-6" style={{ backgroundColor: theme.colors.primary + '1A', border: `1px solid ${theme.colors.primary}` + '33' }}>
          <div className="flex items-start">
            <Shield className="h-5 w-5 mr-3 mt-0.5" style={{ color: theme.colors.primary }} />
            <div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: theme.colors.primary }}>Freemium Package Limitations</h3>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                Your organization is on the Freemium package. You can only use the default roles (Organization Owner and Admin).
                To create additional roles, please upgrade your package.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5" style={{ color: theme.colors.primary }} />
            <div>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Total Permissions</p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                {organizationPermissions.length}
              </p>
              <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                {permissions?.length ? `(${permissions.length} total, ${SYSTEM_ADMIN_PERMISSIONS.length} system admin filtered)` : ''}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5" style={{ color: theme.colors.primary }} />
            <div>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>System Roles</p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                {roles?.filter((r: any) => r.is_system_role).length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5" style={{ color: theme.colors.primary }} />
            <div>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Custom Roles</p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                {roles?.filter((r: any) => !r.is_system_role).length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5" style={{ color: theme.colors.primary }} />
            <div>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Categories</p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                {categories.length - 1}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="card mb-6 p-4" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-5 w-5" style={{ color: theme.colors.textSecondary }} />
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" style={{ color: theme.colors.textSecondary }} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text
              }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('permissions')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={viewMode === 'permissions' ? {
                backgroundColor: theme.colors.primary,
                color: '#ffffff'
              } : {
                color: theme.colors.textSecondary,
                backgroundColor: 'transparent'
              }}
            >
              <Eye className="h-4 w-4 inline mr-2" />
              By Permissions
            </button>
            <button
              onClick={() => setViewMode('roles')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={viewMode === 'roles' ? {
                backgroundColor: theme.colors.primary,
                color: '#ffffff'
              } : {
                color: theme.colors.textSecondary,
                backgroundColor: 'transparent'
              }}
            >
              <Users className="h-4 w-4 inline mr-2" />
              By Roles
            </button>
          </div>
        </div>
      </div>

      {/* Permissions View */}
      {viewMode === 'permissions' && (
        <div className="space-y-6">
          {Object.entries(permissionsByCategory).map(([category, perms]: [string, any]) => (
            <div key={category} className="card" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
              <div className="p-4 border-b" style={{ borderColor: theme.colors.border }}>
                <h2 className="text-lg font-semibold capitalize" style={{ color: theme.colors.text }}>
                  {category}
                </h2>
                <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                  {perms.length} permission{perms.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="divide-y" style={{ borderColor: theme.colors.border }}>
                {perms.map((perm: any) => (
                  <div key={perm.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium" style={{ color: theme.colors.text }}>
                            {perm.name}
                          </h3>
                          <span className="text-xs px-2 py-0.5 rounded" style={{
                            backgroundColor: theme.colors.background,
                            color: theme.colors.textSecondary
                          }}>
                            {perm.slug}
                          </span>
                        </div>
                        {perm.description && (
                          <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                            {perm.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                        Roles with this permission:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {roles?.map((role: any) => {
                          const hasPermission = roleHasPermission(role, perm.slug);
                          const isCustomRole = !role.is_system_role;
                          return (
                            <div
                              key={role.id}
                              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs"
                              style={{
                                backgroundColor: hasPermission
                                  ? `${theme.colors.primary}20`
                                  : theme.colors.background,
                                border: `1px solid ${hasPermission ? theme.colors.primary : theme.colors.border}`,
                                color: hasPermission ? theme.colors.primary : theme.colors.textSecondary
                              }}
                            >
                              {hasPermission ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                              <span>{role.name}</span>
                              {isCustomRole && (
                                <span className="text-[10px] px-1 py-0.5 rounded" style={{
                                  backgroundColor: theme.colors.secondary + '40',
                                  color: theme.colors.secondary
                                }}>
                                  Custom
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Roles View - Each role is collapsible */}
      {viewMode === 'roles' && (
        <div className="space-y-4">
          {roles
            ?.sort((a: any, b: any) => {
              // Sort: system roles first, then custom roles
              // Within each group, sort by hierarchy level
              if (a.is_system_role && !b.is_system_role) return -1;
              if (!a.is_system_role && b.is_system_role) return 1;
              return (a.hierarchy_level || 999) - (b.hierarchy_level || 999);
            })
            .map((role: any) => {
              const rolePerms = getRolePermissions(role);
              const filteredRolePerms = rolePerms.filter((slug: string) =>
                !SYSTEM_ADMIN_PERMISSIONS.includes(slug)
              );
              const isExpanded = expandedRoles.has(role.id);

              const toggleRole = () => {
                setExpandedRoles(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(role.id)) {
                    newSet.delete(role.id);
                  } else {
                    newSet.add(role.id);
                  }
                  return newSet;
                });
              };

              return (
                <div key={role.id} className="card" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
                  <div
                    className="p-4 border-b cursor-pointer"
                    style={{ borderColor: theme.colors.border }}
                    onClick={toggleRole}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {editingRoleName === role.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={roleNameValue}
                                onChange={(e) => setRoleNameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    if (roleNameValue.trim() && roleNameValue.trim() !== role.name) {
                                      updateRoleNameMutation.mutate({ roleId: role.id, name: roleNameValue.trim() });
                                    } else {
                                      setEditingRoleName(null);
                                      setRoleNameValue('');
                                    }
                                  } else if (e.key === 'Escape') {
                                    setEditingRoleName(null);
                                    setRoleNameValue('');
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="px-2 py-1 rounded text-lg font-semibold"
                                style={{
                                  backgroundColor: theme.colors.background,
                                  border: `1px solid ${theme.colors.primary}`,
                                  color: theme.colors.text,
                                  minWidth: '200px'
                                }}
                                autoFocus
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (roleNameValue.trim() && roleNameValue.trim() !== role.name) {
                                    updateRoleNameMutation.mutate({ roleId: role.id, name: roleNameValue.trim() });
                                  } else {
                                    setEditingRoleName(null);
                                    setRoleNameValue('');
                                  }
                                }}
                                disabled={updateRoleNameMutation.isPending || !roleNameValue.trim() || roleNameValue.trim() === role.name}
                                className="px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                                style={{
                                  backgroundColor: theme.colors.primary,
                                  color: '#ffffff'
                                }}
                              >
                                {updateRoleNameMutation.isPending ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingRoleName(null);
                                  setRoleNameValue('');
                                }}
                                className="px-2 py-1 rounded text-xs font-medium transition-colors"
                                style={{
                                  backgroundColor: theme.colors.surface,
                                  color: theme.colors.text,
                                  border: `1px solid ${theme.colors.border}`
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h2
                                className="text-lg font-semibold"
                                style={{ color: theme.colors.text }}
                              >
                                {role.name}
                              </h2>
                              {canEditRoles && !role.is_system_role && !role.is_default && role.organization_id !== null && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingRoleName(role.id);
                                    setRoleNameValue(role.name);
                                  }}
                                  className="p-1 rounded transition-colors"
                                  style={{
                                    color: theme.colors.textSecondary,
                                    backgroundColor: 'transparent'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = theme.colors.primary;
                                    e.currentTarget.style.backgroundColor = theme.colors.primary + '10';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = theme.colors.textSecondary;
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                  title="Edit role name"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          )}
                          {role.is_organization_owner && (
                            <span className="text-xs px-2 py-0.5 rounded" style={{
                              backgroundColor: '#23a55a20',
                              color: '#23a55a'
                            }}>
                              Owner
                            </span>
                          )}
                          {role.is_default && (
                            <span className="text-xs px-2 py-0.5 rounded" style={{
                              backgroundColor: theme.colors.primary + '20',
                              color: theme.colors.primary
                            }}>
                              Default
                            </span>
                          )}
                          {!role.is_system_role && (
                            <span className="text-xs px-2 py-0.5 rounded" style={{
                              backgroundColor: theme.colors.secondary + '20',
                              color: theme.colors.secondary
                            }}>
                              Custom
                            </span>
                          )}
                        </div>
                        {role.description && (
                          <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                            {role.description}
                          </p>
                        )}
                        <div className="text-xs mt-2 flex items-center gap-2 flex-wrap" style={{ color: theme.colors.textSecondary }}>
                          <span className="flex items-center gap-1">
                            Hierarchy Level:
                            <span
                              className="cursor-help"
                              title="Lower numbers = higher authority. Owner (1) and Admin (2) are fixed. Custom roles must be 3 or higher. Users can only modify roles with lower hierarchy levels than their own."
                            >
                              <Settings className="h-3 w-3" />
                            </span>
                          </span>
                          {editingHierarchyLevel === role.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="3"
                                value={hierarchyLevelValue}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '' || (parseInt(val) >= 3 && parseInt(val) <= 999)) {
                                    setHierarchyLevelValue(val);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const level = parseInt(hierarchyLevelValue);
                                    if (!isNaN(level) && level >= 3 && level !== role.hierarchy_level) {
                                      updateHierarchyLevelMutation.mutate({ roleId: role.id, hierarchyLevel: level });
                                    } else {
                                      setEditingHierarchyLevel(null);
                                      setHierarchyLevelValue('');
                                    }
                                  } else if (e.key === 'Escape') {
                                    setEditingHierarchyLevel(null);
                                    setHierarchyLevelValue('');
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="px-2 py-1 rounded w-20"
                                style={{
                                  backgroundColor: theme.colors.background,
                                  border: `1px solid ${theme.colors.primary}`,
                                  color: theme.colors.text
                                }}
                                autoFocus
                                placeholder="3+"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const level = parseInt(hierarchyLevelValue);
                                  if (!isNaN(level) && level >= 3 && level !== role.hierarchy_level) {
                                    updateHierarchyLevelMutation.mutate({ roleId: role.id, hierarchyLevel: level });
                                  } else {
                                    setEditingHierarchyLevel(null);
                                    setHierarchyLevelValue('');
                                  }
                                }}
                                disabled={updateHierarchyLevelMutation.isPending || !hierarchyLevelValue || parseInt(hierarchyLevelValue) < 3 || parseInt(hierarchyLevelValue) === role.hierarchy_level}
                                className="px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                                style={{
                                  backgroundColor: theme.colors.primary,
                                  color: '#ffffff'
                                }}
                              >
                                {updateHierarchyLevelMutation.isPending ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingHierarchyLevel(null);
                                  setHierarchyLevelValue('');
                                }}
                                className="px-2 py-1 rounded text-xs font-medium transition-colors"
                                style={{
                                  backgroundColor: theme.colors.surface,
                                  color: theme.colors.text,
                                  border: `1px solid ${theme.colors.border}`
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-medium" style={{ color: theme.colors.text }}>
                                {role.is_organization_owner ? 1 : (role.slug === 'admin' && !role.is_organization_owner) ? 2 : (role.hierarchy_level || 3)}
                              </span>
                              {canEditRoles && !role.is_system_role && !role.is_default && role.organization_id !== null && !role.is_organization_owner && role.slug !== 'admin' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingHierarchyLevel(role.id);
                                    setHierarchyLevelValue(String(role.hierarchy_level || 3));
                                  }}
                                  className="p-0.5 rounded transition-colors"
                                  style={{
                                    color: theme.colors.textSecondary,
                                    backgroundColor: 'transparent'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = theme.colors.primary;
                                    e.currentTarget.style.backgroundColor = theme.colors.primary + '10';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = theme.colors.textSecondary;
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                  title="Edit hierarchy level (must be >= 3)"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                              )}
                              {role.is_organization_owner && (
                                <span className="text-[10px] px-1 py-0.5 rounded" style={{
                                  backgroundColor: theme.colors.primary + '20',
                                  color: theme.colors.primary
                                }}>
                                  (Fixed)
                                </span>
                              )}
                              {role.slug === 'admin' && !role.is_organization_owner && (
                                <span className="text-[10px] px-1 py-0.5 rounded" style={{
                                  backgroundColor: theme.colors.primary + '20',
                                  color: theme.colors.primary
                                }}>
                                  (Fixed)
                                </span>
                              )}
                              <span>| Permissions: {filteredRolePerms.length}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canEditRoles && !role.is_system_role && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (editingRole === role.id) {
                                setEditingRole(null);
                                setSelectedPermissions(new Set());
                              } else {
                                setEditingRole(role.id);
                                const rolePermIds = getRolePermissions(role)
                                  .map((slug: string) => {
                                    const perm = organizationPermissions.find((p: any) => p.slug === slug);
                                    return perm?.id;
                                  })
                                  .filter((id: number | undefined) => id !== undefined);
                                setSelectedPermissions(new Set(rolePermIds));
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            style={{
                              backgroundColor: editingRole === role.id ? theme.colors.secondary : theme.colors.surface,
                              color: editingRole === role.id ? '#ffffff' : theme.colors.text,
                              border: `1px solid ${theme.colors.border}`
                            }}
                            onMouseEnter={(e) => {
                              if (editingRole !== role.id) {
                                e.currentTarget.style.backgroundColor = theme.colors.background;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (editingRole !== role.id) {
                                e.currentTarget.style.backgroundColor = theme.colors.surface;
                              }
                            }}
                          >
                            {editingRole === role.id ? 'Cancel Edit' : 'Edit Permissions'}
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRole();
                          }}
                          className="p-2 rounded-lg transition-colors flex items-center"
                          style={{
                            color: theme.colors.textSecondary,
                            backgroundColor: 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme.colors.border;
                            e.currentTarget.style.color = theme.colors.text;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = theme.colors.textSecondary;
                          }}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-4">
                      {editingRole === role.id ? (
                        <div className="space-y-4">
                          <div className="mb-4">
                            <p className="text-sm font-medium mb-3" style={{ color: theme.colors.text }}>
                              Select permissions for this role:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                              {organizationPermissions.map((perm: any) => {
                                const isSelected = selectedPermissions.has(perm.id);
                                return (
                                  <div
                                    key={perm.id}
                                    onClick={() => {
                                      setSelectedPermissions(prev => {
                                        const newSet = new Set(prev);
                                        if (newSet.has(perm.id)) {
                                          newSet.delete(perm.id);
                                        } else {
                                          newSet.add(perm.id);
                                        }
                                        return newSet;
                                      });
                                    }}
                                    className="p-3 rounded-lg cursor-pointer transition-colors"
                                    style={{
                                      backgroundColor: isSelected ? theme.colors.primary + '20' : theme.colors.background,
                                      border: `1px solid ${isSelected ? theme.colors.primary : theme.colors.border}`
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = isSelected
                                        ? theme.colors.primary + '30'
                                        : theme.colors.surface;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = isSelected
                                        ? theme.colors.primary + '20'
                                        : theme.colors.background;
                                    }}
                                  >
                                    <div className="flex items-start gap-2">
                                      {isSelected ? (
                                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.colors.primary }} />
                                      ) : (
                                        <X className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.colors.textSecondary }} />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium" style={{ color: theme.colors.text }}>
                                          {perm.name}
                                        </p>
                                        <p className="text-xs mt-0.5" style={{ color: theme.colors.textSecondary }}>
                                          {perm.slug}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-4 border-t" style={{ borderColor: theme.colors.border }}>
                            <button
                              onClick={() => {
                                setEditingRole(null);
                                setSelectedPermissions(new Set());
                              }}
                              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                              style={{
                                backgroundColor: theme.colors.surface,
                                color: theme.colors.text,
                                border: `1px solid ${theme.colors.border}`
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = theme.colors.background;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = theme.colors.surface;
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                updateRoleMutation.mutate({
                                  roleId: role.id,
                                  permissionIds: Array.from(selectedPermissions)
                                });
                              }}
                              disabled={updateRoleMutation.isPending}
                              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                              style={{
                                backgroundColor: theme.colors.primary,
                                color: '#ffffff'
                              }}
                              onMouseEnter={(e) => {
                                if (!updateRoleMutation.isPending) {
                                  e.currentTarget.style.backgroundColor = theme.colors.secondary;
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!updateRoleMutation.isPending) {
                                  e.currentTarget.style.backgroundColor = theme.colors.primary;
                                }
                              }}
                            >
                              {updateRoleMutation.isPending ? 'Saving...' : 'Save Permissions'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {organizationPermissions.map((perm: any) => {
                              const hasPermission = roleHasPermission(role, perm.slug);
                              if (!hasPermission) return null;

                              return (
                                <div
                                  key={perm.id}
                                  className="p-3 rounded-lg"
                                  style={{
                                    backgroundColor: theme.colors.background,
                                    border: `1px solid ${theme.colors.border}`
                                  }}
                                >
                                  <div className="flex items-start gap-2">
                                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#23a55a' }} />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium" style={{ color: theme.colors.text }}>
                                        {perm.name}
                                      </p>
                                      <p className="text-xs mt-0.5" style={{ color: theme.colors.textSecondary }}>
                                        {perm.slug}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {filteredRolePerms.length === 0 && (
                            <p className="text-center py-8 text-sm" style={{ color: theme.colors.textSecondary }}>
                              No organization permissions assigned to this role
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Info Note - System Admin Permissions Hidden */}
      <div className="card mt-6 p-4" style={{
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`
      }}>
        <div className="flex items-start gap-3">
          <Settings className="h-5 w-5 mt-0.5" style={{ color: theme.colors.primary }} />
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: theme.colors.text }}>
              Note: System Admin Permissions Hidden
            </p>
            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
              System admin-only permissions ({SYSTEM_ADMIN_PERMISSIONS.join(', ')}) are not shown in this organization view.
              These permissions are reserved for system administrators only and are not available for organization roles.
            </p>
          </div>
        </div>
      </div>

      {/* Create from Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
            <div className="p-6 border-b" style={{ borderColor: theme.colors.border }}>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>Create Role</h2>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  style={{ color: theme.colors.textSecondary }}
                  onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text}
                  onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="mt-2 text-sm" style={{ color: theme.colors.textSecondary }}>
                Select a template to quickly create a role with predefined permissions
              </p>
            </div>
            <div className="p-6">
              {roleTemplates && roleTemplates.length > 0 ? (
                <div className="space-y-4">
                  {roleTemplates.map((template: any) => {
                    const templatePermissions = template.template_permissions?.map((tp: any) => tp.permission) || [];
                    // Check if a role with this slug already exists and is active
                    const existingRole = roles?.find((r: any) =>
                      r.slug === template.slug && r.is_active === true
                    );
                    const isDisabled = !!existingRole;

                    return (
                      <div
                        key={template.id}
                        className={`rounded-lg p-4 transition-colors ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                        style={{
                          border: `1px solid ${isDisabled ? theme.colors.border + '80' : theme.colors.border}`,
                          backgroundColor: isDisabled ? theme.colors.surface : theme.colors.background
                        }}
                        onMouseEnter={(e) => {
                          if (!isDisabled) {
                            e.currentTarget.style.borderColor = theme.colors.primary;
                            e.currentTarget.style.backgroundColor = theme.colors.primary + '10';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isDisabled) {
                            e.currentTarget.style.borderColor = theme.colors.border;
                            e.currentTarget.style.backgroundColor = theme.colors.background;
                          }
                        }}
                        onClick={() => {
                          if (!isDisabled) {
                            createFromTemplateMutation.mutate({ template_id: template.id });
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold" style={{ color: theme.colors.text }}>{template.name}</h3>
                              {isDisabled && (
                                <span className="text-xs px-2 py-0.5 rounded" style={{
                                  backgroundColor: theme.colors.primary + '20',
                                  color: theme.colors.primary
                                }}>
                                  Already Exists
                                </span>
                              )}
                            </div>
                            {isDisabled && existingRole && (
                              <p className="text-sm mt-1" style={{ color: theme.colors.primary }}>
                                A role with this name already exists: <strong>{existingRole.name}</strong>
                              </p>
                            )}
                            {template.description && (
                              <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>{template.description}</p>
                            )}
                            <div className="mt-3 flex items-center text-sm" style={{ color: theme.colors.textSecondary }}>
                              <Shield className="h-4 w-4 mr-1" />
                              <span>{templatePermissions.length} {templatePermissions.length === 1 ? 'permission' : 'permissions'}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isDisabled) {
                                createFromTemplateMutation.mutate({ template_id: template.id });
                              }
                            }}
                            disabled={createFromTemplateMutation.isPending || isDisabled}
                            className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                            style={{
                              backgroundColor: isDisabled ? theme.colors.border : (createFromTemplateMutation.isPending ? theme.colors.border : theme.colors.primary),
                              color: '#ffffff',
                              opacity: (createFromTemplateMutation.isPending || isDisabled) ? 0.6 : 1,
                              cursor: isDisabled ? 'not-allowed' : 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              if (!createFromTemplateMutation.isPending && !isDisabled) {
                                e.currentTarget.style.backgroundColor = theme.colors.secondary;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!createFromTemplateMutation.isPending && !isDisabled) {
                                e.currentTarget.style.backgroundColor = theme.colors.primary;
                              }
                            }}
                          >
                            {createFromTemplateMutation.isPending ? 'Creating...' : (isDisabled ? 'Already Exists' : 'Create Role')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 mx-auto mb-3" style={{ color: theme.colors.textSecondary }} />
                  <h3 className="text-lg font-medium mb-2" style={{ color: theme.colors.text }}>No templates available</h3>
                  <p style={{ color: theme.colors.textSecondary }}>There are no role templates available for your package.</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end" style={{ borderColor: theme.colors.border }}>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  border: `1px solid ${theme.colors.border}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.background;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.surface;
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PermissionsReviewPage() {
  return <PermissionsReviewTab />;
}
