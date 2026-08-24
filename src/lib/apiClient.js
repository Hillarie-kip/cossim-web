/**
 * API Client utility with automatic token handling
 * Provides a centralized way to make API calls with authentication
 */

import { getToken } from '@/services/authService'
import apiRoutes from '@/constants/apis'
import {
  createApiCacheKey,
  getCachedApiResponse,
  restoreCachedResponse,
  setCachedApiResponse,
} from '@/lib/indexedDbApiCache'

const inFlightGetRequests = new Map()

/**
 * Custom fetch wrapper that automatically includes auth headers
 */
export const apiClient = async (url, options = {}) => {
  const token = getToken()

  // Get vendor category from local storage if not provided in options
  let finalUrl = url;
  if (typeof window !== 'undefined') {
    const selectedCategory = localStorage.getItem('selected-vendor-category');
    const userDataStr = localStorage.getItem('cossim-user');
    let isAdmin = false;

    try {
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        isAdmin = userData?.AssignedRoles?.some(role =>
          role.RoleTypeCode === 'R-001'
        );
      }
    } catch (e) {
      console.warn('Failed to parse user data for admin check', e);
    }

    if (isAdmin && selectedCategory !== null) {
      const urlObj = new URL(url.startsWith('http') ? url : window.location.origin + url);

      // Only append if the user is currently on an admin dashboard route
      const isAdminRoute = window.location.pathname.startsWith('/admin/');

      // List of endpoints to exclude from category code injection
      const excludedEndpoints = [
        apiRoutes.vendors.getCategories
      ];

      const isExcluded = excludedEndpoints.some(endpoint => {
        // Handle both relative paths and absolute URLs from apiRoutes
        const endpointPath = endpoint.startsWith('http') ? new URL(endpoint).pathname : endpoint;
        return urlObj.pathname.includes(endpointPath);
      });

      if (isAdminRoute && !isExcluded && !urlObj.searchParams.has('vendorCategoryCode')) {
        if (selectedCategory !== '') {
          urlObj.searchParams.append('vendorCategoryCode', selectedCategory);
          finalUrl = url.startsWith('http') ? urlObj.toString() : urlObj.pathname + urlObj.search + urlObj.hash;
        } else if (urlObj.pathname.toLowerCase().includes('getadmindashboard')) {
          urlObj.searchParams.append('vendorCategoryCode', "''");
          finalUrl = url.startsWith('http') ? urlObj.toString() : urlObj.pathname + urlObj.search + urlObj.hash;
        }
      }
    }
  }

  // Prepare default headers
  const defaultHeaders = {
    'accept': '*/*',
    'Content-Type': 'application/json',
    "X-API-Key": "b2179099-9e2d-498c-ab5f-68d5af1ce781",

  }

  // Add auth token if available
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  // Merge with provided headers
  const headers = {
    ...defaultHeaders,
    ...options.headers,
  }

  const {
    indexedDBCache = true,
    backgroundRefresh = true,
    forceRefresh = false,
    onBackgroundRefresh,
    ...fetchOptions
  } = options

  // Prepare the request configuration
  const config = {
    ...fetchOptions,
    headers,
  }

  // If body is FormData, delete Content-Type so browser can set it with boundary automatically
  if (config.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const method = String(config.method || 'GET').toUpperCase()
  const shouldCache = method === 'GET' && indexedDBCache && options.responseType !== 'blob'
  const cacheKey = shouldCache ? createApiCacheKey(finalUrl, token || '') : null

  const fetchFromNetwork = async () => {
    const response = await fetch(finalUrl, config)

    // Handle different response types
    const contentType = response.headers.get('content-type')
    let data

    if (options.responseType === 'blob') {
      data = await response.blob()
    } else if (contentType && contentType.includes('application/json')) {
      const text = await response.text()
      try {
        data = text ? JSON.parse(text) : {}
      } catch (err) {
        console.warn('Failed to parse JSON response:', err)
        data = { raw: text }
      }
    } else {
      data = await response.text()
    }

    // Handle errors
    if (!response.ok) {
      const errorMessage =
        data?.message ||
        data?.Message ||
        data?.responseMessage ||
        data?.ResponseMessage ||
        data?.errorMessage ||
        data?.ErrorMessage ||
        data?.error ||
        (typeof data === 'string' ? data : null) ||
        'Request failed'
      throw new Error(`API Error: ${errorMessage}`)
    }

    const result = {
      data,
      status: response.status,
      headers: response.headers,
    }

    if (shouldCache) await setCachedApiResponse(cacheKey, result)
    return result
  }

  const getNetworkResponse = () => {
    if (!shouldCache) return fetchFromNetwork()
    if (inFlightGetRequests.has(cacheKey)) return inFlightGetRequests.get(cacheKey)

    const request = fetchFromNetwork().finally(() => inFlightGetRequests.delete(cacheKey))
    inFlightGetRequests.set(cacheKey, request)
    return request
  }

  try {
    if (shouldCache && !forceRefresh) {
      const cached = await getCachedApiResponse(cacheKey)
      if (cached) {
        if (backgroundRefresh && typeof navigator !== 'undefined' && navigator.onLine) {
          void getNetworkResponse()
            .then((response) => onBackgroundRefresh?.(response))
            .catch((error) => {
              console.warn('Background API refresh failed:', error?.message || error)
            })
        }
        return restoreCachedResponse(cached)
      }
    }

    return await getNetworkResponse()
  } catch (error) {
    const normalizedError = error instanceof Error
      ? error
      : new Error(error?.message || error?.target?.error?.message || 'Network request failed')

    if (shouldCache) {
      const cached = await getCachedApiResponse(cacheKey)
      if (cached) return restoreCachedResponse(cached)
    }

    // Callers decide how a failed request should be presented. Logging a caught
    // network failure with console.error makes Next.js show its error overlay.
    console.warn('API Client request failed:', normalizedError.message)
    throw normalizedError
  }
}

