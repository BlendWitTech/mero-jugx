import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import toast from '@shared/hooks/useToast';
import { authService } from '../../services/authService';
// Import shared components
import { Button, Input } from '@shared';
import { useTheme } from '../../contexts/ThemeContext';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { theme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      console.log('[Forgot Password] Requesting reset for email:', data.email);
      await authService.forgotPassword(data.email);
      console.log('[Forgot Password] Reset email sent successfully');
      setEmailSent(true);
      toast.success('Password reset email sent! Please check your inbox.');
    } catch (error: any) {
      console.error('[Forgot Password] Error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send reset email';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center px-4"
        style={{ 
          background: isDark 
            ? `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.surface} 50%, ${theme.colors.background} 100%)`
            : `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 50%, ${theme.colors.surface} 100%)`
        }}
      >
        <div 
          className="max-w-md w-full rounded-lg shadow-xl p-8 border"
          style={{ 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          <div className="text-center">
            <div 
              className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4"
              style={{ backgroundColor: '#10b98133' }}
            >
              <svg
                className="h-6 w-6"
                style={{ color: '#10b981' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.text }}>
              Check Your Email
            </h2>
            <p className="mb-6" style={{ color: theme.colors.textSecondary }}>
              We've sent a password reset link to <strong style={{ color: theme.colors.text }}>{getValues('email')}</strong>
            </p>
            <p className="text-sm mb-6" style={{ color: theme.colors.textSecondary }}>
              Click the link in the email to reset your password. The link will expire in 1 hour.
            </p>
            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full text-center px-4 py-2 text-white font-medium rounded-lg transition-colors"
                style={{ backgroundColor: theme.colors.primary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.secondary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.primary;
                }}
              >
                Back to Login
              </Link>
              <Button
                onClick={() => {
                  setEmailSent(false);
                  onSubmit({ email: getValues('email') });
                }}
                variant="link"
                fullWidth
              >
                Resend Email
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{ 
        background: isDark 
          ? `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.surface} 50%, ${theme.colors.background} 100%)`
          : `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 50%, ${theme.colors.surface} 100%)`
      }}
    >
      <div 
        className="max-w-md w-full rounded-lg shadow-xl p-8 border"
        style={{ 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: theme.colors.text }}>
            Forgot Password?
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Email Address"
            id="email"
            type="email"
            {...register('email')}
            placeholder="you@example.com"
            disabled={isLoading}
            error={errors.email?.message}
            fullWidth
          />

          <Button
            type="submit"
            disabled={isLoading}
            variant="primary"
            fullWidth
            isLoading={isLoading}
          >
            Send Reset Link
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm font-medium transition-colors"
            style={{ color: theme.colors.primary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme.colors.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme.colors.primary;
            }}
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

