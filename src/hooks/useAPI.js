/**
 * Custom hook for making API calls with automatic authentication and error handling
 */

import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/apiClient'
import { toast } from 'react-hot-toast'

export const useAPI = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { logout } = useAuth()

  const handleRequest = useCallback(async (requestFn, options = {}) => {
    const { 
      showLoading = true, 
      showError = true, 
      showSuccess = false,
      successMessage = 'Operation completed successfully',
      onSuccess,
      onError 
    } = options

    try {
      if (showLoading) setLoading(true)
      setError(null)

      const response = await requestFn()
      
      if (showSuccess) {
        toast.success(successMessage)
      }
      
      if (onSuccess) {
        onSuccess(response.data)
      }
      
      return response.data
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred'
      setError(errorMessage)
      
      // Handle authentication errors
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        toast.error('Session expired. Please log in again.')
        logout()
        return
      }
      
      if (showError) {
        toast.error(errorMessage)
      }
      
      if (onError) {
        onError(err)
      }
      
      throw err
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [logout])

  // Convenience methods for different HTTP verbs
  const get = useCallback((url, options = {}) => {
    return handleRequest(() => api.get(url), options)
  }, [handleRequest])

  const post = useCallback((url, data, options = {}) => {
    return handleRequest(() => api.post(url, data), options)
  }, [handleRequest])

  const put = useCallback((url, data, options = {}) => {
    return handleRequest(() => api.put(url, data), options)
  }, [handleRequest])

  const patch = useCallback((url, data, options = {}) => {
    return handleRequest(() => api.patch(url, data), options)
  }, [handleRequest])

  const del = useCallback((url, options = {}) => {
    return handleRequest(() => api.delete(url), options)
  }, [handleRequest])

  return {
    loading,
    error,
    get,
    post,
    put,
    patch,
    delete: del,
    request: handleRequest
  }
}

export default useAPI
