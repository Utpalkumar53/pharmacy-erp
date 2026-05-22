import api from './axiosConfig';

export const getExpiryAlerts = async () => {
    try {
        const response = await api.get('/inventory/expiry/alerts');
        return response.data;
    } catch (error) {
        console.error("Failed to fetch alerts", error);
        throw error;
    }
};