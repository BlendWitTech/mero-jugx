import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from '@shared/hooks/useToast';
import { Loader2, Mail, Lock, Shield, Eye, EyeOff } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, CardDescription } from '@shared';
import { useTheme } from '../../contexts/ThemeContext';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function SystemAdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, accessToken, user, _hasHydrated } = useAuthStore();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already authenticated as system admin
  useEffect(() => {
    if (!_hasHydrated) return;

    if (isAuthenticated && accessToken && user?.is_system_admin) {
      // Check for return URL
      const urlParams = new URLSearchParams(location.search);
      const returnUrl = urlParams.get('returnUrl');

      if (returnUrl) {
        try {
          const decodedUrl = decodeURIComponent(returnUrl);
          navigate(decodedUrl, { replace: true });
          return;
        } catch (error) {
          console.error('Error parsing returnUrl:', error);
        }
      }

      // Redirect to system admin dashboard
      navigate('/app/system-admin', { replace: true });
    }
  }, [isAuthenticated, accessToken, user, _hasHydrated, navigate, location]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      // Use system admin login endpoint
      const response = await api.post('/auth/system-admin/login', {
        email: data.email,
        password: data.password,
      });

      const responseData = response.data;
      
      // Check if user is system admin
      if (responseData.user && responseData.user.is_system_admin) {
        // Set auth state
        setAuth(
          {
            access_token: responseData.access_token,
            refresh_token: responseData.refresh_token,
          },
          responseData.user,
          null, // System admins don't belong to organizations
        );

        // Check for return URL
        const urlParams = new URLSearchParams(location.search);
        const returnUrl = urlParams.get('returnUrl');

        if (returnUrl) {
          try {
            const decodedUrl = decodeURIComponent(returnUrl);
            navigate(decodedUrl, { replace: true });
            return;
          } catch (error) {
            console.error('Error parsing returnUrl:', error);
          }
        }

        // Redirect to system admin dashboard
        toast.success('Welcome back, System Administrator!');
        navigate('/app/system-admin', { replace: true });
      } else {
        toast.error('Access denied. System administrator credentials required.');
        setIsLoading(false);
      }
    } catch (error: any) {
      let errorMessage = 'Login failed. Please check your credentials.';

      if (error?.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.colors.primary }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: theme.colors.background }}>
      <div className="w-full max-w-md">
        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.colors.primary, color: theme.colors.surface || 'white' }}
              >
                <Shield className="w-8 h-8" />
              </div>
            </div>
            <CardTitle className="text-2xl" style={{ color: theme.colors.text }}>
              System Admin Login
            </CardTitle>
            <CardDescription style={{ color: theme.colors.textSecondary }}>
              Sign in to access the system administration panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                id="email"
                type="email"
                {...register('email')}
                placeholder="superadmin@merojugx.com"
                leftIcon={<Mail className="h-5 w-5" style={{ color: theme.colors.textSecondary }} />}
                error={errors.email?.message}
                fullWidth
                style={{
                  backgroundColor: theme.colors.background,
                  borderColor: errors.email ? theme.colors.error : theme.colors.border,
                  color: theme.colors.text,
                }}
              />

              <Input
                label="Password"
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Enter your password"
                leftIcon={<Lock className="h-5 w-5" style={{ color: theme.colors.textSecondary }} />}
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
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
                error={errors.password?.message}
                fullWidth
                style={{
                  backgroundColor: theme.colors.background,
                  borderColor: errors.password ? theme.colors.error : theme.colors.border,
                  color: theme.colors.text,
                }}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
                style={{
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.surface || 'white',
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                System administrator access only. Contact your system administrator for access.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

