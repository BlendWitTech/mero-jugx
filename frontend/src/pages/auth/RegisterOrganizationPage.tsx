import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import { Loader2, Building2, Mail, User, Lock, Phone, ArrowLeft, Sparkles, Shield } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  owner_email: z.string().email('Invalid email address'),
  owner_password: z.string().min(8, 'Password must be at least 8 characters'),
  owner_first_name: z.string().min(2, 'First name is required'),
  owner_last_name: z.string().min(2, 'Last name is required'),
  owner_phone: z.string().optional(),
  is_existing_user: z.boolean().default(false),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterOrganizationPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      is_existing_user: false,
    },
  });

  const isExistingUser = watch('is_existing_user');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await authService.registerOrganization({
        name: data.name,
        email: data.email,
        owner_email: data.owner_email,
        owner_password: data.owner_password,
        owner_first_name: data.owner_first_name,
        owner_last_name: data.owner_last_name,
        is_existing_user: data.is_existing_user,
      });

      toast.success('Organization registered successfully! Please check your email to verify your account.');
      navigate('/login', {
        state: { organization_id: response.organization_id },
      });
    } catch (error: any) {
      // Extract error message from response
      const errorMessage = error.response?.data?.message || error.message || '';
      const status = error.response?.status;

      // Provide user-friendly error messages based on the error
      let userFriendlyMessage = 'Registration failed. Please try again.';

      if (status === 409) {
        // Conflict errors - provide specific messages
        if (errorMessage.includes('Organization name already exists') || 
            errorMessage.includes('Organization name is already taken')) {
          userFriendlyMessage = 'This organization name is already taken. Please choose a different name.';
        } else if (errorMessage.includes('organization email') || 
                   errorMessage.includes('email address is already used as an organization email')) {
          userFriendlyMessage = 'This email address is already registered as an organization email. Please use a different email address for your organization.';
        } else if (errorMessage.includes('User with this email already exists')) {
          userFriendlyMessage = 'An account with this email address already exists. If you already have an account, please check the "I\'m already a user" option and try again.';
        } else if (errorMessage.includes('already have an organization with email')) {
          userFriendlyMessage = 'You already have an organization registered with this email address. Each email can only be used for one organization.';
        } else if (errorMessage) {
          // Use the backend message if it's descriptive
          userFriendlyMessage = errorMessage;
        } else {
          userFriendlyMessage = 'This information is already in use. Please check your organization name, email, or owner email and try again.';
        }
      } else if (status === 400) {
        // Bad request errors
        if (errorMessage.includes('required') || errorMessage.includes('must be')) {
          userFriendlyMessage = errorMessage || 'Please fill in all required fields correctly.';
        } else {
          userFriendlyMessage = errorMessage || 'Invalid information provided. Please check your details and try again.';
        }
      } else if (status === 422) {
        // Validation errors
        userFriendlyMessage = errorMessage || 'Please check your information and ensure all fields are filled correctly.';
      } else if (status === 500 || status >= 500) {
        userFriendlyMessage = 'A server error occurred. Please try again later or contact support if the problem persists.';
      } else if (errorMessage) {
        // Use the backend message if available
        userFriendlyMessage = errorMessage;
      }

      toast.error(userFriendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 -left-10 w-80 h-80 bg-[#5865f2]/25 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[420px] h-[420px] bg-[#5865f2]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center z-10">
        {/* Left: narrative / selling points */}
        <div className="hidden lg:flex flex-col gap-8 text-white animate-fadeIn">
          <div className="inline-flex items-center gap-3 bg-[#2f3136]/80 border border-[#202225] rounded-full px-4 py-2 w-max">
            <Sparkles className="w-4 h-4 text-[#faa61a]" />
            <span className="text-xs font-medium text-[#b9bbbe]">
              Spin up a secure organization workspace in minutes
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
              Create your{' '}
              <span className="bg-gradient-to-r from-[#ffffff] to-[#a5b4fc] bg-clip-text text-transparent">
                Mero Jugx
              </span>{' '}
              workspace
            </h1>
            <p className="text-sm text-[#b9bbbe] max-w-md">
              Bring your team into a unified hub for roles, permissions, communication, and billing –
              all tailored for modern SaaS organizations.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-[#b9bbbe]">
            <div className="bg-[#2f3136]/70 border border-[#202225] rounded-xl p-4 space-y-2">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#5865f2]/20 text-[#5865f2]">
                <Building2 className="w-4 h-4" />
              </div>
              <p className="font-semibold text-white text-sm">Organization-centric</p>
              <p className="text-xs text-[#8e9297]">
                Structure your users, roles, and apps around how your business actually works.
              </p>
            </div>
            <div className="bg-[#2f3136]/70 border border-[#202225] rounded-xl p-4 space-y-2">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#23a55a]/15 text-[#23a55a]">
                <Shield className="w-4 h-4" />
              </div>
              <p className="font-semibold text-white text-sm">Secure onboarding</p>
              <p className="text-xs text-[#8e9297]">
                MFA-ready accounts, audit logs, and permission templates built-in.
              </p>
            </div>
          </div>
        </div>

        {/* Right: registration card */}
        <div className="relative bg-[#2f3136]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#202225] p-8 sm:p-10 space-y-6 animate-slideUp">
          <div className="mb-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#5865f2] to-[#4752c4]">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Register your organization</h2>
                <p className="mt-1 text-xs text-[#b9bbbe]">
                  Set up the primary owner and workspace details.
                </p>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Organization Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  Organization Details
                </span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  Organization Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="name"
                    type="text"
                    {...register('name')}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-700 border text-slate-900 dark:text-white transition-all ${
                      errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                    }`}
                    placeholder="Acme Corporation"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-[#ed4245]">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Organization Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <input
                      id="email"
                      type="email"
                      {...register('email')}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-700 border text-slate-900 dark:text-white transition-all ${
                        errors.email ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                      }`}
                      placeholder="contact@acme.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-[#ed4245]">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="owner_phone" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <input
                      id="owner_phone"
                      type="tel"
                      {...register('owner_phone')}
                      className="w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white transition-all"
                      placeholder="+977 98XXXXXXXX"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Owner Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 my-4">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  Owner Details
                </span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
              </div>

              <div>
                <label htmlFor="owner_email" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  Owner Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="owner_email"
                    type="email"
                    {...register('owner_email')}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-700 border text-slate-900 dark:text-white transition-all ${
                      errors.owner_email ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                    }`}
                    placeholder="owner@example.com"
                  />
                </div>
                {errors.owner_email && (
                  <p className="mt-1 text-sm text-[#ed4245]">{errors.owner_email.message}</p>
                )}
              </div>

              {!isExistingUser && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="owner_first_name" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                      First Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                      <input
                        id="owner_first_name"
                        type="text"
                        {...register('owner_first_name')}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-700 border text-slate-900 dark:text-white transition-all ${
                          errors.owner_first_name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                        }`}
                        placeholder="John"
                      />
                    </div>
                    {errors.owner_first_name && (
                      <p className="mt-1 text-sm text-[#ed4245]">{errors.owner_first_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="owner_last_name" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                      Last Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                      <input
                        id="owner_last_name"
                        type="text"
                        {...register('owner_last_name')}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-700 border text-slate-900 dark:text-white transition-all ${
                          errors.owner_last_name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                        }`}
                        placeholder="Doe"
                      />
                    </div>
                    {errors.owner_last_name && (
                      <p className="mt-1 text-sm text-[#ed4245]">{errors.owner_last_name.message}</p>
                    )}
                  </div>
                </div>
              )}

              {!isExistingUser && (
                <div>
                  <label htmlFor="owner_password" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Owner Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <input
                      id="owner_password"
                      type="password"
                      {...register('owner_password')}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-700 border text-slate-900 dark:text-white transition-all ${
                        errors.owner_password ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                      }`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.owner_password && (
                    <p className="mt-1 text-sm text-red-500">{errors.owner_password.message}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    This account will be the initial owner and can invite more admins later.
                  </p>
                </div>
              )}

              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('is_existing_user')}
                    className="mt-1 rounded border-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 accent-blue-600 transition-all"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    I'm already a user and want to attach this organization to my existing account
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Registering...
                  </>
                ) : (
                  'Create Organization'
                )}
              </button>
              <p className="text-xs text-center text-slate-600 dark:text-slate-400">
                By creating an organization, you confirm you have permission to represent it.
              </p>
            </div>

            <div className="pt-4 border-t border-[#202225] mt-4 text-center">
              <p className="text-sm text-[#b9bbbe]">
                Already have an account?{' '}
                <a 
                  href="/login" 
                  className="font-semibold text-[#5865f2] hover:text-[#4752c4] transition-colors"
                >
                  Sign in
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
