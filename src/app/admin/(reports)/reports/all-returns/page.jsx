import DeliveredOrdersTableReport from "@/components/reports/DeliveredOrdersTableReport";

export default function AllReturnsPage() {
  return <DeliveredOrdersTableReport title="All Returns" description="Pending, accepted, and declined returns" taskType="returned" statusIDs="403,901,902" emptyTitle="No returns found" returnActions />;
}
