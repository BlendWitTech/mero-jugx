import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Plus,
  Settings,
  Users,
  BarChart,
  LogOut,
  Hash,
  MoreVertical,
  Trash2,
  Calendar,
  MessageSquare,
  UserPlus,
  Target,
  Mail,
} from 'lucide-react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { useAuthStore } from '@frontend/store/authStore';
import { logoutFromAppBySlug } from '@shared/frontend/utils/appAuth';
import toast from '@shared/frontend/hooks/useToast';
import { ConfirmDialog } from '@shared/frontend/components/feedback/ConfirmDialog';
import { Modal, Button, Input, Textarea, Select } from '@shared';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import WorkspaceTemplateSelector from './WorkspaceTemplateSelector';
import WorkspaceColorPicker from './WorkspaceColorPicker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import api from '@frontend/services/api';
import { FileText } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  color: string | null;
  description?: string | null;
}

interface Project {
  id: string;
  name: string;
  workspace_id: string;
  description?: string | null;
}

interface WorkspaceMember {
  id: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string | null;
  };
  role: string;
}

interface MeroBoardSidebarProps {
  workspaces?: Workspace[];
  currentWorkspace?: Workspace | null;
  projects?: Project[];
  currentProjectId?: string | null;
  workspaceMembers?: WorkspaceMember[];
  buildHref: (href: string) => string;
  checkActive: (href: string, currentPath: string) => boolean;
  onLogout?: () => void;
}

