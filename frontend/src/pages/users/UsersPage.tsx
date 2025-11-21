import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Search, Plus, Edit, Trash2, Eye, MoreVertical, X, Save, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

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
  const { user: currentUser, isAuthenticated, accessToken, _hasHydrated } = useAuthStore();
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
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    retry: 1,
  });

  // Fetch roles for role assignment
  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="mt-2 text-gray-600">Manage organization users and their access</p>
        </div>
        <Link to="/invitations" className="btn btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          Invite User
        </Link>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {error && (
        <div className="card bg-red-50 border border-red-200">
          <p className="text-red-800">
            Error loading users: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card overflow-visible">
          <div className="overflow-x-auto overflow-visible">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.users && data.users.length > 0 ? (
                  data.users.map((user: any) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                              {user.first_name?.[0]?.toUpperCase() || ''}{user.last_name?.[0]?.toUpperCase() || ''}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                            {user.phone && (
                              <div className="text-sm text-gray-500">{user.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                        {user.email_verified ? (
                          <span className="ml-2 text-xs text-green-600">✓ Verified</span>
                        ) : (
                          <span className="ml-2 text-xs text-yellow-600">Unverified</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.role ? (
                          <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                            {user.role.name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">No role</span>
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
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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
                                className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-[101] py-1 min-w-[200px]"
                                style={{
                                  top: `${menuPosition.top}px`,
                                  right: `${menuPosition.right}px`,
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
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleEdit(user);
                                      setActionMenuOpen(null);
                                      setMenuPosition(null);
                                    }}
                                    disabled={isCurrentUser(user.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit User
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleAssignRole(user);
                                      setActionMenuOpen(null);
                                      setMenuPosition(null);
                                    }}
                                    disabled={isCurrentUser(user.id) || user.role?.is_organization_owner}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <Shield className="h-4 w-4 mr-2" />
                                    Change Role
                                  </button>
                                  <div className="border-t border-gray-200 my-1"></div>
                                  <button
                                    onClick={() => {
                                      handleRevoke(user);
                                      setActionMenuOpen(null);
                                      setMenuPosition(null);
                                    }}
                                    disabled={isCurrentUser(user.id) || user.role?.is_organization_owner}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Revoke Access
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No users found. {search && 'Try adjusting your search.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">
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
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowViewModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-400 hover:text-gray-500"
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
                        <h4 className="text-xl font-semibold text-gray-900">
                          {userDetails.first_name} {userDetails.last_name}
                        </h4>
                        <p className="text-sm text-gray-600">{userDetails.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone</p>
                        <p className="text-sm text-gray-900 mt-1">{userDetails.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Status</p>
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
                        <p className="text-sm font-medium text-gray-500">Email Verified</p>
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
                        <p className="text-sm font-medium text-gray-500">MFA Enabled</p>
                        <div className="mt-1">
                          {userDetails.mfa_enabled ? (
                            <span className="inline-flex items-center text-xs text-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Enabled
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">Disabled</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Last Login</p>
                        <p className="text-sm text-gray-900 mt-1">
                          {userDetails.last_login_at ? formatDate(userDetails.last_login_at) : 'Never'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Member Since</p>
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedUser.joined_at ? formatDate(selectedUser.joined_at) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading user details...</p>
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
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowEditModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
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
                      <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
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
                      <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
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
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
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
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
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
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowRoleModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Change Role</h3>
                  <button
                    onClick={() => setShowRoleModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Assign a new role to <span className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Current role: <span className="font-medium">{selectedUser.role?.name || 'No role'}</span>
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="role_id" className="block text-sm font-medium text-gray-700 mb-2">
                      Select Role
                    </label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {/* Default Roles Section - Always visible */}
                      {roles?.filter((role: any) => role.is_default || role.is_system_role).length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Default Roles</p>
                          {roles
                            .filter((role: any) => role.is_default || role.is_system_role)
                            .map((role: any) => (
                              <button
                                key={role.id}
                                onClick={() => {
                                  if (confirm(`Assign role "${role.name}" to ${selectedUser.first_name} ${selectedUser.last_name}?`)) {
                                    assignRoleMutation.mutate({ userId: selectedUser.id, roleId: role.id });
                                  }
                                }}
                                disabled={assignRoleMutation.isPending || role.id === selectedUser.role?.id || role.is_organization_owner}
                                className={`w-full text-left p-3 rounded-lg border-2 transition-colors mb-2 ${
                                  role.id === selectedUser.role?.id
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-purple-200 hover:border-purple-300 hover:bg-purple-50'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div>
                                      <p className="font-medium text-gray-900">{role.name}</p>
                                      {role.description && (
                                        <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                                      )}
                                    </div>
                                    {role.is_organization_owner && (
                                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                        Owner
                                      </span>
                                    )}
                                  </div>
                                  {role.id === selectedUser.role?.id && (
                                    <CheckCircle2 className="h-5 w-5 text-primary-600" />
                                  )}
                                  {role.is_organization_owner && (
                                    <span className="text-xs text-gray-500">Cannot change</span>
                                  )}
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                      
                      {/* Custom Roles Section */}
                      {roles?.filter((role: any) => !role.is_default && !role.is_system_role).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Custom Roles</p>
                          {roles
                            .filter((role: any) => !role.is_default && !role.is_system_role)
                            .map((role: any) => (
                              <button
                                key={role.id}
                                onClick={() => {
                                  if (confirm(`Assign role "${role.name}" to ${selectedUser.first_name} ${selectedUser.last_name}?`)) {
                                    assignRoleMutation.mutate({ userId: selectedUser.id, roleId: role.id });
                                  }
                                }}
                                disabled={assignRoleMutation.isPending || role.id === selectedUser.role?.id}
                                className={`w-full text-left p-3 rounded-lg border-2 transition-colors mb-2 ${
                                  role.id === selectedUser.role?.id
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">{role.name}</p>
                                    {role.description && (
                                      <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                                    )}
                                  </div>
                                  {role.id === selectedUser.role?.id && (
                                    <CheckCircle2 className="h-5 w-5 text-primary-600" />
                                  )}
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                      
                      {(!roles || roles.length === 0) && (
                        <p className="text-sm text-gray-500 text-center py-4">No roles available</p>
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
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowRevokeModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-red-900">Revoke Access</h3>
                  <button
                    onClick={() => setShowRevokeModal(false)}
                    className="text-gray-400 hover:text-gray-500"
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
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Transfer data ownership to another user
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                      Select a user with the same role to transfer ownership of this user's data
                    </p>
                  </div>

                  {transferData && (
                    <div>
                      <label htmlFor="transfer_to_user_id" className="block text-sm font-medium text-gray-700">
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
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
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

