import { api } from "@/lib/apiClient";
import apiRoutes from "@/constants/apis";


export const getDCAssignedUsers = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add optional parameters
        if (params.dcCode) queryParams.append('dcCode', params.dcCode);
        if (params.pageNo) queryParams.append('PageNO', params.pageNo);
        if (params.pageSize) queryParams.append('PageSize', params.pageSize);
        if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);

        const url = `${apiRoutes.distributionCenters.assignedUsers}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);
        
        return response.data;
    } catch (error) {
        const message = error.message || 'Failed to fetch assigned users.';
        throw new Error(message);
    }
};

// Export all distribution center service functions
const distributionCenterService = {
    getDCAssignedUsers
};

export default distributionCenterService;
