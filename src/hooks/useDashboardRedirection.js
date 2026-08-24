/**
 * Custom hook for dashboard redirection logic
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  getAvailableDashboards, 
  getPrimaryDashboardRoute,
  storeDashboardPreference,
  getDashboardPreference,
  clearDashboardPreference
} from "@/utils/roleMapping";
import toast from "react-hot-toast";

export const useDashboardRedirection = () => {
  const router = useRouter();
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [availableDashboards, setAvailableDashboards] = useState([]);
  const [redirecting, setRedirecting] = useState(false);

  /**
   * Handle user login and determine dashboard redirection
   * @param {Object} loginResponse - Response from login API
   */
  const handleLoginRedirection = useCallback(async (loginResponse) => {
    try {
      if(loginResponse?.Error){
        toast.error(loginResponse.Message);
        return;
      }

      setRedirecting(true);


      const assignedRoles = loginResponse?.AssignedRoles || [];
      
      if (assignedRoles.length === 0) {
        toast.error("No roles assigned to your account. Please contact administrator.");
        return;
      }

      // Get available dashboards for user
      const dashboards = getAvailableDashboards(assignedRoles);
      
      if (dashboards.length === 0) {
        toast.error("No accessible dashboards found for your roles.");
        return;
      }

      // If user has only one dashboard option, redirect directly
      if (dashboards.length === 1) {
        const dashboard = dashboards[0];
        storeDashboardPreference(dashboard.route);
        
        toast.success(`Redirecting to ${dashboard.displayName}`);
        router.push(dashboard.route);
        return;
      }

      // Check if user has a stored preference and it's still valid
      const storedPreference = getDashboardPreference();
      if (storedPreference) {
        const isValidPreference = dashboards.some(d => d.route === storedPreference);
        if (isValidPreference) {
          const preferredDashboard = dashboards.find(d => d.route === storedPreference);
          toast.success(`Redirecting to ${preferredDashboard.displayName}`);
          router.push(storedPreference);
          return;
        }
      }

      // Multiple dashboards available - show selection modal
      setAvailableDashboards(dashboards);
      setShowDashboardModal(true);

    } catch (error) {
      toast.error("Failed to determine dashboard access. Please try again.");
    } finally {
      setRedirecting(false);
    }
  }, [router]);

  /**
   * Handle dashboard selection from modal
   * @param {Object} selectedDashboard - Selected dashboard object
   */
  const handleDashboardSelection = useCallback(async (selectedDashboard) => {
    try {
      setRedirecting(true);

      // Store user preference
      storeDashboardPreference(selectedDashboard.route);
      
      // Close modal
      setShowDashboardModal(false);
      
      // Redirect to selected dashboard
      toast.success(`Redirecting to ${selectedDashboard.displayName}`);
      router.push(selectedDashboard.route);

    } catch (error) {
      toast.error("Failed to redirect to dashboard. Please try again.");
    } finally {
      setRedirecting(false);
    }
  }, [router]);

  /**
   * Close dashboard selection modal
   */
  const closeDashboardModal = useCallback(() => {
    setShowDashboardModal(false);
    setRedirecting(false);
  }, []);

  /**
   * Clear stored dashboard preference (useful for logout)
   */
  const clearStoredPreference = useCallback(() => {
    clearDashboardPreference();
  }, []);

  /**
   * Check user access to specific dashboard route
   * @param {Array} assignedRoles - User's assigned roles
   * @param {string} targetRoute - Route to check access for
   * @returns {boolean} True if user has access
   */
  const hasAccessToDashboard = useCallback((assignedRoles, targetRoute) => {
    const dashboards = getAvailableDashboards(assignedRoles);
    return dashboards.some(dashboard => dashboard.route === targetRoute);
  }, []);

  /**
   * Get dashboard route for direct redirection (single role scenario)
   * @param {Array} assignedRoles - User's assigned roles
   * @returns {string|null} Dashboard route or null if multiple options
   */
  const getDirectDashboardRoute = useCallback((assignedRoles) => {
    return getPrimaryDashboardRoute(assignedRoles);
  }, []);

  return {
    // State
    showDashboardModal,
    availableDashboards,
    redirecting,
    
    // Methods
    handleLoginRedirection,
    handleDashboardSelection,
    closeDashboardModal,
    clearStoredPreference,
    hasAccessToDashboard,
    getDirectDashboardRoute,
  };
};

export default useDashboardRedirection;
