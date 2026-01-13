import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardContent, CardHeader, CardTitle, Modal, Input, Textarea, Select, Badge, Loading } from '@shared';
import { Pagination } from '@shared/frontend/components/data-display/Pagination';
import api from '@frontend/services/api';
import { Plus, Edit2, Trash2, Target } from 'lucide-react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { useAuthStore } from '@frontend/store/authStore';
import toast from '@shared/frontend/hooks/useToast';
import { ConfirmDialog } from '@shared/frontend/components/feedback/ConfirmDialog';
// Epic status enum - matching backend
enum EpicStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

interface Epic {
  id: string;
  name: string;
  description: string | null;
  status: EpicStatus;
  assignee_id: string | null;
  assignee: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  tasks?: Array<{ id: string; title: string }>;
}

interface EpicManagementProps {
  appSlug: string;
  projectId: string;
  workspaceId?: string;
}

export default function EpicManagement({ appSlug, projectId, workspaceId }: EpicManagementProps) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<Epic | null>(null);

  const [epicForm, setEpicForm] = useState({
    name: '',
    description: '',
    status: EpicStatus.PLANNING,
    assignee_id: '',
    start_date: '',
    end_date: '',
  });

  // Fetch epics with pagination
  const { data: epicsData, isLoading } = useQuery({
    queryKey: ['epics', appSlug, projectId, page],
    queryFn: async () => {
      const response = await api.get(`/apps/${appSlug}/projects/${projectId}/epics?page=${page}&limit=10`);
      return response.data;
    },
    enabled: !!projectId,
  });

  // Fetch workspace members for assignee dropdown
  const { data: workspace } = useQuery({
    queryKey: ['workspace', appSlug, workspaceId],
    queryFn: async () => {
      const response = await api.get(`/apps/${appSlug}/workspaces/${workspaceId}`);
      return response.data;
    },
    enabled: !!workspaceId,
  });

  const members = workspace?.members || [];

  const createEpicMutation = useMutation({
    mutationFn: async (data: typeof epicForm) => {
      const response = await api.post(`/apps/${appSlug}/projects/${projectId}/epics`, {
        ...data,
        assignee_id: data.assignee_id || undefined,
        start_date: data.start_date || undefined,
        end_date: data.end_date || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epics', appSlug, projectId] });
      setShowCreateModal(false);
      setEpicForm({
        name: '',
        description: '',
        status: EpicStatus.PLANNING,
        assignee_id: '',
        start_date: '',
        end_date: '',
      });
      toast.success('Epic created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create epic');
    },
  });

  const updateEpicMutation = useMutation({
    mutationFn: async ({ epicId, data }: { epicId: string; data: Partial<typeof epicForm> }) => {
      const response = await api.put(`/apps/${appSlug}/projects/${projectId}/epics/${epicId}`, {
        ...data,
        assignee_id: data.assignee_id || undefined,
        start_date: data.start_date || undefined,
        end_date: data.end_date || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epics', appSlug, projectId] });
      setEditingEpic(null);
      setEpicForm({
        name: '',
        description: '',
        status: EpicStatus.PLANNING,
        assignee_id: '',
        start_date: '',
        end_date: '',
      });
      toast.success('Epic updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update epic');
    },
  });

  const deleteEpicMutation = useMutation({
    mutationFn: async (epicId: string) => {
      await api.delete(`/apps/${appSlug}/projects/${projectId}/epics/${epicId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epics', appSlug, projectId] });
      setShowDeleteDialog(null);
      toast.success('Epic deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete epic');
    },
  });

  const handleCreateEpic = () => {
    if (!epicForm.name.trim()) {
      toast.error('Epic name is required');
      return;
    }
    createEpicMutation.mutate(epicForm);
  };

  const handleEditEpic = (epic: Epic) => {
    setEditingEpic(epic);
    setEpicForm({
      name: epic.name,
      description: epic.description || '',
      status: epic.status,
      assignee_id: epic.assignee_id || '',
      start_date: epic.start_date ? epic.start_date.split('T')[0] : '',
      end_date: epic.end_date ? epic.end_date.split('T')[0] : '',
    });
  };

  const handleUpdateEpic = () => {
    if (!epicForm.name.trim() || !editingEpic) {
      toast.error('Epic name is required');
      return;
    }
    updateEpicMutation.mutate({ epicId: editingEpic.id, data: epicForm });
  };

  const handleDeleteEpic = (epic: Epic) => {
    deleteEpicMutation.mutate(epic.id);
  };

  const getStatusColor = (status: EpicStatus) => {
    switch (status) {
      case EpicStatus.PLANNING:
        return 'default';
      case EpicStatus.IN_PROGRESS:
        return 'primary';
      case EpicStatus.COMPLETED:
        return 'success';
      case EpicStatus.CANCELLED:
        return 'danger';
      default:
        return 'default';
    }
  };

  const epics = epicsData?.data || [];
  const meta = epicsData?.meta || { total: 0, page: 1, limit: 10, totalPages: 0 };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" style={{ color: theme.colors.text }}>
          Epics
        </h2>
        <Button
          onClick={() => setShowCreateModal(true)}
          variant="primary"
          style={{
            backgroundColor: theme.colors.primary,
            color: '#ffffff',
          }}
          onMouseEnter={(e: any) => {
            e.currentTarget.style.backgroundColor = theme.colors.secondary;
          }}
          onMouseLeave={(e: any) => {
            e.currentTarget.style.backgroundColor = theme.colors.primary;
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Epic
        </Button>
      </div>

      {isLoading ? (
        <Loading size="lg" />
      ) : epics.length === 0 ? (
        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto mb-4" style={{ color: theme.colors.textSecondary }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.text }}>No epics yet</h3>
            <p className="mb-4" style={{ color: theme.colors.textSecondary }}>
              Create your first epic to organize tasks
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {epics.map((epic: Epic) => (
              <Card key={epic.id} style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2" style={{ color: theme.colors.text }}>
                        <Target className="h-5 w-5" />
                        {epic.name}
                      </CardTitle>
                      {epic.description && (
                        <p className="mt-2 text-sm" style={{ color: theme.colors.textSecondary }}>
                          {epic.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={getStatusColor(epic.status)}
                        className="px-3 py-1"
                      >
                        {epic.status.replace('_', ' ')}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditEpic(epic)}
                        style={{
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDeleteDialog(epic)}
                        style={{
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm" style={{ color: theme.colors.textSecondary }}>
                    {epic.assignee && (
                      <span>
                        Assigned to: {epic.assignee.first_name} {epic.assignee.last_name}
                      </span>
                    )}
                    {epic.start_date && (
                      <span>Start: {new Date(epic.start_date).toLocaleDateString()}</span>
                    )}
                    {epic.end_date && (
                      <span>End: {new Date(epic.end_date).toLocaleDateString()}</span>
                    )}
                    {epic.tasks && epic.tasks.length > 0 && (
                      <span>{epic.tasks.length} task(s)</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {meta.totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || !!editingEpic}
        onClose={() => {
          setShowCreateModal(false);
          setEditingEpic(null);
          setEpicForm({
            name: '',
            description: '',
            status: EpicStatus.PLANNING,
            assignee_id: '',
            start_date: '',
            end_date: '',
          });
        }}
        title={editingEpic ? 'Edit Epic' : 'Create Epic'}
        theme={theme}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              Name *
            </label>
            <Input
              value={epicForm.name}
              onChange={(e) => setEpicForm({ ...epicForm, name: e.target.value })}
              placeholder="Epic name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              Description
            </label>
            <Textarea
              value={epicForm.description}
              onChange={(e) => setEpicForm({ ...epicForm, description: e.target.value })}
              placeholder="Epic description"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              Status
            </label>
            <Select
              value={epicForm.status}
              onChange={(e) => setEpicForm({ ...epicForm, status: e.target.value as EpicStatus })}
              options={[
                { value: EpicStatus.PLANNING, label: 'Planning' },
                { value: EpicStatus.IN_PROGRESS, label: 'In Progress' },
                { value: EpicStatus.COMPLETED, label: 'Completed' },
                { value: EpicStatus.CANCELLED, label: 'Cancelled' },
              ]}
            />
          </div>
          {members.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Assignee
              </label>
              <Select
                value={epicForm.assignee_id}
                onChange={(e) => setEpicForm({ ...epicForm, assignee_id: e.target.value })}
                options={[
                  { value: '', label: 'Unassigned' },
                  ...members.map((m: any) => ({
                    value: m.user.id,
                    label: `${m.user.first_name} ${m.user.last_name}`,
                  })),
                ]}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Start Date
              </label>
              <Input
                type="date"
                value={epicForm.start_date}
                onChange={(e) => setEpicForm({ ...epicForm, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                End Date
              </label>
              <Input
                type="date"
                value={epicForm.end_date}
                onChange={(e) => setEpicForm({ ...epicForm, end_date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setEditingEpic(null);
                setEpicForm({
                  name: '',
                  description: '',
                  status: EpicStatus.PLANNING,
                  assignee_id: '',
                  start_date: '',
                  end_date: '',
                });
              }}
              style={{
                borderColor: theme.colors.border,
                color: theme.colors.text,
                backgroundColor: theme.colors.surface,
              }}
              onMouseEnter={(e: any) => {
                e.currentTarget.style.backgroundColor = theme.colors.background;
              }}
              onMouseLeave={(e: any) => {
                e.currentTarget.style.backgroundColor = theme.colors.surface;
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={editingEpic ? handleUpdateEpic : handleCreateEpic}
              style={{
                backgroundColor: theme.colors.primary,
                color: '#ffffff',
              }}
            >
              {editingEpic ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      {showDeleteDialog && (
        <ConfirmDialog
          isOpen={!!showDeleteDialog}
          onClose={() => setShowDeleteDialog(null)}
          onConfirm={() => handleDeleteEpic(showDeleteDialog)}
          title="Delete Epic"
          message={`Are you sure you want to delete "${showDeleteDialog.name}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
          theme={theme}
        />
      )}
    </div>
  );
}

