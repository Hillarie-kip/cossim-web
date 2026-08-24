"use client";

import { AnalyticsLoadingState } from "@/components/reports/AnalyticsReportUI";
import { ShipmentOrderReport } from "@/components/reports/ShipmentOrderReport";
import { useShipment } from "@/hooks/useShipment";
import { useUser } from "@/hooks/useUser";

const VendorOverview = () => {
  const { vendorCode } = useShipment();
  const { user } = useUser();
  const name = [user?.FirstName, user?.LastName].filter(Boolean).join(" ");

  if (!vendorCode) {
    return (
      <div className="analytics-report-page">
        <AnalyticsLoadingState />
      </div>
    );
  }

  return (
    <ShipmentOrderReport
      scope="vendor"
      scopeCode={vendorCode}
      reportBasePath="/vendor/reports"
      packageListPath="/vendor/vendor-packages"
      pageTitle={`Welcome, ${name || "Vendor"}`}
      pageEyebrow="Vendor Overview"
    />
  );
};

export default VendorOverview;
