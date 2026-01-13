import apiClient from '@frontend/services/api';

export interface Payment {
    id: string;
    invoiceId: string;
    amount: number;
    paymentMethod: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other';
    paymentDate: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    notes?: string;
    organizationId: string;
    createdById: string;
    createdAt: string;
    updatedAt: string;
    removed: boolean;
    invoice?: {
        id: string;
        invoiceNumber: string;
        total: number;
        client?: {
            id: string;
            name: string;
        };
    };
    createdBy?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
}

export interface CreatePaymentDto {
    invoiceId: string;
    amount: number;
    paymentMethod: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other';
    paymentDate: string;
    notes?: string;
    status?: 'pending' | 'completed';
}

export interface UpdatePaymentDto extends Partial<Omit<CreatePaymentDto, 'status'>> {
    status?: 'pending' | 'completed' | 'failed' | 'refunded';
}

export interface PaymentsResponse {
    data: Payment[];
    total: number;
    page: number;
    limit: number;
}

export const paymentsApi = {
    getPayments: async (page = 1, limit = 10, search?: string, status?: string): Promise<PaymentsResponse> => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        if (search) {
            params.append('search', search);
        }
        if (status) {
            params.append('status', status);
        }
        const response = await apiClient.get(`/crm/payments?${params.toString()}`);
        return response.data;
    },

    getPayment: async (id: string): Promise<Payment> => {
        const response = await apiClient.get(`/crm/payments/${id}`);
        return response.data;
    },

    createPayment: async (data: CreatePaymentDto): Promise<Payment> => {
        const response = await apiClient.post('/crm/payments', data);
        return response.data;
    },

    updatePayment: async (id: string, data: UpdatePaymentDto): Promise<Payment> => {
        const response = await apiClient.patch(`/crm/payments/${id}`, data);
        return response.data;
    },

    deletePayment: async (id: string): Promise<void> => {
        await apiClient.delete(`/crm/payments/${id}`);
    },

    restorePayment: async (id: string): Promise<Payment> => {
        const response = await apiClient.post(`/crm/payments/${id}/restore`);
        return response.data;
    },
};
