"use client";

import { useEffect, useMemo, useState } from "react";
import { Target } from "feather-icons-react";
import { getDCARReport } from "@/services/analyticsService";
import { useGlobalFilters } from "@/contexts/GlobalFiltersContext";
import { AnalyticsCsvButton, AnalyticsErrorState, AnalyticsLoadingState, AnalyticsMetricCard, AnalyticsReportHeader, AnalyticsSection } from "./AnalyticsReportUI";
import { downloadReportCsv, readAnalyticsValue as read } from "@/utils/analyticsReportUtils";
import { categories, normalizeRow, sumRows, display } from "./kpiReportUtils";
import "@/style/css/analytics-reports.css";
import styles from "./DCARReport.module.scss";

export default function DCARReport() {
  const { filters } = useGlobalFilters();
  const applied = useMemo(() => ({ startDate: filters.startDate || "", endDate: filters.endDate || "", vendorCode: filters.vendorCode || "", dcCode: filters.dcCodes || filters.dcCode || "__NONE__" }), [filters.startDate, filters.endDate, filters.vendorCode, filters.dcCodes, filters.dcCode]);
  const [categoryKey, setCategoryKey] = useState("dispatch");
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [refreshedAt, setRefreshedAt] = useState(null);
  const [sort, setSort] = useState({ key: "AwaitingDC", descending: true });
  const reload = () => setRefresh(value => value + 1);
  const category = categories.find(item => item.key === categoryKey);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setData(null);
    if (applied.startDate && applied.endDate && applied.startDate > applied.endDate) {
      setError("Start date must be on or before end date."); setLoading(false);
      return () => { active = false; };
    }
    getDCARReport(applied).then(result => {
      if (!["DispatchRows", "ReverseRows", "HubReturnRows"].every(key => Array.isArray(read(result, key, null)))) {
        throw new Error("The running API does not yet support the hub report. Restart or deploy the updated API, then refresh.");
      }
      if (active) { setData(result); setRefreshedAt(new Date()); }
    })
      .catch(reason => { if (active) setError(reason.message || "Unable to load OPS KPI."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [applied, refresh]);
  const rows = useMemo(() => (read(data, categoryKey === "dispatch" ? "DispatchRows" : categoryKey === "reverse" ? "ReverseRows" : "Rows", []) || []).map(normalizeRow), [data, categoryKey]);
  const dcRows = rows.filter(row => !row.isHub);
  const hubs = categoryKey === "reverse" ? (read(data, "HubReturnRows", []) || []).map(normalizeRow) : rows.filter(row => row.isHub);
  const dc = sumRows(dcRows), hub = sumRows(hubs);
  const eligible = categoryKey === "dispatch" ? rows : dcRows;
  const matches = row => `${row.DCName} ${row.DCCode}`.toLowerCase().includes(search.trim().toLowerCase());
  const visible = eligible.filter(matches).sort((a, b) => {
    const left = a[sort.key], right = b[sort.key];
    if (left == null) return right == null ? 0 : 1;
    if (right == null) return -1;
    const comparison = typeof left === "string" ? left.localeCompare(right) : left - right;
    return sort.descending ? -comparison : comparison;
  });
  const totals = sumRows(visible), columns = category.groups.flatMap(([, items]) => items);
  const cards = {
    dispatch: [["Awaiting hub pickup", hub.AwaitingHQ, "Vendor confirmed − picked by hub"], ["Awaiting receipt at DC", hub.AwaitingDC, "Dispatched by hubs − received at DC"], ["Received at DC", hub.DCRate, "Received at DC ÷ dispatched by hubs", "rate"], ["Hubs with pending at DC", hubs.filter(row => row.AwaitingDC > 0).length, `Of ${hubs.length} hubs`]],
    cx: [["Not delivered at DCs", dc.Pending, "Received at DC − delivered · excludes hub"], ["Delivery success", dc.Success, "Delivered ÷ received", "rate"], ["Attempted 3+ times", dc.AttemptedThree, "Reported attempts; verify pending-only scope"], ["Below three attempts", dc.BelowThree, "Pending delivery − attempted 3+ times"]],
    reverse: [["Awaiting return to HQ", dc.ReturnPending, "Failed at DCs − returned to HQ"], ["Returned to HQ from DCs", dc.ReturnRate, "Returned ÷ failed · excludes hub", "rate"], ["Awaiting vendor acceptance", hub.AcceptancePending, "Received at HQ − accepted by vendor"], ["Vendor acceptance rate", hub.AcceptanceRate, "Accepted ÷ received at HQ", "rate"]],
    finance: [["Delivered, not completed", dc.Uncompleted, "Delivered − completed"], ["Completion rate", dc.CompletionRate, "Completed ÷ delivered", "rate"], ["Stations with open orders", dcRows.filter(row => row.Uncompleted > 0).length, `Of ${dcRows.length} distribution centres`], ["Unrecovered losses", dc.Unrecovered, "Losses − recovered"]],
    pus: [["Outstanding at PUS", dc.Outstanding, "Received − delivered − returned"], ["Resolved", dc.Resolved, "Delivered or returned ÷ received", "rate"], ["Delivered from PUS", dc.Success, "Delivered ÷ received", "rate"], ["Returned from PUS", dc.ReturnedRate, "Returned ÷ received", "rate"]],
  }[categoryKey];
  const receiptIssue = rows.length > 0 && rows.every(row => row.ReceivedKCS === 0) && rows.some(row => row.DispatchedDC > 0);
  const returnIssue = dcRows.length > 0 && dcRows.every(row => row.ReturnedKCS === 0) && dcRows.some(row => row.FailedDC > 0);
  const warning = categoryKey === "dispatch" && receiptIssue ? "No hub pickups are recorded despite onward dispatches. Check pickup scans; awaiting hub pickup may overstate the backlog."
    : null;
  const heading = (key, label) => <button type="button" onClick={() => setSort(current => ({ key, descending: current.key === key ? !current.descending : key !== "DCName" }))}>{label}{sort.key === key ? sort.descending ? " ▼" : " ▲" : ""}</button>;
  const cell = (row, column) => {
    const value = row[column.key];
    const suspect = (receiptIssue && column.key === "ReceivedKCS") || (returnIssue && !row.isHub && column.key === "ReturnedKCS") || (value != null && value < 0);
    const tone = column.kind === "pending" && value != null ? value < 0 ? styles.danger : value === 0 ? styles.good : value >= (categoryKey === "finance" ? 5 : 10) ? styles.danger : styles.watch
      : value != null && ["Success", "Resolved", "CompletionRate"].includes(column.key) ? value < (categoryKey === "pus" ? 60 : 40) ? styles.danger : value < (categoryKey === "pus" ? 80 : 70) ? styles.watch : styles.good : "";
    return <td key={column.key}><span className={tone}>{display(value, column.kind)}{suspect && <span title="Check source scan data" aria-label="Check source scan data"> ⚠</span>}</span></td>;
  };
  const renderRow = row => <tr key={row.DCCode}><th scope="row"><strong>{row.DCName}</strong><small>{row.DCCode}{row.isHub ? " · hub" : ""}</small></th>{columns.map(column => cell(row, column))}</tr>;
  const exportCsv = () => downloadReportCsv(`cs-kpi-${categoryKey}-${applied.startDate || "all"}-${applied.endDate || "all"}.csv`, [{ key: "DCCode", label: "DC code", value: row => row.DCCode }, { key: "DCName", label: "Distribution centre", value: row => row.DCName }, ...columns.map(column => ({ ...column, value: row => row[column.key] }))], visible);
  return <div className={`content analytics-report-page ${styles.page}`}>
    <AnalyticsReportHeader title="OPS KPI" activeReport="dc-ar" reportTabs={categories.map(item => <button type="button" role="tab" key={item.key} aria-selected={categoryKey === item.key} className={categoryKey === item.key ? "active" : ""} onClick={() => { setCategoryKey(item.key); setSort({ key: item.sort, descending: !item.ascending }); }}>{item.label}</button>)} onRefresh={reload} refreshing={loading} />
    <div className={styles.metadata}><span>Date range: <b>{applied.startDate || "All dates"} – {applied.endDate || "present"}</b></span><span>Last refreshed: <b>{refreshedAt && !loading ? refreshedAt.toLocaleString("en-GB", { timeZone: "Africa/Nairobi" }) + " EAT" : "—"}</b></span><span>Stations: <b>{applied.dcCode === "__ALL__" ? "All" : applied.dcCode === "__NONE__" ? "None selected" : applied.dcCode}</b></span></div>
    {loading ? <AnalyticsLoadingState /> : error ? <AnalyticsErrorState message={error} onRetry={reload} /> : <>
      <div className={`analytics-metric-grid ${styles.metrics}`}>{cards.map(([label, value, helper, kind]) => <AnalyticsMetricCard key={label} icon={Target} label={label} value={display(value, kind)} helper={helper} />)}</div>
      <AnalyticsSection title={category.label} action={<AnalyticsCsvButton onClick={exportCsv} disabled={!visible.length} />}>
        <div className={styles.toolbar}><span>Sort: {columns.find(column => column.key === sort.key)?.label || "Distribution centre"}, {sort.descending ? "highest first" : "lowest first"}</span><input className="form-control" aria-label="Search distribution centres" placeholder={categoryKey === "dispatch" ? "Search hubs…" : "Search distribution centres…"} value={search} onChange={event => setSearch(event.target.value)} /></div>
        {warning && <div className={styles.notice} role="status">⚠ {warning}</div>}
        <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th rowSpan={2} scope="col">{heading("DCName", categoryKey === "dispatch" ? "Hub" : categoryKey === "pus" ? "PUS / distribution centre" : "Distribution centre")}</th>{category.groups.map(([label, items]) => <th key={label} colSpan={items.length} scope="colgroup">{label}</th>)}</tr><tr>{columns.map(column => <th scope="col" key={column.key}>{heading(column.key, column.label)}</th>)}</tr></thead><tbody>
          {visible.some(row => row.isHub) && <><tr className={styles.group}><th colSpan={columns.length + 1}>Hub</th></tr>{visible.filter(row => row.isHub).map(renderRow)}</>}
          {categoryKey !== "dispatch" && <><tr className={styles.group}><th colSpan={columns.length + 1}>Distribution centres</th></tr>{visible.filter(row => !row.isHub).map(renderRow)}</>}
          {!visible.length && <tr><td colSpan={columns.length + 1}>No orders match these filters.</td></tr>}
        </tbody>{visible.length > 0 && <tfoot><tr><th scope="row">{search ? "Filtered total" : "Total"}{categoryKey !== "dispatch" ? " (excl. hub)" : ""}</th>{columns.map(column => cell(totals, column))}</tr></tfoot>}</table></div>
        <div className={styles.legend}><span className={styles.good}>0 · nothing pending</span><span className={styles.watch}>1–{categoryKey === "finance" ? "4" : "9"} · watch</span><span className={styles.danger}>{categoryKey === "finance" ? "5" : "10"}+ · act now</span><span>— unavailable · ⚠ check data</span></div>
        {categoryKey === "reverse" && hubs.filter(matches).length > 0 && <><h6 className={styles.subheading}>Reverse KPI · HQ → Vendor</h6><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Location</th><th>Received at HQ</th><th>Accepted by vendor</th><th>% accepted</th><th>Pending</th></tr></thead><tbody>{hubs.filter(matches).map(row => <tr key={row.DCCode}><th scope="row">{row.DCName}<small>{row.DCCode} · hub</small></th>{[{ key: "ReturnedKCS" }, { key: "AcceptedVendor" }, { key: "AcceptanceRate", kind: "rate" }, { key: "AcceptancePending", kind: "pending" }].map(column => cell(row, column))}</tr>)}</tbody></table></div></>}
        <p className={styles.footnote}>Cards cover all stations in the applied filters. Table totals follow search results. Percentages use combined counts; unavailable figures are left blank.</p>
      </AnalyticsSection>
    </>}
  </div>;
}
