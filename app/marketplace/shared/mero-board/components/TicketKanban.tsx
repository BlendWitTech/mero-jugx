import React, { useState } from 'react';
import { Card, CardContent, Badge, Avatar } from '@shared';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Calendar, User, MoreHorizontal, Plus } from 'lucide-react';
// import { Ticket } from '@frontend/types/tickets'; 

// Temporary interface until types are shared
export interface Ticket {
    id: string;
    subject: string;
    description: string | null;
    status: string;
    priority: string;
    due_date: string | null;
    assignee?: {
        first_name: string;
        last_name: string;
        avatar_url?: string;
    };
    tags?: string[];
}

interface BoardColumn {
    id: string;
    name: string;
    color: string;
    tickets: Ticket[];
}

interface TicketKanbanProps {
    columns: BoardColumn[];
    onTicketMove: (ticketId: string, targetColumnId: string, newPosition: number) => void;
    onTicketClick: (ticketId: string) => void;
}

export default function TicketKanban({
    columns,
    onTicketMove,
    onTicketClick,
}: TicketKanbanProps) {
    const { theme } = useTheme();
    const [draggedTicket, setDraggedTicket] = useState<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, ticketId: string) => {
        setDraggedTicket(ticketId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', ticketId);
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(columnId);
    };

    const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
        e.preventDefault();
        const ticketId = e.dataTransfer.getData('text/plain');

        if (ticketId && draggedTicket) {
            // Calculate new position - for now just append
            const column = columns.find(c => c.id === targetColumnId);
            const newPosition = column?.tickets.length || 0;

            // Only trigger move if column changed (reordering within column not implemented yet for simplicity)
            // Check if ticket is already in this column
            const sourceColumn = columns.find(c => c.tickets.some(t => t.id === ticketId));
            if (sourceColumn?.id !== targetColumnId) {
                onTicketMove(ticketId, targetColumnId, newPosition);
            }
        }

        setDraggedTicket(null);
        setDragOverColumn(null);
    };

    return (
        <div className="flex gap-4 h-full pb-4" style={{ minHeight: '600px' }}>
            {columns.map((column) => {
                const isDragOver = dragOverColumn === column.id;

                return (
                    <div
                        key={column.id}
                        className="flex-1 min-w-[280px] w-[280px] max-w-[320px] flex flex-col rounded-lg transition-colors"
                        style={{
                            backgroundColor: theme.colors.surface, // Column bg
                            border: `1px solid ${isDragOver ? theme.colors.primary : 'transparent'}`,
                        }}
                        onDragOver={(e) => handleDragOver(e, column.id)}
                        onDragLeave={() => setDragOverColumn(null)}
                        onDrop={(e) => handleDrop(e, column.id)}
                    >
                        {/* Column Header */}
                        <div
                            className="px-3 py-3 flex items-center justify-between border-b"
                            style={{
                                borderColor: theme.colors.border,
                                borderTop: `3px solid ${column.color || theme.colors.primary}`
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm" style={{ color: theme.colors.text }}>
                                    {column.name}
                                </h3>
                                <Badge variant="default" size="sm" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                    {column.tickets?.length || 0}
                                </Badge>
                            </div>
                            <div className="flex gap-1">
                                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500">
                                    <Plus className="h-4 w-4" />
                                </button>
                                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500">
                                    <MoreHorizontal className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Column Tasks */}
                        <div className="flex-1 p-2 space-y-2 overflow-y-auto scrollbar-thin">
                            {column.tickets?.map((ticket) => (
                                <Card
                                    key={ticket.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, ticket.id)}
                                    className="cursor-move hover:shadow-md transition-shadow"
                                    style={{
                                        backgroundColor: theme.colors.background, // Card bg
                                        borderColor: theme.colors.border
                                    }}
                                    onClick={() => onTicketClick(ticket.id)}
                                >
                                    <CardContent className="p-3">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-start gap-2">
                                                <h4 className="font-medium text-sm line-clamp-2" style={{ color: theme.colors.text }}>
                                                    {ticket.subject}
                                                </h4>
                                            </div>

                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant={getPriorityVariant(ticket.priority)} size="sm" className="text-[10px] px-1.5 h-5">
                                                    {ticket.priority}
                                                </Badge>
                                                {ticket.tags?.map(tag => (
                                                    <Badge key={tag} variant="outline" size="sm" className="text-[10px] px-1.5 h-5">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-between pt-2 mt-2 border-t" style={{ borderColor: theme.colors.border }}>
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    {ticket.assignee ? (
                                                        <Avatar size="sm" name={`${ticket.assignee.first_name} ${ticket.assignee.last_name}`} src={ticket.assignee.avatar_url} />
                                                    ) : (
                                                        <User className="h-3 w-3" />
                                                    )}
                                                </div>
                                                {ticket.due_date && (
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{new Date(ticket.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function getPriorityVariant(priority: string): 'default' | 'info' | 'warning' | 'danger' {
    switch (priority?.toLowerCase()) {
        case 'high': return 'warning';
        case 'urgent': return 'danger';
        case 'medium': return 'info';
        default: return 'default';
    }
}
