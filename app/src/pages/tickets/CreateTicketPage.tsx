import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { UnauthorizedAccess } from '../../components/UnauthorizedAccess';
import toast from '@shared/hooks/useToast';
import { Ticket, X, Save, ShoppingCart, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
// Import shared components
import { Button, Input, Card, CardHeader, CardTitle, CardContent, CardFooter } from '@shared';

const ticketSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title must be less than 255 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  tags: z.array(z.string()).optional(),
});

type TicketFormData = z.infer<typeof ticketSchema>;

export default function CreateTicketPage() {
  const { organization, _hasHydrated, isAuthenticated, accessToken } = useAuthStore();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [hasAccessError, setHasAccessError] = useState(false);
  const [hasPermissionError, setHasPermissionError] = useState(false);
  
  // Check if user has permission to create tickets
  const canCreateTicket = hasPermission('tickets.create');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      priority: 'medium',
      tags: [],
    },
  });

  // Check ticket system access and permissions
  useEffect(() => {
    const checkAccess = async () => {
      if (!_hasHydrated || !isAuthenticated || !accessToken || !organization?.id) return;
      
      // First check permission
      if (!canCreateTicket) {
        setHasPermissionError(true);
        return;
      }
      
      try {
        // Try to fetch tickets to check access
        await api.get('/tickets?limit=1');
        setHasAccessError(false);
        setHasPermissionError(false);
      } catch (err: any) {
        if (err.response?.status === 403) {
          // Check if it's a permission issue or package issue
          const errorMessage = err.response?.data?.message || '';
          if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
            setHasPermissionError(true);
          } else {
            setHasAccessError(true);
          }
        }
      }
    };
    
    checkAccess();
  }, [_hasHydrated, isAuthenticated, accessToken, organization?.id, canCreateTicket]);

  // Fetch users for assignee selection
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  const users = usersData?.users || usersData?.data || [];

  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      const response = await api.post('/tickets', data);
      return response.data;
    },
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['tickets', organization?.id] });
      toast.success('Ticket created successfully');
      navigate(`/org/${organization?.slug}/tickets/${ticket.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create ticket');
    },
  });

  const onSubmit = (data: TicketFormData) => {
    if (!canCreateTicket) {
      toast.error('You do not have permission to create tickets.');
      return;
    }
    createTicketMutation.mutate(data);
  };

  // Show 403 error if user doesn't have permission
  if (hasPermissionError || !canCreateTicket) {
    return (
      <UnauthorizedAccess
        message="You do not have permission to create tickets. Please contact your administrator to update your role permissions."
        feature="create tickets"
        onBack={() => navigate(`/org/${organization?.slug}/tickets`)}
      />
    );
  }

  if (hasAccessError) {
    return (
      <div className="w-full p-6">
        <Card className="max-w-2xl mx-auto text-center" padding="lg">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-yellow-500/20 rounded-full">
              <AlertCircle className="h-12 w-12 text-yellow-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Ticket System Not Available</h3>
          <p className="text-[#b9bbbe] mb-2">
            The ticket system is not available for your current package.
          </p>
          <p className="text-[#b9bbbe] mb-6">
            Please upgrade to Platinum or Diamond package, or purchase the Ticket System feature separately.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to={`/org/${organization?.slug}/packages`}>
              <Button variant="primary" leftIcon={<ShoppingCart className="h-5 w-5" />}>
                View Packages & Purchase
              </Button>
            </Link>
            <Button
              variant="secondary"
              onClick={() => navigate(`/org/${organization?.slug}/tickets`)}
              leftIcon={<X className="h-5 w-5" />}
            >
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#5865f2] rounded-lg">
            <Ticket className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Create New Ticket</h1>
            <p className="mt-2 text-sm sm:text-base text-[#b9bbbe]">Create a new support ticket</p>
          </div>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <Input
              label="Title *"
              id="title"
              type="text"
              {...register('title')}
              placeholder="Enter ticket title..."
              error={errors.title?.message}
              fullWidth
            />

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[#b9bbbe] mb-2">
                Description
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={6}
                className="w-full px-4 py-2 bg-[#36393f] dark:bg-gray-700 border border-[#202225] dark:border-gray-600 rounded-lg text-white dark:text-gray-100 placeholder-[#72767d] dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5865f2] resize-none"
                placeholder="Describe the issue or request..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-[#b9bbbe] mb-2">
                Priority
              </label>
              <select
                id="priority"
                {...register('priority')}
                className="w-full px-4 py-2 bg-[#36393f] dark:bg-gray-700 border border-[#202225] dark:border-gray-600 rounded-lg text-white dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/org/${organization?.slug}/tickets`)}
              leftIcon={<X className="h-4 w-4" />}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createTicketMutation.isPending}
              leftIcon={<Save className="h-4 w-4" />}
            >
              {createTicketMutation.isPending ? 'Creating...' : 'Create Ticket'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

