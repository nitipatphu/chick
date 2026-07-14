import api from './api';

export const cartService = {
  async getCart() {
    const response = await api.get('/cart');
    return response.data;
  },

  async addToCart(item) {
    const response = await api.post('/cart', item);
    return response.data;
  },

  async updateQuantity(id, quantity) {
    const response = await api.put(`/cart/${id}`, { quantity });
    return response.data;
  },

  async removeFromCart(id) {
    const response = await api.delete(`/cart/${id}`);
    return response.data;
  },

  async clearCart() {
    const response = await api.delete('/cart');
    return response.data;
  },

  async checkout(shippingAddress, paymentMethod) {
    const response = await api.post('/orders', { shippingAddress, paymentMethod });
    return response.data;
  }
};