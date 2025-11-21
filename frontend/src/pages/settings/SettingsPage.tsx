import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Shield, Bell, Lock, Users, Mail, Globe, Database, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

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

  // Check if user is organization owner
  const isOrganizationOwner = organization?.current_user_role?.is_organization_owner || false;
  
  // Scope state for notification preferences
  const [preferenceScope, setPreferenceScope] = useState<'personal' | 'organization'>('personal');

  // Fetch notification preferences with scope
  const { data: notificationPreferences, isLoading: isLoadingPrefs } = useQuery({
    queryKey: ['notification-preferences', preferenceScope],
    queryFn: async () => {
      const response = await api.get('/notifications/preferences', {
        params: { scope: preferenceScope },
      });
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  // Update notification preferences mutation
  const updateNotificationPreferencesMutation = useMutation({
    mutationFn: async (data: {
      email_enabled?: boolean;
      in_app_enabled?: boolean;
      preferences?: Record<string, { email: boolean; in_app: boolean }>;
      scope?: 'personal' | 'organization';
    }) => {
      const response = await api.put('/notifications/preferences', {
        ...data,
        scope: preferenceScope,
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
        // Check if current user needs to set up MFA
        if (data.requires_mfa_setup && data.temp_setup_token) {
          // Store the temporary setup token
          localStorage.setItem('mfa_setup_token', data.temp_setup_token);
          toast.success('MFA enabled. Please set up 2FA to continue.');
          // Redirect to MFA setup page
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
      <div className="card animate-pulse">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your organization and account settings</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('security')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'security'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="h-5 w-5 inline mr-2" />
            Security
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notifications'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Bell className="h-5 w-5 inline mr-2" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'general'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Globe className="h-5 w-5 inline mr-2" />
            General
          </button>
        </nav>
      </div>

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between py-4 border-b border-gray-200">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Enable 2FA/MFA</p>
                  <p className="text-sm text-gray-500 mt-1">
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
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
                </label>
              </div>

              <div className="py-4 border-b border-gray-200">
                <div className="flex items-start">
                  <Lock className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Password Policy</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Configure password requirements for organization users
                    </p>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        Minimum 8 characters required
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        Password complexity enforced
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="py-4">
                <div className="flex items-start">
                  <Users className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Session Management</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Manage user sessions and access tokens
                    </p>
                    <div className="mt-3">
                      <Link
                        to="/audit-logs"
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        View active sessions →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-yellow-50 border-yellow-200">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Security Recommendations</p>
                <ul className="mt-2 space-y-1 text-sm text-yellow-800">
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
          {isLoadingPrefs ? (
            <div className="card animate-pulse">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <>
              {/* Scope Selection for Organization Owners */}
              {isOrganizationOwner && (
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Preference Scope</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Choose whether to manage personal or organization-level preferences
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setPreferenceScope('personal')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        preferenceScope === 'personal'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Personal Preferences
                    </button>
                    <button
                      onClick={() => setPreferenceScope('organization')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        preferenceScope === 'organization'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Organization Preferences
                    </button>
                  </div>
                  {preferenceScope === 'organization' && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Organization-level preferences:</strong> These settings apply to all notifications sent to the organization. Only organization owners can manage these preferences.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="card">
                <div className="flex items-center mb-4">
                  <Bell className="h-6 w-6 text-primary-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {preferenceScope === 'organization' ? 'Organization Notification Preferences' : 'Personal Notification Preferences'}
                  </h2>
                </div>
                <div className="space-y-6">
                  {/* Global Toggles */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Global Email Notifications</p>
                        <p className="text-sm text-gray-500 mt-1">
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
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Global In-App Notifications</p>
                        <p className="text-sm text-gray-500 mt-1">
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
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
                      </label>
                    </div>
                  </div>

                  {/* Notification Type Preferences */}
                  <div>
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <strong>Important Notifications:</strong> Security alerts, MFA changes, user access revocation, and package upgrades are always sent regardless of preferences. Organization updates and role changes are sent to relevant roles (Owners/Admins).
                      </p>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-900">Notification Types</h3>
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
                          className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
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
                          className="text-xs px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                          disabled={updateNotificationPreferencesMutation.isPending}
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    {/* User Invitations */}
                    <div className="py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">User Invitations</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Notify when users are invited or join
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => {
                              const prefs = notificationPreferences?.preferences || {};
                              updateNotificationPreferencesMutation.mutate({
                                email_enabled: notificationPreferences?.email_enabled ?? true,
                                in_app_enabled: notificationPreferences?.in_app_enabled ?? true,
                                preferences: {
                                  ...prefs,
                                  user_invitations: { email: true, in_app: true },
                                },
                              });
                            }}
                            className="text-xs px-2 py-1 text-primary-600 hover:text-primary-700"
                            disabled={updateNotificationPreferencesMutation.isPending}
                          >
                            Select
                          </button>
                          <button
                            onClick={() => {
                              const prefs = notificationPreferences?.preferences || {};
                              updateNotificationPreferencesMutation.mutate({
                                email_enabled: notificationPreferences?.email_enabled ?? true,
                                in_app_enabled: notificationPreferences?.in_app_enabled ?? true,
                                preferences: {
                                  ...prefs,
                                  user_invitations: { email: false, in_app: false },
                                },
                              });
                            }}
                            className="text-xs px-2 py-1 text-gray-600 hover:text-gray-700"
                            disabled={updateNotificationPreferencesMutation.isPending}
                          >
                            Deselect
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Email</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPreferences?.preferences?.user_invitations?.email ?? true}
                              onChange={(e) => {
                                const prefs = notificationPreferences?.preferences || {};
                                updateNotificationPreferencesMutation.mutate({
                                  email_enabled: notificationPreferences?.email_enabled ?? true,
                                  in_app_enabled: notificationPreferences?.in_app_enabled ?? true,
                                  preferences: {
                                    ...prefs,
                                    user_invitations: {
                                      email: e.target.checked,
                                      in_app: prefs.user_invitations?.in_app ?? true,
                                    },
                                  },
                                });
                              }}
                              disabled={updateNotificationPreferencesMutation.isPending}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">In-App</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPreferences?.preferences?.user_invitations?.in_app ?? true}
                              onChange={(e) => {
                                const prefs = notificationPreferences?.preferences || {};
                                updateNotificationPreferencesMutation.mutate({
                                  email_enabled: notificationPreferences?.email_enabled ?? true,
                                  in_app_enabled: notificationPreferences?.in_app_enabled ?? true,
                                  preferences: {
                                    ...prefs,
                                    user_invitations: {
                                      email: prefs.user_invitations?.email ?? true,
                                      in_app: e.target.checked,
                                    },
                                  },
                                });
                              }}
                              disabled={updateNotificationPreferencesMutation.isPending}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Role Changes */}
                    <div className="py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Role Changes</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Notify when roles or permissions are modified
                            {isOrganizationOwner && (
                              <span className="ml-2 text-xs text-blue-600">(Admins & Owners)</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => {
                              const prefs = notificationPreferences?.preferences || {};
                              updateNotificationPreferencesMutation.mutate({
                                email_enabled: notificationPreferences?.email_enabled ?? true,
                                in_app_enabled: notificationPreferences?.in_app_enabled ?? true,
                                preferences: {
                                  ...prefs,
                                  role_changes: { email: true, in_app: true },
                                },
                              });
                            }}
                            className="text-xs px-2 py-1 text-primary-600 hover:text-primary-700"
                            disabled={updateNotificationPreferencesMutation.isPending}
                          >
                            Select
                          </button>
                          <button
                            onClick={() => {
                              const prefs = notificationPreferences?.preferences || {};
                              updateNotificationPreferencesMutation.mutate({
                                email_enabled: notificationPreferences?.email_enabled ?? true,
                                in_app_enabled: notificationPreferences?.in_app_enabled ?? true,
                                preferences: {
                                  ...prefs,
                                  role_changes: { email: false, in_app: false },
                                },
                              });
                            }}
                            className="text-xs px-2 py-1 text-gray-600 hover:text-gray-700"
                            disabled={updateNotificationPreferencesMutation.isPending}
                          >
                            Deselect
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Email</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPreferences?.preferences?.role_changes?.email ?? true}
                              onChange={(e) => {
                                const prefs = notificationPreferences?.preferences || {};
                                updateNotificationPreferencesMutation.mutate({
                                  email_enabled: notificationPreferences?.email_enabled ?? true,
                                  in_app_enabled: notificationPreferences?.in_app_enabled ?? true,
                                  preferences: {
                                    ...prefs,
                                    role_changes: {
                                      email: e.target.checked,
                                      in_app: prefs.role_changes?.in_app ?? true,
                                    },
                                  },
                                });
                              }}
                              disabled={updateNotificationPreferencesMutation.isPending}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">In-App</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPreferences?.preferences?.role_changes?.in_app ?? true}
                              onChange={(e) => {
                                const prefs = notificationPreferences?.preferences || {};
                                updateNotificationPreferencesMutation.mutate({
                                  email_enabled: notificationPreferences?.email_enabled ?? true,
                                  in_app_enabled: notificationPreferences?.in_app_enabled ?? true,
                                  preferences: {
                                    ...prefs,
                                    role_changes: {
                                      email: prefs.role_changes?.email ?? true,
                                      in_app: e.target.checked,
                                    },
                                  },
                                });
                              }}
                              disabled={updateNotificationPreferencesMutation.isPending}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Security Alerts */}
                    <div className="py-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900">Security Alerts</p>
                            <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded">
                              Always Sent
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Critical security notifications are always sent to all users regardless of preferences
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => {
                              const prefs = notificationPreferences?.preferences || {};
                              updateNotificationPreferencesMutation.mutate({
                                email_enabled: notificationPreferences?.email_enabled ?? true,
                                in_app_enabled: notificationPreferences?.in_app_enabled ?? true,
                                preferences: {
                                  ...prefs,
                                  security_alerts: { email: true, in_app: true },
                                },
                              });
                            }}
                            className="text-xs px-2 py-1 text-primary-600 hover:text-primary-700"
                            disabled={updateNotificationPreferencesMutation.isPending}
                          >
                            Select
                          </button>
                          <button
                            onClick={() => {
                              const prefs = notificationPreferences?.preferences || {};
                              updateNotificationPreferencesMutation.mutate({
                                email_enabled: notificationPreferences?.email_enabled ?? true,
                                in_app_enabled: notificationPreferences?.in_app_enabled ?? true,
                                preferences: {
                                  ...prefs,
                                  security_alerts: { email: false, in_app: false },
                                },
                              });
                            }}
                            className="text-xs px-2 py-1 text-gray-600 hover:text-gray-700"
                            disabled={updateNotificationPreferencesMutation.isPending}
                          >
                            Deselect
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Email</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPreferences?.preferences?.security_alerts?.email ?? true}
                              onChange={(e) => {
                                const prefs = notificationPreferences?.preferences || {};
                                updateNotificationPreferencesMutation.mutate({
                                  email_enabled: notificationPreferences?.email_enabled ?? true,
                                  in_app_enabled: notificationPreferences?.in_app_enabled ?? true,
                                  preferences: {
                                    ...prefs,
                                    security_alerts: {
                                      email: e.target.checked,
                                      in_app: prefs.security_alerts?.in_app ?? true,
                                    },
                                  },
                                });
                              }}
                              disabled={updateNotificationPreferencesMutation.isPending}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">In-App</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPreferences?.preferences?.security_alerts?.in_app ?? true}
                              onChange={(e) => {
                                const prefs = notificationPreferences?.preferences || {};
                                updateNotificationPreferencesMutation.mutate({
                                  email_enabled: notificationPreferences?.email_enabled ?? true,
                                  in_app_enabled: notificationPreferences?.in_app_enabled ?? true,
                                  preferences: {
                                    ...prefs,
                                    security_alerts: {
                                      email: prefs.security_alerts?.email ?? true,
                                      in_app: e.target.checked,
                                    },
                                  },
                                });
                              }}
                              disabled={updateNotificationPreferencesMutation.isPending}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="card">
            <div className="flex items-center mb-4">
              <Mail className="h-6 w-6 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Email Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notification Email
                </label>
                <input
                  type="email"
                  value={organization?.email || ''}
                  disabled
                  className="input bg-gray-50"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Organization email address for notifications
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center mb-4">
              <Info className="h-6 w-6 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Organization Information</h2>
            </div>
            {organization && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Organization Name</p>
                    <p className="text-base font-medium text-gray-900">{organization.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-base font-medium text-gray-900">{organization.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      organization.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : organization.status === 'suspended'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {organization.status || 'Active'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="text-base font-medium text-gray-900">
                      {organization.created_at 
                        ? new Date(organization.created_at).toLocaleDateString() 
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <Link
                    to="/organizations"
                    className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center"
                  >
                    Manage organization details →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center mb-4">
              <Database className="h-6 w-6 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Usage & Limits</h2>
            </div>
            {stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.total_users || 0} / {stats.user_limit || 0}
                    </p>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          (stats.user_usage_percentage || 0) >= 90 ? 'bg-red-500' : 
                          (stats.user_usage_percentage || 0) >= 75 ? 'bg-yellow-500' : 'bg-primary-600'
                        }`}
                        style={{ width: `${Math.min(stats.user_usage_percentage || 0, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.user_usage_percentage || 0}% used
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Roles</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.total_roles || 0} / {stats.role_limit || 0}
                    </p>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          (stats.role_usage_percentage || 0) >= 90 ? 'bg-red-500' : 
                          (stats.role_usage_percentage || 0) >= 75 ? 'bg-yellow-500' : 'bg-green-600'
                        }`}
                        style={{ width: `${Math.min(stats.role_usage_percentage || 0, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.role_usage_percentage || 0}% used
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <Link
                    to="/packages"
                    className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center"
                  >
                    View package details and upgrade options →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">Loading usage statistics...</p>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/users"
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900">Manage Users</p>
                <p className="text-xs text-gray-500 mt-1">View and manage organization users</p>
              </Link>
              <Link
                to="/roles"
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900">Manage Roles</p>
                <p className="text-xs text-gray-500 mt-1">Configure roles and permissions</p>
              </Link>
              <Link
                to="/invitations"
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900">Invitations</p>
                <p className="text-xs text-gray-500 mt-1">Send and manage user invitations</p>
              </Link>
              <Link
                to="/audit-logs"
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900">Audit Logs</p>
                <p className="text-xs text-gray-500 mt-1">View organization activity logs</p>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

