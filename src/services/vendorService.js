import { api } from "@/lib/apiClient";
import apiRoutes from "@/constants/apis";

/**
 * Vendor Service
 * Handles all vendor-related API calls
 */

export const getVendors = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add optional parameters
        if (params.pageNo) queryParams.append('PageNO', params.pageNo);
        if (params.pageSize) queryParams.append('PageSize', params.pageSize);
        if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
        if (params.dcCode) queryParams.append('dcCode', params.dcCode);

        const url = `${apiRoutes.vendors.list}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);
        
        return response.data;
    } catch (error) {
        const message = error.response?.data?.Message || error.message || 'Failed to fetch vendors.';
        throw new Error(message);
    }
};

export const createVendor = async (payload) => {
    try {
        const response = await api.post(apiRoutes.vendors.create, payload);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.Message || error.message || 'Failed to create vendor.';
        throw new Error(message);
    }
};

export const updateVendor = async (payload) => {
    try {
        const response = await api.post(apiRoutes.vendors.update, payload);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.Message || error.message || 'Failed to update vendor.';
        throw new Error(message);
    }
};

export const deactivateVendor = async (payload) => {
    try {
        const response = await api.post(apiRoutes.vendors.deactivate, payload);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.Message || error.message || 'Failed to deactivate vendor.';
        throw new Error(message);
    }
};
export const getVendorCategories = async () => {
    try {
        const response = await api.get(apiRoutes.vendors.getCategories);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.Message || error.message || "Failed to fetch vendor categories.";
        throw new Error(message);
    }
};
// Vendor Product Service Functions

export const getVendorProducts = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add optional parameters
        if (params.pageNo) queryParams.append('PageNO', params.pageNo);
        if (params.pageSize) queryParams.append('PageSize', params.pageSize);
        if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
        if (params.vendorCode) queryParams.append('vendorCode', params.vendorCode);
        if (params.vendorProductCode) queryParams.append('vendorProductCode', params.vendorProductCode);
        if (params.onlyActive !== undefined) queryParams.append('onlyActive', params.onlyActive);
        
        // Also try VendorCode (capitalized) in case the API is case-sensitive
        if (params.vendorCode) queryParams.append('VendorCode', params.vendorCode);

        const url = `${apiRoutes.vendors.products.list}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        
        const response = await api.get(url);
        
        return response.data;
    } catch (error) {
        console.error('Error fetching vendor products:', error);
        const message = error.response?.data?.Message || error.message || 'Failed to fetch vendor products.';
        throw new Error(message);
    }
};

export const createVendorProduct = async (payload) => {
    try {
        const response = await api.post(apiRoutes.vendors.products.create, payload);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.Message || error.message || 'Failed to create vendor product.';
        throw new Error(message);
    }
};

export const updateVendorProduct = async (payload, id) => {
    try {
        const queryParams = new URLSearchParams();
        if (id) queryParams.append('id', id);
        
        const url = `${apiRoutes.vendors.products.update}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.post(url, payload);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.Message || error.message || 'Failed to update vendor product.';
        throw new Error(message);
    }
};

export const deactivateVendorProduct = async (payload) => {
    try {
        let response;

        // Try different approaches
        const attempts = [
            // Attempt 1: Request body with POST (primary method based on Swagger)
            async () => {
                const requestPayload = { vendorProductCode: payload.vendorProductCode };
                return await api.post(apiRoutes.vendors.products.deactivate, requestPayload);
            },
            // Attempt 2: Query parameters with POST
            async () => {
                const queryParams = new URLSearchParams();
                queryParams.append('vendorProductCode', payload.vendorProductCode);
                const url = `${apiRoutes.vendors.products.deactivate}?${queryParams.toString()}`;
                return await api.post(url, {});
            },
            // Attempt 3: PUT with request body
            async () => {
                const requestPayload = { vendorProductCode: payload.vendorProductCode };
                return await api.put(apiRoutes.vendors.products.deactivate, requestPayload);
            }
        ];

        for (let i = 0; i < attempts.length; i++) {
            try {
                response = await attempts[i]();
                break;
            } catch (attemptError) {
                if (i === attempts.length - 1) {
                    throw attemptError; // If all attempts fail, throw the last error
                }
            }
        }

        return response.data;
    } catch (error) {
        const message = error.response?.data?.Message || error.message || 'Failed to deactivate vendor product.';
        throw new Error(message);
    }
};

// Vendor Store Service Functions

export const getVendorStores = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();

        if (params.vendorCode) queryParams.append('vendorCode', params.vendorCode);
        if (params.vendorStoreCode) queryParams.append('vendorStoreCode', params.vendorStoreCode);
        if (params.search) queryParams.append('search', params.search);
        if (params.pageNo) queryParams.append('pageNo', params.pageNo);
        if (params.pageSize) queryParams.append('pageSize', params.pageSize);

        const url = `${apiRoutes.vendors.stores.list}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);

        return response.data;
    } catch (error) {
        const message = error.response?.data?.Message || error.message || 'Failed to fetch vendor stores.';
        throw new Error(message);
    }
};

