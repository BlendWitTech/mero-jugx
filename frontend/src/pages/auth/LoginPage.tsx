import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService, LoginResponse } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [requiresOrgSelection, setRequiresOrgSelection] = useState(false);
  const [availableOrganizations, setAvailableOrganizations] = useState<Array<{id: string; name: string; slug: string; role: string}>>([]);
  const [loginCredentials, setLoginCredentials] = useState<{email: string; password: string} | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);

  // Handle email verification success message from navigation state
  useEffect(() => {
    if (location.state?.emailVerified && location.state?.message) {
      toast.success(location.state.message, {
        duration: 5000,
        icon: '✅',
        style: {
          background: '#10b981',
          color: '#fff',
          fontSize: '16px',
          padding: '16px',
        },
      });
      // Clear the state to prevent showing the message again on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    // Clear any existing MFA setup token before attempting login
    // This ensures we use a fresh token from the login response
    localStorage.removeItem('mfa_setup_token');
    
    try {
      // Login without organization_id - backend will handle organization selection
      const response: LoginResponse = await authService.login({
        email: data.email,
        password: data.password,
      });

      // Handle MFA setup requirement FIRST (before other checks)
      // Check multiple ways the response might indicate MFA setup is required
      if (
        response.requires_mfa_setup === true || 
        response.requires_mfa_setup === 'true' ||
        response.temp_setup_token ||
        (response.message && response.message.includes('MFA is required'))
      ) {
        // Store temporary setup token for MFA setup
        const tempToken = response.temp_setup_token;
        if (tempToken) {
          localStorage.setItem('mfa_setup_token', tempToken);
        }
        setIsLoading(false);
        toast('MFA is required. Please set up 2FA first.', { icon: '🔐' });
        // Small delay to ensure toast is shown before navigation
        await new Promise(resolve => setTimeout(resolve, 300));
        navigate('/mfa/setup');
        return;
      }

      // If organization selection is required (user has multiple organizations)
      if (response.requires_organization_selection && response.organizations) {
        setRequiresOrgSelection(true);
        setAvailableOrganizations(response.organizations);
        setLoginCredentials({ email: data.email, password: data.password });
        setIsLoading(false);
        return;
      }

      // Handle MFA verification requirement
      if (response.requires_mfa_verification && response.temp_token) {
        setMfaRequired(true);
        setTempToken(response.temp_token);
        setIsLoading(false);
        return;
      }

      // Handle successful login
      if (response.access_token && response.user && response.organization) {
        const org = {
          id: response.organization.id,
          name: response.organization.name || '',
          slug: response.organization.slug || '',
        };
        setAuth(
          {
            access_token: response.access_token,
            refresh_token: response.refresh_token || '',
          },
          response.user,
          org,
        );
        toast.success('Login successful!');
        // Small delay to ensure token is persisted to localStorage before navigation
        await new Promise(resolve => setTimeout(resolve, 100));
        // Navigate to organization slug route if available
        if (org.slug) {
          navigate(`/org/${org.slug}`);
        } else {
          navigate('/');
        }
        setIsLoading(false);
        return;
      }

      // If we get here, the response doesn't match any expected format
      toast.error('Unexpected response from server. Please try again.');
      setIsLoading(false);
    } catch (error: any) {
      // Check if error response contains MFA setup requirement
      const errorData = error.response?.data || error.data || {};
      if (
        errorData.requires_mfa_setup === true || 
        errorData.requires_mfa_setup === 'true' ||
        errorData.temp_setup_token ||
        (errorData.message && errorData.message.includes('MFA is required'))
      ) {
        const tempToken = errorData.temp_setup_token;
        if (tempToken) {
          localStorage.setItem('mfa_setup_token', tempToken);
        }
        setIsLoading(false);
        toast('MFA is required. Please set up 2FA first.', { icon: '🔐' });
        await new Promise(resolve => setTimeout(resolve, 300));
        navigate('/mfa/setup');
        return;
      }
      
      // Show error message
      const errorMessage = errorData.message || error.message || 'Login failed';
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const handleOrganizationSelect = async (organizationId: string) => {
    if (!loginCredentials) return;
    
    // Clear any existing MFA setup token before selecting organization
    localStorage.removeItem('mfa_setup_token');
    
    setIsLoading(true);
    try {
      const response: LoginResponse = await authService.login({
        email: loginCredentials.email,
        password: loginCredentials.password,
        organization_id: organizationId,
      });

      // Handle MFA setup requirement
      if (response.requires_mfa_setup) {
        // Store temporary setup token for MFA setup
        if (response.temp_setup_token) {
          localStorage.setItem('mfa_setup_token', response.temp_setup_token);
          console.log('[Login] Stored MFA setup token:', response.temp_setup_token);
        }
        setIsLoading(false);
        toast('MFA is required. Please set up 2FA first.', { icon: '🔐' });
        // Small delay to ensure toast is shown before navigation
        await new Promise(resolve => setTimeout(resolve, 300));
        navigate('/mfa/setup');
        return;
      }

      if (response.requires_mfa_verification && response.temp_token) {
        setMfaRequired(true);
        setTempToken(response.temp_token);
        setRequiresOrgSelection(false);
        return;
      }

      if (response.access_token && response.user && response.organization) {
        setAuth(
          {
            access_token: response.access_token,
            refresh_token: response.refresh_token || '',
          },
          response.user,
          { id: response.organization.id, name: response.organization.name || '' },
        );
        toast.success('Login successful!');
        // Small delay to ensure token is persisted to localStorage before navigation
        await new Promise(resolve => setTimeout(resolve, 100));
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaVerify = async () => {
    if (!tempToken || !mfaCode) {
      toast.error('Please enter the 2FA code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.verifyMfa(tempToken, mfaCode);
      
      // Check if organization selection is needed after MFA
      if (response.requires_organization_selection && response.organizations) {
        setRequiresOrgSelection(true);
        setAvailableOrganizations(response.organizations);
        setMfaRequired(false);
        setTempToken(null);
        setMfaCode('');
        setIsLoading(false);
        return;
      }

      if (response.access_token && response.user && response.organization) {
        setAuth(
          {
            access_token: response.access_token,
            refresh_token: response.refresh_token || '',
          },
          response.user,
          { id: response.organization.id, name: response.organization.name || '' },
        );
        toast.success('Login successful!');
        // Small delay to ensure token is persisted to localStorage before navigation
        await new Promise(resolve => setTimeout(resolve, 100));
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid 2FA code');
    } finally {
      setIsLoading(false);
    }
  };

  if (requiresOrgSelection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#36393f] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-[#2f3136] rounded-lg shadow-xl border border-[#202225] p-8">
            <div>
              <h2 className="text-center text-3xl font-extrabold text-white">
                Select Organization
              </h2>
              <p className="mt-2 text-center text-sm text-[#b9bbbe]">
                You belong to multiple organizations. Please select one to continue.
              </p>
            </div>
            <div className="mt-8 space-y-4">
              {availableOrganizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleOrganizationSelect(org.id)}
                  disabled={isLoading}
                  className="w-full p-4 border-2 border-[#202225] rounded-lg hover:border-[#5865f2] hover:bg-[#393c43] transition-colors text-left"
                >
                  <div className="font-semibold text-white">{org.name}</div>
                  <div className="text-sm text-[#8e9297] mt-1">Role: {org.role}</div>
                </button>
              ))}
              <button
                onClick={() => {
                  setRequiresOrgSelection(false);
                  setAvailableOrganizations([]);
                  setLoginCredentials(null);
                }}
                className="w-full text-sm text-[#5865f2] hover:text-[#4752c4]"
              >
                Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mfaRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#36393f] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-[#2f3136] rounded-lg shadow-xl border border-[#202225] p-8">
            <div>
              <h2 className="text-center text-3xl font-extrabold text-white">
                Two-Factor Authentication
              </h2>
              <p className="mt-2 text-center text-sm text-[#b9bbbe]">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); handleMfaVerify(); }}>
              <div>
                <label htmlFor="mfa-code" className="block text-sm font-medium text-[#b9bbbe]">
                  Verification Code
                </label>
                <input
                  id="mfa-code"
                  type="text"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  className="input mt-1 text-center text-2xl tracking-widest"
                  placeholder="000000"
                  autoFocus
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading || mfaCode.length !== 6}
                  className="btn btn-primary w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Verifying...
                    </>
                  ) : (
                    'Verify'
                  )}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMfaRequired(false);
                    setTempToken(null);
                    setMfaCode('');
                  }}
                  className="text-sm text-[#5865f2] hover:text-[#4752c4]"
                >
                  Back to login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#36393f] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-[#2f3136] rounded-lg shadow-xl border border-[#202225] p-8">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-white">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-[#b9bbbe]">
              Or{' '}
              <a href="/register" className="font-medium text-[#5865f2] hover:text-[#4752c4]">
                register a new organization
              </a>
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#b9bbbe]">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="input mt-1"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-[#ed4245]">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#b9bbbe]">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  {...register('password')}
                  className="input mt-1"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-[#ed4245]">{errors.password.message}</p>
                )}
              </div>

            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <a href="/forgot-password" className="font-medium text-[#5865f2] hover:text-[#4752c4]">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

