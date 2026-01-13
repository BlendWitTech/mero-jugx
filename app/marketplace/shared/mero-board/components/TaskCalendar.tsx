import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Card, CardContent } from '@shared';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { parseISO, isSameDay } from 'date-fns';

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  created_at: string;
  status: string;
  priority: string;
}

interface TaskCalendarProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

export default function TaskCalendar({ tasks, onTaskClick }: TaskCalendarProps) {
  const { theme } = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Debug: Log tasks with due dates
  useEffect(() => {
    const tasksWithDueDates = tasks.filter((task) => task.due_date);
    console.log('TaskCalendar - Total tasks:', tasks.length);
    console.log('TaskCalendar - Tasks with due dates:', tasksWithDueDates.length);
    if (tasksWithDueDates.length > 0) {
      console.log('TaskCalendar - Sample task with due_date:', tasksWithDueDates[0]);
    }
  }, [tasks]);

  const getTasksForDay = (date: Date) => {
    return tasks.filter((task) => {
      if (!task.due_date) return false;
      try {
        // Handle both date string formats (with or without time)
        let taskDate: Date;
        // If it's already a date-only string (YYYY-MM-DD), parse it directly
        if (task.due_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          taskDate = new Date(task.due_date + 'T00:00:00');
        } else {
          taskDate = parseISO(task.due_date);
        }
        return isSameDay(taskDate, date);
      } catch (error) {
        console.error('Error parsing task due_date:', task.due_date, error);
        return false;
      }
    });
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

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dayTasks = getTasksForDay(date);
      if (dayTasks.length > 0) {
        return (
          <div className="flex flex-wrap gap-1 justify-center mt-1 px-1 items-center">
            {dayTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 border"
                style={{
                  backgroundColor: getStatusColor(task.status),
                  borderColor: getStatusColor(task.status) + '80',
                }}
                title={task.title}
              />
            ))}
            {dayTasks.length > 3 && (
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 border"
                style={{
                  backgroundColor: theme.colors.textSecondary,
                  borderColor: theme.colors.border,
                }}
                title={`+${dayTasks.length - 3} more`}
              />
            )}
          </div>
        );
      }
    }
    return null;
  };

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dayTasks = getTasksForDay(date);
      if (dayTasks.length > 0) {
        return 'has-tasks';
      }
    }
    return '';
  };

  return (
    <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
      <CardContent className="p-4">
        <style>{`
          .react-calendar {
            width: 100%;
            background: ${theme.colors.surface};
            border: 1px solid ${theme.colors.border};
            border-radius: 0.5rem;
            font-family: inherit;
          }
          .react-calendar__navigation {
            display: flex;
            height: 44px;
            margin-bottom: 1em;
            border-bottom: 1px solid ${theme.colors.border};
          }
          .react-calendar__navigation button {
            min-width: 44px;
            background: none;
            color: ${theme.colors.text};
            font-size: 16px;
            font-weight: 500;
          }
          .react-calendar__navigation button:enabled:hover,
          .react-calendar__navigation button:enabled:focus {
            background-color: ${theme.colors.border};
            color: ${theme.colors.text};
          }
          .react-calendar__navigation button[disabled] {
            color: ${theme.colors.textSecondary};
            opacity: 0.5;
          }
          .react-calendar__month-view__weekdays {
            text-align: center;
            text-transform: uppercase;
            font-weight: 600;
            font-size: 0.75em;
            color: ${theme.colors.textSecondary};
            padding-bottom: 0.5em;
            border-bottom: 1px solid ${theme.colors.border};
          }
          .react-calendar__month-view__weekdays__weekday {
            padding: 0.5em;
          }
          .react-calendar__month-view__days {
            display: grid !important;
            grid-template-columns: repeat(7, 1fr);
          }
          .react-calendar__tile {
            max-width: 100%;
            padding: 0.5em 0.25em;
            background: none;
            text-align: center;
            line-height: 1.2;
            font-size: 0.833em;
            color: ${theme.colors.text};
            border: 1px solid transparent;
            border-radius: 0.25rem;
            min-height: 80px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            position: relative;
          }
          .react-calendar__tile:enabled:hover,
          .react-calendar__tile:enabled:focus {
            background-color: ${theme.colors.border};
            color: ${theme.colors.text};
          }
          .react-calendar__tile--now {
            background: ${theme.colors.primary}20;
            color: ${theme.colors.primary};
            font-weight: 600;
          }
          .react-calendar__tile--now:enabled:hover,
          .react-calendar__tile--now:enabled:focus {
            background: ${theme.colors.primary}30;
          }
          .react-calendar__tile--active {
            background: ${theme.colors.primary};
            color: white;
            font-weight: 600;
          }
          .react-calendar__tile--active:enabled:hover,
          .react-calendar__tile--active:enabled:focus {
            background: ${theme.colors.primary};
          }
          .react-calendar__tile--hasActive {
            background: ${theme.colors.primary}40;
          }
          .react-calendar__tile--hasActive:enabled:hover,
          .react-calendar__tile--hasActive:enabled:focus {
            background: ${theme.colors.primary}50;
          }
          .react-calendar__tile--neighboringMonth {
            color: ${theme.colors.textSecondary};
            opacity: 0.5;
          }
          .react-calendar__tile.has-tasks {
            border-color: ${theme.colors.primary}40;
          }
        `}</style>
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          tileContent={tileContent}
          tileClassName={tileClassName}
          onClickDay={(date) => {
            setSelectedDate(date);
            const dayTasks = getTasksForDay(date);
            // If only one task, navigate to it directly
            if (dayTasks.length === 1) {
              onTaskClick(dayTasks[0].id);
            }
            // If multiple tasks, show them in the selected date section below
          }}
        />
        {selectedDate && (
          <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.border}` }}>
            <h4 className="text-sm font-semibold mb-3" style={{ color: theme.colors.text }}>
              Tasks for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {getTasksForDay(selectedDate).length > 0 ? (
                getTasksForDay(selectedDate).map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg cursor-pointer transition-colors"
                    style={{
                      backgroundColor: theme.colors.surface,
                      border: `1px solid ${getStatusColor(task.status)}`,
                    }}
                    onClick={() => onTaskClick(task.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.border;
                      e.currentTarget.style.borderColor = getStatusColor(task.status);
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.surface;
                      e.currentTarget.style.borderColor = getStatusColor(task.status);
                    }}
                  >
                    <p className="text-sm font-medium mb-1" style={{ color: theme.colors.text }}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: getStatusColor(task.status) + '40',
                          color: getStatusColor(task.status),
                        }}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                      {task.priority && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.textSecondary,
                            border: `1px solid ${theme.colors.border}`,
                          }}
                        >
                          {task.priority}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-center py-4" style={{ color: theme.colors.textSecondary }}>
                  No tasks scheduled for this day
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
