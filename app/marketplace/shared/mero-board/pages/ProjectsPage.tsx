import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Modal } from '@shared/frontend';
import api from '@frontend/services/api';
import { Plus, ArrowLeft, FolderKanban, FileText } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTheme } from '@frontend/contexts/ThemeContext';
import ProjectTemplateSelector from '../components/ProjectTemplateSelector';
import toast from '@shared/frontend/hooks/useToast';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
}

export default function ProjectsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { appSlug } = useAppContext();
  const { theme } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const { data: projectsData, isLoading } = useQuery<{ data: Project[]; meta: { total: number; page: number; limit: number; totalPages: number } }>({
    queryKey: ['projects', appSlug, workspaceId],
    queryFn: async () => {
      const response = await api.get(`/apps/${appSlug}/projects?workspaceId=${workspaceId}`);
      return response.data;
    },
    enabled: !!workspaceId,
  });
  const projects = projectsData?.data || [];

  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; workspace_id: string }) => {
      const response = await api.post(`/apps/${appSlug}/projects`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', appSlug, workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['all-projects', appSlug] });
      setShowCreateModal(false);
      setProjectName('');
      setProjectDescription('');
      toast.success('Project created successfully');
      // Navigate to the new project - use relative path
      setTimeout(() => {
        navigate(`${data.id}`, { relative: 'route', replace: false });
      }, 100);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create project');
    },
  });

  const handleCreateProject = () => {
    if (!projectName.trim() || !workspaceId) return;
    createProjectMutation.mutate({
      name: projectName,
      description: projectDescription || undefined,
      workspace_id: workspaceId,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-6" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <Button
            variant="outline"
            onClick={() => navigate(`../`, { relative: 'route' })}
            className="mb-4"
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
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workspace
          </Button>
          <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>Projects</h1>
          <p className="mt-2" style={{ color: theme.colors.textSecondary }}>Manage your projects</p>
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
            Create Project
          </Button>
        </div>
      </div>

      {projects && projects.length === 0 ? (
        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardContent className="py-12 text-center">
            <FolderKanban className="h-12 w-12 mx-auto mb-4" style={{ color: theme.colors.textSecondary }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.text }}>No projects yet</h3>
            <p className="mb-4" style={{ color: theme.colors.textSecondary }}>
              Create your first project to start organizing your work
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
                Create Project
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.background }}>
                    <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>
                      Project Name
                    </th>
                    <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>
                      Description
                    </th>
                    <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>
                      Status
                    </th>
                    <th className="text-left p-4 font-semibold" style={{ color: theme.colors.text }}>
                      Created
                    </th>
                    <th className="text-right p-4 font-semibold" style={{ color: theme.colors.text }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projects?.map((project) => (
                    <tr
                      key={project.id}
                      className="transition-colors cursor-pointer"
                      style={{
                        borderBottom: `1px solid ${theme.colors.border}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.background;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      onClick={() => navigate(`${project.id}`, { relative: 'route' })}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {(() => {
                            // Extract emoji from name (if present)
                            const emojiMatch = project.name.match(/^[\p{Emoji}\u200d]+/u);
                            const emoji = emojiMatch ? emojiMatch[0] : null;
                            const displayName = emoji ? project.name.replace(emoji, '').trim() : project.name;

                            return (
                              <>
                                {emoji ? (
                                  <span className="text-lg flex-shrink-0">{emoji}</span>
                                ) : (
                                  <FolderKanban className="h-4 w-4 flex-shrink-0" style={{ color: theme.colors.textSecondary }} />
                                )}
                                <span className="font-medium" style={{ color: theme.colors.text }}>
                                  {displayName}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          {project.description || '-'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className="text-xs px-2 py-1 rounded capitalize"
                          style={{
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.text,
                            border: `1px solid ${theme.colors.border}`,
                          }}
                        >
                          {project.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          {new Date(project.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`${project.id}`, { relative: 'route' });
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <Card className="w-full max-w-md" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader>
              <CardTitle style={{ color: theme.colors.text }}>Create New Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>Project Name</label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>Description (Optional)</label>
                <Input
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Enter project description"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
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
                  onClick={handleCreateProject}
                  disabled={!projectName.trim() || createProjectMutation.isPending}
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: '#ffffff',
                  }}
                  onMouseEnter={(e: any) => {
                    if (!createProjectMutation.isPending && projectName.trim()) {
                      e.currentTarget.style.backgroundColor = theme.colors.secondary;
                    }
                  }}
                  onMouseLeave={(e: any) => {
                    if (!createProjectMutation.isPending && projectName.trim()) {
                      e.currentTarget.style.backgroundColor = theme.colors.primary;
                    }
                  }}
                >
                  {createProjectMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Template Selection Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title="Create Project from Template"
        theme={theme}
        size="4xl"
      >
        <ProjectTemplateSelector
          workspaceId={workspaceId}
          onTemplateUsed={(projectId) => {
            setShowTemplateModal(false);
            navigate(`../`, { relative: 'route' });
          }}
          onCancel={() => setShowTemplateModal(false)}
        />
      </Modal>
    </div>
  );
}

