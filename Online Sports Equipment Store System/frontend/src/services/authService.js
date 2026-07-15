import api from './api';

export const authService = {
  async login(username, password) {
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('✅ Login success, token saved');
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data);
      throw error;
    }
  },

  async register(userData) {
    try {
      console.log('📝 Registering user:', userData);
      const response = await api.post('/auth/register', userData);
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('✅ Register success, token saved');
      }
      return response.data;
    } catch (error) {
      console.error('Register error:', error.response?.data);
      throw error;
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('🔑 Logged out');
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  getToken() {
    return localStorage.getItem('token');
  }
};