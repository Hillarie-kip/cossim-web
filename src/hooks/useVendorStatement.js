import { useState, useEffect, useCallback, useRef } from 'react';
import { getVendorStatement } from '../services/vendorService';

export const useVendorStatement = (params = {}) => {
    const [statements, setStatements] = useState([]);
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

    const fetchStatements = useCallback(async () => {
        if (!paramsRef.current.VendorCode) return;
        
        setLoading(true);
        try {
            const data = await getVendorStatement(paramsRef.current);
            if (data && !data.Error) {
                setStatements(data.Data || []);
                setTotalCount(data.TotalCount || 0);
                setMetadata({
                    pageNo: data.PageNO || 1,
                    pageSize: data.PageSize || 100,
                    totalPages: data.TotalPages || 0
                });
                setError(null);
            } else {
                setError(data?.Message || 'Failed to fetch vendor statement');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const paramsStringified = JSON.stringify(params);
    useEffect(() => {
        fetchStatements();
    }, [paramsStringified, fetchStatements]);

    return {
        statements,
        totalCount,
        metadata,
        loading,
        error,
        fetchStatements
    };
};
