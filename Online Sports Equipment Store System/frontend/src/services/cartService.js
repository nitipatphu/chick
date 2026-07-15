import api from './api';

export const cartService = {
  async getCart() {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error) {
      console.error('Error getting cart:', error);
      throw error;
    }
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
    try {
      const response = await api.delete('/cart');
      return response.data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  },

  async checkout(shippingAddress, paymentMethod) {
    const response = await api.post('/orders', { shippingAddress, paymentMethod });
    return response.data;
  }
};