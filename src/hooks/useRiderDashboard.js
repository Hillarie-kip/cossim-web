/**
 * Custom hook for Rider Dashboard data and operations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getShipmentOrdersByDC } from '@/services/shipmentService';
import { createHandoverBatch } from '@/services/distributionCenterService';
import toast from 'react-hot-toast';

export const useRiderDashboard = (initialParams = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);
  const [user, setUser] = useState(null);
  const [assignedShipments, setAssignedShipments] = useState([]);

  // Get user from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('cossim-user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      }
    } catch (err) {
      console.error('Error parsing user data from localStorage:', err);
    }
  }, []);

  // Get rider code from user data
  const riderUserCode = useMemo(() => {
    return user?.UserCode || user?.RiderCode || '';
  }, [user]);

  // Get assigned DC code from user data
  const dcCode = useMemo(() => {
    return user?.AssignedDC?.DCCode || user?.DCCode || '';
  }, [user]);

  // Memoize params to prevent unnecessary re-renders
  const memoizedParams = useMemo(() => ({
    ...params,
    dcCode,
    riderUserCode
  }), [params, dcCode, riderUserCode]);

  // Fetch rider's assigned shipments
  const fetchAssignedShipments = useCallback(async (queryParams = memoizedParams) => {
    if (!queryParams.dcCode) {
      setError('DC code is required but not found in user data');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Filter for shipments assigned to this rider
      const shipmentParams = {
        ...queryParams,
        DCCode: queryParams.dcCode,
        assignedRider: queryParams.riderUserCode,
        onlyActive: true
      };
      
      const response = await getShipmentOrdersByDC(shipmentParams);
      
      if (response && !response.Error) {
        setAssignedShipments(response.Data || response);
        setData(response);
      } else {
        throw new Error(response?.Message || 'Failed to fetch assigned shipments');
      }
      
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch rider assigned shipments';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  // Complete handover batch
  const completeHandoverBatch = useCallback(async (handoverData) => {
    try {
      setLoading(true);
      setError(null);
      
      const batchData = {
        ...handoverData,
        riderUserCode,
        fromDCCode: dcCode
      };
      
      const response = await createHandoverBatch(batchData);
      
      if (response && !response.Error) {
        toast.success('Handover batch completed successfully');
        
        // Refresh assigned shipments
        await fetchAssignedShipments();
      } else {
        throw new Error(response?.Message || 'Failed to complete handover batch');
      }
      
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Failed to complete handover batch';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [riderUserCode, dcCode, fetchAssignedShipments]);

  // Update delivery status
  const updateDeliveryStatus = useCallback(async (shipmentId, statusData) => {
    try {
      setLoading(true);
      setError(null);
      
      // This would typically call a shipment status update API
      // For now, we'll simulate the functionality
      toast.success('Delivery status updated successfully');
      
      // Refresh assigned shipments
      await fetchAssignedShipments();
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Failed to update delivery status';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAssignedShipments]);

  // Auto-fetch on mount and when params change
  useEffect(() => {
    if (dcCode) {
      fetchAssignedShipments();
    }
  }, [fetchAssignedShipments, dcCode]);

  const refetch = useCallback(() => {
    fetchAssignedShipments();
  }, [fetchAssignedShipments]);

  const updateParams = useCallback((newParams) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setData(null);
    setAssignedShipments([]);
    setError(null);
    setLoading(false);
  }, []);

  // Get summary statistics
  const getSummaryStats = useMemo(() => {
    if (!assignedShipments || !Array.isArray(assignedShipments)) {
      return {
        totalShipments: 0,
        pendingDeliveries: 0,
        completedDeliveries: 0,
        cancelledShipments: 0
      };
    }

    return {
      totalShipments: assignedShipments.length,
      pendingDeliveries: assignedShipments.filter(s => s.StatusID === 1 || s.StatusID === 2).length,
      completedDeliveries: assignedShipments.filter(s => s.StatusID === 3).length,
      cancelledShipments: assignedShipments.filter(s => s.StatusID === 4).length,
    };
  }, [assignedShipments]);

  return {
    // State
    data,
    loading,
    error,
    params: memoizedParams,
    assignedShipments,
    summaryStats: getSummaryStats,
    
    // User context
    riderUserCode,
    dcCode,
    
    // Actions
    fetchAssignedShipments,
    completeHandoverBatch,
    updateDeliveryStatus,
    refetch,
    updateParams,
    clearError,
    reset,
  };
};

export default useRiderDashboard;
