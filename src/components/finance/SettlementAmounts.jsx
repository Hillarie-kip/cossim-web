import React from "react";

export const settlementMoney = (value) => value == null ? "Not recorded" : Number(value).toLocaleString("en-KE", { style: "currency", currency: "KES" });

export function settlementTotals(items, saved = false) {
  const fields = ["orderAmount", "paidAmount", "serviceFee", "returnCost"];
  const totals = Object.fromEntries(fields.map((key) => [key, saved && items.some((item) => item[key] == null) ? null : items.reduce((sum, item) => sum + Number(item[key] || 0), 0)]));
  totals.remittanceAmount = items.reduce((sum, item) => sum + Number((saved ? item.codAmount : item.remittanceAmount) || 0), 0);
  totals.serviceDeducted = totals.orderAmount == null || totals.returnCost == null ? null : Math.round((totals.orderAmount - totals.returnCost - totals.remittanceAmount) * 100) / 100;
  return totals;
}

export default function SettlementAmounts({ totals, transactionCost = 0, netAmount, loading = false }) {
  const metrics = [
    ["Order amount", totals.orderAmount, "COD amount for completed orders"],
    ["Verified payments", totals.paidAmount, "Payments recorded against these items"],
    ["Service fees", totals.serviceFee, "Delivery charges for completed orders"],
    ["Return fees", totals.returnCost, "Deducted for accepted returns"],
    ["Service fees deducted", totals.serviceDeducted, "Delivery fees included in order COD"],
    ["Remittance before transaction cost", totals.remittanceAmount, "Order amount less applicable fees"],
    ["Transaction cost", transactionCost, "Deducted once from this remittance"],
    ["Net amount to remit", netAmount, "Amount the vendor receives", true],
  ];
  return <div className="row g-3 mb-4">
    {metrics.map(([label, value, help, accent]) => <div className="col-12 col-sm-6 col-xl-3" key={label}>
      <div className={`card h-100 mb-0 ${accent ? "border-success bg-success-subtle" : ""}`}>
        <div className="card-body"><div className="small text-muted mb-2">{label}</div>
          <div className={`fs-5 fw-bold mb-2 ${accent ? "text-success" : ""}`} aria-live={accent ? "polite" : undefined}>{loading ? "Loading…" : settlementMoney(value)}</div>
          <small className="text-muted">{help}</small>
        </div>
      </div>
    </div>)}
  </div>;
}
