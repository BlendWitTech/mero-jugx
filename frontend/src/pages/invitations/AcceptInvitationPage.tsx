import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Loader2, Mail } from 'lucide-react';

interface AcceptInvitationFormData {
  password: string;
  first_name: string;
  last_name: string;
}

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
      <div className="min-h-screen flex items-center justify-center bg-[#36393f]">
        <div className="card max-w-md w-full text-center bg-[#2f3136] border-[#202225]">
          <Loader2 className="animate-spin h-12 w-12 text-[#5865f2] mx-auto mb-4" />
          <p className="text-[#b9bbbe]">Loading invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#36393f] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="card bg-[#2f3136] border-[#202225]">
          <div className="text-center">
            <Mail className="h-12 w-12 text-[#5865f2] mx-auto mb-4" />
            <h2 className="text-3xl font-extrabold text-white">Accept Invitation</h2>
            <p className="mt-2 text-sm text-[#b9bbbe]">
              You've been invited to join {invitation?.organization?.name}
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {isNewUser ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-white">
                    First Name <span className="text-[#ed4245]">*</span>
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    {...register('first_name', { required: 'First name is required' })}
                    className="input mt-1 bg-[#202225] border-[#202225] text-white placeholder-[#8e9297] focus:ring-[#5865f2]"
                    placeholder="John"
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-[#ed4245]">{errors.first_name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-white">
                    Last Name <span className="text-[#ed4245]">*</span>
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    {...register('last_name', { required: 'Last name is required' })}
                    className="input mt-1 bg-[#202225] border-[#202225] text-white placeholder-[#8e9297] focus:ring-[#5865f2]"
                    placeholder="Doe"
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-[#ed4245]">{errors.last_name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white">
                    Password <span className="text-[#ed4245]">*</span>
                  </label>
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
                    className="input mt-1 bg-[#202225] border-[#202225] text-white placeholder-[#8e9297] focus:ring-[#5865f2]"
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-[#ed4245]">{errors.password.message}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#36393f] border border-[#5865f2] rounded-lg p-4">
                <p className="text-sm text-[#b9bbbe]">
                  You already have an account. Click the button below to accept this invitation.
                </p>
              </div>
            )}

            <div>
              <button type="submit" disabled={isLoading} className="btn btn-primary w-full bg-[#5865f2] hover:bg-[#4752c4] text-white">
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
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

