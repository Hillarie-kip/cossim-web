"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Target } from "feather-icons-react";
import { getDCARReport } from "@/services/analyticsService";
import { useGlobalFilters } from "@/contexts/GlobalFiltersContext";
import { AnalyticsCsvButton, AnalyticsErrorState,
  AnalyticsLoadingState, AnalyticsMetricCard, AnalyticsReportHeader, AnalyticsSection,
  AnalyticsTable } from "@/components/reports/AnalyticsReportUI";
import { downloadReportCsv, formatReportNumber,
  readAnalyticsValue as read } from "@/utils/analyticsReportUtils";
import "@/style/css/analytics-reports.css";

const categories = [
  { key: "dispatch", label: "Dispatch KPI", measures: [
    { key: "AwaitingKCS", label: "Awaiting receipt at KCS", parts: [["VendorCreated", "Vendor created"], ["ReceivedKCS", "Less received at KCS"]] },
    { key: "AwaitingDC", label: "Awaiting receipt at DC", parts: [["DispatchedDC", "Dispatched to DC"], ["ReceivedDC", "Less received at DC"]] },
  ] },
  { key: "cx", label: "CX KPI", measures: [
    { key: "UndeliveredDC", label: "Not delivered at DC", parts: [["ReceivedDC", "Received at DC"], ["DCDelivered", "Less delivered at DC"]] },
    { key: "BelowThree", label: "Below three attempts", parts: [["ReceivedDC", "Received at DC"], ["AttemptedThree", "Less at least 3 attempts"]] },
  ] },
  { key: "reverse", label: "Reverse KPI", measures: [
    { key: "AwaitingReturnKCS", label: "Awaiting return to KCS", parts: [["FailedDC", "Failed at DC"], ["ReturnedKCS", "Less returned to KCS"]] },
    { key: "AwaitingAcceptance", label: "Awaiting vendor acceptance", parts: [["ReturnedKCS", "Received at KCS"], ["AcceptedVendor", "Less accepted by vendor"]] },
  ] },
  { key: "finance", label: "Finance KPI", measures: [
    { key: "Uncompleted", label: "Delivered, not completed", parts: [["Delivered", "Delivered orders"], ["Paid", "Less completed orders"]] },
    { key: "Unrecovered", label: "Unrecovered losses", parts: [["Losses", "Losses"], ["Recovered", "Less recovered"]] },
  ] },
  { key: "pus", label: "PUS KPI", measures: [
    { key: "PUSUndelivered", label: "Not delivered at PUS", parts: [["ReceivedDC", "Received at DC"], ["DCDelivered", "Less delivered at DC"]] },
    { key: "PUSOutstanding", label: "Outstanding at PUS", parts: [["ReceivedDC", "Received at DC"], ["DCDelivered", "Less delivered"], ["DCReturned", "Less returned"]] },
  ] },
];
const metricFields = [...new Set(categories.flatMap(category => category.measures.flatMap(measure => measure.parts.map(([key]) => key))))];
const balance = (row, measure) => measure.parts.reduce((total, [key], index) => total + (index ? -1 : 1) * Number(row[key] || 0), 0);
const normalizeRow = (row) => Object.fromEntries(["DCCode", "DCName", "HandedOver", "Delivered", "Paid",
  "ReturnedFailed", "SuccessRate", "AverageHours", "TimedDeliveries", "CODCarried", ...metricFields].map(key => [key, read(row, key, null)]));

