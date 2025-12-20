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
import toast from 'react-hot-toast';
import { Ticket, X, Save, ShoppingCart, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

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
        <div className="bg-[#2f3136] rounded-lg p-12 border border-[#202225] text-center max-w-2xl mx-auto">
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
            <Link
              to={`/org/${organization?.slug}/packages`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors font-medium"
            >
              <ShoppingCart className="h-5 w-5" />
              View Packages & Purchase
            </Link>
            <button
              onClick={() => navigate(`/org/${organization?.slug}/tickets`)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#393c43] text-[#b9bbbe] rounded-lg hover:bg-[#404249] transition-colors font-medium"
            >
              <X className="h-5 w-5" />
              Go Back
            </button>
          </div>
        </div>
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

      <form onSubmit={handleSubmit(onSubmit)} className="bg-[#2f3136] rounded-lg p-6 border border-[#202225]">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-[#b9bbbe] mb-2">
              Title *
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className="w-full px-4 py-2 bg-[#36393f] border border-[#202225] rounded-lg text-white placeholder-[#72767d] focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
              placeholder="Enter ticket title..."
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[#b9bbbe] mb-2">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={6}
              className="w-full px-4 py-2 bg-[#36393f] border border-[#202225] rounded-lg text-white placeholder-[#72767d] focus:outline-none focus:ring-2 focus:ring-[#5865f2] resize-none"
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
              className="w-full px-4 py-2 bg-[#36393f] border border-[#202225] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-[#202225]">
          <button
            type="button"
            onClick={() => navigate(`/org/${organization?.slug}/tickets`)}
            className="px-4 py-2 bg-[#36393f] text-white rounded-lg hover:bg-[#40444b] transition-colors flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={createTicketMutation.isPending}
            className="px-4 py-2 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {createTicketMutation.isPending ? 'Creating...' : 'Create Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}

