import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Modal,
  Input,
  Textarea,
  Select,
  Loading,
  Badge,
} from '@shared';
import { EmptyState } from '@shared/frontend/components/feedback/EmptyState';
import api from '@frontend/services/api';
import { useAppContext } from '../contexts/AppContext';
import { useTheme } from '@frontend/contexts/ThemeContext';
import toast from '@shared/frontend/hooks/useToast';
import {
  FileText,
  Plus,
  Sparkles,
  X,
  ListTodo,
  Zap,
  BarChart3,
  Bug,
  Rocket,
  FileEdit,
  Calendar,
  CheckSquare,
  TrendingUp
} from 'lucide-react';

interface ProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  is_public: boolean;
  usage_count: number;
  tasks?: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
  }>;
  creator: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface ProjectTemplateSelectorProps {
  workspaceId?: string;
  onTemplateUsed?: (projectId: string) => void;
  onCancel?: () => void;
}

export default function ProjectTemplateSelector({
  workspaceId,
  onTemplateUsed,
  onCancel,
}: ProjectTemplateSelectorProps) {
  const { appSlug } = useAppContext();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customProjectName, setCustomProjectName] = useState('');

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery<ProjectTemplate[]>({
    queryKey: ['project-templates', appSlug],
    queryFn: async () => {
      const response = await api.get(`/apps/${appSlug}/project-templates`);
      return response.data;
    },
  });

  // Use template mutation
  const useTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await api.post(`/apps/${appSlug}/project-templates/use`, {
        template_id: templateId,
        workspace_id: workspaceId,
        project_name: customProjectName || undefined,
      });
      return response.data;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects', appSlug, workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['project-templates', appSlug] });
      toast.success('Project created from template successfully');
      onTemplateUsed?.(project.id);
      setSelectedTemplate(null);
      setCustomProjectName('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create project from template');
    },
  });

  const handleUseTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleConfirmUse = () => {
    if (!selectedTemplate) return;
    useTemplateMutation.mutate(selectedTemplate);
  };

  // Get category icon and color
  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      backlog: <ListTodo className="h-5 w-5" />,
      scrum: <Zap className="h-5 w-5" />,
      kanban: <BarChart3 className="h-5 w-5" />,
      'bug-tracking': <Bug className="h-5 w-5" />,
      feature: <Rocket className="h-5 w-5" />,
      content: <FileEdit className="h-5 w-5" />,
      event: <Calendar className="h-5 w-5" />,
    };
    return iconMap[category] || <CheckSquare className="h-5 w-5" />;
  };

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      backlog: theme.colors.primary,
      scrum: '#8b5cf6',
      kanban: '#06b6d4',
      'bug-tracking': '#ef4444',
      feature: '#10b981',
      content: '#f59e0b',
      event: '#ec4899',
    };
    return colorMap[category] || theme.colors.primary;
  };

  const getCategoryLabel = (category: string) => {
    const labelMap: Record<string, string> = {
      backlog: 'Backlog',
      scrum: 'Scrum',
      kanban: 'Kanban',
      'bug-tracking': 'Bug Tracking',
      feature: 'Feature',
      content: 'Content',
      event: 'Event',
    };
    return labelMap[category] || category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loading size="lg" text="Loading templates..." />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold" style={{ color: theme.colors.text }}>
              Choose a Project Template
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCreateModal(true)}
              style={{
                borderColor: theme.colors.border,
                color: theme.colors.text,
                backgroundColor: theme.colors.surface,
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
            Select a template to quickly set up your project with pre-configured tasks
          </p>
        </div>

        {templates.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title="No templates available"
            description="Create a template from an existing project or start from scratch"
            action={{
              label: 'Create Template',
              onClick: () => setShowCreateModal(true),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {templates.map((template) => {
              const categoryColor = getCategoryColor(template.category);
              const categoryIcon = getCategoryIcon(template.category);
              const categoryLabel = getCategoryLabel(template.category);

              return (
                <Card
                  key={template.id}
                  className="cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] group"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderWidth: '1px',
                  }}
                  onClick={() => handleUseTemplate(template.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = categoryColor;
                    e.currentTarget.style.boxShadow = `0 10px 25px -5px ${categoryColor}20, 0 10px 10px -5px ${categoryColor}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div
                        className="p-2.5 rounded-lg flex-shrink-0"
                        style={{
                          backgroundColor: categoryColor + '15',
                          color: categoryColor
                        }}
                      >
                        {categoryIcon}
                      </div>
                      <div className="flex items-center gap-2">
                        {template.is_public && (
                          <Badge
                            variant="default"
                            size="sm"
                            style={{
                              backgroundColor: theme.colors.primary + '20',
                              color: theme.colors.primary,
                              borderColor: theme.colors.primary,
                            }}
                          >
                            Public
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle
                      className="text-lg font-bold mb-1 group-hover:underline"
                      style={{ color: theme.colors.text }}
                    >
                      {template.name}
                    </CardTitle>
                    <Badge
                      size="sm"
                      variant="outline"
                      style={{
                        borderColor: categoryColor + '40',
                        color: categoryColor,
                        backgroundColor: 'transparent',
                      }}
                    >
                      {categoryLabel}
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {template.description && (
                      <p
                        className="text-sm mb-4 line-clamp-2"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        {template.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: theme.colors.border }}>
                      <div className="flex items-center gap-4 text-xs" style={{ color: theme.colors.textSecondary }}>
                        <div className="flex items-center gap-1.5">
                          <CheckSquare className="h-3.5 w-3.5" />
                          <span className="font-medium">{template.tasks?.length || 0} tasks</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5" />
                          <span className="font-medium">{template.usage_count} uses</span>
                        </div>
                      </div>
                      <Sparkles
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                        style={{ color: categoryColor }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Use Template Confirmation Modal */}
      <Modal
        isOpen={!!selectedTemplate}
        onClose={() => {
          setSelectedTemplate(null);
          setCustomProjectName('');
        }}
        title="Create Project from Template"
        theme={theme}
      >
        <div className="space-y-5">
          {selectedTemplate && (
            <div className="p-4 rounded-lg border" style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }}>
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg flex-shrink-0"
                  style={{
                    backgroundColor: getCategoryColor(templates.find(t => t.id === selectedTemplate)?.category || 'backlog') + '15',
                    color: getCategoryColor(templates.find(t => t.id === selectedTemplate)?.category || 'backlog')
                  }}
                >
                  {getCategoryIcon(templates.find(t => t.id === selectedTemplate)?.category || 'backlog')}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1" style={{ color: theme.colors.text }}>
                    {templates.find(t => t.id === selectedTemplate)?.name}
                  </h4>
                  {templates.find(t => t.id === selectedTemplate)?.description && (
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      {templates.find(t => t.id === selectedTemplate)?.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              Project Name <span className="text-xs font-normal" style={{ color: theme.colors.textSecondary }}>(optional)</span>
            </label>
            <Input
              value={customProjectName}
              onChange={(e) => setCustomProjectName(e.target.value)}
              placeholder="Leave empty to use template name"
              style={{
                backgroundColor: theme.colors.inputBackground || theme.colors.background,
                borderColor: theme.colors.inputBorder || theme.colors.border,
                color: theme.colors.inputText || theme.colors.text,
              }}
            />
            <p className="text-xs mt-2" style={{ color: theme.colors.textSecondary }}>
              If left empty, the project will use the template name
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedTemplate(null);
                setCustomProjectName('');
              }}
              style={{
                borderColor: theme.colors.border,
                color: theme.colors.text,
                backgroundColor: theme.colors.surface,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmUse}
              disabled={useTemplateMutation.isPending}
              isLoading={useTemplateMutation.isPending}
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.buttonText || '#ffffff',
              }}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Template Modal - Placeholder for now */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Project Template"
        theme={theme}
      >
        <div className="space-y-4">
          <p style={{ color: theme.colors.textSecondary }}>
            Template creation from existing projects will be implemented next.
          </p>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              style={{
                borderColor: theme.colors.border,
                color: theme.colors.text,
                backgroundColor: theme.colors.surface,
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

