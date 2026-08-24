/**
 * Custom hook for User/Auth operations
 */

import { useState, useCallback, useEffect } from "react";
import {
  userLogin,
  userLogout,
  updateUser,
  requestPasscode,
  confirmResetPassword,
  getUserData,
  getToken,
  isTokenValid,
} from "@/services/authService";
import { clearDashboardPreference } from "@/utils/roleMapping";
import toast from "react-hot-toast";

export const useUser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const token = getToken();
    const userData = getUserData();

    if (token && isTokenValid(token) && userData) {
      setUser(userData);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  // Login user
  const handleLogin = useCallback(async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userLogin(credentials);
      if(response.Error){
        setError(response.Error);
        setIsAuthenticated(false);
        setUser(null);
        toast.error(response.Message || "Login failed");
        return;
      }

      // Update local state
      setUser(response);
      setIsAuthenticated(true);
      toast.success("Login successful");
      return response;
    } catch (error) {
      const message = error.message || "Login failed";
      setError(message);
      setIsAuthenticated(false);
      setUser(null);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout user
  const handleLogout = useCallback(async () => {
    try {
      setLoading(true);

      await userLogout();

      // Clear local state
      setUser(null);
      setIsAuthenticated(false);
      setError(null);

      clearDashboardPreference();

      toast.success("Logged out successfully");
    } catch (error) {
      // Even if logout API fails, clear local state
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      clearDashboardPreference();
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user profile
  const handleUpdateUser = useCallback(
    async (updateData) => {
      try {
        setLoading(true);
        setError(null);

        const response = await updateUser(updateData);

        // Update local state with new user data
        const updatedUser = { ...user, ...response };
        setUser(updatedUser);

        toast.success("Profile updated successfully");

        return response;
      } catch (error) {
        const message = error.message || "Failed to update profile";
        setError(message);
        toast.error(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Request password reset code
  const handleRequestPasscode = useCallback(async (phoneNumber) => {
    try {
      setLoading(true);
      setError(null);

      const response = await requestPasscode({ phoneNumber });

      toast.success("Passcode sent successfully");

      return response;
    } catch (error) {
      const message = error.message || "Failed to send passcode";
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Confirm password reset
  const handleConfirmResetPassword = useCallback(async (resetData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await confirmResetPassword(resetData);

      toast.success("Password reset successfully");

      return response;
    } catch (error) {
      const message = error.message || "Failed to reset password";
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(() => {
    const userData = getUserData();
    const token = getToken();

    if (token && isTokenValid(token) && userData) {
      setUser(userData);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get user role
  const getUserRole = useCallback(() => {
    if (!user) return null;

    // Extract role from user data - adjust based on your API response structure
    return user.Role || user.UserType || user.userType || null;
  }, [user]);

  // Check if user has specific role
  const hasRole = useCallback(
    (role) => {
      const userRole = getUserRole();
      return userRole === role;
    },
    [getUserRole]
  );

  // Get user permissions
  const getUserPermissions = useCallback(() => {
    if (!user) return [];

    // Extract permissions from user data - adjust based on your API response structure
    return user.Permissions || user.permissions || [];
  }, [user]);

  // Check if user has specific permission
  const hasPermission = useCallback(
    (permission) => {
      const permissions = getUserPermissions();
      return permissions.includes(permission);
    },
    [getUserPermissions]
  );

  return {
    // State
    loading,
    error,
    user,
    isAuthenticated,

    // Actions
    handleLogin,
    handleLogout,
    handleUpdateUser,
    handleRequestPasscode,
    handleConfirmResetPassword,
    refreshUser,
    clearError,

    // Utilities
    getUserRole,
    hasRole,
    getUserPermissions,
    hasPermission,
  };
};

export default useUser;
