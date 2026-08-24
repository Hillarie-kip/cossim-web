/**
 * Custom hook for DC Dashboard data
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getDCDashboard } from '@/services/dashboardService';
import toast from 'react-hot-toast';

export const useDCDashboard = (initialParams = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  // Memoize params to prevent unnecessary re-renders
  const paramsStringified = JSON.stringify(params);
  const memoizedParams = useMemo(() => params, [params]);

  const fetchData = useCallback(async (queryParams = memoizedParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getDCDashboard(queryParams);
      
      if (response && !response.Error) {
        setData(response.Data);
      } else {
        throw new Error(response?.Message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch DC dashboard data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  // Auto-fetch on mount and when params change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    refetch,
    updateParams
  };
};

export default useDCDashboard;
