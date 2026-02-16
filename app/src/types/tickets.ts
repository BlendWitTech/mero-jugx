export interface Ticket {
    id: string;
    subject: string;
    description: string | null;
    status: string;
    priority: string;
    due_date: string | null;
    assignee?: {
        id: string;
        first_name: string;
        last_name: string;
        avatar_url?: string;
    };
    tags?: string[];
    board_id?: string;
    column_id?: string;
}
