import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, X, Mail, Clock, CheckCircle, XCircle, UserPlus, Shield, Sparkles, History, ChevronDown, Mail as MailIcon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const invitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role_id: z.number().min(1, 'Please select a role'),
  message: z.string().max(500, 'Message must be less than 500 characters').optional(),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

export default function InvitationsPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated, accessToken, _hasHydrated } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [historyModal, setHistoryModal] = useState<{ email: string; invitations: any[] } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['invitations'],
    queryFn: async () => {
      const response = await api.get('/invitations');
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  // Fetch roles for the dropdown
  const { data: roles, refetch: refetchRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return response.data || [];
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  // Listen for package update events to refresh roles
  useEffect(() => {
    const handlePackageUpdate = () => {
      console.log('[Invitations] Package update event received, refetching roles...');
      // Invalidate and refetch roles to show newly available roles after package upgrade
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      refetchRoles();
    };
    
    window.addEventListener('package-updated', handlePackageUpdate);
    return () => {
      window.removeEventListener('package-updated', handlePackageUpdate);
    };
  }, [refetchRoles, queryClient]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: InvitationFormData) => {
      const response = await api.post('/invitations', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('Invitation sent successfully');
      setShowCreateModal(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create invitation');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/invitations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('Invitation cancelled');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel invitation');
    },
  });

  const onSubmit = (data: InvitationFormData) => {
    createMutation.mutate(data);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#5865f2] rounded-lg">
              <MailIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Invitations</h1>
              <p className="mt-2 text-sm sm:text-base text-[#b9bbbe]">Manage user invitations to your organization</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Invitation
          </button>
        </div>
      </div>

      {/* Create Invitation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50 backdrop-blur-sm" 
              onClick={() => {
                setShowCreateModal(false);
                reset();
              }}
            ></div>
            <div className="inline-block align-bottom bg-[#2f3136] rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-[#5865f2] to-[#4752c4] px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-[#2f3136]/20 flex items-center justify-center">
                        <UserPlus className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-semibold text-white">Invite Team Member</h3>
                      <p className="text-sm text-white/80 mt-0.5">Send an invitation to join your organization</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      reset();
                    }}
                    className="text-white/80 hover:text-white hover:bg-[#2f3136]/10 rounded-lg p-2 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="bg-[#2f3136] px-6 py-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        {...register('email')}
                        className="input pl-10 w-full border-[#202225] focus:ring-primary-500 focus:border-primary-500"
                        placeholder="colleague@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠</span> {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Role Field */}
                  <div>
                    <label htmlFor="role_id" className="block text-sm font-semibold text-white mb-2">
                      Assign Role <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Shield className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="role_id"
                        {...register('role_id', { valueAsNumber: true })}
                        className="input pl-10 w-full border-[#202225] focus:ring-primary-500 focus:border-primary-500 appearance-none bg-[#2f3136]"
                      >
                        <option value="">Choose a role...</option>
                        {roles?.filter((role: any) => !role.is_organization_owner).map((role: any) => (
                          <option key={role.id} value={role.id}>
                            {role.name}{role.is_default ? ' (Default)' : ''}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    {errors.role_id && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠</span> {errors.role_id.message}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-[#8e9297]">
                      <Sparkles className="h-3 w-3 inline mr-1" />
                      Organization Owner role cannot be assigned via invitations
                    </p>
                  </div>

                  {/* Message Field */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-white mb-2">
                      Personal Message <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      id="message"
                      {...register('message')}
                      rows={4}
                      className="input w-full border-[#202225] focus:ring-primary-500 focus:border-primary-500 resize-none"
                      placeholder="Hi! I'd like to invite you to join our organization. Looking forward to working together!"
                    />
                    <p className="mt-1 text-xs text-[#8e9297]">
                      {(watch('message') || '').length} / 500 characters
                    </p>
                    {errors.message && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠</span> {errors.message.message}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-[#202225]">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        reset();
                      }}
                      className="px-4 py-2 text-sm font-medium text-[#b9bbbe] bg-[#2f3136] border border-[#202225] rounded-lg hover:bg-[#36393f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="px-6 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      {createMutation.isPending ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Invitation
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="card">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm text-[#b9bbbe]">Pending</p>
                <p className="text-2xl font-semibold text-white">
                  {data.invitations?.filter((inv: any) => inv.status === 'pending' && !isExpired(inv.expires_at)).length || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-[#b9bbbe]">Accepted</p>
                <p className="text-2xl font-semibold text-white">
                  {data.invitations?.filter((inv: any) => inv.status === 'accepted').length || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-[#8e9297] mr-3" />
              <div>
                <p className="text-sm text-[#b9bbbe]">Expired/Cancelled</p>
                <p className="text-2xl font-semibold text-white">
                  {data.invitations?.filter((inv: any) => 
                    inv.status === 'expired' || inv.status === 'cancelled' || isExpired(inv.expires_at)
                  ).length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="card animate-pulse">
          <div className="h-64 bg-[#36393f] rounded"></div>
        </div>
      ) : (
        <div className="card mt-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#202225]">
              <thead className="bg-[#36393f]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8e9297] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8e9297] uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8e9297] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8e9297] uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8e9297] uppercase tracking-wider">
                    Invited By
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8e9297] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#2f3136] divide-y divide-[#202225]">
                {data?.invitations && data.invitations.length > 0 ? (() => {
                  // Group invitations by email
                  const groupedByEmail: Record<string, any[]> = {};
                  data.invitations.forEach((invitation: any) => {
                    if (!groupedByEmail[invitation.email]) {
                      groupedByEmail[invitation.email] = [];
                    }
                    groupedByEmail[invitation.email].push(invitation);
                  });

                  // Sort invitations within each group by created_at (newest first)
                  Object.keys(groupedByEmail).forEach((email) => {
                    groupedByEmail[email].sort((a, b) => 
                      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );
                  });

                  return Object.entries(groupedByEmail).map(([email, invitations]) => {
                    const latestInvitation = invitations[0];
                    const expired = isExpired(latestInvitation.expires_at);
                    const hasPending = invitations.some((inv: any) => 
                      inv.status === 'pending' && !isExpired(inv.expires_at)
                    );
                    const pendingInvitation = invitations.find((inv: any) => 
                      inv.status === 'pending' && !isExpired(inv.expires_at)
                    ) || latestInvitation;

                    return (
                      <tr key={email} className="hover:bg-[#36393f]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Mail className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-white">{email}</span>
                            {invitations.length > 1 && (
                              <button
                                onClick={() => setHistoryModal({ email, invitations })}
                                className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                                title="View invitation history"
                              >
                                {invitations.length} invitations
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {pendingInvitation.role ? (
                            <span className="px-2 py-1 text-xs font-medium text-[#b9bbbe] bg-[#393c43] rounded-full">
                              {pendingInvitation.role.name}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            const latestInvitation = invitations[0];
                            const invExpired = isExpired(latestInvitation.expires_at);
                            return (
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  invExpired && latestInvitation.status === 'pending'
                                    ? 'bg-red-100 text-red-800'
                                    : latestInvitation.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : latestInvitation.status === 'accepted'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-[#393c43] text-[#dcddde]'
                                }`}
                              >
                                {invExpired && latestInvitation.status === 'pending' 
                                  ? 'Expired' 
                                  : latestInvitation.status}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-[#8e9297]">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDate(pendingInvitation.expires_at)}
                            {expired && hasPending && (
                              <span className="ml-2 text-xs text-red-600">(Expired)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8e9297]">
                          {pendingInvitation.inviter ? (
                            <span className="flex items-center">
                              <span className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                                <span className="text-primary-600 font-medium text-xs">
                                  {pendingInvitation.inviter.first_name?.[0]?.toUpperCase() || ''}
                                  {pendingInvitation.inviter.last_name?.[0]?.toUpperCase() || ''}
                                </span>
                              </span>
                              <span>
                                {pendingInvitation.inviter.first_name} {pendingInvitation.inviter.last_name}
                              </span>
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Unknown</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {hasPending ? (
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to cancel the pending invitation?')) {
                                  cancelMutation.mutate(pendingInvitation.id);
                                }
                              }}
                              disabled={cancelMutation.isPending}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          ) : latestInvitation.status === 'accepted' ? (
                            <div className="flex items-center justify-end">
                              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                              <span className="text-green-600 font-medium">Accepted</span>
                            </div>
                          ) : latestInvitation.status === 'cancelled' ? (
                            <div className="text-right">
                              {latestInvitation.canceller ? (
                                <>
                                  <div className="text-xs text-[#8e9297] mb-1">Cancelled by</div>
                                  <div className="flex items-center justify-end">
                                    <span className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center mr-2">
                                      <span className="text-red-600 font-medium text-xs">
                                        {latestInvitation.canceller.first_name?.[0]?.toUpperCase() || ''}
                                        {latestInvitation.canceller.last_name?.[0]?.toUpperCase() || ''}
                                      </span>
                                    </span>
                                    <span className="text-sm text-[#b9bbbe]">
                                      {latestInvitation.canceller.first_name} {latestInvitation.canceller.last_name}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-center justify-end">
                                  <X className="h-4 w-4 text-red-600 mr-2" />
                                  <span className="text-red-600 font-medium">Cancelled</span>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    );
                  });
                })() : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-[#8e9297]">
                      <Mail className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>No invitations found. Create your first invitation to get started.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invitation History Modal */}
      {historyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50 backdrop-blur-sm" 
              onClick={() => setHistoryModal(null)}
            ></div>
            <div className="inline-block align-bottom bg-[#2f3136] rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-[#2f3136]/20 flex items-center justify-center">
                        <History className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-semibold text-white">Invitation History</h3>
                      <p className="text-sm text-primary-100 mt-0.5">{historyModal.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setHistoryModal(null)}
                    className="text-white/80 hover:text-white hover:bg-[#2f3136]/10 rounded-lg p-2 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="bg-[#2f3136] px-6 py-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  {historyModal.invitations.map((invitation: any, index: number) => {
                    const invExpired = isExpired(invitation.expires_at);
                    return (
                      <div
                        key={invitation.id}
                        className={`border rounded-lg p-4 ${
                          index === 0 ? 'border-primary-300 bg-primary-50' : 'border-[#202225] bg-[#36393f]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {index === 0 && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-primary-600 text-white rounded-full">
                                  Latest
                                </span>
                              )}
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  invExpired && invitation.status === 'pending'
                                    ? 'bg-red-100 text-red-800'
                                    : invitation.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : invitation.status === 'accepted'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-[#393c43] text-[#dcddde]'
                                }`}
                              >
                                {invExpired && invitation.status === 'pending' 
                                  ? 'Expired' 
                                  : invitation.status}
                              </span>
                              {invitation.role && (
                                <span className="px-2 py-0.5 text-xs font-medium text-[#b9bbbe] bg-[#36393f] rounded-full">
                                  {invitation.role.name}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-[#8e9297]">Created:</span>
                                <span className="ml-2 text-white font-medium">
                                  {formatDate(invitation.created_at)}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#8e9297]">Expires:</span>
                                <span className={`ml-2 font-medium ${
                                  invExpired ? 'text-red-600' : 'text-white'
                                }`}>
                                  {formatDate(invitation.expires_at)}
                                  {invExpired && ' (Expired)'}
                                </span>
                              </div>
                              {invitation.accepted_at && (
                                <div>
                                  <span className="text-[#8e9297]">Accepted:</span>
                                  <span className="ml-2 text-white font-medium">
                                    {formatDate(invitation.accepted_at)}
                                  </span>
                                </div>
                              )}
                              {invitation.inviter && (
                                <div>
                                  <span className="text-[#8e9297]">Invited By:</span>
                                  <span className="ml-2 text-white font-medium">
                                    {invitation.inviter.first_name} {invitation.inviter.last_name}
                                  </span>
                                </div>
                              )}
                              {invitation.status === 'cancelled' && invitation.canceller && (
                                <div>
                                  <span className="text-[#8e9297]">Cancelled By:</span>
                                  <span className="ml-2 text-white font-medium flex items-center">
                                    <span className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center mr-2">
                                      <span className="text-red-600 font-medium text-xs">
                                        {invitation.canceller.first_name?.[0]?.toUpperCase() || ''}
                                        {invitation.canceller.last_name?.[0]?.toUpperCase() || ''}
                                      </span>
                                    </span>
                                    {invitation.canceller.first_name} {invitation.canceller.last_name}
                                  </span>
                                </div>
                              )}
                            </div>
                            {invitation.message && (
                              <div className="mt-3 pt-3 border-t border-[#202225]">
                                <span className="text-[#8e9297] text-sm">Message:</span>
                                <p className="mt-1 text-sm text-[#b9bbbe]">{invitation.message}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-[#36393f] px-6 py-4 border-t border-[#202225]">
                <div className="flex justify-end">
                  <button
                    onClick={() => setHistoryModal(null)}
                    className="px-4 py-2 text-sm font-medium text-[#b9bbbe] bg-[#2f3136] border border-[#202225] rounded-lg hover:bg-[#36393f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

