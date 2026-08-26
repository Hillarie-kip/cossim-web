"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Modal } from "react-bootstrap";
import Link from "@/components/Link";
import notify from "@/lib/toast";
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { getVendorSettlementSummary().then((response) => setVendors(response.Data || [])).catch((error) => notify.error(error.message)); }, []);
  useEffect(() => {
    if (!vendorCode) { setOrders([]); return; }
    setLoading(true);
    getVendorSettlementOrders(vendorCode).then((response) => setOrders(response.Data || [])).catch((error) => { setOrders([]); notify.error(error.message); }).finally(() => setLoading(false));
  }, [vendorCode]);

  const totals = useMemo(() => orders.reduce((sum, order) => ({ orderAmount: sum.orderAmount + Number(order.orderAmount || 0), paidAmount: sum.paidAmount + Number(order.paidAmount || 0) }), { orderAmount: 0, paidAmount: 0 }), [orders]);
  const vendor = vendors.find((item) => item.vendorCode === vendorCode);

  const submit = async () => {
    if (!referenceNO.trim()) return notify.error("Enter the settlement payment reference number.");
    if (!proof) return notify.error("Upload proof of payment.");
    setSubmitting(true);
    try {
      const response = await initiateVendorSettlement({ vendorCode, referenceNO: referenceNO.trim(), proof });
      notify.success(response.Message || "Settlement initiated successfully");
      router.push(`/admin/settlements/${response.Data.settlementNO}`);
    } catch (error) { notify.error(error.message || "Failed to initiate settlement"); }
    finally { setSubmitting(false); }
  };

  return <div className="content">
    <div className="page-header"><div className="page-title"><h4>New Vendor Settlement</h4><h6>Settle completed, paid orders that have not been included in an earlier settlement</h6></div><Link href="/admin/settlements" className="btn btn-outline-secondary">Back to Settlements</Link></div>
    <div className="card mb-3"><div className="card-body"><label className="form-label fw-semibold">Vendor</label><select className="form-select" value={vendorCode} onChange={(event) => setVendorCode(event.target.value)}><option value="">Select a vendor with unsettled orders</option>{vendors.map((item) => <option key={item.vendorCode} value={item.vendorCode}>{item.vendorName || item.vendorCode} ({item.orderCount} orders)</option>)}</select></div></div>
    {vendorCode && <>
      <div className="row g-3 mb-3"><div className="col-md-3"><div className="card h-100"><div className="card-body"><small className="text-muted">Vendor</small><h5>{vendor?.vendorName || vendorCode}</h5><span>{vendorCode}</span></div></div></div><div className="col-md-3"><div className="card h-100"><div className="card-body"><small className="text-muted">Completed orders</small><h3>{orders.length}</h3></div></div></div><div className="col-md-3"><div className="card h-100"><div className="card-body"><small className="text-muted">Orders amount</small><h5>{money(totals.orderAmount)}</h5></div></div></div><div className="col-md-3"><div className="card h-100"><div className="card-body"><small className="text-muted">Paid amount</small><h5 className="text-success">{money(totals.paidAmount)}</h5></div></div></div></div>
      <div className="card"><div className="card-header d-flex justify-content-between align-items-center"><h5 className="mb-0">Unsettled completed orders</h5><Button disabled={!orders.length || loading} onClick={() => setShowPayment(true)}>Initiate Payment</Button></div><div className="card-body table-responsive"><table className="table align-middle"><thead><tr><th>Order Number</th><th>Receiver</th><th>Date</th><th className="text-end">Order Amount</th><th className="text-end">Paid Amount</th></tr></thead><tbody>{!loading && !orders.length && <tr><td colSpan="5" className="text-center text-muted py-5">No unsettled completed orders remain for this vendor.</td></tr>}{orders.map((order) => <tr key={order.orderNO}><td><strong>{order.orderNO}</strong></td><td>{order.receiverName || "-"}</td><td>{new Date(order.dateAdded).toLocaleString("en-GB")}</td><td className="text-end">{money(order.orderAmount)}</td><td className="text-end fw-semibold">{money(order.paidAmount)}</td></tr>)}</tbody><tfoot><tr><th colSpan="3">Totals</th><th className="text-end">{money(totals.orderAmount)}</th><th className="text-end">{money(totals.paidAmount)}</th></tr></tfoot></table></div></div>
    </>}
    <Modal show={showPayment} onHide={() => !submitting && setShowPayment(false)} centered><Modal.Header closeButton><Modal.Title>Initiate settlement payment</Modal.Title></Modal.Header><Modal.Body><div className="alert alert-info">This will settle {orders.length} orders for {money(totals.paidAmount)}.</div><label className="form-label fw-semibold">Payment reference number</label><input className="form-control mb-3" value={referenceNO} onChange={(event) => setReferenceNO(event.target.value)} placeholder="Enter bank or M-Pesa reference" /><label className="form-label fw-semibold">Proof of payment</label><input className="form-control" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setProof(event.target.files?.[0] || null)} /><small className="text-muted">JPG, PNG, WebP, or PDF; maximum 10 MB.</small></Modal.Body><Modal.Footer><Button variant="outline-secondary" disabled={submitting} onClick={() => setShowPayment(false)}>Cancel</Button><Button disabled={submitting || !referenceNO.trim() || !proof} onClick={submit}>{submitting ? "Initiating..." : "Confirm & Initiate Payment"}</Button></Modal.Footer></Modal>
  </div>;
}
