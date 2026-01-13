import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, CardContent, CardHeader, CardTitle, Loading } from '@shared/frontend';
import api from '@frontend/services/api';
import { ArrowLeft, CheckSquare, FolderKanban, BarChart3, Target } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTheme } from '@frontend/contexts/ThemeContext';
import EpicManagement from '../components/EpicManagement';

export default function ProjectDetailPage() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const navigate = useNavigate();
  const { appSlug } = useAppContext();
  const { theme } = useTheme();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', appSlug, projectId],
    queryFn: async () => {
      const response = await api.get(`/apps/${appSlug}/projects/${projectId}`);
      return response.data;
    },
    enabled: !!projectId,
  });

  // Fetch tasks count (just need the count, so we can limit to 1 item)
  const { data: tasksData } = useQuery<{ data: any[]; meta: { total: number } }>({
    queryKey: ['tasks', appSlug, projectId],
    queryFn: async () => {
      const response = await api.get(`/apps/${appSlug}/projects/${projectId}/tasks?limit=1`);
      return response.data;
    },
    enabled: !!projectId,
  });
  const tasksTotal = tasksData?.meta?.total || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" text="Loading project..." />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-full w-full p-6" style={{ backgroundColor: theme.colors.background }}>
        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardContent className="py-12 text-center">
            <p style={{ color: theme.colors.text }}>Project not found</p>
            <Button
              onClick={() => navigate(`../`, { relative: 'route' })}
              className="mt-4"
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
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-6" style={{ backgroundColor: theme.colors.background }}>
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate(`../projects`, { relative: 'route' })}
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
          Back to Projects
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>{project.name}</h1>
            {project.description && (
              <p className="mt-2" style={{ color: theme.colors.textSecondary }}>{project.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate(`tasks`, { relative: 'route' })}
          style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = theme.colors.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.colors.border;
          }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: theme.colors.text }}>
              <CheckSquare className="h-5 w-5" />
              Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>{tasksTotal}</p>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Total tasks</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate(`reports`, { relative: 'route' })}
          style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = theme.colors.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.colors.border;
          }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: theme.colors.text }}>
              <BarChart3 className="h-5 w-5" />
              Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>View project analytics and reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Epic Management */}
      <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
        <CardContent className="pt-6">
          <EpicManagement appSlug={appSlug} projectId={projectId!} workspaceId={workspaceId!} />
        </CardContent>
      </Card>
    </div>
  );
}

