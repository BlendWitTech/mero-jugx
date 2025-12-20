import { useState } from 'react';
import { X, Lock, Shield, Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { setAppSession } from '../services/appSessionService';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#2f3136] rounded-lg p-6 w-full max-w-md border border-[#202225] shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#5865f2] rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Authenticate to Open App</h2>
              <p className="text-sm text-[#8e9297]">{appName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8e9297] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-[#36393f] rounded-lg border border-[#202225]">
          <p className="text-sm text-[#b9bbbe]">
            <span className="font-medium text-white">{userEmail}</span>
          </p>
        </div>

        {hasMfa && (
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setUseMfa(true)}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                useMfa
                  ? 'bg-[#5865f2] text-white'
                  : 'bg-[#36393f] text-[#b9bbbe] hover:bg-[#40444b]'
              }`}
            >
              MFA Code
            </button>
            <button
              onClick={() => setUseMfa(false)}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                !useMfa
                  ? 'bg-[#5865f2] text-white'
                  : 'bg-[#36393f] text-[#b9bbbe] hover:bg-[#40444b]'
              }`}
            >
              Password
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {useMfa && hasMfa ? (
            <div>
              <label htmlFor="mfa_code" className="block text-sm font-medium text-[#b9bbbe] mb-2">
                MFA Code (from Google Authenticator)
              </label>
              <div className="relative">
                <input
                  id="mfa_code"
                  type={showMfaCode ? 'text' : 'password'}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-2 pr-12 bg-[#36393f] border border-[#202225] rounded-lg text-white placeholder-[#72767d] focus:outline-none focus:ring-2 focus:ring-[#5865f2] text-center text-2xl tracking-widest"
                  maxLength={6}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowMfaCode(!showMfaCode)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#72767d] hover:text-[#b9bbbe] transition-colors"
                  tabIndex={-1}
                >
                  {showMfaCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#b9bbbe] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2 pr-12 bg-[#36393f] border border-[#202225] rounded-lg text-white placeholder-[#72767d] focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#72767d] hover:text-[#b9bbbe] transition-colors"
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
              className="px-4 py-2 bg-[#36393f] text-white rounded-lg hover:bg-[#40444b] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={authMutation.isPending}
              className="px-4 py-2 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

