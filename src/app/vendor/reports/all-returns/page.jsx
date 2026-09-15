import DeliveredOrdersTableReport from "@/components/reports/DeliveredOrdersTableReport";

export default function VendorReturnsPage() {
  return <DeliveredOrdersTableReport title="All Returns" description="Your pending, accepted, and declined returns" taskType="returned" statusIDs="403,901,902" emptyTitle="No returns found" returnActions />;
}
