import api from './api';

export const userService = {
  async getAll() {
    const response = await api.get('/users');
    return response.data;
  },

  async getById(id) {
    const response = await api.get('/users/' + id);
    return response.data;
  },

  async create(userData) {
    const response = await api.post('/users', userData);
    return response.data;
  },

  async update(id, userData) {
    const response = await api.put('/users/' + id, userData);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete('/users/' + id);
    return response.data;
  },

  async changePassword(id, newPassword) {
    const response = await api.put('/users/' + id, { password: newPassword });
    return response.data;
  },

  async updateProfile(profileData) {
    const response = await api.put('/users/profile/me', profileData);
    return response.data;
  }
};