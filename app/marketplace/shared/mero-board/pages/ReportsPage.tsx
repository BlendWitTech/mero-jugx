import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Loading,
  Select,
  Input,
} from '@shared/frontend';
import api from '@frontend/services/api';
import { ArrowLeft, TrendingUp, CheckSquare, Clock, Users, BarChart3 } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { useAuthStore } from '@frontend/store/authStore';

export default function ReportsPage() {
  const { workspaceId, projectId } = useParams<{ workspaceId?: string; projectId?: string }>();
  const navigate = useNavigate();
  const { appSlug } = useAppContext();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const isProjectContext = !!projectId;
  const [reportType, setReportType] = useState<'project' | 'workspace' | 'productivity'>(
    isProjectContext ? 'project' : 'workspace'
  );
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Project Report (only in project context)
  const { data: projectReport, isLoading: projectLoading } = useQuery({
    queryKey: ['project-report', appSlug, projectId],
    queryFn: async () => {
      const response = await api.get(`/apps/${appSlug}/projects/${projectId}/report`);
      return response.data;
    },
    enabled: isProjectContext && reportType === 'project' && !!projectId,
  });

  // Workspace Report (only in workspace context)
  const { data: workspaceReport, isLoading: workspaceLoading } = useQuery({
    queryKey: ['workspace-report', appSlug, workspaceId],
    queryFn: async () => {
      const response = await api.get(`/apps/${appSlug}/workspaces/${workspaceId}/report`);
      return response.data;
    },
    enabled: !isProjectContext && reportType === 'workspace' && !!workspaceId,
  });

  // Productivity Report (workspace-based or project-based)
  const { data: productivityReport, isLoading: productivityLoading } = useQuery({
    queryKey: ['productivity-report', appSlug, isProjectContext ? projectId : workspaceId, startDate, endDate, isProjectContext ? 'project' : 'workspace'],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const endpoint = isProjectContext
        ? `/apps/${appSlug}/projects/${projectId}/productivity`
        : `/apps/${appSlug}/workspaces/${workspaceId}/productivity`;
      const response = await api.get(`${endpoint}?${params.toString()}`);
      return response.data;
    },
    enabled: reportType === 'productivity' && ((isProjectContext && !!projectId) || (!isProjectContext && !!workspaceId)),
  });

  const isLoading = projectLoading || workspaceLoading || productivityLoading;

  return (
    <div className="h-full w-full p-6" style={{ backgroundColor: theme.colors.background }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="outline"
              onClick={() => {
                if (isProjectContext && projectId) {
                  navigate(`../../projects/${projectId}`, { relative: 'route' });
                } else if (workspaceId) {
                  navigate(`../`, { relative: 'route' });
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
              {isProjectContext ? 'Back to Project' : 'Back to Workspace'}
            </Button>
            <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>
              Reports & Analytics
            </h1>
            <p className="mt-2" style={{ color: theme.colors.textSecondary }}>
              {isProjectContext ? 'View project statistics and team productivity' : 'View workspace statistics and team productivity'}
            </p>
          </div>
        </div>

        {/* Report Type Selector */}
        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium" style={{ color: theme.colors.text }}>
                Report Type:
              </label>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'project' | 'workspace' | 'productivity')}
                options={
                  isProjectContext
                    ? [
                        { value: 'project', label: 'Project Report' },
                        { value: 'productivity', label: 'Team Productivity' },
                      ]
                    : [
                        { value: 'workspace', label: 'Workspace Report' },
                        { value: 'productivity', label: 'Team Productivity' },
                      ]
                }
                className="w-48"
              />
              {reportType === 'productivity' && (
                <>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start Date"
                    className="w-40"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End Date"
                    className="w-40"
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" text="Loading report..." />
          </div>
        ) : reportType === 'project' && projectReport ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Task Statistics */}
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: theme.colors.text }}>
                  <CheckSquare className="h-5 w-5" />
                  Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Total</span>
                    <span className="font-semibold" style={{ color: theme.colors.text }}>
                      {projectReport.task_stats.total}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Completed</span>
                    <span className="font-semibold" style={{ color: theme.colors.text }}>
                      {projectReport.task_stats.completed}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Completion Rate</span>
                    <span className="font-semibold" style={{ color: theme.colors.text }}>
                      {projectReport.task_stats.completion_rate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Breakdown */}
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: theme.colors.text }}>
                  <BarChart3 className="h-5 w-5" />
                  By Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(projectReport.task_stats.by_status).map(([status, count]: [string, any]) => (
                    <div key={status} className="flex justify-between">
                      <span style={{ color: theme.colors.textSecondary }}>{status.replace('_', ' ')}</span>
                      <span className="font-semibold" style={{ color: theme.colors.text }}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Time Statistics */}
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: theme.colors.text }}>
                  <Clock className="h-5 w-5" />
                  Time Logged
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Total Hours</span>
                    <span className="font-semibold" style={{ color: theme.colors.text }}>
                      {projectReport.time_stats.total_hours.toFixed(1)}h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Billable Hours</span>
                    <span className="font-semibold" style={{ color: theme.colors.text }}>
                      {projectReport.time_stats.billable_hours.toFixed(1)}h
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Statistics */}
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: theme.colors.text }}>
                  <Users className="h-5 w-5" />
                  Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Total Members</span>
                    <span className="font-semibold" style={{ color: theme.colors.text }}>
                      {projectReport.team_stats.total_members}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Active Members</span>
                    <span className="font-semibold" style={{ color: theme.colors.text }}>
                      {projectReport.team_stats.active_members}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : reportType === 'workspace' && workspaceReport ? (
          <div className="space-y-6">
            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold mb-2" style={{ color: theme.colors.text }}>
                      {workspaceReport.overall_stats.total_projects}
                    </p>
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      Total Projects
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold mb-2" style={{ color: theme.colors.text }}>
                      {workspaceReport.overall_stats.total_tasks}
                    </p>
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      Total Tasks
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold mb-2" style={{ color: theme.colors.text }}>
                      {workspaceReport.overall_stats.completed_tasks}
                    </p>
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      Completed Tasks
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold mb-2" style={{ color: theme.colors.text }}>
                      {workspaceReport.overall_stats.overall_completion_rate.toFixed(1)}%
                    </p>
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      Completion Rate
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Project Breakdown */}
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.text }}>Project Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workspaceReport.project_stats.map((project: any) => (
                    <div
                      key={project.project_id}
                      className="p-4 rounded"
                      style={{ backgroundColor: theme.colors.background }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold" style={{ color: theme.colors.text }}>
                          {project.project_name}
                        </h3>
                        <span className="text-sm font-semibold" style={{ color: theme.colors.text }}>
                          {project.completion_rate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm" style={{ color: theme.colors.textSecondary }}>
                        <span>{project.completed_tasks} / {project.total_tasks} tasks completed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : reportType === 'productivity' && productivityReport ? (
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: theme.colors.text }}>
                <TrendingUp className="h-5 w-5" />
                Team Productivity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productivityReport.team_members.map((member: any) => (
                  <div
                    key={member.user_id}
                    className="p-4 rounded"
                    style={{ backgroundColor: theme.colors.background }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold" style={{ color: theme.colors.text }}>
                        {member.user_name}
                      </h3>
                      <span className="text-sm font-semibold" style={{ color: theme.colors.text }}>
                        {member.completion_rate.toFixed(1)}% completion
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span style={{ color: theme.colors.textSecondary }}>Tasks Assigned</span>
                        <p className="font-semibold" style={{ color: theme.colors.text }}>
                          {member.tasks_assigned}
                        </p>
                      </div>
                      <div>
                        <span style={{ color: theme.colors.textSecondary }}>Tasks Completed</span>
                        <p className="font-semibold" style={{ color: theme.colors.text }}>
                          {member.tasks_completed}
                        </p>
                      </div>
                      <div>
                        <span style={{ color: theme.colors.textSecondary }}>Time Logged</span>
                        <p className="font-semibold" style={{ color: theme.colors.text }}>
                          {member.time_logged_hours.toFixed(1)}h
                        </p>
                      </div>
                      <div>
                        <span style={{ color: theme.colors.textSecondary }}>Completion Rate</span>
                        <p className="font-semibold" style={{ color: theme.colors.text }}>
                          {member.completion_rate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

