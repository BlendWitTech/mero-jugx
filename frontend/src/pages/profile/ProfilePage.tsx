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
} from 'lucide-react';

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
  phone: z.string().max(50, 'Phone number is too long').optional().or(z.literal('')),
  avatar_url: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { user, setUser, isAuthenticated, accessToken, _hasHydrated } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);

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

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const displayUser = profile || user;
  const initials = `${displayUser?.first_name?.[0] || ''}${displayUser?.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-600">Manage your account information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
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
                        className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center border-2 border-gray-200">
                        <span className="text-2xl font-semibold text-primary-600">
                          {initials}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Avatar URL
                    </label>
                    <div className="flex items-center space-x-2">
                      <Camera className="h-5 w-5 text-gray-400" />
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
                    <p className="mt-1 text-xs text-gray-500">
                      Enter a URL to your profile picture
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-2" />
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
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-2" />
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
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-2" />
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

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
                        className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center border-2 border-gray-200">
                        <span className="text-xl font-semibold text-primary-600">
                          {initials}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900">
                      {displayUser?.first_name} {displayUser?.last_name}
                    </dd>
                  </div>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Address
                  </dt>
                  <dd className="text-sm text-gray-900">{displayUser?.email}</dd>
                  {profile?.email_verified ? (
                    <div className="mt-1 flex items-center text-xs text-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center text-xs text-yellow-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Not verified
                    </div>
                  )}
                </div>

                {profile?.phone && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                      <Phone className="h-4 w-4 mr-2" />
                      Phone Number
                    </dt>
                    <dd className="text-sm text-gray-900">{profile.phone}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          {/* Security Section */}
          <div className="card mt-6">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Security</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">Password</p>
                  <p className="text-sm text-gray-500 mt-1">
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
                  <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500 mt-1">
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email Verified</span>
                {profile?.email_verified ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
              </div>
              {profile?.created_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm text-gray-900">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                View Activity Log
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                Download My Data
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

