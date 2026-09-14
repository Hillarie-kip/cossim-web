import DeliveredOrdersTableReport from "@/components/reports/DeliveredOrdersTableReport";
import { PACKAGE_STATUSES } from "@/constants/package_status";

export default function LostItemsReportPage() {
  return <DeliveredOrdersTableReport title="Lost Items" description="All shipment orders marked as lost, including paid and completed orders" taskType="lost" statusIDs={String(PACKAGE_STATUSES.CLOSED_FAILED.orderStatusID)} emptyTitle="No lost items found" />;
}
