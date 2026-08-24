import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getVendorStores, createVendorStore, updateVendorStore, deactivateVendorStore } from '../services/vendorService';
import { useAuth } from '@/contexts/AuthContext';

export const useVendorStoresForVendor = (params = {}) => {
    const [vendorStores, setVendorStores] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const paramsRef = useRef(params);
    const { user } = useAuth();

    // Get vendor code from user context
    const vendorCode = useMemo(() => {
        return user?.AssignedVendor?.VendorCode || user?.UserCode || '';
    }, [user]);

    useEffect(() => {
        paramsRef.current = params;
    }, [params]);

    const fetchVendorStores = useCallback(async (newParams = {}) => {
        if (!vendorCode) {
            console.warn('No vendor code available');
            return;
        }

        setLoading(true);
        try {
            const currentParams = {
                ...paramsRef.current,
                ...newParams,
                vendorCode, // Always use the current vendor's code
            };

            const data = await getVendorStores(currentParams);
            setVendorStores(data.Data || []);
            setTotalCount(data.TotalCount || 0);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [vendorCode]);

    const handleCreateVendorStore = async (payload) => {
        try {
            const storePayload = { ...payload, vendorCode };
            await createVendorStore(storePayload);
            fetchVendorStores();
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const handleUpdateVendorStore = async (payload) => {
        try {
            await updateVendorStore(payload);
            fetchVendorStores();
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const handleDeactivateVendorStore = async (payload) => {
        try {
            await deactivateVendorStore(payload);
            fetchVendorStores();
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    return {
        vendorStores,
        totalCount,
        loading,
        error,
        vendorCode,
        fetchVendorStores,
        createVendorStore: handleCreateVendorStore,
        updateVendorStore: handleUpdateVendorStore,
        deactivateVendorStore: handleDeactivateVendorStore,
    };
};

export default useVendorStoresForVendor;
