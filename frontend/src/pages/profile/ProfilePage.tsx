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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
  phone: z.string().max(50, 'Phone number is too long').optional().or(z.literal('')),
  avatar_url: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, setUser, isAuthenticated, accessToken, _hasHydrated, organization } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const { isOrganizationOwner, hasPermission } = usePermissions();
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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
              <div className="flex items-center justify-between py-3 border-b border-[#202225]">
                <div>
                  <p className="text-sm font-medium text-white">Password</p>
                  <p className="text-sm text-[#8e9297] mt-1">
                    Last changed: {profile?.password_changed_at ? new Date(profile.password_changed_at).toLocaleDateString() : 'Never'}
                  </p>
                </div>
                <button className="btn btn-secondary">
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
                  <p className="text-sm text-[#8e9297] mt-1">
                    {profile?.mfa_enabled ? 'Enabled' : 'Not enabled'}
                  </p>
                </div>
                <button className="btn btn-secondary">
                  <Shield className="h-4 w-4 mr-2" />
                  {profile?.mfa_enabled ? 'Manage 2FA' : 'Enable 2FA'}
                </button>
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