export const createVendorStore = async (payload) => {
    try {
        // CreateVendorStore reads the acting user from the UserCode header (endpoint is anonymous).
        let userCode = '';
        if (typeof window !== 'undefined') {
            try {
                const storedUser = JSON.parse(localStorage.getItem('cossim-user') || 'null');
                userCode = storedUser?.UserCode || storedUser?.UserID || storedUser?.userID || '';
            } catch (e) {
                userCode = '';
            }
        }

        const response = await api.post(apiRoutes.vendors.stores.create, payload, {
            headers: userCode ? { UserCode: userCode } : {},
        });
        return response.data;
    } catch (error) {
        const message = error.response?.data?.Message || error.message || 'Failed to create vendor store.';
        throw new Error(message);
    }
};

export const updateVendorStore = async (payload) => {
    try {
        const response = await api.post(apiRoutes.vendors.stores.update, payload);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.Message || error.message || 'Failed to update vendor store.';
        throw new Error(message);
    }
};

export const deactivateVendorStore = async (payload) => {
    try {
        const response = await api.post(apiRoutes.vendors.stores.deactivate, payload);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.Message || error.message || 'Failed to deactivate vendor store.';
        throw new Error(message);
    }
};

export const getVendorSummary = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
        if (params.pageNo) queryParams.append('pageNo', params.pageNo);
        if (params.pageSize) queryParams.append('pageSize', params.pageSize);

        const url = `${apiRoutes.vendors.getSummary}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.Message || error.message || 'Failed to fetch vendor summary.';
        throw new Error(message);
    }
};

export const getVendorStatement = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.VendorCode) queryParams.append('VendorCode', params.VendorCode);
        if (params.StartDate) queryParams.append('StartDate', params.StartDate);
        if (params.EndDate) queryParams.append('EndDate', params.EndDate);
        if (params.PageNO) queryParams.append('PageNO', params.PageNO);
        if (params.PageSize) queryParams.append('PageSize', params.PageSize);

        const url = `${apiRoutes.vendors.getStatement}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.Message || error.message || 'Failed to fetch vendor statement.';
        throw new Error(message);
    }
};

export const getVendorPayments = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.VendorCode) queryParams.append('VendorCode', params.VendorCode);
        if (params.PageNO) queryParams.append('PageNO', params.PageNO);
        if (params.PageSize) queryParams.append('PageSize', params.PageSize);

        const url = `${apiRoutes.vendors.getPayments}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.Message || error.message || 'Failed to fetch vendor payments.';
        throw new Error(message);
    }
};

// Export all vendor service functions
const vendorService = {
    getVendors,
    createVendor,
    updateVendor,
    deactivateVendor,
    getVendorProducts,
    createVendorProduct,
    updateVendorProduct,
    deactivateVendorProduct,
    getVendorStores,
    createVendorStore,
    updateVendorStore,
    deactivateVendorStore,
    getVendorSummary,
    getVendorStatement,
    getVendorPayments,
};

export default vendorService;
