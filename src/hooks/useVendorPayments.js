import { useState, useEffect, useCallback, useRef } from 'react';
import { getVendorPayments } from '../services/vendorService';

export const useVendorPayments = (params = {}) => {
    const [payments, setPayments] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [metadata, setMetadata] = useState({
        pageNo: 1,
        pageSize: 100,
        totalPages: 0
    });
    
    const paramsRef = useRef(params);

    // Update ref when params change
    useEffect(() => {
        paramsRef.current = params;
    }, [params]);

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            // Mapping from hook params to API expected params
            const apiParams = {
                vendorCode: paramsRef.current.vendorCode,
                startDate: paramsRef.current.startDate,
                endDate: paramsRef.current.endDate,
                searchTerm: paramsRef.current.searchTerm,
                pageNo: paramsRef.current.pageNo,
                pageSize: paramsRef.current.pageSize,
                // Backward compatibility if needed
                VendorCode: paramsRef.current.vendorCode || paramsRef.current.VendorCode,
                PageNO: paramsRef.current.pageNo || paramsRef.current.PageNO,
                PageSize: paramsRef.current.pageSize || paramsRef.current.PageSize
            };

            const data = await getVendorPayments(apiParams);
            if (data && !data.Error) {
                setPayments(data.Data || []);
                setTotalCount(data.TotalCount || 0);
                setMetadata({
                    pageNo: data.PageNO || 1,
                    pageSize: data.PageSize || 100,
                    totalPages: data.TotalPages || 0
                });
                setError(null);
            } else {
                setError(data?.Message || 'Failed to fetch vendor payments');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const paramsStringified = JSON.stringify(params);
    useEffect(() => {
        fetchPayments();
    }, [paramsStringified, fetchPayments]);

    return {
        payments,
        totalCount,
        metadata,
        loading,
        error,
        fetchPayments
    };
};
