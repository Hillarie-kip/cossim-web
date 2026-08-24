import { api } from "@/lib/apiClient";
import apiRoutes from "@/constants/apis";

/**
 * Agent Service
 * Handles all agent-related API calls
 */

export const getVendorAgents = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add optional parameters
        if (params.pageNo) queryParams.append('PageNO', params.pageNo);
        if (params.pageSize) queryParams.append('PageSize', params.pageSize);
        if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);

        const url = `${apiRoutes.agent.getVendorAgent}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);
        
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch vendor agents.';
        throw new Error(message);
    }
};

// Export all agent service functions
const agentService = {
    getVendorAgents,
};

export default agentService;
