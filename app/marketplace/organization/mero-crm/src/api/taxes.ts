import apiClient from '@frontend/services/api';

export interface Tax {
    id: string;
    taxName: string;
    taxValue: number;
    isDefault: boolean;
    enabled: boolean;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
    removed: boolean;
}

export interface CreateTaxDto {
    taxName: string;
    taxValue: number;
    isDefault?: boolean;
}

export interface UpdateTaxDto extends Partial<CreateTaxDto> {
    enabled?: boolean;
}

export const taxesApi = {
    getTaxes: async (enabledOnly?: boolean): Promise<Tax[]> => {
        const response = await apiClient.get('/crm/taxes', {
            params: { enabledOnly }
        });
        return response.data;
    },

    getTax: async (id: string): Promise<Tax> => {
        const response = await apiClient.get(`/crm/taxes/${id}`);
        return response.data;
    },

    createTax: async (data: CreateTaxDto): Promise<Tax> => {
        const response = await apiClient.post('/crm/taxes', data);
        return response.data;
    },

    updateTax: async (id: string, data: UpdateTaxDto): Promise<Tax> => {
        const response = await apiClient.put(`/crm/taxes/${id}`, data);
        return response.data;
    },

    deleteTax: async (id: string): Promise<void> => {
        await apiClient.delete(`/crm/taxes/${id}`);
    },
};
