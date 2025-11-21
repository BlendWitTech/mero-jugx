import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Package, Check, Loader2, CreditCard, X } from 'lucide-react';
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
    mutationFn: async (data: { package_id: number; amount: number; package_name: string; gateway: 'esewa' | 'stripe' }) => {
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
        metadata: {
          package_id: packageId,
          package_name: data.package_name,
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

  const handlePackageUpgrade = (pkg: any) => {
    if (!pkg.price || pkg.price === 0) {
      // Free package - upgrade directly without payment
      toast.success('This is a free package. Upgrading...');
      // TODO: Call upgrade endpoint directly for free packages
      return;
    }

    // Show payment method selection modal
    setPendingPayment({ type: 'package', item: pkg });
    setShowPaymentModal(true);
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

  const handleConfirmPayment = () => {
    if (!pendingPayment) return;

    const item = pendingPayment.item;
    
    // Calculate amount based on gateway
    // Stripe uses USD, eSewa uses NPR
    const amount = selectedGateway === 'stripe'
      ? item.price  // Use USD price for Stripe
      : convertUSDToNPR(item.price); // Convert to NPR for eSewa

    if (pendingPayment.type === 'package') {
      createPackagePaymentMutation.mutate({
        package_id: item.id,
        amount: amount,
        package_name: item.name,
        gateway: selectedGateway,
      });
    } else {
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
          {/* Current Package */}
          {currentPackage && (
            <div className="card mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Package</h2>
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-primary-600 mr-4" />
                  <div>
                    <p className="text-xl font-semibold text-gray-900">
                      {currentPackage?.package?.name || 'No Package Selected'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {currentPackage?.current_limits?.users || 0} users, {currentPackage?.current_limits?.roles || 0} roles
                    </p>
                    {currentPackage?.package?.description && (
                      <p className="text-sm text-gray-500 mt-1">{currentPackage.package.description}</p>
                    )}
                    {!currentPackage?.package && (
                      <p className="text-sm text-gray-500 mt-1">Please select a package to get started</p>
                    )}
                  </div>
                </div>
                {currentPackage?.package?.price !== undefined && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">
                      ${currentPackage.package.price === 0 ? 'Free' : currentPackage.package.price}
                    </p>
                    {currentPackage.package.price > 0 && (
                      <p className="text-xs text-gray-500">per month</p>
                    )}
                  </div>
                )}
              </div>

              {/* Active Features */}
              {currentPackage?.active_features && currentPackage.active_features.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Active Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentPackage.active_features.map((feature: any) => (
                      <span
                        key={feature.id}
                        className="px-3 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full"
                      >
                        {feature.feature?.name || 'Unknown Feature'}
                      </span>
                    ))}
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
                      className={`card ${
                        isCurrentPackage
                          ? 'border-2 border-primary-500 bg-primary-50'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                        {isCurrentPackage && (
                          <Check className="h-6 w-6 text-primary-600" />
                        )}
                      </div>
                    {pkg.description && (
                      <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                    )}
                    <div className="mb-2">
                      <p className="text-2xl font-bold text-gray-900">
                        {pkg.price === 0 ? (
                          'Free'
                        ) : (
                          <>
                            {/* Assume prices are in USD, display both currencies */}
                            {isNepal ? (
                              <>
                                {formatCurrency(convertUSDToNPR(pkg.price), 'NPR')}
                                <span className="text-sm font-normal text-gray-500 ml-1">
                                  (≈ {formatCurrency(pkg.price, 'USD')})
                                </span>
                              </>
                            ) : (
                              <>
                                {formatCurrency(pkg.price, 'USD')}
                                <span className="text-sm font-normal text-gray-500 ml-1">
                                  (≈ {formatCurrency(convertUSDToNPR(pkg.price), 'NPR')})
                                </span>
                              </>
                            )}
                            <span className="text-sm font-normal text-gray-500">/mo</span>
                          </>
                        )}
                      </p>
                    </div>
                    <ul className="space-y-2 mb-4">
                      <li className="text-sm text-gray-600 flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        {pkg.base_user_limit} users
                      </li>
                      <li className="text-sm text-gray-600 flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        {pkg.base_role_limit} base roles
                        {pkg.additional_role_limit > 0 && (
                          <span className="text-xs text-gray-500 ml-1">
                            (+{pkg.additional_role_limit} additional)
                          </span>
                        )}
                      </li>
                    </ul>
                      {!isCurrentPackage && (
                        <button
                          onClick={() => handlePackageUpgrade(pkg)}
                          disabled={createPackagePaymentMutation.isPending}
                          className="btn btn-primary w-full flex items-center justify-center"
                        >
                          {createPackagePaymentMutation.isPending ? (
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
                      )}
                      {isCurrentPackage && (
                        <button className="btn btn-secondary w-full" disabled>
                          <Check className="h-4 w-4 mr-2 inline" />
                          Current Package
                        </button>
                      )}
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
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Purchasing:</p>
              <p className="text-lg font-semibold text-gray-900 mb-2">
                {pendingPayment.type === 'package' ? pendingPayment.item.name : pendingPayment.item.name}
              </p>
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

