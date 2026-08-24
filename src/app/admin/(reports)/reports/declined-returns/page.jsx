import DeliveredOrdersTableReport from "@/components/reports/DeliveredOrdersTableReport";

export default function DeclinedReturnsReportPage() {
  return <DeliveredOrdersTableReport title="Declined Returns" description="Return orders that have been declined" taskType="reversed" statusIDs="902" emptyTitle="No declined returns found" />;
}
