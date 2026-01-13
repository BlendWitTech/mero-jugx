import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import toast from '@shared/hooks/useToast';
import { Loader2, Mail, Sparkles, Shield, Building2, User, Lock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
// Import shared components
import { Button, Input } from '@shared';

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
            ? `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.surface} 50%, ${theme.colors.background} 100%)`
            : `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 50%, ${theme.colors.surface} 100%)`
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute -top-16 -left-8 w-80 h-80 rounded-full blur-3xl" 
            style={{ backgroundColor: `${theme.colors.primary}40` }}
          />
          <div 
            className="absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full blur-3xl" 
            style={{ backgroundColor: `${theme.colors.primary}1A` }}
          />
        </div>
        <div 
          className="relative backdrop-blur-md rounded-2xl shadow-2xl border p-8 sm:p-10 text-center z-10"
          style={{ 
            backgroundColor: `${theme.colors.surface}F2`,
            borderColor: theme.colors.border,
          }}
        >
          <Loader2 
            className="animate-spin h-12 w-12 mx-auto mb-4" 
            style={{ color: theme.colors.primary }}
          />
          <p style={{ color: theme.colors.textSecondary }}>Loading invitation...</p>
        </div>
      </div>
    );
  }

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
          className="absolute -top-16 -left-8 w-80 h-80 rounded-full blur-3xl" 
          style={{ backgroundColor: `${theme.colors.primary}40` }}
        />
        <div 
          className="absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full blur-3xl" 
          style={{ backgroundColor: `${theme.colors.primary}1A` }}
        />
      </div>

      <div className="relative max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center z-10">
        {/* Left: marketing / branding */}
        <div className="hidden lg:flex flex-col gap-8 animate-fadeIn" style={{ color: theme.colors.text }}>
          <div 
            className="inline-flex items-center gap-3 rounded-full px-4 py-2 w-max border"
            style={{ 
              backgroundColor: `${theme.colors.surface}CC`,
              borderColor: theme.colors.border,
            }}
          >
            <Sparkles className="w-4 h-4" style={{ color: '#faa61a' }} />
            <span className="text-xs font-medium" style={{ color: theme.colors.textSecondary }}>
              Join your team's workspace
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight" style={{ color: theme.colors.text }}>
              Accept your{' '}
              <span 
                className="bg-clip-text text-transparent"
                style={{ 
                  backgroundImage: `linear-gradient(to right, ${theme.colors.text}, ${theme.colors.primary})`
                }}
              >
                Invitation
              </span>
            </h1>
            <p className="text-sm max-w-md" style={{ color: theme.colors.textSecondary }}>
              You've been invited to join <span className="font-semibold" style={{ color: theme.colors.text }}>{invitation?.organization?.name}</span>.
              Complete your account setup to get started.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm" style={{ color: theme.colors.textSecondary }}>
            <div 
              className="rounded-xl p-4 space-y-2 border"
              style={{ 
                backgroundColor: `${theme.colors.surface}B3`,
                borderColor: theme.colors.border,
              }}
            >
              <div 
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg"
                style={{ backgroundColor: `${theme.colors.primary}33`, color: theme.colors.primary }}
              >
                <Building2 className="w-4 h-4" />
              </div>
              <p className="font-semibold text-sm" style={{ color: theme.colors.text }}>Team Collaboration</p>
              <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                Join your organization and start collaborating with your team.
              </p>
            </div>
            <div 
              className="rounded-xl p-4 space-y-2 border"
              style={{ 
                backgroundColor: `${theme.colors.surface}B3`,
                borderColor: theme.colors.border,
              }}
            >
              <div 
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg"
                style={{ backgroundColor: '#23a55a26', color: '#23a55a' }}
              >
                <Shield className="w-4 h-4" />
              </div>
              <p className="font-semibold text-sm" style={{ color: theme.colors.text }}>Secure Access</p>
              <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                Your invitation is secure and verified by your organization.
              </p>
            </div>
          </div>
        </div>

        {/* Right: invitation card */}
        <div 
          className="relative backdrop-blur-md rounded-2xl shadow-2xl border p-8 sm:p-10 space-y-6 animate-slideUp"
          style={{ 
            backgroundColor: `${theme.colors.surface}F2`,
            borderColor: theme.colors.border,
          }}
        >
          <div className="mb-2">
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
                  color: '#ffffff'
                }}
              >
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>Accept Invitation</h2>
                <p className="mt-1 text-xs" style={{ color: theme.colors.textSecondary }}>
                  You've been invited to join {invitation?.organization?.name}
                </p>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {isNewUser ? (
              <div className="space-y-4">
                <Input
                  label={
                    <>
                      First Name <span style={{ color: '#ef4444' }}>*</span>
                    </>
                  }
                  id="first_name"
                  type="text"
                  {...register('first_name', { required: 'First name is required' })}
                  placeholder="John"
                  leftIcon={<User className="w-5 h-5" />}
                  error={errors.first_name?.message}
                  fullWidth
                />

                <Input
                  label={
                    <>
                      Last Name <span style={{ color: '#ef4444' }}>*</span>
                    </>
                  }
                  id="last_name"
                  type="text"
                  {...register('last_name', { required: 'Last name is required' })}
                  placeholder="Doe"
                  leftIcon={<User className="w-5 h-5" />}
                  error={errors.last_name?.message}
                  fullWidth
                />

                <Input
                  label={
                    <>
                      Password <span style={{ color: '#ef4444' }}>*</span>
                    </>
                  }
                  id="password"
                  type="password"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    }
                  })}
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-5 h-5" />}
                  error={errors.password?.message}
                  fullWidth
                />
              </div>
            ) : (
              <div 
                className="rounded-lg p-4 border"
                style={{ 
                  backgroundColor: `${theme.colors.surface}80`,
                  borderColor: `${theme.colors.primary}4D`,
                }}
              >
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  You already have an account. Click the button below to accept this invitation.
                </p>
              </div>
            )}

            <div>
              <Button 
                type="submit" 
                disabled={isLoading} 
                variant="primary"
                fullWidth
                isLoading={isLoading}
              >
                Accept Invitation
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

