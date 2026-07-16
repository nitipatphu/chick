import api from './api';

export const inventoryService = {
  async getInventory() {
    const response = await api.get('/inventory');
    return response.data;
  },
  
  async getLogs() {
    const response = await api.get('/inventory/logs');
    return response.data;
  },
  
  async updateStock(id, data) {
    const response = await api.put('/inventory/' + id + '/stock', data);
    return response.data;
  },

  async getProduct(id) {
    const response = await api.get('/inventory/' + id);
    return response.data;
  },

  async createProduct(data) {
    const response = await api.post('/inventory', data);
    return response.data;
  },

  async updateProduct(id, data) {
    const response = await api.put('/inventory/' + id, data);
    return response.data;
  },

  async deleteProduct(id) {
    const response = await api.delete('/inventory/' + id);
    return response.data;
  }
};