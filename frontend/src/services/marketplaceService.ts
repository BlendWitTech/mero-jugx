import api from './api';

export const marketplaceService = {
  async getFavorites() {
    const res = await api.get('/marketplace/favorites');
    return res.data as any[];
  },
  async setFavorites(appIds: number[]) {
    const res = await api.post('/marketplace/favorites', { app_ids: appIds });
    return res.data;
  },
  async getLastUsed() {
    const res = await api.get('/marketplace/last-used');
    return res.data as any[];
  },
  async recordUsage(appId: number) {
    const res = await api.post('/marketplace/usage', { app_id: appId });
    return res.data;
  },
  async reauth(body: { password?: string; mfa_code?: string }) {
    const res = await api.post('/marketplace/reauth', body);
    return res.data as { app_session_token: string };
  },
  async getPinned() {
    const res = await api.get('/marketplace/pinned');
    return res.data as any[];
  },
  async pinApp(appId: number) {
    const res = await api.post('/marketplace/pinned', { app_id: appId });
    return res.data;
  },
  async unpinApp(appId: number) {
    const res = await api.post('/marketplace/pinned/unpin', { app_id: appId });
    return res.data;
  },
};

