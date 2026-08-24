import apiClient from '../lib/apiClient';
import apiRoutes from '../constants/apis';

/**
 * Vendor Customer Service
 * Handles all vendor customer related API calls
 */
const vendorCustomerService = {
    /**
     * Register a new vendor customer
     * @param {Object} customerData - Customer registration data
     * @param {string} customerData.vendorCode - Vendor code
     * @param {string} customerData.customerName - Customer name
     * @param {string} customerData.phoneNumber - Customer phone number
     * @param {string} customerData.emailAddress - Customer email address
     * @param {string} customerData.preferredDCCode - Preferred distribution center code
     * @param {string} customerData.addedBy - User who added the customer
     * @param {Array} customerData.locationarray - Array of customer addresses
     * @returns {Promise} API response
     */
    async registerCustomer(customerData) {
        try {
            // check if vendor code exists in the body
            if (!customerData.vendorCode) {
                const user = JSON.parse(localStorage.getItem('cossim-user'));
                customerData.vendorCode = user?.AssignedVendor.VendorCode;
            }
            const response = await apiClient.post(apiRoutes.vendorCustomer.register, customerData);
            return response.data;
        } catch (error) {
            console.error('Error registering vendor customer:', error);
            throw error;
        }
    },

    /**
     * Get vendor customers with pagination and search
     * @param {Object} params - Query parameters
     * @param {string} params.vendorCode - Vendor code to filter by
     * @param {string} params.vendorCustomerCode - Specific vendor customer code to filter by
     * @param {number} params.pageNo - Page number (default: 1)
     * @param {number} params.pageSize - Page size (default: 50)
     * @param {string} params.searchTerm - Search term for filtering
     * @returns {Promise} API response
     */
    async getCustomers(params = {}) {
        try {
            const queryParams = new URLSearchParams();

            if (params.vendorCode) queryParams.append('VendorCode', params.vendorCode);
            if (params.vendorCustomerCode) queryParams.append('VendorCustomerCode', params.vendorCustomerCode);
            if (params.pageNo) queryParams.append('PageNO', params.pageNo);
            if (params.pageSize) queryParams.append('PageSize', params.pageSize);
            if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);

            if (!params.vendorCode) {
                const user = JSON.parse(localStorage.getItem('cossim-user'));
                queryParams.append('VendorCode', user?.AssignedVendor.VendorCode);
            }

            const url = `${apiRoutes.vendorCustomer.list}?${queryParams.toString()}`;
            const response = await apiClient.get(url);
            return response.data;
        } catch (error) {
            console.error('Error fetching vendor customers:', error);
            throw error;
        }
    },

    /**
     * Get customers for a specific vendor
     * @param {string} vendorCode - Vendor code
     * @param {Object} options - Additional options
     * @param {number} options.pageNo - Page number
     * @param {number} options.pageSize - Page size
     * @param {string} options.searchTerm - Search term
     * @returns {Promise} API response
     */
    async getCustomersByVendor(vendorCode, options = {}) {
        return this.getCustomers({
            vendorCode,
            ...options
        });
    },

    /**
     * Update vendor customer information
     * @param {Object} customerData - Customer update data
     * @param {string} customerData.vendorCustomerCode - Vendor customer code (required)
     * @param {string} customerData.customerName - Updated customer name
     * @param {string} customerData.phoneNumber - Updated phone number
     * @param {string} customerData.emailAddress - Updated email address
     * @param {string} customerData.preferredDCCode - Updated preferred DC code
     * @returns {Promise} API response
     */
    async updateCustomer(customerData) {
        try {
            if (!customerData.vendorCustomerCode) {
                throw new Error('Customer code is required for update');
            }
            const response = await apiClient.post(apiRoutes.vendorCustomer.updateCustomer, customerData);
            return response.data;
        } catch (error) {
            console.error('Error updating vendor customer:', error);
            throw error;
        }
    },

    /**
     * Deactivate a vendor customer
     * @param {Object} deactivationData - Deactivation data
     * @param {string} deactivationData.vendorCustomerCode - Vendor customer code (required)
     * @param {string} deactivationData.deactivatedBy - User who deactivated the customer
     * @returns {Promise} API response
     */
    async deactivateCustomer(deactivationData) {
        try {
            if (!deactivationData.vendorCustomerCode) {
                throw new Error('Customer code is required for deactivation');
            }
            const response = await apiClient.post(apiRoutes.vendorCustomer.deactivateCustomer, deactivationData);
            return response.data;
        } catch (error) {
            console.error('Error deactivating vendor customer:', error);
            throw error;
        }
    },

    /**
     * Update vendor customer address
     * @param {Object} addressData - Address update data
     * @param {string} addressData.vendorCustomerAddressCode - Address code (required)
     * @param {string} addressData.vendorCustomerCode - Customer code (required)
     * @param {string} addressData.customerAddressDCCode - Updated DC code
     * @param {string} addressData.addressLine - Updated address line
     * @param {string} addressData.landmark - Updated landmark
     * @param {boolean} addressData.isDefault - Whether this is the default address
     * @param {string} addressData.addedBy - User who updated the address
     * @returns {Promise} API response
     */
    async updateCustomerAddress(addressData) {
        try {
            if (!addressData.vendorCustomerAddressCode || !addressData.vendorCustomerCode) {
                throw new Error('Address code and customer code are required for address update');
            }
            const response = await apiClient.post(apiRoutes.vendorCustomer.updateCustomerAddress, addressData);
            return response.data;
        } catch (error) {
            console.error('Error updating vendor customer address:', error);
            throw error;
        }
    },

    /**
     * Deactivate vendor customer address
     * @param {Object} deactivationData - Address deactivation data
     * @param {string} deactivationData.vendorCustomerAddressCode - Address code (required)
     * @param {string} deactivationData.vendorCustomerCode - Customer code (required)
     * @param {string} deactivationData.addedBy - User who deactivated the address
     * @returns {Promise} API response
     */
    async deactivateCustomerAddress(deactivationData) {
        try {
            if (!deactivationData.vendorCustomerAddressCode || !deactivationData.vendorCustomerCode) {
                throw new Error('Address code and customer code are required for address deactivation');
            }
            const response = await apiClient.post(apiRoutes.vendorCustomer.deactivateCustomerAddress, deactivationData);
            return response.data;
        } catch (error) {
            console.error('Error deactivating vendor customer address:', error);
            throw error;
        }
    },

    /**
     * Add new vendor customer address
     * @param {Object} addressData - Address data
     * @param {string} addressData.vendorCustomerCode - Customer code (required)
     * @param {string} addressData.customerAddressDCCode - DC code (required)
     * @param {string} addressData.addressLine - Address line (required)
     * @param {string} addressData.landmark - Landmark (optional)
     * @param {boolean} addressData.isDefault - Whether this is the default address
     * @param {string} addressData.addedBy - User who added the address
     * @returns {Promise} API response
     */
    async addCustomerAddress(addressData) {
        try {
            if (!addressData.vendorCustomerCode || !addressData.customerAddressDCCode || !addressData.addressLine) {
                throw new Error('Customer code, DC code, and address line are required');
            }
            const response = await apiClient.post(apiRoutes.vendorCustomer.postCustomerAddress, addressData);
            return response.data;
        } catch (error) {
            console.error('Error adding vendor customer address:', error);
            throw error;
        }
    }
};

export default vendorCustomerService;
