import { useState, useEffect, useCallback, useRef } from 'react';
import { getVendorSummary } from '../services/vendorService';

export const useVendorSummary = (params = {}) => {
    const [summary, setSummary] = useState([]);
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

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getVendorSummary(paramsRef.current);
            if (data && !data.Error) {
                setSummary(data.Data || []);
                setTotalCount(data.TotalCount || 0);
                setMetadata({
                    pageNo: data.PageNO || 1,
                    pageSize: data.PageSize || 100,
                    totalPages: data.TotalPages || 0
                });
                setError(null);
            } else {
                setError(data?.Message || 'Failed to fetch vendor summary');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const paramsStringified = JSON.stringify(params);
    useEffect(() => {
        fetchSummary();
    }, [paramsStringified, fetchSummary]);

    return {
        summary,
        totalCount,
        metadata,
        loading,
        error,
        fetchSummary
    };
};
