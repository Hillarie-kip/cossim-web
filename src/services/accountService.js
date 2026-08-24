import { api } from "@/lib/apiClient";
import apiRoutes from "@/constants/apis";

/**
 * Account Service
 * Handles all account-related API calls
 */

export const confirmPayment = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();

        // Add required parameters - match Swagger spec exactly
        if (params.TransID) queryParams.append('TransID', params.TransID);
        if (params.TotalOrderAmount) queryParams.append('TotalOrderAmount', params.TotalOrderAmount);

        const url = `${apiRoutes.account.confirmPayment}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.post(url);

        return response.data;
    } catch (error) {
        const message = error.response?.data?.Message || error.message || 'Failed to confirm payment.';
        throw new Error(message);
    }
};

export const completeServicePayment = async (payload) => {
    try {
        const response = await api.post(apiRoutes.account.completeServicePayment, payload);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.Message || error.message || 'Failed to complete service payment.';
        throw new Error(message);
    }
};

export const requestSTKPush = async (payload) => {
    try {
        const response = await api.post(apiRoutes.account.requestSTKPush, payload);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.Message || error.message || 'Failed to request STK push.';
        throw new Error(message);
    }
};

export const getSTKResults = async () => {
    try {
        const response = await api.post(apiRoutes.account.STKResults);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.Message || error.message || 'Failed to get STK results.';
        throw new Error(message);
    }
};

export const checkStkPush = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();

        // Add required parameters
        if (params.checkoutRequestID) queryParams.append('CheckoutRequestID', params.checkoutRequestID);

        const url = `${apiRoutes.account.checkStkPush}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.post(url);

        return response.data;
    } catch (error) {
        const message = error.response?.data?.Message || error.message || 'Failed to check STK push.';
        throw new Error(message);
    }
};

export const postMpesaOrder = async (payload) => {
    try {
        const response = await api.post(apiRoutes.account.postMpesaOrder, payload);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.Message || error.message || 'Failed to initiate client STK push.';
        throw new Error(message);
    }
};

const accountService = {
    confirmPayment,
    completeServicePayment,
    requestSTKPush,
    getSTKResults,
    checkStkPush,
    postMpesaOrder
};

export default accountService;
