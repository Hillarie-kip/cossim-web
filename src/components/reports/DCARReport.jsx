"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DollarSign, Package, Target, Truck } from "feather-icons-react";
import { getDCARReport } from "@/services/analyticsService";
import { useGlobalFilters } from "@/contexts/GlobalFiltersContext";
import { AnalyticsCsvButton, AnalyticsErrorState,
  AnalyticsLoadingState, AnalyticsMetricCard, AnalyticsReportHeader, AnalyticsSection,
  AnalyticsTable } from "@/components/reports/AnalyticsReportUI";
import { downloadReportCsv, formatReportCurrency, formatReportNumber, formatReportPercent,
  readAnalyticsValue as read } from "@/utils/analyticsReportUtils";
import "@/style/css/analytics-reports.css";

const normalizeRow = (row) => Object.fromEntries(["DCCode", "DCName", "HandedOver", "Delivered", "Paid",
  "ReturnedFailed", "SuccessRate", "AverageHours", "TimedDeliveries", "CODCarried"].map(key => [key, read(row, key, null)]));
const hours = value => value == null ? "—" : `${formatReportNumber(value, 2)}h`;

export default function DCARReport() {
  const { filters } = useGlobalFilters();
  const applied = useMemo(() => ({
    startDate: filters.startDate || "",
    endDate: filters.endDate || "",
    vendorCode: filters.vendorCode || "",
    dcCode: filters.dcCodes || filters.dcCode || "__NONE__",
  }), [filters.startDate, filters.endDate, filters.vendorCode, filters.dcCodes, filters.dcCode]);
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
      .catch(reason => { if (active) setError(reason.message || "Unable to load CS API."); })
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
  const columns = [
    { key: "DCName", label: sortHeading("DCName", "Distribution centre"), render: row => <div><strong>{row.DCName}</strong><small className="d-block text-muted">{row.DCCode}</small></div> },
    ...[["HandedOver", "Handed over"], ["Delivered", "Delivered"], ["Paid", "Paid"], ["ReturnedFailed", "Returned + failed"]]
      .map(([key, label]) => ({ key, label: sortHeading(key, label), align: "end", render: row => formatReportNumber(row[key]) })),
    { key: "SuccessRate", label: sortHeading("SuccessRate", "Success rate"), align: "end", render: row => <strong>{formatReportPercent(row.SuccessRate)}</strong> },
    { key: "AverageHours", label: sortHeading("AverageHours", "Avg time"), align: "end", render: row => hours(row.AverageHours) },
    { key: "CODCarried", label: sortHeading("CODCarried", "COD carried"), align: "end", render: row => formatReportCurrency(row.CODCarried) },
  ];
  const exportCsv = () => downloadReportCsv(`cs-api-${applied.startDate || "all"}-${applied.endDate || "all"}.csv`,
    [["DCCode", "DC code"], ["DCName", "Distribution centre"], ["HandedOver", "Handed over"], ["Delivered", "Delivered"],
      ["Paid", "Paid"], ["ReturnedFailed", "Returned + failed"], ["SuccessRate", "Success rate (%)"],
      ["AverageHours", "Average time (hours)"], ["CODCarried", "COD carried (KES)"]].map(([key, label]) => ({ key, label, value: row => row[key] })), visibleRows);

  return <div className="content analytics-report-page">
    <AnalyticsReportHeader title="CS API" activeReport="dc-ar" description="Where CoSSim wins and where it bleeds — delivery and cash reconciliation by distribution centre."
      onRefresh={reload} refreshing={loading} />
    {loading ? <AnalyticsLoadingState /> : error ? <AnalyticsErrorState message={error} onRetry={reload} /> : <>
      <div className="analytics-metric-grid">
        <AnalyticsMetricCard icon={Package} label="Handed over" value={formatReportNumber(summary.HandedOver)} helper="Distinct parcels in the selected cohort" />
        <AnalyticsMetricCard icon={Truck} label="Delivered" value={formatReportNumber(summary.Delivered)} helper={`${formatReportNumber(summary.Paid)} fully paid orders`} />
        <AnalyticsMetricCard icon={Target} label="Success rate" value={formatReportPercent(summary.SuccessRate)} helper="Paid orders ÷ handed over × 100" />
        <AnalyticsMetricCard icon={DollarSign} label="COD carried" value={formatReportCurrency(summary.CODCarried)} helper={`Average delivery time: ${hours(summary.AverageHours)}`} />
      </div>
      <AnalyticsSection title="Where CoSSim wins and where it bleeds" description="Success rate = paid orders ÷ parcels handed over × 100. Paid means delivered with verified COD payments covering the full COD amount."
        action={<AnalyticsCsvButton onClick={exportCsv} disabled={!visibleRows.length} />}>
        <div className="mb-3"><input className="form-control" aria-label="Search distribution centres" placeholder="Search distribution centres…" value={search} onChange={event => setSearch(event.target.value)} /></div>
        <AnalyticsTable columns={columns} rows={visibleRows} rowKey={row => row.DCCode} initialPageSize={25} emptyText="No handed-over parcels match these filters." />
        <p className="text-muted small mt-3 mb-0">Each parcel is attributed to its latest confirmed forward handover. Dates filter that handover, while outcomes show the current position. Pending consolidations and return handovers are excluded. Average time uses recorded deliveries after handover; — means no timed deliveries. COD carried is the cohort’s total COD value. Zero-COD orders do not count as paid. Returned + failed counts current return stages and lost orders; a previously delivered parcel can also be returned.</p>
        <p className="text-muted small mt-2 mb-0">Totals cover all DCs matching the applied filters; search narrows the table and CSV export.</p>
      </AnalyticsSection>
    </>}
  </div>;
}
