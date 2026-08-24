import DeliveredOrdersTableReport from "@/components/reports/DeliveredOrdersTableReport";

export default function AcceptedReturnsReportPage() {
  return <DeliveredOrdersTableReport title="Accepted Returns" description="Return orders that have been accepted" taskType="completed" statusIDs="901" emptyTitle="No accepted returns found" />;
}
