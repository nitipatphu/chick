import api from './api';

export const orderService = {

    async getAll() {
        const response = await api.get('/orders');
        return response.data;
    },


    async getById(id) {
        const response = await api.get(`/orders/${id}`);
        return response.data;
    },


    async create(orderData) {
        const response = await api.post('/orders', orderData);
        return response.data;
    },


    async cancelOrder(id) {
        const response = await api.put(`/orders/${id}/cancel`);
        return response.data;
    },




    async getStaffOrders() {
        const response = await api.get('/orders');
        return response.data;
    },

    async getAdminOrders() {
        const response = await api.get('/orders');
        return response.data;
    },


    async getAdminOrderDetail(id) {
        const response = await api.get(`/orders/${id}`);
        return response.data;
    },


    async updateOrderStatus(id, status, extraData = {}) {
        const response = await api.put(`/orders/${id}/status`, { status, ...extraData });
        return response.data;
    }
};