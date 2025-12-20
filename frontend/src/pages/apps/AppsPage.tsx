import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import {
  Grid3x3,
  Search,
  Filter,
  Star,
  ShoppingCart,
  Check,
  X,
  Calendar,
  CreditCard,
  Loader2,
  Sparkles,
  TrendingUp,
  Clock,
  Zap,
  Shield,
  Users,
  Settings,
  ChevronRight,
  Play,
  Pause,
  RefreshCw,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { getErrorMessage, logError } from '../../utils/errorHandler';
import { convertUSDToNPR, formatCurrency, isNepalRegion } from '../../utils/currency';
import { usePermissions } from '../../hooks/usePermissions';
import { marketplaceService } from '../../services/marketplaceService';
import { LogIn, ShoppingBag, Pin, PinOff } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

interface App {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string | null;
  icon_url: string | null;
  banner_url: string | null;
  screenshots: string[] | null;
  category: string;
  tags: string[] | null;
  price: number;
  billing_period: 'monthly' | 'yearly';
  trial_days: number;
  features: Record<string, any> | null;
  permissions: string[] | null;
  developer_name: string;
  developer_email: string | null;
  developer_website: string | null;
  version: string;
  support_url: string | null;
  documentation_url: string | null;
  status: 'draft' | 'active' | 'archived';
  is_featured: boolean;
  sort_order: number;
  subscription_count: number;
  rating: number | null;
  review_count: number;
  created_at: string;
  updated_at: string;
}

interface OrganizationApp {
  id: number;
  organization_id: string;
  app_id: number;
  app: App;
  status: 'trial' | 'active' | 'cancelled' | 'expired';
  subscription_start: string;
  subscription_end: string;
  next_billing_date: string | null;
  trial_ends_at: string | null;
  trial_used: boolean;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  auto_renew: boolean;
  subscription_price: number;
  billing_period: 'monthly' | 'yearly';
  payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function AppsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { organization } = useAuthStore();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [isNepal] = useState(() => isNepalRegion());
  const { hasPermission } = usePermissions();
  const canSubscribe = hasPermission('apps.subscribe');
  const canManage = hasPermission('apps.manage');
  const canView = hasPermission('apps.view');

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'trial' | 'expired'>('all');
  const [showMyApps, setShowMyApps] = useState(false);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [showAppModal, setShowAppModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseBillingPeriod, setPurchaseBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [purchaseGateway, setPurchaseGateway] = useState<'stripe' | 'esewa'>('esewa');
  const [startTrial, setStartTrial] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [accessAppId, setAccessAppId] = useState<number | null>(null);

  // Fetch apps
  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['apps', searchTerm, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      params.append('status', 'active');
      const response = await api.get(`/apps?${params.toString()}`);
      return response.data;
    },
    enabled: canView,
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['app-categories'],
    queryFn: async () => {
      const response = await api.get('/apps/categories');
      return response.data;
    },
    enabled: canView,
  });

  // Fetch organization apps
  const { data: orgAppsData, isLoading: orgAppsLoading } = useQuery({
    queryKey: ['organization-apps', slug, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      const response = await api.get(
        `/organizations/${organization?.id}/apps?${params.toString()}`,
      );
      return response.data;
    },
    enabled: !!organization?.id && canSubscribe,
  });

  // Fetch favorites
  const { data: favoriteAppsData } = useQuery({
    queryKey: ['marketplace-favorites'],
    queryFn: marketplaceService.getFavorites,
    enabled: !!organization?.id,
  });

  // Fetch pinned apps
  const { data: pinnedAppsData } = useQuery({
    queryKey: ['marketplace-pinned'],
    queryFn: marketplaceService.getPinned,
    enabled: !!organization?.id,
  });

  // Fetch organization members for user selection
  const { data: membersData } = useQuery({
    queryKey: ['users', organization?.id],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
    enabled: !!organization?.id && (showPurchaseModal || showAccessModal || showAppModal),
  });

  // Fetch app access for modal (when app is selected and subscribed)
  // Note: We'll define isSubscribed after orgApps is available
  const { data: currentAppAccess } = useQuery({
    queryKey: ['app-access-modal', selectedApp?.id, organization?.id],
    queryFn: async () => {
      if (!selectedApp?.id || !organization?.id) return [];
      try {
        const response = await api.get(`/organizations/${organization.id}/apps/${selectedApp.id}/access`);
        // Handle both { data: [...] } and [...] formats
        return response.data?.data || response.data || [];
      } catch (error: any) {
        // Don't throw for 403/404/500 - just return empty array
        if (error.response?.status === 403 || error.response?.status === 404 || error.response?.status === 500) {
          console.warn('Failed to fetch app access:', error.response?.status);
          return [];
        }
        throw error;
      }
    },
    enabled: !!organization?.id && !!selectedApp?.id && showAppModal && canManage,
    retry: false, // Don't retry on errors
  });

  // Fetch app access users
  const { data: appAccessData, refetch: refetchAppAccess } = useQuery({
    queryKey: ['app-access', accessAppId, organization?.id],
    queryFn: async () => {
      if (!accessAppId || !organization?.id) return [];
      try {
        const response = await api.get(
          `/organizations/${organization.id}/apps/${accessAppId}/access`,
        );
        return response.data || [];
      } catch (error: any) {
        if (error?.response?.status === 403) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!accessAppId && !!organization?.id && showAccessModal && canManage,
  });

  const favoriteAppIds = (favoriteAppsData || []).map((app: any) => app.id);
  const pinnedAppIds = (pinnedAppsData || []).map((app: any) => app.id);

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (appId: number) => {
      const isFavorite = favoriteAppIds.includes(appId);
      let newFavorites: number[];
      
      if (isFavorite) {
        newFavorites = favoriteAppIds.filter((id: number) => id !== appId);
      } else {
        if (favoriteAppIds.length >= 4) {
          throw new Error('Maximum 4 favorite apps allowed');
        }
        newFavorites = [...favoriteAppIds, appId];
      }
      
      await marketplaceService.setFavorites(newFavorites);
      return newFavorites;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-favorites'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update favorites');
    },
  });

  // Toggle pin mutation
  const togglePinMutation = useMutation({
    mutationFn: async (appId: number) => {
      const isPinned = pinnedAppIds.includes(appId);
      
      if (isPinned) {
        await marketplaceService.unpinApp(appId);
      } else {
        // Check if user has access to the app (must be subscribed)
        const hasAccess = isSubscribed(appId);
        if (!hasAccess) {
          throw new Error('You must subscribe to this app before pinning it');
        }
        await marketplaceService.pinApp(appId);
      }
      return !isPinned;
    },
    onSuccess: (isPinned) => {
      // Invalidate both pinned and last-used queries to ensure sidebar updates
      queryClient.invalidateQueries({ queryKey: ['marketplace-pinned'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-last-used'] });
      toast.success(isPinned ? 'App pinned to sidebar' : 'App unpinned from sidebar');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update pin status');
    },
  });

  // Purchase app mutation
  const purchaseMutation = useMutation({
    mutationFn: async (appId: number) => {
      // Check if already subscribed and purchased
      const existing = orgApps.find((oa) => oa.app_id === appId);
      if (existing && existing.payment_id && (existing.status === 'active' || existing.status === 'trial')) {
        throw new Error('You have already purchased this app');
      }

      const response = await api.post(`/organizations/${organization?.id}/apps`, {
        app_id: appId,
        billing_period: purchaseBillingPeriod,
        payment_method: purchaseGateway,
        start_trial: startTrial && !existing, // Only start trial if not already subscribed
        auto_renew: autoRenew,
        user_ids: selectedUserIds, // Include selected user IDs
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organization-apps'] });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      setShowPurchaseModal(false);
      setSelectedApp(null);
      setSelectedUserIds([]); // Reset selected users

      // Handle payment redirect like packages do
      if (data.payment_url) {
        // Store return path before redirecting
        localStorage.setItem('payment_return_path', `/org/${slug}/apps`);
        
        // For Stripe, redirect directly
        if (purchaseGateway === 'stripe') {
          window.location.href = data.payment_url;
          } else {
            // For eSewa, check if we have form data
            // The payment_url should be the form URL for eSewa
            // If backend returns payment_form with formData, use that
            if (data.payment_form && data.payment_form.formData) {
              const form = document.createElement('form');
              form.method = 'POST';
              form.action = data.payment_url || data.payment_form.formUrl || data.payment_form.action;
              form.target = '_self';
              form.style.display = 'none';
              form.enctype = 'application/x-www-form-urlencoded';
              form.acceptCharset = 'UTF-8';

              Object.entries(data.payment_form.formData).forEach(([key, value]) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = String(value);
                form.appendChild(input);
              });

              document.body.appendChild(form);
              // Small delay to ensure form is in DOM
              setTimeout(() => {
                form.submit();
              }, 100);
            } else if (data.payment_url) {
              // Fallback to direct redirect
              window.location.href = data.payment_url;
            } else {
              toast.error('Payment form data is missing. Please try again.');
            }
          }
      } else if (data.organization_app?.status === 'trial') {
        toast.success(`Trial started! Your ${data.organization_app.app?.name || 'app'} trial is now active.`);
      } else {
        toast.success('App subscription created successfully!');
      }
    },
    onError: (error: any) => {
      logError(error, 'App Purchase');
      let errorMessage = getErrorMessage(error);
      
      // Check for eSewa token authentication error
      const errorData = error?.response?.data;
      if (errorData?.set_token_message || errorData?.user_token) {
        errorMessage = 'eSewa requires token authentication. Please enable Mock Mode in .env (ESEWA_USE_MOCK_MODE=true) for development testing.';
      }
      
      toast.error(errorMessage, { duration: 5000 });
    },
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: async ({ appId, reason }: { appId: number; reason?: string }) => {
      const response = await api.patch(
        `/organizations/${organization?.id}/apps/${appId}/cancel`,
        { cancellation_reason: reason },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-apps'] });
      toast.success('Subscription cancelled successfully');
    },
    onError: (error: any) => {
      logError(error, 'Cancel Subscription');
      toast.error(getErrorMessage(error));
    },
  });

  // Renew subscription mutation
  const renewMutation = useMutation({
    mutationFn: async ({ appId, paymentMethod }: { appId: number; paymentMethod: 'stripe' | 'esewa' }) => {
      const response = await api.post(
        `/organizations/${organization?.id}/apps/${appId}/renew`,
        { payment_method: paymentMethod },
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organization-apps'] });
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        toast.success('Subscription renewed successfully!');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to renew subscription');
    },
  });

  const apps: App[] = appsData?.data || [];
  const categories: string[] = categoriesData || [];
  const orgApps: OrganizationApp[] = orgAppsData?.data || [];

  // Helper function to check if app is subscribed (defined after orgApps)
  const isSubscribed = (appId: number): boolean => {
    const subscription = orgApps.find((oa) => oa.app_id === appId);
    return subscription ? (subscription.status === 'active' || subscription.status === 'trial') : false;
  };

  // Filter apps based on showMyApps
  const displayedApps = showMyApps
    ? apps.filter((app) => orgApps.some((oa) => oa.app_id === app.id))
    : apps;


  // Check if app is purchased (has payment)
  const isPurchased = (appId: number) => {
    const subscription = orgApps.find((oa) => oa.app_id === appId);
    return subscription?.payment_id != null;
  };

  // Check if user has access to app
  const hasAppAccess = async (appId: number): Promise<boolean> => {
    try {
      const response = await api.get(`/organizations/${organization?.id}/apps/${appId}/access`);
      return response.data.has_access || false;
    } catch {
      return false;
    }
  };

  const getSubscriptionStatus = (appId: number) => {
    const subscription = orgApps.find((oa) => oa.app_id === appId);
    return subscription?.status || null;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handlePurchase = (app: App) => {
    setSelectedApp(app);
    setSelectedUserIds([]); // Reset selected users
    setShowPurchaseModal(true);
  };

  const handleManageAccess = (appId: number) => {
    setAccessAppId(appId);
    setShowAccessModal(true);
  };

  // Grant app access mutation
  const grantAccessMutation = useMutation({
    mutationFn: async ({ appId, userId }: { appId: number; userId: string }) => {
      // Ensure app_id is a number and user_id is a valid UUID string
      const payload = {
        app_id: Number(appId),
        user_id: String(userId),
      };
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(payload.user_id)) {
        throw new Error('Invalid user ID format');
      }
      
      const response = await api.post(
        `/organizations/${organization?.id}/apps/${appId}/access/grant`,
        payload,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['app-access', accessAppId] });
      queryClient.invalidateQueries({ queryKey: ['app-access-modal'] });
      refetchAppAccess();
      // Show success message from backend or default
      const message = data?.message || 'Access granted successfully';
      toast.success(message);
    },
    onError: (error: any) => {
      // Log full error for debugging
      console.error('Grant access error:', error.response?.data || error);
      
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to grant access';
      const status = error.response?.status;
      
      // Show specific error messages
      if (status === 400) {
        // 400 Bad Request - validation or business logic error
        if (errorMessage.includes('already has access')) {
          toast.error('User already has access to this app');
        } else if (errorMessage.includes('not subscribed')) {
          toast.error('App is not subscribed by this organization. Please subscribe to the app first.');
        } else if (errorMessage.includes('not a member')) {
          toast.error('User is not a member of this organization');
        } else if (errorMessage.includes('user_id') || errorMessage.includes('app_id') || errorMessage.includes('validation')) {
          toast.error('Invalid user or app ID. Please try again.');
        } else {
          toast.error(errorMessage || 'Invalid request. Please check the user and app information.');
        }
      } else if (status === 403) {
        toast.error('You do not have permission to grant app access');
      } else if (status === 404) {
        toast.error('App or user not found');
      } else {
        toast.error(errorMessage);
      }
    },
  });

  // Revoke app access mutation
  const revokeAccessMutation = useMutation({
    mutationFn: async ({ appId, userId }: { appId: number; userId: string }) => {
      const response = await api.post(
        `/organizations/${organization?.id}/apps/${appId}/access/revoke`,
        { app_id: appId, user_id: userId },
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['app-access', accessAppId] });
      queryClient.invalidateQueries({ queryKey: ['app-access-modal'] });
      refetchAppAccess();
      // Show success message from backend or default
      const message = data?.message || 'Access revoked successfully';
      toast.success(message);
    },
    onError: (error: any) => {
      // Log full error for debugging
      console.error('Revoke access error:', error.response?.data || error);
      
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to revoke access';
      const status = error.response?.status;
      
      // Show specific error messages
      if (status === 400) {
        if (errorMessage.includes('user_id') || errorMessage.includes('app_id')) {
          toast.error('Invalid user or app ID. Please try again.');
        } else {
          toast.error(errorMessage || 'Invalid request. Please check the user and app information.');
        }
      } else if (status === 403) {
        toast.error('You do not have permission to revoke app access');
      } else if (status === 404) {
        toast.error('App access not found');
      } else {
        toast.error(errorMessage);
      }
    },
  });

  if (!canView) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1d29] via-[#1e2132] to-[#252938] text-white">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400">You don't have permission to view apps.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl backdrop-blur-sm border border-purple-500/30">
              <Grid3x3 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                App Marketplace
              </h1>
              <p className="mt-1" style={{ color: theme.colors.textSecondary }}>Discover and subscribe to powerful apps</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: theme.colors.textSecondary }} />
              <input
                type="text"
                placeholder="Search apps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all"
                style={{ 
                  backgroundColor: theme.colors.surface + '80',
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  ['--tw-ring-color' as any]: theme.colors.primary
                } as React.CSSProperties}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {canSubscribe && (
                <button
                  onClick={() => setShowMyApps(!showMyApps)}
                  className={`px-4 py-3 rounded-xl backdrop-blur-sm border transition-all ${
                    showMyApps
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {showMyApps ? 'All Apps' : 'My Apps'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Apps Grid */}
        {appsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="backdrop-blur-sm rounded-2xl overflow-hidden animate-pulse" style={{ background: `linear-gradient(to bottom right, ${theme.colors.surface}, ${theme.colors.background})`, border: `1px solid ${theme.colors.border}` }}>
                <div className="h-48" style={{ backgroundColor: theme.colors.surface, opacity: 0.5 }}></div>
                <div className="p-6 space-y-4">
                  <div className="h-6 rounded w-3/4" style={{ backgroundColor: theme.colors.surface, opacity: 0.5 }}></div>
                  <div className="h-4 rounded w-1/2" style={{ backgroundColor: theme.colors.surface, opacity: 0.5 }}></div>
                  <div className="h-4 rounded w-full" style={{ backgroundColor: theme.colors.surface, opacity: 0.5 }}></div>
                  <div className="h-4 rounded w-2/3" style={{ backgroundColor: theme.colors.surface, opacity: 0.5 }}></div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-6 rounded w-20" style={{ backgroundColor: theme.colors.surface, opacity: 0.5 }}></div>
                    <div className="h-10 w-24 rounded-xl" style={{ backgroundColor: theme.colors.surface, opacity: 0.5 }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {displayedApps.map((app) => {
              const subscribed = isSubscribed(app.id);
              const subscriptionStatus = getSubscriptionStatus(app.id);

              return (
                <div
                  key={app.id}
                  className="group relative flex flex-col items-center p-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  style={{ 
                    background: `linear-gradient(to bottom right, ${theme.colors.surface}, ${theme.colors.background})`,
                    border: `1px solid ${theme.colors.border}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.primary;
                    e.currentTarget.style.boxShadow = `0 10px 20px -5px ${theme.colors.primary}33`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => {
                    setSelectedApp(app);
                    setShowAppModal(true);
                  }}
                >
                  {/* App Icon */}
                  <div className="relative mb-3">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{ 
                        background: app.icon_url ? 'transparent' : `linear-gradient(to bottom right, ${theme.colors.primary}33, ${theme.colors.secondary}33)`,
                        border: `2px solid ${theme.colors.border}`
                      }}
                    >
                      {app.icon_url ? (
                        <img
                          src={app.icon_url}
                          alt={app.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Grid3x3 className="w-10 h-10" style={{ color: theme.colors.primary }} />
                      )}
                    </div>
                    {/* Status Badges */}
                    {app.is_featured && (
                      <div className="absolute -top-1 -right-1 bg-gradient-to-r from-[#faa61a] to-[#fbbf24] text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg backdrop-blur-sm border border-[#faa61a]/30">
                        <Star className="w-2.5 h-2.5 fill-current" />
                      </div>
                    )}
                    {subscribed && (
                      <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-[#23a55a] to-[#2dd4bf] text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg backdrop-blur-sm border border-[#23a55a]/30">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>

                  {/* App Name */}
                  <h3 className="text-sm font-semibold text-center transition-colors duration-300 line-clamp-2 w-full" 
                    style={{ color: theme.colors.text }}
                    onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary} 
                    onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text}
                  >
                    {app.name}
                  </h3>
                </div>
              );
            })}
          </div>
        )}

        {/* App Detail Modal */}
        {showAppModal && selectedApp && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1e2132] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
              <div className="relative">
                {/* Banner */}
                <div className="relative h-64 bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                  {selectedApp.banner_url ? (
                    <img
                      src={selectedApp.banner_url}
                      alt={selectedApp.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      {selectedApp.icon_url ? (
                        <img
                          src={selectedApp.icon_url}
                          alt={selectedApp.name}
                          className="w-32 h-32 rounded-2xl"
                        />
                      ) : (
                        <Grid3x3 className="w-24 h-24 text-purple-400/50" />
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setShowAppModal(false);
                      setSelectedApp(null);
                    }}
                    className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-lg hover:bg-black/70 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">{selectedApp.name}</h2>
                      <p className="text-gray-400">{selectedApp.category}</p>
                    </div>
                    <div className="text-right">
                      {selectedApp.price === 0 ? (
                        <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                          Free
                        </div>
                      ) : (
                        <>
                          <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            {formatCurrency(selectedApp.price, 'USD')}
                          </div>
                          <div className="text-xl font-semibold text-gray-300">
                            {formatCurrency(convertUSDToNPR(selectedApp.price), 'NPR')}
                          </div>
                          <div className="text-sm text-gray-400">
                            /{selectedApp.billing_period === 'monthly' ? 'month' : 'year'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-300 mb-6">{selectedApp.description}</p>

                  {/* Subscription Info */}
                  {(() => {
                    const subscription = orgApps.find((oa) => oa.app_id === selectedApp.id);
                    return isSubscribed(selectedApp.id) && subscription && (
                      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
                        <h3 className="text-lg font-semibold mb-4">Subscription Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-400 mb-1">Status</p>
                            <p className="font-semibold capitalize">{subscription.status}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400 mb-1">Billing Period</p>
                            <p className="font-semibold capitalize">{subscription.billing_period}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400 mb-1">Expires</p>
                            <p className="font-semibold">
                              {formatDate(subscription.subscription_end)}
                            </p>
                          </div>
                          {subscription.next_billing_date && (
                            <div>
                              <p className="text-sm text-gray-400 mb-1">Next Billing</p>
                              <p className="font-semibold">
                                {formatDate(subscription.next_billing_date)}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-gray-400 mb-1">Auto-Renewal</p>
                            <p className="font-semibold">
                              {subscription.auto_renew ? (
                                <span className="text-green-400">Enabled</span>
                              ) : (
                                <span className="text-gray-400">Disabled</span>
                              )}
                            </p>
                          </div>
                        </div>
                        {canManage && (
                          <div className="flex flex-wrap gap-3 mt-6">
                            {subscription.status === 'active' && (
                              <>
                                <button
                                  onClick={() => {
                                    const newAutoRenew = !subscription.auto_renew;
                                    api.put(
                                      `/organizations/${organization?.id}/apps/${selectedApp.id}`,
                                      { auto_renew: newAutoRenew },
                                    )
                                      .then(() => {
                                        queryClient.invalidateQueries({ queryKey: ['organization-apps'] });
                                        toast.success(
                                          `Auto-renewal ${newAutoRenew ? 'enabled' : 'disabled'}`,
                                        );
                                      })
                                      .catch((error) => {
                                        toast.error(error.response?.data?.message || 'Failed to update auto-renewal');
                                      });
                                  }}
                                  className={`px-4 py-2 rounded-lg border transition-colors ${
                                    subscription.auto_renew
                                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/30'
                                      : 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30'
                                  }`}
                                >
                                  {subscription.auto_renew ? 'Disable Auto-Renew' : 'Enable Auto-Renew'}
                                </button>
                                <button
                                  onClick={() => {
                                    cancelMutation.mutate({
                                      appId: selectedApp.id,
                                      reason: 'User cancelled',
                                    });
                                  }}
                                  className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors"
                                >
                                  Cancel Subscription
                                </button>
                              </>
                            )}
                            {subscription.status === 'expired' && (
                              <button
                                onClick={() => {
                                  renewMutation.mutate({
                                    appId: selectedApp.id,
                                    paymentMethod: purchaseGateway,
                                  });
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all"
                              >
                                Renew Subscription
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Features */}
                  {selectedApp.features && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4">Features</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(selectedApp.features).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-center gap-2 text-sm bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3"
                          >
                            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <span className="text-gray-300">
                              {key}: {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* User Access Management */}
                  {isSubscribed(selectedApp.id) && canManage && (() => {
                    const usersWithAccess = currentAppAccess || [];
                    const allUsers = (membersData?.users || membersData?.data || membersData || []);
                    const usersWithoutAccess = allUsers.filter((user: any) => 
                      !usersWithAccess.some((access: any) => access.user?.id === user.id || access.user_id === user.id)
                    );

                    return (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          User Access Management
                        </h3>

                        {/* Users with Access */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-3 text-gray-400">Users with Access ({usersWithAccess.length})</h4>
                          {usersWithAccess.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {usersWithAccess.map((access: any) => {
                                const user = access.user || allUsers.find((u: any) => u.id === access.user_id);
                                if (!user) return null;
                                
                                const isRevoking = revokeAccessMutation.isPending && 
                                  revokeAccessMutation.variables?.userId === user.id &&
                                  revokeAccessMutation.variables?.appId === selectedApp.id;

                                return (
                                  <div
                                    key={access.id || user.id}
                                    className="flex items-center justify-between p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-400 font-semibold border border-purple-500/30">
                                        {user.first_name?.[0] || user.email?.[0] || 'U'}
                                      </div>
                                      <div>
                                        <p className="text-white font-medium">
                                          {user.first_name} {user.last_name}
                                        </p>
                                        <p className="text-sm text-gray-400">{user.email}</p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`Are you sure you want to revoke access from ${user.first_name} ${user.last_name}?`)) {
                                          revokeAccessMutation.mutate({ 
                                            appId: selectedApp.id, 
                                            userId: user.id 
                                          }, {
                                            onSuccess: () => {
                                              // Refetch app access to update the list
                                              queryClient.invalidateQueries({ queryKey: ['app-access-modal', selectedApp.id] });
                                            }
                                          });
                                        }
                                      }}
                                      disabled={isRevoking}
                                      className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isRevoking ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <>
                                          <UserMinus className="h-4 w-4" />
                                          Revoke
                                        </>
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
                              <p className="text-sm text-gray-400">No users have access yet</p>
                            </div>
                          )}
                        </div>

                        {/* Users without Access */}
                        <div>
                          <h4 className="text-sm font-medium mb-3 text-gray-400">Grant Access ({usersWithoutAccess.length})</h4>
                          {usersWithoutAccess.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {usersWithoutAccess.map((user: any) => {
                                const isGranting = grantAccessMutation.isPending && 
                                  grantAccessMutation.variables?.userId === user.id &&
                                  grantAccessMutation.variables?.appId === selectedApp.id;

                                return (
                                  <div
                                    key={user.id}
                                    className="flex items-center justify-between p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-400 font-semibold border border-purple-500/30">
                                        {user.first_name?.[0] || user.email?.[0] || 'U'}
                                      </div>
                                      <div>
                                        <p className="text-white font-medium">
                                          {user.first_name} {user.last_name}
                                        </p>
                                        <p className="text-sm text-gray-400">{user.email}</p>
                                        {user.role && (
                                          <p className="text-xs text-gray-500 mt-1">Role: {user.role.name}</p>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        grantAccessMutation.mutate({ 
                                          appId: selectedApp.id, 
                                          userId: user.id 
                                        });
                                      }}
                                      disabled={isGranting}
                                      className="px-3 py-1.5 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isGranting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <>
                                          <UserPlus className="h-4 w-4" />
                                          Grant Access
                                        </>
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
                              <Check className="h-8 w-8 mx-auto mb-2 text-green-400" />
                              <p className="text-sm text-gray-400">All users have access</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Actions */}
                  <div className="flex gap-3">
                    {/* Pin Button */}
                    {isSubscribed(selectedApp.id) && (
                      <button
                        onClick={() => {
                          togglePinMutation.mutate(selectedApp.id);
                        }}
                        className={`px-4 py-2 rounded-lg transition-all ${
                          pinnedAppIds.includes(selectedApp.id)
                            ? 'text-[#5865f2] bg-[#5865f2]/20 border border-[#5865f2]/50'
                            : 'text-gray-400 border border-white/10 hover:text-[#5865f2] hover:bg-[#5865f2]/10'
                        }`}
                        title={pinnedAppIds.includes(selectedApp.id) ? 'Unpin from sidebar' : 'Pin to sidebar'}
                      >
                        {pinnedAppIds.includes(selectedApp.id) ? (
                          <Pin className="w-5 h-5 fill-current" />
                        ) : (
                          <PinOff className="w-5 h-5" />
                        )}
                      </button>
                    )}
                    {/* Favorite Button */}
                    <button
                      onClick={() => {
                        toggleFavoriteMutation.mutate(selectedApp.id);
                      }}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        favoriteAppIds.includes(selectedApp.id)
                          ? 'text-yellow-400 bg-yellow-400/20 border border-yellow-400/50'
                          : 'text-gray-400 border border-white/10 hover:text-yellow-400 hover:bg-yellow-400/10'
                      }`}
                      title={favoriteAppIds.includes(selectedApp.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`w-5 h-5 ${favoriteAppIds.includes(selectedApp.id) ? 'fill-current' : ''}`} />
                    </button>
                    {(() => {
                      const purchased = isPurchased(selectedApp.id);
                      if (!isSubscribed(selectedApp.id) && canSubscribe) {
                        return (
                          <button
                            onClick={() => {
                              setShowAppModal(false);
                              handlePurchase(selectedApp);
                            }}
                            className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all"
                          >
                            Subscribe Now
                          </button>
                        );
                      } else if (isSubscribed(selectedApp.id) && purchased) {
                        return (
                          <button
                            onClick={() => {
                              marketplaceService.recordUsage(selectedApp.id);
                              const path = slug ? `/org/${slug}/apps/${selectedApp.id}` : `/apps/${selectedApp.id}`;
                              window.location.href = path;
                            }}
                            className="flex-1 py-3 bg-green-500/20 text-green-400 border border-green-500/50 rounded-xl font-semibold hover:bg-green-500/30 transition-all flex items-center justify-center gap-2"
                          >
                            <LogIn className="w-5 h-5" />
                            Enter App
                          </button>
                        );
                      } else if (isSubscribed(selectedApp.id) && !purchased) {
                        return (
                          <button
                            onClick={() => {
                              setShowAppModal(false);
                              handlePurchase(selectedApp);
                            }}
                            disabled={purchased}
                            className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                              purchased
                                ? 'bg-gray-500/20 text-gray-400 border border-gray-500/50 cursor-not-allowed'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30'
                            }`}
                          >
                            <ShoppingBag className="w-5 h-5" />
                            Purchase
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Modal */}
        {showPurchaseModal && selectedApp && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1e2132] rounded-2xl max-w-md w-full border border-white/10 p-6">
              <h3 className="text-2xl font-bold mb-4">Subscribe to {selectedApp.name}</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Billing Period</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPurchaseBillingPeriod('monthly')}
                      className={`p-3 rounded-lg border transition-all ${
                        purchaseBillingPeriod === 'monthly'
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                          : 'bg-white/5 border-white/10 text-gray-300'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setPurchaseBillingPeriod('yearly')}
                      className={`p-3 rounded-lg border transition-all ${
                        purchaseBillingPeriod === 'yearly'
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                          : 'bg-white/5 border-white/10 text-gray-300'
                      }`}
                    >
                      Yearly
                    </button>
                  </div>
                </div>

                {selectedApp.trial_days > 0 && (
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={startTrial}
                        onChange={(e) => setStartTrial(e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm">
                        Start {selectedApp.trial_days}-day free trial
                      </span>
                    </label>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold mb-2">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPurchaseGateway('esewa')}
                      className={`p-3 rounded-lg border transition-all ${
                        purchaseGateway === 'esewa'
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                          : 'bg-white/5 border-white/10 text-gray-300'
                      }`}
                    >
                      eSewa
                    </button>
                    <button
                      onClick={() => setPurchaseGateway('stripe')}
                      className={`p-3 rounded-lg border transition-all ${
                        purchaseGateway === 'stripe'
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                          : 'bg-white/5 border-white/10 text-gray-300'
                      }`}
                    >
                      Stripe
                    </button>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Price</span>
                    <span className="text-xl font-bold">
                      {selectedApp.price === 0
                        ? 'Free'
                        : purchaseGateway === 'esewa'
                          ? formatCurrency(convertUSDToNPR(selectedApp.price), 'NPR')
                          : formatCurrency(selectedApp.price, 'USD')}
                    </span>
                  </div>
                  {selectedApp.price > 0 && (
                    <div className="text-sm text-gray-400">
                      {purchaseGateway === 'esewa' && (
                        <span className="block">≈ {formatCurrency(selectedApp.price, 'USD')} USD</span>
                      )}
                      {purchaseGateway === 'stripe' && (
                        <span className="block">≈ {formatCurrency(convertUSDToNPR(selectedApp.price), 'NPR')} NPR</span>
                      )}
                      Billed {purchaseBillingPeriod === 'monthly' ? 'monthly' : 'annually'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRenew}
                      onChange={(e) => setAutoRenew(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">
                      Enable auto-renewal
                    </span>
                  </label>
                  <p className="text-xs text-gray-400 mt-1 ml-6">
                    Your subscription will automatically renew. You can disable this anytime.
                  </p>
                </div>

                {/* User Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Grant Access to Users
                    <span className="text-xs text-gray-400 ml-2 font-normal">
                      (Organization Owner gets access automatically)
                    </span>
                  </label>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {membersData?.users?.length > 0 ? (
                      <div className="space-y-2">
                        {membersData.users
                          .filter((user: any) => !user.role?.is_organization_owner) // Exclude owner
                          .map((user: any) => (
                            <label
                              key={user.id}
                              className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(user.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUserIds([...selectedUserIds, user.id]);
                                  } else {
                                    setSelectedUserIds(selectedUserIds.filter((id) => id !== user.id));
                                  }
                                }}
                                className="w-4 h-4 rounded"
                              />
                              <span className="text-sm text-gray-300">
                                {user.first_name} {user.last_name}
                                {user.email && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({user.email})
                                  </span>
                                )}
                              </span>
                            </label>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-4">
                        No other members found
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Selected users will have access to this app. You can manage access later from the app settings.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPurchaseModal(false);
                    setSelectedApp(null);
                    setSelectedUserIds([]);
                  }}
                  className="flex-1 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => purchaseMutation.mutate(selectedApp.id)}
                  disabled={purchaseMutation.isPending}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50"
                >
                  {purchaseMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* App Access Management Modal */}
        {showAccessModal && accessAppId && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#2f3136] rounded-xl max-w-2xl w-full border border-[#202225] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white">Manage App Access</h3>
                  <p className="text-sm text-[#b9bbbe] mt-1">
                    {appsData?.data?.find((a: App) => a.id === accessAppId)?.name || 'App'} Access Management
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAccessModal(false);
                    setAccessAppId(null);
                  }}
                  className="text-[#8e9297] hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Current Users with Access */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Users with Access
                </h4>
                <div className="bg-[#202225] rounded-lg p-4 border border-[#36393f] min-h-[200px] max-h-[300px] overflow-y-auto">
                  {appAccessData && appAccessData.length > 0 ? (
                    <div className="space-y-2">
                      {appAccessData.map((access: any) => (
                        <div
                          key={access.id}
                          className="flex items-center justify-between p-3 bg-[#36393f] rounded-lg border border-[#202225]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-semibold">
                              {access.user?.first_name?.[0] || access.user?.email?.[0] || 'U'}
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {access.user?.first_name} {access.user?.last_name}
                              </p>
                              <p className="text-sm text-[#8e9297]">{access.user?.email}</p>
                              {access.member?.role && (
                                <p className="text-xs text-[#8e9297] mt-1">
                                  Role: {access.member.role.name}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              if (confirm(`Are you sure you want to revoke access from ${access.user?.first_name} ${access.user?.last_name}?`)) {
                                try {
                                  await revokeAccessMutation.mutateAsync({ appId: accessAppId, userId: access.user.id });
                                } catch (error) {
                                  // Error is handled in onError callback
                                  console.error('Failed to revoke access:', error);
                                }
                              }
                            }}
                            disabled={revokeAccessMutation.isPending}
                            className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {revokeAccessMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <UserMinus className="h-4 w-4" />
                                Revoke
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto mb-3 text-[#8e9297]" />
                      <p className="text-[#b9bbbe]">No users have access yet</p>
                      <p className="text-sm text-[#8e9297] mt-1">Grant access to users below</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Grant Access to New Users */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Grant Access to Users
                </h4>
                <div className="bg-[#202225] rounded-lg p-4 border border-[#36393f] max-h-[300px] overflow-y-auto">
                  {membersData?.users?.length > 0 ? (
                    <div className="space-y-2">
                      {membersData.users
                        .filter((user: any) => {
                          // Exclude owner and users who already have access
                          if (user.role?.is_organization_owner) return false;
                          if (appAccessData?.some((a: any) => a.user?.id === user.id)) return false;
                          return true;
                        })
                        .map((user: any) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-3 bg-[#36393f] rounded-lg border border-[#202225] hover:border-[#5865f2] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#5865f2]/20 flex items-center justify-center text-[#5865f2] font-semibold border border-[#5865f2]/30">
                                {user.first_name?.[0] || user.email?.[0] || 'U'}
                              </div>
                              <div>
                                <p className="text-white font-medium">
                                  {user.first_name} {user.last_name}
                                </p>
                                <p className="text-sm text-[#8e9297]">{user.email}</p>
                                {user.role && (
                                  <p className="text-xs text-[#8e9297] mt-1">
                                    Role: {user.role.name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                grantAccessMutation.mutate({ appId: accessAppId, userId: user.id });
                              }}
                              disabled={grantAccessMutation.isPending}
                              className="px-3 py-1.5 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                              <UserPlus className="h-4 w-4" />
                              Grant Access
                            </button>
                          </div>
                        ))}
                      {membersData.users.filter((user: any) => {
                        if (user.role?.is_organization_owner) return false;
                        if (appAccessData?.some((a: any) => a.user?.id === user.id)) return false;
                        return true;
                      }).length === 0 && (
                        <div className="text-center py-8">
                          <Check className="h-12 w-12 mx-auto mb-3 text-green-400" />
                          <p className="text-[#b9bbbe]">All available users have access</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto mb-3 text-[#8e9297]" />
                      <p className="text-[#b9bbbe]">No other members found</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowAccessModal(false);
                    setAccessAppId(null);
                  }}
                  className="px-6 py-2 bg-[#36393f] text-white rounded-lg hover:bg-[#40444b] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

