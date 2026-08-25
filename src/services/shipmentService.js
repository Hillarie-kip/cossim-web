import { api } from "@/lib/apiClient";
import apiRoutes from "@/constants/apis";

export const getShipmentProductNames = async (searchTerm = "", limit = 100) => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("searchTerm", searchTerm.trim());
    params.set("limit", String(limit));
    const response = await api.get(`${apiRoutes.shipment.getShipmentProductNames}?${params.toString()}`);
    return response.data;
};

export const getShipmentFieldSuggestions = async (field, searchTerm = "", limit = 50) => {
    const params = new URLSearchParams({ field, limit: String(limit) });
    if (searchTerm.trim()) params.set("searchTerm", searchTerm.trim());
    const response = await api.get(`${apiRoutes.shipment.getShipmentFieldSuggestions}?${params.toString()}`);
    return response.data;
};

/**
 * Shipment Service
 * Handles all shipment-related API calls
 */

/**
 * Get delivery types
 * @returns {Promise} API response with delivery types data
 */
export const getDeliveryTypes = async () => {
    try {
        const response = await api.get(apiRoutes.shipment.deliveryType);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch delivery types.';
        throw new Error(message);
    }
};

/**
 * Create a new shipment order
 * @param {Object} orderData - Shipment order data
 * @param {string} orderData.vendorCode - Vendor code
 * @param {string} orderData.vendorCustomerCode - Vendor customer code
 * @param {string} orderData.vendorCustomerAddressCode - Vendor customer address code
 * @param {string} orderData.deliveryTypeCode - Delivery type code
 * @param {string} orderData.originDCCode - Origin distribution center code
 * @param {string} orderData.destinationDCCode - Destination distribution center code
 * @param {string} orderData.shipmentRateNO - Shipment rate number
 * @param {number} orderData.serviceFee - Service fee
 * @param {number} orderData.additionalFee - Additional fee
 * @param {boolean} orderData.cashOnDeliveryRequired - Cash on delivery required
 * @param {boolean} orderData.hasPickUp - Has pickup
 * @param {number} orderData.cashOnDeliveryAmount - Cash on delivery amount
 * @param {string} orderData.notes - Notes
 * @param {number} orderData.statusID - Status ID
 * @param {string} orderData.pickupETA - Pickup ETA
 * @param {string} orderData.deliveryETA - Delivery ETA
 * @param {Array} orderData.orderItemsArray - Order items array
 * @returns {Promise} API response
 */
export const createShipmentOrder = async (orderData) => {
    try {
        const response = await api.post(apiRoutes.shipment.createOrder, orderData);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to create shipment order.';
        throw new Error(message);
    }
};

/**
 * Get shipment orders by vendor
 * @param {Object} params - Query parameters
 * @param {string} params.vendorCode - Vendor code
 * @param {number} params.pageNo - Page number (default: 1)
 * @param {number} params.pageSize - Page size (default: 50)
 * @param {string} params.searchTerm - Search term
 * @param {boolean} params.onlyActive - Only active orders (default: false)
 * @param {string} params.startDate - Start date filter
 * @param {string} params.endDate - End date filter
 * @returns {Promise} API response with shipment orders data
 */
