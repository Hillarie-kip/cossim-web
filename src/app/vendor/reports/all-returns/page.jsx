import DeliveredOrdersTableReport from "@/components/reports/DeliveredOrdersTableReport";

export default function VendorReturnsPage() {
  return <DeliveredOrdersTableReport title="All Returns" description="Your returned orders awaiting acceptance" taskType="returned" statusIDs="403" emptyTitle="No pending returns found" returnActions />;
}
