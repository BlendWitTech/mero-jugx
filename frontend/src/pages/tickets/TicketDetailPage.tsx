import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Loader2, ArrowLeft, Flag, User, Calendar, Tag, MessageSquare, Edit, ShoppingCart, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function TicketDetailPage() {
  const { ticketId, slug } = useParams<{ ticketId: string; slug: string }>();
  const { organization } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedEpicId, setSelectedEpicId] = useState<string>('');

  // Fetch ticket details
  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      const response = await api.get(`/tickets/${ticketId}`);
      return response.data;
    },
    enabled: !!ticketId,
    retry: false,
  });

  // Fetch projects for flag modal
  const { data: projectsData, error: projectsError } = useQuery({
    queryKey: ['projects', organization?.id],
    queryFn: async () => {
      try {
        const response = await api.get('/boards/projects');
        return response.data;
      } catch (error: any) {
        // Handle 403 and 400 errors gracefully - don't throw, return empty array
        if (error?.response?.status === 403 || error?.response?.status === 400) {
          return [];
        }
        throw error;
      }
    },
    enabled: showFlagModal && !!organization?.id,
    retry: false,
  });

  // Fetch epics for selected project
  const { data: epicsData } = useQuery({
    queryKey: ['epics', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const response = await api.get(`/boards/epics?project_id=${selectedProjectId}`);
      return response.data;
    },
    enabled: showFlagModal && !!selectedProjectId,
  });

  // Flag to board mutation
  const flagToBoardMutation = useMutation({
    mutationFn: async (data: { project_id?: string; epic_id?: string; priority?: string }) => {
      const response = await api.post('/boards/tasks/from-ticket', {
        ticket_id: ticketId,
        project_id: data.project_id || undefined,
        epic_id: data.epic_id || undefined,
        priority: data.priority || ticket?.priority,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Ticket flagged to Mero Board! Task created successfully.');
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowFlagModal(false);
      setSelectedProjectId('');
      setSelectedEpicId('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to flag ticket to board');
    },
  });

  const handleFlagToBoard = () => {
    if (!ticketId) return;
    flagToBoardMutation.mutate({
      project_id: selectedProjectId || undefined,
      epic_id: selectedEpicId || undefined,
      priority: ticket?.priority,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-[#5865f2]" />
      </div>
    );
  }

  // Check for access error
  if (error && (error as any).response?.status === 403) {
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
              to={`/org/${slug}/packages`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors font-medium"
            >
              <ShoppingCart className="h-5 w-5" />
              View Packages & Purchase
            </Link>
            <button
              onClick={() => navigate(`/org/${slug}/tickets`)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#393c43] text-[#b9bbbe] rounded-lg hover:bg-[#404249] transition-colors font-medium"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Ticket Not Found</h2>
          <button
            onClick={() => navigate(`/org/${slug}/tickets`)}
            className="mt-4 px-4 py-2 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors"
          >
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/org/${slug}/tickets`)}
          className="flex items-center gap-2 text-[#b9bbbe] hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tickets
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{ticket.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${
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
                className={`px-3 py-1 text-xs font-medium rounded-full ${
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
          </div>
          <button
            onClick={() => setShowFlagModal(true)}
            className="px-4 py-2 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors flex items-center gap-2"
          >
            <Flag className="h-4 w-4" />
            Flag to Board
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-[#2f3136] rounded-lg p-6 border border-[#202225]">
            <h2 className="text-lg font-semibold text-white mb-4">Description</h2>
            <p className="text-[#b9bbbe] whitespace-pre-wrap">
              {ticket.description || 'No description provided.'}
            </p>
          </div>

          {/* Comments */}
          <div className="bg-[#2f3136] rounded-lg p-6 border border-[#202225]">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comments
            </h2>
            {ticket.comments && ticket.comments.length > 0 ? (
              <div className="space-y-4">
                {ticket.comments.map((comment: any) => (
                  <div key={comment.id} className="border-b border-[#202225] pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-white">
                        {comment.author?.first_name} {comment.author?.last_name}
                      </span>
                      <span className="text-xs text-[#8e9297]">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[#b9bbbe] text-sm">{comment.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#8e9297] text-sm">No comments yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <div className="bg-[#2f3136] rounded-lg p-6 border border-[#202225]">
            <h3 className="text-lg font-semibold text-white mb-4">Details</h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-[#8e9297] mb-1">Assignee</div>
                {ticket.assignee ? (
                  <div className="flex items-center gap-2 text-white">
                    <User className="h-4 w-4" />
                    <span>
                      {ticket.assignee.first_name} {ticket.assignee.last_name}
                    </span>
                  </div>
                ) : (
                  <span className="text-[#8e9297]">Unassigned</span>
                )}
              </div>
              <div>
                <div className="text-xs text-[#8e9297] mb-1">Created</div>
                <div className="flex items-center gap-2 text-white">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              {ticket.tags && ticket.tags.length > 0 && (
                <div>
                  <div className="text-xs text-[#8e9297] mb-2">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {ticket.tags.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs bg-[#36393f] text-[#b9bbbe] rounded flex items-center gap-1"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Flag to Board Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#2f3136] rounded-lg max-w-md w-full border border-[#202225] p-6">
            <h3 className="text-xl font-bold text-white mb-4">Flag Ticket to Mero Board</h3>
            <p className="text-sm text-[#b9bbbe] mb-6">
              Create a task in Mero Board from this ticket. You can optionally add it to a project or epic.
            </p>

            <div className="space-y-4">
              {projectsError && (projectsError as any).response?.status === 403 ? (
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-400">
                    You need access to Mero Board app to flag tickets. Please contact your organization owner.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-[#b9bbbe] mb-2">
                    Project (Optional)
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      setSelectedEpicId(''); // Reset epic when project changes
                    }}
                    className="w-full px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  >
                    <option value="">None</option>
                    {projectsData?.map((project: any) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedProjectId && (
                <div>
                  <label className="block text-sm font-medium text-[#b9bbbe] mb-2">
                    Epic (Optional)
                  </label>
                  <select
                    value={selectedEpicId}
                    onChange={(e) => setSelectedEpicId(e.target.value)}
                    className="w-full px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  >
                    <option value="">None</option>
                    {epicsData?.map((epic: any) => (
                      <option key={epic.id} value={epic.id}>
                        {epic.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowFlagModal(false);
                    setSelectedProjectId('');
                    setSelectedEpicId('');
                  }}
                  className="flex-1 py-2 bg-[#393c43] text-[#b9bbbe] rounded-lg hover:bg-[#404249] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFlagToBoard}
                  disabled={flagToBoardMutation.isPending}
                  className="flex-1 py-2 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {flagToBoardMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    'Create Task'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

