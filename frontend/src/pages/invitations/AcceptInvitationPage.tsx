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
      await api.post(`/invitations/accept/${token}`, payload);
      toast.success(isNewUser ? 'Account created and invitation accepted! Please log in.' : 'Invitation accepted! Please log in.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md w-full text-center">
          <Loader2 className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="card">
          <div className="text-center">
            <Mail className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h2 className="text-3xl font-extrabold text-gray-900">Accept Invitation</h2>
            <p className="mt-2 text-sm text-gray-600">
              You've been invited to join {invitation?.organization?.name}
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {isNewUser ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    {...register('first_name', { required: 'First name is required' })}
                    className="input mt-1"
                    placeholder="John"
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    {...register('last_name', { required: 'Last name is required' })}
                    className="input mt-1"
                    placeholder="Doe"
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
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
                    className="input mt-1"
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  You already have an account. Click the button below to accept this invitation.
                </p>
              </div>
            )}

            <div>
              <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
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

