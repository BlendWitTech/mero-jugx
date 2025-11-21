import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { CreditCard, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  isNepalRegion,
  getPrimaryCurrency,
  getDisplayCurrencies,
  convertNPRToUSD,
  convertUSDToNPR,
  formatCurrency,
} from '../../utils/currency';

interface CreatePaymentRequest {
  payment_type: 'package_upgrade' | 'subscription' | 'one_time';
  amount: number;
  description?: string;
  package_id?: string;
  metadata?: Record<string, any>;
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [amount, setAmount] = useState<number>(1000); // Always store in NPR
  const [description, setDescription] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'package_upgrade' | 'subscription' | 'one_time'>('one_time');
  const [isNepal, setIsNepal] = useState<boolean>(false);
  const [primaryCurrency, setPrimaryCurrency] = useState<'NPR' | 'USD'>('USD');

  // Detect if user is in Nepal
  useEffect(() => {
    const nepal = isNepalRegion();
    setIsNepal(nepal);
    setPrimaryCurrency(nepal ? 'NPR' : 'USD');
  }, []);

  // Get display currencies
  const displayCurrencies = getDisplayCurrencies(amount);

  const createPaymentMutation = useMutation({
    mutationFn: async (data: CreatePaymentRequest) => {
      console.log('Sending payment request:', data);
      try {
        const response = await api.post('/payments', data);
        console.log('Payment response:', response.data);
        return response.data;
      } catch (error: any) {
        console.error('Payment API error:', error);
        console.error('Error response:', error?.response);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Verify we have the payment form data
      if (!data.payment_form || !data.payment_form.formUrl || !data.payment_form.formData) {
        toast.error('Invalid payment form data received');
        console.error('Payment form data:', data);
        return;
      }

      console.log('Creating eSewa payment form:', {
        url: data.payment_form.formUrl,
        data: data.payment_form.formData,
      });

      try {
        // Create and submit the eSewa payment form
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.payment_form.formUrl;
        form.target = '_self';
        form.style.display = 'none'; // Hide the form
        form.enctype = 'application/x-www-form-urlencoded';

        // Add form fields
        Object.entries(data.payment_form.formData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        // Log form data for debugging
        console.log('Submitting eSewa form:', {
          url: form.action,
          method: form.method,
          fields: Object.keys(data.payment_form.formData),
        });

        // Append form to body
        document.body.appendChild(form);
        
        // Small delay to ensure form is in DOM before submission
        setTimeout(() => {
          form.submit();
        }, 10);
      } catch (error) {
        console.error('Error submitting payment form:', error);
        toast.error('Failed to redirect to payment gateway. Please try again.');
      }
    },
    onError: (error: any) => {
      console.error('Payment mutation onError:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
      });
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Failed to create payment. Please check the console for details.';
      toast.error(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted:', { amount, paymentType, description });
    
    if (amount < 0.01) {
      toast.error('Amount must be at least 0.01');
      return;
    }

    console.log('Calling createPaymentMutation...');
    
    // Always send amount in NPR to backend
    createPaymentMutation.mutate({
      payment_type: paymentType,
      amount: amount, // Always in NPR
      description: description || undefined,
    }, {
      onError: (error) => {
        console.error('Payment mutation error:', error);
        toast.error(error?.response?.data?.message || error?.message || 'Failed to create payment');
      },
    });
  };

  if (!_hasHydrated) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center mb-6">
          <CreditCard className="h-12 w-12 text-blue-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Make a Payment
        </h2>

        <form 
          onSubmit={(e) => {
            console.log('Form onSubmit triggered');
            handleSubmit(e);
          }} 
          className="space-y-4"
          noValidate
        >
          <div>
            <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Type
            </label>
            <select
              id="paymentType"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="one_time">One Time Payment</option>
              <option value="package_upgrade">Package Upgrade</option>
              <option value="subscription">Subscription</option>
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount ({primaryCurrency})
            </label>
            <input
              type="number"
              id="amount"
              value={isNepal ? amount : convertNPRToUSD(amount)}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                // Convert input to NPR (always store in NPR)
                if (isNepal) {
                  setAmount(value);
                } else {
                  setAmount(convertUSDToNPR(value));
                }
              }}
              min="0.01"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <div className="mt-2 p-3 bg-gray-50 rounded-md">
              <div className="text-sm space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">NPR:</span>
                  <span className="text-gray-900 font-semibold">
                    {displayCurrencies.primary.currency === 'NPR' 
                      ? displayCurrencies.primary.formatted 
                      : displayCurrencies.secondary.formatted}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">USD:</span>
                  <span className="text-gray-900 font-semibold">
                    {displayCurrencies.primary.currency === 'USD' 
                      ? displayCurrencies.primary.formatted 
                      : displayCurrencies.secondary.formatted}
                  </span>
                </div>
                {/* Always show both in development */}
                {(process.env.NODE_ENV === 'development' || import.meta.env?.DEV) && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 italic">
                      Development Mode: Both currencies displayed
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={createPaymentMutation.isPending}
            onClick={(e) => {
              console.log('Button clicked, form will submit');
              // Don't prevent default here - let form handle it
            }}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createPaymentMutation.isPending ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Processing...
              </>
            ) : (
              'Pay with eSewa'
            )}
          </button>
          
          {/* Show error message if mutation failed */}
          {createPaymentMutation.isError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 font-medium">Payment Error</p>
              <p className="text-xs text-red-700 mt-1">
                {createPaymentMutation.error?.response?.data?.message || 
                 createPaymentMutation.error?.message || 
                 'Failed to create payment. Please check console for details.'}
              </p>
              {createPaymentMutation.error?.response?.status && (
                <p className="text-xs text-red-600 mt-1">
                  Status: {createPaymentMutation.error.response.status}
                </p>
              )}
            </div>
          )}
        </form>

        <div className="mt-6 space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> You will be redirected to eSewa to complete the payment.
              {process.env.NODE_ENV === 'development' && (
                <span className="block mt-1">Using test credentials for development.</span>
              )}
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <label className="block text-sm font-medium text-blue-900 mb-2">
              Region/Country
            </label>
            <select
              value={isNepal ? 'NP' : 'US'}
              onChange={(e) => {
                const country = e.target.value;
                const nepal = country === 'NP';
                setIsNepal(nepal);
                setPrimaryCurrency(nepal ? 'NPR' : 'USD');
                localStorage.setItem('user_country', country);
              }}
              className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              <option value="NP">Nepal (NPR)</option>
              <option value="US">Other Regions (USD)</option>
            </select>
            <p className="text-xs text-blue-700 mt-2">
              Select your region to see the appropriate currency. Payment will be processed in NPR via eSewa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

