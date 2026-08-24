import { api } from "@/lib/apiClient";
import apiRoutes from "@/constants/apis";

/**
 * Finance Service
 * Handles all finance-related API calls
 */

/**
 * Get active shipment rate
 * @param {Object} params - Query /**
 * Remove settlement item
 * @param {Object} removeData - Remove settlement item data
 * @param {string} removeData.settlementNO - Settlement number
 * @param {string} removeData.orderNO - Order number
 * @param {number} removeData.codSettlementItemID - Settlement item ID
 * @returns {Promise} API response
 */
export const removeSettlementItem = async (removeData) => {
    try {
        const response = await api.post(apiRoutes.finance.removeSettlementItem, removeData);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to remove settlement item.';
        throw new Error(message);
    }
};

/**
 * Get active shipment rate
 * @param {Object} params - Query parameters
 * @param {string} params.fromDCCode - Source distribution center code
 * @param {string} params.toDCCode - Destination distribution center code
 * @param {string} params.deliveryTypeCode - Delivery type code
 * @returns {Promise} API response with active shipment rate data
 */
export const getActiveShipmentRate = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add optional parameters
        if (params.fromDCCode) queryParams.append('fromDCCode', params.fromDCCode);
        if (params.toDCCode) queryParams.append('toDCCode', params.toDCCode);
        if (params.deliveryTypeCode) queryParams.append('deliveryTypeCode', params.deliveryTypeCode);

        const url = `${apiRoutes.finance.getActiveShipmentRate}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);
        
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch active shipment rate.';
        throw new Error(message);
    }
};

/**
 * Get all shipment rates
 * @param {Object} params - Query parameters
 * @param {string} params.fromDCCode - Source distribution center code filter
 * @param {string} params.toDCCode - Destination distribution center code filter
 * @param {string} params.deliveryTypeCode - Delivery type code filter
 * @returns {Promise} API response with shipment rates data
 */
export const getShipmentRates = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();

        // Add optional parameters
        if (params.fromDCCode) queryParams.append('fromDCCode', params.fromDCCode);
        if (params.toDCCode) queryParams.append('toDCCode', params.toDCCode);
        if (params.deliveryTypeCode) queryParams.append('deliveryTypeCode', params.deliveryTypeCode);

        const url = `${apiRoutes.finance.getShipmentRates}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);
        // Extract the Data array from the response structure
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch shipment rates.';
        throw new Error(message);
    }
};

/**
 * Create a new shipment rate
 * @param {Object} rateData - Shipment rate data
 * @param {string} rateData.fromDCCode - Source distribution center code
 * @param {string} rateData.toDCCode - Destination distribution center code
 * @param {string} rateData.deliveryTypeCode - Delivery type code
 * @param {number} rateData.slaHours - Service level agreement hours
 * @param {number} rateData.rateAmount - Rate amount
 * @param {string} rateData.effectiveFrom - Effective from date
 * @param {string} rateData.effectiveTo - Effective to date
 * @returns {Promise} API response
 */
export const createShipmentRate = async (rateData) => {
    try {
        const response = await api.post(apiRoutes.finance.createShipmentRate, rateData);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to create shipment rate.';
        throw new Error(message);
    }
};
export const getPriceZones = async () => (await api.get(apiRoutes.finance.getPriceZones)).data;
export const createPriceZone = async (data) => (await api.post(apiRoutes.finance.createPriceZone, data)).data;

/**
 * Get finance summary dashboard data
 * @param {Object} params - Query parameters
 * @param {string} params.fromDate - Start date for the summary
 * @param {string} params.toDate - End date for the summary
 * @param {string} params.vendorCode - Vendor code filter
 * @param {string} params.dcCode - Distribution center code filter
 * @param {boolean} params.verifiedOnly - Whether to include only verified records
 * @returns {Promise} API response with summary dashboard data
 */
export const getSummaryDashboard = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add optional parameters
        if (params.fromDate) queryParams.append('fromDate', params.fromDate);
        if (params.toDate) queryParams.append('toDate', params.toDate);
        if (params.vendorCode) queryParams.append('vendorCode', params.vendorCode);
        if (params.dcCode) queryParams.append('dcCode', params.dcCode);
        if (params.verifiedOnly !== undefined) queryParams.append('verifiedOnly', params.verifiedOnly);

        const url = `${apiRoutes.finance.getSummaryDashboard}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);
        
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch summary dashboard data.';
        throw new Error(message);
    }
};

/**
 * Get order reconciliation data
 * @param {Object} params - Query parameters
 * @param {string} params.fromDate - Start date for reconciliation
 * @param {string} params.toDate - End date for reconciliation
 * @param {string} params.vendorCode - Vendor code filter
 * @param {string} params.dcCode - Distribution center code filter
 * @param {boolean} params.verifiedOnly - Whether to include only verified records
 * @param {string} params.search - Search term
 * @param {number} params.pageNo - Page number (default: 1)
 * @param {number} params.pageSize - Page size (default: 50)
 * @returns {Promise} API response with order reconciliation data
 */
export const getOrderReconciliation = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add optional parameters
        if (params.fromDate) queryParams.append('fromDate', params.fromDate);
        if (params.toDate) queryParams.append('toDate', params.toDate);
        if (params.vendorCode) queryParams.append('vendorCode', params.vendorCode);
        if (params.dcCode) queryParams.append('dcCode', params.dcCode);
        if (params.verifiedOnly !== undefined) queryParams.append('verifiedOnly', params.verifiedOnly);
        if (params.search) queryParams.append('search', params.search);
        if (params.pageNo) queryParams.append('pageNo', params.pageNo);
        if (params.pageSize) queryParams.append('pageSize', params.pageSize);

        const url = `${apiRoutes.finance.getOrderReconciliation}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);
        
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch order reconciliation data.';
        throw new Error(message);
    }
};

