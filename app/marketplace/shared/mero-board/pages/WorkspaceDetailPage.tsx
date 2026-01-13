import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, CardContent, CardHeader, CardTitle, Loading } from '@shared/frontend';
import api from '@frontend/services/api';
import { ArrowLeft, Settings, Users, FolderKanban, CheckSquare, BarChart3 } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTheme } from '@frontend/contexts/ThemeContext';
import WorkspaceMembers from '../components/WorkspaceMembers';

export default function WorkspaceDetailPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { appSlug } = useAppContext();
  const { theme } = useTheme();

  const { data: workspace, isLoading } = useQuery({
    queryKey: ['workspace', appSlug, workspaceId],
    queryFn: async () => {
      const response = await api.get(`/apps/${appSlug}/workspaces/${workspaceId}`);
      return response.data;
    },
    enabled: !!workspaceId,
  });

  // Fetch projects count
  const { data: projectsData } = useQuery<{ data: any[]; meta: any }>({
    queryKey: ['projects', appSlug, workspaceId],
    queryFn: async () => {
      const response = await api.get(`/apps/${appSlug}/projects?workspaceId=${workspaceId}`);
      return response.data;
    },
    enabled: !!workspaceId,
  });
  const projects = projectsData?.data || [];

  // Fetch tasks count (sum of all project tasks)
  const { data: allTasks } = useQuery({
    queryKey: ['workspace-tasks', appSlug, workspaceId, projects],
    queryFn: async () => {
      if (!projects || projects.length === 0) return [];
      const taskPromises = projects.map((project: any) =>
        api.get(`/apps/${appSlug}/projects/${project.id}/tasks`).catch(() => ({ data: { data: [], meta: { total: 0 } } }))
      );
      const results = await Promise.all(taskPromises);
      return results.flatMap((r) => r.data?.data || []);
    },
    enabled: !!workspaceId && !!projects && projects.length > 0,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" text="Loading workspace..." />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="h-full w-full p-6" style={{ backgroundColor: theme.colors.background }}>
        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardContent className="py-12 text-center">
            <p style={{ color: theme.colors.text }}>Workspace not found</p>
            <Button 
              onClick={() => {
                // Navigate to index route (workspaces list)
                const currentPath = window.location.pathname;
                const appBaseMatch = currentPath.match(/\/org\/[^/]+\/app\/mero-board/);
                if (appBaseMatch) {
                  navigate(appBaseMatch[0] + '/');
                } else {
                  navigate('');
                }
              }} 
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
              Back to Workspaces
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
          onClick={() => {
            // Navigate to index route (workspaces list)
            const currentPath = window.location.pathname;
            const appBaseMatch = currentPath.match(/\/org\/[^/]+\/app\/mero-board/);
            if (appBaseMatch) {
              navigate(appBaseMatch[0] + '/');
            } else {
              navigate('');
            }
          }} 
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
          Back to Workspaces
        </Button>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>{workspace.name}</h1>
          {workspace.description && (
            <p className="mt-2" style={{ color: theme.colors.textSecondary }}>{workspace.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow" 
          onClick={() => navigate(`projects`, { relative: 'route' })}
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
              <FolderKanban className="h-5 w-5" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>{projects?.length || 0}</p>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Active projects</p>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: theme.colors.text }}>
              <CheckSquare className="h-5 w-5" />
              Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>{allTasks?.length || 0}</p>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Total tasks</p>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: theme.colors.text }}>
              <Users className="h-5 w-5" />
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>{workspace.members?.length || 0}</p>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Team members</p>
          </CardContent>
        </Card>
      </div>

      {/* Workspace Members Section */}
      <div className="mt-6">
        <WorkspaceMembers workspaceId={workspaceId!} />
      </div>
    </div>
  );
}

