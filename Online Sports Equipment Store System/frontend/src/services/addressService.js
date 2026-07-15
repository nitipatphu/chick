import api from './api';

export const addressService = {
  async getAll() {
    const response = await api.get('/addresses');
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/addresses/${id}`);
    return response.data;
  },

  async create(addressData) {
    const response = await api.post('/addresses', addressData);
    return response.data;
  },

  async update(id, addressData) {
    const response = await api.put(`/addresses/${id}`, addressData);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/addresses/${id}`);
    return response.data;
  },

  async setDefault(id) {
    const response = await api.put(`/addresses/${id}/default`);
    return response.data;
  }
};