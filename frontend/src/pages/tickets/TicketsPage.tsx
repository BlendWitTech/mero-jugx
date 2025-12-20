import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Ticket, Plus, Search, Filter, ShoppingCart, AlertCircle, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';

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
            <Link
              to={`/org/${organization?.slug}/tickets/new`}
              className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              style={{ backgroundColor: theme.colors.primary, color: '#ffffff' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.secondary}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary}
            >
              <Plus className="h-4 w-4" />
              New Ticket
            </Link>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      {showTicketActions && (
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: theme.colors.textSecondary }} />
            <input
              type="text"
              placeholder="Search tickets..."
              className="w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{ 
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text,
                '--tw-ring-color': theme.colors.primary
              }}
            />
          </div>
          <button 
            className="px-4 py-3 rounded-lg transition-colors flex items-center gap-2"
            style={{ 
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              color: theme.colors.text
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.background}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
          >
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      )}

      {/* Access Error - Ticket System Not Available */}
      {hasAccessError || (error && (error as any).response?.status === 403) ? (
        <div className="rounded-lg p-12 text-center max-w-2xl mx-auto" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-yellow-500/20 rounded-full">
              <AlertCircle className="h-12 w-12 text-yellow-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-3" style={{ color: theme.colors.text }}>Ticket System Not Available</h3>
          <p className="mb-2" style={{ color: theme.colors.textSecondary }}>
            The ticket system is not available for your current package.
          </p>
          <p className="mb-6" style={{ color: theme.colors.textSecondary }}>
            Please upgrade to Platinum or Diamond package, or purchase the Ticket System feature separately.
          </p>
          <Link
            to={`/org/${organization?.slug}/packages`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-colors font-medium"
            style={{ backgroundColor: theme.colors.primary, color: '#ffffff' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.secondary}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary}
          >
            <ShoppingCart className="h-5 w-5" />
            View Packages & Purchase
          </Link>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg p-6 animate-pulse" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
              <div className="h-6 rounded w-1/3 mb-2" style={{ backgroundColor: theme.colors.background }}></div>
              <div className="h-4 rounded w-2/3" style={{ backgroundColor: theme.colors.background }}></div>
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-lg p-12 text-center" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
          <Ticket className="h-16 w-16 mx-auto mb-4" style={{ color: theme.colors.textSecondary, opacity: 0.8 }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: theme.colors.text }}>No tickets yet</h3>
          <p className="mb-6" style={{ color: theme.colors.textSecondary }}>
            {canCreateTicket 
              ? 'Create your first ticket to get started'
              : 'You do not have permission to create tickets. Contact your administrator for access.'}
          </p>
          {canCreateTicket && (
            <Link
              to={`/org/${organization?.slug}/tickets/new`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: theme.colors.primary, color: '#ffffff' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.secondary}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary}
            >
              <Plus className="h-4 w-4" />
              Create Ticket
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket: any) => (
            <Link
              key={ticket.id}
              to={`/org/${organization?.slug}/tickets/${ticket.id}`}
              className="block rounded-lg p-6 transition-colors"
              style={{ 
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.colors.primary}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = theme.colors.border}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold" style={{ color: theme.colors.text }}>{ticket.title}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        ticket.status === 'open'
                          ? 'bg-green-500/20 text-green-400'
                          : ticket.status === 'in_progress'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : ticket.status === 'resolved'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {ticket.status}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        ticket.priority === 'urgent'
                          ? 'bg-red-500/20 text-red-400'
                          : ticket.priority === 'high'
                          ? 'bg-orange-500/20 text-orange-400'
                          : ticket.priority === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {ticket.priority}
                    </span>
                  </div>
                  {ticket.description && (
                    <p className="text-[#b9bbbe] text-sm line-clamp-2">{ticket.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-[#8e9297]">
                    <span>Created {new Date(ticket.created_at).toLocaleDateString()}</span>
                    {ticket.assignee && <span>Assigned to {ticket.assignee.first_name}</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

