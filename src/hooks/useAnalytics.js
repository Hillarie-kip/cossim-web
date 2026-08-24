import { useCallback, useState } from "react";
import {
  getShipmentOrderAnalytics,
  getShipmentTrackingAnalytics,
} from "@/services/analyticsService";

const getErrorMessage = (error, fallback) => {
  const message = error?.message || fallback;
  return message.replace(/^API Error:\s*/i, "");
};

export const useAnalytics = () => {
  const [shipmentOrderAnalytics, setShipmentOrderAnalytics] = useState(null);
  const [shipmentTrackingAnalytics, setShipmentTrackingAnalytics] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [trackingError, setTrackingError] = useState(null);

  const fetchShipmentOrderAnalytics = useCallback(async (params = {}) => {
    setOrderLoading(true);
    setOrderError(null);

    try {
      const data = await getShipmentOrderAnalytics(params);
      setShipmentOrderAnalytics(data);
      return data;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Failed to retrieve shipment order analytics."
      );
      setOrderError(message);
      throw error;
    } finally {
      setOrderLoading(false);
    }
  }, []);

  const fetchShipmentTrackingAnalytics = useCallback(async (params = {}) => {
    setTrackingLoading(true);
    setTrackingError(null);

    try {
      const data = await getShipmentTrackingAnalytics(params);
      setShipmentTrackingAnalytics(data);
      return data;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Failed to retrieve shipment tracking analytics."
      );
      setTrackingError(message);
      throw error;
    } finally {
      setTrackingLoading(false);
    }
  }, []);

  return {
    shipmentOrderAnalytics,
    shipmentTrackingAnalytics,
    orderLoading,
    trackingLoading,
    orderError,
    trackingError,
    fetchShipmentOrderAnalytics,
    fetchShipmentTrackingAnalytics,
    clearShipmentOrderAnalytics: () => setShipmentOrderAnalytics(null),
    clearOrderError: () => setOrderError(null),
    clearTrackingError: () => setTrackingError(null),
  };
};

export default useAnalytics;
