import { authAPI } from "@/lib/apiClient";
import secureStorage from "@/lib/secureStorage";
import { setSelectedDC } from "@/services/dcService";

export const userLogin = async (payload) => {
    try {
        const response = await authAPI.login(payload);
        const data = response.data;

        const token = data?.UserToken || data?.userToken || data?.token || data?.accessToken || data?.data?.UserToken;
        if (token) {
            const assignedDCs = Array.isArray(data?.AssignedDistributionCenter) ? data.AssignedDistributionCenter : [];
            if (assignedDCs[0]?.DCCode) setSelectedDC(assignedDCs[0].DCCode);
            // store full response for later use (for backward compatibility)
            localStorage.setItem('cossim-user', JSON.stringify(data));
            // Use secure storage for authentication data
            secureStorage.setAuthData(data);
            // Also set a cookie for server-side middleware
            document.cookie = `user-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
        }
        return data;
    } catch (error) {
        // Extract meaningful error message
        const message = error.message || 'Login failed. Please check your credentials.';
        throw new Error(message);
    }
};

export const userLogout = async () => {
    try {
        // Call logout API if available
        // await fetch(apiRoutes.auth.logout, {
        //     method: 'POST',
        //     headers: {
        //         'Authorization': `Bearer ${getToken()}`,
        //     },
        // });
    } catch (error) {
        console.error('Logout API error:', error);
    } finally {
        // Clear all authentication data
        secureStorage.clearAuthData();
        localStorage.removeItem('cossim-user');
        document.cookie = 'user-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
};

export const getToken = () => {
    // Try secure storage first
    const secureToken = secureStorage.getToken();
    if (secureToken) {
        return secureToken;
    }

    // Fallback to localStorage for backward compatibility
    try {
        const userData = localStorage.getItem('cossim-user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            return parsedUser?.UserToken || null;
        }
    } catch (error) {
        console.error('Error getting token:', error);
    }
    return null;
};

export const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
        // Decode JWT payload to check expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 > Date.now();
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
};


export const getUserData = () => {
    try {
        const userData = localStorage.getItem('cossim-user');
        if (userData) {
            return JSON.parse(userData);
        }
    } catch (error) {
        console.error('Error getting user data:', error);
    }
    return null;
};

export const updateUser = async (payload) => {
    try {
        const response = await authAPI.updateUser(payload);
        const data = response.data;

        // Update user data in localStorage if update is successful
        const currentUser = getUserData();
        if (currentUser && data) {
            const updatedUser = { ...currentUser, ...data };
            localStorage.setItem('cossim-user', JSON.stringify(updatedUser));
            // Update secure storage as well
            secureStorage.setAuthData(updatedUser);
        }

        return data;
    } catch (error) {
        const message = error.message || 'Failed to update user profile.';
        throw new Error(message);
    }
};

export const requestPasscode = async (payload) => {
    try {
        const response = await authAPI.requestPasscode(payload);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to request passcode.';
        throw new Error(message);
    }
};

export const confirmResetPassword = async (payload) => {
    try {
        const response = await authAPI.confirmResetPassword(payload);
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to reset password.';
        throw new Error(message);
    }
};

// Export all auth service functions
const authService = {
    userLogin,
    userLogout,
    getToken,
    isTokenValid,
    getUserData,
    updateUser,
    requestPasscode,
    confirmResetPassword,
};

export default authService;