/**
 * HTTP method shortcuts
 */
export const api = {
  get: (url, options = {}) => apiClient(url, { ...options, method: 'GET' }),

  post: (url, data, options = {}) => apiClient(url, {
    ...options,
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),

  put: (url, data, options = {}) => apiClient(url, {
    ...options,
    method: 'PUT',
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),

  patch: (url, data, options = {}) => apiClient(url, {
    ...options,
    method: 'PATCH',
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),

  delete: (url, options = {}) => apiClient(url, { ...options, method: 'DELETE' }),
}

/**
 * Service-specific API calls
 */
export const authAPI = {
  login: (credentials) => api.post(apiRoutes.auth.login, credentials),
  requestPasscode: (data) => api.post(apiRoutes.auth.requestPasscode, data),
  confirmResetPassword: (data) => api.post(apiRoutes.auth.confirmResetPassword, data),
  updateUser: (data) => api.post(apiRoutes.auth.updateUser, data),
}

export const dashboardAPI = {
  getAdminDashboard: (params) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('StartDate', params.startDate);
    if (params?.endDate) queryParams.append('EndDate', params.endDate);
    if (params?.topShipments) queryParams.append('topShipments', params.topShipments);
    if (params?.topCOD) queryParams.append('topCOD', params.topCOD);
    if (params?.onlyDelivered !== undefined) queryParams.append('onlyDelivered', params.onlyDelivered);

    const url = `${apiRoutes.dashboard.admin}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get(url);
  },
}

export const agentAPI = {
  getVendorAgents: (params) => {
    const queryParams = new URLSearchParams();
    if (params?.pageNo) queryParams.append('PageNO', params.pageNo);
    if (params?.pageSize) queryParams.append('PageSize', params.pageSize);
    if (params?.searchTerm) queryParams.append('SearchTerm', params.searchTerm);

    const url = `${apiRoutes.agent.getVendorAgent}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get(url);
  },
}

export const distributionCenterAPI = {
  getDistributionCenters: (params) => {
    const queryParams = new URLSearchParams();
    if (params?.pageNo) queryParams.append('PageNO', params.pageNo);
    if (params?.pageSize) queryParams.append('PageSize', params.pageSize);
    if (params?.searchTerm) queryParams.append('SearchTerm', params.searchTerm);

    const url = `${apiRoutes.distributionCenters.list}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get(url);
  },
  createDistributionCenter: (data) => api.post(apiRoutes.distributionCenters.create, data),
  updateDistributionCenter: (data) => api.post(apiRoutes.distributionCenters.update, data),
  assignUser: (data) => api.post(apiRoutes.distributionCenters.assignUser, data),
  getDCAssignedUsers: (params) => {
    const queryParams = new URLSearchParams();
    if (params?.dcCode) queryParams.append('dcCode', params.dcCode);
    if (params?.pageNo) queryParams.append('PageNO', params.pageNo);
    if (params?.pageSize) queryParams.append('PageSize', params.pageSize);
    if (params?.searchTerm) queryParams.append('SearchTerm', params.searchTerm);

    const url = `${apiRoutes.distributionCenters.assignedUsers}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get(url);
  },
  deactivateAssignedUser: (data) => api.post(apiRoutes.distributionCenters.deactivateAssignedUser, data),
}

export const vendorAPI = {
  getVendors: (params) => {
    const queryParams = new URLSearchParams();
    if (params?.pageNo) queryParams.append('PageNO', params.pageNo);
    if (params?.pageSize) queryParams.append('PageSize', params.pageSize);
    if (params?.searchTerm) queryParams.append('SearchTerm', params.searchTerm);

    const url = `${apiRoutes.vendors.list}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get(url);
  },
  createVendor: (data) => api.post(apiRoutes.vendors.create, data),
  updateVendor: (data) => api.post(apiRoutes.vendors.update, data),
  deactivateVendor: (data) => api.post(apiRoutes.vendors.deactivate, data),
}

export const shipmentAPI = {
  getDeliveryTypes: () => api.get(apiRoutes.shipment.deliveryType),
}

export const whatsappAPI = {
  getWebhooks: (params) => {
    const queryParams = new URLSearchParams();
    Object.keys(params || {}).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });

    const url = `${apiRoutes.whatsapp.webhooks}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get(url);
  },
  createWebhook: (data) => api.post(apiRoutes.whatsapp.webhooks, data),
  getWebhook: (params) => {
    const queryParams = new URLSearchParams();
    Object.keys(params || {}).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });

    const url = `${apiRoutes.whatsapp.webhook}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get(url);
  },
}

export const accountAPI = {
  confirmPayment: (params) => {
    const queryParams = new URLSearchParams();
    if (params?.transID) queryParams.append('TransID', params.transID);
    if (params?.totalOrderAmount) queryParams.append('TotalOrderAmount', params.totalOrderAmount);

    const url = `${apiRoutes.account.confirmPayment}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.post(url);
  },
  completeServicePayment: (data) => api.post(apiRoutes.account.completeServicePayment, data),
  requestSTKPush: (data) => api.post(apiRoutes.account.requestSTKPush, data),
  stkResults: () => api.post(apiRoutes.account.STKResults),
  checkStkPush: (params) => {
    const queryParams = new URLSearchParams();
    if (params?.checkoutRequestID) queryParams.append('CheckoutRequestID', params.checkoutRequestID);

    const url = `${apiRoutes.account.checkStkPush}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.post(url);
  },
}

export default api
