/**
 * Custom hook for Rider Dashboard data and operations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getRiderDashboard } from '@/services/dashboardService';
import toast from 'react-hot-toast';

export const useRiderDashboard = (initialParams = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);
  const [user, setUser] = useState(null);

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

  // Memoize params to prevent unnecessary re-renders
  const memoizedParams = useMemo(() => ({
    ...params,
    riderUserCode
  }), [params, riderUserCode]);

  // Fetch rider dashboard data
  const fetchRiderDashboard = useCallback(async (queryParams = memoizedParams) => {
    if (!queryParams.riderUserCode) {
      setError('Rider user code is required but not found in user data');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await getRiderDashboard(queryParams);

      if (response && !response.Error) {
        setData(response.Data);
      } else {
        throw new Error(response?.Message || 'Failed to fetch rider dashboard data');
      }

      return response;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch rider dashboard data';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  // Auto-fetch on mount and when params change
  useEffect(() => {
    if (riderUserCode) {
      fetchRiderDashboard();
    }
  }, [fetchRiderDashboard, riderUserCode]);

  const refetch = useCallback(() => {
    fetchRiderDashboard();
  }, [fetchRiderDashboard]);

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
    setError(null);
    setLoading(false);
  }, []);

  // Get summary statistics from data
  const summaryStats = useMemo(() => {
    if (!data?.summary) {
      return {
        totalCodAmount: 0,
        todayCodAmount: 0,
        pendingCodPayments: 0,
        todayDeliveries: 0,
        totalDeliveries: 0,
        totalManifestCount: 0,
        activeManifestCount: 0
      };
    }

    return {
      totalCodAmount: data.summary.totalCodAmount || 0,
      todayCodAmount: data.summary.todayCodAmount || 0,
      pendingCodPayments: data.summary.pendingCodPayments || 0,
      todayDeliveries: data.summary.todayDeliveries || 0,
      totalDeliveries: data.summary.totalDeliveries || 0,
      totalManifestCount: data.summary.totalManifestCount || 0,
      activeManifestCount: data.summary.activeManifestCount || 0,
    };
  }, [data]);

  // Get rider shipments array
  const riderShipments = useMemo(() => {
    return data?.riderShipmentArray || [];
  }, [data]);

  // Get rider COD payments array
  const riderCodPayments = useMemo(() => {
    return data?.riderCodPaymentArray || [];
  }, [data]);

  return {
    // State
    data,
    loading,
    error,
    params: memoizedParams,

    // User context
    riderUserCode,

    // Computed data
    summaryStats,
    riderShipments,
    riderCodPayments,

    // Actions
    fetchRiderDashboard,
    refetch,
    updateParams,
    clearError,
    reset,
  };
};

export default useRiderDashboard;
