import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useParams } from 'react-router-dom';
import {
  Loader2,
  Plus,
  FolderKanban,
  FolderOpen,
  CheckSquare,
  User,
  Calendar,
  Tag,
  MoreVertical,
  Edit,
  Trash2,
  AlertCircle,
  ShoppingCart,
  LogOut,
  X,
  Search,
  Filter,
  BarChart3,
  Clock,
  Target,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { usePermissions } from '../hooks/usePermissions';

type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  owner_id?: string | null;
  created_by?: string;
  owner?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
}

interface Epic {
  id: string;
  name: string;
  description?: string;
  project_id: string;
  assignee?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  project?: Project;
  epic?: Epic;
  epic_id?: string;
  project_id?: string;
  due_date?: string;
  tags?: string[];
  created_at: string;
  ticket_id?: string;
  estimated_hours?: number;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const TASK_COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-500/20 border-gray-500/50' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500/20 border-blue-500/50' },
  { id: 'in_review', title: 'In Review', color: 'bg-yellow-500/20 border-yellow-500/50' },
  { id: 'done', title: 'Done', color: 'bg-green-500/20 border-green-500/50' },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export default function MeroBoard({ onLogout }: { onLogout?: () => void }) {
  const { organization, _hasHydrated, isAuthenticated, accessToken, user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { appId } = useParams<{ appId: string }>();
  const appIdNum = appId ? parseInt(appId, 10) : null;
  const { hasPermission, isOrganizationOwner, isLoadingPermissions } = usePermissions();
  
  // Check permissions for project and task management
  const canCreateProject = isOrganizationOwner || hasPermission('projects.create') || true; // Allow by default for now
  const canEditProject = isOrganizationOwner || hasPermission('projects.edit') || true;
  const canDeleteProject = isOrganizationOwner || hasPermission('projects.delete') || true;
  const canCreateTask = isOrganizationOwner || hasPermission('tasks.create') || true;
  const canEditTask = isOrganizationOwner || hasPermission('tasks.edit') || true;
  const canDeleteTask = isOrganizationOwner || hasPermission('tasks.delete') || true;
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedEpicId, setSelectedEpicId] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showCreateEpicModal, setShowCreateEpicModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [filterAssignee, setFilterAssignee] = useState<string | 'all'>('all');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskTags, setNewTaskTags] = useState<string[]>([]);
  const [newTaskTagInput, setNewTaskTagInput] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState<string>('');
  const [newTaskEpicId, setNewTaskEpicId] = useState<string>('');
  const [newEpicName, setNewEpicName] = useState('');
  const [newEpicDescription, setNewEpicDescription] = useState('');

  // Fetch projects
  const { data: projectsData, isLoading: projectsLoading, error: projectsError } = useQuery({
    queryKey: ['projects', organization?.id],
    queryFn: async () => {
      try {
        const response = await api.get('/boards/projects');
        const data = response.data;
        return Array.isArray(data) ? data : [];
      } catch (error: any) {
        // Handle 403 and 400 errors gracefully - user might not have app access
        if (error?.response?.status === 403 || error?.response?.status === 400) {
          return [];
        }
        return [];
      }
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken && !!organization?.id,
    retry: false,
  });

  // Fetch tasks
  const { data: tasksData, isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ['tasks', organization?.id, selectedProjectId, selectedEpicId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedProjectId) params.append('project_id', selectedProjectId);
      if (selectedEpicId) params.append('epic_id', selectedEpicId);
      const queryString = params.toString();
      try {
        const response = await api.get(`/boards/tasks${queryString ? `?${queryString}` : ''}`);
        const data = response.data;
        return Array.isArray(data) ? data : [];
      } catch (error: any) {
        // Handle 400 errors - might be invalid parameters, return empty array
        if (error?.response?.status === 400) {
          console.warn('Tasks API returned 400:', error?.response?.data);
          return []; // Return empty array for 400 errors
        }
        // Handle 403 errors gracefully - user might not have app access
        // Re-throw to preserve error state for access checking
        if (error?.response?.status === 403) {
          throw error; // Re-throw so we can detect it in hasAccessError
        }
        return [];
      }
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken && !!organization?.id,
    retry: false, // Don't retry on any errors
  });

  // Fetch epics
  const { data: epicsData, error: epicsError } = useQuery({
    queryKey: ['epics', organization?.id, selectedProjectId],
    queryFn: async () => {
      const params = selectedProjectId ? `?project_id=${selectedProjectId}` : '';
      try {
        const response = await api.get(`/boards/epics${params}`);
        const data = response.data;
        return Array.isArray(data) ? data : [];
      } catch (error: any) {
        // Handle 403 errors gracefully - user might not have app access
        if (error?.response?.status === 400 || error?.response?.status === 403) {
          return [];
        }
        return [];
      }
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken && !!organization?.id,
    retry: false,
  });

  // Fetch users with app access for assignee selection
  const { data: appAccessUsersData } = useQuery({
    queryKey: ['app-access-users', organization?.id, appIdNum],
    queryFn: async () => {
      if (!organization?.id || !appIdNum) return null;
      try {
        const response = await api.get(`/organizations/${organization.id}/apps/${appIdNum}/access`);
        const accessData = response.data?.data || response.data || [];
        // Extract user objects from access data
        return accessData.map((access: any) => {
          if (access.user && typeof access.user === 'object') {
            return access.user; // Return full user object
          }
          return null;
        }).filter(Boolean);
      } catch (error: any) {
        // If we can't get app access users, fall back to all users
        console.warn('Failed to fetch app access users, falling back to all users:', error);
        return null; // Return null to trigger fallback
      }
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken && !!organization?.id && !!appIdNum,
    retry: false,
  });

  // Fetch all users as fallback (if app access endpoint fails or returns empty)
  const { data: usersData, error: usersError } = useQuery({
    queryKey: ['users', organization?.id],
    queryFn: async () => {
      try {
        const response = await api.get('/users');
        // Handle different response structures - check for data.data or data array
        let data = response.data;
        if (data?.data && Array.isArray(data.data)) {
          data = data.data;
        } else if (!Array.isArray(data)) {
          data = [];
        }
        return data;
      } catch (error: any) {
        // Handle 403 errors gracefully - user might not have access
        if (error?.response?.status === 403) {
          return [];
        }
        return [];
      }
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken && !!organization?.id,
    retry: false,
  });

  const projects: Project[] = Array.isArray(projectsData) ? projectsData : [];
  const tasks: Task[] = Array.isArray(tasksData) ? tasksData : [];
  const epics: Epic[] = Array.isArray(epicsData) ? epicsData : [];
  
  // Use app access users if available, otherwise fall back to all users
  const allUsers: User[] = Array.isArray(usersData) ? usersData : [];
  const appAccessUsers: User[] = Array.isArray(appAccessUsersData) ? appAccessUsersData : [];
  
  // Filter users to only show those with app access
  // If we have app access users, use them; otherwise use all users as fallback
  const users: User[] = appAccessUsers.length > 0
    ? appAccessUsers
    : allUsers; // Fallback to all users if we couldn't get app access list

  // Compute analytics from existing data
  const analyticsData = useMemo(() => {
    const taskStats = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      in_review: tasks.filter((t) => t.status === 'in_review').length,
      done: tasks.filter((t) => t.status === 'done').length,
    };

    const priorityStats = {
      urgent: tasks.filter((t) => t.priority === 'urgent').length,
      high: tasks.filter((t) => t.priority === 'high').length,
      medium: tasks.filter((t) => t.priority === 'medium').length,
      low: tasks.filter((t) => t.priority === 'low').length,
    };

    const overdueTasks = tasks.filter((task) => {
      if (!task.due_date || task.status === 'done') return false;
      return new Date(task.due_date) < new Date();
    }).length;

    const completionRate = taskStats.total > 0 
      ? Math.round((taskStats.done / taskStats.total) * 100) 
      : 0;

    const projectStats = {
      total: projects.length,
      active: projects.filter((p) => p.status === 'active' || !p.status).length,
      completed: projects.filter((p) => p.status === 'completed').length,
    };

    const epicStats = {
      total: epics.length,
      active: epics.length, // All epics are considered active for now
      completed: 0, // Epics don't have status field yet
    };

    return {
      taskStats,
      priorityStats,
      overdueTasks,
      completionRate,
      projectStats,
      epicStats,
    };
  }, [tasks, projects, epics]);

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Filter by project
    if (selectedProjectId) {
      filtered = filtered.filter((task) => task.project_id === selectedProjectId || task.project?.id === selectedProjectId);
    }

    // Filter by epic
    if (selectedEpicId) {
      filtered = filtered.filter((task) => task.epic_id === selectedEpicId || task.epic?.id === selectedEpicId);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((task) => task.status === filterStatus);
    }

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter((task) => task.priority === filterPriority);
    }

    // Filter by assignee
    if (filterAssignee !== 'all') {
      filtered = filtered.filter((task) => task.assignee?.id === filterAssignee);
    }

    // Search by title/description
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query)),
      );
    }

    return filtered;
  }, [tasks, selectedProjectId, selectedEpicId, filterStatus, filterPriority, filterAssignee, searchQuery]);

  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks.filter((task) => task.status === status);
  };

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await api.post('/boards/projects', { name });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', organization?.id] });
      setSelectedProjectId(data.id);
      setShowCreateProjectModal(false);
      setNewProjectName('');
      toast.success('Project created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create project');
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      project_id?: string;
      epic_id?: string;
      priority?: TaskPriority;
      assignee_id?: string;
      due_date?: string;
      tags?: string[];
    }) => {
      const response = await api.post('/boards/tasks', {
        title: data.title,
        description: data.description,
        project_id: data.project_id,
        epic_id: data.epic_id,
        priority: data.priority || 'medium',
        assignee_id: data.assignee_id,
        due_date: data.due_date,
        tags: data.tags || [],
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', organization?.id] });
      setShowCreateTaskModal(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      setNewTaskAssignee('');
      setNewTaskDueDate('');
      setNewTaskTags([]);
      toast.success('Task created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create task');
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: any }) => {
      const response = await api.patch(`/boards/tasks/${taskId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', organization?.id] });
      toast.success('Task updated successfully');
      setShowEditTaskModal(false);
      setSelectedTask(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update task');
    },
  });

  // Update task status mutation (for drag and drop)
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: TaskStatus }) => {
      const response = await api.patch(`/boards/tasks/${taskId}`, { status: newStatus });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', organization?.id] });
      toast.success('Task status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update task status');
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/boards/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', organization?.id] });
      toast.success('Task deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: any }) => {
      const response = await api.patch(`/boards/projects/${projectId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', organization?.id] });
      setShowEditProjectModal(false);
      setEditingProject(null);
      toast.success('Project updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update project');
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await api.delete(`/boards/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', organization?.id] });
      setSelectedProjectId(null);
      toast.success('Project deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete project');
    },
  });

  // Create epic mutation
  const createEpicMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; project_id: string; assignee_id?: string }) => {
      const response = await api.post('/boards/epics', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epics', organization?.id] });
      setShowCreateEpicModal(false);
      setEditingProject(null);
      setNewEpicName('');
      setNewEpicDescription('');
      toast.success('Epic created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create epic');
    },
  });

  // Delete epic mutation
  const deleteEpicMutation = useMutation({
    mutationFn: async (epicId: string) => {
      await api.delete(`/boards/epics/${epicId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epics', organization?.id] });
      if (selectedEpicId) {
        setSelectedEpicId(null);
      }
      toast.success('Epic deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete epic');
    },
  });

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    if (draggedTask) {
      updateTaskStatusMutation.mutate({ taskId: draggedTask, newStatus });
      setDraggedTask(null);
    }
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProjectMutation.mutate(newProjectName.trim());
    }
  };

  const handleCreateTask = () => {
    if (newTaskTitle.trim()) {
      createTaskMutation.mutate({
        title: newTaskTitle.trim(),
        project_id: selectedProjectId || undefined,
      });
    }
  };

  // Check for access errors (403) - if all data is empty and we're not loading, likely no access
  const hasAccessError = 
    (projectsError && (projectsError as any).response?.status === 403) ||
    (tasksError && (tasksError as any).response?.status === 403) ||
    (!projectsLoading && !tasksLoading && projects.length === 0 && tasks.length === 0 && 
     ((projectsError as any)?.response?.status === 403 || (tasksError as any)?.response?.status === 403));
  
  // Only show server error for 500 errors, not 400 (400 errors are handled gracefully)
  const hasServerError = 
    (projectsError && (projectsError as any).response?.status === 500) ||
    (tasksError && (tasksError as any).response?.status === 500) ||
    (epicsError && (epicsError as any).response?.status === 500) ||
    (usersError && (usersError as any).response?.status === 500);

  if (hasAccessError) {
    return (
      <div className="h-full bg-[#36393f] flex items-center justify-center p-6">
        <div className="bg-[#2f3136] rounded-lg p-12 border border-[#202225] text-center max-w-2xl">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-yellow-500/20 rounded-full">
              <AlertCircle className="h-12 w-12 text-yellow-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Mero Board Not Available</h3>
          <p className="text-[#b9bbbe] mb-2">
            You do not have access to Mero Board app.
          </p>
          <p className="text-[#b9bbbe] mb-6">
            Please contact your organization owner to grant you access to this app.
          </p>
        </div>
      </div>
    );
  }

  if (hasServerError) {
    return (
      <div className="h-full bg-[#36393f] flex items-center justify-center p-6">
        <div className="bg-[#2f3136] rounded-lg p-12 border border-[#202225] text-center max-w-2xl">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-red-500/20 rounded-full">
              <AlertCircle className="h-12 w-12 text-red-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Server Error</h3>
          <p className="text-[#b9bbbe] mb-2">
            A server error occurred while loading Mero Board.
          </p>
          <p className="text-[#b9bbbe] mb-6">
            Please try again later or contact support if the problem persists.
          </p>
        </div>
      </div>
    );
  }

  if (projectsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-[#5865f2]" />
      </div>
    );
  }

  return (
    <div className="h-full bg-[#36393f] flex">
      {/* Sidebar - Projects */}
      <div className="w-64 bg-[#2f3136] border-r border-[#202225] flex flex-col">
        <div className="p-4 border-b border-[#202225]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Projects
            </h2>
            {canCreateProject && (
              <button
                onClick={() => setShowCreateProjectModal(true)}
                className="p-1.5 hover:bg-[#36393f] rounded-lg transition-all hover:scale-110 hover:rotate-90"
                title="Create Project"
              >
                <Plus className="h-4 w-4 text-[#b9bbbe] hover:text-[#5865f2]" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <button
            onClick={() => setSelectedProjectId(null)}
            className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-all font-medium ${
              selectedProjectId === null
                ? 'bg-[#5865f2] text-white shadow-lg shadow-[#5865f2]/30'
                : 'text-[#b9bbbe] hover:bg-[#36393f] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              <span className="text-sm font-medium">All Tasks</span>
            </div>
          </button>

          {projects.map((project) => {
            const isProjectOwner = project.owner_id === user?.id || project.created_by === user?.id;
            const canEditThisProject = isProjectOwner || canEditProject;
            const canDeleteThisProject = isProjectOwner || canDeleteProject;
            
            return (
              <div key={project.id} className="group relative">
                <button
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors flex items-center justify-between ${
                    selectedProjectId === project.id
                      ? 'bg-[#5865f2] text-white'
                      : 'text-[#b9bbbe] hover:bg-[#36393f]'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <FolderOpen className="h-4 w-4" />
                    <span className="text-sm font-medium">{project.name}</span>
                  </div>
                  {(canEditThisProject || canDeleteThisProject) && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canEditThisProject && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProject(project);
                            setShowEditProjectModal(true);
                          }}
                          className="p-1 hover:bg-[#40444b] rounded transition-colors"
                          title="Edit Project"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                      )}
                      {canDeleteThisProject && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete project "${project.name}"? This will also delete all associated tasks and epics.`)) {
                              deleteProjectMutation.mutate(project.id);
                            }
                          }}
                          className="p-1 hover:bg-[#40444b] rounded transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                </button>
              </div>
            );
          })}

          {projects.length === 0 && (
            <div className="text-center py-8 px-4">
              <p className="text-sm text-[#8e9297] mb-4">No projects yet</p>
              {canCreateProject && (
                <button
                  onClick={() => setShowCreateProjectModal(true)}
                  className="text-sm text-[#5865f2] hover:text-[#4752c4] transition-colors"
                >
                  Create your first project
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Logout Button */}
        {onLogout && (
          <div className="p-4 border-t border-[#202225] mt-auto">
            <button
              onClick={onLogout}
              className="w-full px-3 py-2 rounded-lg text-sm font-medium text-[#b9bbbe] hover:bg-[#36393f] hover:text-white transition-colors flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout from App
            </button>
          </div>
        )}
      </div>

      {/* Main Content - Kanban Board or Analytics */}
      <div className="flex-1 flex flex-col">
        {showAnalytics ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Analytics Dashboard</h2>
                <p className="text-[#b9bbbe]">Overview of your project management metrics</p>
              </div>
              <button
                onClick={() => setShowAnalytics(false)}
                className="px-4 py-2 bg-[#36393f] text-[#b9bbbe] rounded-lg hover:bg-[#40444b] hover:text-white transition-all flex items-center gap-2 font-medium"
              >
                <X className="h-4 w-4" />
                Back to Tasks
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Task Stats */}
              <div className="bg-[#2f3136] border border-[#202225] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#b9bbbe]">Total Tasks</h3>
                  <CheckSquare className="h-4 w-4 text-[#5865f2]" />
                </div>
                <p className="text-2xl font-bold text-white">{analyticsData.taskStats?.total || 0}</p>
              </div>

              <div className="bg-[#2f3136] border border-[#202225] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#b9bbbe]">Completed</h3>
                  <CheckSquare className="h-4 w-4 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white">{analyticsData.taskStats?.done || 0}</p>
                <p className="text-xs text-[#8e9297] mt-1">
                  {analyticsData.completionRate || 0}% completion rate
                </p>
              </div>

              <div className="bg-[#2f3136] border border-[#202225] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#b9bbbe]">In Progress</h3>
                  <Clock className="h-4 w-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white">{analyticsData.taskStats?.in_progress || 0}</p>
              </div>

              <div className="bg-[#2f3136] border border-[#202225] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#b9bbbe]">Overdue</h3>
                  <AlertCircle className="h-4 w-4 text-red-400" />
                </div>
                <p className="text-2xl font-bold text-red-400">{analyticsData.overdueTasks || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Priority Breakdown */}
              <div className="bg-[#2f3136] border border-[#202225] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Priority Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-[#b9bbbe]">Urgent</span>
                    </div>
                    <span className="text-white font-semibold">{analyticsData.priorityStats?.urgent || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-[#b9bbbe]">High</span>
                    </div>
                    <span className="text-white font-semibold">{analyticsData.priorityStats?.high || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-[#b9bbbe]">Medium</span>
                    </div>
                    <span className="text-white font-semibold">{analyticsData.priorityStats?.medium || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                      <span className="text-[#b9bbbe]">Low</span>
                    </div>
                    <span className="text-white font-semibold">{analyticsData.priorityStats?.low || 0}</span>
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="bg-[#2f3136] border border-[#202225] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Status Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#b9bbbe]">To Do</span>
                    <span className="text-white font-semibold">{analyticsData.taskStats?.todo || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#b9bbbe]">In Progress</span>
                    <span className="text-white font-semibold">{analyticsData.taskStats?.in_progress || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#b9bbbe]">In Review</span>
                    <span className="text-white font-semibold">{analyticsData.taskStats?.in_review || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#b9bbbe]">Done</span>
                    <span className="text-white font-semibold">{analyticsData.taskStats?.done || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Projects Stats */}
              <div className="bg-[#2f3136] border border-[#202225] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FolderKanban className="h-5 w-5" />
                  Projects
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#b9bbbe]">Total</span>
                    <span className="text-white font-semibold">{analyticsData.projectStats?.total || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#b9bbbe]">Active</span>
                    <span className="text-white font-semibold">{analyticsData.projectStats?.active || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#b9bbbe]">Completed</span>
                    <span className="text-white font-semibold">{analyticsData.projectStats?.completed || 0}</span>
                  </div>
                </div>
              </div>

              {/* Epics Stats */}
              <div className="bg-[#2f3136] border border-[#202225] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Epics
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#b9bbbe]">Total</span>
                    <span className="text-white font-semibold">{analyticsData.epicStats?.total || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#b9bbbe]">Active</span>
                    <span className="text-white font-semibold">{analyticsData.epicStats?.active || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#b9bbbe]">Completed</span>
                    <span className="text-white font-semibold">{analyticsData.epicStats?.completed || 0}</span>
                  </div>
                </div>
              </div>

              {/* Completion Rate */}
              <div className="bg-[#2f3136] border border-[#202225] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Completion Rate</h3>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-white">{analyticsData.completionRate || 0}%</span>
                </div>
                <div className="mt-4 w-full bg-[#202225] rounded-full h-2">
                  <div
                    className="bg-[#5865f2] h-2 rounded-full transition-all"
                    style={{ width: `${analyticsData.completionRate || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="bg-[#2f3136] border-b border-[#202225] px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <CheckSquare className="h-6 w-6" />
                {selectedProjectId
                  ? projects.find((p) => p.id === selectedProjectId)?.name || 'Project'
                  : 'All Tasks'}
              </h1>
              <p className="text-[#b9bbbe] mt-1">
                {selectedProjectId
                  ? 'Manage tasks in this project'
                  : 'Manage all tasks across projects'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-medium ${
                  showAnalytics
                    ? 'bg-[#5865f2] text-white shadow-lg shadow-[#5865f2]/30'
                    : 'bg-[#36393f] text-[#b9bbbe] hover:bg-[#40444b] hover:text-white'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </button>
              {canCreateTask && (
                <button
                  onClick={() => {
                    setShowCreateTaskModal(true);
                    setNewTaskProjectId(selectedProjectId || '');
                    setNewTaskEpicId(selectedEpicId || '');
                  }}
                  className="px-4 py-2 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-all flex items-center gap-2 font-medium shadow-lg shadow-[#5865f2]/30 hover:shadow-xl hover:shadow-[#5865f2]/40 hover:scale-105"
                >
                  <Plus className="h-4 w-4" />
                  New Task
                </button>
              )}
            </div>
          </div>
          
          {/* Filters and Search */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8e9297]" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white placeholder-[#8e9297] focus:outline-none focus:ring-2 focus:ring-[#5865f2] text-sm"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
              className="px-3 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="done">Done</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as TaskPriority | 'all')}
              className="px-3 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="px-3 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
            >
              <option value="all">All Assignees</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
            </select>
            {(searchQuery || filterStatus !== 'all' || filterPriority !== 'all' || filterAssignee !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                  setFilterPriority('all');
                  setFilterAssignee('all');
                }}
                className="px-3 py-2 bg-[#36393f] text-[#b9bbbe] rounded-lg hover:bg-[#40444b] transition-colors text-sm flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-x-auto p-6">
          {filteredTasks.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <CheckSquare className="h-16 w-16 mx-auto mb-4 text-[#8e9297]" />
                <h3 className="text-xl font-semibold text-white mb-2">No tasks yet</h3>
                <p className="text-[#b9bbbe] mb-6">
                  {selectedProjectId
                    ? 'Create your first task in this project'
                    : 'Create your first task to get started'}
                </p>
                <button
                  onClick={() => setShowCreateTaskModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Create Task
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 h-full min-w-max">
              {TASK_COLUMNS.map((column) => {
                const columnTasks = getTasksByStatus(column.id);
                return (
                  <div
                    key={column.id}
                    className="flex-shrink-0 w-80 flex flex-col"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.id)}
                  >
                    <div className={`${column.color} border-2 rounded-xl p-4 mb-4 shadow-lg backdrop-blur-sm`}>
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          {column.title}
                        </h2>
                        <span className="px-3 py-1 bg-[#2f3136]/80 backdrop-blur-sm text-white text-sm font-bold rounded-full border border-white/10">
                          {columnTasks.length}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-[#202225] scrollbar-track-transparent">
                      {columnTasks.map((task) => {
                        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                        return (
                          <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task.id)}
                          onClick={() => {
                            setSelectedTask(task);
                            setShowEditTaskModal(true);
                          }}
                          className={`bg-[#2f3136] border rounded-lg p-4 hover:shadow-xl transition-all cursor-pointer group relative transform hover:scale-[1.02] ${
                            isOverdue 
                              ? 'border-red-500/50 bg-red-500/5' 
                              : 'border-[#202225] hover:border-[#5865f2]'
                          }`}
                        >
                          {isOverdue && (
                            <div className="absolute top-2 right-2">
                              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-full border border-red-500/30">
                                Overdue
                              </span>
                            </div>
                          )}
                          <div className="flex items-start justify-between mb-2">
                            <h3 className={`font-semibold text-sm flex-1 line-clamp-2 ${
                              isOverdue ? 'text-red-300' : 'text-white'
                            }`}>
                              {task.title}
                            </h3>
                            {(canEditTask || canDeleteTask) && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                {canEditTask && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTask(task);
                                      setShowEditTaskModal(true);
                                    }}
                                    className="p-1 hover:bg-[#36393f] rounded"
                                    title="Edit task"
                                  >
                                    <Edit className="h-3 w-3 text-[#b9bbbe]" />
                                  </button>
                                )}
                                {canDeleteTask && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm('Are you sure you want to delete this task?')) {
                                        deleteTaskMutation.mutate(task.id);
                                      }
                                    }}
                                    className="p-1 hover:bg-[#36393f] rounded"
                                    title="Delete task"
                                  >
                                    <Trash2 className="h-3 w-3 text-red-400" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-[#b9bbbe] text-xs line-clamp-2 mb-3">
                              {task.description}
                            </p>
                          )}
                          {task.project && (
                            <div className="mb-2">
                              <span className="text-xs text-[#8e9297] flex items-center gap-1">
                                <FolderOpen className="h-3 w-3" />
                                {task.project.name}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full border ${PRIORITY_COLORS[task.priority]}`}
                            >
                              {task.priority}
                            </span>
                          </div>
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {task.tags.slice(0, 3).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 text-xs bg-[#36393f] text-[#b9bbbe] rounded flex items-center gap-1"
                                >
                                  <Tag className="h-3 w-3" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs text-[#8e9297] mt-2 pt-2 border-t border-[#202225]">
                            {task.assignee ? (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>
                                  {task.assignee.first_name} {task.assignee.last_name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[#8e9297]">Unassigned</span>
                            )}
                            {task.due_date && (
                              <div className={`flex items-center gap-1 ${
                                isOverdue ? 'text-red-400' : 'text-[#8e9297]'
                              }`}>
                                <Calendar className={`h-3 w-3 ${isOverdue ? 'text-red-400' : ''}`} />
                                <span>{new Date(task.due_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        );
                      })}
                      {columnTasks.length === 0 && (
                        <div className="text-center py-8 text-[#8e9297] text-sm">
                          No tasks in this column
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#2f3136] rounded-xl max-w-md w-full border border-[#202225] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-4">Create New Project</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#b9bbbe] mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateProject();
                  }}
                  placeholder="Enter project name"
                  className="w-full px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white placeholder-[#8e9297] focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateProjectModal(false);
                    setNewProjectName('');
                  }}
                  className="flex-1 py-2 bg-[#393c43] text-[#b9bbbe] rounded-lg hover:bg-[#404249] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || createProjectMutation.isPending}
                  className="flex-1 py-2 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createProjectMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#2f3136] rounded-xl max-w-2xl w-full border border-[#202225] p-6 my-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Create New Task</h3>
              <button
                onClick={() => {
                  setShowCreateTaskModal(false);
                  setNewTaskTitle('');
                  setNewTaskDescription('');
                  setNewTaskPriority('medium');
                  setNewTaskAssignee('');
                  setNewTaskDueDate('');
                  setNewTaskTags([]);
                  setNewTaskProjectId('');
                  setNewTaskEpicId('');
                }}
                className="text-[#8e9297] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Task Title *</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task title"
                  className="w-full px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white placeholder-[#8e9297] focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Description</label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Enter task description"
                  rows={3}
                  className="w-full px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white placeholder-[#8e9297] focus:outline-none focus:ring-2 focus:ring-[#5865f2] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Assignee</label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Project</label>
                  <select
                    value={newTaskProjectId || ''}
                    onChange={(e) => setNewTaskProjectId(e.target.value)}
                    className="w-full px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  >
                    <option value="">No Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newTaskTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-[#5865f2] text-white rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => setNewTaskTags(newTaskTags.filter((_, i) => i !== idx))}
                        className="hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTagInput}
                    onChange={(e) => setNewTaskTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTaskTagInput.trim()) {
                        setNewTaskTags([...newTaskTags, newTaskTagInput.trim()]);
                        setNewTaskTagInput('');
                        e.preventDefault();
                      }
                    }}
                    placeholder="Add tag and press Enter"
                    className="flex-1 px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white placeholder-[#8e9297] focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  />
                  <button
                    onClick={() => {
                      if (newTaskTagInput.trim()) {
                        setNewTaskTags([...newTaskTags, newTaskTagInput.trim()]);
                        setNewTaskTagInput('');
                      }
                    }}
                    className="px-4 py-2 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateTaskModal(false);
                    setNewTaskTitle('');
                    setNewTaskDescription('');
                    setNewTaskPriority('medium');
                    setNewTaskAssignee('');
                    setNewTaskDueDate('');
                    setNewTaskTags([]);
                  }}
                  className="flex-1 py-2 bg-[#393c43] text-[#b9bbbe] rounded-lg hover:bg-[#404249] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!newTaskTitle.trim()) {
                      toast.error('Task title is required');
                      return;
                    }
                    createTaskMutation.mutate({
                      title: newTaskTitle,
                      description: newTaskDescription || undefined,
                      project_id: newTaskProjectId || undefined,
                      epic_id: newTaskEpicId || undefined,
                      priority: newTaskPriority,
                      assignee_id: newTaskAssignee || undefined,
                      due_date: newTaskDueDate || undefined,
                      tags: newTaskTags,
                    });
                  }}
                  disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
                  className="flex-1 py-2 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createTaskMutation.isPending ? (
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

      {/* Edit Task Modal */}
      {showEditTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#2f3136] rounded-xl max-w-2xl w-full border border-[#202225] p-6 my-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Edit Task</h3>
              <button
                onClick={() => {
                  setShowEditTaskModal(false);
                  setSelectedTask(null);
                }}
                className="text-[#8e9297] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Task Title *</label>
                <input
                  type="text"
                  value={selectedTask.title}
                  onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                  className="w-full px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white placeholder-[#8e9297] focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Description</label>
                <textarea
                  value={selectedTask.description || ''}
                  onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white placeholder-[#8e9297] focus:outline-none focus:ring-2 focus:ring-[#5865f2] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Status</label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => setSelectedTask({ ...selectedTask, status: e.target.value as TaskStatus })}
                    className="w-full px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Priority</label>
                  <select
                    value={selectedTask.priority}
                    onChange={(e) => setSelectedTask({ ...selectedTask, priority: e.target.value as TaskPriority })}
                    className="w-full px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Assignee</label>
                  <select
                    value={selectedTask.assignee?.id || ''}
                    onChange={(e) => {
                      const assignee = users.find((u) => u.id === e.target.value);
                      setSelectedTask({ ...selectedTask, assignee: assignee || undefined });
                    }}
                    className="w-full px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Due Date</label>
                  <input
                    type="date"
                    value={selectedTask.due_date ? new Date(selectedTask.due_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setSelectedTask({ ...selectedTask, due_date: e.target.value || undefined })}
                    className="w-full px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Project</label>
                  <select
                    value={selectedTask.project_id || selectedTask.project?.id || ''}
                    onChange={(e) => {
                      const project = projects.find((p) => p.id === e.target.value);
                      setSelectedTask({
                        ...selectedTask,
                        project_id: e.target.value || undefined,
                        project: project || undefined,
                      });
                    }}
                    className="w-full px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  >
                    <option value="">No Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Epic</label>
                  <select
                    value={selectedTask.epic_id || selectedTask.epic?.id || ''}
                    onChange={(e) => {
                      const selectedEpic = epics.find((ep) => ep.id === e.target.value);
                      setSelectedTask({
                        ...selectedTask,
                        epic_id: e.target.value || undefined,
                        epic: selectedEpic || undefined,
                      });
                    }}
                    className="w-full px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                    disabled={!selectedTask.project_id && !selectedTask.project?.id}
                  >
                    <option value="">No Epic</option>
                    {epics
                      .filter((epic) => epic.project_id === (selectedTask.project_id || selectedTask.project?.id))
                      .map((epic) => (
                        <option key={epic.id} value={epic.id}>
                          {epic.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(selectedTask.tags || []).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-[#5865f2] text-white rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() =>
                          setSelectedTask({
                            ...selectedTask,
                            tags: (selectedTask.tags || []).filter((_, i) => i !== idx),
                          })
                        }
                        className="hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTagInput}
                    onChange={(e) => setNewTaskTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTaskTagInput.trim()) {
                        setSelectedTask({
                          ...selectedTask,
                          tags: [...(selectedTask.tags || []), newTaskTagInput.trim()],
                        });
                        setNewTaskTagInput('');
                        e.preventDefault();
                      }
                    }}
                    placeholder="Add tag and press Enter"
                    className="flex-1 px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white placeholder-[#8e9297] focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  />
                  <button
                    onClick={() => {
                      if (newTaskTagInput.trim()) {
                        setSelectedTask({
                          ...selectedTask,
                          tags: [...(selectedTask.tags || []), newTaskTagInput.trim()],
                        });
                        setNewTaskTagInput('');
                      }
                    }}
                    className="px-4 py-2 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this task?')) {
                      deleteTaskMutation.mutate(selectedTask.id);
                      setShowEditTaskModal(false);
                      setSelectedTask(null);
                    }
                  }}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="h-4 w-4 inline mr-2" />
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowEditTaskModal(false);
                    setSelectedTask(null);
                  }}
                  className="flex-1 py-2 bg-[#393c43] text-[#b9bbbe] rounded-lg hover:bg-[#404249] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!selectedTask.title.trim()) {
                      toast.error('Task title is required');
                      return;
                    }
                    updateTaskMutation.mutate({
                      taskId: selectedTask.id,
                      data: {
                        title: selectedTask.title,
                        description: selectedTask.description,
                        status: selectedTask.status,
                        priority: selectedTask.priority,
                        assignee_id: selectedTask.assignee?.id || null,
                        due_date: selectedTask.due_date || null,
                        project_id: selectedTask.project_id || selectedTask.project?.id || null,
                        epic_id: selectedTask.epic_id || selectedTask.epic?.id || null,
                        tags: selectedTask.tags || [],
                      },
                    });
                  }}
                  disabled={!selectedTask.title.trim() || updateTaskMutation.isPending}
                  className="flex-1 py-2 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateTaskMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Epic Modal */}
      {showCreateEpicModal && editingProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#2f3136] rounded-xl max-w-md w-full border border-[#202225] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Create New Epic</h3>
              <button
                onClick={() => {
                  setShowCreateEpicModal(false);
                  setEditingProject(null);
                  setNewEpicName('');
                  setNewEpicDescription('');
                }}
                className="text-[#8e9297] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Epic Name *</label>
                <input
                  type="text"
                  value={newEpicName}
                  onChange={(e) => setNewEpicName(e.target.value)}
                  placeholder="Enter epic name"
                  className="w-full px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white placeholder-[#8e9297] focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Description</label>
                <textarea
                  value={newEpicDescription}
                  onChange={(e) => setNewEpicDescription(e.target.value)}
                  placeholder="Enter epic description"
                  rows={3}
                  className="w-full px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white placeholder-[#8e9297] focus:outline-none focus:ring-2 focus:ring-[#5865f2] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Assignee</label>
                <select
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  className="w-full px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateEpicModal(false);
                    setEditingProject(null);
                    setNewEpicName('');
                    setNewEpicDescription('');
                  }}
                  className="flex-1 py-2 bg-[#393c43] text-[#b9bbbe] rounded-lg hover:bg-[#404249] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!newEpicName.trim()) {
                      toast.error('Epic name is required');
                      return;
                    }
                    createEpicMutation.mutate({
                      name: newEpicName.trim(),
                      description: newEpicDescription.trim() || undefined,
                      project_id: editingProject.id,
                      assignee_id: newTaskAssignee || undefined,
                    });
                  }}
                  disabled={!newEpicName.trim() || createEpicMutation.isPending}
                  className="flex-1 py-2 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createEpicMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    'Create Epic'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditProjectModal && editingProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#2f3136] rounded-xl max-w-md w-full border border-[#202225] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Edit Project</h3>
              <button
                onClick={() => {
                  setShowEditProjectModal(false);
                  setEditingProject(null);
                }}
                className="text-[#8e9297] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Project Name *</label>
                <input
                  type="text"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                  className="w-full px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white placeholder-[#8e9297] focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9bbbe] mb-2">Description</label>
                <textarea
                  value={editingProject.description || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-[#202225] border border-[#36393f] rounded-lg text-white placeholder-[#8e9297] focus:outline-none focus:ring-2 focus:ring-[#5865f2] resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete "${editingProject.name}"? This will also delete all tasks in this project.`)) {
                      deleteProjectMutation.mutate(editingProject.id);
                    }
                  }}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="h-4 w-4 inline mr-2" />
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowEditProjectModal(false);
                    setEditingProject(null);
                  }}
                  className="flex-1 py-2 bg-[#393c43] text-[#b9bbbe] rounded-lg hover:bg-[#404249] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!editingProject.name.trim()) {
                      toast.error('Project name is required');
                      return;
                    }
                    updateProjectMutation.mutate({
                      projectId: editingProject.id,
                      data: {
                        name: editingProject.name.trim(),
                        description: editingProject.description || undefined,
                      },
                    });
                  }}
                  disabled={!editingProject.name.trim() || updateProjectMutation.isPending}
                  className="flex-1 py-2 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateProjectMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    'Save Changes'
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
