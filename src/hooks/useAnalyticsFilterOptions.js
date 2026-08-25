import { useEffect, useMemo } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useShipment } from "@/hooks/useShipment";
import { useVendors } from "@/hooks/useVendors";
import { useAuth } from "@/contexts/AuthContext";
import { filterDistributionCentersToAssigned } from "@/services/dcService";

const firstValue = (item, keys) => {
  for (const key of keys) {
    if (item?.[key] !== undefined && item?.[key] !== null && item?.[key] !== "") {
      return item[key];
    }
  }
  return "";
};

export const useAnalyticsFilterOptions = ({ includeUsers = false } = {}) => {
  const { user } = useAuth();
  const { vendors, loading: vendorsLoading } = useVendors({
    pageNo: 1,
    pageSize: 500,
  });
  const {
    distributionCenters,
    users,
    loading: adminLoading,
    fetchDistributionCenters,
    fetchUsers,
  } = useAdmin();
  const {
    deliveryTypes,
    orderStatuses,
    loading: shipmentLoading,
    fetchShipmentOrderStatus,
  } = useShipment();

  useEffect(() => {
    fetchDistributionCenters({ pageNo: 1, pageSize: 500 }).catch(() => {});
    fetchShipmentOrderStatus({ pageNo: 1, pageSize: 500 }).catch(() => {});
    if (includeUsers) {
      fetchUsers({ pageNo: 1, pageSize: 500 }).catch(() => {});
    }
  }, [
    fetchDistributionCenters,
    fetchShipmentOrderStatus,
    fetchUsers,
    includeUsers,
  ]);

  const vendorOptions = useMemo(
    () =>
      (vendors || [])
        .map((vendor) => {
          const code = firstValue(vendor, ["VendorCode", "vendorCode"]);
          const name = firstValue(vendor, ["VendorName", "vendorName", "Name", "name"]);
          return code
            ? { value: code, label: name ? `${name} (${code})` : code }
            : null;
        })
        .filter(Boolean),
    [vendors]
  );

  const dcOptions = useMemo(
    () =>
      filterDistributionCentersToAssigned(user, distributionCenters)
        .map((dc) => {
          const code = firstValue(dc, ["DCCode", "dcCode"]);
          const name = firstValue(dc, ["DCName", "dcName", "Name", "name"]);
          return code
            ? { value: code, label: name ? `${name} (${code})` : code }
            : null;
        })
        .filter(Boolean),
    [distributionCenters, user]
  );

  const deliveryTypeOptions = useMemo(
    () =>
      (deliveryTypes || [])
        .map((type) => {
          const code = firstValue(type, [
            "DeliveryTypeCode",
            "deliveryTypeCode",
            "Code",
            "code",
          ]);
          const name = firstValue(type, [
            "DeliveryTypeName",
            "deliveryTypeName",
            "Name",
            "name",
          ]);
          return code ? { value: code, label: name || code } : null;
        })
        .filter(Boolean),
    [deliveryTypes]
  );

  const statusOptions = useMemo(
    () =>
      (orderStatuses || [])
        .map((status) => {
          const id = firstValue(status, [
            "OrderStatusID",
            "orderStatusID",
            "StatusID",
            "statusID",
          ]);
          const name = firstValue(status, [
            "StatusName",
            "statusName",
            "Name",
            "name",
          ]);
          return id ? { value: Number(id), label: name || String(id) } : null;
        })
        .filter(Boolean),
    [orderStatuses]
  );

  const userOptions = useMemo(
    () =>
      (users || [])
        .map((user) => {
          const code = firstValue(user, ["UserCode", "userCode"]);
          const name = firstValue(user, [
            "FullName",
            "fullName",
            "UserName",
            "userName",
            "FirstName",
            "firstName",
          ]);
          return code
            ? { value: code, label: name ? `${name} (${code})` : code }
            : null;
        })
        .filter(Boolean),
    [users]
  );

  return {
    vendorOptions,
    dcOptions,
    deliveryTypeOptions,
    statusOptions,
    userOptions,
    optionsLoading: vendorsLoading || adminLoading || shipmentLoading,
  };
};

export default useAnalyticsFilterOptions;
