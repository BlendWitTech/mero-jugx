import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

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
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#36393f] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="bg-[#2f3136] rounded-lg shadow-xl border border-[#202225] p-8">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-white">
              Register Your Organization
            </h2>
            <p className="mt-2 text-center text-sm text-[#b9bbbe]">
              Create a new organization account
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-white mb-4">Organization Details</h3>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-[#b9bbbe]">
                  Organization Name *
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name')}
                  className="input mt-1"
                  placeholder="Acme Corporation"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-[#ed4245]">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#b9bbbe]">
                  Organization Email *
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="input mt-1"
                  placeholder="contact@acme.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-[#ed4245]">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="owner_phone" className="block text-sm font-medium text-[#b9bbbe]">
                  Phone (Optional)
                </label>
                <input
                  id="owner_phone"
                  type="tel"
                  {...register('owner_phone')}
                  className="input mt-1"
                  placeholder="+1234567890"
                />
              </div>

              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-white mb-4 mt-6">Owner Details</h3>
              </div>

              <div>
                <label htmlFor="owner_email" className="block text-sm font-medium text-[#b9bbbe]">
                  Owner Email *
                </label>
                <input
                  id="owner_email"
                  type="email"
                  {...register('owner_email')}
                  className="input mt-1"
                  placeholder="owner@example.com"
                />
                {errors.owner_email && (
                  <p className="mt-1 text-sm text-[#ed4245]">{errors.owner_email.message}</p>
                )}
              </div>

              {!isExistingUser && (
                <>
                  <div>
                    <label htmlFor="owner_first_name" className="block text-sm font-medium text-[#b9bbbe]">
                      First Name *
                    </label>
                    <input
                      id="owner_first_name"
                      type="text"
                      {...register('owner_first_name')}
                      className="input mt-1"
                      placeholder="John"
                    />
                    {errors.owner_first_name && (
                      <p className="mt-1 text-sm text-[#ed4245]">{errors.owner_first_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="owner_last_name" className="block text-sm font-medium text-[#b9bbbe]">
                      Last Name *
                    </label>
                    <input
                      id="owner_last_name"
                      type="text"
                      {...register('owner_last_name')}
                      className="input mt-1"
                      placeholder="Doe"
                    />
                    {errors.owner_last_name && (
                      <p className="mt-1 text-sm text-[#ed4245]">{errors.owner_last_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="owner_password" className="block text-sm font-medium text-[#b9bbbe]">
                      Password *
                    </label>
                    <input
                      id="owner_password"
                      type="password"
                      {...register('owner_password')}
                      className="input mt-1"
                      placeholder="••••••••"
                    />
                    {errors.owner_password && (
                      <p className="mt-1 text-sm text-[#ed4245]">{errors.owner_password.message}</p>
                    )}
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('is_existing_user')}
                    className="rounded border-[#202225] bg-[#202225] text-[#5865f2] focus:ring-[#5865f2] focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-[#b9bbbe]">
                    I am an existing user
                  </span>
                </label>
              </div>
            </div>

            <div>
              <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Registering...
                  </>
                ) : (
                  'Register Organization'
                )}
              </button>
            </div>

            <div className="text-center">
              <a href="/login" className="text-sm font-medium text-[#5865f2] hover:text-[#4752c4]">
                Already have an account? Sign in
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

