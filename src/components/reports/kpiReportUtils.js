import { readAnalyticsValue as read, formatReportNumber } from "@/utils/analyticsReportUtils";

const fields = ["VendorCreated", "ReceivedKCS", "DispatchedDC", "ReceivedDC", "DCDelivered", "AttemptedThree", "FailedDC", "ReturnedKCS", "AcceptedVendor", "Delivered", "Paid", "Losses", "Recovered", "DCReturned"];
const difference = (...values) => values.some(value => value == null) ? null : values.slice(1).reduce((sum, value) => sum - value, values[0]);
const rate = (part, total) => part == null || total == null || total <= 0 ? null : part / total * 100;
export const normalizeRow = row => {
  const r = { DCCode: read(row, "DCCode", ""), DCName: read(row, "DCName", "") };
  fields.forEach(key => { const value = read(row, key, null); r[key] = value == null || value === "" || !Number.isFinite(Number(value)) ? null : Number(value); });
  const hubFlag = read(row, "IsHub", null);
  return { ...r, isHub: hubFlag == null ? /\b(HQ|hub|sorting cent(?:er|re))\b/i.test(r.DCName) : hubFlag === true,
    AwaitingHQ: difference(r.VendorCreated, r.ReceivedKCS), AwaitingDC: difference(r.DispatchedDC, r.ReceivedDC),
    HQRate: rate(r.ReceivedKCS, r.VendorCreated), DCRate: rate(r.ReceivedDC, r.DispatchedDC),
    Pending: difference(r.ReceivedDC, r.DCDelivered), Success: rate(r.DCDelivered, r.ReceivedDC),
    BelowThree: difference(r.ReceivedDC, r.DCDelivered, r.AttemptedThree),
    ReturnPending: difference(r.FailedDC, r.ReturnedKCS), FailureRate: rate(r.FailedDC, r.ReceivedDC), ReturnRate: rate(r.ReturnedKCS, r.FailedDC),
    AcceptanceRate: rate(r.AcceptedVendor, r.ReturnedKCS), AcceptancePending: difference(r.ReturnedKCS, r.AcceptedVendor),
    Uncompleted: difference(r.Delivered, r.Paid), CompletionRate: rate(r.Paid, r.Delivered), Unrecovered: difference(r.Losses, r.Recovered),
    Outstanding: difference(r.ReceivedDC, r.DCDelivered, r.DCReturned), Resolved: r.DCDelivered == null || r.DCReturned == null ? null : rate(r.DCDelivered + r.DCReturned, r.ReceivedDC), ReturnedRate: rate(r.DCReturned, r.ReceivedDC) };
};
export const sumRows = rows => normalizeRow(Object.fromEntries(fields.map(key => [key, rows.length && rows.every(row => row[key] != null) ? rows.reduce((sum, row) => sum + row[key], 0) : null])));
export const display = (value, kind) => value == null ? "—" : kind === "rate" ? `${value.toFixed(1)}%` : formatReportNumber(value);
const col = (key, label, kind = "count") => ({ key, label, kind });
export const categories = [
  { key: "dispatch", label: "Dispatch KPI", sort: "AwaitingDC", groups: [["Vendor to hub", [col("VendorCreated", "Created (vendor confirmed)"), col("ReceivedKCS", "Received (picked by hub)"), col("HQRate", "% picked", "rate"), col("AwaitingHQ", "Pending pickup", "pending")]], ["Hub to DC", [col("DispatchedDC", "Dispatched"), col("ReceivedDC", "Received"), col("DCRate", "% received", "rate"), col("AwaitingDC", "Pending", "pending")]]] },
  { key: "cx", label: "CX KPI", sort: "Success", ascending: true, groups: [["Delivery at DC", [col("ReceivedDC", "Received"), col("DCDelivered", "Delivered"), col("Pending", "Pending", "pending"), col("Success", "Success %", "rate")]], ["Attempts on pending parcels", [col("BelowThree", "Below 3"), col("AttemptedThree", "3+")]]] },
  { key: "reverse", label: "Reverse KPI", sort: "ReturnPending", groups: [["Failed delivery", [col("ReceivedDC", "Received at DC"), col("FailedDC", "Failed"), col("FailureRate", "Failure rate", "rate")]], ["Return to HQ", [col("ReturnedKCS", "Returned"), col("ReturnRate", "% returned", "rate"), col("ReturnPending", "Pending", "pending")]], ["Return to vendor", [col("AcceptedVendor", "Accepted by vendor"), col("AcceptanceRate", "% accepted", "rate")]]] },
  { key: "finance", label: "Finance KPI", sort: "Uncompleted", groups: [["Order completion", [col("Delivered", "Delivered"), col("Paid", "Completed"), col("CompletionRate", "% completed", "rate"), col("Uncompleted", "Not completed", "pending")]], ["Losses", [col("Losses", "Losses"), col("Recovered", "Recovered"), col("Unrecovered", "Unrecovered", "pending")]]] },
  { key: "pus", label: "PUS KPI", sort: "Outstanding", groups: [["What happened to parcels received", [col("ReceivedDC", "Received"), col("DCDelivered", "Delivered"), col("DCReturned", "Returned"), col("Resolved", "% resolved", "rate")]], ["Still at PUS", [col("Outstanding", "Outstanding", "pending")]]] },
];
