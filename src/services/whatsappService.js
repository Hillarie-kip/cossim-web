import { api } from "@/lib/apiClient";
import apiRoutes from "@/constants/apis";

/**
 * WhatsApp Service
 * Handles all WhatsApp webhook-related API calls
 */

export const getWebhooks = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add query parameters based on swagger - exact parameter names may vary
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                queryParams.append(key, params[key]);
            }
        });

        const url = `${apiRoutes.whatsapp.webhooks}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);
        
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch WhatsApp webhooks.';
        throw new Error(message);
    }
};

export const createWebhook = async (payload) => {
    try {
        const response = await api.post(apiRoutes.whatsapp.webhooks, payload);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to create WhatsApp webhook.';
        throw new Error(message);
    }
};

export const getWebhook = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add query parameters based on swagger - exact parameter names may vary
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                queryParams.append(key, params[key]);
            }
        });

        const url = `${apiRoutes.whatsapp.webhook}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);
        
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch WhatsApp webhook.';
        throw new Error(message);
    }
};

// Export all WhatsApp service functions
const whatsappService = {
    getWebhooks,
    createWebhook,
    getWebhook,
};

export default whatsappService;
