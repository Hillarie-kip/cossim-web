import DeliveredOrdersTableReport from "@/components/reports/DeliveredOrdersTableReport";

export default function ReturnedOrdersReportPage() {
  return <DeliveredOrdersTableReport title="Returned Orders" description="Pending, accepted, and declined returns" taskType="returned" statusIDs="403,901,902" emptyTitle="No returned orders found" returnActions />;
}