export default function DCARReport() {
  const { filters } = useGlobalFilters();
  const applied = useMemo(() => ({
    startDate: filters.startDate || "",
    endDate: filters.endDate || "",
    vendorCode: filters.vendorCode || "",
    dcCode: filters.dcCodes || filters.dcCode || "__NONE__",
  }), [filters.startDate, filters.endDate, filters.vendorCode, filters.dcCodes, filters.dcCode]);
  const [categoryKey, setCategoryKey] = useState("dispatch");
  const category = categories.find(item => item.key === categoryKey);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "HandedOver", descending: true });
  const reload = useCallback(() => setRefresh(value => value + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setData(null);
    if (applied.startDate && applied.endDate && applied.startDate > applied.endDate) {
      setError("Start date must be on or before end date.");
      setLoading(false);
      return () => { active = false; };
    }
    getDCARReport(applied).then(result => { if (active) setData(result); })
      .catch(reason => { if (active) setError(reason.message || "Unable to load CS KPI."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [applied, refresh]);

  const rows = useMemo(() => (read(data, "Rows", []) || []).map(normalizeRow), [data]);
  const summary = normalizeRow(read(data, "Summary", {}));
  const visibleRows = useMemo(() => rows.filter(row => `${row.DCName} ${row.DCCode}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => {
      const left = a[sort.key], right = b[sort.key];
      // Missing delivery times stay at the bottom in either direction.
      if (left == null) return right == null ? 0 : 1;
      if (right == null) return -1;
      const comparison = typeof left === "string" ? left.localeCompare(right) : left - right;
      return sort.descending ? -comparison : comparison;
    }), [rows, search, sort]);

  const sortHeading = (key, label) => <button type="button" className="btn btn-link p-0 text-reset text-nowrap"
    onClick={() => setSort(current => ({ key, descending: current.key === key ? !current.descending : key !== "DCName" }))}
    aria-label={`Sort by ${label}${sort.key === key ? (sort.descending ? ", descending" : ", ascending") : ""}`}>
    {label}{sort.key === key ? (sort.descending ? " ↓" : " ↑") : ""}</button>;
  const calculationColumns = category.measures.flatMap(measure => [
    ...measure.parts.map(([key, label], index) => ({ key: measure.key + key, label, value: row => row[key],
      render: row => formatReportNumber(row[key]), align: "end" })),
    { key: measure.key, label: measure.label, value: row => balance(row, measure),
      render: row => <strong>{formatReportNumber(balance(row, measure))}</strong>, align: "end" },
  ]);
  const columns = [
    { key: "DCName", label: sortHeading("DCName", categoryKey === "pus" ? "PUS / distribution centre" : "Distribution centre"), render: row => <div><strong>{row.DCName}</strong><small className="d-block text-muted">{row.DCCode}</small></div> },
    ...calculationColumns,
  ];
  const exportCsv = () => downloadReportCsv(`cs-kpi-${categoryKey}-${applied.startDate || "all"}-${applied.endDate || "all"}.csv`,
    [{ key: "DCCode", label: "DC code", value: row => row.DCCode }, { key: "DCName", label: "Distribution centre", value: row => row.DCName }, ...calculationColumns], visibleRows);

  return <div className="content analytics-report-page">
    <AnalyticsReportHeader title="CS KPI" activeReport="dc-ar" description="Operational measurables and their calculations by KPI category and distribution centre."
      reportTabs={categories.map(item => <button type="button" role="tab" key={item.key} aria-selected={categoryKey === item.key} className={categoryKey === item.key ? "active" : ""} onClick={() => setCategoryKey(item.key)}>{item.label}</button>)}
      onRefresh={reload} refreshing={loading} />
    {loading ? <AnalyticsLoadingState /> : error ? <AnalyticsErrorState message={error} onRetry={reload} /> : <>
      <div className="analytics-metric-grid">
        {category.measures.map(measure => <AnalyticsMetricCard key={measure.key} icon={Target} label={measure.label}
          value={formatReportNumber(balance(summary, measure))} helper={measure.parts.map(([, label]) => label).join(" − ").replaceAll("Less ", "")} />)}
      </div>
      <AnalyticsSection title={category.label}
        action={<AnalyticsCsvButton onClick={exportCsv} disabled={!visibleRows.length} />}>
        <div className="mb-3"><input className="form-control" aria-label="Search distribution centres" placeholder="Search distribution centres…" value={search} onChange={event => setSearch(event.target.value)} /></div>
        <AnalyticsTable columns={columns} rows={visibleRows} rowKey={row => row.DCCode} initialPageSize={25} emptyText="No orders match these filters." />
      </AnalyticsSection>
    </>}
  </div>;
}
