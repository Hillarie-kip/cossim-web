/**
 * Custom hook for Distribution Center operations
 */

//@ts-check

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  getDCAssignedUsers,
} from '@/services/distributionCenterService';
import toast from 'react-hot-toast';

export const useDistributionCenter = (initialParams = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [distributionCenters, setDistributionCenters] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    pageSize: 100
  });
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

  // Get DC code from user data
  const dcCode = useMemo(() => {
    return user?.AssignedDC?.DCCode || user?.DCCode || '';
  }, [user]);

  // Memoize params to prevent unnecessary re-renders
  const memoizedParams = useMemo(() => ({
    ...params,
    dcCode
  }), [params, dcCode]);

  // Get DC assigned users
  const fetchDCAssignedUsers = useCallback(async (queryParams = memoizedParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getDCAssignedUsers(queryParams);
      setAssignedUsers(response.data || response);
      
      // Update pagination if response contains pagination info
      if (response.pagination) {
        setPagination(response.pagination);
      }
      
      return response;
    } catch (error) {
      const message = error.message || 'Failed to fetch assigned users';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  // Update params
  const updateParams = useCallback((newParams) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setDistributionCenters([]);
    setAssignedUsers([]);
    setPagination({
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      pageSize: 100
    });
    setError(null);
    setLoading(false);
  }, []);

  return {
    // State
    loading,
    error,
    distributionCenters,
    assignedUsers,
    pagination,
    params: memoizedParams,
    
    // User context
    dcCode,
    
    // Actions
    fetchDCAssignedUsers,
    updateParams,
    clearError,
    reset,
  };
};

export default useDistributionCenter;
