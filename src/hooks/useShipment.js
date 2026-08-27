/**
 * Custom hook for Shipment operations
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  getDeliveryTypes,
  createShipmentOrder,
  getShipmentOrdersByVendor,
  getShipmentOrders,
  getShipmentOrdersByDC,
  getShipmentOrdersByRider,
  postShipmentHandoverBatch,
  getShipmentOrderStatus,
  getShipmentTimeline,
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
  uploadShipmentExcel,
} from "@/services/shipmentService";
import { getSelectedDC, getDefaultDCFromUser } from "@/services/dcService";
import notify from "@/lib/toast";

export const useShipment = (initialParams = {}) => {
  const [loading, setLoading] = useState(false);
  const activeRequestsRef = useRef(0);
  const shipmentOrdersRequestRef = useRef(0);
  const [error, setError] = useState(null);
  const [deliveryTypes, setDeliveryTypes] = useState([]);
  const [shipmentOrders, setShipmentOrders] = useState(null);
  const [shipmentTimeline, setShipmentTimeline] = useState([]);
  const [handoverBatchList, setHandoverBatchList] = useState([]);
  const [handoverItems, setHandoverItems] = useState([]);
  const [riderManifest, setRiderManifest] = useState(null);
  const [shipmentOrder, setShipmentOrder] = useState(null);
  const [shipmentOrderItems, setShipmentOrderItems] = useState([]);
  const [shipmentOrderPayment, setShipmentOrderPayment] = useState(null);
  const [orderStatuses, setOrderStatuses] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    pageSize: 1000,
  });
  const [params, setParams] = useState(initialParams);
  const [user, setUser] = useState(null);

  const beginLoading = useCallback(() => {
    activeRequestsRef.current += 1;
    setLoading(true);
  }, []);

  const endLoading = useCallback(() => {
    activeRequestsRef.current = Math.max(activeRequestsRef.current - 1, 0);
    if (activeRequestsRef.current === 0) {
      setLoading(false);
    }
  }, []);

  // Get user from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("cossim-user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      }
    } catch (err) {
      console.error("Error parsing user data from localStorage:", err);
    }
  }, []);

  // Get vendor code from user data
  const vendorCode = useMemo(() => {
    return user?.AssignedVendor?.VendorCode || user?.UserCode || "";
  }, [user]);

  // Get DC code from DC service (supports multiple DCs)
  const [dcCode, setDCCode] = useState("");
  useEffect(() => {
    const resolveAssignedDC = (requestedCode = getSelectedDC()) => {
      const assignedDCs = Array.isArray(user?.AssignedDistributionCenter) ? user.AssignedDistributionCenter : [];
      const validRequested = assignedDCs.some((dc) => dc.DCCode === requestedCode);
      setDCCode(validRequested ? requestedCode : (getDefaultDCFromUser(user) || ""));
    };
    resolveAssignedDC();
    const handleDCChange = (event) => resolveAssignedDC(event.detail?.dcCode);
    window.addEventListener("cossim-dc-changed", handleDCChange);
    return () => window.removeEventListener("cossim-dc-changed", handleDCChange);
  }, [user]);

  // Memoize params to prevent unnecessary re-renders
  const memoizedParams = useMemo(
    () => ({
      ...params,
      vendorCode,
      dcCode,
    }),
    [params, vendorCode, dcCode]
  );

  // Get delivery types
  const fetchDeliveryTypes = useCallback(async () => {
    try {
      beginLoading();
      setError(null);

      const response = await getDeliveryTypes();
      setDeliveryTypes(response.Data);
      return response;
    } catch (error) {
      const message = error.message || "Failed to fetch delivery types";
      setError(message);
      notify.error(message);
      throw error;
    } finally {
      endLoading();
    }
  }, [beginLoading, endLoading]);

  // Create shipment order
  const handleCreateShipmentOrder = useCallback(async (orderData) => {
    try {
      beginLoading();
      setError(null);

      const response = await createShipmentOrder(orderData);
      console.log("Create Shipment Order Response:", response);
      if (response.Error) {
        notify.error(response.Message || "Failed to create shipment order");
      } else {
        notify.success("Shipment order created successfully");
      }
      return response;
    } catch (error) {
      const message = error.message || "Failed to create shipment order";
      setError(message);
      notify.error(message);
      throw error;
    } finally {
      endLoading();
    }
  }, [beginLoading, endLoading]);

  // Get shipment orders by vendor
  const fetchShipmentOrdersByVendor = useCallback(
    async (queryParams = memoizedParams) => {
      if (!queryParams.vendorCode) {
        setError("Vendor code is required but not found in user data");
        return;
      }

      try {
        beginLoading();
        setError(null);

        const response = await getShipmentOrdersByVendor(queryParams);
        setShipmentOrders(response.Data || response.data || response);

        // Update pagination if response contains pagination info
        if (response.TotalCount !== undefined) {
          setPagination({
            currentPage: response.PageNO || 1,
            totalPages: response.TotalPages || 0,
            totalItems: response.TotalCount || 0,
            pageSize: response.PageSize || 100,
          });
        }

        return response;
      } catch (error) {
        const message =
          error.message || "Failed to fetch shipment orders by vendor";
        setError(message);
        notify.error(message);
        throw error;
      } finally {
        endLoading();
      }
    },
    [memoizedParams, beginLoading, endLoading]
  );

  /**
   * Get all shipment orders
   * @param {Object} queryParams - Query parameters
   * @param {number} queryParams.pageNo - Page number (default: 1)
   * @param {number} queryParams.pageSize - Page size (default: 100)
   * @param {string} queryParams.searchTerm - Search term
   * @param {string} queryParams.fromDCCode - From distribution center code
   * @param {string} queryParams.toDCCode - To distribution center code
   * @param {boolean} queryParams.onlyActive - Only active orders (default: false)
   * @param {string} queryParams.startDate - Start date filter
   * @param {string} queryParams.endDate - End date filter
   * @returns {Promise} API response with shipment orders data
   */
  const fetchShipmentOrders = useCallback(
    async (queryParams = params) => {
      const requestID = ++shipmentOrdersRequestRef.current;
      const applyResponse = (response) => {
        if (requestID !== shipmentOrdersRequestRef.current) return;
        setShipmentOrders(response?.Data || response?.data || []);
        setPagination({
          currentPage: response?.PageNO || 1,
          totalPages: response?.TotalPages || 0,
          totalItems: response?.TotalCount || 0,
          pageSize: response?.PageSize || queryParams.pageSize || 1000,
        });
      };
      try {
        beginLoading();
        setError(null);

        const response = await getShipmentOrders({
          ...queryParams,
          onBackgroundRefresh: applyResponse,
        });
        applyResponse(response);

        return response;
      } catch (error) {
        if (requestID !== shipmentOrdersRequestRef.current) {
          return { Data: [], Stale: true };
        }
        const message = error.message || "Failed to fetch shipment orders";
        setError(message);
        notify.error(message);
        throw error;
      } finally {
        endLoading();
      }
    },
    [params, beginLoading, endLoading]
  );

  /**
   * Get shipment orders by distribution center
   * @param {Object} queryParams - Query parameters
   * @param {string} queryParams.DCCode - Distribution center code (required)
   * @param {string} queryParams.DCOrderType - DC order direction filter (ALL, INBOUND, OUTBOUND)
   * @param {number} queryParams.pageNo - Page number (default: 1)
   * @param {number} queryParams.pageSize - Page size (default: 50)
   * @param {string} queryParams.searchTerm - Search term
   * @param {string} queryParams.vendorCode - Vendor code
   * @param {string} queryParams.vendorCategoryCode - Vendor category code
   * @param {string} queryParams.userCode - User code
   * @param {boolean} queryParams.onlyActive - Only active orders (default: false)
   * @param {string} queryParams.startDate - Start date filter
   * @param {string} queryParams.endDate - End date filter
   * @returns {Promise} API response with shipment orders data
   */
  const fetchShipmentOrdersByDC = useCallback(
    async (queryParams = memoizedParams) => {
      const DCCode = queryParams.DCCode || queryParams.dcCode;
      if (!DCCode) {
        setError("DC code is required but not found in user data");
        return;
      }

      try {
        beginLoading();
        setError(null);

        const response = await getShipmentOrdersByDC({ ...queryParams, DCCode });
        setShipmentOrders(response.Data || response.data || response);

        // Update pagination if response contains pagination info
        if (response.TotalCount !== undefined) {
          setPagination({
            currentPage: response.PageNO || 1,
            totalPages: response.TotalPages || 0,
            totalItems: response.TotalCount || 0,
            pageSize: response.PageSize || 100,
          });
        }

        return response;
      } catch (error) {
        const message =
          error.message || "Failed to fetch shipment orders by DC";
        setError(message);
        notify.error(message);
        console.error('fetchShipmentOrdersByDC: Error:', error);
        throw error;
      } finally {
        endLoading();
      }
    },
    [memoizedParams, beginLoading, endLoading]
  );

  /**
   * Get shipment orders by rider
   * @param {Object} queryParams - Query parameters
   * @param {number} queryParams.pageNo - Page number (default: 1)
   * @param {number} queryParams.pageSize - Page size (default: 100)
   * @param {string} queryParams.searchTerm - Search term
   * @param {string} queryParams.RiderUserCode - Rider user code
   * @param {boolean} queryParams.onlyActive - Only active orders (default: false)
   * @param {string} queryParams.startDate - Start date filter (date-time format)
   * @param {string} queryParams.endDate - End date filter (date-time format)
   * @returns {Promise} API response with shipment orders data
   */
  const fetchShipmentOrdersByRider = useCallback(
    async (queryParams = params) => {
      try {
        beginLoading();
        setError(null);

        const response = await getShipmentOrdersByRider(queryParams);
        setShipmentOrders(response.Data || response.data || []);

        // Update pagination if response contains pagination info
        if (response.TotalCount !== undefined) {
          setPagination({
            currentPage: response.PageNO || 1,
            totalPages: response.TotalPages || 0,
            totalItems: response.TotalCount || 0,
            pageSize: response.PageSize || 100,
          });
        }

        return response;
      } catch (error) {
        const message = error.message || "Failed to fetch shipment orders by rider";
        setError(message);
        notify.error(message);
        throw error;
      } finally {
        endLoading();
      }
    },
    [params, beginLoading, endLoading]
  );

  // Post shipment handover batch
  const handlePostShipmentHandoverBatch = useCallback(async (data) => {
    try {
      beginLoading();
      setError(null);

      const response = await postShipmentHandoverBatch(data);
      notify.success("Shipment handover batch posted successfully");
      return response;
    } catch (error) {
      const message = error.message || "Failed to post shipment handover batch";
      setError(message);
      notify.error(message);
      throw error;
    } finally {
      endLoading();
    }
  }, [beginLoading, endLoading]);

  // Get shipment order status
  const fetchShipmentOrderStatus = useCallback(
    async (queryParams = {}) => {
      try {
        beginLoading();
        setError(null);

        // Ensure mandatory sorting fields are provided (API requires them)
        const effectiveParams = {
          orderBy: "SortOrder",
          sortDir: "ASC",
          pageNo: 1,
          pageSize: 100,
          ...params,
          ...queryParams,
        };

        const response = await getShipmentOrderStatus(effectiveParams);
        // The API returns the list in response.Data.items based on the provided sample
        const statuses = response?.Data?.items || response?.data?.items || [];
        setOrderStatuses(statuses);

        return response;
      } catch (error) {
        const message =
          error.message || "Failed to fetch shipment order status";
        setError(message);
        notify.error(message);
        throw error;
      } finally {
        endLoading();
      }
    },
    [params, beginLoading, endLoading]
  );

  // Get shipment timeline
  const fetchShipmentTimeline = useCallback(
    async (queryParams = {}) => {
      try {
        beginLoading();
        setError(null);

        const response = await getShipmentTimeline(queryParams);

        // Set shipment timeline from Data array
        setShipmentTimeline(response.Data || []);

        return response;
      } catch (error) {
        const message = error.message || "Failed to fetch shipment timeline";
        setError(message);
        notify.error(message);
        throw error;
      } finally {
        endLoading();
      }
    },
    [beginLoading, endLoading]
  );

  /**
   * Get handover batch list
   * @param {Object} queryParams - Query parameters
   * @param {string} queryParams.handoverCode - Handover code
   * @param {string} queryParams.riderUserCode - Rider user code
   * @param {string} queryParams.FromDCCode - From distribution center code
   * @param {string} queryParams.ToDCCode - To distribution center code
   * @param {string} queryParams.startDate - Start date filter
   * @param {string} queryParams.endDate - End date filter
   * @param {number} queryParams.pageNo - Page number (default: 1)
   * @param {number} queryParams.pageSize - Page size (default: 100)
   * @param {string} queryParams.search - Search term
   * @param {number} queryParams.IsInBound - Is inbound (default: 0)
   * @param {string} queryParams.orderBy - Order by field (default: 'HandoverCode')
   * @param {string} queryParams.sortDir - Sort direction (default: 'DESC')
   * @returns {Promise} API response with handover batch list data
   */
  const fetchHandoverBatchList = useCallback(
    async (queryParams = params) => {
      try {
        beginLoading();
        setError(null);

        const finalParams = {
          orderBy: "HandoverCode",
          sortDir: "DESC",
          ...queryParams,
          search: queryParams.search || queryParams.searchTerm || undefined,
        };

        const response = await getHandoverBatchList(finalParams);
        setHandoverBatchList(response.Data || []);

        // Update pagination if response contains pagination info
        if (response.pagination) setPagination(response.pagination);
        else if (response.TotalCount !== undefined) {
          setPagination({
            currentPage: Number(response.PageNO || 1),
            totalPages: Number(response.TotalPages || 0),
            totalItems: Number(response.TotalCount || 0),
            pageSize: Number(response.PageSize || 100),
          });
        }

        return response;
      } catch (error) {
        const message = error.message || "Failed to fetch handover batch list";
        setError(message);
        notify.error(message);
        throw error;
      } finally {
        endLoading();
      }
    },
    [params, beginLoading, endLoading]
  );

  // Get handover items
  const fetchHandoverItems = useCallback(
    async (queryParams = params) => {
      try {
        beginLoading();
        setError(null);

        const finalParams = {
          orderBy: "OrderNO",
          sortDir: "ASC",
          ...queryParams
        };

        const response = await getHandoverItems(finalParams);
        setHandoverItems(response.Data || []);

        // Update pagination if response contains pagination info
        if (response.pagination) {
          setPagination(response.pagination);
        }

        return response;
      } catch (error) {
        const message = error.message || "Failed to fetch handover items";
        setError(message);
        notify.error(message);
        throw error;
      } finally {
        endLoading();
      }
    },
    [params, beginLoading, endLoading]
  );

  // Get rider manifest
  const fetchRiderManifest = useCallback(async (queryParams = {}) => {
    try {
      beginLoading();
      setError(null);

      const response = await getRiderManifest(queryParams);
      setRiderManifest(response.Data || response.data || response);

      return response;
    } catch (error) {
      const message = error.message || "Failed to fetch rider manifest";
      setError(message);
      notify.error(message);
      throw error;
    } finally {
      endLoading();
    }
  }, [beginLoading, endLoading]);

  // Post rider manifest transaction
  const handlePostRiderManifestTx = useCallback(async (data) => {
    try {
      beginLoading();
      setError(null);

      const response = await postRiderManifestTx(data);
      if (response.Error) {
        notify.error(response.Message || "Failed to post rider manifest transaction");
      } else {
        notify.success("Rider manifest transaction posted successfully");
      }
      return response;
    } catch (error) {
      const message = error.message || "Failed to post rider manifest transaction";
      setError(message);
      notify.error(message);
      throw error;
    } finally {
      endLoading();
    }
  }, [beginLoading, endLoading]);

  // Get single shipment order
  const fetchShipmentOrder = useCallback(async (queryParams = {}) => {
    try {
      beginLoading();
      setError(null);

      const response = await getShipmentOrder(queryParams);
      setShipmentOrder(response.Data || response.data || response);

      return response;
    } catch (error) {
      const message = error.message || "Failed to fetch shipment order";
      setError(message);
      notify.error(message);
      throw error;
    } finally {
      endLoading();
    }
  }, [beginLoading, endLoading]);

  // Get shipment order items
  const fetchShipmentOrderItems = useCallback(async (queryParams = {}) => {
    try {
      beginLoading();
      setError(null);

      const response = await getShipmentOrderItems(queryParams);
      setShipmentOrderItems(response.Data || response.data || []);

      return response;
    } catch (error) {
      const message = error.message || "Failed to fetch shipment order items";
      setError(message);
      notify.error(message);
      throw error;
    } finally {
      endLoading();
    }
  }, [beginLoading, endLoading]);

  // Get shipment order payment
  const fetchShipmentOrderPayment = useCallback(async (queryParams = {}) => {
    try {
      beginLoading();
      setError(null);

      const response = await getShipmentOrderPayment(queryParams);
      setShipmentOrderPayment(response.Data || response.data || response);

      return response;
    } catch (error) {
      const message = error.message || "Failed to fetch shipment order payment";
      setError(message);
      notify.error(message);
      throw error;
    } finally {
      endLoading();
    }
  }, [beginLoading, endLoading]);

  // Update shipment status
  const handleUpdateShipmentStatus = useCallback(async (data) => {
    try {
      beginLoading();
      setError(null);

      const response = await updateShipmentStatus(data);
      if (response.Error) {
        notify.error(response.Message || "Failed to update shipment status");
      } else {
        notify.success("Shipment status updated successfully");
      }

      return response;
    } catch (error) {
      const message = error.message || "Failed to update shipment status";
      setError(message);
      notify.error(message);
      throw error;
    } finally {
      endLoading();
    }
  }, [beginLoading, endLoading]);

  // Update shipment status for multiple orders in a single batch
  const handleUpdateShipmentStatusBatch = useCallback(async (orders) => {
    try {
      beginLoading();
      setError(null);

      const response = await updateShipmentStatusBatch({ orders });
      if (response.Error) {
        notify.error(response.Message || "Failed to update shipment status batch");
      } else {
        notify.success("Shipment status batch updated successfully");
      }

      return response;
    } catch (error) {
      const message = error.message || "Failed to update shipment status batch";
      setError(message);
      notify.error(message);
      throw error;
    } finally {
      endLoading();
    }
  }, [beginLoading, endLoading]);

  // Receive a batch of inbound shipment orders under a handover code (also closes the handover)
  const handleReceiveInboundShipmentBatch = useCallback(async (data) => {
    try {
      beginLoading();
      setError(null);

      const response = await receiveInboundShipmentBatch(data);
      if (response.Error) {
        notify.error(response.Message || "Failed to receive inbound shipment batch");
      } else {
        notify.success(response.Message || "Inbound shipment batch received successfully");
      }

      return response;
    } catch (error) {
      const message = error.message || "Failed to receive inbound shipment batch";
      setError(message);
      notify.error(message);
      throw error;
    } finally {
      endLoading();
    }
  }, [beginLoading, endLoading]);

  // Remove order from manifest
  const handleRemoveManifestOrder = useCallback(async (data) => {
    try {
      beginLoading();
      setError(null);

      const response = await removeManifestOrder(data);
      if (response.Error) {
        throw new Error(response.Error);
      } else {
        notify.success('Order removed from manifest successfully!');
      }
      return response;
    } catch (error) {
      const message = error.message || "Failed to remove order from manifest";
      setError(message);
      notify.error(message);
      throw error;
    } finally {
      endLoading();
    }
  }, [beginLoading, endLoading]);

  // Download Excel Template
  const handleDownloadExcelTemplate = useCallback(async () => {
    try {
      beginLoading();
      setError(null);

      const response = await downloadShipmentExcelTemplate();

      // Create a URL for the Blob data
      const blobURL = URL.createObjectURL(response);

      // Create a temporary anchor tag
      const link = document.createElement('a');
      link.href = blobURL;
      link.download = 'shipment_template.xlsx'; // Customize the filename here

      // Programmatically trigger a click on the link to start download
      link.click();

      // Clean up the object URL after the download starts
      URL.revokeObjectURL(blobURL);

      notify.success('Template downloaded successfully!');
      return true;
    } catch (error) {
      const message = error.message || "Failed to download template";
      setError(message);
      notify.error(message);
      return false;
    } finally {
      endLoading();
    }
  }, [beginLoading, endLoading]);

  // Upload Excel
  const handleUploadExcel = useCallback(async (formData) => {
    try {
      beginLoading();
      setError(null);

      const response = await uploadShipmentExcel(formData);
      if (response.Error) {
        const issues = Array.isArray(response.Issues) ? response.Issues : [];
        const failedRows = Array.isArray(response.Results)
          ? response.Results.filter((result) => result?.Error).map((result) => {
              const rowIssues = Array.isArray(result.Issues)
                ? result.Issues.flatMap((issue) => Array.isArray(issue?.Issues) ? issue.Issues : [issue?.Message || issue]).filter(Boolean)
                : [];
              return `Row ${result.Row || '?'}: ${rowIssues.join(', ') || result.Message || 'Upload failed'}`;
            })
          : [];
        const detail = [...issues, ...failedRows].filter(Boolean).join(' | ');
        const baseMessage = Array.isArray(response.Message) ? response.Message.join(', ') : response.Message;
        throw new Error(detail || baseMessage || 'Failed to upload excel');
      } else {
        notify.success('Excel uploaded successfully!');
      }
      return response;
    } catch (error) {
      const message = error.message || "Failed to upload excel";
      setError(message);
      notify.error(message);
      throw error;
    } finally {
      endLoading();
    }
  }, [beginLoading, endLoading]);

  // Update params
  const updateParams = useCallback((newParams) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear timeline data
  const clearTimeline = useCallback(() => {
    setShipmentTimeline([]);
    setError(null);
  }, []);

  // Clear handover data
  const clearHandoverData = useCallback(() => {
    setHandoverBatchList([]);
    setHandoverItems([]);
    setError(null);
  }, []);

  // Clear rider manifest data
  const clearRiderManifest = useCallback(() => {
    setRiderManifest(null);
    setError(null);
  }, []);

  // Clear shipment order data
  const clearShipmentOrder = useCallback(() => {
    shipmentOrdersRequestRef.current += 1;
    setShipmentOrders([]);
    setShipmentOrder(null);
    setShipmentOrderItems([]);
    setShipmentOrderPayment(null);
    setError(null);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setShipmentOrders([]);
    setShipmentTimeline([]);
    setDeliveryTypes([]);
    setHandoverBatchList([]);
    setHandoverItems([]);
    setRiderManifest(null);
    setShipmentOrder(null);
    setShipmentOrderItems([]);
    setShipmentOrderPayment(null);
    setPagination({
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      pageSize: 100,
    });
    setError(null);
    activeRequestsRef.current = 0;
    setLoading(false);
  }, []);

  // Auto-fetch delivery types on mount
  useEffect(() => {
    fetchDeliveryTypes();
  }, [fetchDeliveryTypes]);

  return {
    // State
    loading,
    error,
    deliveryTypes,
    shipmentOrders,
    shipmentTimeline,
    handoverBatchList,
    handoverItems,
    riderManifest,
    shipmentOrder,
    shipmentOrderItems,
    shipmentOrderPayment,
    orderStatuses,
    pagination,
    params: memoizedParams,

    // User context
    vendorCode,
    dcCode,

    // Actions
    fetchDeliveryTypes,
    handleCreateShipmentOrder,
    fetchShipmentOrdersByVendor,
    fetchShipmentOrders,
    fetchShipmentOrdersByDC,
    fetchShipmentOrdersByRider,
    handlePostShipmentHandoverBatch,
    fetchShipmentOrderStatus,
    fetchShipmentTimeline,
    fetchHandoverBatchList,
    fetchHandoverItems,
    handleUpdateShipmentStatus,
    handleUpdateShipmentStatusBatch,
    handleReceiveInboundShipmentBatch,
    fetchRiderManifest,
    handlePostRiderManifestTx,
    fetchShipmentOrder,
    fetchShipmentOrderItems,
    fetchShipmentOrderPayment,
    handleRemoveManifestOrder,
    handleDownloadExcelTemplate,
    handleUploadExcel,
    updateParams,
    clearError,
    clearTimeline,
    clearHandoverData,
    clearRiderManifest,
    clearShipmentOrder,
    reset,
  };
};

export default useShipment;
