import DeliveredOrdersTableReport from "@/components/reports/DeliveredOrdersTableReport";
import { PACKAGE_STATUSES } from "@/constants/package_status";

export default function LostItemsReportPage() {
  return <DeliveredOrdersTableReport title="Lost Items" description="Shipment orders marked as lost" taskType="lost" statusIDs={String(PACKAGE_STATUSES.CLOSED_FAILED.orderStatusID)} emptyTitle="No lost items found" />;
}
