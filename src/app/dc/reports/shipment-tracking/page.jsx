"use client";

import { AnalyticsLoadingState } from "@/components/reports/AnalyticsReportUI";
import { ShipmentTrackingReport } from "@/components/reports/ShipmentTrackingReport";
import { useShipment } from "@/hooks/useShipment";

const DCShipmentTrackingReportPage = () => {
  const { dcCode } = useShipment();

  if (!dcCode) {
    return <div className="content analytics-report-page"><AnalyticsLoadingState /></div>;
  }

  return (
    <ShipmentTrackingReport
      scope="dc"
      scopeCode={dcCode}
      reportBasePath="/dc/reports"
      packageListPath="/dc/dc-packages"
    />
  );
};

export default DCShipmentTrackingReportPage;
