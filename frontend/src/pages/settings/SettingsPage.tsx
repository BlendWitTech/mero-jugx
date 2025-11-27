import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Shield, Bell, Lock, Users, Mail, Globe, Database, AlertTriangle, CheckCircle2, Info, Settings as SettingsIcon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { formatLimit } from '../../utils/formatLimit';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated, accessToken, _hasHydrated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'security' | 'notifications' | 'general'>('security');

  const { data: organization, isLoading: isLoadingOrg } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const response = await api.get('/organizations/me');
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  const { data: stats } = useQuery({
    queryKey: ['organization-stats'],
    queryFn: async () => {
      const response = await api.get('/organizations/me/stats');
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  const isOrganizationOwner = organization?.current_user_role?.is_organization_owner || false;

  const { data: notificationPreferences, isLoading: isLoadingPrefs } = useQuery({
    queryKey: ['notification-preferences', 'organization'],
    queryFn: async () => {
      const response = await api.get('/notifications/preferences', {
        params: { scope: 'organization' },
      });
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken && isOrganizationOwner,
  });

  const updateNotificationPreferencesMutation = useMutation({
    mutationFn: async (data: {
      email_enabled?: boolean;
      in_app_enabled?: boolean;
      preferences?: Record<string, { email: boolean; in_app: boolean }>;
      scope?: 'personal' | 'organization';
    }) => {
      const response = await api.put('/notifications/preferences', {
        ...data,
        scope: 'organization',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Notification preferences updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update notification preferences');
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { mfa_enabled?: boolean }) => {
      const response = await api.put('/organizations/me/settings', data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      if (variables.mfa_enabled) {
        if (data.requires_mfa_setup && data.temp_setup_token) {
          localStorage.setItem('mfa_setup_token', data.temp_setup_token);
          toast.success('MFA enabled. Please set up 2FA to continue.');
          setTimeout(() => {
            window.location.href = '/mfa/setup';
          }, 500);
        } else {
          toast.success('MFA enabled. All users will need to set up 2FA.');
        }
      } else {
        toast.success('Settings updated successfully');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    },
  });

  if (isLoadingOrg) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-[#b9bbbe]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#36393f]">
      {/* Header */}
      <div className="bg-[#2f3136] border-b border-[#202225] px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[#5865f2] rounded-lg">
            <SettingsIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-sm text-[#b9bbbe] mt-1">Manage your organization and account settings</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-[#393c43] text-white shadow-lg'
                : 'text-[#b9bbbe] hover:bg-[#393c43] hover:text-[#dcddde]'
            }`}
          >
            <Shield className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium text-sm">Security</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'bg-[#393c43] text-white shadow-lg'
                : 'text-[#b9bbbe] hover:bg-[#393c43] hover:text-[#dcddde]'
            }`}
          >
            <Bell className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium text-sm">Notifications</span>
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
              activeTab === 'general'
                ? 'bg-[#393c43] text-white shadow-lg'
                : 'text-[#b9bbbe] hover:bg-[#393c43] hover:text-[#dcddde]'
            }`}
          >
            <Globe className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium text-sm">General</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-[#2f3136] rounded-lg p-6 border border-[#202225]">
                <div className="flex items-center mb-6">
                  <Shield className="h-6 w-6 text-[#5865f2] mr-3" />
                  <h2 className="text-xl font-semibold text-white">Security Settings</h2>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-4 border-b border-[#202225]">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Enable 2FA/MFA</p>
                      <p className="text-sm text-[#b9bbbe] mt-1">
                        Require two-factor authentication for all users in this organization
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={organization?.mfa_enabled || false}
                        onChange={(e) => {
                          updateSettingsMutation.mutate({ mfa_enabled: e.target.checked });
                        }}
                        disabled={updateSettingsMutation.isPending}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#4f545c] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5865f2]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5865f2] peer-disabled:opacity-50"></div>
                    </label>
                  </div>

                  <div className="py-4 border-b border-[#202225]">
                    <div className="flex items-start">
                      <Lock className="h-5 w-5 text-[#b9bbbe] mr-3 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Password Policy</p>
                        <p className="text-sm text-[#b9bbbe] mt-1">
                          Configure password requirements for organization users
                        </p>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center text-sm text-[#b9bbbe]">
                            <CheckCircle2 className="h-4 w-4 text-[#23a55a] mr-2" />
                            Minimum 8 characters required
                          </div>
                          <div className="flex items-center text-sm text-[#b9bbbe]">
                            <CheckCircle2 className="h-4 w-4 text-[#23a55a] mr-2" />
                            Password complexity enforced
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="py-4">
                    <div className="flex items-start">
                      <Users className="h-5 w-5 text-[#b9bbbe] mr-3 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Session Management</p>
                        <p className="text-sm text-[#b9bbbe] mt-1">
                          Manage user sessions and access tokens
                        </p>
                        <div className="mt-3">
                          <Link
                            to="/audit-logs"
                            className="text-sm text-[#5865f2] hover:text-[#4752c4] inline-flex items-center"
                          >
                            View active sessions →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#2f3136] rounded-lg p-6 border border-[#202225]">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-[#faa61a] mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Security Recommendations</p>
                    <ul className="mt-2 space-y-1 text-sm text-[#b9bbbe]">
                      {!organization?.mfa_enabled && (
                        <li>• Enable 2FA/MFA to enhance security</li>
                      )}
                      <li>• Regularly review audit logs for suspicious activity</li>
                      <li>• Keep user roles and permissions up to date</li>
                      <li>• Remove access for users who no longer need it</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {!isOrganizationOwner ? (
                <div className="bg-[#2f3136] rounded-lg p-6 border border-[#202225]">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-[#faa61a]" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">Access Restricted</h3>
                      <p className="text-sm text-[#b9bbbe] mt-1">
                        Only organization owners can manage organization notification preferences.
                      </p>
                      <p className="text-sm text-[#b9bbbe] mt-2">
                        You can manage your personal notification preferences in your <Link to="/profile" className="text-[#5865f2] hover:text-[#4752c4] underline">Profile</Link> page.
                      </p>
                    </div>
                  </div>
                </div>
              ) : isLoadingPrefs ? (
                <div className="bg-[#2f3136] rounded-lg p-6 border border-[#202225] animate-pulse">
                  <div className="h-64 bg-[#36393f] rounded"></div>
                </div>
              ) : (
                <>
                  <div className="bg-[#2f3136] rounded-lg p-6 border border-[#202225]">
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-white">Organization Notification Preferences</h3>
                      <p className="text-sm text-[#b9bbbe] mt-1">
                        These settings apply to all notifications sent to the organization. Only organization owners can manage these preferences.
                      </p>
                    </div>
                    <div className="p-3 bg-[#5865f2]/10 border border-[#5865f2]/20 rounded-lg">
                      <p className="text-sm text-[#b9bbbe]">
                        <strong className="text-white">Note:</strong> Personal notification preferences can be managed in your <Link to="/profile" className="text-[#5865f2] hover:text-[#4752c4] underline">Profile</Link> page.
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#2f3136] rounded-lg p-6 border border-[#202225]">
                    <div className="flex items-center mb-6">
                      <Bell className="h-6 w-6 text-[#5865f2] mr-3" />
                      <h2 className="text-xl font-semibold text-white">
                        Organization Notification Preferences
                      </h2>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b border-[#202225]">
                          <div>
                            <p className="text-sm font-medium text-white">Global Email Notifications</p>
                            <p className="text-sm text-[#b9bbbe] mt-1">
                              Master toggle for all email notifications
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPreferences?.email_enabled ?? true}
                              onChange={(e) => {
                                updateNotificationPreferencesMutation.mutate({
                                  email_enabled: e.target.checked,
                                  in_app_enabled: notificationPreferences?.in_app_enabled ?? true,
                                  preferences: notificationPreferences?.preferences || {},
                                });
                              }}
                              disabled={updateNotificationPreferencesMutation.isPending}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-[#4f545c] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5865f2]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5865f2] peer-disabled:opacity-50"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between pb-4 border-b border-[#202225]">
                          <div>
                            <p className="text-sm font-medium text-white">Global In-App Notifications</p>
                            <p className="text-sm text-[#b9bbbe] mt-1">
                              Master toggle for all in-app notifications
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPreferences?.in_app_enabled ?? true}
                              onChange={(e) => {
                                updateNotificationPreferencesMutation.mutate({
                                  email_enabled: notificationPreferences?.email_enabled ?? true,
                                  in_app_enabled: e.target.checked,
                                  preferences: notificationPreferences?.preferences || {},
                                });
                              }}
                              disabled={updateNotificationPreferencesMutation.isPending}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-[#4f545c] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5865f2]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5865f2] peer-disabled:opacity-50"></div>
                          </label>
                        </div>
                      </div>

                      <div>
                        <div className="mb-4 p-3 bg-[#5865f2]/10 border border-[#5865f2]/20 rounded-lg">
                          <p className="text-xs text-[#b9bbbe]">
                            <strong className="text-white">Important Notifications:</strong> Security alerts, MFA changes, user access revocation, and package upgrades are always sent regardless of preferences.
                          </p>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-semibold text-white">Notification Types</h3>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                const allEnabled = {
                                  user_invitations: { email: true, in_app: true },
                                  role_changes: { email: true, in_app: true },
                                  security_alerts: { email: true, in_app: true },
                                };
                                updateNotificationPreferencesMutation.mutate({
                                  email_enabled: notificationPreferences?.email_enabled ?? true,
                                  in_app_enabled: notificationPreferences?.in_app_enabled ?? true,
                                  preferences: allEnabled,
                                });
                              }}
                              className="text-xs px-3 py-1.5 bg-[#5865f2] text-white rounded-md hover:bg-[#4752c4] transition-colors"
                              disabled={updateNotificationPreferencesMutation.isPending}
                            >
                              Select All
                            </button>
                            <button
                              onClick={() => {
                                const allDisabled = {
                                  user_invitations: { email: false, in_app: false },
                                  role_changes: { email: false, in_app: false },
                                  security_alerts: { email: false, in_app: false },
                                };
                                updateNotificationPreferencesMutation.mutate({
                                  email_enabled: notificationPreferences?.email_enabled ?? true,
                                  in_app_enabled: notificationPreferences?.in_app_enabled ?? true,
                                  preferences: allDisabled,
                                });
                              }}
                              className="text-xs px-3 py-1.5 bg-[#393c43] text-[#b9bbbe] rounded-md hover:bg-[#404249] transition-colors"
                              disabled={updateNotificationPreferencesMutation.isPending}
                            >
                              Deselect All
                            </button>
                          </div>
                        </div>

                        {/* Notification type toggles - simplified for space */}
                        <div className="space-y-4">
                          {['user_invitations', 'role_changes', 'security_alerts'].map((type) => (
                            <div key={type} className="py-4 border-b border-[#202225] last:border-0">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <p className="text-sm font-medium text-white capitalize">
                                    {type.replace('_', ' ')}
                                  </p>
                                  <p className="text-sm text-[#b9bbbe] mt-1">
                                    {type === 'security_alerts' ? 'Always sent (critical)' : 'Notify when this occurs'}
                                  </p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-[#b9bbbe]">Email</span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={notificationPreferences?.preferences?.[type]?.email ?? true}
                                      onChange={(e) => {
                                        const prefs = notificationPreferences?.preferences || {};
                                        updateNotificationPreferencesMutation.mutate({
                                          email_enabled: notificationPreferences?.email_enabled ?? true,
                                          in_app_enabled: notificationPreferences?.in_app_enabled ?? true,
                                          preferences: {
                                            ...prefs,
                                            [type]: {
                                              email: e.target.checked,
                                              in_app: prefs[type]?.in_app ?? true,
                                            },
                                          },
                                        });
                                      }}
                                      disabled={updateNotificationPreferencesMutation.isPending}
                                      className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-[#4f545c] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5865f2]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5865f2] peer-disabled:opacity-50"></div>
                                  </label>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-[#b9bbbe]">In-App</span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={notificationPreferences?.preferences?.[type]?.in_app ?? true}
                                      onChange={(e) => {
                                        const prefs = notificationPreferences?.preferences || {};
                                        updateNotificationPreferencesMutation.mutate({
                                          email_enabled: notificationPreferences?.email_enabled ?? true,
                                          in_app_enabled: notificationPreferences?.in_app_enabled ?? true,
                                          preferences: {
                                            ...prefs,
                                            [type]: {
                                              email: prefs[type]?.email ?? true,
                                              in_app: e.target.checked,
                                            },
                                          },
                                        });
                                      }}
                                      disabled={updateNotificationPreferencesMutation.isPending}
                                      className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-[#4f545c] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5865f2]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5865f2] peer-disabled:opacity-50"></div>
                                  </label>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#2f3136] rounded-lg p-6 border border-[#202225]">
                    <div className="flex items-center mb-4">
                      <Mail className="h-6 w-6 text-[#5865f2] mr-3" />
                      <h2 className="text-xl font-semibold text-white">Email Settings</h2>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">
                          Notification Email
                        </label>
                        <input
                          type="email"
                          value={organization?.email || ''}
                          disabled
                          className="w-full px-4 py-2 bg-[#202225] border border-[#202225] rounded-lg text-white placeholder-[#8e9297] focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-[#b9bbbe]">
                          Organization email address for notifications
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="bg-[#2f3136] rounded-lg p-6 border border-[#202225]">
                <div className="flex items-center mb-6">
                  <Info className="h-6 w-6 text-[#5865f2] mr-3" />
                  <h2 className="text-xl font-semibold text-white">Organization Information</h2>
                </div>
                {organization && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-[#b9bbbe]">Organization Name</p>
                        <p className="text-base font-medium text-white">{organization.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#b9bbbe]">Email</p>
                        <p className="text-base font-medium text-white">{organization.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#b9bbbe]">Status</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          organization.status === 'active' 
                            ? 'bg-[#23a55a]/20 text-[#23a55a]' 
                            : organization.status === 'suspended'
                            ? 'bg-[#faa61a]/20 text-[#faa61a]'
                            : 'bg-[#4f545c] text-[#b9bbbe]'
                        }`}>
                          {organization.status || 'Active'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-[#b9bbbe]">Created</p>
                        <p className="text-base font-medium text-white">
                          {organization.created_at 
                            ? new Date(organization.created_at).toLocaleDateString() 
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-[#202225]">
                      <Link
                        to="/organizations"
                        className="text-sm text-[#5865f2] hover:text-[#4752c4] inline-flex items-center"
                      >
                        Manage organization details →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-[#2f3136] rounded-lg p-6 border border-[#202225]">
                <div className="flex items-center mb-6">
                  <Database className="h-6 w-6 text-[#5865f2] mr-3" />
                  <h2 className="text-xl font-semibold text-white">Usage & Limits</h2>
                </div>
                {stats ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-[#b9bbbe]">Total Users</p>
                        <p className="text-2xl font-semibold text-white">
                          {stats.total_users || 0} / {formatLimit(stats.user_limit)}
                        </p>
                        <div className="mt-2 w-full bg-[#202225] rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              (stats.user_usage_percentage || 0) >= 90 ? 'bg-[#ed4245]' : 
                              (stats.user_usage_percentage || 0) >= 75 ? 'bg-[#faa61a]' : 'bg-[#5865f2]'
                            }`}
                            style={{ width: `${Math.min(stats.user_usage_percentage || 0, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-[#b9bbbe] mt-1">
                          {stats.user_usage_percentage || 0}% used
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#b9bbbe]">Total Roles</p>
                        <p className="text-2xl font-semibold text-white">
                          {stats.total_roles || 0} / {formatLimit(stats.role_limit)}
                        </p>
                        <div className="mt-2 w-full bg-[#202225] rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              (stats.role_usage_percentage || 0) >= 90 ? 'bg-[#ed4245]' : 
                              (stats.role_usage_percentage || 0) >= 75 ? 'bg-[#faa61a]' : 'bg-[#23a55a]'
                            }`}
                            style={{ width: `${Math.min(stats.role_usage_percentage || 0, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-[#b9bbbe] mt-1">
                          {stats.role_usage_percentage || 0}% used
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-[#202225]">
                      <Link
                        to="/packages"
                        className="text-sm text-[#5865f2] hover:text-[#4752c4] inline-flex items-center"
                      >
                        View package details and upgrade options →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-[#b9bbbe]">Loading usage statistics...</p>
                  </div>
                )}
              </div>

              <div className="bg-[#2f3136] rounded-lg p-6 border border-[#202225]">
                <div className="flex items-center mb-6">
                  <Users className="h-6 w-6 text-[#5865f2] mr-3" />
                  <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link
                    to="/users"
                    className="p-4 border border-[#202225] rounded-lg hover:border-[#5865f2] hover:bg-[#5865f2]/10 transition-colors bg-[#202225]"
                  >
                    <p className="text-sm font-medium text-white">Manage Users</p>
                    <p className="text-xs text-[#b9bbbe] mt-1">View and manage organization users</p>
                  </Link>
                  <Link
                    to="/roles"
                    className="p-4 border border-[#202225] rounded-lg hover:border-[#5865f2] hover:bg-[#5865f2]/10 transition-colors bg-[#202225]"
                  >
                    <p className="text-sm font-medium text-white">Manage Roles</p>
                    <p className="text-xs text-[#b9bbbe] mt-1">Configure roles and permissions</p>
                  </Link>
                  <Link
                    to="/invitations"
                    className="p-4 border border-[#202225] rounded-lg hover:border-[#5865f2] hover:bg-[#5865f2]/10 transition-colors bg-[#202225]"
                  >
                    <p className="text-sm font-medium text-white">Invitations</p>
                    <p className="text-xs text-[#b9bbbe] mt-1">Send and manage user invitations</p>
                  </Link>
                  <Link
                    to="/audit-logs"
                    className="p-4 border border-[#202225] rounded-lg hover:border-[#5865f2] hover:bg-[#5865f2]/10 transition-colors bg-[#202225]"
                  >
                    <p className="text-sm font-medium text-white">Audit Logs</p>
                    <p className="text-xs text-[#b9bbbe] mt-1">View organization activity logs</p>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
