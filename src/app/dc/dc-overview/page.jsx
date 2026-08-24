"use client";

import { AnalyticsLoadingState } from "@/components/reports/AnalyticsReportUI";
import { ShipmentOrderReport } from "@/components/reports/ShipmentOrderReport";
import { useShipment } from "@/hooks/useShipment";
import { useUser } from "@/hooks/useUser";

const DCOverview = () => {
  const { dcCode } = useShipment();
  const { user } = useUser();
  const name = [user?.FirstName, user?.LastName].filter(Boolean).join(" ");

  if (!dcCode) {
    return (
      <div className="content analytics-report-page">
        <AnalyticsLoadingState />
      </div>
    );
  }

  return (
    <ShipmentOrderReport
      scope="dc"
      scopeCode={dcCode}
      reportBasePath="/dc/reports"
      packageListPath="/dc/dc-packages"
      pageTitle={`Welcome, ${name || "DC Manager"}`}
      pageEyebrow="DC Overview"
    />
  );
};

export default DCOverview;