/**
 * Get settlements data
 * @param {Object} params - Query parameters
 * @param {string} params.fromDate - Start date for settlements
 * @param {string} params.toDate - End date for settlements
 * @param {string} params.vendorCode - Vendor code filter
 * @param {number} params.statusID - Status ID filter
 * @param {string} params.search - Search term
 * @param {number} params.pageNo - Page number
 * @param {number} params.pageSize - Page size
 * @returns {Promise} API response with settlements data
 */
export const getSettlements = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add optional parameters
        if (params.fromDate) queryParams.append('fromDate', params.fromDate);
        if (params.toDate) queryParams.append('toDate', params.toDate);
        if (params.vendorCode) queryParams.append('vendorCode', params.vendorCode);
        if (params.statusID !== undefined) queryParams.append('statusID', params.statusID);
        if (params.search) queryParams.append('search', params.search);
        if (params.pageNo) queryParams.append('pageNo', params.pageNo);
        if (params.pageSize) queryParams.append('pageSize', params.pageSize);

        const url = `${apiRoutes.finance.getSettlements}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);
        
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch settlements data.';
        throw new Error(message);
    }
};

/**
 * Get settlement detail
 * @param {string} settlementNO - Settlement number
 * @returns {Promise} API response with settlement detail data
 */
export const getSettlementDetail = async (settlementNO) => {
    try {
        const queryParams = new URLSearchParams();
        queryParams.append('settlementNO', settlementNO);

        const url = `${apiRoutes.finance.getSettlementDetail}?${queryParams.toString()}`;
        const response = await api.get(url);
        
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch settlement detail.';
        throw new Error(message);
    }
};

/**
 * Create a new settlement request
 * @param {Object} settlementData - Settlement request data
 * @returns {Promise} API response
 */
export const createSettlementRequest = async (settlementData) => {
    try {
        const response = await api.post(apiRoutes.finance.createSettlementRequest, settlementData);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to create settlement request.';
        throw new Error(message);
    }
};

/**
 * Add item to settlement
 * @param {string} settlementNO - Settlement number
 * @param {Object} itemData - Settlement item data
 * @returns {Promise} API response
 */
export const addSettlementItem = async (itemData) => {
    try {
        const url = `${apiRoutes.finance.addSettlementItem}`;
        const response = await api.post(url, itemData);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to add settlement item.';
        throw new Error(message);
    }
};

/**
 * Finalize settlement
 * @param {string} settlementNO - Settlement number
 * @param {Object} finalizeData - Finalization data
 * @returns {Promise} API response
 */
export const finalizeSettlement = async (settlementNO, finalizeData) => {
    try {
        const url = `${apiRoutes.finance.finalizeSettlement}/${settlementNO}`;
        const response = await api.post(url, finalizeData);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to finalize settlement.';
        throw new Error(message);
    }
};

/**
 * Update settlement
 * @param {Object} updateData - Settlement update data
 * @returns {Promise} API response
 */
export const updateSettlement = async (updateData) => {
    try {
        const response = await api.post(apiRoutes.finance.updateSettlement, updateData);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to update settlement.';
        throw new Error(message);
    }
};

/**
 * Update settlement status
 * @param {string} settlementNO - Settlement number
 * @param {number} statusID - New status ID
 * @returns {Promise} API response
 */
export const updateSettlementStatus = async (settlementNO, statusID) => {
    try {
        const url = `${apiRoutes.finance.updateSettlementStatus}/${settlementNO}/${statusID}`;
        const response = await api.post(url);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to update settlement status.';
        throw new Error(message);
    }
};

// Export all finance service functions
const financeService = {
    getActiveShipmentRate,
    getShipmentRates,
    createShipmentRate,
    getPriceZones,
    createPriceZone,
    getSummaryDashboard,
    getOrderReconciliation,
    getSettlements,
    getSettlementDetail,
    createSettlementRequest,
    addSettlementItem,
    removeSettlementItem,
    finalizeSettlement,
    updateSettlement,
    updateSettlementStatus,
};

export default financeService;
