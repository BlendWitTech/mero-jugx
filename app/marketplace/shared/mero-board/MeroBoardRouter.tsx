import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { useAuthStore } from '@frontend/store/authStore';
import { Loading, PageSkeleton } from '@shared';
import MeroBoardLayout from './layouts/MeroBoardLayout';

// Lazy load pages for better performance
const WorkspacesPage = React.lazy(() => import('./pages/WorkspacesPage'));
const WorkspaceDetailPage = React.lazy(() => import('./pages/WorkspaceDetailPage'));
const ProjectsPage = React.lazy(() => import('./pages/ProjectsPage'));
const ProjectDetailPage = React.lazy(() => import('./pages/ProjectDetailPage'));
const TasksPage = React.lazy(() => import('./pages/TasksPage'));
const TaskDetailPage = React.lazy(() => import('./pages/TaskDetailPage'));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage'));
const WorkspaceSettingsPage = React.lazy(() => import('./pages/WorkspaceSettingsPage'));

interface MeroBoardRouterProps {
  appSlug: string;
}

export default function MeroBoardRouter({ appSlug }: MeroBoardRouterProps) {
  const { organization } = useAuthStore();
  const location = useLocation();

  // Log current location for debugging
  console.log('MeroBoardRouter - Current location:', location.pathname);

  if (!organization?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" text="Loading workspace..." />
      </div>
    );
  }

  return (
    <AppProvider appSlug={appSlug} organizationId={organization.id}>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route element={<MeroBoardLayout />}>
            <Route index element={<WorkspacesPage />} />
            <Route path="workspaces/:workspaceId" element={<WorkspaceDetailPage />} />
            <Route path="workspaces/:workspaceId/settings" element={<WorkspaceSettingsPage />} />
            <Route path="workspaces/:workspaceId/projects" element={<ProjectsPage />} />
            <Route path="workspaces/:workspaceId/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="workspaces/:workspaceId/projects/:projectId/tasks" element={<TasksPage />} />
            <Route path="workspaces/:workspaceId/projects/:projectId/tasks/:taskId" element={<TaskDetailPage />} />
            <Route path="workspaces/:workspaceId/projects/:projectId/reports" element={<ReportsPage />} />
            <Route path="workspaces/:workspaceId/reports" element={<ReportsPage />} />
            {/* Catch-all: redirect to index (workspaces page) if route doesn't match */}
            <Route path="*" element={<Navigate to="" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </AppProvider>
  );
}

