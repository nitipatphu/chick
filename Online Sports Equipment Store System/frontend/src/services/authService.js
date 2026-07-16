import api from './api';

export const authService = {
  async login(username, password) {
    try {
      const response = await api.post('/auth/login', { username: username, password: password });
      if (response.data.success === true) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('Login success, token saved');
      }
      return response.data;
    } catch (error) {
      let errorData = undefined;
      if (error.response !== undefined) {
        errorData = error.response.data;
      }
      console.error('Login error:', errorData);
      throw error;
    }
  },

  async register(userData) {
    try {
      console.log('📝 Registering user:', userData);
      const response = await api.post('/auth/register', userData);
      if (response.data.success === true) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('Register success, token saved');
      }
      return response.data;
    } catch (error) {
      let errorData = undefined;
      if (error.response !== undefined) {
        errorData = error.response.data;
      }
      console.error('Register error:', errorData);
      throw error;
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('🔑 Logged out');
  },

  async resetPassword(username, email, newPassword) {
    try {
      const response = await api.post('/auth/reset-password', { username: username, email: email, newPassword: newPassword });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    if (user !== null && user !== undefined) {
      return JSON.parse(user);
    }
    return null;
  },

  isAuthenticated() {
    const token = localStorage.getItem('token');
    if (token !== null && token !== undefined && token !== '') {
      return true;
    }
    return false;
  },

  getToken() {
    return localStorage.getItem('token');
  }
};