import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const hasVerifiedRef = useRef(false); // Track if verification has been attempted

  // Get all URL parameters for debugging (memoized to prevent re-renders)
  const allParams = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);

  // eSewa v2 API returns data in a base64-encoded JSON string in the 'data' parameter
  // Decode and parse it if present (memoized to prevent re-renders)
  const esewaData = useMemo(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        // Decode base64 and parse JSON
        const decodedData = atob(dataParam);
        return JSON.parse(decodedData);
      } catch (error) {
        console.error('Failed to decode eSewa data parameter:', error);
        return null;
      }
    }
    return null;
  }, [searchParams]);

  // Support both v2 API format (ref_id, transaction_uuid) and legacy format (refId, pid)
  // Also check for various eSewa parameter formats
  // Priority: decoded data > direct query params
  // Note: eSewa v2 API may return transaction_code instead of ref_id
  // Memoize these values to prevent unnecessary re-renders
  const refId = useMemo(() => 
    esewaData?.ref_id || 
    esewaData?.transaction_code || // Use transaction_code as ref_id if ref_id is not present
    searchParams.get('ref_id') || 
    searchParams.get('refId') || 
    searchParams.get('refid') ||
    searchParams.get('rid'),
    [esewaData, searchParams]
  );
  
  const sessionId = useMemo(() => 
    searchParams.get('session_id') || 
    searchParams.get('sessionId') ||
    searchParams.get('session-id'),
    [searchParams]
  );
  
  const transactionId = useMemo(() =>
    esewaData?.transaction_uuid ||
    esewaData?.transaction_code ||
    searchParams.get('transaction_uuid') || 
    searchParams.get('transactionUuid') ||
    searchParams.get('pid') || 
    searchParams.get('transactionId') ||
    searchParams.get('transaction_id') ||
    searchParams.get('oid'),
    [esewaData, searchParams]
  );
  
  // Check for eSewa token-related parameters
  const userToken = useMemo(() => 
    searchParams.get('user_token') || searchParams.get('userToken'),
    [searchParams]
  );
  
  const tokenMessage = useMemo(() => 
    searchParams.get('set_token_message') || searchParams.get('setTokenMessage'),
    [searchParams]
  );

  const verifyPaymentMutation = useMutation({
    mutationFn: async (data: { transactionId: string; refId?: string; sessionId?: string }) => {
      const response = await api.post('/payments/verify', data);
      return response.data;
    },
    onSuccess: async (data) => {
      setVerifying(false);
      if (data.success) {
        setVerified(true);
        
        // Check if there was a post-payment error first
        if (data.post_payment_error) {
          toast.error(`Payment verified but upgrade failed: ${data.post_payment_error}`, { duration: 6000, id: 'payment-upgrade-error' });
        } else {
          // Show success message only once
          toast.success('Payment verified successfully! Package/feature will be activated shortly.', { id: 'payment-success' });
        }
        
        // Aggressively invalidate ALL package-related queries across the entire application
        // This ensures package data is refreshed everywhere (Dashboard, Roles, Organizations, Packages pages)
        console.log('Invalidating all package-related queries...');
        
        // Invalidate all queries that contain 'package' in their key
        await Promise.all([
          queryClient.invalidateQueries({ predicate: (query) => {
            const key = query.queryKey;
            return Array.isArray(key) && (
              key.some(k => typeof k === 'string' && k.toLowerCase().includes('package')) ||
              key.some(k => typeof k === 'string' && k.toLowerCase().includes('current-package'))
            );
          }}),
          // Also invalidate organization queries as they might contain package info
          queryClient.invalidateQueries({ queryKey: ['organizations'], exact: false }),
          queryClient.invalidateQueries({ queryKey: ['organization'], exact: false }),
        ]);
        
        // Wait for backend to complete the upgrade
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refetch all package-related queries
        console.log('Refetching all package-related queries...');
        await Promise.all([
          queryClient.refetchQueries({ predicate: (query) => {
            const key = query.queryKey;
            return Array.isArray(key) && (
              key.some(k => typeof k === 'string' && k.toLowerCase().includes('package')) ||
              key.some(k => typeof k === 'string' && k.toLowerCase().includes('current-package'))
            );
          }}),
        ]);
        
        // Wait a bit more and refetch again to ensure we have the latest data
        await new Promise(resolve => setTimeout(resolve, 500));
        await queryClient.refetchQueries({ queryKey: ['current-package'], exact: false });
        
        // Dispatch a custom event to notify all components about package update
        window.dispatchEvent(new CustomEvent('package-updated', { 
          detail: { packageId: data.payment?.package_id } 
        }));
        
        setTimeout(() => {
          // Navigate and force a refetch on the packages page
          navigate('/packages', { replace: true });
          // Trigger another comprehensive refetch after navigation
          setTimeout(() => {
            queryClient.invalidateQueries({ predicate: (query) => {
              const key = query.queryKey;
              return Array.isArray(key) && (
                key.some(k => typeof k === 'string' && k.toLowerCase().includes('package'))
              );
            }});
            queryClient.refetchQueries({ queryKey: ['current-package'], exact: false });
          }, 500);
        }, 1500);
      } else {
        toast.error(data.message || 'Payment verification failed', { id: 'payment-failed' });
        setTimeout(() => {
          navigate('/packages');
        }, 3000);
      }
    },
    onError: (error: any) => {
      setVerifying(false);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Payment verification failed';
      console.error('Payment verification error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(errorMessage, { duration: 5000 });
      setTimeout(() => {
        navigate('/packages');
      }, 4000);
    },
  });

  useEffect(() => {
    // Prevent multiple verification attempts
    if (hasVerifiedRef.current) {
      return;
    }

    console.log('Payment verification check:', {
      refId,
      sessionId,
      transactionId,
      userToken,
      tokenMessage,
      esewaData,
      allParams,
    });

    // Check for eSewa token authentication error first
    if (userToken || tokenMessage) {
      hasVerifiedRef.current = true;
      // eSewa token authentication required
      setVerifying(false);
      toast.error(
        'eSewa requires token authentication. Please enable Mock Mode in .env (ESEWA_USE_MOCK_MODE=true) for development testing.',
        { duration: 6000, id: 'esewa-token-error' }
      );
      const timeoutId = setTimeout(() => {
        navigate('/packages');
      }, 4000);
      return () => clearTimeout(timeoutId);
    }

    // For Stripe: use session_id
    if (sessionId) {
      hasVerifiedRef.current = true;
      console.log('Verifying Stripe payment with sessionId:', sessionId);
      // Stripe payment - transactionId will be retrieved from session on backend
      verifyPaymentMutation.mutate({
        transactionId: transactionId || '', // Use transactionId if available, otherwise empty
        sessionId,
      });
      return;
    }

    // For eSewa: check if we have decoded data or individual parameters
    // eSewa v2 API may return status in the decoded data
    if (esewaData) {
      // Check if payment was successful based on status in decoded data
      const status = esewaData.status || esewaData.payment_status;
      if (status === 'COMPLETE' || status === 'SUCCESS' || status === 'success') {
        // We have eSewa data, extract transaction info
        // eSewa v2 API may return transaction_code instead of ref_id
        const esewaRefId = esewaData.ref_id || esewaData.reference_id || esewaData.transaction_code;
        const esewaTransactionId = esewaData.transaction_uuid || esewaData.transaction_code || esewaData.oid;
        
        if (esewaTransactionId) {
          hasVerifiedRef.current = true;
          console.log('Verifying eSewa payment from decoded data:', { 
            transactionId: esewaTransactionId, 
            refId: esewaRefId,
            status,
            esewaData 
          });
          verifyPaymentMutation.mutate({
            transactionId: esewaTransactionId || '',
            refId: esewaRefId || undefined, // Allow undefined refId for eSewa v2 API
          });
          return;
        }
      } else if (status === 'FAILURE' || status === 'FAILED' || status === 'failed') {
        // Payment failed according to eSewa
        hasVerifiedRef.current = true;
        setVerifying(false);
        toast.error('Payment was not successful according to eSewa. Please try again.', { id: 'esewa-failed' });
        const timeoutId = setTimeout(() => {
          navigate('/packages');
        }, 3000);
        return () => clearTimeout(timeoutId);
      }
    }

    // For eSewa: need refId and transactionId (from direct query params)
    if (refId && transactionId) {
      hasVerifiedRef.current = true;
      console.log('Verifying eSewa payment:', { transactionId, refId });
      verifyPaymentMutation.mutate({
        transactionId,
        refId,
      });
      return;
    }

    // If we have transactionId but no refId, try to verify anyway (might work for some cases)
    if (transactionId && !refId) {
      hasVerifiedRef.current = true;
      console.log('Attempting verification with transactionId only:', transactionId);
      verifyPaymentMutation.mutate({
        transactionId,
        refId: '', // Empty refId - backend will try to find payment
      });
      return;
    }

    // No valid parameters found
    hasVerifiedRef.current = true;
    console.error('Missing payment information. Available parameters:', allParams);
    setVerifying(false);
    toast.error(
      `Missing payment information. Please check your payment status or contact support. Parameters: ${JSON.stringify(allParams)}`,
      { duration: 5000, id: 'missing-payment-info' }
    );
    const timeoutId = setTimeout(() => {
      navigate('/packages');
    }, 3000);
    return () => clearTimeout(timeoutId);
  }, [refId, transactionId, sessionId, userToken, tokenMessage, esewaData, allParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {verifying ? (
          <>
            <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Payment...
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your payment with eSewa.
            </p>
          </>
        ) : verified ? (
          <>
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-4">
              Your payment has been verified and processed successfully.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to payments page...
            </p>
          </>
        ) : (
          <>
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-red-600">✕</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Verification Failed
            </h2>
            <p className="text-gray-600 mb-4">
              We couldn't verify your payment. Please contact support if you believe this is an error.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to payment page...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

