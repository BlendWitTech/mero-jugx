import apiClient from '@frontend/services/api';

export interface PaymentMode {
    id: string;
    name: string;
    description?: string;
    isDefault: boolean;
    enabled: boolean;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
    removed: boolean;
}

export interface CreatePaymentModeDto {
    name: string;
    description?: string;
    isDefault?: boolean;
}

export interface UpdatePaymentModeDto extends Partial<CreatePaymentModeDto> {
    enabled?: boolean;
}

export const paymentModesApi = {
    getPaymentModes: async (enabledOnly?: boolean): Promise<PaymentMode[]> => {
        const response = await apiClient.get('/crm/payment-modes', {
            params: { enabledOnly }
        });
        return response.data;
    },

    getPaymentMode: async (id: string): Promise<PaymentMode> => {
        const response = await apiClient.get(`/crm/payment-modes/${id}`);
        return response.data;
    },

    createPaymentMode: async (data: CreatePaymentModeDto): Promise<PaymentMode> => {
        const response = await apiClient.post('/crm/payment-modes', data);
        return response.data;
    },

    updatePaymentMode: async (id: string, data: UpdatePaymentModeDto): Promise<PaymentMode> => {
        const response = await apiClient.put(`/crm/payment-modes/${id}`, data);
        return response.data;
    },

    deletePaymentMode: async (id: string): Promise<void> => {
        await apiClient.delete(`/crm/payment-modes/${id}`);
    },
};
