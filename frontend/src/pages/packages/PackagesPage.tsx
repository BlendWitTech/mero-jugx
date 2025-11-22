import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Package, Check, Loader2, CreditCard, X, Calendar, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  convertUSDToNPR,
  formatCurrency,
  isNepalRegion,
} from '../../utils/currency';

export default function PackagesPage() {
  const { isAuthenticated, accessToken, _hasHydrated } = useAuthStore();
  const queryClient = useQueryClient();
  const [isNepal] = useState(() => isNepalRegion());
  const [selectedGateway, setSelectedGateway] = useState<'esewa' | 'stripe'>('esewa');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{
    type: 'package' | 'feature';
    item: any;
  } | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'3_months' | '6_months' | '1_year' | 'custom'>('3_months');
  const [customMonths, setCustomMonths] = useState<number>(12);
  const [isCurrentPackageExpanded, setIsCurrentPackageExpanded] = useState(true);
  const [upgradePriceInfo, setUpgradePriceInfo] = useState<{
    new_package_price: number;
    prorated_credit: number;
    final_price: number;
    remaining_days: number | null;
    can_upgrade: boolean;
    reason?: string;
  } | null>(null);

  // Format date helper
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Calculate days remaining
  const getDaysRemaining = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate subscription price with discount
  const calculateSubscriptionPrice = (basePrice: number, period: string, customMonths?: number) => {
    let months: number;
    let discountPercent: number;

    switch (period) {
      case '3_months':
        months = 3;
        discountPercent = 0;
        break;
      case '6_months':
        months = 6;
        discountPercent = 4;
        break;
      case '1_year':
        months = 12;
        discountPercent = 7.5;
        break;
      case 'custom':
        months = customMonths || 12;
        if (months > 12) {
          discountPercent = 10;
        } else if (months === 12) {
          discountPercent = 7.5;
        } else if (months >= 6) {
          discountPercent = 4;
        } else {
          discountPercent = 0;
        }
        break;
      default:
        months = 3;
        discountPercent = 0;
    }

    const originalPrice = basePrice * months;
    const discountAmount = (originalPrice * discountPercent) / 100;
    const discountedPrice = originalPrice - discountAmount;

    return {
      months,
      discountPercent,
      originalPrice: Math.round(originalPrice * 100) / 100,
      discountedPrice: Math.round(discountedPrice * 100) / 100,
      monthlyPrice: Math.round((discountedPrice / months) * 100) / 100,
    };
  };

  // Get package display name with upgrades
  const getPackageDisplayName = () => {
    if (!currentPackage?.package) return 'No Package';
    
    const packageName = currentPackage.package.name;
    const activeFeatures = currentPackage.active_features || [];
    
    if (activeFeatures.length === 0) {
      return packageName;
    }

    const featureNames = activeFeatures
      .map((f: any) => {
        if (f.feature?.type === 'user_upgrade') {
          return `+${f.feature.value || 'Unlimited'} Users`;
        } else if (f.feature?.type === 'role_upgrade') {
          return `+${f.feature.value || 'Unlimited'} Roles`;
        }
        return f.feature?.name;
      })
      .filter(Boolean)
      .join(', ');

    return `${packageName} (${featureNames})`;
  };

  // Toggle auto-renewal mutation
  const toggleAutoRenewMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await api.put('/organizations/me/package/auto-renew', { enabled });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-package'] });
      toast.success('Auto-renewal setting updated');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update auto-renewal setting');
    },
  });

  // Refetch current package when component mounts, comes into focus, or when package is updated
  // This ensures we have the latest package data after payment
  useEffect(() => {
    if (_hasHydrated && isAuthenticated && accessToken) {
      // Handle package update events from payment success page
      const handlePackageUpdate = () => {
        console.log('Package update event received, refetching package data...');
        queryClient.invalidateQueries({ queryKey: ['current-package'], exact: false });
        queryClient.refetchQueries({ queryKey: ['current-package'], exact: false });
        queryClient.refetchQueries({ queryKey: ['packages'], exact: false });
        queryClient.refetchQueries({ queryKey: ['package-features'], exact: false });
      };
      
      // Refetch current package when page is focused
      const handleFocus = () => {
        queryClient.refetchQueries({ queryKey: ['current-package'], exact: false });
      };
      
      window.addEventListener('focus', handleFocus);
      window.addEventListener('package-updated', handlePackageUpdate);
      
      // Also refetch on mount
      queryClient.refetchQueries({ queryKey: ['current-package'], exact: false });
      
      return () => {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('package-updated', handlePackageUpdate);
      };
    }
  }, [_hasHydrated, isAuthenticated, accessToken, queryClient]);

  const { data: currentPackage, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['current-package'],
    queryFn: async () => {
      const response = await api.get('/organizations/me/package');
      console.log('Current package data fetched:', response.data);
      console.log('Package ID:', response.data?.package?.id);
      console.log('Package Name:', response.data?.package?.name);
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    retry: (failureCount, error: any) => {
      // Retry on 401 errors (token refresh will handle it)
      if (error?.response?.status === 401) {
        return failureCount < 2; // Retry up to 2 times for 401 errors
      }
      return failureCount < 3; // Default retry logic for other errors
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: true, // Refetch when window comes into focus
    refetchOnMount: true, // Refetch when component mounts
  });

  const { data: packages, isLoading: isLoadingPackages } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const response = await api.get('/packages');
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    retry: (failureCount, error: any) => {
      // Retry on 401 errors (token refresh will handle it)
      if (error?.response?.status === 401) {
        return failureCount < 2; // Retry up to 2 times for 401 errors
      }
      return failureCount < 3; // Default retry logic for other errors
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  const { data: features, isLoading: isLoadingFeatures } = useQuery({
    queryKey: ['package-features'],
    queryFn: async () => {
      const response = await api.get('/packages/features');
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
    retry: (failureCount, error: any) => {
      // Retry on 401 errors (token refresh will handle it)
      if (error?.response?.status === 401) {
        return failureCount < 2; // Retry up to 2 times for 401 errors
      }
      return failureCount < 3; // Default retry logic for other errors
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Create payment mutation for package upgrade
  const createPackagePaymentMutation = useMutation({
    mutationFn: async (data: { package_id: number; amount: number; package_name: string; gateway: 'esewa' | 'stripe'; period?: string; custom_months?: number }) => {
      console.log('Creating package payment:', {
        gateway: data.gateway,
        payment_type: 'package_upgrade',
        amount: data.amount,
        package_id: data.package_id,
        description: `Upgrade to ${data.package_name}`,
      });
      
      // Ensure amount is a number, not a string
      const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
      const packageId = typeof data.package_id === 'string' ? parseInt(data.package_id, 10) : data.package_id;
      
      console.log('Sending payment request:', {
        gateway: data.gateway,
        payment_type: 'package_upgrade',
        amount: amount,
        amountType: typeof amount,
        package_id: packageId,
        packageIdType: typeof packageId,
        description: `Upgrade to ${data.package_name}`,
      });
      
      const response = await api.post('/payments', {
        gateway: data.gateway,
        payment_type: 'package_upgrade',
        amount: amount, // Ensure it's a number
        description: `Upgrade to ${data.package_name}`,
        package_id: packageId, // Send as number, not string
        period: data.period,
        custom_months: data.custom_months,
        metadata: {
          package_id: packageId,
          package_name: data.package_name,
          period: data.period,
          custom_months: data.custom_months,
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Verify we have the payment form data
      if (!data.payment_form || !data.payment_form.formUrl) {
        toast.error('Invalid payment form data received');
        console.error('Payment form data:', data);
        return;
      }

      const gateway = data.payment?.gateway || 'esewa';
      console.log(`Creating ${gateway} payment for package upgrade:`, {
        url: data.payment_form.formUrl,
        data: data.payment_form.formData,
      });

      try {
        if (gateway === 'stripe') {
          // Stripe: redirect to checkout URL
          window.location.href = data.payment_form.formUrl;
        } else {
          // eSewa: create and submit form
          if (!data.payment_form.formData) {
            toast.error('Invalid eSewa payment form data');
            return;
          }

          const form = document.createElement('form');
          form.method = 'POST';
          form.action = data.payment_form.formUrl;
          form.target = '_self';
          form.style.display = 'none';
          form.enctype = 'application/x-www-form-urlencoded';

          // Add form fields
          Object.entries(data.payment_form.formData).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
          });

          console.log('Submitting eSewa form:', {
            url: form.action,
            method: form.method,
            fields: Object.keys(data.payment_form.formData),
          });

          document.body.appendChild(form);
          
          // Small delay to ensure form is in DOM
          setTimeout(() => {
            form.submit();
          }, 10);
        }
      } catch (error) {
        console.error('Error submitting payment form:', error);
        toast.error('Failed to redirect to payment gateway. Please try again.');
      }
    },
    onError: (error: any) => {
      console.error('Package payment error:', error);
      console.error('Error response:', error?.response?.data);
      
      // Check for eSewa token authentication error
      const errorData = error?.response?.data;
      if (errorData?.set_token_message || errorData?.user_token) {
        toast.error(
          'eSewa requires token authentication. Please enable Mock Mode in .env (ESEWA_USE_MOCK_MODE=true) for development testing.',
          { duration: 6000 }
        );
      } else {
        let errorMessage = errorData?.message || 
                          errorData?.error || 
                          error?.message || 
                          'Failed to create payment';
        
        // Provide more specific error messages for Stripe
        if (errorMessage.includes('Stripe') || errorMessage.includes('stripe')) {
          if (errorMessage.includes('authentication') || errorMessage.includes('API keys') || errorMessage.includes('not configured')) {
            errorMessage = 'Stripe is not configured. Please contact support or check your environment settings.';
          } else if (errorMessage.includes('amount')) {
            errorMessage = 'Invalid payment amount. Please try again.';
          } else if (errorMessage.includes('currency')) {
            errorMessage = 'Invalid currency. Please try again.';
          }
        }
        
        toast.error(errorMessage, { duration: 5000 });
      }
      
      // Log validation errors if present
      if (errorData?.message && Array.isArray(errorData.message)) {
        console.error('Validation errors:', errorData.message);
      }
      
      // Log full error for debugging
      console.error('Full error object:', error);
    },
  });

  // Create payment mutation for feature purchase
  const createFeaturePaymentMutation = useMutation({
    mutationFn: async (data: { feature_id: number; amount: number; feature_name: string; gateway: 'esewa' | 'stripe' }) => {
      console.log('Creating feature payment:', {
        gateway: data.gateway,
        payment_type: 'one_time',
        amount: data.amount,
        feature_id: data.feature_id,
        description: `Purchase ${data.feature_name}`,
      });
      
      const response = await api.post('/payments', {
        gateway: data.gateway,
        payment_type: 'one_time',
        amount: Number(data.amount), // Ensure it's a number
        description: `Purchase ${data.feature_name}`,
        metadata: {
          feature_id: data.feature_id,
          feature_name: data.feature_name,
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Verify we have the payment form data
      if (!data.payment_form || !data.payment_form.formUrl) {
        toast.error('Invalid payment form data received');
        console.error('Payment form data:', data);
        return;
      }

      const gateway = data.payment?.gateway || 'esewa';
      console.log(`Creating ${gateway} payment for feature purchase:`, {
        url: data.payment_form.formUrl,
        data: data.payment_form.formData,
      });

      try {
        if (gateway === 'stripe') {
          // Stripe: redirect to checkout URL
          window.location.href = data.payment_form.formUrl;
        } else {
          // eSewa: create and submit form
          if (!data.payment_form.formData) {
            toast.error('Invalid eSewa payment form data');
            return;
          }

          const form = document.createElement('form');
          form.method = 'POST';
          form.action = data.payment_form.formUrl;
          form.target = '_self';
          form.style.display = 'none';
          form.enctype = 'application/x-www-form-urlencoded';

          // Add form fields
          Object.entries(data.payment_form.formData).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
          });

          console.log('Submitting eSewa form:', {
            url: form.action,
            method: form.method,
            fields: Object.keys(data.payment_form.formData),
          });

          document.body.appendChild(form);
          
          // Small delay to ensure form is in DOM
          setTimeout(() => {
            form.submit();
          }, 10);
        }
      } catch (error) {
        console.error('Error submitting payment form:', error);
        toast.error('Failed to redirect to payment gateway. Please try again.');
      }
    },
    onError: (error: any) => {
      console.error('Feature payment error:', error);
      console.error('Error response:', error?.response?.data);
      
      // Check for eSewa token authentication error
      const errorData = error?.response?.data;
      if (errorData?.set_token_message || errorData?.user_token) {
        toast.error(
          'eSewa requires token authentication. Please enable Mock Mode in .env (ESEWA_USE_MOCK_MODE=true) for development testing.',
          { duration: 6000 }
        );
      } else {
        let errorMessage = errorData?.message || 
                          errorData?.error || 
                          error?.message || 
                          'Failed to create payment';
        
        // Provide more specific error messages for Stripe
        if (errorMessage.includes('Stripe') || errorMessage.includes('stripe')) {
          if (errorMessage.includes('authentication') || errorMessage.includes('API keys') || errorMessage.includes('not configured')) {
            errorMessage = 'Stripe is not configured. Please contact support or check your environment settings.';
          } else if (errorMessage.includes('amount')) {
            errorMessage = 'Invalid payment amount. Please try again.';
          } else if (errorMessage.includes('currency')) {
            errorMessage = 'Invalid currency. Please try again.';
          }
        }
        
        toast.error(errorMessage, { duration: 5000 });
      }
      
      // Log full error for debugging
      console.error('Full error object:', error);
      
      // Log validation errors if present
      if (errorData?.message && Array.isArray(errorData.message)) {
        console.error('Validation errors:', errorData.message);
      }
    },
  });

  // Calculate upgrade price mutation
  const calculateUpgradePriceMutation = useMutation({
    mutationFn: async (data: { package_id: number; period?: string; custom_months?: number }) => {
      const response = await api.post('/organizations/me/package/calculate-upgrade-price', {
        package_id: data.package_id,
        period: data.period,
        custom_months: data.custom_months,
      });
      return response.data;
    },
    onError: (error: any) => {
      console.error('Failed to calculate upgrade price:', error);
    },
  });

  const handlePackageUpgrade = async (pkg: any) => {
    // Don't allow purchasing freemium
    if (pkg.slug === 'freemium') {
      toast.error('Freemium package cannot be purchased. It will be automatically selected when your current package expires.');
      return;
    }

    if (!pkg.price || pkg.price === 0) {
      // Free package - upgrade directly without payment
      toast.success('This is a free package. Upgrading...');
      // TODO: Call upgrade endpoint directly for free packages
      return;
    }

    // Reset period selection when opening modal
    setSelectedPeriod('3_months');
    setCustomMonths(12);
    setUpgradePriceInfo(null);
    
    // Show payment method selection modal first
    setPendingPayment({ type: 'package', item: pkg });
    setShowPaymentModal(true);
    
    // Calculate upgrade price if upgrading mid-subscription (after modal opens)
    try {
      const priceInfo = await calculateUpgradePriceMutation.mutateAsync({
        package_id: pkg.id,
        period: '3_months',
      });
      setUpgradePriceInfo(priceInfo);
      
      if (!priceInfo.can_upgrade && priceInfo.reason) {
        toast.error(priceInfo.reason);
        setShowPaymentModal(false);
        setPendingPayment(null);
        return;
      }
    } catch (error: any) {
      console.error('Error calculating upgrade price:', error);
      // Don't block - backend will handle validation
      if (error?.response?.data?.reason) {
        toast.error(error.response.data.reason);
        setShowPaymentModal(false);
        setPendingPayment(null);
        return;
      }
    }
  };

  const handleFeaturePurchase = (feature: any) => {
    if (!feature.price || feature.price === 0) {
      toast.success('This feature is free. Purchasing...');
      // TODO: Call purchase endpoint directly for free features
      return;
    }

    // Show payment method selection modal
    setPendingPayment({ type: 'feature', item: feature });
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!pendingPayment) return;

    const item = pendingPayment.item;
    
    if (pendingPayment.type === 'package') {
      // Recalculate upgrade price with selected period
      let finalPrice = 0;
      
      if (upgradePriceInfo && upgradePriceInfo.can_upgrade && upgradePriceInfo.prorated_credit > 0) {
        // Mid-subscription upgrade - recalculate with selected period
        try {
          const priceInfo = await calculateUpgradePriceMutation.mutateAsync({
            package_id: item.id,
            period: selectedPeriod,
            custom_months: selectedPeriod === 'custom' ? customMonths : undefined,
          });
          
          if (!priceInfo.can_upgrade) {
            toast.error(priceInfo.reason || 'Cannot upgrade to this package');
            return;
          }
          
          finalPrice = priceInfo.final_price;
        } catch (error) {
          console.error('Error calculating final upgrade price:', error);
          // Fall back to regular calculation
          const subscription = calculateSubscriptionPrice(
            item.price,
            selectedPeriod,
            selectedPeriod === 'custom' ? customMonths : undefined
          );
          finalPrice = subscription.discountedPrice;
        }
      } else {
        // New subscription or expired package
        const subscription = calculateSubscriptionPrice(
          item.price,
          selectedPeriod,
          selectedPeriod === 'custom' ? customMonths : undefined
        );
        finalPrice = subscription.discountedPrice;
      }
      
      // Calculate amount based on gateway
      // Stripe uses USD, eSewa uses NPR
      const amount = selectedGateway === 'stripe'
        ? finalPrice  // Use final USD price for Stripe
        : convertUSDToNPR(finalPrice); // Convert final price to NPR for eSewa

      createPackagePaymentMutation.mutate({
        package_id: item.id,
        amount: amount,
        package_name: item.name,
        gateway: selectedGateway,
        period: selectedPeriod,
        custom_months: selectedPeriod === 'custom' ? customMonths : undefined,
      });
    } else {
      // Features don't have subscription periods
      const amount = selectedGateway === 'stripe'
        ? item.price
        : convertUSDToNPR(item.price);

      createFeaturePaymentMutation.mutate({
        feature_id: item.id,
        amount: amount,
        feature_name: item.name,
        gateway: selectedGateway,
      });
    }

    setShowPaymentModal(false);
    setPendingPayment(null);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Packages</h1>
        <p className="mt-2 text-gray-600">Manage your organization package and features</p>
      </div>

      {isLoadingCurrent || isLoadingPackages || isLoadingFeatures ? (
        <div className="card animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ) : (
        <>
          {/* Current Package - Collapsible */}
          {currentPackage && (
            <div className="card mb-6 overflow-hidden">
              <button
                onClick={() => setIsCurrentPackageExpanded(!isCurrentPackageExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center flex-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 mr-4">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {getPackageDisplayName()}
                      </h2>
                      {currentPackage?.active_features && currentPackage.active_features.length > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          Upgraded
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {currentPackage?.current_limits?.users || 0} users, {currentPackage?.current_limits?.roles || 0} roles
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {(() => {
                    // Calculate total price including package and features
                    const packagePrice = parseFloat(String(currentPackage?.package?.price || 0)) || 0;
                    const featuresPrice = currentPackage?.active_features?.reduce((sum: number, feature: any) => {
                      const featurePrice = parseFloat(String(feature.feature?.price || 0)) || 0;
                      return sum + featurePrice;
                    }, 0) || 0;
                    const totalPrice = packagePrice + featuresPrice;
                    
                    return (
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary-600">
                          {totalPrice === 0 
                            ? 'Free' 
                            : isNepal
                              ? `${formatCurrency(convertUSDToNPR(totalPrice), 'NPR')} (≈ ${formatCurrency(totalPrice, 'USD')})`
                              : `${formatCurrency(totalPrice, 'USD')} (≈ ${formatCurrency(convertUSDToNPR(totalPrice), 'NPR')})`}
                        </p>
                        {totalPrice > 0 && (
                          <p className="text-xs text-gray-500">per month</p>
                        )}
                      </div>
                    );
                  })()}
                  {isCurrentPackageExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>

              {isCurrentPackageExpanded && (
                <div className="px-4 pb-4 border-t border-gray-200 pt-4 space-y-4">

                  {/* Package Expiration */}
                  {currentPackage?.package_expires_at && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center text-sm text-gray-700">
                        <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                        <span>Expires on: <strong className="text-gray-900">{formatDate(currentPackage.package_expires_at)}</strong></span>
                      </div>
                      {(() => {
                        const daysRemaining = getDaysRemaining(currentPackage.package_expires_at);
                        if (daysRemaining !== null) {
                          if (daysRemaining < 0) {
                            return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded">Expired</span>;
                          } else if (daysRemaining <= 3) {
                            return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left</span>;
                          } else if (daysRemaining <= 7) {
                            return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left</span>;
                          } else {
                            return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left</span>;
                          }
                        }
                        return null;
                      })()}
                    </div>
                  )}

                  {/* Auto-Renewal Toggle */}
                  {currentPackage?.package && currentPackage.package.price > 0 && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Auto-Renewal</p>
                        <p className="text-xs text-gray-500 mt-0.5">Automatically renew when package expires</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentPackage?.package_auto_renew || false}
                          onChange={(e) => toggleAutoRenewMutation.mutate(e.target.checked)}
                          disabled={toggleAutoRenewMutation.isPending}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  )}

                  {/* Package and Features Cards */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Active Subscriptions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Package Card */}
                      {(() => {
                        const packagePrice = parseFloat(String(currentPackage?.package?.price || 0)) || 0;
                        if (packagePrice === 0) return null;
                        
                        return (
                          <div className="p-4 bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary-600" />
                                <span className="text-sm font-medium text-gray-900">
                                  {currentPackage?.package?.name || 'Package'}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="text-2xl font-bold text-primary-600">
                                {isNepal
                                  ? formatCurrency(convertUSDToNPR(packagePrice), 'NPR')
                                  : formatCurrency(packagePrice, 'USD')}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                      
                      {/* Feature Cards */}
                      {currentPackage?.active_features && currentPackage.active_features.length > 0 && (
                        <>
                          {currentPackage.active_features.map((feature: any) => {
                            const featurePrice = parseFloat(String(feature.feature?.price || 0)) || 0;
                            if (featurePrice === 0) return null;
                            
                            return (
                              <div
                                key={feature.id}
                                className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-purple-600" />
                                    <span className="text-sm font-medium text-gray-900">
                                      {feature.feature?.type === 'user_upgrade' 
                                        ? `+${feature.feature.value || 'Unlimited'} Users`
                                        : feature.feature?.type === 'role_upgrade'
                                        ? `+${feature.feature.value || 'Unlimited'} Roles`
                                        : feature.feature?.name || 'Feature'}
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <p className="text-2xl font-bold text-purple-600">
                                    {isNepal
                                      ? formatCurrency(convertUSDToNPR(featurePrice), 'NPR')
                                      : formatCurrency(featurePrice, 'USD')}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Available Packages */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Packages</h2>
            {packages && packages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {packages.map((pkg: any) => {
                  // Compare package IDs - handle both number and string types
                  const currentPackageId = currentPackage?.package?.id;
                  const isCurrentPackage = currentPackageId !== undefined && 
                    (currentPackageId === pkg.id || 
                     String(currentPackageId) === String(pkg.id) ||
                     Number(currentPackageId) === Number(pkg.id));
                  
                  return (
                    <div
                      key={pkg.id}
                      className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-xl ${
                        isCurrentPackage
                          ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-blue-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-primary-300'
                      }`}
                    >
                      {isCurrentPackage && (
                        <div className="absolute top-0 right-0 bg-gradient-to-br from-primary-500 to-primary-600 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
                          Current
                        </div>
                      )}
                      
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`p-2 rounded-lg ${
                                isCurrentPackage 
                                  ? 'bg-primary-100' 
                                  : 'bg-gray-100'
                              }`}>
                                <Package className={`h-5 w-5 ${
                                  isCurrentPackage 
                                    ? 'text-primary-600' 
                                    : 'text-gray-600'
                                }`} />
                              </div>
                              <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                            </div>
                            {pkg.description && (
                              <p className="text-sm text-gray-600">{pkg.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="mb-6">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-4xl font-bold text-gray-900">
                              {pkg.price === 0 ? (
                                'Free'
                              ) : (
                                <>
                                  {isNepal ? (
                                    <>
                                      {formatCurrency(convertUSDToNPR(pkg.price), 'NPR')}
                                      <span className="text-lg font-normal text-gray-500 ml-1">
                                        (≈ {formatCurrency(pkg.price, 'USD')})
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      {formatCurrency(pkg.price, 'USD')}
                                      <span className="text-lg font-normal text-gray-500 ml-1">
                                        (≈ {formatCurrency(convertUSDToNPR(pkg.price), 'NPR')})
                                      </span>
                                    </>
                                  )}
                                </>
                              )}
                            </span>
                          </div>
                          {pkg.price > 0 && (
                            <p className="text-sm text-gray-500">per month</p>
                          )}
                        </div>

                        <div className="mb-6 space-y-3">
                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700">
                              <strong>{pkg.base_user_limit}</strong> users included
                            </span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700">
                              <strong>{pkg.base_role_limit}</strong> base roles
                              {pkg.additional_role_limit > 0 && (
                                <span className="text-xs text-gray-500 ml-1">
                                  (+{pkg.additional_role_limit} additional)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        {(() => {
                          // Don't show purchase button for freemium
                          if (pkg.slug === 'freemium') {
                            return (
                              <button className="w-full py-3 px-4 bg-gray-100 text-gray-600 font-semibold rounded-lg cursor-not-allowed flex items-center justify-center" disabled>
                                <Check className="h-5 w-5 mr-2" />
                                {isCurrentPackage ? 'Current Package' : 'Default Package'}
                              </button>
                            );
                          }

                          // Check if this is an upgrade (higher tier) or downgrade (lower tier)
                          // Higher sort_order = Higher tier (Freemium=1, Basic=2, Platinum=3, Diamond=4)
                          const currentPackageSortOrder = currentPackage?.package?.sort_order || 999;
                          const isUpgrade = pkg.sort_order > currentPackageSortOrder;
                          const isDowngrade = pkg.sort_order < currentPackageSortOrder;
                          const hasActiveSubscription = currentPackage?.package_expires_at && 
                            new Date(currentPackage.package_expires_at) > new Date();

                          if (isCurrentPackage) {
                            return (
                              <button className="w-full py-3 px-4 bg-gray-100 text-gray-600 font-semibold rounded-lg cursor-not-allowed flex items-center justify-center" disabled>
                                <Check className="h-5 w-5 mr-2" />
                                Current Package
                              </button>
                            );
                          }

                          // Show upgrade button for higher packages, or if current package expired
                          if (isUpgrade || !hasActiveSubscription) {
                            return (
                              <button
                                onClick={() => handlePackageUpgrade(pkg)}
                                disabled={createPackagePaymentMutation.isPending || calculateUpgradePriceMutation.isPending}
                                className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {(createPackagePaymentMutation.isPending || calculateUpgradePriceMutation.isPending) ? (
                                  <>
                                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="h-5 w-5 mr-2" />
                                    {isUpgrade && hasActiveSubscription ? 'Upgrade Package' : 'Purchase Package'}
                                  </>
                                )}
                              </button>
                            );
                          }

                          // Show disabled button for downgrades when subscription is active
                          if (isDowngrade && hasActiveSubscription) {
                            return (
                              <button className="w-full py-3 px-4 bg-gray-100 text-gray-600 font-semibold rounded-lg cursor-not-allowed flex items-center justify-center" disabled>
                                <X className="h-5 w-5 mr-2" />
                                Downgrade Not Available
                              </button>
                            );
                          }

                          // Default: show purchase button
                          return (
                            <button
                              onClick={() => handlePackageUpgrade(pkg)}
                              disabled={createPackagePaymentMutation.isPending}
                              className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {createPackagePaymentMutation.isPending ? (
                                <>
                                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <CreditCard className="h-5 w-5 mr-2" />
                                  Purchase Package
                                </>
                              )}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card text-center py-8 text-gray-500">
                No packages available
              </div>
            )}
          </div>

          {/* Available Features */}
          {features && features.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature: any) => {
                  // Check if this feature is active/purchased
                  const isActive = currentPackage?.active_features?.some(
                    (activeFeature: any) => activeFeature.feature_id === feature.id || activeFeature.feature?.id === feature.id
                  ) || false;

                  return (
                    <div
                      key={feature.id}
                      className={`card ${
                        isActive
                          ? 'border-2 border-primary-500 bg-primary-50'
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-md font-semibold text-gray-900">{feature.name}</h3>
                        <div className="flex items-center gap-2">
                          {isActive && (
                            <Check className="h-5 w-5 text-primary-600" />
                          )}
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                            {feature.type === 'user_upgrade' ? 'User Upgrade' : 'Role Upgrade'}
                          </span>
                        </div>
                      </div>
                      {feature.description && (
                        <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          {feature.value && (
                            <p className="text-sm text-gray-700">
                              Value: {feature.value === null ? 'Unlimited' : feature.value}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-lg font-bold text-primary-600">
                            {feature.price === 0 ? (
                              'Free'
                            ) : (
                              <>
                                {/* Assume prices are in USD, display both currencies */}
                                {isNepal ? (
                                  <>
                                    {formatCurrency(convertUSDToNPR(feature.price), 'NPR')}
                                    <span className="text-xs font-normal text-gray-500 ml-1">
                                      (≈ {formatCurrency(feature.price, 'USD')})
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    {formatCurrency(feature.price, 'USD')}
                                    <span className="text-xs font-normal text-gray-500 ml-1">
                                      (≈ {formatCurrency(convertUSDToNPR(feature.price), 'NPR')})
                                    </span>
                                  </>
                                )}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      {!isActive ? (
                        <button
                          onClick={() => handleFeaturePurchase(feature)}
                          disabled={createFeaturePaymentMutation.isPending}
                          className="btn btn-primary w-full mt-4 flex items-center justify-center"
                        >
                          {createFeaturePaymentMutation.isPending ? (
                            <>
                              <Loader2 className="animate-spin h-4 w-4 mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Purchase
                            </>
                          )}
                        </button>
                      ) : (
                        <button className="btn btn-secondary w-full mt-4" disabled>
                          <Check className="h-4 w-4 mr-2 inline" />
                          Active
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Payment Method Selection Modal */}
      {showPaymentModal && pendingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-slideUp">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Select Payment Method</h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPendingPayment(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Item Details */}
            <div className="mb-6 p-4 bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg border border-primary-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Purchasing:</p>
              <p className="text-lg font-semibold text-gray-900 mb-3">
                {pendingPayment.type === 'package' ? pendingPayment.item.name : pendingPayment.item.name}
              </p>
              
              {/* Subscription Period Selection (only for packages) */}
              {pendingPayment.type === 'package' && pendingPayment.item.price > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Period</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {(['3_months', '6_months', '1_year', 'custom'] as const).map((period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={async () => {
                          setSelectedPeriod(period);
                          // Recalculate upgrade price when period changes
                          if (upgradePriceInfo && upgradePriceInfo.can_upgrade) {
                            try {
                              const priceInfo = await calculateUpgradePriceMutation.mutateAsync({
                                package_id: pendingPayment.item.id,
                                period: period,
                                custom_months: period === 'custom' ? customMonths : undefined,
                              });
                              setUpgradePriceInfo(priceInfo);
                            } catch (error) {
                              console.error('Error recalculating upgrade price:', error);
                            }
                          }
                        }}
                        className={`px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                          selectedPeriod === period
                            ? 'border-primary-500 bg-primary-100 text-primary-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {period === '3_months' ? '3 Months' : 
                         period === '6_months' ? '6 Months (4% off)' :
                         period === '1_year' ? '1 Year (7.5% off)' :
                         'Custom'}
                      </button>
                    ))}
                  </div>
                  {selectedPeriod === 'custom' && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Number of Months</label>
                      <input
                        type="number"
                        min="1"
                        value={customMonths}
                        onChange={async (e) => {
                          const months = Math.max(1, parseInt(e.target.value) || 12);
                          setCustomMonths(months);
                          // Recalculate upgrade price when custom months change
                          if (upgradePriceInfo && upgradePriceInfo.can_upgrade && selectedPeriod === 'custom') {
                            try {
                              const priceInfo = await calculateUpgradePriceMutation.mutateAsync({
                                package_id: pendingPayment.item.id,
                                period: 'custom',
                                custom_months: months,
                              });
                              setUpgradePriceInfo(priceInfo);
                            } catch (error) {
                              console.error('Error recalculating upgrade price:', error);
                            }
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      {customMonths > 12 && (
                        <p className="mt-1 text-xs text-green-600 font-medium">✓ 10% discount applied</p>
                      )}
                      {customMonths === 12 && (
                        <p className="mt-1 text-xs text-green-600 font-medium">✓ 7.5% discount applied</p>
                      )}
                      {customMonths >= 6 && customMonths < 12 && (
                        <p className="mt-1 text-xs text-green-600 font-medium">✓ 4% discount applied</p>
                      )}
                    </div>
                  )}
                  
                  {/* Price Calculation */}
                  {(() => {
                    const subscription = calculateSubscriptionPrice(
                      pendingPayment.item.price,
                      selectedPeriod,
                      selectedPeriod === 'custom' ? customMonths : undefined
                    );

                    // Show prorated credit if upgrading mid-subscription
                    const showProratedCredit = upgradePriceInfo && upgradePriceInfo.can_upgrade && upgradePriceInfo.prorated_credit > 0;
                    const finalPrice = showProratedCredit ? upgradePriceInfo.final_price : subscription.discountedPrice;

                    return (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">New Package Price:</span>
                          <span className="text-sm font-medium text-gray-700">
                            {formatCurrency(subscription.discountedPrice, 'USD')}
                          </span>
                        </div>
                        {subscription.discountPercent > 0 && (
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600">Period Discount ({subscription.discountPercent}%):</span>
                            <span className="text-sm font-medium text-green-600">
                              -{formatCurrency(subscription.originalPrice - subscription.discountedPrice, 'USD')}
                            </span>
                          </div>
                        )}
                        {showProratedCredit && (
                          <>
                            <div className="flex items-center justify-between mb-1 mt-2 pt-2 border-t border-gray-200">
                              <span className="text-sm text-gray-600">Prorated Credit ({upgradePriceInfo.remaining_days} days remaining):</span>
                              <span className="text-sm font-medium text-blue-600">
                                -{formatCurrency(upgradePriceInfo.prorated_credit, 'USD')}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Credit from remaining subscription time
                            </div>
                          </>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-2">
                          <span className="text-base font-semibold text-gray-900">Final Price:</span>
                          <span className="text-xl font-bold text-primary-600">
                            {selectedGateway === 'stripe'
                              ? formatCurrency(finalPrice, 'USD')
                              : formatCurrency(convertUSDToNPR(finalPrice), 'NPR')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {subscription.months} month{subscription.months !== 1 ? 's' : ''} • {formatCurrency(subscription.monthlyPrice, 'USD')}/month
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}
              
              {/* Feature or Package without period */}
              {(pendingPayment.type === 'feature' || (pendingPayment.type === 'package' && pendingPayment.item.price === 0)) && (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary-600">
                    {selectedGateway === 'stripe' 
                      ? formatCurrency(pendingPayment.item.price, 'USD')
                      : formatCurrency(convertUSDToNPR(pendingPayment.item.price), 'NPR')}
                  </span>
                  <span className="text-sm text-gray-500">
                    {selectedGateway === 'stripe' 
                      ? `(≈ ${formatCurrency(convertUSDToNPR(pendingPayment.item.price), 'NPR')})`
                      : `(≈ ${formatCurrency(pendingPayment.item.price, 'USD')})`}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="space-y-3 mb-6">
              <label 
                className={`flex items-start p-5 border-2 rounded-xl cursor-pointer transition-all ${
                  selectedGateway === 'esewa' 
                    ? 'border-primary-500 bg-primary-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <input
                  type="radio"
                  name="gateway"
                  value="esewa"
                  checked={selectedGateway === 'esewa'}
                  onChange={(e) => setSelectedGateway(e.target.value as 'esewa' | 'stripe')}
                  className="mt-1 mr-4 w-5 h-5 text-primary-600 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg font-semibold text-gray-900">eSewa</span>
                    <span className="text-xs font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">NPR</span>
                  </div>
                  <p className="text-sm text-gray-600">Pay with eSewa wallet (Nepalese Rupees)</p>
                  <p className="text-xs text-gray-500 mt-1">Includes 13% VAT</p>
                </div>
                {selectedGateway === 'esewa' && (
                  <Check className="w-5 h-5 text-primary-600 ml-2" />
                )}
              </label>

              <label 
                className={`flex items-start p-5 border-2 rounded-xl cursor-pointer transition-all ${
                  selectedGateway === 'stripe' 
                    ? 'border-primary-500 bg-primary-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <input
                  type="radio"
                  name="gateway"
                  value="stripe"
                  checked={selectedGateway === 'stripe'}
                  onChange={(e) => setSelectedGateway(e.target.value as 'esewa' | 'stripe')}
                  className="mt-1 mr-4 w-5 h-5 text-primary-600 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg font-semibold text-gray-900">Stripe</span>
                    <span className="text-xs font-medium bg-green-100 text-green-800 px-3 py-1 rounded-full">USD</span>
                  </div>
                  <p className="text-sm text-gray-600">Pay with credit/debit card (US Dollars)</p>
                  <p className="text-xs text-gray-500 mt-1">Visa, Mastercard, Amex accepted</p>
                </div>
                {selectedGateway === 'stripe' && (
                  <Check className="w-5 h-5 text-primary-600 ml-2" />
                )}
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPendingPayment(null);
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={createPackagePaymentMutation.isPending || createFeaturePaymentMutation.isPending}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg"
              >
                {(createPackagePaymentMutation.isPending || createFeaturePaymentMutation.isPending) ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Continue to Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

