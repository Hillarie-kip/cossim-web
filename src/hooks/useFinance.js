/**
 * Custom hook for Finance operations
 */

import { useState, useCallback } from 'react';
import { 
  getActiveShipmentRate, 
  getShipmentRates, 
  createShipmentRate, getPriceZones, createPriceZone,
  getSummaryDashboard, 
  getOrderReconciliation,
  getSettlements,
  getSettlementDetail,
  createSettlementRequest,
  addSettlementItem,
  removeSettlementItem,
  finalizeSettlement,
  updateSettlement,
  updateSettlementStatus
} from '@/services/financeService';
import toast from 'react-hot-toast';

export const useFinance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shipmentRates, setShipmentRates] = useState([]);
  const [activeRate, setActiveRate] = useState(null);
  const [priceZones, setPriceZones] = useState([]);
  const [summaryDashboard, setSummaryDashboard] = useState(null);
  const [orderReconciliation, setOrderReconciliation] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [settlementsPagination, setSettlementsPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    pageSize: 100,
  });
  const [settlementDetail, setSettlementDetail] = useState(null);

  // Get active shipment rate
  const fetchActiveShipmentRate = useCallback(async (params) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getActiveShipmentRate(params);
      setActiveRate(response);
      return response;
    } catch (error) {
      const message = error.message || 'Failed to fetch active shipment rate';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get all shipment rates
  const fetchShipmentRates = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await getShipmentRates(params);
      setShipmentRates(response?.Data || response?.data || []);

      return response;
    } catch (error) {
      const message = error.message || 'Failed to fetch shipment rates';
      setError(message);
      toast.error(message);
      // This query runs from page effects and refresh buttons. Return an error
      // result so a temporary network/CORS failure is rendered by the page
      // instead of becoming an unhandled rejection in Next.js.
      return { Error: true, Message: message, Data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new shipment rate
  const handleCreateShipmentRate = useCallback(async (rateData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await createShipmentRate(rateData);
      toast.success('Shipment rate created successfully');
      
      // Refresh the rates list
      await fetchShipmentRates();
      
      return response;
    } catch (error) {
      const message = error.message || 'Failed to create shipment rate';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchShipmentRates]);

  const fetchPriceZones = useCallback(async () => {
    try {
      const response = await getPriceZones();
      setPriceZones(response?.Data || response?.data || []);
      return response;
    } catch (error) {
      // Price zones are supplementary data on the pricing page. A temporary
      // network/CORS failure must not reject the page's mount effect.
      console.warn('Unable to load price zones:', error.message || error);
      return { Error: true, Message: error.message || 'Unable to load price zones', Data: [] };
    }
  }, []);

  const handleCreatePriceZone = useCallback(async (data) => {
    const response = await createPriceZone(data);
    await fetchPriceZones();
    return response;
  }, [fetchPriceZones]);

  // Get summary dashboard data
  const fetchSummaryDashboard = useCallback(async (params) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getSummaryDashboard(params);

      if(response.Error || response.error) {
        throw new Error(response.ErrorMessage || 'Failed to fetch summary dashboard data');
      }

      setSummaryDashboard(response.Data || response.data || null);

      return response;
    } catch (error) {
      const message = error.message || 'Failed to fetch summary dashboard data';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get order reconciliation data
  const fetchOrderReconciliation = useCallback(async (params) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getOrderReconciliation(params);

      if(response.Error || response.error) {
        throw new Error(response.Message || response.message || 'Failed to fetch order reconciliation data');
      }

      // Handle new response format similar to vendors page
      setOrderReconciliation({
        Data: response.Data || [],
        TotalCount: response.TotalCount || 0,
        PageNO: response.PageNO || 1,
        PageSize: response.PageSize || 100
      });
      
      return response;
    } catch (error) {
      const message = error.message || 'Failed to fetch order reconciliation data';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get settlements data
  const fetchSettlements = useCallback(async (params) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getSettlements(params);

      if(response.Error) {
        throw new Error(response.ErrorMessage || 'Failed to fetch settlements data');
      }

      setSettlements(response.Data || []);
      setSettlementsPagination({
        currentPage: response.PageNO || params?.pageNo || 1,
        totalPages: response.TotalPages || 0,
        totalItems: response.TotalCount || 0,
        pageSize: response.PageSize || params?.pageSize || 100,
      });
      return response;
    } catch (error) {
      const message = error.message || 'Failed to fetch settlements data';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get settlement detail
  const fetchSettlementDetail = useCallback(async (settlementNO) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getSettlementDetail(settlementNO);

      if(response.Error) {
        throw new Error(response.ErrorMessage || 'Failed to fetch settlement detail');
      }

      setSettlementDetail(response.Data || null);
      return response;
    } catch (error) {
      const message = error.message || 'Failed to fetch settlement detail';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create settlement request
  const handleCreateSettlementRequest = useCallback(async (settlementData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await createSettlementRequest(settlementData);
      
      if(response.Error) {
        throw new Error(response.ErrorMessage || 'Failed to create settlement request');
      }
      
      toast.success('Settlement request created successfully');
      
      // Refresh settlements list
      await fetchSettlements();
      
      return response;
    } catch (error) {
      const message = error.message || 'Failed to create settlement request';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchSettlements]);

  // Add settlement item
  const handleAddSettlementItem = useCallback(async (settlementNO, itemData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await addSettlementItem(itemData);
      
      if(response.Error) {
        throw new Error(response.ErrorMessage || 'Failed to add settlement item');
      }
      
      toast.success('Settlement item added successfully');
      
      // Refresh settlement detail
      await fetchSettlementDetail(settlementNO);
      
      return response;
    } catch (error) {
      const message = error.message || 'Failed to add settlement item';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchSettlementDetail]);

  // Remove settlement item
  const handleRemoveSettlementItem = useCallback(async (removeData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await removeSettlementItem(removeData);

      if(response.Error) {
        throw new Error(response.ErrorMessage || 'Failed to remove settlement item');
      }

      toast.success('Settlement item removed successfully');

      // Refresh settlement detail
      await fetchSettlementDetail(removeData.settlementNO);

      return response;
    } catch (error) {
      const message = error.message || 'Failed to remove settlement item';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchSettlementDetail]);

  // Finalize settlement
  const handleFinalizeSettlement = useCallback(async (settlementNO, finalizeData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await finalizeSettlement(settlementNO, finalizeData);
      
      if(response.Error) {
        throw new Error(response.ErrorMessage || 'Failed to finalize settlement');
      }
      
      toast.success('Settlement finalized successfully');
      
      // Refresh settlement detail and settlements list
      await fetchSettlementDetail(settlementNO);
      await fetchSettlements();
      
      return response;
    } catch (error) {
      const message = error.message || 'Failed to finalize settlement';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchSettlementDetail, fetchSettlements]);

  // Update settlement
  const handleUpdateSettlement = useCallback(async (updateData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await updateSettlement(updateData);
      
      if(response.Error) {
        throw new Error(response.ErrorMessage || 'Failed to update settlement');
      }
      
      toast.success('Settlement updated successfully');
      
      // Refresh settlements list
      await fetchSettlements();
      
      return response;
    } catch (error) {
      const message = error.message || 'Failed to update settlement';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchSettlements]);

  // Update settlement status
  const handleUpdateSettlementStatus = useCallback(async (settlementNO, statusID) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await updateSettlementStatus(settlementNO, statusID);
      
      if(response.Error) {
        throw new Error(response.ErrorMessage || 'Failed to update settlement status');
      }
      
      toast.success('Settlement status updated successfully');
      
      // Refresh settlement detail and settlements list
      await fetchSettlementDetail(settlementNO);
      await fetchSettlements();
      
      return response;
    } catch (error) {
      const message = error.message || 'Failed to update settlement status';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchSettlementDetail, fetchSettlements]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setShipmentRates([]);
    setActiveRate(null);
    setSummaryDashboard(null);
    setOrderReconciliation(null);
    setSettlements([]);
    setSettlementDetail(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    // State
    loading,
    error,
    shipmentRates,
    activeRate, priceZones,
    summaryDashboard,
    orderReconciliation,
    settlements,
    settlementsPagination,
    settlementDetail,
    
    // Actions
    fetchActiveShipmentRate,
    fetchShipmentRates,
    handleCreateShipmentRate, fetchPriceZones, handleCreatePriceZone,
    fetchSummaryDashboard,
    fetchOrderReconciliation,
    fetchSettlements,
    fetchSettlementDetail,
    handleCreateSettlementRequest,
    handleAddSettlementItem,
    handleRemoveSettlementItem,
    handleFinalizeSettlement,
    handleUpdateSettlement,
    handleUpdateSettlementStatus,
    clearError,
    reset,
  };
};

export default useFinance;
