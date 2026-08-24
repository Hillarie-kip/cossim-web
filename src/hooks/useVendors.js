import { useState, useEffect, useCallback, useRef } from 'react';
import { getVendors, createVendor, updateVendor, deactivateVendor } from '../services/vendorService';

export const useVendors = (params = {}) => {
    const [vendors, setVendors] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const paramsRef = useRef(params);

    // Update ref when params change
    useEffect(() => {
        paramsRef.current = params;
    }, [params]);

    const fetchVendors = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getVendors(paramsRef.current);
            setVendors(data.Data || []);
            setTotalCount(data.TotalCount || 0);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const paramsStringified = JSON.stringify(params);
    useEffect(() => {
        fetchVendors();
    }, [paramsStringified, fetchVendors]);

    const handleCreateVendor = async (payload) => {
        try {
            await createVendor(payload);
            fetchVendors(); // Refresh the list after creation
        } catch (err) {
            setError(err.message);
        }
    };

    const handleUpdateVendor = async (payload) => {
        try {
            await updateVendor(payload);
            fetchVendors(); // Refresh the list after update
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeactivateVendor = async (payload) => {
        try {
            await deactivateVendor(payload);
            fetchVendors(); // Refresh the list after deactivation
        } catch (err) {
            setError(err.message);
        }
    };

    return {
        vendors,
        totalCount,
        loading,
        error,
        fetchVendors,
        createVendor: handleCreateVendor,
        updateVendor: handleUpdateVendor,
        deactivateVendor: handleDeactivateVendor,
    };
};
