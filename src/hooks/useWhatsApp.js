/**
 * Custom hook for WhatsApp webhook operations
 */

import { useState, useCallback } from 'react';
import { getWebhooks, createWebhook, getWebhook } from '@/services/whatsappService';
import toast from 'react-hot-toast';

export const useWhatsApp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [webhooks, setWebhooks] = useState([]);
  const [webhook, setWebhook] = useState(null);

  // Get webhooks
  const fetchWebhooks = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getWebhooks(params);
      setWebhooks(response);
      
      return response;
    } catch (error) {
      const message = error.message || 'Failed to fetch WhatsApp webhooks';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create webhook
  const handleCreateWebhook = useCallback(async (webhookData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await createWebhook(webhookData);
      toast.success('WhatsApp webhook created successfully');
      
      // Refresh webhooks list
      await fetchWebhooks();
      
      return response;
    } catch (error) {
      const message = error.message || 'Failed to create WhatsApp webhook';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchWebhooks]);

  // Get single webhook
  const fetchWebhook = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getWebhook(params);
      setWebhook(response);
      
      return response;
    } catch (error) {
      const message = error.message || 'Failed to fetch WhatsApp webhook';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify webhook (for GET requests with hub parameters)
  const verifyWebhook = useCallback(async (verificationParams) => {
    try {
      setLoading(true);
      setError(null);
      
      // This typically handles the verification challenge from WhatsApp
      const response = await getWebhook(verificationParams);
      
      return response;
    } catch (error) {
      const message = error.message || 'Failed to verify WhatsApp webhook';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setWebhooks([]);
    setWebhook(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    // State
    loading,
    error,
    webhooks,
    webhook,
    
    // Actions
    fetchWebhooks,
    handleCreateWebhook,
    fetchWebhook,
    verifyWebhook,
    clearError,
    reset,
  };
};

export default useWhatsApp;
