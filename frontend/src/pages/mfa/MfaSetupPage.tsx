import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
// Removed QRCode import - using backend-generated QR code image instead
import { Loader2, Shield } from 'lucide-react';

export default function MfaSetupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [step] = useState<'qr' | 'verify'>('qr');
  
  // Use ref to track initial token - this prevents query key changes
  // The query key should remain stable to prevent infinite loops
  const initialTokenRef = useRef<string | null>(localStorage.getItem('mfa_setup_token'));
  const tempSetupToken = initialTokenRef.current;
  
  // Redirect to login if no token
  useEffect(() => {
    if (!tempSetupToken && step === 'qr') {
      navigate('/login');
    }
  }, [tempSetupToken, step, navigate]);

  const { data: setupData, isLoading: isLoadingSetup, error: setupError } = useQuery({
    queryKey: ['mfa-setup', tempSetupToken],
    queryFn: async () => {
      // Use the token from state, not localStorage directly
      if (!tempSetupToken) {
        throw new Error('No MFA setup token found. Please login again.');
      }
      
      try {
        // Remove Authorization header if present to prevent JWT validation
        const config: any = {
          headers: {
            'X-MFA-Setup-Token': tempSetupToken,
          },
        };
        // Delete Content-Type header since we're not sending a body
        delete config.headers['Content-Type'];
        
        // Explicitly remove Authorization header to prevent JWT validation
        // The guard should handle temp token authentication
        // Don't send a body - the endpoint doesn't expect one
        const response = await api.post('/mfa/setup/initialize', undefined, config);
        
        // Update localStorage if a new token is provided
        // Don't update the ref or state - keep query key stable to prevent infinite loops
        if (response.data.temp_setup_token && response.data.temp_setup_token !== tempSetupToken) {
          localStorage.setItem('mfa_setup_token', response.data.temp_setup_token);
        }
        
        return response.data;
      } catch (error: any) {
        throw error;
      }
    },
    enabled: step === 'qr' && !!tempSetupToken, // Only run if token exists
    retry: false, // Don't retry on error
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on mount if data exists
    refetchOnReconnect: false, // Don't refetch on reconnect
    staleTime: Infinity, // Data never becomes stale
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: { code: string; temp_setup_token: string }) => {
      // Use the token from localStorage (may have been updated by initializeSetup)
      const tokenToUse = localStorage.getItem('mfa_setup_token');
      await api.post('/mfa/setup/verify', {
        code: data.code,
        temp_setup_token: data.temp_setup_token, // Use token from initializeSetup, not login token
      }, {
        headers: tokenToUse ? {
          'X-MFA-Setup-Token': tokenToUse, // Use token for authentication
        } : {},
      });
    },
    onSuccess: () => {
      // Clear the temporary setup token
      localStorage.removeItem('mfa_setup_token');
      toast.success('2FA setup completed successfully! Please login again.');
      // Invalidate queries to refresh user data
      queryClient.invalidateQueries();
      // Navigate to login to complete the login flow
      navigate('/login');
    },
  });

  const handleVerify = () => {
    // Clean the code - remove any non-numeric characters
    const cleanCode = code.replace(/\D/g, '');
    
    if (!setupData || cleanCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    verifyMutation.mutate({
      code: cleanCode, // Use cleaned code
      temp_setup_token: setupData.temp_setup_token, // Pass the token from initializeSetup
    });
  };

  // Handle error state
  if (setupError) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Setup Two-Factor Authentication</h1>
          <p className="mt-2 text-gray-600">Secure your account with 2FA</p>
        </div>
        <div className="card">
          <div className="text-center py-12">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Setup Token Expired</h2>
            <p className="text-gray-600 mb-6">
              {(setupError as any)?.response?.data?.message || (setupError as any)?.message || 'Your MFA setup token has expired or is invalid. Please login again to get a new token.'}
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('mfa_setup_token');
                navigate('/login');
              }}
              className="btn btn-primary"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingSetup) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Setup Two-Factor Authentication</h1>
          <p className="mt-2 text-gray-600">Secure your account with 2FA</p>
        </div>
        <div className="card flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Setup Two-Factor Authentication</h1>
        <p className="mt-2 text-gray-600">Secure your account with 2FA</p>
      </div>

      <div className="card">
        <div className="text-center mb-6">
          <Shield className="h-16 w-16 text-primary-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Scan QR Code</h2>
          <p className="text-sm text-gray-600 mb-2">
            Use your authenticator app to scan this QR code
          </p>
          {setupData.user_email && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-medium text-blue-900 mb-1">
                ⚠️ Important: Verify Email Address
              </p>
              <p className="text-xs text-blue-700">
                Make sure the email shown in Google Authenticator matches:
              </p>
              <p className="text-xs font-semibold text-blue-900 mt-1">
                {setupData.user_email}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                If the email doesn't match, please logout and login again with the correct email.
              </p>
            </div>
          )}
        </div>

        {setupData && (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                {setupData.qr_code_url ? (
                  <img 
                    src={setupData.qr_code_url} 
                    alt="QR Code for 2FA Setup" 
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-gray-400">
                    Loading QR code...
                  </div>
                )}
              </div>
            </div>
            
            {setupData.otp_url && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">
                  Can't scan? Enter this code manually:
                </p>
                <code className="text-xs break-all text-gray-800">
                  {setupData.secret}
                </code>
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Enter Verification Code
              </label>
              <input
                id="code"
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="input text-center text-2xl tracking-widest"
                placeholder="000000"
                autoFocus
              />
            </div>

            <div className="space-y-4">
              <button
                onClick={handleVerify}
                disabled={verifyMutation.isPending || code.length !== 6}
                className="btn btn-primary w-full"
              >
                {verifyMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Verifying...
                  </>
                ) : (
                  'Verify and Complete Setup'
                )}
              </button>

              {setupData.backup_codes && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-2">
                    Save these backup codes securely:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {setupData.backup_codes.map((backupCode: string, index: number) => (
                      <code key={index} className="text-sm text-yellow-900 font-mono">
                        {backupCode}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

