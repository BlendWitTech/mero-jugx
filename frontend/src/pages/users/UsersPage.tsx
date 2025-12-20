import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Search, Plus, Edit, Trash2, Eye, MoreVertical, X, Save, Shield, CheckCircle2, AlertCircle, UserCog, Users } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { useTheme } from '../../contexts/ThemeContext';

const editUserSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  status: z.enum(['active', 'suspended', 'deleted']).optional(),
});

const revokeAccessSchema = z.object({
  transfer_data: z.boolean().optional(),
  transfer_to_user_id: z.string().uuid().optional(),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
}).refine(
  (data) => {
    if (data.transfer_data && !data.transfer_to_user_id) {
      return false;
    }
    return true;
  },
  {
    message: 'Please select a user to transfer data to',
    path: ['transfer_to_user_id'],
  }
);

type EditUserFormData = z.infer<typeof editUserSchema>;
type RevokeAccessFormData = z.infer<typeof revokeAccessSchema>;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { slug } = useParams<{ slug: string }>();
  const { user: currentUser, isAuthenticated, accessToken, _hasHydrated } = useAuthStore();
  const { isOrganizationOwner, hasPermission, userData } = usePermissions();
  const { theme } = useTheme();
  
  // Check if user can view users list
  const canViewUsers = isOrganizationOwner || hasPermission('users.view');
  
  const canImpersonate = isOrganizationOwner || hasPermission('users.impersonate');
  const canEditUsers = isOrganizationOwner || hasPermission('users.edit');
  const canRevokeUsers = isOrganizationOwner || hasPermission('users.revoke');
  const canAssignRoles = isOrganizationOwner || hasPermission('roles.assign');
  
  // Get current user's actual role for hierarchy comparison
  const currentUserRole = userData?.role;

  // Get current user's role hierarchy level
  const getRoleHierarchyLevel = (role: any): number => {
    if (!role) return 999; // No role = lowest
    if (role.is_organization_owner) return 1; // Highest
    if (role.slug === 'admin' || (role.is_default && role.slug === 'admin') || (role.is_system_role && role.slug === 'admin')) {
      return 2; // Second level
    }
    // Use actual hierarchy_level if available, otherwise default to 3
    return role.hierarchy_level || 3;
  };

  // Check if current user can edit a specific user (not just role assignment)
  const canEditSpecificUser = (targetUser: any): boolean => {
    if (!targetUser || !targetUser.role) return false;
    if (isCurrentUser(targetUser.id)) return false; // Can't edit self
    if (targetUser.role.is_organization_owner) return false; // Can't edit owner
    if (!canEditUsers) return false; // Must have users.edit permission
    
    // Organization owners can edit anyone (except other owners)
    if (isOrganizationOwner) return true;
    
    // For non-owners, check role hierarchy
    if (!currentUserRole) return false;
    const currentUserRoleLevel = getRoleHierarchyLevel(currentUserRole);
    const targetRoleLevel = getRoleHierarchyLevel(targetUser.role);
    
    // Can only edit users with lower role levels (higher hierarchy_level number = lower authority)
    return currentUserRoleLevel < targetRoleLevel;
  };

  // Check if current user can edit/assign role to target user
  const canEditUserRole = (targetUser: any): boolean => {
    if (!targetUser || !targetUser.role) return false;
    if (isCurrentUser(targetUser.id)) return false; // Can't edit self
    if (targetUser.role.is_organization_owner) return false; // Can't edit owner
    if (!canAssignRoles) return false;
    
    // Organization owners can edit anyone (except other owners)
    if (isOrganizationOwner) return true;
    
    // For non-owners, check role hierarchy
    if (!currentUserRole) return false;
    const currentUserRoleLevel = getRoleHierarchyLevel(currentUserRole);
    const targetRoleLevel = getRoleHierarchyLevel(targetUser.role);
    
    // Can only edit users with lower role levels
    return currentUserRoleLevel < targetRoleLevel;
  };
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const menuButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page, search],
    queryFn: async () => {
      const response = await api.get('/users', {
        params: { page, limit: 20, search },
      });
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken && canViewUsers,
    retry: 1,
  });

  // Fetch assignable roles for role assignment (roles the user can assign)
  const { data: roles, refetch: refetchRoles } = useQuery({
    queryKey: ['assignable-roles'],
    queryFn: async () => {
      try {
        if (canAssignRoles) {
          const response = await api.get('/roles/assignable');
          return Array.isArray(response.data) ? response.data : [];
        }
        return [];
      } catch (error: any) {
        // If user doesn't have roles.assign permission, return empty array
        if (error.response?.status === 403) {
          return [];
        }
        throw error;
      }
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  // Listen for package update events to refresh roles
  useEffect(() => {
    const handlePackageUpdate = () => {
      console.log('[Users] Package update event received, refetching roles...');
      // Invalidate and refetch roles to show newly available roles after package upgrade
      queryClient.invalidateQueries({ queryKey: ['assignable-roles'] });
      refetchRoles();
    };
    
    window.addEventListener('package-updated', handlePackageUpdate);
    return () => {
      window.removeEventListener('package-updated', handlePackageUpdate);
    };
  }, [refetchRoles, queryClient]);

  // Fetch user details for view/edit
  const { data: userDetails } = useQuery({
    queryKey: ['user-details', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser?.id) return null;
      const response = await api.get(`/users/${selectedUser.id}`);
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken && !!selectedUser?.id && (showViewModal || showEditModal),
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors },
    reset: resetEdit,
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  });

  const {
    register: registerRevoke,
    handleSubmit: handleRevokeSubmit,
    formState: { errors: revokeErrors },
    watch: watchRevoke,
    reset: resetRevoke,
  } = useForm<RevokeAccessFormData>({
    resolver: zodResolver(revokeAccessSchema),
    defaultValues: {
      transfer_data: false,
    },
  });

  const transferData = watchRevoke('transfer_data');

  const updateMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: EditUserFormData }) => {
      const response = await api.put(`/users/${userId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-details'] });
      toast.success('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      resetEdit();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: RevokeAccessFormData }) => {
      const response = await api.post(`/users/${userId}/revoke`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User access revoked successfully');
      setShowRevokeModal(false);
      setSelectedUser(null);
      resetRevoke();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to revoke access');
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: number }) => {
      const response = await api.put(`/users/${userId}/role`, { role_id: roleId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-details'] });
      queryClient.invalidateQueries({ queryKey: ['role-usage-counts'] });
      toast.success('Role assigned successfully');
      setShowRoleModal(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign role');
    },
  });

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    resetEdit({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      status: user.status || 'active',
    });
    setShowEditModal(true);
    setActionMenuOpen(null);
  };

  const handleView = async (user: any) => {
    setSelectedUser(user);
    setShowViewModal(true);
    setActionMenuOpen(null);
  };

  const handleRevoke = (user: any) => {
    setSelectedUser(user);
    resetRevoke({
      transfer_data: false,
      reason: '',
    });
    setShowRevokeModal(true);
    setActionMenuOpen(null);
  };

  const handleAssignRole = (user: any) => {
    setSelectedUser(user);
    setShowRoleModal(true);
    setActionMenuOpen(null);
  };

  const impersonateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post(`/users/${userId}/impersonate`);
      return response.data;
    },
    onSuccess: (data) => {
      // Update auth store with new tokens
      const authStore = useAuthStore.getState();
      if (authStore.user && authStore.organization) {
        authStore.setAuth(
          { access_token: data.access_token, refresh_token: data.refresh_token },
          data.impersonated_user,
          authStore.organization
        );
      }
      toast.success(`Now impersonating ${data.impersonated_user.first_name} ${data.impersonated_user.last_name}`);
      // Reload page to reflect impersonation
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to impersonate user');
    },
  });

  const handleImpersonate = (user: any) => {
    if (confirm(`Are you sure you want to impersonate ${user.first_name} ${user.last_name}? You will see the system from their perspective.`)) {
      impersonateMutation.mutate(user.id);
      setActionMenuOpen(null);
      setMenuPosition(null);
    }
  };

  const onEditSubmit = (data: EditUserFormData) => {
    if (selectedUser) {
      updateMutation.mutate({ userId: selectedUser.id, data });
    }
  };

  const onRevokeSubmit = (data: RevokeAccessFormData) => {
    if (selectedUser) {
      if (confirm(`Are you sure you want to revoke access for ${selectedUser.first_name} ${selectedUser.last_name}?`)) {
        revokeMutation.mutate({ userId: selectedUser.id, data });
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isCurrentUser = (userId: string) => {
    return currentUser?.id === userId;
  };

  // Permission check is handled by ProtectedRoute in App.tsx

  return (
    <div className="w-full p-6" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary }}>
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: theme.colors.text }}>Users</h1>
              <p className="mt-2 text-sm sm:text-base" style={{ color: theme.colors.textSecondary }}>Manage organization users and their access</p>
            </div>
          </div>
          <Link to={slug ? `/org/${slug}/invitations` : '/invitations'} className="btn btn-primary flex items-center whitespace-nowrap">
            <Plus className="mr-2 h-4 w-4 flex-shrink-0" />
            <span>Invite User</span>
          </Link>
        </div>
      </div>

      <div className="card mb-4" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: theme.colors.textSecondary }} />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            style={{ 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
          />
        </div>
      </div>

      {error && (
        <div className="card rounded-lg p-4" style={{ backgroundColor: '#ed4245' + '1A', border: `1px solid #ed4245` + '33' }}>
          <p style={{ color: '#ed4245' }}>
            Error loading users: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="card" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded" style={{ backgroundColor: theme.colors.background }}></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card overflow-visible mt-4" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
          <div className="overflow-x-auto overflow-visible">
            <table className="min-w-full" style={{ borderColor: theme.colors.border }}>
              <thead style={{ backgroundColor: theme.colors.background }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: theme.colors.background }}>
                {data?.users && data.users.length > 0 ? (
                  data.users.map((user: any) => {
                    const isSelf = isCurrentUser(user.id);
                    return (
                    <tr 
                      key={user.id} 
                      className={isSelf ? 'opacity-60 cursor-not-allowed' : ''}
                      style={{ borderTop: `1px solid ${theme.colors.border}` }}
                      onMouseEnter={(e) => {
                        if (!isSelf) e.currentTarget.style.backgroundColor = theme.colors.surface;
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelf) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.colors.primary + '1A' }}>
                            <span className="font-medium" style={{ color: theme.colors.primary }}>
                              {user.first_name?.[0]?.toUpperCase() || ''}{user.last_name?.[0]?.toUpperCase() || ''}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium" style={{ color: theme.colors.text }}>
                              {user.first_name} {user.last_name}
                              {isSelf && <span className="ml-2 text-xs" style={{ color: theme.colors.textSecondary }}>(You)</span>}
                            </div>
                            {user.phone && (
                              <div className="text-sm" style={{ color: theme.colors.textSecondary }}>{user.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.colors.textSecondary }}>
                        {user.email}
                        {user.email_verified ? (
                          <span className="ml-2 text-xs text-green-600">✓ Verified</span>
                        ) : (
                          <span className="ml-2 text-xs text-yellow-600">Unverified</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.role ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full" style={{ color: theme.colors.textSecondary, backgroundColor: theme.colors.surface }}>
                            {user.role.name}
                          </span>
                        ) : (
                          <span className="text-sm" style={{ color: theme.colors.textSecondary }}>No role</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : user.status === 'suspended'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status === 'active' ? 'Active' : user.status === 'suspended' ? 'Suspended' : 'Deleted'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative inline-block">
                          <button
                            ref={(el) => {
                              menuButtonRefs.current[user.id] = el;
                            }}
                            onClick={(e) => {
                              if (isSelf) {
                                e.stopPropagation();
                                return;
                              }
                              e.stopPropagation();
                              const button = menuButtonRefs.current[user.id];
                              if (button) {
                                const rect = button.getBoundingClientRect();
                                setMenuPosition({
                                  top: rect.bottom + 8,
                                  right: window.innerWidth - rect.right,
                                });
                              }
                              setActionMenuOpen(actionMenuOpen === user.id ? null : user.id);
                            }}
                            disabled={isSelf}
                            className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ color: theme.colors.textSecondary }}
                            onMouseEnter={(e) => {
                              if (!isSelf) {
                                e.currentTarget.style.color = theme.colors.text;
                                e.currentTarget.style.backgroundColor = theme.colors.surface;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelf) {
                                e.currentTarget.style.color = theme.colors.textSecondary;
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {actionMenuOpen === user.id && menuPosition && (
                            <>
                              <div
                                className="fixed inset-0 z-[100]"
                                onClick={() => {
                                  setActionMenuOpen(null);
                                  setMenuPosition(null);
                                }}
                              ></div>
                              <div 
                                className="fixed rounded-lg shadow-xl z-[101] py-1 min-w-[200px]"
                                style={{
                                  top: `${menuPosition.top}px`,
                                  right: `${menuPosition.right}px`,
                                  backgroundColor: theme.colors.surface,
                                  border: `1px solid ${theme.colors.border}`
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      handleView(user);
                                      setActionMenuOpen(null);
                                      setMenuPosition(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm flex items-center transition-colors"
                                    style={{ color: theme.colors.textSecondary }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = theme.colors.border;
                                      e.currentTarget.style.color = theme.colors.text;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.color = theme.colors.textSecondary;
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </button>
                                  {canEditUsers && canEditSpecificUser(user) && (
                                    <button
                                      onClick={() => {
                                        handleEdit(user);
                                        setActionMenuOpen(null);
                                        setMenuPosition(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm flex items-center transition-colors"
                                      style={{ color: theme.colors.textSecondary }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = theme.colors.background;
                                        e.currentTarget.style.color = theme.colors.text;
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = theme.colors.textSecondary;
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit User
                                    </button>
                                  )}
                                  {canAssignRoles && (
                                    <button
                                      onClick={() => {
                                        handleAssignRole(user);
                                        setActionMenuOpen(null);
                                        setMenuPosition(null);
                                      }}
                                      disabled={!canEditUserRole(user)}
                                      className="w-full text-left px-4 py-2 text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      style={{ color: theme.colors.textSecondary }}
                                      onMouseEnter={(e) => {
                                        if (canEditUserRole(user)) {
                                          e.currentTarget.style.backgroundColor = theme.colors.background;
                                          e.currentTarget.style.color = theme.colors.text;
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (canEditUserRole(user)) {
                                          e.currentTarget.style.backgroundColor = 'transparent';
                                          e.currentTarget.style.color = theme.colors.textSecondary;
                                        }
                                      }}
                                    >
                                      <Shield className="h-4 w-4 mr-2" />
                                      Change Role
                                    </button>
                                  )}
                                  {canImpersonate && (
                                    <button
                                      onClick={() => {
                                        handleImpersonate(user);
                                      }}
                                      disabled={isCurrentUser(user.id) || user.role?.is_organization_owner || impersonateMutation.isPending}
                                      className="w-full text-left px-4 py-2 text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      style={{ color: theme.colors.textSecondary }}
                                      onMouseEnter={(e) => {
                                        if (!isCurrentUser(user.id) && !user.role?.is_organization_owner && !impersonateMutation.isPending) {
                                          e.currentTarget.style.backgroundColor = theme.colors.background;
                                          e.currentTarget.style.color = theme.colors.text;
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!isCurrentUser(user.id) && !user.role?.is_organization_owner && !impersonateMutation.isPending) {
                                          e.currentTarget.style.backgroundColor = 'transparent';
                                          e.currentTarget.style.color = theme.colors.textSecondary;
                                        }
                                      }}
                                    >
                                      <UserCog className="h-4 w-4 mr-2" />
                                      Impersonate
                                    </button>
                                  )}
                                  {canRevokeUsers && (
                                    <>
                                      <div className="my-1" style={{ borderTop: `1px solid ${theme.colors.border}` }}></div>
                                      <button
                                        onClick={() => {
                                          handleRevoke(user);
                                          setActionMenuOpen(null);
                                          setMenuPosition(null);
                                        }}
                                        disabled={isCurrentUser(user.id) || user.role?.is_organization_owner || !canEditUserRole(user)}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Revoke Access
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center" style={{ color: theme.colors.textSecondary }}>
                      No users found. {search && 'Try adjusting your search.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-[#b9bbbe]">
                {data.total > 0 ? (
                  <>
                    Showing {(data.page - 1) * data.limit + 1} to {Math.min(data.page * data.limit, data.total)} of {data.total} users
                    {data.totalPages > 1 && ` (Page ${data.page} of ${data.totalPages})`}
                  </>
                ) : (
                  'No users found'
                )}
              </div>
              {data.totalPages > 1 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-secondary"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="btn btn-secondary"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* View User Details Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black/50" onClick={() => setShowViewModal(false)}></div>
            <div className="inline-block align-bottom bg-[#2f3136] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-[#2f3136] px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">User Details</h3>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-[#8e9297] hover:text-[#8e9297]"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                {userDetails ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 font-medium text-xl">
                          {userDetails.first_name?.[0]?.toUpperCase() || ''}{userDetails.last_name?.[0]?.toUpperCase() || ''}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-white">
                          {userDetails.first_name} {userDetails.last_name}
                        </h4>
                        <p className="text-sm text-[#8e9297]">{userDetails.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#202225]">
                      <div>
                        <p className="text-sm font-medium text-[#8e9297]">Phone</p>
                        <p className="text-sm text-white mt-1">{userDetails.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#8e9297]">Status</p>
                        <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          userDetails.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : userDetails.status === 'suspended'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userDetails.status || 'Active'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#8e9297]">Email Verified</p>
                        <div className="mt-1 flex items-center">
                          {userDetails.email_verified ? (
                            <span className="inline-flex items-center text-xs text-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs text-yellow-600">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Unverified
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#8e9297]">MFA Enabled</p>
                        <div className="mt-1">
                          {userDetails.mfa_enabled ? (
                            <span className="inline-flex items-center text-xs text-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Enabled
                            </span>
                          ) : (
                            <span className="text-xs text-[#8e9297]">Disabled</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#8e9297]">Last Login</p>
                        <p className="text-sm text-white mt-1">
                          {userDetails.last_login_at ? formatDate(userDetails.last_login_at) : 'Never'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#8e9297]">Member Since</p>
                        <p className="text-sm text-white mt-1">
                          {selectedUser.joined_at ? formatDate(selectedUser.joined_at) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-[#8e9297]">Loading user details...</p>
                  </div>
                )}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black/50" onClick={() => setShowEditModal(false)}></div>
            <div className="inline-block align-bottom bg-[#2f3136] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-[#2f3136] px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Edit User</h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      resetEdit();
                    }}
                    className="text-[#8e9297] hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-medium text-[#b9bbbe]">
                        First Name *
                      </label>
                      <input
                        id="first_name"
                        type="text"
                        {...registerEdit('first_name')}
                        className="input mt-1"
                      />
                      {editErrors.first_name && (
                        <p className="mt-1 text-sm text-red-600">{editErrors.first_name.message}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="last_name" className="block text-sm font-medium text-[#b9bbbe]">
                        Last Name *
                      </label>
                      <input
                        id="last_name"
                        type="text"
                        {...registerEdit('last_name')}
                        className="input mt-1"
                      />
                      {editErrors.last_name && (
                        <p className="mt-1 text-sm text-red-600">{editErrors.last_name.message}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[#b9bbbe]">
                      Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      {...registerEdit('email')}
                      className="input mt-1"
                    />
                    {editErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{editErrors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-[#b9bbbe]">
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      {...registerEdit('phone')}
                      className="input mt-1"
                      placeholder="+1234567890"
                    />
                  </div>
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-[#b9bbbe]">
                      Status
                    </label>
                    <select
                      id="status"
                      {...registerEdit('status')}
                      className="input mt-1"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="deleted">Deleted</option>
                    </select>
                  </div>
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

      {/* Assign Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-[#36393f]0 bg-opacity-75" onClick={() => setShowRoleModal(false)}></div>
            <div className="inline-block align-bottom bg-[#2f3136] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-[#2f3136] px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Change Role</h3>
                  <button
                    onClick={() => setShowRoleModal(false)}
                    className="text-[#8e9297] hover:text-[#8e9297]"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-[#8e9297]">
                    Assign a new role to <span className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</span>
                  </p>
                  <p className="text-sm text-[#8e9297] mt-1">
                    Current role: <span className="font-medium">{selectedUser.role?.name || 'No role'}</span>
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="role_id" className="block text-sm font-medium text-[#b9bbbe] mb-2">
                      Select Role
                    </label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {/* Default Roles Section - Always visible */}
                      {roles && roles.filter((role: any) => role.is_default || role.is_system_role).length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-[#8e9297] uppercase mb-2">Default Roles</p>
                          {roles
                            ?.filter((role: any) => role.is_default || role.is_system_role)
                            .map((role: any) => {
                              // Roles from assignable endpoint are already filtered, but we still need to check
                              // if we can assign this specific role to this specific user (considering target user's current role)
                              const roleLevel = getRoleHierarchyLevel(role);
                              const targetUserCurrentRoleLevel = getRoleHierarchyLevel(selectedUser.role);
                              
                              // Organization owners can assign any role except owner
                              let canAssignThisRole = false;
                              if (isOrganizationOwner) {
                                canAssignThisRole = !role.is_organization_owner;
                              } else if (currentUserRole) {
                                const currentUserRoleLevel = getRoleHierarchyLevel(currentUserRole);
                                // Can assign if: role level > current user level AND role level >= target user's current level
                                canAssignThisRole = roleLevel > currentUserRoleLevel && roleLevel >= targetUserCurrentRoleLevel && !role.is_organization_owner;
                              }
                              const isCurrentRole = role.id === selectedUser.role?.id;
                              
                              return (
                                <button
                                  key={role.id}
                                  onClick={() => {
                                    if (confirm(`Assign role "${role.name}" to ${selectedUser.first_name} ${selectedUser.last_name}?`)) {
                                      assignRoleMutation.mutate({ userId: selectedUser.id, roleId: role.id });
                                    }
                                  }}
                                  disabled={assignRoleMutation.isPending || isCurrentRole || !canAssignThisRole}
                                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors mb-2 ${
                                    isCurrentRole
                                      ? 'border-primary-500 bg-primary-50'
                                      : canAssignThisRole
                                      ? 'border-purple-200 hover:border-purple-300 hover:bg-purple-50'
                                      : 'border-[#202225] bg-[#36393f] opacity-60'
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div>
                                      <p className="font-medium text-white">{role.name}</p>
                                      {role.description && (
                                        <p className="text-sm text-[#8e9297] mt-1">{role.description}</p>
                                      )}
                                    </div>
                                    {role.is_organization_owner && (
                                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                        Owner
                                      </span>
                                    )}
                                  </div>
                                  {isCurrentRole && (
                                    <CheckCircle2 className="h-5 w-5 text-primary-600" />
                                  )}
                                  {!canAssignThisRole && !isCurrentRole && (
                                    <span className="text-xs text-[#8e9297]">
                                      {role.is_organization_owner ? 'Cannot change' : 'Insufficient permissions'}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                            })}
                        </div>
                      )}
                      
                      {/* Custom Roles Section */}
                      {roles && roles.filter((role: any) => !role.is_default && !role.is_system_role).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[#8e9297] uppercase mb-2">Custom Roles</p>
                          {roles
                            ?.filter((role: any) => !role.is_default && !role.is_system_role)
                            .map((role: any) => {
                              // Roles from assignable endpoint are already filtered, but we still need to check
                              // if we can assign this specific role to this specific user (considering target user's current role)
                              const roleLevel = getRoleHierarchyLevel(role);
                              const targetUserCurrentRoleLevel = getRoleHierarchyLevel(selectedUser.role);
                              
                              // Organization owners can assign any role except owner
                              let canAssignThisRole = false;
                              if (isOrganizationOwner) {
                                canAssignThisRole = !role.is_organization_owner;
                              } else if (currentUserRole) {
                                const currentUserRoleLevel = getRoleHierarchyLevel(currentUserRole);
                                // Can assign if: role level > current user level AND role level >= target user's current level
                                canAssignThisRole = roleLevel > currentUserRoleLevel && roleLevel >= targetUserCurrentRoleLevel && !role.is_organization_owner;
                              }
                              const isCurrentRole = role.id === selectedUser.role?.id;
                              
                              return (
                                <button
                                  key={role.id}
                                  onClick={() => {
                                    if (confirm(`Assign role "${role.name}" to ${selectedUser.first_name} ${selectedUser.last_name}?`)) {
                                      assignRoleMutation.mutate({ userId: selectedUser.id, roleId: role.id });
                                    }
                                  }}
                                  disabled={assignRoleMutation.isPending || isCurrentRole || !canAssignThisRole}
                                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors mb-2 ${
                                    isCurrentRole
                                      ? 'border-primary-500 bg-primary-50'
                                      : canAssignThisRole
                                      ? 'border-[#202225] hover:border-primary-300 hover:bg-[#36393f]'
                                      : 'border-[#202225] bg-[#36393f] opacity-60'
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-white">{role.name}</p>
                                    {role.description && (
                                      <p className="text-sm text-[#8e9297] mt-1">{role.description}</p>
                                    )}
                                  </div>
                                  {isCurrentRole && (
                                    <CheckCircle2 className="h-5 w-5 text-primary-600" />
                                  )}
                                  {!canAssignThisRole && !isCurrentRole && (
                                    <span className="text-xs text-[#8e9297]">Insufficient permissions</span>
                                  )}
                                </div>
                              </button>
                            );
                            })}
                        </div>
                      )}
                      
                      {(!roles || roles.length === 0) && (
                        <p className="text-sm text-[#8e9297] text-center py-4">No roles available</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowRoleModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Access Modal */}
      {showRevokeModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-[#36393f]0 bg-opacity-75" onClick={() => setShowRevokeModal(false)}></div>
            <div className="inline-block align-bottom bg-[#2f3136] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-[#2f3136] px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-red-900">Revoke Access</h3>
                  <button
                    onClick={() => setShowRevokeModal(false)}
                    className="text-[#8e9297] hover:text-[#8e9297]"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> This will revoke access for <strong>{selectedUser.first_name} {selectedUser.last_name}</strong>.
                    They will no longer be able to access this organization.
                  </p>
                </div>
                <form onSubmit={handleRevokeSubmit(onRevokeSubmit)} className="space-y-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...registerRevoke('transfer_data')}
                        className="rounded border-[#36393f] text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-[#b9bbbe]">
                        Transfer data ownership to another user
                      </span>
                    </label>
                    <p className="text-xs text-[#8e9297] mt-1 ml-6">
                      Select a user with the same role to transfer ownership of this user's data
                    </p>
                  </div>

                  {transferData && (
                    <div>
                      <label htmlFor="transfer_to_user_id" className="block text-sm font-medium text-[#b9bbbe]">
                        Transfer To User *
                      </label>
                      <select
                        id="transfer_to_user_id"
                        {...registerRevoke('transfer_to_user_id')}
                        className="input mt-1"
                      >
                        <option value="">Select a user...</option>
                        {data?.users
                          ?.filter((u: any) => 
                            u.id !== selectedUser.id && 
                            u.role?.id === selectedUser.role?.id &&
                            u.status === 'active'
                          )
                          .map((u: any) => (
                            <option key={u.id} value={u.id}>
                              {u.first_name} {u.last_name} ({u.email})
                            </option>
                          ))}
                      </select>
                      {revokeErrors.transfer_to_user_id && (
                        <p className="mt-1 text-sm text-red-600">{revokeErrors.transfer_to_user_id.message}</p>
                      )}
                      {transferData && data?.users?.filter((u: any) => 
                        u.id !== selectedUser.id && 
                        u.role?.id === selectedUser.role?.id &&
                        u.status === 'active'
                      ).length === 0 && (
                        <p className="mt-1 text-sm text-yellow-600">
                          No users with the same role available for data transfer
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-[#b9bbbe]">
                      Reason (Optional)
                    </label>
                    <textarea
                      id="reason"
                      {...registerRevoke('reason')}
                      rows={3}
                      className="input mt-1"
                      placeholder="Enter reason for revoking access..."
                    />
                    {revokeErrors.reason && (
                      <p className="mt-1 text-sm text-red-600">{revokeErrors.reason.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRevokeModal(false);
                        resetRevoke();
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={revokeMutation.isPending}
                      className="btn bg-red-600 hover:bg-red-700 text-white"
                    >
                      {revokeMutation.isPending ? 'Revoking...' : 'Revoke Access'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

