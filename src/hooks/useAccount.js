import { useState } from 'react';
import {
    confirmPayment,
    completeServicePayment,
    requestSTKPush,
    getSTKResults,
    checkStkPush,
    postMpesaOrder
} from '../services/accountService';

export const useAccount = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleConfirmPayment = async (params) => {
        setLoading(true);
        setError(null);
        try {
            const data = await confirmPayment(params);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteServicePayment = async (payload) => {
        setLoading(true);
        setError(null);
        try {
            const data = await completeServicePayment(payload);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleRequestSTKPush = async (payload) => {
        setLoading(true);
        setError(null);
        try {
            const data = await requestSTKPush(payload);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleGetSTKResults = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getSTKResults();
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleCheckStkPush = async (params) => {
        setLoading(true);
        setError(null);
        try {
            const data = await checkStkPush(params);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handlePostMpesaOrder = async (payload) => {
        setLoading(true);
        setError(null);
        try {
            const data = await postMpesaOrder(payload);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        confirmPayment: handleConfirmPayment,
        completeServicePayment: handleCompleteServicePayment,
        requestSTKPush: handleRequestSTKPush,
        getSTKResults: handleGetSTKResults,
        checkStkPush: handleCheckStkPush,
        postMpesaOrder: handlePostMpesaOrder,
    };
};
