import React from 'react';
import { Card, CardContent } from '@shared';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Calendar, Clock } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  created_at: string;
  status: string;
  priority: string;
}

interface TaskGanttProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

export default function TaskGantt({ tasks, onTaskClick }: TaskGanttProps) {
  const { theme } = useTheme();

  // Get date range (4 weeks from today)
  const today = new Date();
  const startDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const endDate = addDays(startDate, 27); // 4 weeks
  const days: Date[] = [];
  for (let i = 0; i < 28; i++) {
    days.push(addDays(startDate, i));
  }

  const getTaskPosition = (task: Task) => {
    if (!task.due_date) return null;
    const dueDate = parseISO(task.due_date);
    const createdDate = parseISO(task.created_at);
    const startIndex = days.findIndex((day) => isSameDay(day, createdDate));
    const endIndex = days.findIndex((day) => isSameDay(day, dueDate));

    if (startIndex === -1 && endIndex === -1) return null;

    const actualStart = startIndex === -1 ? 0 : startIndex;
    const actualEnd = endIndex === -1 ? days.length - 1 : endIndex;
    const width = ((actualEnd - actualStart + 1) / days.length) * 100;
    const left = (actualStart / days.length) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return '#10b981';
      case 'in_progress':
        return theme.colors.primary;
      case 'in_review':
        return '#0ea5e9';
      case 'todo':
      default:
        return theme.colors.border;
    }
  };

  return (
    <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {/* Header with dates */}
          <div className="flex border-b" style={{ borderColor: theme.colors.border }}>
            <div className="w-64 p-4 font-semibold sticky left-0 z-10" style={{ backgroundColor: theme.colors.surface, borderRight: `1px solid ${theme.colors.border}` }}>
              <span style={{ color: theme.colors.text }}>Task</span>
            </div>
            <div className="flex flex-1">
              {days.map((day, index) => (
                <div
                  key={index}
                  className="flex-1 p-2 text-center text-xs min-w-[60px]"
                  style={{
                    borderRight: `1px solid ${theme.colors.border}`,
                    color: theme.colors.textSecondary,
                    backgroundColor: isSameDay(day, today) ? `${theme.colors.primary}20` : 'transparent',
                  }}
                >
                  <div className="font-medium">{format(day, 'EEE')}</div>
                  <div>{format(day, 'd')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Task rows */}
          <div className="max-h-[600px] overflow-y-auto">
            {tasks.length === 0 ? (
              <div className="p-8 text-center" style={{ color: theme.colors.textSecondary }}>
                No tasks to display
              </div>
            ) : (
              tasks.map((task) => {
                const position = getTaskPosition(task);
                return (
                  <div
                    key={task.id}
                    className="flex border-b hover:bg-opacity-50 transition-colors"
                    style={{ borderColor: theme.colors.border }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${theme.colors.border}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Task name */}
                    <div
                      className="w-64 p-4 sticky left-0 z-10 cursor-pointer"
                      style={{
                        backgroundColor: theme.colors.surface,
                        borderRight: `1px solid ${theme.colors.border}`,
                      }}
                      onClick={() => onTaskClick(task.id)}
                    >
                      <div className="font-medium" style={{ color: theme.colors.text }}>
                        {task.title}
                      </div>
                      {task.due_date && (
                        <div className="text-xs mt-1 flex items-center gap-1" style={{ color: theme.colors.textSecondary }}>
                          <Clock className="h-3 w-3" />
                          {format(parseISO(task.due_date), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>

                    {/* Gantt bar area */}
                    <div className="flex-1 relative" style={{ minHeight: '60px' }}>
                      {position && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-6 rounded cursor-pointer hover:opacity-80 transition-opacity"
                          style={{
                            left: position.left,
                            width: position.width,
                            backgroundColor: getStatusColor(task.status),
                            minWidth: '4px',
                          }}
                          onClick={() => onTaskClick(task.id)}
                          title={task.title}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