export const getShipmentOrdersByVendor = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();

        // Add optional parameters
        if (params.vendorCode) queryParams.append('vendorCode', params.vendorCode);
        if (params.pageNo) queryParams.append('pageNo', params.pageNo);
        if (params.pageSize) queryParams.append('pageSize', params.pageSize);
        if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
        if (params.onlyActive !== undefined) queryParams.append('onlyActive', params.onlyActive);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.orderBy) queryParams.append('orderBy', params.orderBy);
        if (params.sortDir) queryParams.append('sortDir', params.sortDir);
        if (params.taskType) queryParams.append('taskType', params.taskType);

        const url = `${apiRoutes.shipment.getOrdersByVendor}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url, {
            indexedDBCache: true,
            backgroundRefresh: true,
            onBackgroundRefresh: (freshResponse) => params.onBackgroundRefresh?.(freshResponse.data),
        });

        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch shipment orders by vendor.';
        throw new Error(message);
    }
};

/**
 * Get all shipment orders
 * @param {Object} params - Query parameters
 * @param {number} params.pageNo - Page number (default: 1)
 * @param {number} params.pageSize - Page size (default: 50)
 * @param {string} params.searchTerm - Search term
 * @param {string} params.vendorCode - Vendor code
 * @param {string} params.toDCCode - To distribution center code
 * @param {string} params.userCode - User code
 * @param {boolean} params.onlyActive - Only active orders (default: false)
 * @param {string} params.startDate - Start date filter (date-time format)
 * @param {string} params.endDate - End date filter (date-time format)
 * @returns {Promise} API response with shipment orders data
 */
export const getShipmentOrders = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();

        // Add optional parameters
        if (params.pageNo) queryParams.append('pageNo', params.pageNo);
        if (params.pageSize) queryParams.append('pageSize', params.pageSize);
        if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
        if (params.vendorCode) queryParams.append('vendorCode', params.vendorCode);
        if (params.vendorCategoryCode && !params.statusIDs) queryParams.append('vendorCategoryCode', params.vendorCategoryCode);
        if (params.fromDCCode) queryParams.append('fromDCCode', params.fromDCCode);
        if (params.statusIDs) queryParams.append('statusIDs', params.statusIDs);
        if (params.countOnly !== undefined) queryParams.append('countOnly', params.countOnly);
        if (params.slaDays) queryParams.append('slaDays', params.slaDays);
        if (params.checkSLA !== undefined) queryParams.append('checkSLA', params.checkSLA);
        if (params.toDCCode) queryParams.append('toDCCode', params.toDCCode);
        if (params.userCode) queryParams.append('userCode', params.userCode);
        if (params.onlyActive !== undefined) queryParams.append('onlyActive', params.onlyActive);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.orderBy) queryParams.append('orderBy', params.orderBy);
        if (params.sortDir) queryParams.append('sortDir', params.sortDir);
        if (params.taskType) queryParams.append('taskType', params.taskType);

        const url = `${apiRoutes.shipment.getOrders}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url, {
            indexedDBCache: params.indexedDBCache ?? true,
            backgroundRefresh: params.backgroundRefresh ?? true,
            forceRefresh: params.forceRefresh ?? false,
            onBackgroundRefresh: (freshResponse) => params.onBackgroundRefresh?.(freshResponse.data),
        });

        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch shipment orders.';
        throw new Error(message);
    }
};

/**
 * Get shipment orders by distribution center
 * @param {Object} params - Query parameters
 * @param {number} params.pageNo - Page number (default: 1)
 * @param {number} params.pageSize - Page size (default: 50)
 * @param {string} params.searchTerm - Search term
 * @param {string} params.vendorCode - Vendor code
 * @param {string} params.DCCode - Distribution center code
 * @param {string} params.DCOrderType - DC order direction filter (e.g. ALL, INBOUND, OUTBOUND)
 * @param {string} params.vendorCategoryCode - Vendor category code
 * @param {string} params.userCode - User code
 * @param {boolean} params.onlyActive - Only active orders (default: false)
 * @param {string} params.startDate - Start date filter
 * @param {string} params.endDate - End date filter
 * @returns {Promise} API response with shipment orders data
 */
export const getShipmentOrdersByDC = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();

        // Add optional parameters
        if (params.pageNo) queryParams.append('pageNo', params.pageNo);
        if (params.pageSize) queryParams.append('pageSize', params.pageSize);
        if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
        if (params.vendorCode) queryParams.append('vendorCode', params.vendorCode);
        if (params.DCCode) queryParams.append('DCCode', params.DCCode);
        if (params.DCOrderType) queryParams.append('DCOrderType', params.DCOrderType);
        if (params.vendorCategoryCode) queryParams.append('vendorCategoryCode', params.vendorCategoryCode);
        if (params.userCode) queryParams.append('userCode', params.userCode);
        if (params.onlyActive !== undefined) queryParams.append('onlyActive', params.onlyActive);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);

        const url = `${apiRoutes.shipment.getOrdersByDC}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);

        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch shipment orders by DC.';
        throw new Error(message);
    }
};

/**
 * Get shipment orders by rider
 * @param {Object} params - Query parameters
 * @param {number} params.pageNo - Page number (default: 1)
 * @param {number} params.pageSize - Page size (default: 50)
 * @param {string} params.searchTerm - Search term
 * @param {string} params.RiderUserCode - Rider user code
 * @param {boolean} params.onlyActive - Only active orders (default: false)
 * @param {string} params.startDate - Start date filter (date-time format)
 * @param {string} params.endDate - End date filter (date-time format)
 * @returns {Promise} API response with shipment orders data
 */
export const getShipmentOrdersByRider = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();

        // Add optional parameters
        if (params.pageNo) queryParams.append('pageNo', params.pageNo);
        if (params.pageSize) queryParams.append('pageSize', params.pageSize);
        if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
        if (params.RiderUserCode) queryParams.append('RiderUserCode', params.RiderUserCode);
        if (params.onlyActive !== undefined) queryParams.append('onlyActive', params.onlyActive);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);

        const url = `${apiRoutes.shipment.getOrdersByRider}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);

        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch shipment orders by rider.';
        throw new Error(message);
    }
};

