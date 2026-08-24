"use client";

import { AnalyticsLoadingState } from "@/components/reports/AnalyticsReportUI";
import { ShipmentOrderReport } from "@/components/reports/ShipmentOrderReport";
import { useShipment } from "@/hooks/useShipment";

const DCShipmentOrderReportPage = () => {
  const { dcCode } = useShipment();

  if (!dcCode) {
    return <div className="content analytics-report-page"><AnalyticsLoadingState /></div>;
  }

  return (
    <ShipmentOrderReport
      scope="dc"
      scopeCode={dcCode}
      reportBasePath="/dc/reports"
      packageListPath="/dc/dc-packages"
    />
  );
};

export default DCShipmentOrderReportPage;
