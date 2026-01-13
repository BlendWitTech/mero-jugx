import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Button, Input } from '../../ui';
import toast from '../../../hooks/useToast';

interface LockScreenProps {
  onSuccess: (token: string) => void;
  appName: string;
  hasMfa: boolean;
  userEmail: string;
  appId?: number;
  organizationName?: string;
  api: any; // API instance
  setAppSession: (appId: number, token: string) => void; // App session setter
  theme: {
    colors: {
      background: string;
      surface: string;
      border: string;
      text: string;
      textSecondary: string;
      primary: string;
      secondary?: string;
    };
  };
}

export function LockScreen({
  onSuccess,
  appName,
  hasMfa,
  userEmail,
  appId,
  organizationName,
  api,
  setAppSession,
  theme,
}: LockScreenProps) {
  const [mfaCode, setMfaCode] = useState('');
  const [password, setPassword] = useState('');
  const [useMfa, setUseMfa] = useState(hasMfa);
  const [showPassword, setShowPassword] = useState(false);
  const [showMfaCode, setShowMfaCode] = useState(false);

  const authMutation = useMutation({
    mutationFn: async (data: { password?: string; mfa_code?: string }) => {
      const response = await api.post('/marketplace/reauth', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Store app session token per app
      if (data.app_session_token && appId) {
        setAppSession(appId, data.app_session_token);
      } else if (data.app_session_token) {
        // Fallback to legacy storage if appId not provided
        localStorage.setItem('app_session_token', data.app_session_token);
      }
      onSuccess(data.app_session_token);
      setMfaCode('');
      setPassword('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Authentication failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (useMfa && hasMfa) {
      if (!mfaCode.trim()) {
        toast.error('Please enter your MFA code');
        return;
      }
      authMutation.mutate({ mfa_code: mfaCode });
    } else {
      if (!password.trim()) {
        toast.error('Please enter your password');
        return;
      }
      authMutation.mutate({ password });
    }
  };

  // Determine if dark theme (simplified check)
  const isDark = theme.colors.background === '#1a1a1a' || theme.colors.background === '#0a0a0a' || theme.colors.background.includes('#1a1a1a');

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ 
        background: isDark 
          ? `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.surface} 50%, ${theme.colors.background} 100%)`
          : `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 50%, ${theme.colors.surface} 100%)`
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse"
          style={{ backgroundColor: `${theme.colors.primary}1A` }}
        />
        <div 
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: `${theme.colors.primary}0D` }}
        />
      </div>

      <div className="relative max-w-md w-full z-10">
        <div 
          className="rounded-2xl p-8 shadow-2xl border backdrop-blur-sm"
          style={{ 
            backgroundColor: `${theme.colors.surface}F2`,
            borderColor: theme.colors.border,
          }}
        >
          <div className="text-center mb-6">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ 
                background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary || theme.colors.primary} 100%)`,
                color: '#ffffff'
              }}
            >
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
              Unlock {appName}
            </h2>
            <p className="mt-2 text-sm" style={{ color: theme.colors.textSecondary }}>
              {organizationName ? `Access ${organizationName}'s ${appName}` : `Enter your credentials to access ${appName}`}
            </p>
            {userEmail && (
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg mt-4"
                style={{ 
                  backgroundColor: `${theme.colors.background}CC`,
                  border: `1px solid ${theme.colors.border}`
                }}
              >
                <span className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  {userEmail}
                </span>
              </div>
            )}
          </div>

          {/* Auth Method Toggle */}
          {hasMfa && (
            <div
              className="mb-6 flex gap-2 p-1 rounded-lg"
              style={{ backgroundColor: `${theme.colors.background}CC` }}
            >
              <Button
                onClick={() => setUseMfa(true)}
                variant={useMfa ? 'primary' : 'ghost'}
                className="flex-1"
                size="sm"
              >
                MFA Code
              </Button>
              <Button
                onClick={() => setUseMfa(false)}
                variant={!useMfa ? 'primary' : 'ghost'}
                className="flex-1"
                size="sm"
              >
                Password
              </Button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {useMfa && hasMfa ? (
              <div>
                <Input
                  label="MFA Code (from Google Authenticator)"
                  type={showMfaCode ? 'text' : 'password'}
                  value={mfaCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  fullWidth
                  className="text-center text-2xl tracking-[0.4em] font-mono"
                  helperText="Enter the 6-digit code from your authenticator app"
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowMfaCode(!showMfaCode)}
                      style={{ color: theme.colors.textSecondary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = theme.colors.text;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = theme.colors.textSecondary;
                      }}
                      tabIndex={-1}
                    >
                      {showMfaCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                />
              </div>
            ) : (
              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoFocus
                  fullWidth
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ color: theme.colors.textSecondary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = theme.colors.text;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = theme.colors.textSecondary;
                      }}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={authMutation.isPending}
              variant="primary"
              fullWidth
              isLoading={authMutation.isPending}
              leftIcon={<Lock className="h-4 w-4" />}
            >
              Unlock
            </Button>
          </form>

          {/* Footer */}
          <p className="text-xs text-center mt-6" style={{ color: theme.colors.textSecondary }}>
            Enter your credentials to access {appName}
          </p>
        </div>
      </div>
    </div>
  );
}