/**
 * Post shipment handover batch
 * @param {Object} data - Handover request data
 * @returns {Promise} API response
 */
export const postShipmentHandoverBatch = async (data) => {
    try {
        const response = await api.post(apiRoutes.shipment.postShipmentHandoverBatch, data);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to post shipment handover batch.';
        throw new Error(message);
    }
};

/**
 * Get shipment order status
 * @param {Object} params - Query parameters
 * @param {number} params.pageNo - Page number
 * @param {number} params.pageSize - Page size
 * @param {string} params.search - Search term
 * @param {string} params.phaseCode - Phase code
 * @param {boolean} params.isTerminal - Is terminal
 * @param {boolean} params.isFailure - Is failure
 * @param {string} params.orderBy - Order by field
 * @param {string} params.sortDir - Sort direction
 * @returns {Promise} API response with shipment order status data
 */
export const getShipmentOrderStatus = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.pageNo) queryParams.append('pageNo', params.pageNo);
        if (params.pageSize) queryParams.append('pageSize', params.pageSize);
        const search = params.search || params.searchTerm;
        if (search) queryParams.append('search', search);
        if (params.phaseCode) queryParams.append('phaseCode', params.phaseCode);
        if (params.isTerminal !== undefined) queryParams.append('isTerminal', params.isTerminal);
        if (params.isFailure !== undefined) queryParams.append('isFailure', params.isFailure);
        if (params.orderBy) queryParams.append('orderBy', params.orderBy);
        if (params.sortDir) queryParams.append('sortDir', params.sortDir);

        const url = `${apiRoutes.shipment.getShipmentOrderStatus}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);

        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch shipment order status.';
        throw new Error(message);
    }
};

/**
 * Get shipment timeline for a specific order
 * @param {Object} params - Query parameters
 * @param {string} params.orderNo - Order number (required)
 * @returns {Promise} API response with shipment timeline data
 */
export const getShipmentTimeline = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();

        // orderNo is required for timeline
        if (!params.orderNo) {
            throw new Error('Order number is required to fetch shipment timeline');
        }

        queryParams.append('orderNo', params.orderNo);

        const url = `${apiRoutes.shipment.getShipmentTimeline}?${queryParams.toString()}`;
        const response = await api.get(url);

        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch shipment timeline.';
        throw new Error(message);
    }
};

/**
 * Get handover batch list
 * @param {Object} params - Query parameters
 * @param {string} params.handoverCode - Handover code
 * @param {string} params.riderUserCode - Rider user code
 * @param {string} params.FromDCCode - From distribution center code
 * @param {string} params.ToDCCode - To distribution center code
 * @param {string} params.startDate - Start date filter
 * @param {string} params.endDate - End date filter
 * @param {number} params.pageNo - Page number (default: 1)
 * @param {number} params.pageSize - Page size (default: 50)
 * @param {string} params.search - Search term
 * @param {number} params.IsInBound - Is inbound (default: 0)
 * @param {string} params.orderBy - Order by field (default: 'HandoverCode')
 * @param {string} params.sortDir - Sort direction (default: 'DESC')
 * @returns {Promise} API response with handover batch list data
 */
export const getHandoverBatchList = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();

        if (params.handoverCode) queryParams.append('handoverCode', params.handoverCode);
        if (params.riderUserCode) queryParams.append('riderUserCode', params.riderUserCode);
        if (params.courierCode) queryParams.append('courierCode', params.courierCode);
        if (params.FromDCCode) queryParams.append('FromDCCode', params.FromDCCode);
        if (params.ToDCCode) queryParams.append('ToDCCode', params.ToDCCode);
        if (params.DestinationDCCode) queryParams.append('DestinationDCCode', params.DestinationDCCode);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.pageNo) queryParams.append('pageNo', params.pageNo);
        if (params.pageSize) queryParams.append('pageSize', params.pageSize);
        const search = params.search || params.searchTerm;
        if (search) queryParams.append('search', search);
        if (params.IsInBound !== undefined) queryParams.append('IsInBound', params.IsInBound);
        if (params.statusID !== undefined && params.statusID !== null) queryParams.append('statusID', params.statusID);
        if (params.statusIDs) queryParams.append('statusIDs', params.statusIDs);

        // Always include required orderBy and sortDir parameters
        queryParams.append('orderBy', params.orderBy || 'HandoverCode');
        queryParams.append('sortDir', params.sortDir || 'DESC');

        const url = `${apiRoutes.shipment.getHandoverBatchList}?${queryParams.toString()}`;
        const response = await api.get(url);

        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch handover batch list.';
        throw new Error(message);
    }
};

export const completeHandoverBatch = async (data) => {
    try {
        const response = await api.post(apiRoutes.shipment.completeHandoverBatch, data);
        return response.data;
    } catch (error) {
        throw new Error(error?.response?.data?.Message || error.message || 'Failed to complete handover batch.');
    }
};

export const uploadHandoverReceipt = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(apiRoutes.shipment.uploadHandoverReceipt, formData);
        return response.data;
    } catch (error) {
        throw new Error(error?.response?.data?.Message || error.message || 'Failed to upload handover receipt.');
    }
};

export const getHandoverReceiptUrl = (imageID) =>
    imageID ? `${apiRoutes.shipment.getHandoverReceipt}?imageID=${encodeURIComponent(imageID)}` : '';

export const editHandoverBatch = async (data) => {
    try {
        const response = await api.post(apiRoutes.shipment.editHandoverBatch, data);
        return response.data;
    } catch (error) {
        throw new Error(error?.response?.data?.Message || error.message || 'Failed to update handover batch.');
    }
};

/**
 * Get handover items
 * @param {Object} params - Query parameters
 * @returns {Promise} API response with handover items data
 */
export const getHandoverItems = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();

        if (params.handoverCode) queryParams.append('handoverCode', params.handoverCode);
        if (params.pageNo) queryParams.append('pageNo', params.pageNo);
        if (params.pageSize) queryParams.append('pageSize', params.pageSize);
        if (params.search) queryParams.append('search', params.search);

        // Always include required orderBy and sortDir parameters
        queryParams.append('orderBy', params.orderBy || 'OrderNO');
        queryParams.append('sortDir', params.sortDir || 'ASC');

        const url = `${apiRoutes.shipment.getHandoverItems}?${queryParams.toString()}`;
        const response = await api.get(url);

        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch handover items.';
        throw new Error(message);
    }
};

/**
 * Update shipment status
 * @param {Object} data - Request body data
 * @returns {Promise} API response
 */
export const updateShipmentStatus = async (data) => {
    try {
        const response = await api.post(apiRoutes.shipment.updateShipmentStatus, data);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to update shipment status.';
        throw new Error(message);
    }
};

/**
 * Update shipment status for multiple orders in a single batch
 * @param {Object} data - Request body data
 * @param {Array<Object>} data.orders - Array of UpdateShipmentStatusModel entries (statusID, orderNO, notes, dcCode, riderCode)
 * @returns {Promise} API response
 */
export const updateShipmentStatusBatch = async (data) => {
    try {
        const response = await api.post(apiRoutes.shipment.updateShipmentStatusBatch, data);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to update shipment status batch.';
        throw new Error(message);
    }
};

/**
 * Receive a batch of inbound shipment orders under a handover code.
 * Marks each listed order as received (or as an exception if it isn't
 * actually part of the handover), then always closes the handover batch.
 * @param {Object} data - Request body data
 * @param {string} data.HandoverCode - Handover code the orders were dispatched under
 * @param {number} data.StatusID - Status to apply to orders found in the handover
 * @param {string} [data.DCCode] - Receiving DC code
 * @param {string} [data.CourierCode] - Courier code, if applicable
 * @param {string} [data.Notes] - Batch-level notes, used as fallback per-order notes
 * @param {Array<{OrderNO: string, Notes?: string}>} data.Orders - Orders being received
 * @returns {Promise} API response with per-order results and handover close status
 */
export const receiveInboundShipmentBatch = async (data) => {
    try {
        const response = await api.post(apiRoutes.shipment.receiveInboundShipmentBatch, data);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to receive inbound shipment batch.';
        throw new Error(message);
    }
};

export const getRiderManifest = async (params) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.manifestNO) queryParams.append('manifestNO', params.manifestNO);
        if (params.riderUserCode) queryParams.append('riderUserCode', params.riderUserCode);
        if (params.dcCode) queryParams.append('dcCode', params.dcCode);
        if (params.activeOnly !== undefined) queryParams.append('activeOnly', params.activeOnly);
        if (params.itemsPage) queryParams.append('itemsPage', params.itemsPage);
        if (params.itemsPageSize) queryParams.append('itemsPageSize', params.itemsPageSize);
        if (params.eventsPage) queryParams.append('eventsPage', params.eventsPage);
        if (params.eventsPageSize) queryParams.append('eventsPageSize', params.eventsPageSize);

        const url = `${apiRoutes.shipment.getRiderManifest}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch rider manifest.';
        throw new Error(message);
    }
};

