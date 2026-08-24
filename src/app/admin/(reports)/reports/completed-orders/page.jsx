import DeliveredOrdersTableReport from "@/components/reports/DeliveredOrdersTableReport";

export default function CompletedOrdersReportPage() {
  return <DeliveredOrdersTableReport title="Completed Orders" description="Orders with payment received" taskType="completed" statusIDs="802" emptyTitle="No completed orders found" />;
}
