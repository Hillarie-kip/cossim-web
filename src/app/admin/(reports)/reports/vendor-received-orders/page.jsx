import DeliveredOrdersTableReport from "@/components/reports/DeliveredOrdersTableReport";

export default function VendorReceivedOrdersReportPage() {
  return (
    <DeliveredOrdersTableReport
      title="Received Orders"
      description="All received orders filtered by date, destination sorting area, and vendor"
      emptyTitle="No received orders found"
      dateOnly
      allowExport
    />
  );
}
