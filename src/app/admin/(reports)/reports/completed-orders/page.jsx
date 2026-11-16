import DeliveredOrdersTableReport from "@/components/reports/DeliveredOrdersTableReport";

export default function CompletedOrdersReportPage() {
  return <DeliveredOrdersTableReport title="Completed Orders" description="Completed orders, including zero-COD orders and orders paid directly to the vendor" taskType="completed" statusIDs="802" emptyTitle="No completed orders found" />;
}
