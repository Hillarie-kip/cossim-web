/**
 * Role-based dashboard mapping utility
 */

import { RoleType } from "@/constants/user-roles";

// Dashboard route mappings for each role
export const DASHBOARD_ROUTES = {
  [RoleType.ADMIN]: "/admin/dashboard",
  [RoleType.FINANCE]: "/admin/dashboard", 
  [RoleType.SALES_MANAGER]: "/sales/sales-manager-dashboard",
  [RoleType.SALES_AGENT]: "/sales/sales-agent-dashboard", 
  [RoleType.DC_OPERATOR]: "/admin/dashboard",
  [RoleType.RIDER]: "/rider/rd-overview",
  [RoleType.PACKAGE_HANDLER]: "/admin/dashboard",
  [RoleType.VENDOR]: "/admin/dashboard",
};

// Dashboard display names for user selection
export const DASHBOARD_NAMES = {
  [RoleType.ADMIN]: "Administrator Dashboard",
  [RoleType.FINANCE]: "Finance Dashboard",
  [RoleType.SALES_MANAGER]: "Sales Manager Dashboard",
  [RoleType.SALES_AGENT]: "Sales Agent Dashboard",
  [RoleType.DC_OPERATOR]: "DC Dashboard",
  [RoleType.RIDER]: "Rider Dashboard",
  [RoleType.PACKAGE_HANDLER]: "Package Handler Dashboard",
  [RoleType.VENDOR]: "Vendor Dashboard",
};

// Role type mappings - maps API role codes to internal role types
export const ROLE_CODE_MAPPING = {
  "R-001": RoleType.ADMIN,
  "R-002": RoleType.FINANCE,
  "R-003": RoleType.SALES_MANAGER,
  "R-004": RoleType.SALES_AGENT,
  "R-005": RoleType.DC_OPERATOR,
  "R-006": RoleType.RIDER,
  "R-007": RoleType.PACKAGE_HANDLER,
  "R-008": RoleType.VENDOR,
};

/**
 * Get available dashboards for a user based on their assigned roles
 * @param {Array} assignedRoles - Array of role objects from login response
 * @returns {Array} Array of dashboard options with route and display name
 */
export const getAvailableDashboards = (assignedRoles = []) => {
  if (!Array.isArray(assignedRoles) || assignedRoles.length === 0) {
    return [];
  }

  const dashboards = [];
  const routeMap = new Map(); // Map route to the best dashboard option

  // Priority order: lower number = higher priority
  const rolePriority = {
    [RoleType.ADMIN]: 1,
    [RoleType.FINANCE]: 2,
    [RoleType.SALES_MANAGER]: 3,
    [RoleType.DC_OPERATOR]: 4,
    [RoleType.SALES_AGENT]: 5,
    [RoleType.VENDOR]: 6,
    [RoleType.RIDER]: 7,
    [RoleType.PACKAGE_HANDLER]: 8,
  };

  assignedRoles.forEach(role => {
    const roleCode = role.RoleTypeCode;
    let mappedRole = ROLE_CODE_MAPPING[roleCode];

    // Fallback to name-based mapping if code doesn't match
    if (!mappedRole) {
      const name = role.RoleTypeName.toLowerCase();
      if (name.includes('admin') || name.includes('administrator')) {
        mappedRole = RoleType.ADMIN;
      } else if (name.includes('finance')) {
        mappedRole = RoleType.FINANCE;
      } else if (name.includes('sales') && name.includes('manager')) {
        mappedRole = RoleType.SALES_MANAGER;
      } else if (name.includes('sales') && name.includes('agent')) {
        mappedRole = RoleType.SALES_AGENT;
      } else if (name.includes('distribution') || name.includes('dc') || name.includes('operator')) {
        mappedRole = RoleType.DC_OPERATOR;
      } else if (name.includes('rider')) {
        mappedRole = RoleType.RIDER;
      } else if (name.includes('package') && name.includes('handler')) {
        mappedRole = RoleType.PACKAGE_HANDLER;
      } else if (name.includes('vendor')) {
        mappedRole = RoleType.VENDOR;
      }
    }

    if (mappedRole && DASHBOARD_ROUTES[mappedRole]) {
      const route = DASHBOARD_ROUTES[mappedRole];
      const priority = rolePriority[mappedRole] || 999;
      const dashboardOption = {
        roleCode: roleCode,
        roleName: role.RoleTypeName,
        route: route,
        displayName: DASHBOARD_NAMES[mappedRole] || role.RoleTypeName,
        mappedRole: mappedRole,
        priority: priority,
      };

      // If route not seen or this has higher priority (lower number), update
      if (!routeMap.has(route) || priority < routeMap.get(route).priority) {
        routeMap.set(route, dashboardOption);
      }
    }
  });

  // Convert map to array and sort by priority (lower priority number = higher hierarchy)
  return Array.from(routeMap.values()).sort((a, b) => a.priority - b.priority);
};

/**
 * Get the primary dashboard route for a user
 * If user has multiple roles, returns null (requires user selection)
 * If user has single role, returns the dashboard route
 * @param {Array} assignedRoles - Array of role objects from login response
 * @returns {string|null} Dashboard route or null if multiple options available
 */
export const getPrimaryDashboardRoute = (assignedRoles = []) => {
  const availableDashboards = getAvailableDashboards(assignedRoles);
  
  if (availableDashboards.length === 1) {
    return availableDashboards[0].route;
  }
  
  // If multiple dashboards available, return null to trigger selection modal
  return null;
};

/**
 * Check if user has a specific role
 * @param {Array} assignedRoles - Array of role objects from login response
 * @param {string} targetRole - Role code to check for
 * @returns {boolean} True if user has the role
 */
export const hasRole = (assignedRoles = [], targetRole) => {
  return assignedRoles.some(role => role.RoleTypeCode === targetRole);
};

/**
 * Get the highest priority role for a user (for default selection)
 * Priority order: Admin > Finance > Sales Manager > DC Operator > Sales Agent > Vendor > Rider > Package Handler
 * @param {Array} assignedRoles - Array of role objects from login response
 * @returns {Object|null} Highest priority role object or null
 */
export const getHighestPriorityRole = (assignedRoles = []) => {
  const priorityOrder = [
    RoleType.ADMIN,
    RoleType.FINANCE,
    RoleType.SALES_MANAGER,
    RoleType.DC_OPERATOR,
    RoleType.SALES_AGENT,
    RoleType.VENDOR,
    RoleType.RIDER,
    RoleType.PACKAGE_HANDLER,
  ];

  for (const priorityRole of priorityOrder) {
    const found = assignedRoles.find(role => 
      ROLE_CODE_MAPPING[role.RoleTypeCode] === priorityRole
    );
    if (found) {
      return found;
    }
  }

  return null;
};

/**
 * Store user's dashboard preference in localStorage
 * @param {string} dashboardRoute - Selected dashboard route
 */
export const storeDashboardPreference = (dashboardRoute) => {
  try {
    localStorage.setItem('preferred_dashboard', dashboardRoute);
  } catch (error) {
    console.error('Error storing dashboard preference:', error);
  }
};

/**
 * Get user's stored dashboard preference
 * @returns {string|null} Stored dashboard route or null
 */
export const getDashboardPreference = () => {
  try {
    return localStorage.getItem('preferred_dashboard');
  } catch (error) {
    console.error('Error getting dashboard preference:', error);
    return null;
  }
};

/**
 * Clear user's dashboard preference
 */
export const clearDashboardPreference = () => {
  try {
    localStorage.removeItem('preferred_dashboard');
  } catch (error) {
    console.error('Error clearing dashboard preference:', error);
  }
};
