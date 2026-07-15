import api from './api';

export const uploadService = {
  
  async uploadSlip(orderId, slipImage) {
    const response = await api.post(`/upload/slip/${orderId}`, { slipImage });
    return response.data;
  },

  
  async confirmPayment(orderId) {
    const response = await api.put(`/upload/confirm/${orderId}`);
    return response.data;
  },

  async rejectPayment(orderId) {
    const response = await api.put(`/upload/reject/${orderId}`);
    return response.data;
  }
};