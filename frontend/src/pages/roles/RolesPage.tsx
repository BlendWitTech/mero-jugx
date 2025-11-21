import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Shield, Plus, Users, ChevronDown, ChevronUp, Edit, Trash2, X, Save } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const roleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  permission_ids: z.array(z.number()).optional(),
  is_active: z.boolean().optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

export default function RolesPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated, accessToken, _hasHydrated } = useAuthStore();
  const [expandedRole, setExpandedRole] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);

  const { data: roles, isLoading, error } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  // Fetch package info to determine if organization can create roles
  const { data: packageInfo, refetch: refetchPackage } = useQuery({
    queryKey: ['current-package'],
    queryFn: async () => {
      const response = await api.get('/organizations/me/package');
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    refetchOnWindowFocus: true,
  });

  // Listen for package update events
  useEffect(() => {
    const handlePackageUpdate = () => {
      console.log('[Roles] Package update event received, refetching package data...');
      refetchPackage();
    };
    
    window.addEventListener('package-updated', handlePackageUpdate);
    return () => {
      window.removeEventListener('package-updated', handlePackageUpdate);
    };
  }, [refetchPackage]);

  const isFreemium = packageInfo?.package?.slug === 'freemium';
  const canCreateRoles = !isFreemium;

  // Fetch role usage counts (user counts per role)
  const { data: roleUsageCounts, refetch: refetchRoleUsageCounts } = useQuery({
    queryKey: ['role-usage-counts'],
    queryFn: async () => {
      const response = await api.get('/roles/usage-counts');
      return response.data || {};
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    refetchInterval: 30000, // Refetch every 30 seconds to get latest counts
  });

  // Fetch permissions list
  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await api.get('/roles/permissions');
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  // Fetch role templates
  const { data: roleTemplates } = useQuery({
    queryKey: ['role-templates'],
    queryFn: async () => {
      const response = await api.get('/role-templates');
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  // Create role from template mutation
  const createFromTemplateMutation = useMutation({
    mutationFn: async (data: { template_id: number; additional_permission_ids?: number[] }) => {
      const response = await api.post('/role-templates/create-role', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role-usage-counts'] });
      toast.success('Role created successfully from template');
      setShowTemplateModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create role from template');
    },
  });

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors },
    reset: resetCreate,
    watch: watchCreate,
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      permission_ids: [],
      is_active: true,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors },
    reset: resetEdit,
    watch: watchEdit,
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
  });

  const createPermissionIds = watchCreate('permission_ids') || [];
  const editPermissionIds = watchEdit('permission_ids') || [];

  const createMutation = useMutation({
    mutationFn: async (data: RoleFormData) => {
      const response = await api.post('/roles', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role created successfully');
      setShowCreateModal(false);
      resetCreate();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create role');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ roleId, data }: { roleId: number; data: RoleFormData }) => {
      const response = await api.put(`/roles/${roleId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role-usage-counts'] });
      queryClient.invalidateQueries({ queryKey: ['user-details'] });
      toast.success('Role updated successfully');
      setShowEditModal(false);
      setSelectedRole(null);
      resetEdit();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update role');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (roleId: number) => {
      await api.delete(`/roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role-usage-counts'] });
      toast.success('Role deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete role');
    },
  });

  const handleCreate = () => {
    resetCreate({
      name: '',
      slug: '',
      description: '',
      permission_ids: [],
      is_active: true,
    });
    setShowCreateModal(true);
  };

  const handleEdit = (role: any) => {
    setSelectedRole(role);
    const rolePermissions = role.role_permissions?.map((rp: any) => rp.permission.id) || [];
    resetEdit({
      name: role.name || '',
      slug: role.slug || '',
      description: role.description || '',
      permission_ids: rolePermissions,
      is_active: role.is_active !== undefined ? role.is_active : true,
    });
    setShowEditModal(true);
  };

  const handleDelete = (role: any) => {
    if (confirm(`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(role.id);
    }
  };

  const onCreateSubmit = (data: RoleFormData) => {
    // Custom role creation is disabled - show error
    toast.error('Custom role creation is not allowed. Please use role templates from your package.');
  };

  const onEditSubmit = (data: RoleFormData) => {
    if (selectedRole) {
      updateMutation.mutate({ roleId: selectedRole.id, data });
    }
  };

  const togglePermission = (permissionId: number, isEdit: boolean = false) => {
    if (isEdit) {
      const current = editPermissionIds;
      const newIds = current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId];
      resetEdit({ ...watchEdit(), permission_ids: newIds });
    } else {
      const current = createPermissionIds;
      const newIds = current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId];
      resetCreate({ ...watchCreate(), permission_ids: newIds });
    }
  };

  const getUserCountForRole = (roleId: number) => {
    if (!roleUsageCounts) return 0;
    const count = roleUsageCounts[roleId] || 0;
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Role ${roleId} has ${count} users. All counts:`, roleUsageCounts);
    }
    return count;
  };

  const toggleExpand = (roleId: number) => {
    setExpandedRole(expandedRole === roleId ? null : roleId);
  };

  const groupedPermissions = permissions?.reduce((acc: any, perm: any) => {
    const category = perm.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(perm);
    return acc;
  }, {}) || {};

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="mt-2 text-gray-600">Manage organization roles and their permissions</p>
        </div>
        <div className="flex items-center space-x-3">
          {canCreateRoles && roleTemplates && roleTemplates.length > 0 && (
            <button onClick={() => setShowTemplateModal(true)} className="btn btn-primary">
              <Shield className="mr-2 h-4 w-4" />
              Create Role from Template
            </button>
          )}
          {!canCreateRoles && (
            <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
              <p className="font-medium text-yellow-800">Freemium Package</p>
              <p className="text-yellow-700">Only default roles (Organization Owner, Admin) are available. Upgrade to create additional roles.</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="card bg-red-50 border border-red-200 mb-6">
          <p className="text-red-800">
            Error loading roles: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}

      {isFreemium && (
        <div className="card bg-blue-50 border border-blue-200 mb-6">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Freemium Package Limitations</h3>
              <p className="text-sm text-blue-800">
                Your organization is on the Freemium package. You can only use the default roles (Organization Owner and Admin). 
                To create additional roles, please upgrade your package.
              </p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : roles && roles.length > 0 ? (
        <div className="space-y-6">
          {/* Default Roles Section */}
          {roles.filter((r: any) => r.is_default || r.is_system_role).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-purple-600" />
                Default Roles
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (Available to all organizations)
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles
                  .filter((r: any) => r.is_default || r.is_system_role)
                  .map((role: any) => {
                    const userCount = getUserCountForRole(role.id);
                    const isExpanded = expandedRole === role.id;
                    const rolePermissions = role.role_permissions?.map((rp: any) => rp.permission) || [];

                    return (
                      <div key={role.id} className="card border-2 border-purple-200 bg-purple-50/50">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Shield className="h-5 w-5 text-purple-600 flex-shrink-0" />
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{role.name}</h3>
                              <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full whitespace-nowrap">
                                Default
                              </span>
                              {role.is_organization_owner && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full whitespace-nowrap">
                                  Owner
                                </span>
                              )}
                            </div>
                            {role.description && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{role.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                              <div className="flex items-center bg-blue-50 px-2 sm:px-3 py-1.5 rounded-lg border border-blue-200 whitespace-nowrap">
                                <Users className="h-4 w-4 mr-1.5 text-blue-600 flex-shrink-0" />
                                <span className="font-semibold text-blue-900">{userCount}</span>
                                <span className="ml-1 text-blue-700">{userCount === 1 ? 'user' : 'users'}</span>
                              </div>
                              <div className="flex items-center text-gray-600">
                                <Shield className="h-4 w-4 mr-1 flex-shrink-0" />
                                <span className="text-xs sm:text-sm">{rolePermissions.length} {rolePermissions.length === 1 ? 'permission' : 'permissions'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleExpand(role.id)}
                          className="mt-3 w-full flex items-center justify-center text-sm text-gray-600 hover:text-gray-900 py-2 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Hide Permissions
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              View Permissions
                            </>
                          )}
                        </button>
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-purple-200">
                            <p className="text-xs font-medium text-gray-700 mb-2">Permissions:</p>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {Object.entries(groupedPermissions).map(([category, perms]: [string, any]) => {
                                const categoryPerms = perms.filter((p: any) =>
                                  rolePermissions.some((rp: any) => rp.id === p.id)
                                );
                                if (categoryPerms.length === 0) return null;
                                return (
                                  <div key={category} className="mb-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{category}</p>
                                    {categoryPerms.map((perm: any) => (
                                      <div key={perm.id} className="text-xs text-gray-600 ml-2">
                                        • {perm.name}
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Custom Roles Section */}
          {roles.filter((r: any) => !r.is_default && !r.is_system_role).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary-600" />
                Custom Roles
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({roles.filter((r: any) => !r.is_default && !r.is_system_role).length})
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles
                  .filter((r: any) => !r.is_default && !r.is_system_role)
                  .map((role: any) => {
            const userCount = getUserCountForRole(role.id);
            const isExpanded = expandedRole === role.id;
            const rolePermissions = role.role_permissions?.map((rp: any) => rp.permission) || [];

            return (
              <div key={role.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Shield className={`h-5 w-5 flex-shrink-0 ${
                        role.is_system_role ? 'text-purple-600' : 'text-primary-600'
                      }`} />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{role.name}</h3>
                      {role.is_system_role && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full whitespace-nowrap">
                          System Role
                        </span>
                      )}
                      {role.is_organization_owner && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full whitespace-nowrap">
                          Owner
                        </span>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{role.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                      <div className="flex items-center bg-blue-50 px-2 sm:px-3 py-1.5 rounded-lg border border-blue-200 whitespace-nowrap">
                        <Users className="h-4 w-4 mr-1.5 text-blue-600 flex-shrink-0" />
                        <span className="font-semibold text-blue-900">{userCount}</span>
                        <span className="ml-1 text-blue-700">{userCount === 1 ? 'user' : 'users'}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Shield className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">{rolePermissions.length} {rolePermissions.length === 1 ? 'permission' : 'permissions'}</span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                        role.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {role.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end sm:justify-start space-x-2 sm:ml-4 flex-shrink-0">
                    {!role.is_system_role && (
                      <>
                        <button
                          onClick={() => handleEdit(role)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit Role"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {userCount === 0 && !role.is_system_role && (
                          <button
                            onClick={() => handleDelete(role)}
                            disabled={deleteMutation.isPending}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete Role"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => toggleExpand(role.id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Permissions View */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {rolePermissions.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Permissions</h4>
                        <div className="space-y-3">
                          {Object.entries(groupedPermissions).map(([category, perms]: [string, any]) => {
                            const categoryPerms = perms.filter((p: any) =>
                              rolePermissions.some((rp: any) => rp.id === p.id)
                            );
                            if (categoryPerms.length === 0) return null;

                            return (
                              <div key={category}>
                                <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                                  {category.replace('_', ' ')}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {categoryPerms.map((perm: any) => (
                                    <span
                                      key={perm.id}
                                      className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded"
                                    >
                                      {perm.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Shield className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No permissions assigned</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
                  })}
              </div>
            </div>
          )}

          {/* Empty State - Show only if no roles at all */}
          {roles.filter((r: any) => r.is_default || r.is_system_role).length === 0 && 
           roles.filter((r: any) => !r.is_default && !r.is_system_role).length === 0 && (
            <div className="card text-center py-12">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No custom roles found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first custom role.</p>
              <button onClick={handleCreate} className="btn btn-primary">
                <Plus className="mr-2 h-4 w-4" />
                Create Role
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first role.</p>
          <button onClick={handleCreate} className="btn btn-primary">
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </button>
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowCreateModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Create New Role</h3>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetCreate();
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Custom role creation is disabled.</strong> Please use role templates from your package instead. 
                    {isFreemium && ' Freemium packages can only use default roles (Organization Owner and Admin).'}
                  </p>
                </div>
                <form onSubmit={handleCreateSubmit(onCreateSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="create_name" className="block text-sm font-medium text-gray-700">
                        Role Name *
                      </label>
                      <input
                        id="create_name"
                        type="text"
                        {...registerCreate('name')}
                        className="input mt-1"
                        placeholder="e.g., Manager"
                        onChange={(e) => {
                          registerCreate('name').onChange(e);
                          // Auto-generate slug
                          const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                          resetCreate({ ...watchCreate(), name: e.target.value, slug });
                        }}
                      />
                      {createErrors.name && (
                        <p className="mt-1 text-sm text-red-600">{createErrors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="create_slug" className="block text-sm font-medium text-gray-700">
                        Slug *
                      </label>
                      <input
                        id="create_slug"
                        type="text"
                        {...registerCreate('slug')}
                        className="input mt-1"
                        placeholder="e.g., manager"
                      />
                      {createErrors.slug && (
                        <p className="mt-1 text-sm text-red-600">{createErrors.slug.message}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="create_description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="create_description"
                      {...registerCreate('description')}
                      rows={3}
                      className="input mt-1"
                      placeholder="Describe the role's purpose and responsibilities..."
                    />
                    {createErrors.description && (
                      <p className="mt-1 text-sm text-red-600">{createErrors.description.message}</p>
                    )}
                  </div>

                  {/* Permissions Selection */}
                  {permissions && permissions.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Permissions
                      </label>
                      <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                        {Object.entries(groupedPermissions).map(([category, perms]: [string, any]) => (
                          <div key={category} className="mb-4 last:mb-0">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                              {category.replace(/_/g, ' ')}
                            </p>
                            <div className="space-y-2">
                              {perms.map((perm: any) => (
                                <label
                                  key={perm.id}
                                  className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={createPermissionIds.includes(perm.id)}
                                    onChange={() => togglePermission(perm.id, false)}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                  />
                                  <div className="ml-3 flex-1">
                                    <p className="text-sm font-medium text-gray-900">{perm.name}</p>
                                    {perm.description && (
                                      <p className="text-xs text-gray-500">{perm.description}</p>
                                    )}
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetCreate();
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="btn btn-primary"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {createMutation.isPending ? 'Creating...' : 'Create Role'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && selectedRole && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowEditModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Edit Role</h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      resetEdit();
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="edit_name" className="block text-sm font-medium text-gray-700">
                        Role Name *
                      </label>
                      <input
                        id="edit_name"
                        type="text"
                        {...registerEdit('name')}
                        className="input mt-1"
                      />
                      {editErrors.name && (
                        <p className="mt-1 text-sm text-red-600">{editErrors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="edit_slug" className="block text-sm font-medium text-gray-700">
                        Slug *
                      </label>
                      <input
                        id="edit_slug"
                        type="text"
                        {...registerEdit('slug')}
                        className="input mt-1"
                      />
                      {editErrors.slug && (
                        <p className="mt-1 text-sm text-red-600">{editErrors.slug.message}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="edit_description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="edit_description"
                      {...registerEdit('description')}
                      rows={3}
                      className="input mt-1"
                    />
                    {editErrors.description && (
                      <p className="mt-1 text-sm text-red-600">{editErrors.description.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...registerEdit('is_active')}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                  </div>

                  {/* Permissions Selection */}
                  {permissions && permissions.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Permissions
                      </label>
                      <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                        {Object.entries(groupedPermissions).map(([category, perms]: [string, any]) => (
                          <div key={category} className="mb-4 last:mb-0">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                              {category.replace(/_/g, ' ')}
                            </p>
                            <div className="space-y-2">
                              {perms.map((perm: any) => (
                                <label
                                  key={perm.id}
                                  className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={editPermissionIds.includes(perm.id)}
                                    onChange={() => togglePermission(perm.id, true)}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                  />
                                  <div className="ml-3 flex-1">
                                    <p className="text-sm font-medium text-gray-900">{perm.name}</p>
                                    {perm.description && (
                                      <p className="text-xs text-gray-500">{perm.description}</p>
                                    )}
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        resetEdit();
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="btn btn-primary"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create from Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create Role from Template</h2>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Select a template to quickly create a role with predefined permissions
              </p>
            </div>
            <div className="p-6">
              {roleTemplates && roleTemplates.length > 0 ? (
                <div className="space-y-4">
                  {roleTemplates.map((template: any) => {
                    const templatePermissions = template.template_permissions?.map((tp: any) => tp.permission) || [];
                    return (
                      <div
                        key={template.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 hover:bg-primary-50 transition-colors cursor-pointer"
                        onClick={() => {
                          createFromTemplateMutation.mutate({ template_id: template.id });
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                            {template.description && (
                              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                            )}
                            <div className="mt-3 flex items-center text-sm text-gray-600">
                              <Shield className="h-4 w-4 mr-1" />
                              <span>{templatePermissions.length} {templatePermissions.length === 1 ? 'permission' : 'permissions'}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              createFromTemplateMutation.mutate({ template_id: template.id });
                            }}
                            disabled={createFromTemplateMutation.isPending}
                            className="btn btn-primary ml-4"
                          >
                            {createFromTemplateMutation.isPending ? 'Creating...' : 'Use Template'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No templates available</h3>
                  <p className="text-gray-600">There are no role templates available for your package.</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="btn btn-secondary"
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

