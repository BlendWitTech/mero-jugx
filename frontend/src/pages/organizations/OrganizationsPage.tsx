import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Building2, Settings, Edit, Save, X, MapPin, Phone, Globe, FileText, CheckCircle2, AlertCircle, Upload, File } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { formatLimit } from '../../utils/formatLimit';
import DocumentUpload from '../../components/DocumentUpload';
import DocumentGallery from '../../components/DocumentGallery';

const organizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  tax_id: z.string().max(100).optional(),
  registration_number: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

export default function OrganizationsPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated, accessToken, _hasHydrated } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  const { data: organization, isLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const response = await api.get('/organizations/me');
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

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
      console.log('[Organizations] Package update event received, refetching package data...');
      refetchPackage();
    };
    
    window.addEventListener('package-updated', handlePackageUpdate);
    return () => {
      window.removeEventListener('package-updated', handlePackageUpdate);
    };
  }, [refetchPackage]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: organization,
  });

  // Update form when organization data loads
  useEffect(() => {
    if (organization) {
      reset({
        name: organization.name || '',
        email: organization.email || '',
        phone: organization.phone || '',
        address: organization.address || '',
        city: organization.city || '',
        state: organization.state || '',
        country: organization.country || '',
        postal_code: organization.postal_code || '',
        website: organization.website || '',
        description: organization.description || '',
        tax_id: organization.tax_id || '',
        registration_number: organization.registration_number || '',
        industry: organization.industry || '',
      });
    }
  }, [organization, reset]);

  // Fetch documents
  const { data: documents } = useQuery({
    queryKey: ['organization-documents'],
    queryFn: async () => {
      const response = await api.get('/organizations/me/documents');
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: OrganizationFormData) => {
      const response = await api.put('/organizations/me', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast.success('Organization updated successfully');
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update organization');
    },
  });

  const onSubmit = (data: OrganizationFormData) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    reset(organization);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-64 bg-[#36393f] rounded"></div>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#5865f2] rounded-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Organization</h1>
              <p className="mt-2 text-sm sm:text-base text-[#b9bbbe]">Manage your organization details and settings</p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-primary"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Organization
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Organization Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Building2 className="h-6 w-6 text-[#5865f2] mr-2" />
                <h2 className="text-lg font-semibold text-white">Organization Details</h2>
              </div>
              {isEditing && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className="btn btn-secondary"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={updateMutation.isPending}
                    className="btn btn-primary"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-[#b9bbbe]">
                      Organization Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      {...register('name')}
                      className="input mt-1"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[#b9bbbe]">
                      Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      {...register('email')}
                      className="input mt-1"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-[#b9bbbe]">
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      {...register('phone')}
                      className="input mt-1"
                      placeholder="+1234567890"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-[#b9bbbe]">
                      Website
                    </label>
                    <input
                      id="website"
                      type="url"
                      {...register('website')}
                      className="input mt-1"
                      placeholder="https://example.com"
                    />
                    {errors.website && (
                      <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-[#b9bbbe]">
                    Address
                  </label>
                  <input
                    id="address"
                    type="text"
                    {...register('address')}
                    className="input mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-[#b9bbbe]">
                      City
                    </label>
                    <input
                      id="city"
                      type="text"
                      {...register('city')}
                      className="input mt-1"
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-[#b9bbbe]">
                      State/Province
                    </label>
                    <input
                      id="state"
                      type="text"
                      {...register('state')}
                      className="input mt-1"
                    />
                  </div>

                  <div>
                    <label htmlFor="postal_code" className="block text-sm font-medium text-[#b9bbbe]">
                      Postal Code
                    </label>
                    <input
                      id="postal_code"
                      type="text"
                      {...register('postal_code')}
                      className="input mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-[#b9bbbe]">
                    Country
                  </label>
                  <input
                    id="country"
                    type="text"
                    {...register('country')}
                    className="input mt-1"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-[#b9bbbe]">
                    Description
                  </label>
                  <textarea
                    id="description"
                    {...register('description')}
                    rows={4}
                    className="input mt-1"
                    placeholder="Tell us about your organization..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="tax_id" className="block text-sm font-medium text-[#b9bbbe]">
                      Tax ID
                    </label>
                    <input
                      id="tax_id"
                      type="text"
                      {...register('tax_id')}
                      className="input mt-1"
                      placeholder="Tax identification number"
                    />
                    {errors.tax_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.tax_id.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="registration_number" className="block text-sm font-medium text-[#b9bbbe]">
                      Registration Number
                    </label>
                    <input
                      id="registration_number"
                      type="text"
                      {...register('registration_number')}
                      className="input mt-1"
                      placeholder="Business registration number"
                    />
                    {errors.registration_number && (
                      <p className="mt-1 text-sm text-red-600">{errors.registration_number.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-[#b9bbbe]">
                      Industry
                    </label>
                    <input
                      id="industry"
                      type="text"
                      {...register('industry')}
                      className="input mt-1"
                      placeholder="e.g., Technology, Healthcare"
                    />
                    {errors.industry && (
                      <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
                    )}
                  </div>
                </div>
              </form>
            ) : (
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-[#8e9297] flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    Name
                  </dt>
                  <dd className="mt-1 text-sm text-white">{organization?.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[#8e9297] flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Email
                  </dt>
                  <dd className="mt-1 text-sm text-white">{organization?.email}</dd>
                </div>
                {organization?.phone && (
                  <div>
                    <dt className="text-sm font-medium text-[#8e9297] flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      Phone
                    </dt>
                    <dd className="mt-1 text-sm text-white">{organization.phone}</dd>
                  </div>
                )}
                {(organization?.address || organization?.city || organization?.state || organization?.country) && (
                  <div>
                    <dt className="text-sm font-medium text-[#8e9297] flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Address
                    </dt>
                    <dd className="mt-1 text-sm text-white">
                      {[
                        organization.address,
                        organization.city,
                        organization.state,
                        organization.postal_code,
                        organization.country,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </dd>
                  </div>
                )}
                {organization?.website && (
                  <div>
                    <dt className="text-sm font-medium text-[#8e9297] flex items-center">
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                    </dt>
                    <dd className="mt-1">
                      <a
                        href={organization.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#5865f2] hover:text-[#4752c4]"
                      >
                        {organization.website}
                      </a>
                    </dd>
                  </div>
                )}
                {organization?.description && (
                  <div>
                    <dt className="text-sm font-medium text-[#8e9297] flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Description
                    </dt>
                    <dd className="mt-1 text-sm text-white">{organization.description}</dd>
                  </div>
                )}
                {organization?.tax_id && (
                  <div>
                    <dt className="text-sm font-medium text-[#8e9297]">Tax ID</dt>
                    <dd className="mt-1 text-sm text-white">{organization.tax_id}</dd>
                  </div>
                )}
                {organization?.registration_number && (
                  <div>
                    <dt className="text-sm font-medium text-[#8e9297]">Registration Number</dt>
                    <dd className="mt-1 text-sm text-white">{organization.registration_number}</dd>
                  </div>
                )}
                {organization?.industry && (
                  <div>
                    <dt className="text-sm font-medium text-[#8e9297]">Industry</dt>
                    <dd className="mt-1 text-sm text-white">{organization.industry}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-[#8e9297]">Status</dt>
                  <dd className="mt-1">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#23a55a]/20 text-[#23a55a]">
                      {organization?.status || 'Active'}
                    </span>
                  </dd>
                </div>
              </dl>
            )}
          </div>

          {/* Documents Section */}
          <div className="card mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <File className="h-6 w-6 text-[#5865f2] mr-2" />
                <h2 className="text-lg font-semibold text-white">Documents</h2>
              </div>
              <button
                onClick={() => setShowDocumentModal(true)}
                className="btn btn-primary btn-sm"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </button>
            </div>
            <DocumentGallery 
              documents={documents || []} 
              onUploadClick={() => setShowDocumentModal(true)}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Security Settings */}
          <div className="card">
            <div className="flex items-center mb-4">
              <Settings className="h-6 w-6 text-[#5865f2] mr-2" />
              <h2 className="text-lg font-semibold text-white">Security Settings</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">2FA/MFA Enabled</p>
                  <p className="text-xs text-[#8e9297] mt-1">
                    Require two-factor authentication for all users
                  </p>
                </div>
                {organization?.mfa_enabled ? (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-[#23a55a]/20 text-[#23a55a] rounded-full">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Enabled
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-[#faa61a]/20 text-[#faa61a] rounded-full">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8e9297]">
                Manage MFA settings in the Settings page
              </p>
            </div>
          </div>

          {/* Package Info */}
          {packageInfo && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Current Package</h2>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-[#8e9297]">Package</p>
                  <p className="text-lg font-semibold text-white">
                    {packageInfo.package?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#8e9297]">Price</p>
                  <p className="text-lg font-semibold text-[#5865f2]">
                    ${packageInfo.package?.price === 0 ? 'Free' : packageInfo.package?.price || 0}
                    {packageInfo.package?.price > 0 && <span className="text-sm text-[#8e9297]">/mo</span>}
                  </p>
                </div>
                {packageInfo.current_limits && (
                  <div className="pt-2 border-t border-[#202225]">
                    <p className="text-sm text-[#8e9297] mb-2">Limits</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#8e9297]">Users:</span>
                        <span className="font-medium text-white">{formatLimit(packageInfo.current_limits.users)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8e9297]">Roles:</span>
                        <span className="font-medium text-white">{formatLimit(packageInfo.current_limits.roles)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Upload Modal */}
      <DocumentUpload
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
      />
    </div>
  );
}

