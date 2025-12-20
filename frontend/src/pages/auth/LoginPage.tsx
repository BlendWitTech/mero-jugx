import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService, LoginResponse } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { Loader2, Mail, Lock, Shield, ArrowLeft, Building2, Sparkles, Eye, EyeOff } from 'lucide-react';

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
  const [loginCredentials, setLoginCredentials] = useState<{email: string; password?: string; mfaCode?: string} | null>(null);
  const [loginMode, setLoginMode] = useState<'email' | 'password' | 'mfa'>('email');
  const [email, setEmail] = useState('');
  const [mfaLoginEmail, setMfaLoginEmail] = useState('');
  const [checkingMfa, setCheckingMfa] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showMfaCode, setShowMfaCode] = useState(false);
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
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Check if MFA is available for email
  const handleEmailSubmit = async (emailValue: string) => {
    if (!emailValue || !emailValue.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setCheckingMfa(true);
    try {
      const checkResult = await authService.checkMfaRequired(emailValue);
      setEmail(emailValue);
      setMfaLoginEmail(emailValue);
      
      if (checkResult.mfa_available) {
        setLoginMode('mfa');
        toast.success('MFA login available. Please enter your authenticator code.', { icon: '🔐' });
      } else {
        setLoginMode('password');
      }
    } catch (error: any) {
      // Handle connection errors gracefully
      if (!error.response) {
        const isNetworkError = 
          error.message?.includes('Network Error') ||
          error.message?.includes('ERR_CONNECTION_REFUSED') ||
          error.message?.includes('Failed to fetch');
        
        if (isNetworkError) {
          toast.error('Unable to connect to the server. Please make sure the backend server is running.', {
            duration: 6000,
          });
        }
      }
      // Fallback to password login if MFA check fails
      setLoginMode('password');
      setEmail(emailValue);
    } finally {
      setCheckingMfa(false);
    }
  };

  // Handle MFA-only login
  const handleMfaLogin = async () => {
    if (!mfaLoginEmail || !mfaCode || mfaCode.length !== 6) {
      toast.error('Please enter email and a valid 6-digit MFA code');
      return;
    }

    setIsLoading(true);
    try {
      const response: LoginResponse = await authService.loginWithMfa({
        email: mfaLoginEmail,
        code: mfaCode,
      });

      if (response.requires_organization_selection && response.organizations) {
        setRequiresOrgSelection(true);
        setAvailableOrganizations(response.organizations);
        setLoginCredentials({ email: mfaLoginEmail, mfaCode: mfaCode });
        setIsLoading(false);
        return;
      }

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
        await new Promise(resolve => setTimeout(resolve, 100));
        if (org.slug) {
          navigate(`/org/${org.slug}`);
        } else {
          navigate('/');
        }
        setIsLoading(false);
        return;
      }

      toast.error('Unexpected response from server. Please try again.');
      setIsLoading(false);
    } catch (error: any) {
      // Handle connection errors
      if (!error.response) {
        const isNetworkError = 
          error.message?.includes('Network Error') ||
          error.message?.includes('ERR_CONNECTION_REFUSED') ||
          error.message?.includes('Failed to fetch');
        
        if (isNetworkError) {
          toast.error('Unable to connect to the server. Please make sure the backend server is running and try again.', {
            duration: 6000,
          });
          setIsLoading(false);
          return;
        }
      }
      
      // Get error message and clean it
      let errorMessage = error.response?.data?.message || error.message || 'Login failed';
      
      // Handle axios default error messages
      if (errorMessage.includes('Request failed with status code')) {
        const statusMatch = errorMessage.match(/status code (\d+)/i);
        const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : null;
        
        if (statusCode === 401) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (statusCode === 403) {
          errorMessage = 'You do not have permission to access this account.';
        } else if (statusCode === 400) {
          errorMessage = 'Invalid request. Please check your email and password.';
        } else {
          errorMessage = 'Login failed. Please try again.';
        }
      }
      
      // Remove any technical error codes from the message
      errorMessage = errorMessage.replace(/\b(40[0-9]|500|50[0-9])\b/g, '').trim();
      errorMessage = errorMessage.replace(/Request failed with status code\s*\d*/gi, '').trim();
      errorMessage = errorMessage.replace(/\b(HTTP|Status|Error Code|Status Code)\s*:?\s*/gi, '').trim();
      
      toast.error(errorMessage || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    localStorage.removeItem('mfa_setup_token');
    
    try {
      const response: LoginResponse = await authService.login({
        email: data.email,
        password: data.password,
      });

      if (
        response.requires_mfa_setup === true || 
        response.temp_setup_token ||
        (response.message && response.message.includes('MFA is required'))
      ) {
        const tempToken = response.temp_setup_token;
        if (tempToken) {
          localStorage.setItem('mfa_setup_token', tempToken);
        }
        setIsLoading(false);
        toast('MFA is required. Please set up 2FA first.', { icon: '🔐' });
        await new Promise(resolve => setTimeout(resolve, 300));
        navigate('/mfa/setup');
        return;
      }

      if (response.requires_organization_selection && response.organizations) {
        setRequiresOrgSelection(true);
        setAvailableOrganizations(response.organizations);
        setLoginCredentials({ email: data.email, password: data.password });
        setIsLoading(false);
        return;
      }

      if (response.requires_mfa_verification && response.temp_token) {
        setMfaRequired(true);
        setTempToken(response.temp_token);
        setIsLoading(false);
        return;
      }

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
        await new Promise(resolve => setTimeout(resolve, 100));
        if (org.slug) {
          navigate(`/org/${org.slug}`);
        } else {
          navigate('/');
        }
        setIsLoading(false);
        return;
      }

      toast.error('Unexpected response from server. Please try again.');
      setIsLoading(false);
    } catch (error: any) {
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
      
      // Get error message and clean it
      let errorMessage = errorData.message || error.message || 'Login failed';
      
      // Handle axios default error messages
      if (errorMessage.includes('Request failed with status code')) {
        const statusMatch = errorMessage.match(/status code (\d+)/i);
        const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : null;
        
        if (statusCode === 401) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (statusCode === 403) {
          errorMessage = 'You do not have permission to access this account.';
        } else {
          errorMessage = 'Login failed. Please try again.';
        }
      }
      
      // Remove any technical error codes from the message
      errorMessage = errorMessage.replace(/\b(40[0-9]|500|50[0-9])\b/g, '').trim();
      errorMessage = errorMessage.replace(/Request failed with status code\s*\d*/gi, '').trim();
      errorMessage = errorMessage.replace(/\b(HTTP|Status|Error Code|Status Code)\s*:?\s*/gi, '').trim();
      
      toast.error(errorMessage || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleOrganizationSelect = async (organizationId: string) => {
    if (!loginCredentials) return;
    
    localStorage.removeItem('mfa_setup_token');
    
    setIsLoading(true);
    try {
      let response: LoginResponse;
      if (loginCredentials.password) {
        response = await authService.login({
          email: loginCredentials.email,
          password: loginCredentials.password,
          organization_id: organizationId,
        });
      } else if (loginCredentials.mfaCode) {
        response = await authService.loginWithMfa({
          email: loginCredentials.email,
          code: loginCredentials.mfaCode,
          organization_id: organizationId,
        });
      } else {
        throw new Error('Invalid login credentials');
      }

      if (response.requires_mfa_setup) {
        if (response.temp_setup_token) {
          localStorage.setItem('mfa_setup_token', response.temp_setup_token);
        }
        setIsLoading(false);
        toast('MFA is required. Please set up 2FA first.', { icon: '🔐' });
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
          { id: response.organization.id, name: response.organization.name || '', slug: response.organization.slug || '' },
        );
        toast.success('Login successful!');
        await new Promise(resolve => setTimeout(resolve, 100));
        navigate('/');
      }
    } catch (error: any) {
      let errorMessage = error.response?.data?.message || 'Login failed';
      
      // Handle axios default error messages
      if (errorMessage.includes('Request failed with status code')) {
        const statusMatch = errorMessage.match(/status code (\d+)/i);
        const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : null;
        if (statusCode === 401) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else {
          errorMessage = 'Login failed. Please try again.';
        }
      }
      
      // Remove any technical error codes
      errorMessage = errorMessage.replace(/\b(40[0-9]|500|50[0-9])\b/g, '').trim();
      errorMessage = errorMessage.replace(/Request failed with status code\s*\d*/gi, '').trim();
      errorMessage = errorMessage.replace(/\b(HTTP|Status|Error Code|Status Code)\s*:?\s*/gi, '').trim();
      
      toast.error(errorMessage || 'Login failed. Please try again.');
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
          { id: response.organization.id, name: response.organization.name || '', slug: response.organization.slug || '' },
        );
        toast.success('Login successful!');
        await new Promise(resolve => setTimeout(resolve, 100));
        navigate('/');
      }
    } catch (error: any) {
      let errorMessage = error.response?.data?.message || 'Invalid 2FA code';
      
      // Handle axios default error messages
      if (errorMessage.includes('Request failed with status code')) {
        const statusMatch = errorMessage.match(/status code (\d+)/i);
        const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : null;
        if (statusCode === 401) {
          errorMessage = 'Invalid 2FA code. Please try again.';
        } else {
          errorMessage = 'Invalid 2FA code. Please check your authenticator app.';
        }
      }
      
      // Remove any technical error codes
      errorMessage = errorMessage.replace(/\b(40[0-9]|500|50[0-9])\b/g, '').trim();
      errorMessage = errorMessage.replace(/Request failed with status code\s*\d*/gi, '').trim();
      errorMessage = errorMessage.replace(/\b(HTTP|Status|Error Code|Status Code)\s*:?\s*/gi, '').trim();
      
      toast.error(errorMessage || 'Invalid 2FA code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Organization Selection Screen
  if (requiresOrgSelection) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-md w-full z-10">
          <div className="rounded-2xl p-8 shadow-2xl border border-slate-200 dark:border-slate-700 backdrop-blur-sm bg-white/95 dark:bg-slate-800/95">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-gradient-to-br from-blue-600 to-blue-700">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Select Organization
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                You belong to multiple organizations. Please select one to continue.
              </p>
            </div>
            <div className="space-y-3">
              {availableOrganizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleOrganizationSelect(org.id)}
                  disabled={isLoading}
                  className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 transition-all hover:scale-[1.02] text-left hover:border-blue-500 dark:hover:border-blue-500"
                >
                  <div className="font-semibold text-slate-900 dark:text-white">{org.name}</div>
                  <div className="text-sm mt-1 text-slate-600 dark:text-slate-400">Role: {org.role}</div>
                </button>
              ))}
              <button
                onClick={() => {
                  setRequiresOrgSelection(false);
                  setAvailableOrganizations([]);
                  setLoginCredentials(null);
                }}
                className="w-full text-sm font-medium text-blue-600 dark:text-blue-400 transition-colors flex items-center justify-center gap-2 mt-4 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MFA Verification Screen
  if (mfaRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-md w-full z-10">
          <div className="rounded-2xl p-8 shadow-2xl border border-slate-200 dark:border-slate-700 backdrop-blur-sm bg-white/95 dark:bg-slate-800/95">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-gradient-to-br from-blue-600 to-blue-700">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Two-Factor Authentication
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleMfaVerify(); }}>
              <div>
                <label htmlFor="mfa-code" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  Verification Code
                </label>
                <div className="relative">
                  <input
                    id="mfa-code"
                    type={showMfaCode ? 'text' : 'password'}
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 pr-12 rounded-xl text-center text-2xl tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white transition-all"
                    placeholder="000000"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowMfaCode(!showMfaCode)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showMfaCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || mfaCode.length !== 6}
                className="w-full py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMfaRequired(false);
                  setTempToken(null);
                  setMfaCode('');
                }}
                className="w-full text-sm font-medium text-blue-600 dark:text-blue-400 transition-colors flex items-center justify-center gap-2 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // MFA Login Mode
  if (loginMode === 'mfa') {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-md w-full z-10">
          <div className="rounded-2xl p-8 shadow-2xl border border-slate-200 dark:border-slate-700 backdrop-blur-sm bg-white/95 dark:bg-slate-800/95">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-gradient-to-br from-blue-600 to-blue-700">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Sign in with MFA
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Enter your email and authenticator code
              </p>
            </div>
            <form 
              className="space-y-6" 
              onSubmit={(e) => { 
                e.preventDefault(); 
                handleMfaLogin(); 
              }}
            >
              <div>
                <label htmlFor="mfa-email" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="mfa-email"
                    type="email"
                    value={mfaLoginEmail}
                    onChange={(e) => setMfaLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white transition-all"
                    placeholder="you@example.com"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="mfa-code-input" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  Authenticator Code
                </label>
                <div className="relative">
                  <input
                    id="mfa-code-input"
                    type={showMfaCode ? 'text' : 'password'}
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 pr-12 rounded-xl text-center text-2xl tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white transition-all"
                    placeholder="000000"
                    autoFocus
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowMfaCode(!showMfaCode)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                    disabled={isLoading}
                  >
                    {showMfaCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !mfaLoginEmail || mfaCode.length !== 6}
                className="w-full py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginMode('email');
                  setMfaLoginEmail('');
                  setMfaCode('');
                }}
                className="w-full text-sm font-medium text-blue-600 dark:text-blue-400 transition-colors flex items-center justify-center gap-2 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Main Login Screen
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 -left-8 w-80 h-80 bg-[#5865f2]/25 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[420px] h-[420px] bg-[#5865f2]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center z-10">
        {/* Left: marketing / branding */}
        <div className="hidden lg:flex flex-col gap-8 text-white animate-fadeIn">
          <div className="inline-flex items-center gap-3 bg-[#2f3136]/80 border border-[#202225] rounded-full px-4 py-2 w-max">
            <Sparkles className="w-4 h-4 text-[#faa61a]" />
            <span className="text-xs font-medium text-[#b9bbbe]">
              Secure, customizable dashboards for your organization
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
              Welcome back to{' '}
              <span className="bg-gradient-to-r from-[#ffffff] to-[#a5b4fc] bg-clip-text text-transparent">
                Mero Jugx
              </span>
            </h1>
            <p className="text-sm text-[#b9bbbe] max-w-md">
              Access your organization workspace, manage roles, collaborate with your team, and stay on
              top of everything in one beautiful dashboard.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-[#b9bbbe]">
            <div className="bg-[#2f3136]/70 border border-[#202225] rounded-xl p-4 space-y-2">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#5865f2]/20 text-[#5865f2]">
                <Building2 className="w-4 h-4" />
              </div>
              <p className="font-semibold text-white text-sm">Organization-first</p>
              <p className="text-xs text-[#8e9297]">
                Switch between organizations and manage access with confidence.
              </p>
            </div>
            <div className="bg-[#2f3136]/70 border border-[#202225] rounded-xl p-4 space-y-2">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#23a55a]/15 text-[#23a55a]">
                <Shield className="w-4 h-4" />
              </div>
              <p className="font-semibold text-white text-sm">Secure by design</p>
              <p className="text-xs text-[#8e9297]">
                MFA, audit logs, and fine-grained permissions keep your data safe.
              </p>
            </div>
          </div>
        </div>

        {/* Right: auth card */}
        <div className="relative bg-[#2f3136]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#202225] p-8 sm:p-10 space-y-6 animate-slideUp">
          <div className="mb-2">
            <h2 className="text-2xl font-bold text-white">
              {loginMode === 'email' ? 'Sign in' : 'Enter your password'}
            </h2>
            <p className="mt-1 text-xs text-[#b9bbbe]">
              {loginMode === 'email'
                ? "Start with your work email, we'll handle the rest."
                : 'Welcome back. Enter your password to continue.'}
            </p>
          </div>
          
          {loginMode === 'email' ? (
            <form 
              className="space-y-6" 
              onSubmit={(e) => { 
                e.preventDefault(); 
                const emailInput = (e.target as HTMLFormElement).querySelector('input[type="email"]') as HTMLInputElement;
                if (emailInput) {
                  handleEmailSubmit(emailInput.value);
                }
              }}
            >
              <div>
                <label htmlFor="email-only" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="email-only"
                    type="email"
                    className="w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white transition-all"
                    placeholder="you@example.com"
                    autoFocus
                    disabled={checkingMfa}
                  />
                </div>
                {checkingMfa && (
                  <p className="mt-2 text-sm flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Loader2 className="animate-spin h-4 w-4" />
                    Checking...
                  </p>
                )}
              </div>

              <button 
                type="submit" 
                disabled={checkingMfa} 
                className="w-full py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white"
              >
                {checkingMfa ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Checking...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <input
                      id="email"
                      type="email"
                      {...register('email')}
                      defaultValue={email}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-700 border text-slate-900 dark:text-white transition-all ${
                        errors.email ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                      }`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      className={`w-full pl-10 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-700 border text-slate-900 dark:text-white transition-all ${
                        errors.password ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link 
                  to="/forgot-password" 
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 transition-colors hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Forgot password?
                </Link>
              </div>

              <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>

              {loginMode === 'password' && (
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('email');
                    setEmail('');
                  }}
                  className="w-full text-sm font-medium text-blue-600 dark:text-blue-400 transition-colors flex items-center justify-center gap-2 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
            </form>
          )}

          <div className="pt-4 border-t border-[#202225] mt-6 text-center">
            <p className="text-sm text-[#b9bbbe]">
              Don't have an account?{' '}
              <a 
                href="/register" 
                className="font-semibold text-[#5865f2] hover:text-[#4752c4] transition-colors"
              >
                Register organization
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
