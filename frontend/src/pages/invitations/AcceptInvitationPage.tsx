import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Loader2, Mail, Sparkles, Shield, Building2, User, Lock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface AcceptInvitationFormData {
  password: string;
  first_name: string;
  last_name: string;
}

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(true);
  const [isNewUser, setIsNewUser] = useState(true);
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInvitationFormData>();

  useEffect(() => {
    if (!token) {
      toast.error('Invalid invitation token');
      navigate('/login');
      return;
    }

    api
      .get(`/invitations/token/${token}`)
      .then((response) => {
        setInvitation(response.data);
        // Determine if this is a new user invitation (user_id is null means new user)
        setIsNewUser(!response.data.user_id);
      })
      .catch(() => {
        toast.error('Invalid or expired invitation');
        navigate('/login');
      })
      .finally(() => {
        setLoadingInvitation(false);
      });
  }, [token, navigate]);

  const onSubmit = async (data: AcceptInvitationFormData) => {
    if (!token) return;

    setIsLoading(true);
    try {
      // For existing users, we don't need to send password/name fields
      const payload = isNewUser ? data : {};
      const response = await api.post(`/invitations/accept/${token}`, payload);
      
      // Show success message
      const message = isNewUser 
        ? 'Account created and invitation accepted! Please log in.' 
        : response.data?.message || 'Invitation accepted! Your access has been reactivated. Please log in.';
      toast.success(message);
      
      // Navigate to login page after a short delay to ensure the toast is visible
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to accept invitation');
      setIsLoading(false);
    }
  };

  if (loadingInvitation) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        style={{ 
          background: isDark 
            ? 'linear-gradient(135deg, #1a1c20 0%, #2f3136 50%, #36393f 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)'
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -left-8 w-80 h-80 bg-[#5865f2]/25 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[420px] h-[420px] bg-[#5865f2]/10 rounded-full blur-3xl" />
        </div>
        <div className="relative bg-[#2f3136]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#202225] p-8 sm:p-10 text-center z-10">
          <Loader2 className="animate-spin h-12 w-12 text-[#5865f2] mx-auto mb-4" />
          <p className="text-[#b9bbbe]">Loading invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ 
        background: isDark 
          ? 'linear-gradient(135deg, #1a1c20 0%, #2f3136 50%, #36393f 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)'
      }}
    >
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
              Join your team's workspace
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
              Accept your{' '}
              <span className="bg-gradient-to-r from-[#ffffff] to-[#a5b4fc] bg-clip-text text-transparent">
                Invitation
              </span>
            </h1>
            <p className="text-sm text-[#b9bbbe] max-w-md">
              You've been invited to join <span className="font-semibold text-white">{invitation?.organization?.name}</span>.
              Complete your account setup to get started.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-[#b9bbbe]">
            <div className="bg-[#2f3136]/70 border border-[#202225] rounded-xl p-4 space-y-2">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#5865f2]/20 text-[#5865f2]">
                <Building2 className="w-4 h-4" />
              </div>
              <p className="font-semibold text-white text-sm">Team Collaboration</p>
              <p className="text-xs text-[#8e9297]">
                Join your organization and start collaborating with your team.
              </p>
            </div>
            <div className="bg-[#2f3136]/70 border border-[#202225] rounded-xl p-4 space-y-2">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#23a55a]/15 text-[#23a55a]">
                <Shield className="w-4 h-4" />
              </div>
              <p className="font-semibold text-white text-sm">Secure Access</p>
              <p className="text-xs text-[#8e9297]">
                Your invitation is secure and verified by your organization.
              </p>
            </div>
          </div>
        </div>

        {/* Right: invitation card */}
        <div className="relative bg-[#2f3136]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#202225] p-8 sm:p-10 space-y-6 animate-slideUp">
          <div className="mb-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#5865f2] to-[#4752c4]">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Accept Invitation</h2>
                <p className="mt-1 text-xs text-[#b9bbbe]">
                  You've been invited to join {invitation?.organization?.name}
                </p>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {isNewUser ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                    First Name <span className="text-[#ed4245]">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: theme.colors.textSecondary }} />
                    <input
                      id="first_name"
                      type="text"
                      {...register('first_name', { required: 'First name is required' })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all"
                      style={{
                        background: theme.colors.surface,
                        border: `1px solid ${errors.first_name ? '#ed4245' : theme.colors.border}`,
                        color: theme.colors.text,
                      }}
                      placeholder="John"
                    />
                  </div>
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-[#ed4245]">{errors.first_name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                    Last Name <span className="text-[#ed4245]">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: theme.colors.textSecondary }} />
                    <input
                      id="last_name"
                      type="text"
                      {...register('last_name', { required: 'Last name is required' })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all"
                      style={{
                        background: theme.colors.surface,
                        border: `1px solid ${errors.last_name ? '#ed4245' : theme.colors.border}`,
                        color: theme.colors.text,
                      }}
                      placeholder="Doe"
                    />
                  </div>
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-[#ed4245]">{errors.last_name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                    Password <span className="text-[#ed4245]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: theme.colors.textSecondary }} />
                    <input
                      id="password"
                      type="password"
                      {...register('password', { 
                        required: 'Password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters'
                        }
                      })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all"
                      style={{
                        background: theme.colors.surface,
                        border: `1px solid ${errors.password ? '#ed4245' : theme.colors.border}`,
                        color: theme.colors.text,
                      }}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-[#ed4245]">{errors.password.message}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#36393f]/50 border border-[#5865f2]/30 rounded-lg p-4">
                <p className="text-sm text-[#b9bbbe]">
                  You already have an account. Click the button below to accept this invitation.
                </p>
              </div>
            )}

            <div>
              <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                style={{
                  background: isLoading ? theme.colors.border : theme.colors.primary,
                  color: '#ffffff',
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Accepting...
                  </>
                ) : (
                  'Accept Invitation'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

