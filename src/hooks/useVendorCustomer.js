import { useState, useCallback } from 'react';
import vendorCustomerService from '../services/vendorCustomerService';
import notify from '@/lib/toast';

/**
 * Custom hook for vendor customer operations
 * Provides functions and state management for vendor customer related operations
 */
const useVendorCustomer = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        pageSize: 100
    });

    /**
     * Register a new vendor customer
     * @param {Object} customerData - Customer registration data
     * @returns {Promise<Object>} Registration result
     */
    const registerCustomer = useCallback(async (customerData) => {
        setLoading(true);
        setError(null);

        try {
            const result = await vendorCustomerService.registerCustomer(customerData);

            if (!result.Error && result.StatusCode === 200) {
                notify.success(result.Message || 'Customer registered successfully');
                return { success: true, data: result };
            } else {
                const errorMessage = result.Message || 'Failed to register customer';
                setError(errorMessage);
                notify.error(errorMessage);
                return { success: false, error: errorMessage };
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to register customer';
            setError(errorMessage);
            notify.error(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Fetch vendor customers with pagination and search
     * @param {Object} params - Query parameters
     * @param {string} params.vendorCode - Vendor code to filter by
     * @param {string} params.vendorCustomerCode - Specific vendor customer code to filter by
     * @param {number} params.pageNo - Page number
     * @param {number} params.pageSize - Page size
     * @param {string} params.searchTerm - Search term
     * @returns {Promise<void>}
     */
    const fetchCustomers = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);

        try {
            const result = await vendorCustomerService.getCustomers(params);

            if (!result.Error && result.StatusCode === 200) {
                setCustomers(result.Data || []);

                setPagination({
                    currentPage: result.PageNO || params.pageNo || 1,
                    totalPages: result.TotalPages || 0,
                    totalItems: result.TotalCount || 0,
                    pageSize: result.PageSize || params.pageSize || 100
                });
            } else {
                const errorMessage = result.Message || 'Failed to fetch customers';
                setError(errorMessage);
                notify.error(errorMessage);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch customers';
            setError(errorMessage);
            notify.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Fetch customers for a specific vendor
     * @param {string} vendorCode - Vendor code
     * @param {Object} options - Additional options
     * @returns {Promise<void>}
     */
    const fetchCustomersByVendor = useCallback(async (vendorCode, options = {}) => {
        if (!vendorCode) {
            setError('Vendor code is required');
            notify.error('Vendor code is required');
            return;
        }

        await fetchCustomers({
            vendorCode,
            ...options
        });
    }, [fetchCustomers]);

    /**
     * Search customers
     * @param {string} searchTerm - Search term
     * @param {Object} additionalParams - Additional search parameters
     * @returns {Promise<void>}
     */
    const searchCustomers = useCallback(async (searchTerm, additionalParams = {}) => {
        await fetchCustomers({
            searchTerm,
            pageNo: 1, // Reset to first page when searching
            ...additionalParams
        });
    }, [fetchCustomers]);

    /**
     * Load next page of customers
     * @param {Object} currentParams - Current query parameters
     * @returns {Promise<void>}
     */
    const loadNextPage = useCallback(async (currentParams = {}) => {
        if (pagination.currentPage < pagination.totalPages) {
            await fetchCustomers({
                ...currentParams,
                pageNo: pagination.currentPage + 1
            });
        }
    }, [fetchCustomers, pagination]);

    /**
     * Load previous page of customers
     * @param {Object} currentParams - Current query parameters
     * @returns {Promise<void>}
     */
    const loadPreviousPage = useCallback(async (currentParams = {}) => {
        if (pagination.currentPage > 1) {
            await fetchCustomers({
                ...currentParams,
                pageNo: pagination.currentPage - 1
            });
        }
    }, [fetchCustomers, pagination]);

    /**
     * Refresh customers list
     * @param {Object} currentParams - Current query parameters
     * @returns {Promise<void>}
     */
    const refreshCustomers = useCallback(async (currentParams = {}) => {
        await fetchCustomers(currentParams);
    }, [fetchCustomers]);

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * Reset all state
     */
    const resetState = useCallback(() => {
        setCustomers([]);
        setError(null);
        setLoading(false);
        setPagination({
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            pageSize: 100
        });
    }, []);

    /**
     * Update vendor customer information
     * @param {Object} customerData - Customer update data
     * @returns {Promise<Object>} Update result
     */
    const updateCustomer = useCallback(async (customerData) => {
        setLoading(true);
        setError(null);

        try {
            const result = await vendorCustomerService.updateCustomer(customerData);

            if (!result.Error && result.StatusCode === 200) {
                notify.success(result.Message || 'Customer updated successfully');
                return { success: true, data: result };
            } else {
                const errorMessage = result.Message || 'Failed to update customer';
                setError(errorMessage);
                notify.error(errorMessage);
                return { success: false, error: errorMessage };
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to update customer';
            setError(errorMessage);
            notify.error(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Deactivate vendor customer
     * @param {Object} deactivationData - Deactivation data
     * @returns {Promise<Object>} Deactivation result
     */
    const deactivateCustomer = useCallback(async (deactivationData) => {
        setLoading(true);
        setError(null);

        try {
            const result = await vendorCustomerService.deactivateCustomer(deactivationData);

            if (!result.Error && result.StatusCode === 200) {
                notify.success(result.Message || 'Customer deactivated successfully');
                return { success: true, data: result };
            } else {
                const errorMessage = result.Message || 'Failed to deactivate customer';
                setError(errorMessage);
                notify.error(errorMessage);
                return { success: false, error: errorMessage };
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to deactivate customer';
            setError(errorMessage);
            notify.error(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Update vendor customer address
     * @param {Object} addressData - Address update data
     * @returns {Promise<Object>} Update result
     */
    const updateCustomerAddress = useCallback(async (addressData) => {
        setLoading(true);
        setError(null);

        try {
            const result = await vendorCustomerService.updateCustomerAddress(addressData);

            if (!result.Error && result.StatusCode === 200) {
                notify.success(result.Message || 'Customer address updated successfully');
                return { success: true, data: result };
            } else {
                const errorMessage = result.Message || 'Failed to update customer address';
                setError(errorMessage);
                notify.error(errorMessage);
                return { success: false, error: errorMessage };
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to update customer address';
            setError(errorMessage);
            notify.error(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Deactivate vendor customer address
     * @param {Object} deactivationData - Address deactivation data
     * @returns {Promise<Object>} Deactivation result
     */
    const deactivateCustomerAddress = useCallback(async (deactivationData) => {
        setLoading(true);
        setError(null);

        try {
            const result = await vendorCustomerService.deactivateCustomerAddress(deactivationData);

            if (!result.Error && result.StatusCode === 200) {
                notify.success(result.Message || 'Customer address deactivated successfully');
                return { success: true, data: result };
            } else {
                const errorMessage = result.Message || 'Failed to deactivate customer address';
                setError(errorMessage);
                notify.error(errorMessage);
                return { success: false, error: errorMessage };
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to deactivate customer address';
            setError(errorMessage);
            notify.error(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Add new vendor customer address
     * @param {Object} addressData - Address data
     * @returns {Promise<Object>} Add result
     */
    const addCustomerAddress = useCallback(async (addressData) => {
        setLoading(true);
        setError(null);

        try {
            const result = await vendorCustomerService.addCustomerAddress(addressData);

            if (!result.Error && result.StatusCode === 200) {
                notify.success(result.Message || 'Customer address added successfully');
                return { success: true, data: result };
            } else {
                const errorMessage = result.Message || 'Failed to add customer address';
                setError(errorMessage);
                notify.error(errorMessage);
                return { success: false, error: errorMessage };
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to add customer address';
            setError(errorMessage);
            notify.error(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        // State
        customers,
        loading,
        error,
        pagination,

        // Actions
        registerCustomer,
        fetchCustomers,
        fetchCustomersByVendor,
        searchCustomers,
        loadNextPage,
        loadPreviousPage,
        refreshCustomers,
        updateCustomer,
        deactivateCustomer,
        updateCustomerAddress,
        deactivateCustomerAddress,
        addCustomerAddress,
        clearError,
        resetState,

        // Computed values
        hasNextPage: pagination.currentPage < pagination.totalPages,
        hasPreviousPage: pagination.currentPage > 1,
        isEmpty: customers.length === 0 && !loading
    };
};

export default useVendorCustomer;
