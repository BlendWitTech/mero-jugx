import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@frontend/store/authStore';
import { useAppContext } from '../contexts/AppContext';
import api from '@frontend/services/api';
import { useTheme } from '@frontend/contexts/ThemeContext';
import MeroBoardSidebar from '../components/MeroBoardSidebar';
import { isAppSubdomain } from '@frontend/config/urlConfig';

interface Workspace {
  id: string;
  name: string;
  color: string | null;
}

interface Project {
  id: string;
  name: string;
  workspace_id: string;
}

export default function MeroBoardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('mero-board-sidebar-collapsed');
    return saved === 'true';
  });
  const { user, organization } = useAuthStore();
  const { appSlug } = useAppContext();
  const { theme } = useTheme();
  const location = useLocation();
  const params = useParams<{ workspaceId?: string; projectId?: string }>();

  // Listen for sidebar toggle events from header
  useEffect(() => {
    const handleSidebarToggle = (e: CustomEvent) => {
      setSidebarCollapsed(e.detail.collapsed);
    };
    window.addEventListener('mero-board-sidebar-toggle', handleSidebarToggle as EventListener);
    return () => window.removeEventListener('mero-board-sidebar-toggle', handleSidebarToggle as EventListener);
  }, []);

  // Fetch current workspace if workspaceId exists
  const { data: currentWorkspace } = useQuery<Workspace>({
    queryKey: ['workspace', appSlug, params.workspaceId],
    queryFn: async () => {
      const response = await api.get(`/apps/${appSlug}/workspaces/${params.workspaceId}`);
      return response.data;
    },
    enabled: !!params.workspaceId,
  });

  // Fetch all projects for sidebar (not just current workspace)
  const { data: allProjectsData } = useQuery<{ data: Project[]; meta: any }>({
    queryKey: ['all-projects', appSlug],
    queryFn: async () => {
      const response = await api.get(`/apps/${appSlug}/projects`);
      return response.data;
    },
  });
  const allProjects = allProjectsData?.data || [];

  // Fetch projects for current workspace (for page content)
  const { data: projectsData } = useQuery<{ data: Project[]; meta: any }>({
    queryKey: ['projects', appSlug, params.workspaceId],
    queryFn: async () => {
      const response = await api.get(`/apps/${appSlug}/projects?workspaceId=${params.workspaceId}`);
      return response.data;
    },
    enabled: !!params.workspaceId,
  });
  const projects = projectsData?.data || [];

  // Fetch all workspaces for sidebar
  const { data: workspacesData } = useQuery<{ data: Workspace[]; meta: any }>({
    queryKey: ['workspaces', appSlug],
    queryFn: async () => {
      const response = await api.get(`/apps/${appSlug}/workspaces`);
      return response.data;
    },
  });
  const workspaces = workspacesData?.data || [];

  // Fetch workspace members if workspace is selected
  const { data: workspaceMembers } = useQuery({
    queryKey: ['workspace-members', appSlug, params.workspaceId],
    queryFn: async () => {
      if (!params.workspaceId) return [];
      const response = await api.get(`/apps/${appSlug}/workspaces/${params.workspaceId}/members`);
      return response.data || [];
    },
    enabled: !!params.workspaceId,
  });


  // Check if we're on a subdomain (no /app/appSlug in path)
  const isSubdomainRoute = isAppSubdomain();

  // Check if path is active
  const checkActive = (href: string, currentPath: string): boolean => {
    let appPath: string;
    
    if (isSubdomainRoute) {
      // On subdomain: path is relative to root or /org/:slug
      // Extract path after /org/:slug if present
      const orgMatch = currentPath.match(/^\/org\/[^/]+(.*)$/);
      appPath = orgMatch ? orgMatch[1] || '/' : currentPath;
    } else {
      // Path-based routing: extract path after /app/mero-board
      appPath = currentPath.includes('/app/mero-board')
        ? currentPath.split('/app/mero-board')[1] || '/'
        : currentPath.includes('/org/') && currentPath.includes('/app/mero-board')
        ? currentPath.split('/app/mero-board')[1] || '/'
        : currentPath;
    }

    if (href === '' || href === '/') {
      return appPath === '' || appPath === '/' || appPath === '';
    }
    return appPath.startsWith(href);
  };

  // Build href with full path including app base
  const buildHref = (href: string): string => {
    if (isSubdomainRoute) {
      // On subdomain: paths should be relative to /org/:slug or root
      const currentPath = location.pathname;
      let basePath = '/';
      
      // If current path includes /org/:slug, use that as base
      const orgMatch = currentPath.match(/^(\/org\/[^/]+)/);
      if (orgMatch) {
        basePath = orgMatch[1];
      } else if (organization?.slug) {
        // Use organization slug if available
        basePath = `/org/${organization.slug}`;
      }
      
      // If href is empty, return the base path
      if (!href || href === '' || href === '/') {
        return basePath;
      }
      // Otherwise, append the href to the base path
      return `${basePath}${href.startsWith('/') ? href : `/${href}`}`;
    } else {
      // Path-based routing: include /app/mero-board
      const currentPath = location.pathname;
      // Find the app base path (everything up to and including /app/mero-board)
      const appBaseMatch = currentPath.match(/\/org\/[^/]+\/app\/mero-board/);
      if (appBaseMatch) {
        const appBase = appBaseMatch[0];
        // If href is empty, return the app base
        if (!href || href === '' || href === '/') {
          return appBase;
        }
        // Otherwise, append the href to the app base
        return `${appBase}${href.startsWith('/') ? href : `/${href}`}`;
      }
      // Fallback: if we can't find the app base, try to construct it
      if (organization?.slug) {
        const base = `/org/${organization.slug}/app/mero-board`;
        if (!href || href === '' || href === '/') {
          return base;
        }
        return `${base}${href.startsWith('/') ? href : `/${href}`}`;
      }
      // Last resort: return href as-is
      return href;
    }
  };


  return (
    <div className="h-full w-full flex" style={{ backgroundColor: theme.colors.background }}>
      {/* Mero Board Sidebar - PM-style hierarchical navigation */}
      <MeroBoardSidebar
        workspaces={workspaces || []}
        currentWorkspace={currentWorkspace || null}
        projects={allProjects || []}
        currentProjectId={params.projectId || null}
        workspaceMembers={workspaceMembers || []}
        buildHref={buildHref}
        checkActive={checkActive}
        onLogout={() => {
          // Logout handled in MeroBoardSidebar component
        }}
      />

      {/* Main Content Area - matches main app spacing exactly */}
      <div 
        className="flex-1 flex flex-col overflow-hidden transition-colors duration-300"
        style={{ backgroundColor: theme.colors.background }}
      >
        {/* Page Content - matches main app structure (no padding in main, pages handle their own) */}
        <div 
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent transition-colors duration-300"
          style={{ 
            backgroundColor: theme.colors.background,
            scrollbarColor: `${theme.colors.border} transparent`
          }}
        >
          <main className="h-full">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
