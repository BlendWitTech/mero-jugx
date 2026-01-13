import apiClient from '@frontend/services/api';

export const crmSettingsApi = {
    getSettings: async (): Promise<Record<string, string>> => {
        const response = await apiClient.get('/crm/settings');
        return response.data;
    },

    getSetting: async (key: string): Promise<string> => {
        const response = await apiClient.get(`/crm/settings/${key}`);
        return response.data;
    },

    updateSetting: async (key: string, value: string): Promise<any> => {
        const response = await apiClient.put(`/crm/settings/${key}`, { settingValue: value });
        return response.data;
    },

    batchUpdateSettings: async (settings: Record<string, string>): Promise<Record<string, string>> => {
        const response = await apiClient.put('/crm/settings', { settings });
        return response.data;
    },
};
