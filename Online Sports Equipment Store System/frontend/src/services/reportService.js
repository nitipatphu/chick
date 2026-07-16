import api from './api';

export const reportService = {

    async getDashboard() {
        const response = await api.get('/reports/dashboard');
        return response.data;
    },

    async getSales(startDate, endDate) {
        const response = await api.get('/reports/sales', {
            params: { startDate: startDate, endDate: endDate }
        });
        return response.data;
    }

};