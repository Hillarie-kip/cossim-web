import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAgentDashboard } from '@/services/dashboardService';

export const useAgentDashboard = (params = {}) => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Memoize params to prevent unnecessary re-renders
    const paramsKey = JSON.stringify(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const memoizedParams = useMemo(() => params, [paramsKey]);

    const fetchDashboardData = useCallback(async (customParams = {}) => {
        try {
            setLoading(true);
            setError(null);

            const response = await getAgentDashboard({ ...memoizedParams, ...customParams });

            if (response.Error) {
                throw new Error(response.Message || 'Failed to fetch dashboard data');
            }

            setDashboardData(response.Data);
        } catch (err) {
            setError(err.message);
            console.error('Agent Dashboard Error:', err);
        } finally {
            setLoading(false);
        }
    }, [memoizedParams]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const refreshData = () => {
        fetchDashboardData();
    };

    return {
        dashboardData,
        loading,
        error,
        refreshData,
        fetchDashboardData
    };
};

export default useAgentDashboard;
