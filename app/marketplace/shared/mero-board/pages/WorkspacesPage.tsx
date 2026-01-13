import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Modal, Textarea, Loading } from '@shared/frontend';
import api from '@frontend/services/api';
import { useAuthStore } from '@frontend/store/authStore';
import { Plus, Users, FileText, LayoutDashboard } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTheme } from '@frontend/contexts/ThemeContext';
import toast from '@shared/frontend/hooks/useToast';
import WorkspaceTemplateSelector from '../components/WorkspaceTemplateSelector';
import WorkspaceColorPicker from '../components/WorkspaceColorPicker';

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  logo_url: string | null;
  created_at: string;
  members?: Array<{
    id: string;
    user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
    };
    role: 'owner' | 'admin' | 'member';
  }>;
}

export default function WorkspacesPage() {
  const { user, organization: currentOrganization } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [workspaceColor, setWorkspaceColor] = useState<string | null>(null);

  // Get app ID from context
  const { appSlug } = useAppContext();

  // Helper to build absolute path within the app
  const buildAppPath = (path: string): string => {
    // Get the current path and extract the app base (everything up to and including /app/mero-board)
    const currentPath = location.pathname;
    const appBaseMatch = currentPath.match(/\/org\/[^/]+\/app\/[^/]+/);
    if (appBaseMatch) {
      const appBase = appBaseMatch[0];
      // Remove leading slash from path if present
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      return `${appBase}/${cleanPath}`;
    }
    // Fallback: construct from organization slug
    if (currentOrganization?.slug) {
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      return `/org/${currentOrganization.slug}/app/${appSlug}/${cleanPath}`;
    }
    // Last resort: return relative path
    return path;
  };

  // Fetch workspaces
  const { data: workspacesData, isLoading } = useQuery<{ data: Workspace[]; meta: { total: number; page: number; limit: number; totalPages: number } }>({
    queryKey: ['workspaces', appSlug, currentOrganization?.id],
    queryFn: async () => {
      const response = await api.get(`/apps/${appSlug}/workspaces`);
      return response.data;
    },
    enabled: !!currentOrganization?.id,
  });
  const workspaces = workspacesData?.data || [];

  // Create workspace mutation
  const createWorkspaceMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; color?: string; templateId?: string }) => {
      const response = await api.post(`/apps/${appSlug}/workspaces`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', appSlug, currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['all-projects', appSlug] });
      setShowCreateModal(false);
      setWorkspaceName('');
      setWorkspaceDescription('');
      setWorkspaceColor(null);
      toast.success('Workspace created successfully');
      // Navigate to the new workspace
      const targetPath = `workspaces/${data.id}`;
      setTimeout(() => {
        navigate(targetPath, { replace: false });
      }, 100);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create workspace');
    },
  });

  const handleCreateWorkspace = () => {
    if (!workspaceName.trim()) return;
    createWorkspaceMutation.mutate({
      name: workspaceName,
      description: workspaceDescription || undefined,
      color: workspaceColor || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: theme.colors.background }}>
        <Loading size="lg" text="Loading workspaces..." />
      </div>
    );
  }

  return (
    <div className="h-full w-full p-6" style={{ backgroundColor: theme.colors.background }}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>Workspaces</h1>
          <p className="mt-2" style={{ color: theme.colors.textSecondary }}>
            Manage your project workspaces
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowTemplateModal(true)}
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
            <FileText className="mr-2 h-4 w-4" />
            Use Template
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
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
            Create Workspace
          </Button>
        </div>
      </div>

      {workspaces && workspaces.length === 0 ? (
        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4" style={{ color: theme.colors.textSecondary }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.text }}>No workspaces yet</h3>
            <p className="mb-4" style={{ color: theme.colors.textSecondary }}>
              Create your first workspace to get started with project management
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => setShowTemplateModal(true)}
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
                <FileText className="mr-2 h-4 w-4" />
                Use Template
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
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
                Create Workspace
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces?.map((workspace) => {
            // Extract emoji from name (if present)
            const emojiMatch = workspace.name.match(/^[\p{Emoji}\u200d]+/u);
            const emoji = emojiMatch ? emojiMatch[0] : null;
            const displayName = emoji ? workspace.name.replace(emoji, '').trim() : workspace.name;
            const borderColor = workspace.color || theme.colors.border;

            return (
              <Card
                key={workspace.id}
                className="hover:shadow-lg transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: borderColor,
                  borderWidth: '2px',
                  borderLeftWidth: workspace.color ? '4px' : '2px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = workspace.color || theme.colors.primary;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = borderColor;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const targetPath = `workspaces/${workspace.id}`;
                  console.log('Card click - Current location:', location.pathname);
                  console.log('Card click - Navigating to:', targetPath);
                  navigate(targetPath, { replace: false });
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {emoji && (
                        <span className="text-2xl flex-shrink-0">{emoji}</span>
                      )}
                      {!emoji && workspace.color && (
                        <div
                          className="w-8 h-8 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: workspace.color }}
                        />
                      )}
                      {!emoji && !workspace.color && (
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: theme.colors.primary + '20', color: theme.colors.primary }}
                        >
                          <LayoutDashboard className="h-4 w-4" />
                        </div>
                      )}
                      <CardTitle className="text-xl flex-1 min-w-0" style={{ color: theme.colors.text }}>
                        {displayName}
                      </CardTitle>
                    </div>
                  </div>
                  {workspace.description && (
                    <p className="text-sm mt-2" style={{ color: theme.colors.textSecondary }}>
                      {workspace.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" style={{ color: theme.colors.textSecondary }} />
                      <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        {workspace.members?.length || 0} members
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const targetPath = `workspaces/${workspace.id}`;
                        console.log('Button click - Current location:', location.pathname);
                        console.log('Button click - Navigating to:', targetPath);
                        navigate(targetPath, { replace: false });
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
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Workspace Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setWorkspaceName('');
          setWorkspaceDescription('');
          setWorkspaceColor(null);
        }}
        title="Create New Workspace"
        theme={theme}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              Workspace Name *
            </label>
            <Input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="Enter workspace name"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              Description (Optional)
            </label>
            <Textarea
              value={workspaceDescription}
              onChange={(e) => setWorkspaceDescription(e.target.value)}
              placeholder="Enter workspace description"
              rows={3}
            />
          </div>
          <WorkspaceColorPicker
            selectedColor={workspaceColor}
            onColorSelect={setWorkspaceColor}
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setWorkspaceName('');
                setWorkspaceDescription('');
                setWorkspaceColor(null);
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
              onClick={handleCreateWorkspace}
              disabled={!workspaceName.trim() || createWorkspaceMutation.isPending}
              isLoading={createWorkspaceMutation.isPending}
              style={{
                backgroundColor: theme.colors.primary,
                color: '#ffffff',
              }}
              onMouseEnter={(e: any) => {
                if (!createWorkspaceMutation.isPending && workspaceName.trim()) {
                  e.currentTarget.style.backgroundColor = theme.colors.secondary;
                }
              }}
              onMouseLeave={(e: any) => {
                if (!createWorkspaceMutation.isPending) {
                  e.currentTarget.style.backgroundColor = theme.colors.primary;
                }
              }}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Template Selection Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title="Create Workspace from Template"
        theme={theme}
        size="4xl"
      >
        <WorkspaceTemplateSelector
          onTemplateUsed={(workspaceId) => {
            setShowTemplateModal(false);
            console.log('Navigating to workspace (template):', `workspaces/${workspaceId}`);
            navigate(`workspaces/${workspaceId}`);
          }}
          onCancel={() => setShowTemplateModal(false)}
        />
      </Modal>
    </div>
  );
}

