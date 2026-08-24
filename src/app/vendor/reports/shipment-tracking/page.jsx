"use client";

import { AnalyticsLoadingState } from "@/components/reports/AnalyticsReportUI";
import { ShipmentTrackingReport } from "@/components/reports/ShipmentTrackingReport";
import { useShipment } from "@/hooks/useShipment";

const VendorShipmentTrackingReportPage = () => {
  const { vendorCode } = useShipment();

  if (!vendorCode) {
    return <div className="analytics-report-page"><AnalyticsLoadingState /></div>;
  }

  return (
    <ShipmentTrackingReport
      scope="vendor"
      scopeCode={vendorCode}
      reportBasePath="/vendor/reports"
      packageListPath="/vendor/vendor-packages"
    />
  );
};

export default VendorShipmentTrackingReportPage;
