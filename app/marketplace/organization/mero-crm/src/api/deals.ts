import apiClient from '@frontend/services/api';
import { Lead } from './leads';

export interface Deal {
    id: string;
    organizationId: string;
    title: string;
    value: number;
    currency: string;
    pipelineId?: string;
    stageId?: string;
    stage: string;
    expected_close_date?: string;
    leadId?: string;
    lead?: Lead;
    assignedToId?: string;
    assignedTo?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
    probability: number;
    status: 'OPEN' | 'WON' | 'LOST';
    createdAt: string;
    updatedAt: string;
}

export interface CreateDealDto {
    title: string;
    value: number;
    currency?: string;
    stage?: string;
    expected_close_date?: string;
    lead_id?: string;
    assigned_to?: string;
    probability?: number;
    status?: string;
}

export interface UpdateDealDto extends Partial<CreateDealDto> { }

export const dealsApi = {
    getDeals: async (): Promise<Deal[]> => {
        const response = await apiClient.get('/crm/deals');
        return response.data;
    },

    getDeal: async (id: string): Promise<Deal> => {
        const response = await apiClient.get(`/crm/deals/${id}`);
        return response.data;
    },

    createDeal: async (data: CreateDealDto): Promise<Deal> => {
        const response = await apiClient.post('/crm/deals', data);
        return response.data;
    },

    updateDeal: async (id: string, data: UpdateDealDto): Promise<Deal> => {
        const response = await apiClient.patch(`/crm/deals/${id}`, data);
        return response.data;
    },

    deleteDeal: async (id: string): Promise<void> => {
        await apiClient.delete(`/crm/deals/${id}`);
    },
};