export const postRiderManifestTx = async (data) => {
    try {
        const response = await api.post(apiRoutes.shipment.postRiderManifest, data);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to post rider manifest transaction.';
        throw new Error(message);
    }
};

/**
 * Get a single shipment order by OrderNO
 * @param {Object} params - Query parameters
 * @param {string} params.orderNO - Order number (required)
 * @returns {Promise} API response with shipment order data
 */
export const getShipmentOrder = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();

        // orderNO is required
        if (!params.orderNO) {
            throw new Error('Order number is required to fetch shipment order');
        }

        queryParams.append('OrderNO', params.orderNO);

        const queryString = queryParams.toString();
        const url = queryString ? `${apiRoutes.shipment.getShipmentOrder}?${queryString}` : apiRoutes.shipment.getShipmentOrder;
        const response = await api.get(url);

        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch shipment order.';
        throw new Error(message);
    }
};

/**
 * Get shipment order items by OrderNO
 * @param {Object} params - Query parameters
 * @param {string} params.orderNO - Order number (required)
 * @returns {Promise} API response with shipment order items data
 */
export const getShipmentOrderItems = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();

        // orderNO is required
        if (!params.orderNO) {
            throw new Error('Order number is required to fetch shipment order items');
        }

        queryParams.append('OrderNO', params.orderNO);

        const queryString = queryParams.toString();
        const url = queryString ? `${apiRoutes.shipment.getShipmentOrderItems}?${queryString}` : apiRoutes.shipment.getShipmentOrderItems;
        const response = await api.get(url);

        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch shipment order items.';
        throw new Error(message);
    }
};

