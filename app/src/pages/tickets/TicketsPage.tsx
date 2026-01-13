import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Ticket, Plus, Search, Filter, ShoppingCart, AlertCircle, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { useState } from 'react';
import toast from '@shared/hooks/useToast';
import { useTheme } from '../../contexts/ThemeContext';
// Import shared components
import { Button, Card, CardContent, Badge } from '@shared';
import { SearchBar } from '@shared/components/data-display';
import { EmptyState } from '@shared/components/feedback';
import { CardSkeleton } from '@shared/components/ui/Skeleton';

export default function TicketsPage() {
  const { organization, _hasHydrated, isAuthenticated, accessToken } = useAuthStore();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const [hasAccessError, setHasAccessError] = useState(false);
  const { theme } = useTheme();
  
  // Check if user has permission to create tickets
  const canCreateTicket = hasPermission('tickets.create');

  const { data: ticketsData, isLoading, error } = useQuery({
    queryKey: ['tickets', organization?.id],
    queryFn: async () => {
      try {
        const response = await api.get('/tickets');
        setHasAccessError(false);
        return response.data;
      } catch (err: any) {
        if (err.response?.status === 403) {
          setHasAccessError(true);
          throw err;
        }
        throw err;
      }
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken && !!organization?.id,
    retry: false,
  });

  const tickets = ticketsData?.tickets || ticketsData?.data || [];
  
  // Only show new ticket button and search/filter when tickets are available (not loading, no errors, has tickets, and user has permission)
  const showTicketActions = !isLoading && !hasAccessError && !error && tickets.length > 0 && canCreateTicket;
  
  // Handle unauthorized access to new ticket page
  const handleNewTicketClick = (e: React.MouseEvent) => {
    if (!canCreateTicket) {
      e.preventDefault();
      toast.error('You do not have permission to create tickets.');
      return;
    }
  };

  return (
    <div className="w-full p-6" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary }}>
              <Ticket className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: theme.colors.text }}>Tickets</h1>
              <p className="mt-2 text-sm sm:text-base" style={{ color: theme.colors.textSecondary }}>Manage support tickets</p>
            </div>
          </div>
          {showTicketActions && canCreateTicket && (
            <Link to={`/org/${organization?.slug}/tickets/new`}>
              <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
                New Ticket
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      {showTicketActions && (
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search tickets..."
              onSearch={(value) => {
                // Handle search
                console.log('Search:', value);
              }}
            />
          </div>
          <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
            Filter
          </Button>
        </div>
      )}

      {/* Access Error - Ticket System Not Available */}
      {hasAccessError || (error && (error as any).response?.status === 403) ? (
        <Card className="max-w-2xl mx-auto text-center" padding="lg">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-yellow-500/20 rounded-full">
              <AlertCircle className="h-12 w-12 text-yellow-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-3">Ticket System Not Available</h3>
          <p className="mb-2 text-gray-600 dark:text-gray-400">
            The ticket system is not available for your current package.
          </p>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Please upgrade to Platinum or Diamond package, or purchase the Ticket System feature separately.
          </p>
          <Link to={`/org/${organization?.slug}/packages`}>
            <Button variant="primary" leftIcon={<ShoppingCart className="h-5 w-5" />}>
              View Packages & Purchase
            </Button>
          </Link>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={<Ticket className="h-16 w-16 mx-auto opacity-50" />}
          title="No tickets yet"
          description={
            canCreateTicket
              ? 'Create your first ticket to get started'
              : 'You do not have permission to create tickets. Contact your administrator for access.'
          }
          action={
            canCreateTicket
              ? {
                  label: 'Create Ticket',
                  onClick: () => navigate(`/org/${organization?.slug}/tickets/new`),
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket: any) => (
            <Link key={ticket.id} to={`/org/${organization?.slug}/tickets/${ticket.id}`}>
              <Card hover className="transition-colors">
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold">{ticket.title}</h3>
                        <Badge
                          variant={
                            ticket.status === 'open'
                              ? 'success'
                              : ticket.status === 'in_progress'
                              ? 'warning'
                              : ticket.status === 'resolved'
                              ? 'info'
                              : 'default'
                          }
                          size="sm"
                        >
                          {ticket.status}
                        </Badge>
                        <Badge
                          variant={
                            ticket.priority === 'urgent'
                              ? 'danger'
                              : ticket.priority === 'high'
                              ? 'warning'
                              : ticket.priority === 'medium'
                              ? 'warning'
                              : 'default'
                          }
                          size="sm"
                        >
                          {ticket.priority}
                        </Badge>
                      </div>
                      {ticket.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                          {ticket.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>Created {new Date(ticket.created_at).toLocaleDateString()}</span>
                        {ticket.assignee && (
                          <span>Assigned to {ticket.assignee.first_name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

