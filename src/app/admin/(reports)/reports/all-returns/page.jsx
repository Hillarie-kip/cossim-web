import DeliveredOrdersTableReport from "@/components/reports/DeliveredOrdersTableReport";

export default function AllReturnsPage() {
  return <DeliveredOrdersTableReport title="All Returns" description="Returned orders awaiting acceptance or decline" taskType="returned" statusIDs="403" emptyTitle="No pending returns found" returnActions />;
}
