import { api } from "@/lib/apiClient";
import apiRoutes from "@/constants/apis";

/**
 * Dashboard Service
 * Handles all dashboard-related API calls
 */

export const getAdminDashboard = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add optional parameters
        if (params.startDate) queryParams.append('StartDate', params.startDate);
        if (params.endDate) queryParams.append('EndDate', params.endDate);
        if (params.topShipments) queryParams.append('topShipments', params.topShipments);
        if (params.topCOD) queryParams.append('topCOD', params.topCOD);
        if (params.onlyDelivered !== undefined) queryParams.append('onlyDelivered', params.onlyDelivered);

        const url = `${apiRoutes.dashboard.admin}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);
        
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch admin dashboard data.';
        throw new Error(message);
    }
};

export const getDCDashboard = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();

        if (params.startDate) queryParams.append('StartDate', params.startDate);
        if (params.endDate) queryParams.append('EndDate', params.endDate);
        if (params.topShipments) queryParams.append('topShipments', params.topShipments);
        if (params.topCOD) queryParams.append('topCOD', params.topCOD);
        if (params.onlyDelivered !== undefined) queryParams.append('onlyDelivered', params.onlyDelivered);

        const url = `${apiRoutes.dashboard.dcManager}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);

        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch DC dashboard data.';
        throw new Error(message);
    }
};

export const getVendorDashboard = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();

        if (params.vendorCode) queryParams.append('vendorCode', params.vendorCode);
        if (params.startDate) queryParams.append('StartDate', params.startDate);
        if (params.endDate) queryParams.append('EndDate', params.endDate);
        if (params.recentTop) queryParams.append('recentTop', params.recentTop);

        const url = `${apiRoutes.dashboard.vendor}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);

        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch vendor dashboard data.';
        throw new Error(message);
    }
};

export const getAgentDashboard = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();

        if (params.startDate) queryParams.append('StartDate', params.startDate);
        if (params.endDate) queryParams.append('EndDate', params.endDate);
        if (params.recentTop) queryParams.append('recentTop', params.recentTop);

        const url = `${apiRoutes.dashboard.agent}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);

        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch agent dashboard data.';
        throw new Error(message);
    }
};

export const getRiderDashboard = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();

        if (params.riderUserCode) queryParams.append('riderUserCode', params.riderUserCode);
        if (params.startDate) queryParams.append('StartDate', params.startDate);
        if (params.endDate) queryParams.append('EndDate', params.endDate);
        if (params.topShipments) queryParams.append('topShipments', params.topShipments);
        if (params.topCOD) queryParams.append('topCOD', params.topCOD);
        if (params.onlyDelivered !== undefined) queryParams.append('onlyDelivered', params.onlyDelivered);

        const url = `${apiRoutes.dashboard.rider}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);

        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch rider dashboard data.';
        throw new Error(message);
    }
};

// Export all dashboard service functions
const dashboardService = {
    getAdminDashboard,
    getDCDashboard,
    getVendorDashboard,
    getAgentDashboard,
    getRiderDashboard
};

export default dashboardService;
