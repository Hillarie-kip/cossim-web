import { api } from "@/lib/apiClient";
import apiRoutes from "@/constants/apis";

const buildAnalyticsUrl = (baseUrl, params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });

  return `${baseUrl}${query.size ? `?${query.toString()}` : ""}`;
};

const unwrapAnalyticsResponse = (response, fallbackMessage) => {
  if (response?.Error === true || response?.error === true) {
    throw new Error(
      response?.Message ?? response?.message ??
      response?.ErrorMessage ?? response?.errorMessage ?? fallbackMessage
    );
  }

  const responseCode = response?.ResponseCode ?? response?.responseCode;
  const message =
    response?.ResponseMessage ?? response?.responseMessage ?? fallbackMessage;

  if (responseCode !== undefined && Number(responseCode) !== 1) {
    throw new Error(
      response?.ErrorMessage ?? response?.errorMessage ?? message
    );
  }

  return response?.ResponseData ?? response?.responseData ?? {};
};

export const getShipmentOrderAnalytics = async (params = {}) => {
  const url = buildAnalyticsUrl(apiRoutes.analytics.shipmentOrders, params);
  const response = await api.get(url);
  return unwrapAnalyticsResponse(
    response.data,
    "Failed to retrieve shipment order analytics."
  );
};

export const getShipmentTrackingAnalytics = async (params = {}) => {
  const url = buildAnalyticsUrl(apiRoutes.analytics.shipmentTracking, params);
  const response = await api.get(url);
  return unwrapAnalyticsResponse(
    response.data,
    "Failed to retrieve shipment tracking analytics."
  );
};

const analyticsService = {
  getShipmentOrderAnalytics,
  getShipmentTrackingAnalytics,
};

export default analyticsService;
