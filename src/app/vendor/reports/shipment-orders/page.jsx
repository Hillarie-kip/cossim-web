"use client";

import { AnalyticsLoadingState } from "@/components/reports/AnalyticsReportUI";
import { ShipmentOrderReport } from "@/components/reports/ShipmentOrderReport";
import { useShipment } from "@/hooks/useShipment";

const VendorShipmentOrderReportPage = () => {
  const { vendorCode } = useShipment();

  if (!vendorCode) {
    return <div className="analytics-report-page"><AnalyticsLoadingState /></div>;
  }

  return (
    <ShipmentOrderReport
      scope="vendor"
      scopeCode={vendorCode}
      reportBasePath="/vendor/reports"
      packageListPath="/vendor/vendor-packages"
    />
  );
};

export default VendorShipmentOrderReportPage;