/**
 * Get shipment order payment by OrderNO
 * @param {Object} params - Query parameters
 * @param {string} params.orderNO - Order number (required)
 * @returns {Promise} API response with shipment order payment data
 */
export const getShipmentOrderPayment = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();

        // orderNO is required
        if (!params.orderNO) {
            throw new Error('Order number is required to fetch shipment order payment');
        }

        queryParams.append('OrderNO', params.orderNO);

        const queryString = queryParams.toString();
        const url = queryString ? `${apiRoutes.shipment.getShipmentOrderPayment}?${queryString}` : apiRoutes.shipment.getShipmentOrderPayment;
        const response = await api.get(url);

        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch shipment order payment.';
        throw new Error(message);
    }
};

/**
 * Remove an order from manifest
 * @param {Object} data - Request body data
 * @param {string} data.manifestNO - Manifest number (required)
 * @param {string} data.orderNO - Order number (required)
 * @returns {Promise} API response
 */
export const removeManifestOrder = async (data) => {
    try {
        const response = await api.post(apiRoutes.shipment.removeManifestOrder, data);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to remove order from manifest.';
        throw new Error(message);
    }
};

/**
 * Download shipment excel template
 * @returns {Promise} API response (Blob)
 */
export const downloadShipmentExcelTemplate = async () => {
    try {
        const response = await api.get(apiRoutes.shipment.downloadExcelTemplate, {
            responseType: 'blob' // This is key to receiving a Blob
        });

        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to download excel template.';
        throw new Error(message);
    }
};

/**
 * Upload shipment excel
 * @param {FormData} formData - form data containing VendorCode and file
 * @returns {Promise} API response
 */
export const uploadShipmentExcel = async (formData) => {
    try {
        const response = await api.post(apiRoutes.shipment.uploadExcel, formData);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to upload excel.';
        throw new Error(message);
    }
};

// Export all shipment service functions
const shipmentService = {
    getDeliveryTypes,
    createShipmentOrder,
    getShipmentOrdersByVendor,
    getShipmentOrders,
    getShipmentOrdersByDC,
    getShipmentOrdersByRider,
    getShipmentOrderStatus,
    getShipmentTimeline,
    postShipmentHandoverBatch,
    completeHandoverBatch,
    uploadHandoverReceipt,
    editHandoverBatch,
    getHandoverBatchList,
    getHandoverItems,
    updateShipmentStatus,
    updateShipmentStatusBatch,
    receiveInboundShipmentBatch,
    getRiderManifest,
    postRiderManifestTx,
    getShipmentOrder,
    getShipmentOrderItems,
    getShipmentOrderPayment,
    removeManifestOrder,
    downloadShipmentExcelTemplate,
    uploadShipmentExcel
};

export default shipmentService;
