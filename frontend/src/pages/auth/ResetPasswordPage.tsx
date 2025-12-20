import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import { Loader2, Lock, Sparkles, Shield, XCircle, AlertCircle } from 'lucide-react';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  // Decode the token from URL (in case it was URL encoded)
  const tokenParam = searchParams.get('token');
  const token = tokenParam ? decodeURIComponent(tokenParam) : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[Reset Password] Submitting token:', token.substring(0, 10), '... (length:', token.length, ')');
      await authService.resetPassword(token, data.password);
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (error: any) {
      console.error('[Reset Password] Error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Password reset failed';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -left-8 w-80 h-80 bg-[#ed4245]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[420px] h-[420px] bg-[#5865f2]/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center z-10">
          {/* Left: marketing / branding */}
          <div className="hidden lg:flex flex-col gap-8 text-white animate-fadeIn">
            <div className="inline-flex items-center gap-3 bg-[#2f3136]/80 border border-[#202225] rounded-full px-4 py-2 w-max">
              <AlertCircle className="w-4 h-4 text-[#faa61a]" />
              <span className="text-xs font-medium text-[#b9bbbe]">
                Password reset link issue
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
                Invalid{' '}
                <span className="bg-gradient-to-r from-[#ffffff] to-[#fc8181] bg-clip-text text-transparent">
                  Reset Link
                </span>
              </h1>
              <p className="text-sm text-[#b9bbbe] max-w-md">
                The password reset link you're trying to use is missing or has expired. 
                Please request a new password reset link from the login page.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-[#b9bbbe]">
              <div className="bg-[#2f3136]/70 border border-[#202225] rounded-xl p-4 space-y-2">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#ed4245]/20 text-[#ed4245]">
                  <XCircle className="w-4 h-4" />
                </div>
                <p className="font-semibold text-white text-sm">Link Expired</p>
                <p className="text-xs text-[#8e9297]">
                  Reset links expire after a set time for security reasons.
                </p>
              </div>
              <div className="bg-[#2f3136]/70 border border-[#202225] rounded-xl p-4 space-y-2">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#5865f2]/20 text-[#5865f2]">
                  <Lock className="w-4 h-4" />
                </div>
                <p className="font-semibold text-white text-sm">Request New Link</p>
                <p className="text-xs text-[#8e9297]">
                  You can request a new password reset link from the login page.
                </p>
              </div>
            </div>
          </div>

          {/* Right: error card */}
          <div className="relative bg-[#2f3136]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#202225] p-8 sm:p-10 space-y-6 animate-slideUp text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
                   style={{ background: `linear-gradient(135deg, #ed424520 0%, #dc262620 100%)` }}>
                <XCircle className="h-12 w-12 text-[#ed4245]" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Invalid Token</h2>
            <p className="text-[#b9bbbe] mb-6">The reset token is missing or invalid.</p>
            <div className="bg-[#ed4245]/10 border border-[#ed4245]/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-[#ed4245]">
                ⚠️ This password reset link is invalid or has expired. Please request a new one from the login page.
              </p>
            </div>
            <button 
              onClick={() => navigate('/login')} 
              className="w-full py-3 rounded-xl font-semibold transition-all bg-[#5865f2] hover:bg-[#4752c4] text-white"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              Secure password reset for your account
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
              Reset your{' '}
              <span className="bg-gradient-to-r from-[#ffffff] to-[#a5b4fc] bg-clip-text text-transparent">
                Password
              </span>
            </h1>
            <p className="text-sm text-[#b9bbbe] max-w-md">
              Create a strong, secure password to protect your account and keep your workspace safe.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-[#b9bbbe]">
            <div className="bg-[#2f3136]/70 border border-[#202225] rounded-xl p-4 space-y-2">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#5865f2]/20 text-[#5865f2]">
                <Lock className="w-4 h-4" />
              </div>
              <p className="font-semibold text-white text-sm">Secure Reset</p>
              <p className="text-xs text-[#8e9297]">
                Your password reset link is time-limited and single-use for security.
              </p>
            </div>
            <div className="bg-[#2f3136]/70 border border-[#202225] rounded-xl p-4 space-y-2">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#23a55a]/15 text-[#23a55a]">
                <Shield className="w-4 h-4" />
              </div>
              <p className="font-semibold text-white text-sm">Best Practices</p>
              <p className="text-xs text-[#8e9297]">
                Use a unique password with at least 8 characters for better security.
              </p>
            </div>
          </div>
        </div>

        {/* Right: reset password card */}
        <div className="relative bg-[#2f3136]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#202225] p-8 sm:p-10 space-y-6 animate-slideUp">
          <div className="mb-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#5865f2] to-[#4752c4]">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Reset Password</h2>
                <p className="mt-1 text-xs text-[#b9bbbe]">
                  Enter your new password below
                </p>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="password"
                    type="password"
                    {...register('password')}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-700 border text-slate-900 dark:text-white transition-all ${
                      errors.password ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                    }`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-700 border text-slate-900 dark:text-white transition-all ${
                      errors.confirmPassword ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                    }`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div>
              <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

