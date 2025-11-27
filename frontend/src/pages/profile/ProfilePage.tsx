import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  X,
  Lock,
  Shield,
  CheckCircle2,
  AlertCircle,
  Activity,
  Download,
  Trash2,
  Loader2,
  Bell,
  Eye,
  EyeOff,
  QrCode,
  Key,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
  phone: z.string().max(50, 'Phone number is too long').optional().or(z.literal('')),
  avatar_url: z.string().url('Invalid URL').optional().or(z.literal('')),
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, setUser, isAuthenticated, accessToken, _hasHydrated, organization } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const { isOrganizationOwner, hasPermission } = usePermissions();
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [showMfaManage, setShowMfaManage] = useState(false);
  const [showNotificationPrefs, setShowNotificationPrefs] = useState(false);
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await api.get('/users/me');
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: profile?.first_name || user?.first_name || '',
      last_name: profile?.last_name || user?.last_name || '',
      phone: profile?.phone || '',
      avatar_url: profile?.avatar_url || user?.avatar_url || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile, reset]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await api.put('/users/me', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setUser({
        id: data.id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        avatar_url: data.avatar_url,
      });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleCancel = () => {
    reset({
      first_name: profile?.first_name || user?.first_name || '',
      last_name: profile?.last_name || user?.last_name || '',
      phone: profile?.phone || '',
      avatar_url: profile?.avatar_url || user?.avatar_url || '',
    });
    setIsEditing(false);
  };

  const handleViewActivityLog = () => {
    // Navigate to audit logs filtered for current user
    navigate('/audit-logs', { state: { userId: user?.id } });
  };

  const handleDownloadData = async () => {
    if (!isOrganizationOwner) {
      toast.error('Only organization owners can download account data');
      return;
    }

    setIsDownloading(true);
    try {
      const response = await api.get('/users/me/download-data', {
        responseType: 'blob',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `account-data-${user?.id}-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Account data downloaded successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to download account data');
    } finally {
      setIsDownloading(false);
    }
  };

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordFormData) => {
      const response = await api.put('/users/me/change-password', {
        current_password: data.current_password,
        new_password: data.new_password,
      });
      return response.data;
    },
    onSuccess: () => {
      resetPassword();
      setShowChangePassword(false);
      toast.success('Password changed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  const onPasswordSubmit = (data: ChangePasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  // Initialize MFA setup
  const initializeMfaMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/mfa/setup/initialize');
      return response.data;
    },
    onSuccess: (data) => {
      if (data.temp_setup_token) {
        localStorage.setItem('mfa_setup_token', data.temp_setup_token);
      }
      setShowMfaSetup(true);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to initialize MFA setup');
    },
  });

  // Personal notification preferences
  const { data: personalNotificationPrefs, isLoading: isLoadingPersonalPrefs } = useQuery({
    queryKey: ['notification-preferences', 'personal'],
    queryFn: async () => {
      const response = await api.get('/notifications/preferences', {
        params: { scope: 'personal' },
      });
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  const updatePersonalNotificationPrefsMutation = useMutation({
    mutationFn: async (data: {
      email_enabled?: boolean;
      in_app_enabled?: boolean;
      preferences?: Record<string, { email: boolean; in_app: boolean }>;
    }) => {
      const response = await api.put('/notifications/preferences', {
        ...data,
        scope: 'personal',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', 'personal'] });
      toast.success('Notification preferences updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update notification preferences');
    },
  });

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-64 bg-[#36393f] rounded"></div>
      </div>
    );
  }

  const displayUser = profile || user;
  const initials = `${displayUser?.first_name?.[0] || ''}${displayUser?.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#5865f2] rounded-lg">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Profile</h1>
            <p className="mt-2 text-sm sm:text-base text-[#b9bbbe]">Manage your account information and preferences</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Personal Information</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex items-center space-x-6 mb-6">
                  <div className="flex-shrink-0">
                    {displayUser?.avatar_url ? (
                      <img
                        src={displayUser.avatar_url}
                        alt={`${displayUser.first_name} ${displayUser.last_name}`}
                        className="h-24 w-24 rounded-full object-cover border-2 border-[#202225]"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-[#5865f2]/20 flex items-center justify-center border-2 border-[#202225]">
                        <span className="text-2xl font-semibold text-[#5865f2]">
                          {initials}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-[#b9bbbe] mb-2">
                      Avatar URL
                    </label>
                    <div className="flex items-center space-x-2">
                      <Camera className="h-5 w-5 text-[#8e9297]" />
                      <input
                        type="url"
                        {...register('avatar_url')}
                        className="input flex-1"
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>
                    {errors.avatar_url && (
                      <p className="mt-1 text-sm text-red-600">{errors.avatar_url.message}</p>
                    )}
                    <p className="mt-1 text-xs text-[#8e9297]">
                      Enter a URL to your profile picture
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-[#b9bbbe] mb-1">
                      First Name *
                    </label>
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-[#8e9297] mr-2" />
                      <input
                        id="first_name"
                        type="text"
                        {...register('first_name')}
                        className="input flex-1"
                      />
                    </div>
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-[#b9bbbe] mb-1">
                      Last Name *
                    </label>
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-[#8e9297] mr-2" />
                      <input
                        id="last_name"
                        type="text"
                        {...register('last_name')}
                        className="input flex-1"
                      />
                    </div>
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[#b9bbbe] mb-1">
                    Phone Number
                  </label>
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-[#8e9297] mr-2" />
                    <input
                      id="phone"
                      type="tel"
                      {...register('phone')}
                      className="input flex-1"
                      placeholder="+1234567890"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-[#202225]">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-secondary"
                    disabled={updateProfileMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="btn btn-primary"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <dl className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {displayUser?.avatar_url ? (
                      <img
                        src={displayUser.avatar_url}
                        alt={`${displayUser.first_name} ${displayUser.last_name}`}
                        className="h-20 w-20 rounded-full object-cover border-2 border-[#202225]"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-[#5865f2]/20 flex items-center justify-center border-2 border-[#202225]">
                        <span className="text-xl font-semibold text-[#5865f2]">
                          {initials}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-[#8e9297]">Name</dt>
                    <dd className="mt-1 text-lg font-semibold text-white">
                      {displayUser?.first_name} {displayUser?.last_name}
                    </dd>
                  </div>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Address
                  </dt>
                  <dd className="text-sm text-white">{displayUser?.email}</dd>
                  {profile?.email_verified ? (
                    <div className="mt-1 flex items-center text-xs text-[#23a55a]">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center text-xs text-[#faa61a]">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Not verified
                    </div>
                  )}
                </div>

                {profile?.phone && (
                  <div>
                    <dt className="text-sm font-medium text-[#8e9297] flex items-center mb-1">
                      <Phone className="h-4 w-4 mr-2" />
                      Phone Number
                    </dt>
                    <dd className="text-sm text-white">{profile.phone}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          {/* Security Section */}
          <div className="card mt-6">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-[#5865f2] mr-2" />
              <h2 className="text-lg font-semibold text-white">Security</h2>
            </div>
            <div className="space-y-4">
              {/* Change Password */}
              <div className="py-3 border-b border-[#202225]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-white">Password</p>
                    <p className="text-sm text-[#8e9297] mt-1">
                      Last changed: {profile?.password_changed_at ? new Date(profile.password_changed_at).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowChangePassword(!showChangePassword)}
                    className="btn btn-secondary"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {showChangePassword ? 'Cancel' : 'Change Password'}
                  </button>
                </div>
                {showChangePassword && (
                  <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="mt-4 space-y-4 p-4 bg-[#2f3136] rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-[#b9bbbe] mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.current ? 'text' : 'password'}
                          {...registerPassword('current_password')}
                          className="input w-full pr-10"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e9297] hover:text-white"
                        >
                          {showPassword.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordErrors.current_password && (
                        <p className="mt-1 text-sm text-red-600">{passwordErrors.current_password.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#b9bbbe] mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.new ? 'text' : 'password'}
                          {...registerPassword('new_password')}
                          className="input w-full pr-10"
                          placeholder="Enter new password (min 8 characters)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e9297] hover:text-white"
                        >
                          {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordErrors.new_password && (
                        <p className="mt-1 text-sm text-red-600">{passwordErrors.new_password.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#b9bbbe] mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.confirm ? 'text' : 'password'}
                          {...registerPassword('confirm_password')}
                          className="input w-full pr-10"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e9297] hover:text-white"
                        >
                          {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordErrors.confirm_password && (
                        <p className="mt-1 text-sm text-red-600">{passwordErrors.confirm_password.message}</p>
                      )}
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowChangePassword(false);
                          resetPassword();
                        }}
                        className="btn btn-secondary"
                        disabled={changePasswordMutation.isPending}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                        className="btn btn-primary"
                      >
                        {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Two-Factor Authentication */}
              <div className="py-3 border-b border-[#202225]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
                    <p className="text-sm text-[#8e9297] mt-1">
                      {profile?.mfa_enabled ? (
                        <span className="flex items-center">
                          <CheckCircle2 className="h-4 w-4 text-[#23a55a] mr-1" />
                          Enabled
                        </span>
                      ) : (
                        'Not enabled'
                      )}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      if (profile?.mfa_enabled) {
                        setShowMfaManage(!showMfaManage);
                      } else {
                        initializeMfaMutation.mutate();
                      }
                    }}
                    className="btn btn-secondary"
                    disabled={initializeMfaMutation.isPending}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {profile?.mfa_enabled ? 'Manage 2FA' : 'Enable 2FA'}
                  </button>
                </div>
                {showMfaSetup && initializeMfaMutation.data && (
                  <div className="mt-4 p-4 bg-[#2f3136] rounded-lg">
                    <p className="text-sm text-[#b9bbbe] mb-4">
                      Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                    </p>
                    <div className="flex justify-center mb-4">
                      <img 
                        src={initializeMfaMutation.data.qr_code_url} 
                        alt="MFA QR Code" 
                        className="w-48 h-48"
                      />
                    </div>
                    <p className="text-xs text-[#8e9297] mb-4 text-center">
                      Secret: {initializeMfaMutation.data.secret}
                    </p>
                    <button
                      onClick={() => navigate('/mfa/setup')}
                      className="btn btn-primary w-full"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Complete Setup
                    </button>
                  </div>
                )}
                {showMfaManage && profile?.mfa_enabled && (
                  <div className="mt-4 p-4 bg-[#2f3136] rounded-lg space-y-3">
                    <button
                      onClick={async () => {
                        try {
                          const response = await api.get('/mfa/backup-codes');
                          const codes = response.data.backup_codes;
                          alert(`Your backup codes:\n\n${codes.join('\n')}\n\nSave these codes in a safe place!`);
                        } catch (error: any) {
                          toast.error(error.response?.data?.message || 'Failed to get backup codes');
                        }
                      }}
                      className="btn btn-secondary w-full"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      View Backup Codes
                    </button>
                    <button
                      onClick={async () => {
                        const code = prompt('Enter your 2FA code to regenerate backup codes:');
                        if (code) {
                          try {
                            const response = await api.post('/mfa/backup-codes/regenerate', { code });
                            const codes = response.data.backup_codes;
                            alert(`Your new backup codes:\n\n${codes.join('\n')}\n\nSave these codes in a safe place!`);
                          } catch (error: any) {
                            toast.error(error.response?.data?.message || 'Failed to regenerate backup codes');
                          }
                        }
                      }}
                      className="btn btn-secondary w-full"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Regenerate Backup Codes
                    </button>
                  </div>
                )}
              </div>

              {/* Notification Preferences */}
              <div className="py-3">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-white">Notification Preferences</p>
                    <p className="text-sm text-[#8e9297] mt-1">
                      Manage your personal notification settings
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowNotificationPrefs(!showNotificationPrefs)}
                    className="btn btn-secondary"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    {showNotificationPrefs ? 'Hide' : 'Manage'}
                  </button>
                </div>
                {showNotificationPrefs && (
                  <div className="mt-4 p-4 bg-[#2f3136] rounded-lg space-y-4">
                    {isLoadingPersonalPrefs ? (
                      <div className="text-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-[#5865f2] mx-auto" />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between pb-3 border-b border-[#202225]">
                          <div>
                            <p className="text-sm font-medium text-white">Email Notifications</p>
                            <p className="text-xs text-[#8e9297] mt-1">Master toggle for email notifications</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={personalNotificationPrefs?.email_enabled ?? true}
                              onChange={(e) => {
                                updatePersonalNotificationPrefsMutation.mutate({
                                  email_enabled: e.target.checked,
                                  in_app_enabled: personalNotificationPrefs?.in_app_enabled ?? true,
                                  preferences: personalNotificationPrefs?.preferences || {},
                                });
                              }}
                              disabled={updatePersonalNotificationPrefsMutation.isPending}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-[#4f545c] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5865f2]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5865f2] peer-disabled:opacity-50"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between pb-3 border-b border-[#202225]">
                          <div>
                            <p className="text-sm font-medium text-white">In-App Notifications</p>
                            <p className="text-xs text-[#8e9297] mt-1">Master toggle for in-app notifications</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={personalNotificationPrefs?.in_app_enabled ?? true}
                              onChange={(e) => {
                                updatePersonalNotificationPrefsMutation.mutate({
                                  email_enabled: personalNotificationPrefs?.email_enabled ?? true,
                                  in_app_enabled: e.target.checked,
                                  preferences: personalNotificationPrefs?.preferences || {},
                                });
                              }}
                              disabled={updatePersonalNotificationPrefsMutation.isPending}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-[#4f545c] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5865f2]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5865f2] peer-disabled:opacity-50"></div>
                          </label>
                        </div>
                        <div className="space-y-3">
                          <p className="text-xs font-medium text-[#8e9297] uppercase">Notification Types</p>
                          {['user_invitations', 'role_changes', 'security_alerts'].map((type) => (
                            <div key={type} className="p-3 bg-[#202225] rounded-lg">
                              <p className="text-sm font-medium text-white mb-2 capitalize">
                                {type.replace('_', ' ')}
                              </p>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-[#b9bbbe]">Email</span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={personalNotificationPrefs?.preferences?.[type]?.email ?? true}
                                      onChange={(e) => {
                                        const prefs = personalNotificationPrefs?.preferences || {};
                                        updatePersonalNotificationPrefsMutation.mutate({
                                          email_enabled: personalNotificationPrefs?.email_enabled ?? true,
                                          in_app_enabled: personalNotificationPrefs?.in_app_enabled ?? true,
                                          preferences: {
                                            ...prefs,
                                            [type]: {
                                              email: e.target.checked,
                                              in_app: prefs[type]?.in_app ?? true,
                                            },
                                          },
                                        });
                                      }}
                                      disabled={updatePersonalNotificationPrefsMutation.isPending}
                                      className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-[#4f545c] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#5865f2]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5865f2] peer-disabled:opacity-50"></div>
                                  </label>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-[#b9bbbe]">In-App</span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={personalNotificationPrefs?.preferences?.[type]?.in_app ?? true}
                                      onChange={(e) => {
                                        const prefs = personalNotificationPrefs?.preferences || {};
                                        updatePersonalNotificationPrefsMutation.mutate({
                                          email_enabled: personalNotificationPrefs?.email_enabled ?? true,
                                          in_app_enabled: personalNotificationPrefs?.in_app_enabled ?? true,
                                          preferences: {
                                            ...prefs,
                                            [type]: {
                                              email: prefs[type]?.email ?? true,
                                              in_app: e.target.checked,
                                            },
                                          },
                                        });
                                      }}
                                      disabled={updatePersonalNotificationPrefsMutation.isPending}
                                      className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-[#4f545c] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#5865f2]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5865f2] peer-disabled:opacity-50"></div>
                                  </label>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Status */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Account Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8e9297]">Status</span>
                <span className="px-2 py-1 text-xs font-medium bg-[#23a55a]/20 text-[#23a55a] rounded-full">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8e9297]">Email Verified</span>
                {profile?.email_verified ? (
                  <CheckCircle2 className="h-5 w-5 text-[#23a55a]" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-[#faa61a]" />
                )}
              </div>
              {profile?.created_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#8e9297]">Member Since</span>
                  <span className="text-sm text-white">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={handleViewActivityLog}
                className="w-full text-left px-4 py-2 text-sm text-[#5865f2] hover:bg-[#5865f2]/10 rounded-lg transition-colors flex items-center"
              >
                <Activity className="h-4 w-4 mr-2" />
                View Activity Log
              </button>
              {isOrganizationOwner && (
                <button
                  onClick={handleDownloadData}
                  disabled={isDownloading}
                  className="w-full text-left px-4 py-2 text-sm text-[#5865f2] hover:bg-[#5865f2]/10 rounded-lg transition-colors flex items-center disabled:opacity-50"
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download Account Data
                </button>
              )}
              <button className="w-full text-left px-4 py-2 text-sm text-[#ed4245] hover:bg-[#ed4245]/10 rounded-lg transition-colors flex items-center">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

