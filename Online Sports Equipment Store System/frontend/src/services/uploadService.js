import api from './api';

export const uploadService = {
  async uploadSlip(orderId, base64Image) {
    const response = await api.post('/upload/slip/' + orderId, { slipImage: base64Image });
    return response.data;
  },

  async confirmSlip(orderId) {
    const response = await api.put('/upload/confirm/' + orderId);
    return response.data;
  },

  async rejectSlip(orderId) {
    const response = await api.put('/upload/reject/' + orderId);
    return response.data;
  }
};