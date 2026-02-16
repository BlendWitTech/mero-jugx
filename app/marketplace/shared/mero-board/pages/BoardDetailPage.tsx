import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardContent, Loading, Modal, Input } from '@shared/frontend';
import api from '@frontend/services/api';
import { ArrowLeft, Plus, Settings } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTheme } from '@frontend/contexts/ThemeContext';
import toast from '@shared/frontend/hooks/useToast';
import TicketKanban from '../components/TicketKanban';
import { Ticket } from '@frontend/types/tickets';

interface BoardColumn {
    id: string;
    name: string;
    position: number;
    color: string;
    wip_limit: number | null;
    tickets: Ticket[];
}

interface Board {
    id: string;
    name: string;
    description: string;
    type: string;
    color: string;
    columns?: BoardColumn[];
}

export default function BoardDetailPage() {
    const { boardId } = useParams<{ boardId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { appSlug } = useAppContext();
    const { theme } = useTheme();

    const [showAddColumnModal, setShowAddColumnModal] = useState(false);
    const [columnForm, setColumnForm] = useState({ name: '', wip_limit: '' });

    // Fetch board details with columns and tickets
    // Note: Backend endpoint /boards/:id should return columns join
    // And we might need a separate call for columns if not included
    const { data: boardData, isLoading } = useQuery<{ data: Board }>({
        queryKey: ['board', appSlug, boardId],
        queryFn: async () => {
            // Assuming GET /boards/:id returns columns with tickets populated
            // If not, we need to fetch /boards/:id/columns
            const response = await api.get(`/boards/${boardId}`);
            // Also fetch columns if not in response, but for now assume it returns them or we fetch them separate
            const columnsResponse = await api.get(`/boards/${boardId}/columns`);
            return { data: { ...response.data, columns: columnsResponse.data } };
        },
        enabled: !!boardId,
    });

    const board = boardData?.data;

    // Add Column Mutation
    const addColumnMutation = useMutation({
        mutationFn: async (data: { name: string; wip_limit?: number }) => {
            const response = await api.post(`/boards/${boardId}/columns`, {
                ...data,
                position: (board?.columns?.length || 0) + 1,
                color: '#e2e8f0', // Default color
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', appSlug, boardId] });
            setShowAddColumnModal(false);
            setColumnForm({ name: '', wip_limit: '' });
            toast.success('Column added');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to add column');
        },
    });

    // Handle Ticket Move
    const moveTicketMutation = useMutation({
        mutationFn: async ({ ticketId, targetColumnId, newPosition }: { ticketId: string, targetColumnId: string, newPosition: number }) => {
            // Need an endpoint to move ticket. 
            // We added moveTicket to TicketsService, but need a controller endpoint.
            // Or update ticket directly: PATCH /tickets/:id { board_id, column_id, position }
            // Let's assume PUT /tickets/:id exists.
            return api.put(`/tickets/${ticketId}`, { column_id: targetColumnId, position: newPosition, board_id: boardId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', appSlug, boardId] });
        },
        onError: (error: any) => {
            toast.error('Failed to move ticket');
        }
    });


    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: theme.colors.background }}>
                <Loading size="lg" text="Loading board..." />
            </div>
        );
    }

    if (!board) return <div>Board not found</div>;

    return (
        <div className="h-full w-full p-6 flex flex-col" style={{ backgroundColor: theme.colors.background }}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate('..', { relative: 'path' })}
                        style={{ borderColor: theme.colors.border }}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                            {board.name}
                            <span className="text-sm font-normal px-2 py-0.5 rounded border" style={{ color: theme.colors.textSecondary, borderColor: theme.colors.border }}>
                                {board.type}
                            </span>
                        </h1>
                        {board.description && <p style={{ color: theme.colors.textSecondary }}>{board.description}</p>}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowAddColumnModal(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Column
                    </Button>
                    <Button variant="ghost">
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Board Content */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <TicketKanban
                    columns={board.columns || []}
                    onTicketMove={(ticketId, columnId, index) => moveTicketMutation.mutate({ ticketId, targetColumnId: columnId, newPosition: index })}
                    onTicketClick={(ticketId) => navigate(`../../tasks/${ticketId}`, { relative: 'path' })}
                />
            </div>

            {/* Add Column Modal */}
            <Modal
                isOpen={showAddColumnModal}
                onClose={() => setShowAddColumnModal(false)}
                title="Add New Column"
                theme={theme}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <Input
                            value={columnForm.name}
                            onChange={e => setColumnForm({ ...columnForm, name: e.target.value })}
                            placeholder="e.g. In Progress"
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setShowAddColumnModal(false)}>Cancel</Button>
                        <Button
                            onClick={() => addColumnMutation.mutate({ name: columnForm.name, wip_limit: Number(columnForm.wip_limit) || undefined })}
                            disabled={!columnForm.name}
                            isLoading={addColumnMutation.isPending}
                        >
                            Add
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
