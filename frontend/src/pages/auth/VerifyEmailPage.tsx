import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    // Show loading state first - keep it until we get a response
    setStatus('loading');
    setMessage('Verifying your email address...');

    // Use a flag to prevent multiple calls
    let isMounted = true;

    authService
      .verifyEmail(token)
      .then((response) => {
        if (!isMounted) return;
        
        // Show success state immediately (no error state first)
        setStatus('success');
        const successMessage = response.message || 'Email verified successfully!';
        setMessage(successMessage);
        
        // Show success toast
        toast.success(successMessage, {
          duration: 4000,
          icon: '✅',
          style: {
            background: '#10b981',
            color: '#fff',
            fontSize: '16px',
            padding: '16px',
          },
        });

        // Redirect to login after showing success message
        setTimeout(() => {
          if (!isMounted) return;
          navigate('/login', { 
            state: { 
              emailVerified: true,
              message: successMessage.includes('already') 
                ? 'Your email is already verified! You can now login.' 
                : 'Email verified successfully! You can now login.' 
            } 
          });
        }, 3000);
      })
      .catch((error) => {
        if (!isMounted) return;
        
        // Only show error if it's a real error (not already verified)
        const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Invalid or expired verification token. Please request a new verification email.';
        
        // Check if error is about token already used - treat as success
        // This is a fallback in case backend still returns error for already verified
        if (errorMessage.toLowerCase().includes('already been used') || 
            errorMessage.toLowerCase().includes('already verified')) {
          setStatus('success');
          setMessage('Your email is already verified!');
          
          toast.success('Your email is already verified!', {
            duration: 4000,
            icon: '✅',
            style: {
              background: '#10b981',
              color: '#fff',
              fontSize: '16px',
              padding: '16px',
            },
          });

          setTimeout(() => {
            if (!isMounted) return;
            navigate('/login', { 
              state: { 
                emailVerified: true,
                message: 'Your email is already verified! You can now login.' 
              } 
            });
          }, 3000);
        } else {
          // Real error - show error state
          setStatus('error');
          setMessage(errorMessage);
          
          toast.error(errorMessage, {
            duration: 5000,
            icon: '❌',
          });
        }
      });

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#36393f] px-4">
      <div className="bg-[#2f3136] rounded-lg shadow-xl border border-[#202225] p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#5865f2]/20 mb-4">
                <Loader2 className="h-10 w-10 text-[#5865f2] animate-spin" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verifying Email</h2>
            <p className="text-[#b9bbbe] mb-4">{message}</p>
            <div className="w-full bg-[#202225] rounded-full h-2">
              <div className="bg-[#5865f2] h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#23a55a]/20 mb-4 animate-scale-in">
                <CheckCircle className="h-12 w-12 text-[#23a55a]" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verification Successful!</h2>
            <p className="text-[#b9bbbe] mb-6">{message}</p>
            <div className="bg-[#23a55a]/10 border border-[#23a55a]/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-[#23a55a]">
                ✅ Your email address has been verified successfully. You can now login to your account.
              </p>
            </div>
            <p className="text-sm text-[#8e9297] mb-4">Redirecting to login page...</p>
            <div className="w-full bg-[#202225] rounded-full h-2">
              <div className="bg-[#23a55a] h-2 rounded-full animate-progress" style={{ width: '100%' }}></div>
            </div>
            <button
              onClick={() => navigate('/login', { 
                state: { 
                  emailVerified: true,
                  message: 'Email verified successfully! You can now login.' 
                } 
              })}
              className="btn btn-primary mt-6 w-full"
            >
              Go to Login Now
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#ed4245]/20 mb-4">
                <XCircle className="h-12 w-12 text-[#ed4245]" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
            <p className="text-[#b9bbbe] mb-6">{message}</p>
            <div className="bg-[#ed4245]/10 border border-[#ed4245]/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-[#ed4245]">
                ⚠️ The verification link is invalid or has expired. Please request a new verification email.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary w-full"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="btn btn-secondary w-full"
              >
                Register Again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

