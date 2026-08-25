"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { importDeliveredOrderPayments } from "@/services/shipmentService";
import { getReconciliationWorkspace, matchOrderReceipts, rejectReconciliationOrder, searchPaybillReceipts } from "@/services/financeService";
import notify from "@/lib/toast";

const money = (value) => Number(value || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PaymentReconciliationPage() {
  const inputRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [receiptSearch, setReceiptSearch] = useState({});
  const [receiptResults, setReceiptResults] = useState({});
  const [selectedReceipts, setSelectedReceipts] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyOrder, setBusyOrder] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = async (value = search) => {
    setLoading(true);
    try { const response = await getReconciliationWorkspace(value); setRows(response.Data || []); }
    catch (error) { notify.error(error.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(""); }, []);

  const upload = async (event) => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    setUploading(true);
    try { const response = await importDeliveredOrderPayments(file); notify.success(response.Message); await load(); }
    catch (error) { notify.error(error.message); }
    finally { setUploading(false); }
  };

  const findReceipts = async (order, value = receiptSearch[order.orderNO] || "") => {
    setBusyOrder(order.orderNO);
    try { const response = await searchPaybillReceipts({ search: value, orderNO: order.orderNO }); setReceiptResults((old) => ({ ...old, [order.orderNO]: response.Data || [] })); }
    catch (error) { notify.error(error.message); }
    finally { setBusyOrder(""); }
  };

  const toggleReceipt = (orderNO, receiptNo, checked) => setSelectedReceipts((old) => ({ ...old, [orderNO]: checked ? [...new Set([...(old[orderNO] || []), receiptNo])] : (old[orderNO] || []).filter((value) => value !== receiptNo) }));

  const match = async (orderNO) => {
    const receiptNos = selectedReceipts[orderNO] || []; if (!receiptNos.length) return;
    setBusyOrder(orderNO);
    try { const response = await matchOrderReceipts(orderNO, receiptNos); notify.success(response.Message); setSelectedReceipts((old) => ({ ...old, [orderNO]: [] })); setReceiptResults((old) => ({ ...old, [orderNO]: [] })); await load(); }
    catch (error) { notify.error(error.message); }
    finally { setBusyOrder(""); }
  };

  const reject = async (orderNO) => {
    if (!window.confirm(`Remove ${orderNO} from Finance reconciliation as non-compliant?`)) return;
    setBusyOrder(orderNO);
    try { const response = await rejectReconciliationOrder(orderNO); notify.success(response.Message); setRows((old) => old.filter((row) => row.orderNO !== orderNO)); }
    catch (error) { notify.error(error.message); }
    finally { setBusyOrder(""); }
  };

  return <div className="content">
    <div className="page-header"><div className="page-title"><h4>COD Payment Reconciliation</h4><h6>Match delivered orders directly to uploaded M-Pesa statement receipts</h6></div><div className="d-flex gap-2"><Link href="/admin/reports/delivered-orders" className="btn btn-outline-secondary">Back to Delivered Orders</Link><input ref={inputRef} className="d-none" type="file" accept=".xls,.xlsx" onChange={upload} /><button className="btn btn-primary" disabled={uploading} onClick={() => inputRef.current?.click()}>{uploading ? "Uploading..." : "Upload M-Pesa statement"}</button></div></div>
    <div className="card"><div className="card-body">
      <form className="row g-2 mb-3" onSubmit={(event) => { event.preventDefault(); load(search); }}><div className="col"><input className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, receiver name, receiver phone, or vendor" /></div><div className="col-auto"><button className="btn btn-primary">Search orders</button></div></form>
      <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Order</th><th>Order receiver</th><th>Order amounts</th><th style={{ minWidth: 360 }}>Statement payments / M-Pesa payer</th><th style={{ minWidth: 240 }}>Find another receipt</th></tr></thead><tbody>
        {!loading && !rows.length && <tr><td colSpan="5" className="text-center text-muted py-5">No delivered COD orders found.</td></tr>}
        {rows.map((order) => {
          const results = receiptResults[order.orderNO] || order.suggestions || [];
          const chosen = selectedReceipts[order.orderNO] || [];
          return <tr key={order.orderNO}>
            <td><strong>{order.orderNO}</strong><small className="d-block text-muted">{order.vendorCode}</small></td>
            <td><strong className="d-block">{order.receiverName || "Name not recorded"}</strong><small className="d-block text-muted">{order.receiverPhone || "Phone not recorded"}</small></td>
            <td><span className="d-block">Order: <strong>KES {money(order.orderAmount)}</strong></span><small className="d-block text-success">Matched: KES {money(order.verifiedAmount)}</small><small className="d-block text-danger">Outstanding: KES {money(order.outstandingAmount)}</small></td>
            <td>{results.length ? <div className="d-grid gap-2">{results.map((receipt) => <label className={`border rounded p-2 ${chosen.includes(receipt.receiptNo) ? "border-success bg-light" : ""}`} key={receipt.receiptNo}><div className="d-flex gap-2 align-items-start"><input type="checkbox" className="form-check-input mt-1" checked={chosen.includes(receipt.receiptNo)} onChange={(event) => toggleReceipt(order.orderNO, receipt.receiptNo, event.target.checked)} /><div className="flex-grow-1"><div className="d-flex justify-content-between gap-2"><strong>{receipt.receiptNo}</strong><strong>KES {money(receipt.paidInAmount)}</strong></div><span className="d-block">{receipt.payerName || "Payer name unavailable"}</span><small className="d-block text-muted">M-Pesa phone: {receipt.payerPhone || `ending ${receipt.phoneLast4 || "----"}`}</small><small className="d-block text-muted">Order: {order.receiverName || "-"} / {order.receiverPhone || "-"}</small><small className="d-block text-primary">Suggestion {receipt.score || 0}%{receipt.matchReasons ? ` - ${receipt.matchReasons}` : ""}</small></div></div></label>)}</div> : <span className="text-muted">No suggestions. Search the statement by receipt, payer, phone, or account.</span>}<button className="btn btn-success btn-sm mt-2" disabled={!chosen.length || busyOrder === order.orderNO} onClick={() => match(order.orderNO)}>{busyOrder === order.orderNO ? "Matching..." : `Match selected payments (${chosen.length})`}</button></td>
            <td><div className="input-group input-group-sm"><input className="form-control" value={receiptSearch[order.orderNO] || ""} onChange={(event) => setReceiptSearch((old) => ({ ...old, [order.orderNO]: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); findReceipts(order, event.currentTarget.value); } }} placeholder="Receipt, M-Pesa name, phone..." /><button className="btn btn-outline-primary" type="button" disabled={busyOrder === order.orderNO} onClick={() => findReceipts(order)}>Find</button></div><small className="d-block text-muted">Search replaces suggestions; selections may include multiple receipts.</small><button className="btn btn-outline-danger btn-sm mt-3" type="button" disabled={busyOrder === order.orderNO} onClick={() => reject(order.orderNO)}>Reject non-compliant</button></td>
          </tr>;
        })}
      </tbody></table></div>
    </div></div>
  </div>;
}
