import DeliveredOrdersTableReport from "@/components/reports/DeliveredOrdersTableReport";

export default function VendorReturnsPage() {
  return <DeliveredOrdersTableReport title="All Returns" description="Your returned orders awaiting acceptance" taskType="reversed" statusIDs="402" emptyTitle="No pending returns found" returnActions />;
}
