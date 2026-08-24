/**
 * Custom hook for Vendor Dashboard data
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getVendorDashboard } from '@/services/dashboardService';
import toast from 'react-hot-toast';

export const useVendorDashboard = (initialParams = {}) => {
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

  // Get vendor code from user data
  const vendorCode = useMemo(() => {
    return user?.AssignedVendor?.VendorCode || user?.UserCode || '';
  }, [user]);

  // Memoize params to prevent unnecessary re-renders
  const memoizedParams = useMemo(() => ({
    ...params,
    vendorCode
  }), [params, vendorCode]);

  const fetchData = useCallback(async (queryParams = memoizedParams) => {
    if (!queryParams.vendorCode) {
      setError('Vendor code is required but not found in user data');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await getVendorDashboard(queryParams);
      
      if (response && !response.Error) {
        setData(response.Data);
      } else {
        throw new Error(response?.Message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch vendor dashboard data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  // Auto-fetch on mount and when params change
  useEffect(() => {
    if (vendorCode) {
      fetchData();
    }
  }, [fetchData, vendorCode]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const updateParams = useCallback((newParams) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  return {
    data,
    loading,
    error,
    params,
    user,
    vendorCode,
    refetch,
    updateParams
  };
};

export default useVendorDashboard;
