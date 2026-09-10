"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Modal } from "react-bootstrap";
import Link from "@/components/Link";
import notify from "@/lib/toast";
import SettlementAmounts, { settlementTotals } from "@/components/finance/SettlementAmounts";
import { getVendorSettlementOrders, getVendorSettlementSummary, initiateVendorSettlement } from "@/services/financeService";

const money = (value) => Number(value || 0).toLocaleString("en-KE", { style: "currency", currency: "KES" });

export default function NewSettlementPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [vendorCode, setVendorCode] = useState(params.get("vendorCode") || "");
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [referenceNO, setReferenceNO] = useState("");
  const [proof, setProof] = useState(null);
  const [transferFee, setTransferFee] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { getVendorSettlementSummary().then((response) => setVendors(response.Data || [])).catch((error) => notify.error(error.message)); }, []);
  useEffect(() => {
    if (!vendorCode) { setOrders([]); return; }
    let cancelled = false;
    setLoading(true); setOrders([]); setTransferFee("0"); setReferenceNO(""); setProof(null);
    getVendorSettlementOrders(vendorCode).then((response) => { if (!cancelled) setOrders(response.Data || []); }).catch((error) => { if (!cancelled) notify.error(error.message); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [vendorCode]);

  const totals = useMemo(() => settlementTotals(orders), [orders]);
  const fee = Number(transferFee);
  const validFee = transferFee.trim() !== "" && Number.isFinite(fee) && fee >= 0 && /^\d+(\.\d{1,2})?$/.test(transferFee) && fee < totals.remittanceAmount;
  const netRemittance = Math.round((totals.remittanceAmount - fee) * 100) / 100;
  const vendor = vendors.find((item) => item.vendorCode === vendorCode);

  const submit = async () => {
    if (!validFee) return notify.error("Enter a non-negative transaction cost with up to two decimal places, less than the expected remittance.");
    if (!referenceNO.trim()) return notify.error("Enter the settlement payment reference number.");
    if (!proof) return notify.error("Upload proof of payment.");
    setSubmitting(true);
    try {
      const response = await initiateVendorSettlement({ vendorCode, referenceNO: referenceNO.trim(), proof, transferFee: fee });
      notify.success(response.Message || "Settlement initiated successfully");
      router.push(`/admin/settlements/${response.Data.settlementNO}`);
    } catch (error) { notify.error(error.message || "Failed to initiate settlement"); }
    finally { setSubmitting(false); }
  };

  return <div className="content">
    <div className="page-header"><div className="page-title"><h4>New Vendor Settlement</h4><h6>Settle completed, paid orders that have not been included in an earlier settlement</h6></div><Link href="/admin/settlements" className="btn btn-outline-secondary">Back to Settlements</Link></div>
    {!vendorCode ? <div className="card"><div className="card-header"><h5 className="mb-0">Unsettled completed orders and accepted returns by vendor</h5></div><div className="card-body table-responsive"><table className="table align-middle"><thead><tr><th>Vendor</th><th className="text-end">Orders</th><th className="text-end">Orders Amount</th><th className="text-end">Paid Amount</th><th className="text-end">Service Fee</th><th className="text-end">Return Fee</th><th className="text-end">Net Before Transaction Cost</th><th>Action</th></tr></thead><tbody>{!vendors.length && <tr><td colSpan="8" className="text-center text-muted py-5">No unsettled completed orders or accepted returns found.</td></tr>}{vendors.map((item) => <tr key={item.vendorCode}><td><strong>{item.vendorName || item.vendorCode}</strong><small className="d-block text-muted">{item.vendorCode}</small></td><td className="text-end">{item.orderCount}</td><td className="text-end">{money(item.orderAmount)}</td><td className="text-end fw-semibold">{money(item.paidAmount)}</td><td className="text-end">{money(item.serviceFee)}</td><td className="text-end">{money(item.returnCost)}</td><td className="text-end fw-semibold">{money(item.remittanceAmount)}</td><td><button className="btn btn-sm btn-primary" onClick={() => { setVendorCode(item.vendorCode); router.replace(`/admin/settlements/new?vendorCode=${encodeURIComponent(item.vendorCode)}`); }}>Settle</button></td></tr>)}</tbody></table></div></div> : <>
      <button className="btn btn-link ps-0 mb-2" onClick={() => { setVendorCode(""); router.replace("/admin/settlements/new"); }}>← Back to vendor summary</button>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2"><div><h5 className="mb-1">{vendor?.vendorName || vendorCode}</h5><span className="text-muted">{vendorCode} · {orders.length} orders and returns</span></div><span className="badge bg-light text-dark border">All amounts in KES</span></div>
      <SettlementAmounts totals={totals} transactionCost={Number.isFinite(fee) ? fee : null} netAmount={validFee ? netRemittance : (totals.remittanceAmount === 0 && fee === 0 ? 0 : null)} loading={loading} />
      <div className="card"><div className="card-header d-flex justify-content-between align-items-center"><h5 className="mb-0">Unsettled completed orders and accepted returns</h5><Button disabled={!orders.length || loading || totals.remittanceAmount <= 0} onClick={() => setShowPayment(true)}>Initiate Payment</Button></div><div className="card-body table-responsive"><table className="table align-middle"><thead><tr><th>Order Number</th><th>Receiver</th><th>Date</th><th className="text-end">Order Amount</th><th className="text-end">Paid Amount</th><th className="text-end">Service Fee</th><th className="text-end">Return Fee</th><th className="text-end">Net Before Transaction Cost</th></tr></thead><tbody>{!loading && !orders.length && <tr><td colSpan="8" className="text-center text-muted py-5">No unsettled completed orders or accepted returns remain for this vendor.</td></tr>}{orders.map((order) => <tr key={order.orderNO}><td><strong>{order.orderNO}</strong></td><td>{order.receiverName || "-"}</td><td>{new Date(order.dateAdded).toLocaleString("en-GB")}</td><td className="text-end">{money(order.orderAmount)}</td><td className="text-end fw-semibold">{money(order.paidAmount)}</td><td className="text-end">{money(order.serviceFee)}</td><td className="text-end">{money(order.returnCost)}</td><td className="text-end fw-semibold">{money(order.remittanceAmount)}</td></tr>)}</tbody><tfoot><tr><th colSpan="3">Totals</th><th className="text-end">{money(totals.orderAmount)}</th><th className="text-end">{money(totals.paidAmount)}</th><th className="text-end">{money(totals.serviceFee)}</th><th className="text-end">{money(totals.returnCost)}</th><th className="text-end">{money(totals.remittanceAmount)}</th></tr></tfoot></table></div></div>
    </>}
    <Modal show={showPayment} onHide={() => !submitting && setShowPayment(false)} centered size="lg">
      <Modal.Header closeButton={!submitting}><Modal.Title>Post vendor remittance</Modal.Title></Modal.Header>
      <Modal.Body>
        <p className="text-muted">Review the deductions and enter the payment details for <strong>{vendor?.vendorName || vendorCode}</strong>.</p>
        <div className="row g-4">
          <div className="col-md-6">
            <h6 className="mb-3">Transaction cost</h6>
            <label htmlFor="settlement-transfer-fee" className="form-label">Bank or M-Pesa charge (KES)</label>
            <input id="settlement-transfer-fee" className={"form-control " + (!validFee ? "is-invalid" : "")} type="number" min="0" step="0.01" value={transferFee} disabled={submitting} aria-describedby="transaction-help" onChange={(event) => setTransferFee(event.target.value)} />
            <small id="transaction-help" className="text-muted d-block mt-2">This cost is deducted from the vendor remittance. Enter 0 if there is no charge.</small>
            {!validFee && <div className="text-danger small mt-2" role="alert">Enter a cost with up to two decimal places, below {money(totals.remittanceAmount)}.</div>}
            <label htmlFor="settlement-reference" className="form-label mt-4">Payment reference number</label>
            <input id="settlement-reference" className="form-control" value={referenceNO} disabled={submitting} onChange={(event) => setReferenceNO(event.target.value)} placeholder="Bank or M-Pesa reference" />
            <label htmlFor="settlement-proof" className="form-label mt-3">Proof of payment</label>
            <input id="settlement-proof" className="form-control" type="file" disabled={submitting} accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setProof(event.target.files?.[0] || null)} />
            <small className="text-muted">JPG, PNG, WebP or PDF; maximum 10 MB.</small>
          </div>
          <div className="col-md-6"><div className="bg-light rounded p-4 h-100">
            <h6 className="mb-3">Remittance breakdown</h6>
            {[["Order amount", totals.orderAmount], ["Service fees deducted", -totals.serviceDeducted], ["Return fees deducted", -totals.returnCost], ["Before transaction cost", totals.remittanceAmount], ["Transaction cost", -fee]].map(([label, amount]) => <div className="d-flex justify-content-between gap-2 mb-3" key={label}><span>{label}</span><strong className="text-nowrap">{Number.isFinite(amount) ? money(amount) : "—"}</strong></div>)}
            <div className="border-top pt-3 mt-3" aria-live="polite"><div className="text-success fw-semibold">Net amount to remit</div><div className="fs-3 fw-bold text-success">{validFee ? money(netRemittance) : "—"}</div></div>
            <small className="text-muted d-block mt-3">Send this net amount to the vendor. The transaction cost is recorded separately.</small>
          </div></div>
        </div>
      </Modal.Body>
      <Modal.Footer><Button variant="outline-secondary" disabled={submitting} onClick={() => setShowPayment(false)}>Cancel</Button><Button disabled={submitting || !validFee || !referenceNO.trim() || !proof} onClick={submit}>{submitting ? "Posting…" : "Confirm & Post Remittance"}</Button></Modal.Footer>
    </Modal>
  </div>;
}
