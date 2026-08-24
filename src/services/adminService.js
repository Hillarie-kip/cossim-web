import { api } from "@/lib/apiClient";
import apiRoutes from "@/constants/apis";

/**
 * Admin Service
 * Handles all admin-related API calls
 */

/**
 * Get cities
 * @returns {Promise} API response with cities data
 */
export const getCities = async () => {
    try {
        const response = await api.get(apiRoutes.admin.getCity);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch cities.';
        throw new Error(message);
    }
};

export const getRegions = async () => {
    try {
        const response = await api.get(apiRoutes.admin.getRegions);
        return response.data;
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch regions.');
    }
};

/**
 * Get distribution centers with optional filtering and pagination
 * @param {Object} params - Query parameters
 * @param {number} params.pageNo - Page number
 * @param {number} params.pageSize - Page size
 * @param {string} params.searchTerm - Search term
 * @param {string} params.cityCode - City code filter
 * @returns {Promise} API response with distribution centers data
 */
export const getDistributionCenters = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add optional parameters
        if (params.pageNo) queryParams.append('PageNO', params.pageNo);
        if (params.pageSize) queryParams.append('PageSize', params.pageSize);
        if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
        if (params.cityCode) queryParams.append('CityCode', params.cityCode);

        const url = `${apiRoutes.admin.getDistributionCenter}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);
        const payload = response.data;
        if (!Array.isArray(payload?.Data)) return payload;
        return {
            ...payload,
            Data: [...payload.Data].sort((left, right) =>
                String(left?.DCName || left?.dcName || "").localeCompare(
                    String(right?.DCName || right?.dcName || ""),
                    undefined,
                    { sensitivity: "base" }
                )
            ),
        };
    } catch (error) {
        const message = error.message || 'Failed to fetch distribution centers.';
        throw new Error(message);
    }
};

/**
 * Create a new distribution center
 * @param {Object} dcData - Distribution center data
 * @param {string} dcData.DCName - Distribution center name
 * @param {string} dcData.City - City
 * @param {string} dcData.Region - Region
 * @param {string} dcData.AddressLine1 - Primary address
 * @param {string} dcData.AddressLine2 - Secondary address (optional)
 * @param {string} dcData.Landmark - Landmark (optional)
 * @param {number} dcData.Latitude - Latitude (optional)
 * @param {number} dcData.Longitude - Longitude (optional)
 * @returns {Promise} API response
 */
export const createDistributionCenter = async (dcData) => {
    try {
        const response = await api.post(apiRoutes.admin.createDistributionCenter, dcData);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to create distribution center.';
        throw new Error(message);
    }
};

/**
 * Update an existing distribution center
 * @param {Object} dcData - Distribution center data with updates
 * @returns {Promise} API response
 */
export const updateDistributionCenter = async (dcData) => {
    try {
        const response = await api.post(apiRoutes.admin.updateDistributionCenter, dcData);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to update distribution center.';
        throw new Error(message);
    }
};
export const deactivateDistributionCenter = async (dcData) => {
    try {
        const response = await api.post(apiRoutes.admin.deactivateDistributionCenter, dcData);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to deactivate distribution center.';
        throw new Error(message);
    }
};

/**
 * Assign a user to a distribution center
 * @param {Object} assignmentData - User assignment data
 * @returns {Promise} API response
 */
export const assignDCUser = async (assignmentData) => {
    try {
        const response = await api.post(apiRoutes.admin.assignDCUser, assignmentData);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to assign user to distribution center.';
        throw new Error(message);
    }
};

/**
 * Get users assigned to a distribution center
 * @param {Object} params - Query parameters
 * @param {string} params.dcCode - Distribution center code
 * @param {number} params.pageNo - Page number
 * @param {number} params.pageSize - Page size
 * @param {string} params.searchTerm - Search term
 * @returns {Promise} API response with assigned users data
 */
export const getDCAssignedUsers = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add optional parameters
        if (params.dcCode) queryParams.append('dcCode', params.dcCode);
        if (params.pageNo) queryParams.append('PageNO', params.pageNo);
        if (params.pageSize) queryParams.append('PageSize', params.pageSize);
        if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);

        const url = `${apiRoutes.admin.getDCAssignedUsers}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);
        
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch assigned users.';
        throw new Error(message);
    }
};

/**
 * Deactivate a user assignment from a distribution center
 * @param {Object} deactivationData - Deactivation data
 * @returns {Promise} API response
 */
export const deactivateDCAssignedUser = async (deactivationData) => {
    try {
        const response = await api.post(apiRoutes.admin.deactivateDCAssignedUser, deactivationData);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to deactivate user assignment.';
        throw new Error(message);
    }
};

/**
 * Get system roles
 * @returns {Promise} API response with system roles data
 */
export const getSystemRoles = async () => {
    try {
        const response = await api.get(apiRoutes.admin.getSystemRole);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch system roles.';
        throw new Error(message);
    }
};

