
/**
 * Custom hook for Admin operations
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  getCities,
  getDistributionCenters,
  createDistributionCenter,
  updateDistributionCenter,
  assignDCUser,
  getDCAssignedUsers,
  deactivateDCAssignedUser,
  getSystemRoles,
  getUsers,
  registerUser,
  addUserRole,
  removeUserRoleType,
  getUsersByRole,
  getUsersByVendor,
  updateUserInfo,
  getDistributionCenterType,
  getCouriers,
  addCourier,
  deactivateCourier,
} from "@/services/adminService";
import toast from "react-hot-toast";

export const useAdmin = (initialParams = {}) => {
  const [usersByVendor, setUsersByVendor] = useState([]);

  // Get users by vendor
  const fetchUsersByVendor = useCallback(
    async (queryParams = {}) => {
      try {
        setLoading(true);
        setError(null);

        const response = await getUsersByVendor(queryParams);
        setUsersByVendor(response.Data || []);

        // Update pagination if response contains pagination info
        if (response.TotalPages) {
          setPagination({
            currentPage: response.PageNO || 1,
            totalPages: response.TotalPages || 0,
            totalItems: response.TotalCount || 0,
            pageSize: response.PageSize || 100,
          });
        }

        return response;
      } catch (error) {
        const message = error.message || "Failed to fetch users by vendor";
        setError(message);
        toast.error(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cities, setCities] = useState([]);
  const [distributionCenters, setDistributionCenters] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [systemRoles, setSystemRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersByRole, setUsersByRole] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    pageSize: 100,
  });
  const [params, setParams] = useState(initialParams);
  const [user, setUser] = useState(null);
  const [distributionCenterTypes, setDistributionCenterTypes] = useState([]);
  const [couriers, setCouriers] = useState([]);

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

  // Memoize params to prevent unnecessary re-renders
  const memoizedParams = useMemo(
    () => ({
      ...params,
    }),
    [params]
  );

  // Get cities
  const fetchCities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getCities();
      setCities(response.Data);
      return response;
    } catch (error) {
      const message = error.message || "Failed to fetch cities";
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get distribution centers
  const fetchDistributionCenters = useCallback(
    async (queryParams = memoizedParams) => {
      try {
        setLoading(true);
        setError(null);

        const response = await getDistributionCenters(queryParams);
        // Extract the Data array from the response structure
        setDistributionCenters(response?.Data || []);

        // Update pagination if response contains pagination info
        if (response?.TotalPages) {
          setPagination({
            currentPage: response?.PageNO || 1,
            totalPages: response?.TotalPages || 0,
            totalItems: response?.TotalCount || 0,
            pageSize: response?.PageSize || 100,
          });
        }

        return response;
      } catch (error) {
        const message = error.message || "Failed to fetch distribution centers";
        setError(message);
        toast.error(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [memoizedParams]
  );

  // Create distribution center
  const handleCreateDistributionCenter = useCallback(async (dcData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await createDistributionCenter(dcData);
      toast.success("Distribution center created successfully");

      // Refresh the distribution centers list
      await fetchDistributionCenters();

      return response;
    } catch (error) {
      const message = error.message || "Failed to create distribution center";
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchDistributionCenters]);

  // Update distribution center
  const handleUpdateDistributionCenter = useCallback(async (dcData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await updateDistributionCenter(dcData);
      toast.success("Distribution center updated successfully");

      // Refresh the distribution centers list
      await fetchDistributionCenters();

      return response;
    } catch (error) {
      const message = error.message || "Failed to update distribution center";
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchDistributionCenters]);

  // Get users assigned to distribution center
  const fetchDCAssignedUsers = useCallback(
    async (queryParams = memoizedParams) => {
      try {
        setLoading(true);
        setError(null);

        const response = await getDCAssignedUsers(queryParams);
        setAssignedUsers(response.Data || response.data || response);

        // Update pagination if response contains pagination info
        if (response.TotalPages) {
          setPagination({
            currentPage: response.PageNO || 1,
            totalPages: response.TotalPages || 0,
            totalItems: response.TotalCount || 0,
            pageSize: response.PageSize || 100,
          });
        }

        return response;
      } catch (error) {
        const message = error.message || "Failed to fetch assigned users";
        setError(message);
        toast.error(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [memoizedParams]
  );

  // Assign user to distribution center
  const handleAssignDCUser = useCallback(async (assignmentData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await assignDCUser(assignmentData);
      toast.success("User assigned to distribution center successfully");

      // If we have a dcCode in the assignment data, refresh the assigned users list
      if (assignmentData.dcCode) {
        await fetchDCAssignedUsers({ dcCode: assignmentData.dcCode });
      }

      return response;
    } catch (error) {
      const message = error.message || "Failed to assign user to distribution center";
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchDCAssignedUsers]);

  // Deactivate user assignment
  const handleDeactivateDCAssignedUser = useCallback(async (deactivationData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await deactivateDCAssignedUser(deactivationData);
      toast.success("User assignment deactivated successfully");

      // If we have a dcCode in the deactivation data, refresh the assigned users list
      if (deactivationData.dcCode) {
        await fetchDCAssignedUsers({ dcCode: deactivationData.dcCode });
      }

      return response;
    } catch (error) {
      const message = error.message || "Failed to deactivate user assignment";
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchDCAssignedUsers]);

  // Get system roles
  const fetchSystemRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getSystemRoles();
      setSystemRoles(response.Data || []);
      return response;
    } catch (error) {
      const message = error.message || "Failed to fetch system roles";
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get distribution center types
  const fetchDistributionCenterTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getDistributionCenterType();
      setDistributionCenterTypes(response.Data || []);
      return response;
    } catch (error) {
      const message = error.message || "Failed to fetch distribution center types";
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get users
  const fetchUsers = useCallback(
    async (queryParams = memoizedParams) => {
      try {
        setLoading(true);
        setError(null);

        const response = await getUsers(queryParams);
        setUsers(response.Data || []);

        // Update pagination if response contains pagination info
        if (response.TotalPages) {
          setPagination({
            currentPage: response.PageNO || 1,
            totalPages: response.TotalPages || 0,
            totalItems: response.TotalCount || 0,
            pageSize: response.PageSize || 100,
          });
        }

        return response;
      } catch (error) {
        const message = error.message || "Failed to fetch users";
        setError(message);
        toast.error(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [memoizedParams]
  );

  // Get users by role
  const fetchUsersByRole = useCallback(
    async (queryParams = memoizedParams) => {
      try {
        setLoading(true);
        setError(null);

        const response = await getUsersByRole(queryParams);
        setUsersByRole(response.Data || []);

        // Update pagination if response contains pagination info
        if (response.TotalPages) {
          setPagination({
            currentPage: response.PageNO || 1,
            totalPages: response.TotalPages || 0,
            totalItems: response.TotalCount || 0,
            pageSize: response.PageSize || 100,
          });
        }

        return response;
      } catch (error) {
        const message = error.message || "Failed to fetch users by role";
        setError(message);
        toast.error(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [memoizedParams]
  );

  // Get couriers
  const fetchCouriers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getCouriers();
      setCouriers(response.Data || []);
      return response;
    } catch (error) {
      const message = error.message || "Failed to fetch couriers";
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a courier
  const handleAddCourier = useCallback(async (courierData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await addCourier(courierData);
      if (response.Error) {
        throw new Error(response.Message || "Failed to add courier");
      }
      toast.success(response.Message || "Courier added successfully");

      await fetchCouriers();

      return response;
    } catch (error) {
      const message = error.message || "Failed to add courier";
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchCouriers]);

  // Activate/deactivate a courier
  const handleDeactivateCourier = useCallback(async (courierData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await deactivateCourier(courierData);
      if (response.Error) {
        throw new Error(response.Message || "Failed to update courier status");
      }
      toast.success(response.Message || "Courier status updated successfully");

      await fetchCouriers();

      return response;
    } catch (error) {
      const message = error.message || "Failed to update courier status";
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchCouriers]);

  // Register user
  const handleRegisterUser = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await registerUser(userData);
      toast.success("User registered successfully");

      return response;
    } catch (error) {
      const message = error.message || "Failed to register user";
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add user role
  const handleAddUserRole = useCallback(async (userRoleData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await addUserRole(userRoleData);
      toast.success("User role added successfully");

      // Refresh the users list if we have user data
      if (userRoleData.userCode) {
        await fetchUsers();
      }

      return response;
    } catch (error) {
      const message = error.message || "Failed to add user role";
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  // Remove user role
  const handleRemoveUserRole = useCallback(async (userRoleData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await removeUserRoleType(userRoleData);
      toast.success("User role removed successfully");

      // Refresh the users list if we have user data
      if (userRoleData.userCode) {
        await fetchUsers();
      }

      return response;
    } catch (error) {
      const message = error.message || "Failed to remove user role";
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  // Update user information
  const handleUpdateUserInfo = useCallback(async (userInfoData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await updateUserInfo(userInfoData);
      toast.success("User information updated successfully");

      // Refresh the users list
      await fetchUsers();

      return response;
    } catch (error) {
      const message = error.message || "Failed to update user information";
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  // Update params
  const updateParams = useCallback((newParams) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setCities([]);
    setDistributionCenters([]);
    setAssignedUsers([]);
    setSystemRoles([]);
    setUsers([]);
    setUsersByRole([]);
    setDistributionCenterTypes([]);
    setCouriers([]);
    setPagination({
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      pageSize: 100,
    });
    setError(null);
    setLoading(false);
  }, []);

  // Auto-fetch cities on mount
  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  useEffect(() => {
    fetchSystemRoles();
  }, [fetchSystemRoles]);

  return {
    // State
    loading,
    error,
    cities,
    distributionCenters,
    assignedUsers,
    systemRoles,
    users,
  usersByRole,
  usersByVendor,
    distributionCenterTypes,
    couriers,
    pagination,
    params: memoizedParams,

    // User context
    user,

    // Actions
    fetchCities,
    fetchDistributionCenters,
    handleCreateDistributionCenter,
    handleUpdateDistributionCenter,
    handleAssignDCUser,
    fetchDCAssignedUsers,
    handleDeactivateDCAssignedUser,
    fetchSystemRoles,
    fetchUsers,
  fetchUsersByRole,
  fetchUsersByVendor,
    fetchDistributionCenterTypes,
    fetchCouriers,
    handleAddCourier,
    handleDeactivateCourier,
    handleRegisterUser,
    handleAddUserRole,
    handleRemoveUserRole,
    handleUpdateUserInfo,
    updateParams,
    clearError,
    reset,
  };
};

export default useAdmin;
