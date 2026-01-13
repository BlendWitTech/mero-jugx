import { useState } from 'react';
import { X, Lock, Shield, Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from '@shared/hooks/useToast';
import { setAppSession } from '../services/appSessionService';
import { useTheme } from '../contexts/ThemeContext';

interface AppAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
  appName: string;
  hasMfa: boolean;
  userEmail: string;
  appId?: number;
}

export default function AppAuthModal({
  isOpen,
  onClose,
  onSuccess,
  appName,
  hasMfa,
  userEmail,
  appId,
}: AppAuthModalProps) {
  const { theme } = useTheme();
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
      onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div 
        className="rounded-lg p-6 w-full max-w-md border shadow-xl"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary }}>
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: theme.colors.text }}>Authenticate to Open App</h2>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>{appName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: theme.colors.textSecondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme.colors.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme.colors.textSecondary;
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div 
          className="mb-4 p-3 rounded-lg border"
          style={{
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
          }}
        >
          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
            <span className="font-medium" style={{ color: theme.colors.text }}>{userEmail}</span>
          </p>
        </div>

        {hasMfa && (
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setUseMfa(true)}
              className="flex-1 px-4 py-2 rounded-lg transition-colors"
              style={useMfa ? {
                backgroundColor: theme.colors.primary,
                color: '#ffffff',
              } : {
                backgroundColor: theme.colors.background,
                color: theme.colors.textSecondary,
                border: `1px solid ${theme.colors.border}`,
              }}
              onMouseEnter={(e) => {
                if (!useMfa) {
                  e.currentTarget.style.backgroundColor = theme.colors.surface;
                }
              }}
              onMouseLeave={(e) => {
                if (!useMfa) {
                  e.currentTarget.style.backgroundColor = theme.colors.background;
                }
              }}
            >
              MFA Code
            </button>
            <button
              onClick={() => setUseMfa(false)}
              className="flex-1 px-4 py-2 rounded-lg transition-colors"
              style={!useMfa ? {
                backgroundColor: theme.colors.primary,
                color: '#ffffff',
              } : {
                backgroundColor: theme.colors.background,
                color: theme.colors.textSecondary,
                border: `1px solid ${theme.colors.border}`,
              }}
              onMouseEnter={(e) => {
                if (useMfa) {
                  e.currentTarget.style.backgroundColor = theme.colors.surface;
                }
              }}
              onMouseLeave={(e) => {
                if (useMfa) {
                  e.currentTarget.style.backgroundColor = theme.colors.background;
                }
              }}
            >
              Password
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {useMfa && hasMfa ? (
            <div>
              <label htmlFor="mfa_code" className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                MFA Code (from Google Authenticator)
              </label>
              <div className="relative">
                <input
                  id="mfa_code"
                  type={showMfaCode ? 'text' : 'password'}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-2 pr-12 rounded-lg focus:outline-none focus:ring-2 text-center text-2xl tracking-widest"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.colors.primary}33`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  maxLength={6}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowMfaCode(!showMfaCode)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors"
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
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2 pr-12 rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.colors.primary}33`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors"
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
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.surface;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.background;
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={authMutation.isPending}
              className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{
                backgroundColor: theme.colors.primary,
                color: '#ffffff',
              }}
              onMouseEnter={(e) => {
                if (!authMutation.isPending) {
                  e.currentTarget.style.backgroundColor = theme.colors.secondary;
                }
              }}
              onMouseLeave={(e) => {
                if (!authMutation.isPending) {
                  e.currentTarget.style.backgroundColor = theme.colors.primary;
                }
              }}
            >
              <Lock className="h-4 w-4" />
              {authMutation.isPending ? 'Authenticating...' : 'Authenticate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