/**
 * Get users
 * @param {Object} params - Query parameters
 * @param {number} params.pageNo - Page number
 * @param {number} params.pageSize - Page size
 * @param {string} params.searchTerm - Search term
 * @param {string} params.roleTypeCode - Role type code filter
 * @returns {Promise} API response with users data
 */
export const getUsers = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();

        // Add optional parameters
        if (params.pageNo) queryParams.append('PageNO', params.pageNo);
        if (params.pageSize) queryParams.append('PageSize', params.pageSize);
        if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
        if (params.roleTypeCode) queryParams.append('RoleTypeCode', params.roleTypeCode);
        

        const url = `${apiRoutes.admin.getUsers}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);

        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch users.';
        throw new Error(message);
    }
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise} API response
 */
export const registerUser = async (userData) => {
    try {
        const response = await api.post(apiRoutes.admin.registerUser, userData);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to register user.';
        throw new Error(message);
    }
};

/**
 * Add a user role
 * @param {Object} userRoleData - User role data
 * @returns {Promise} API response
 */
export const addUserRole = async (userRoleData) => {
    try {
        const response = await api.post(apiRoutes.admin.addUserRole, userRoleData);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to add user role.';
        throw new Error(message);
    }
};

/**
 * Remove a user role
 * @param {Object} userRoleData - User role data
 * @returns {Promise} API response
 */
export const removeUserRoleType = async (userRoleData) => {
    try {
        const response = await api.post(apiRoutes.admin.removeUserRoleType, userRoleData);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to remove user role.';
        throw new Error(message);
    }
};

/**
 * Get users by role
 * @param {*} params 
 * @returns 
 */

export const getUsersByRole = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();

        // Add optional parameters
        if (params.RoleTypeCode) queryParams.append('RoleTypeCode', params.RoleTypeCode);
        if (params.PageNO) queryParams.append('PageNO', params.PageNO);
        if (params.PageSize) queryParams.append('PageSize', params.PageSize);
        if (params.SearchTerm) queryParams.append('SearchTerm', params.SearchTerm);

        const url = `${apiRoutes.admin.getUsersByRole}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);

        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch users by role.';
        throw new Error(message);
    }
};

/**
 * Update a user's profile information (admin editing another user)
 * @param {Object} userInfo - User profile fields plus distributionCenterCodes for assignment in the same transaction
 * @returns {Promise} API response
 */
export const updateUserInfo = async (userInfo) => {
    try {
        const response = await api.post(apiRoutes.auth.updateUser, userInfo);

        if (response.data?.Error) {
            throw new Error(response.data.Message || 'Failed to update user information.');
        }
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to update user information.';
        throw new Error(message);
    }
};

export const getDistributionCenterType = async () => {
    try {
        const response = await api.get(apiRoutes.admin.getDistributionCenterType);
        if (response.data && !response.data.Error) {
            return response.data;
        } else {
            throw new Error('Failed to fetch distribution center types.');
        }
    } catch (error) {
        const message = error.message || 'Failed to fetch distribution center types.';
        throw new Error(message);
    }
};

/**
 * Get users by vendor
 * @param {Object} params - Query parameters
 * @param {string} params.VendorCode - Vendor code
 * @param {number} params.PageNO - Page number
 * @param {number} params.PageSize - Page size
 * @param {string} params.SearchTerm - Search term
 * @returns {Promise} API response with users for the vendor
 */
export const getUsersByVendor = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.VendorCode) queryParams.append('VendorCode', params.VendorCode);
        if (params.PageNO) queryParams.append('PageNO', params.PageNO);
        if (params.PageSize) queryParams.append('PageSize', params.PageSize);
        if (params.SearchTerm) queryParams.append('SearchTerm', params.SearchTerm);

        const url = `${apiRoutes.admin.getUsersByVendor}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch users by vendor.';
        throw new Error(message);
    }
};

/**
 * Get couriers
 * @returns {Promise} API response with couriers data
 */
export const getCouriers = async () => {
    try {
        const response = await api.get(apiRoutes.admin.getCouriers);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch couriers.';
        throw new Error(message);
    }
};

/**
 * Add a new courier
 * @param {Object} courierData - Matches CreateCourierModel: { courierCode, courierName }
 * @returns {Promise} API response
 */
export const addCourier = async (courierData) => {
    try {
        const response = await api.post(apiRoutes.admin.addCourier, courierData);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to add courier.';
        throw new Error(message);
    }
};

/**
 * Activate/deactivate a courier
 * @param {Object} courierData - Matches DeactivateCourierModel: { courierCode, isActive }
 * @returns {Promise} API response
 */
export const deactivateCourier = async (courierData) => {
    try {
        const response = await api.post(apiRoutes.admin.deactivateCourier, courierData);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to update courier status.';
        throw new Error(message);
    }
};

// Export all admin service functions
const adminService = {
    getCities,
    getRegions,
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
    updateUserInfo,
    getDistributionCenterType,
    getUsersByVendor,
    getCouriers,
    addCourier,
    deactivateCourier
};

export default adminService;
