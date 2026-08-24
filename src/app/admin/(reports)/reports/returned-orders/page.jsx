import DeliveredOrdersTableReport from "@/components/reports/DeliveredOrdersTableReport";

export default function ReturnedOrdersReportPage() {
  return <DeliveredOrdersTableReport title="Returned Orders" description="Orders returned to the vendor or declined" taskType="reversed" emptyTitle="No returned orders found" />;
}
