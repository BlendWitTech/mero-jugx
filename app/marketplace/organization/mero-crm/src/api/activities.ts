import apiClient from '@frontend/services/api';
import { Lead } from './leads';
import { Deal } from './deals';

export interface Activity {
    id: string;
    organizationId: string;
    type: 'CALL' | 'MEETING' | 'TASK' | 'EMAIL' | 'NOTE';
    subject: string;
    description?: string;
    due_date?: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    leadId?: string;
    lead?: Lead;
    dealId?: string;
    deal?: Deal;
    assignedToId?: string;
    assignedTo?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreateActivityDto {
    type: string;
    subject: string;
    description?: string;
    due_date?: string;
    status?: string;
    lead_id?: string;
    deal_id?: string;
    assigned_to?: string;
}

export interface UpdateActivityDto extends Partial<CreateActivityDto> { }

export const activitiesApi = {
    getActivities: async (leadId?: string, dealId?: string): Promise<Activity[]> => {
        const params = new URLSearchParams();
        if (leadId) params.append('lead_id', leadId);
        if (dealId) params.append('deal_id', dealId);

        const response = await apiClient.get(`/crm/activities?${params.toString()}`);
        return response.data;
    },

    getActivity: async (id: string): Promise<Activity> => {
        const response = await apiClient.get(`/crm/activities/${id}`);
        return response.data;
    },

    createActivity: async (data: CreateActivityDto): Promise<Activity> => {
        const response = await apiClient.post('/crm/activities', data);
        return response.data;
    },

    updateActivity: async (id: string, data: UpdateActivityDto): Promise<Activity> => {
        const response = await apiClient.patch(`/crm/activities/${id}`, data);
        return response.data;
    },

    deleteActivity: async (id: string): Promise<void> => {
        await apiClient.delete(`/crm/activities/${id}`);
    },
};
