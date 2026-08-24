import DeliveredOrdersTableReport from "@/components/reports/DeliveredOrdersTableReport";

export default function ConsolidatedOrdersReportPage() {
  return <DeliveredOrdersTableReport title="Consolidated Orders" description="Express, next-day, and same-day consolidated orders" taskType="consolidated" emptyTitle="No consolidated orders found" />;
}
