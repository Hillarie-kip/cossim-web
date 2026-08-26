import DeliveredOrdersTableReport from "@/components/reports/DeliveredOrdersTableReport";

export default function AllReturnsPage() {
  return <DeliveredOrdersTableReport title="All Returns" description="Returned orders awaiting acceptance or decline" taskType="reversed" statusIDs="402" emptyTitle="No pending returns found" returnActions />;
}
