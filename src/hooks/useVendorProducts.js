import { useState, useEffect, useCallback, useRef } from 'react';
import { getVendorProducts, createVendorProduct, updateVendorProduct, deactivateVendorProduct } from '../services/vendorService';

export const useVendorProducts = (params = {}) => {
    const [vendorProducts, setVendorProducts] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const paramsRef = useRef(params);

    // Update ref when params change
    useEffect(() => {
        paramsRef.current = params;
    }, [params]);

    const fetchVendorProducts = useCallback(async (newParams = {}) => {
        setLoading(true);
        try {
            // Merge current params with new params
            const currentParams = { ...paramsRef.current, ...newParams };
            const data = await getVendorProducts(currentParams);
            setVendorProducts(data.Data || []);
            setTotalCount(data.TotalCount || 0);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []); // Add dependencies if needed

    const paramsStringified = JSON.stringify(params);

    const handleCreateVendorProduct = async (payload) => {
        try {
            await createVendorProduct(payload);
            fetchVendorProducts(); // Refresh the list after creation
        } catch (err) {
            setError(err.message);
        }
    };

    const handleUpdateVendorProduct = async (payload, id) => {
        try {
            await updateVendorProduct(payload, id);
            fetchVendorProducts(); // Refresh the list after update
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeactivateVendorProduct = async (payload) => {
        try {
            await deactivateVendorProduct(payload);
            fetchVendorProducts(); // Refresh the list after deactivation
        } catch (err) {
            setError(err.message);
        }
    };

    return {
        vendorProducts,
        totalCount,
        loading,
        error,
        fetchVendorProducts,
        createVendorProduct: handleCreateVendorProduct,
        updateVendorProduct: handleUpdateVendorProduct,
        deactivateVendorProduct: handleDeactivateVendorProduct,
    };
};
