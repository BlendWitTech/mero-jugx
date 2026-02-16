import apiClient from '@frontend/services/api';

export interface Lead {
    id: string;
    organizationId: string;
    first_name: string;
    last_name?: string;
    email?: string;
    phone?: string;
    company?: string;
    job_title?: string;
    status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
    source?: string;
    estimated_value?: number;
    assignedToId?: string;
    assignedTo?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
    custom_fields?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface CreateLeadDto {
    first_name: string;
    last_name?: string;
    email?: string;
    phone?: string;
    company?: string;
    job_title?: string;
    status?: string;
    source?: string;
    estimated_value?: number;
    assigned_to?: string;
    custom_fields?: Record<string, any>;
}

export interface UpdateLeadDto extends Partial<CreateLeadDto> { }

export const leadsApi = {
    getLeads: async (): Promise<Lead[]> => {
        const response = await apiClient.get('/crm/leads');
        return response.data;
    },

    getLead: async (id: string): Promise<Lead> => {
        const response = await apiClient.get(`/crm/leads/${id}`);
        return response.data;
    },

    createLead: async (data: CreateLeadDto): Promise<Lead> => {
        const response = await apiClient.post('/crm/leads', data);
        return response.data;
    },

    updateLead: async (id: string, data: UpdateLeadDto): Promise<Lead> => {
        const response = await apiClient.patch(`/crm/leads/${id}`, data);
        return response.data;
    },

    deleteLead: async (id: string): Promise<void> => {
        await apiClient.delete(`/crm/leads/${id}`);
    },
};
