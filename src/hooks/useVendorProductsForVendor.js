import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getVendorProducts, createVendorProduct, updateVendorProduct, deactivateVendorProduct } from '../services/vendorService';
import { useAuth } from '@/contexts/AuthContext';

export const useVendorProductsForVendor = (params = {}) => {
    const [vendorProducts, setVendorProducts] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const paramsRef = useRef(params);
    const { user } = useAuth();

    // Get vendor code from user context
    const vendorCode = useMemo(() => {
        return user?.AssignedVendor?.VendorCode || user?.UserCode || "";
    }, [user]);

    // Update ref when params change
    useEffect(() => {
        paramsRef.current = params;
    }, [params]);

    const fetchVendorProducts = useCallback(async (newParams = {}) => {
        if (!vendorCode) {
            console.warn('No vendor code available');
            return;
        }

        setLoading(true);
        try {
            // Merge current params with new params and ensure vendorCode is included
            const currentParams = {
                ...paramsRef.current,
                ...newParams,
                vendorCode: vendorCode // Always use the current vendor's code
            };

            const data = await getVendorProducts(currentParams);
            setVendorProducts(data.Data || []);
            setTotalCount(data.TotalCount || 0);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [vendorCode]); // Add vendorCode as dependency

    const handleCreateVendorProduct = async (payload) => {
        try {
            // Ensure vendorCode is included in the payload
            const productPayload = {
                ...payload,
                vendorCode: vendorCode
            };

            await createVendorProduct(productPayload);
            fetchVendorProducts(); // Refresh the list after creation
        } catch (err) {
            setError(err.message);
            throw err; // Re-throw to let the component handle it
        }
    };

    const handleUpdateVendorProduct = async (payload, id) => {
        try {
            await updateVendorProduct(payload, id);
            fetchVendorProducts(); // Refresh the list after update
        } catch (err) {
            setError(err.message);
            throw err; // Re-throw to let the component handle it
        }
    };

    const handleDeactivateVendorProduct = async (payload) => {
        try {
            await deactivateVendorProduct(payload);
            fetchVendorProducts(); // Refresh the list after deactivation
        } catch (err) {
            setError(err.message);
            throw err; // Re-throw to let the component handle it
        }
    };

    return {
        vendorProducts,
        totalCount,
        loading,
        error,
        vendorCode,
        fetchVendorProducts,
        createVendorProduct: handleCreateVendorProduct,
        updateVendorProduct: handleUpdateVendorProduct,
        deactivateVendorProduct: handleDeactivateVendorProduct,
    };
};
