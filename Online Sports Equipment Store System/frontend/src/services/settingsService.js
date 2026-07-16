import api from './api';

export const settingsService = {
  async getPublic() {
    try {
      const response = await api.get('/settings/public');
      return response.data;
    } catch (error) {
      return null;
    }
  },
  
  async getAll() {
    const response = await api.get('/settings');
    return response.data;
  },
  
  async update(settings) {
    const response = await api.put('/settings', settings);
    return response.data;
  }
};