export default function MeroBoardSidebar({
  workspaces = [],
  currentWorkspace,
  projects = [],
  currentProjectId,
  workspaceMembers = [],
  buildHref,
  checkActive,
  onLogout,
}: MeroBoardSidebarProps) {
  const { theme } = useTheme();
  const { user, organization } = useAuthStore();
  const { appSlug } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('mero-board-sidebar-collapsed');
    return saved === 'true';
  });
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(currentProjectId ? [currentProjectId] : [])
  );
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteWorkspaceConfirm, setShowDeleteWorkspaceConfirm] = useState(false);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showInviteMemberModal, setShowInviteMemberModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'owner' | 'admin' | 'member'>('member');

  // Fetch organization members to check app access
  const { data: orgMembers } = useQuery({
    queryKey: ['organization-members'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data.users || [];
    },
    enabled: showInviteMemberModal && !!currentWorkspace?.id,
  });

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: async (data: { email: string; role: 'owner' | 'admin' | 'member' }) => {
      if (!currentWorkspace?.id) throw new Error('No workspace selected');

      // Find the user in organization members
      const user = orgMembers?.find((m: any) => m.email === data.email);

      if (!user) {
        throw new Error('User is not a member of this organization');
      }

      // User has app access, add to workspace
      const response = await api.post(`/apps/${appSlug}/workspaces/${currentWorkspace.id}/members`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', appSlug, currentWorkspace?.id] });
      queryClient.invalidateQueries({ queryKey: ['workspace-members', appSlug, currentWorkspace?.id] });
      setShowInviteMemberModal(false);
      setInviteEmail('');
      setInviteRole('member');
      toast.success('Member invited successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to invite member');
    },
  });

  const handleInviteMember = () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    if (!currentWorkspace?.id) {
      toast.error('No workspace selected');
      return;
    }
    inviteMemberMutation.mutate({ email: inviteEmail, role: inviteRole });
  };
  const [showCreateFormModal, setShowCreateFormModal] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [workspaceColor, setWorkspaceColor] = useState<string | null>(null);

  // Save collapsed state
  React.useEffect(() => {
    localStorage.setItem('mero-board-sidebar-collapsed', collapsed.toString());
  }, [collapsed]);


  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const isActive = (href: string): boolean => {
    return checkActive(href, location.pathname);
  };

  const handleLogout = async () => {
    try {
      // Only remove app session, keep user logged in to mero jugx
      await logoutFromAppBySlug(appSlug);
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout from app');
    }
    setShowLogoutConfirm(false);
  };

  // Get workspace projects
  const getWorkspaceProjects = (workspaceId: string) => {
    return projects.filter((p) => p.workspace_id === workspaceId);
  };

  // Delete workspace mutation
  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (workspaceId: string) => {
      await api.delete(`/apps/${appSlug}/workspaces/${workspaceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', appSlug] });
      queryClient.invalidateQueries({ queryKey: ['workspace', appSlug] });
      queryClient.invalidateQueries({ queryKey: ['projects', appSlug] });
      queryClient.invalidateQueries({ queryKey: ['all-projects', appSlug] });
      toast.success('Workspace deleted successfully');
      navigate(buildHref(''));
      setShowDeleteWorkspaceConfirm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete workspace');
    },
  });

  // Create workspace mutation
  const createWorkspaceMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; color?: string }) => {
      const response = await api.post(`/apps/${appSlug}/workspaces`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', appSlug] });
      queryClient.invalidateQueries({ queryKey: ['all-projects', appSlug] });
      setShowCreateFormModal(false);
      setWorkspaceName('');
      setWorkspaceDescription('');
      setWorkspaceColor(null);
      toast.success('Workspace created successfully');
      navigate(buildHref(`workspaces/${data.id}`));
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

  const handleDeleteWorkspace = () => {
    if (currentWorkspace) {
      deleteWorkspaceMutation.mutate(currentWorkspace.id);
    }
  };

  const sidebarWidth = collapsed ? 72 : 280;

  return (
    <>
      <div
        className="flex flex-col h-full transition-all duration-300 border-r flex-shrink-0 overflow-hidden"
        style={{
          width: `${sidebarWidth}px`,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }}
      >
        {/* Header - Fixed at top */}
        <div
          className="h-14 px-4 flex items-center justify-between border-b flex-shrink-0"
          style={{ borderColor: theme.colors.border }}
        >
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  <Hash className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2
                    className="text-sm font-semibold truncate"
                    style={{ color: theme.colors.text }}
                  >
                    {currentWorkspace?.name || 'Mero Board'}
                  </h2>
                  {organization?.name && (
                    <p
                      className="text-xs truncate"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {organization.name}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="p-1.5 rounded transition-colors"
                style={{ color: theme.colors.textSecondary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.colors.text;
                  e.currentTarget.style.backgroundColor = theme.colors.border;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.colors.textSecondary;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Collapse sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setCollapsed(false)}
              className="w-full h-full flex items-center justify-center transition-colors"
              style={{ color: theme.colors.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.colors.text;
                e.currentTarget.style.backgroundColor = theme.colors.border;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.colors.textSecondary;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!collapsed ? (
            <div className="flex-1 flex flex-col overflow-hidden py-2">
              {/* Workspace Header */}
              <div className="px-2 mb-2 flex-shrink-0">
                <div className="px-3 py-1.5 mb-1 flex items-center justify-between">
                  <h3
                    className="text-xs font-semibold uppercase tracking-wide flex-1"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Workspaces
                  </h3>
                  <button
                    onClick={() => setShowCreateWorkspaceModal(true)}
                    className="p-1 rounded transition-colors"
                    style={{ color: theme.colors.textSecondary }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.border;
                      e.currentTarget.style.color = theme.colors.text;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = theme.colors.textSecondary;
                    }}
                    title="Create Workspace"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="h-px mb-2" style={{ backgroundColor: theme.colors.border }}></div>
              </div>

              {/* Workspace Switcher */}
              <div className="px-2 mb-4 flex-shrink-0">
                <WorkspaceSwitcher
                  currentWorkspaceId={currentWorkspace?.id || null}
                  onWorkspaceChange={(workspaceId) => {
                    navigate(buildHref(`workspaces/${workspaceId}`));
                  }}
                />
              </div>

              {/* Selected Workspace Name - Only show when workspace is selected */}
              {currentWorkspace && (
                <>
                  <div className="px-2 mb-2 flex-shrink-0">
                    <div className="px-3 py-1.5 mb-1 flex items-center justify-between">
                      <h3
                        className="text-xs font-semibold uppercase tracking-wide flex-1"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        {currentWorkspace.name}
                      </h3>
                    </div>
                  </div>
                  {/* Separator line */}
                  <div className="h-px mx-3 mb-2" style={{ backgroundColor: theme.colors.border }} />

                  {/* Workspace-level navigation: Invite Member, Reports, Settings */}
                  <div className="px-2 mb-2 flex-shrink-0">
                    <div className="space-y-0.5">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (currentWorkspace?.id) {
                            setShowInviteMemberModal(true);
                          } else {
                            toast.error('Please select a workspace first');
                          }
                        }}
                        className="flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors w-full text-left"
                        style={{
                          color: theme.colors.textSecondary,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme.colors.border;
                          e.currentTarget.style.color = theme.colors.text;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = theme.colors.textSecondary;
                        }}
                      >
                        <UserPlus className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Invite Member</span>
                      </button>
                      <Link
                        to={buildHref(`workspaces/${currentWorkspace.id}/reports`)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${isActive(`workspaces/${currentWorkspace.id}/reports`) ? '' : ''
                          }`}
                        style={
                          isActive(`workspaces/${currentWorkspace.id}/reports`)
                            ? {
                              backgroundColor: theme.colors.primary,
                              color: 'white',
                            }
                            : {
                              color: theme.colors.textSecondary,
                            }
                        }
                        onMouseEnter={(e) => {
                          if (!isActive(`workspaces/${currentWorkspace.id}/reports`)) {
                            e.currentTarget.style.backgroundColor = theme.colors.border;
                            e.currentTarget.style.color = theme.colors.text;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive(`workspaces/${currentWorkspace.id}/reports`)) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = theme.colors.textSecondary;
                          }
                        }}
                      >
                        <BarChart className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Reports</span>
                      </Link>
                      <Link
                        to={buildHref(`workspaces/${currentWorkspace.id}/settings`)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${isActive(`workspaces/${currentWorkspace.id}/settings`) ? '' : ''
                          }`}
                        style={
                          isActive(`workspaces/${currentWorkspace.id}/settings`)
                            ? {
                              backgroundColor: theme.colors.primary,
                              color: 'white',
                            }
                            : {
                              color: theme.colors.textSecondary,
                            }
                        }
                        onMouseEnter={(e) => {
                          if (!isActive(`workspaces/${currentWorkspace.id}/settings`)) {
                            e.currentTarget.style.backgroundColor = theme.colors.border;
                            e.currentTarget.style.color = theme.colors.text;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive(`workspaces/${currentWorkspace.id}/settings`)) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = theme.colors.textSecondary;
                          }
                        }}
                      >
                        <Settings className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Settings</span>
                      </Link>
                    </div>
                    {/* Separator line */}
                    <div className="h-px mx-3 my-2" style={{ backgroundColor: theme.colors.border }} />
                  </div>
                </>
              )}

              {/* Projects List */}
              {currentWorkspace && (
                <div className="px-2 mb-2 flex-1 flex flex-col min-h-0">
                  <div className="px-3 py-1.5 mb-1 flex items-center justify-between flex-shrink-0">
                    <h3
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      Projects
                    </h3>
                    <button
                      onClick={() => navigate(buildHref(`workspaces/${currentWorkspace.id}/projects`))}
                      className="p-1 rounded transition-colors"
                      style={{ color: theme.colors.textSecondary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.border;
                        e.currentTarget.style.color = theme.colors.text;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.colors.textSecondary;
                      }}
                      title="Create Project"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Projects List - Collapsible - Scrollable */}
                  {getWorkspaceProjects(currentWorkspace.id).length > 0 ? (
                    <div className="flex-1 overflow-y-auto scrollbar-thin space-y-0.5 min-h-0" style={{ scrollbarColor: `${theme.colors.border} transparent` }}>
                      {getWorkspaceProjects(currentWorkspace.id).map((project) => {
                        const projectActive = isActive(`workspaces/${currentWorkspace.id}/projects/${project.id}`);
                        const tasksActive = isActive(`workspaces/${currentWorkspace.id}/projects/${project.id}/tasks`);
                        const reportsActive = isActive(`workspaces/${currentWorkspace.id}/projects/${project.id}/reports`);
                        const isExpanded = expandedProjects.has(project.id);
                        const isProjectActive = projectActive || tasksActive || reportsActive;

                        return (
                          <div key={project.id}>
                            <div className="flex items-center">
                              <button
                                onClick={() => toggleProject(project.id)}
                                className="p-1 rounded transition-colors flex-shrink-0"
                                style={{ color: theme.colors.textSecondary }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = theme.colors.text;
                                  e.currentTarget.style.backgroundColor = theme.colors.border;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = theme.colors.textSecondary;
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </button>
                              <Link
                                to={buildHref(`workspaces/${currentWorkspace.id}/projects/${project.id}`)}
                                className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${isProjectActive ? '' : ''
                                  }`}
                                style={
                                  isProjectActive
                                    ? {
                                      backgroundColor: theme.colors.primary,
                                      color: 'white',
                                    }
                                    : {
                                      color: theme.colors.textSecondary,
                                    }
                                }
                                onMouseEnter={(e) => {
                                  if (!isProjectActive) {
                                    e.currentTarget.style.backgroundColor = theme.colors.border;
                                    e.currentTarget.style.color = theme.colors.text;
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isProjectActive) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = theme.colors.textSecondary;
                                  }
                                }}
                              >
                                <FolderKanban className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{project.name}</span>
                              </Link>
                            </div>
                            {/* Project items under project - when expanded */}
                            {isExpanded && (
                              <div className="ml-4 mt-0.5 space-y-0.5">
                                <Link
                                  to={buildHref(`workspaces/${currentWorkspace.id}/projects/${project.id}/tasks`)}
                                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${tasksActive ? '' : ''
                                    }`}
                                  style={
                                    tasksActive
                                      ? {
                                        backgroundColor: theme.colors.primary + '80',
                                        color: 'white',
                                      }
                                      : {
                                        color: theme.colors.textSecondary,
                                      }
                                  }
                                  onMouseEnter={(e) => {
                                    if (!tasksActive) {
                                      e.currentTarget.style.backgroundColor = theme.colors.border;
                                      e.currentTarget.style.color = theme.colors.text;
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!tasksActive) {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.color = theme.colors.textSecondary;
                                    }
                                  }}
                                >
                                  <CheckSquare className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="truncate">Tasks</span>
                                </Link>
                                <Link
                                  to={buildHref(`workspaces/${currentWorkspace.id}/projects/${project.id}/reports`)}
                                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${reportsActive ? '' : ''
                                    }`}
                                  style={
                                    reportsActive
                                      ? {
                                        backgroundColor: theme.colors.primary + '80',
                                        color: 'white',
                                      }
                                      : {
                                        color: theme.colors.textSecondary,
                                      }
                                  }
                                  onMouseEnter={(e) => {
                                    if (!reportsActive) {
                                      e.currentTarget.style.backgroundColor = theme.colors.border;
                                      e.currentTarget.style.color = theme.colors.text;
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!reportsActive) {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.color = theme.colors.textSecondary;
                                    }
                                  }}
                                >
                                  <BarChart className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="truncate">Reports</span>
                                </Link>
                                <Link
                                  to={buildHref(`workspaces/${currentWorkspace.id}/projects/${project.id}`)}
                                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${projectActive && !tasksActive && !reportsActive ? '' : ''
                                    }`}
                                  style={
                                    projectActive && !tasksActive && !reportsActive
                                      ? {
                                        backgroundColor: theme.colors.primary + '80',
                                        color: 'white',
                                      }
                                      : {
                                        color: theme.colors.textSecondary,
                                      }
                                  }
                                  onMouseEnter={(e) => {
                                    if (!(projectActive && !tasksActive && !reportsActive)) {
                                      e.currentTarget.style.backgroundColor = theme.colors.border;
                                      e.currentTarget.style.color = theme.colors.text;
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!(projectActive && !tasksActive && !reportsActive)) {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.color = theme.colors.textSecondary;
                                    }
                                  }}
                                >
                                  <Target className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="truncate">Epics</span>
                                </Link>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-3 py-2 text-xs flex-shrink-0" style={{ color: theme.colors.textSecondary }}>
                      No projects yet
                    </div>
                  )}
                </div>
              )}

              {/* Members Section - At the end, only show when in a workspace */}
              {currentWorkspace && workspaceMembers && workspaceMembers.length > 0 && (
                <div className="px-2 mb-2 mt-auto flex-shrink-0">
                  <div className="h-[1px] mb-2" style={{ backgroundColor: theme.colors.border }} />
                  <div className="px-3 py-1.5 mb-1">
                    <h3
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      Members ({workspaceMembers.length})
                    </h3>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin" style={{ scrollbarColor: `${theme.colors.border} transparent` }}>
                    {workspaceMembers.slice(0, 8).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded text-sm"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        {member.user.avatar_url ? (
                          <img
                            src={member.user.avatar_url}
                            alt={`${member.user.first_name} ${member.user.last_name}`}
                            className="w-6 h-6 rounded-full flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                            style={{
                              backgroundColor: theme.colors.primary,
                              color: 'white',
                            }}
                          >
                            {member.user.first_name[0]}{member.user.last_name[0]}
                          </div>
                        )}
                        <span className="truncate text-xs">
                          {member.user.first_name} {member.user.last_name}
                        </span>
                      </div>
                    ))}
                    {workspaceMembers.length > 8 && (
                      <div className="px-3 py-1 text-xs" style={{ color: theme.colors.textSecondary }}>
                        +{workspaceMembers.length - 8} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Collapsed view - icons only
            <div className="py-2 space-y-1">
              {currentWorkspace && (
                <>
                  {/* Workspace Icon */}
                  <Link
                    to={buildHref(`workspaces/${currentWorkspace.id}`)}
                    className="w-full flex items-center justify-center p-2 rounded transition-colors"
                    style={
                      isActive(`workspaces/${currentWorkspace.id}`) && !isActive(`workspaces/${currentWorkspace.id}/projects`) && !isActive(`workspaces/${currentWorkspace.id}/settings`) && !isActive(`workspaces/${currentWorkspace.id}/reports`)
                        ? {
                          backgroundColor: theme.colors.primary,
                          color: 'white',
                        }
                        : {
                          color: theme.colors.textSecondary,
                        }
                    }
                    onMouseEnter={(e) => {
                      if (!(isActive(`workspaces/${currentWorkspace.id}`) && !isActive(`workspaces/${currentWorkspace.id}/projects`) && !isActive(`workspaces/${currentWorkspace.id}/settings`) && !isActive(`workspaces/${currentWorkspace.id}/reports`))) {
                        e.currentTarget.style.backgroundColor = theme.colors.border;
                        e.currentTarget.style.color = theme.colors.text;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!(isActive(`workspaces/${currentWorkspace.id}`) && !isActive(`workspaces/${currentWorkspace.id}/projects`) && !isActive(`workspaces/${currentWorkspace.id}/settings`) && !isActive(`workspaces/${currentWorkspace.id}/reports`))) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.colors.textSecondary;
                      }
                    }}
                    title={currentWorkspace.name}
                  >
                    {(() => {
                      const emojiMatch = currentWorkspace.name.match(/^[\p{Emoji}\u200d]+/u);
                      const emoji = emojiMatch ? emojiMatch[0] : null;
                      if (emoji) {
                        return <span className="text-lg">{emoji}</span>;
                      }
                      if (currentWorkspace.color) {
                        return (
                          <div
                            className="h-5 w-5 rounded"
                            style={{ backgroundColor: currentWorkspace.color }}
                          />
                        );
                      }
                      return <LayoutDashboard className="h-5 w-5" />;
                    })()}
                  </Link>

                  {/* Invite Member */}
                  <button
                    onClick={() => setShowInviteMemberModal(true)}
                    className="w-full flex items-center justify-center p-2 rounded transition-colors"
                    style={{
                      color: theme.colors.textSecondary,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.border;
                      e.currentTarget.style.color = theme.colors.text;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = theme.colors.textSecondary;
                    }}
                    title="Invite Member"
                  >
                    <UserPlus className="h-5 w-5" />
                  </button>

                  {/* Reports */}
                  <Link
                    to={buildHref(`workspaces/${currentWorkspace.id}/reports`)}
                    className="w-full flex items-center justify-center p-2 rounded transition-colors"
                    style={
                      isActive(`workspaces/${currentWorkspace.id}/reports`)
                        ? {
                          backgroundColor: theme.colors.primary,
                          color: 'white',
                        }
                        : {
                          color: theme.colors.textSecondary,
                        }
                    }
                    onMouseEnter={(e) => {
                      if (!isActive(`workspaces/${currentWorkspace.id}/reports`)) {
                        e.currentTarget.style.backgroundColor = theme.colors.border;
                        e.currentTarget.style.color = theme.colors.text;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(`workspaces/${currentWorkspace.id}/reports`)) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.colors.textSecondary;
                      }
                    }}
                    title="Reports"
                  >
                    <BarChart className="h-5 w-5" />
                  </Link>

                  {/* Settings */}
                  <Link
                    to={buildHref(`workspaces/${currentWorkspace.id}/settings`)}
                    className="w-full flex items-center justify-center p-2 rounded transition-colors"
                    style={
                      isActive(`workspaces/${currentWorkspace.id}/settings`)
                        ? {
                          backgroundColor: theme.colors.primary,
                          color: 'white',
                        }
                        : {
                          color: theme.colors.textSecondary,
                        }
                    }
                    onMouseEnter={(e) => {
                      if (!isActive(`workspaces/${currentWorkspace.id}/settings`)) {
                        e.currentTarget.style.backgroundColor = theme.colors.border;
                        e.currentTarget.style.color = theme.colors.text;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(`workspaces/${currentWorkspace.id}/settings`)) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.colors.textSecondary;
                      }
                    }}
                    title="Settings"
                  >
                    <Settings className="h-5 w-5" />
                  </Link>

                  {/* Projects - Show first 5 projects */}
                  {getWorkspaceProjects(currentWorkspace.id).slice(0, 5).map((project) => {
                    const projectActive = isActive(`workspaces/${currentWorkspace.id}/projects/${project.id}`);
                    const tasksActive = isActive(`workspaces/${currentWorkspace.id}/projects/${project.id}/tasks`);
                    const reportsActive = isActive(`workspaces/${currentWorkspace.id}/projects/${project.id}/reports`);
                    const isProjectActive = projectActive || tasksActive || reportsActive;

                    return (
                      <Link
                        key={project.id}
                        to={buildHref(`workspaces/${currentWorkspace.id}/projects/${project.id}`)}
                        className="w-full flex items-center justify-center p-2 rounded transition-colors"
                        style={
                          isProjectActive
                            ? {
                              backgroundColor: theme.colors.primary,
                              color: 'white',
                            }
                            : {
                              color: theme.colors.textSecondary,
                            }
                        }
                        onMouseEnter={(e) => {
                          if (!isProjectActive) {
                            e.currentTarget.style.backgroundColor = theme.colors.border;
                            e.currentTarget.style.color = theme.colors.text;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isProjectActive) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = theme.colors.textSecondary;
                          }
                        }}
                        title={project.name}
                      >
                        {(() => {
                          const emojiMatch = project.name.match(/^[\p{Emoji}\u200d]+/u);
                          const emoji = emojiMatch ? emojiMatch[0] : null;
                          if (emoji) {
                            return <span className="text-lg">{emoji}</span>;
                          }
                          return <FolderKanban className="h-5 w-5" />;
                        })()}
                      </Link>
                    );
                  })}

                  {/* Members */}
                  {workspaceMembers && workspaceMembers.length > 0 && (
                    <Link
                      to={buildHref(`workspaces/${currentWorkspace.id}`)}
                      className="w-full flex items-center justify-center p-2 rounded transition-colors"
                      style={{ color: theme.colors.textSecondary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.border;
                        e.currentTarget.style.color = theme.colors.text;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.colors.textSecondary;
                      }}
                      title={`Members (${workspaceMembers.length})`}
                    >
                      <Users className="h-5 w-5" />
                    </Link>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* User Panel at Bottom */}
        {!collapsed && user && (
          <div
            className="px-2 py-2 border-t flex-shrink-0"
            style={{ borderColor: theme.colors.border }}
          >
            <div
              className="flex items-center gap-2 px-2 py-1.5 rounded transition-colors"
              style={{ backgroundColor: theme.colors.background }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.border;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.background;
              }}
            >
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: theme.colors.primary }}
              >
                <span className="text-xs font-semibold text-white">
                  {user?.first_name?.[0]}
                  {user?.last_name?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: theme.colors.text }}>
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs truncate" style={{ color: theme.colors.textSecondary }}>
                  {user?.email}
                </p>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="p-1.5 rounded transition-colors"
                style={{ color: theme.colors.textSecondary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ed4245';
                  e.currentTarget.style.backgroundColor = theme.colors.border;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.colors.textSecondary;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Logout from app"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Logout"
        message="Are you sure you want to logout? You will need to login again to access your account."
        confirmText="Logout"
        cancelText="Cancel"
        variant="warning"
        theme={theme}
      />

      {/* Delete Workspace Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteWorkspaceConfirm}
        onClose={() => setShowDeleteWorkspaceConfirm(false)}
        onConfirm={handleDeleteWorkspace}
        title="Delete Workspace"
        message={`Are you sure you want to delete "${currentWorkspace?.name}"? This action cannot be undone and will delete all projects and tasks in this workspace.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteWorkspaceMutation.isPending}
        theme={theme}
      />

      {/* Create Workspace Modal - Choice */}
      <Modal
        isOpen={showCreateWorkspaceModal}
        onClose={() => setShowCreateWorkspaceModal(false)}
        title="Create Workspace"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
            Choose how you want to create your workspace:
          </p>
          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateWorkspaceModal(false);
                setShowTemplateModal(true);
              }}
              className="w-full justify-start"
            >
              <FileText className="mr-2 h-4 w-4" />
              Use Template
            </Button>
            <Button
              onClick={() => {
                setShowCreateWorkspaceModal(false);
                setShowCreateFormModal(true);
              }}
              className="w-full justify-start"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create from Scratch
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
        size="xl"
      >
        <WorkspaceTemplateSelector
          onTemplateUsed={(workspaceId) => {
            setShowTemplateModal(false);
            navigate(buildHref(`workspaces/${workspaceId}`));
          }}
          onCancel={() => setShowTemplateModal(false)}
        />
      </Modal>

      {/* Create Workspace Form Modal */}
      <Modal
        isOpen={showCreateFormModal}
        onClose={() => {
          setShowCreateFormModal(false);
          setWorkspaceName('');
          setWorkspaceDescription('');
          setWorkspaceColor(null);
        }}
        title="Create New Workspace"
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
                setShowCreateFormModal(false);
                setWorkspaceName('');
                setWorkspaceDescription('');
                setWorkspaceColor(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkspace}
              disabled={!workspaceName.trim() || createWorkspaceMutation.isPending}
              isLoading={createWorkspaceMutation.isPending}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Invite Member Modal */}
      <Modal
        isOpen={showInviteMemberModal}
        onClose={() => {
          setShowInviteMemberModal(false);
          setInviteEmail('');
          setInviteRole('member');
        }}
        title="Invite Member"
        theme={theme}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              Email Address
            </label>
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@example.com"
              style={{
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            />
            <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
              User must be a member of your organization
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              Role
            </label>
            <Select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'owner' | 'admin' | 'member')}
              options={[
                { value: 'member', label: 'Member' },
                { value: 'admin', label: 'Admin' },
                { value: 'owner', label: 'Owner' },
              ]}
              style={{
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowInviteMemberModal(false);
                setInviteEmail('');
                setInviteRole('member');
              }}
              style={{
                borderColor: theme.colors.border,
                color: theme.colors.text,
                backgroundColor: theme.colors.surface,
              }}
              onMouseEnter={(e: any) => {
                e.currentTarget.style.backgroundColor = theme.colors.border;
              }}
              onMouseLeave={(e: any) => {
                e.currentTarget.style.backgroundColor = theme.colors.surface;
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteMember}
              disabled={!inviteEmail.trim() || inviteMemberMutation.isPending}
              isLoading={inviteMemberMutation.isPending}
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.buttonText || '#ffffff',
              }}
              onMouseEnter={(e: any) => {
                if (!inviteMemberMutation.isPending && inviteEmail.trim()) {
                  e.currentTarget.style.backgroundColor = theme.colors.secondary;
                }
              }}
              onMouseLeave={(e: any) => {
                if (!inviteMemberMutation.isPending && inviteEmail.trim()) {
                  e.currentTarget.style.backgroundColor = theme.colors.primary;
                }
              }}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Invitation
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

