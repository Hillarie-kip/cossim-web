import { useState, useEffect, useCallback, useRef } from 'react';
import { getVendorStores, createVendorStore, updateVendorStore, deactivateVendorStore } from '../services/vendorService';

export const useVendorStores = (params = {}) => {
    const [vendorStores, setVendorStores] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const paramsRef = useRef(params);

    // Update ref when params change
    useEffect(() => {
        paramsRef.current = params;
    }, [params]);

    const fetchVendorStores = useCallback(async (newParams = {}) => {
        setLoading(true);
        try {
            // Merge current params with new params
            const currentParams = { ...paramsRef.current, ...newParams };
            const data = await getVendorStores(currentParams);
            setVendorStores(data.Data || []);
            setTotalCount(data.TotalCount || 0);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleCreateVendorStore = async (payload) => {
        try {
            await createVendorStore(payload);
            fetchVendorStores(); // Refresh the list after creation
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const handleUpdateVendorStore = async (payload) => {
        try {
            await updateVendorStore(payload);
            fetchVendorStores(); // Refresh the list after update
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const handleDeactivateVendorStore = async (payload) => {
        try {
            await deactivateVendorStore(payload);
            fetchVendorStores(); // Refresh the list after deactivation
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
        fetchVendorStores,
        createVendorStore: handleCreateVendorStore,
        updateVendorStore: handleUpdateVendorStore,
        deactivateVendorStore: handleDeactivateVendorStore,
    };
};

export default useVendorStores;
