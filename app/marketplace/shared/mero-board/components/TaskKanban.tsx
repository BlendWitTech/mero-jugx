import React, { useState } from 'react';
import { Card, CardContent, Badge, Avatar } from '@shared';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Calendar, User } from 'lucide-react';

// Task enums - matching backend
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  assignee: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  due_date: string | null;
  created_at: string;
  tags: string[];
}

interface TaskKanbanProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  getStatusColor: (status: TaskStatus) => 'default' | 'info' | 'warning' | 'success';
  getPriorityColor: (priority: TaskPriority) => 'default' | 'info' | 'warning' | 'danger';
}

const statusColumns: { status: TaskStatus; label: string }[] = [
  { status: TaskStatus.TODO, label: 'To Do' },
  { status: TaskStatus.IN_PROGRESS, label: 'In Progress' },
  { status: TaskStatus.IN_REVIEW, label: 'In Review' },
  { status: TaskStatus.DONE, label: 'Done' },
];

export default function TaskKanban({
  tasks,
  onTaskClick,
  onStatusChange,
  getStatusColor,
  getPriorityColor,
}: TaskKanbanProps) {
  const { theme } = useTheme();
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');

    if (taskId && draggedTask) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== targetStatus) {
        onStatusChange(taskId, targetStatus);
      }
    }

    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (date < today) {
      return 'Overdue';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4" style={{ minHeight: '600px' }}>
      {statusColumns.map((column) => {
        const columnTasks = getTasksByStatus(column.status);
        const isDragOver = dragOverColumn === column.status;

        return (
          <div
            key={column.status}
            className="flex-1 min-w-[280px] flex flex-col"
            onDragOver={(e) => handleDragOver(e, column.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            {/* Column Header */}
            <div
              className="px-4 py-3 rounded-t-lg mb-2"
              style={{
                backgroundColor: isDragOver ? theme.colors.primary + '20' : theme.colors.surface,
                border: `1px solid ${isDragOver ? theme.colors.primary : theme.colors.border}`,
                borderBottom: 'none',
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold" style={{ color: theme.colors.text }}>
                  {column.label}
                </h3>
                <Badge variant="default" size="sm">
                  {columnTasks.length}
                </Badge>
              </div>
            </div>

            {/* Column Tasks */}
            <div
              className="flex-1 rounded-b-lg p-2 space-y-3 overflow-y-auto"
              style={{
                backgroundColor: isDragOver ? theme.colors.primary + '10' : theme.colors.background,
                border: `1px solid ${isDragOver ? theme.colors.primary : theme.colors.border}`,
                minHeight: '500px',
              }}
            >
              {columnTasks.length === 0 ? (
                <div
                  className="text-center py-8 rounded"
                  style={{ color: theme.colors.textSecondary }}
                >
                  <p className="text-sm">No tasks</p>
                </div>
              ) : (
                columnTasks.map((task) => {
                  const isDragging = draggedTask === task.id;

                  return (
                    <Card
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className={`cursor-move hover:shadow-lg transition-all ${isDragging ? 'opacity-50' : ''
                        }`}
                      style={{
                        backgroundColor: theme.colors.surface,
                        border: `1px solid ${theme.colors.border}`,
                      }}
                      onClick={() => onTaskClick(task.id)}
                    >
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          {/* Title */}
                          <h4
                            className="font-semibold text-sm line-clamp-2"
                            style={{ color: theme.colors.text }}
                          >
                            {task.title}
                          </h4>

                          {/* Description */}
                          {task.description && (
                            <p
                              className="text-xs line-clamp-2"
                              style={{ color: theme.colors.textSecondary }}
                            >
                              {task.description}
                            </p>
                          )}

                          {/* Tags */}
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.tags.slice(0, 3).map((tag, idx) => (
                                <Badge key={idx} variant="default" size="sm">
                                  {tag}
                                </Badge>
                              ))}
                              {task.tags.length > 3 && (
                                <Badge variant="default" size="sm">
                                  +{task.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: theme.colors.border }}>
                            <div className="flex items-center gap-2">
                              {/* Priority */}
                              <Badge variant={getPriorityColor(task.priority)} size="sm">
                                {task.priority}
                              </Badge>

                              {/* Assignee */}
                              {task.assignee && (
                                <div className="flex items-center gap-1">
                                  <Avatar
                                    size="sm"
                                    name={`${task.assignee.first_name} ${task.assignee.last_name}`}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Due Date */}
                            {task.due_date && (
                              <div
                                className="flex items-center gap-1 text-xs"
                                style={{
                                  color: new Date(task.due_date) < new Date() && task.status !== TaskStatus.DONE
                                    ? '#ed4245'
                                    : theme.colors.textSecondary,
                                }}
                              >
                                <Calendar className="h-3 w-3" />
                                {formatDate(task.due_date)}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

