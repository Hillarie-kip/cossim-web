"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { importDeliveredOrderPayments } from "@/services/shipmentService";
import { clearPaidToVendor, getReconciliationBatches, getReconciliationTransactions, getReconciliationWorkspace, matchOrderReceipts, rejectReconciliationOrder, searchPaybillReceipts } from "@/services/financeService";
import notify from "@/lib/toast";

const money = (value) => Number(value || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = (value) => value ? new Date(value).toLocaleString("en-KE") : "-";

function OrderReconciliation({ refreshKey }) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [receiptSearch, setReceiptSearch] = useState({});
  const [receiptResults, setReceiptResults] = useState({});
  const [selectedReceipts, setSelectedReceipts] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyOrder, setBusyOrder] = useState("");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async (value = "") => {
    setLoading(true);
    try { const response = await getReconciliationWorkspace(value); setRows(response.Data || []); setSelectedOrders([]); }
    catch (error) { notify.error(error.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(search); }, [refreshKey]);
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
    try { const response = await matchOrderReceipts(orderNO, receiptNos); notify.success(response.Message); setSelectedReceipts((old) => ({ ...old, [orderNO]: [] })); setReceiptResults((old) => ({ ...old, [orderNO]: [] })); await load(search); }
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
  const toggleOrder = (orderNO, checked) => setSelectedOrders((old) => checked ? [...new Set([...old, orderNO])] : old.filter((value) => value !== orderNO));
  const clearDirectPayments = async () => {
    if (!selectedOrders.length || !window.confirm(`Clear ${selectedOrders.length} selected order(s) as paid directly to the vendor? This marks them complete and removes them from statement reconciliation.`)) return;
    setClearing(true);
    try { const response = await clearPaidToVendor(selectedOrders); notify.success(response.Message); await load(search); }
    catch (error) { notify.error(error.message); }
    finally { setClearing(false); }
  };

  return <>
    <form className="row g-2 mb-3" onSubmit={(event) => { event.preventDefault(); load(search); }}><div className="col"><input className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, receiver name, receiver phone, or vendor" /></div><div className="col-auto"><button className="btn btn-primary">Search orders</button></div><div className="col-auto"><button className="btn btn-success" type="button" disabled={!selectedOrders.length || clearing} onClick={clearDirectPayments}>{clearing ? "Clearing..." : `Clear paid to vendor (${selectedOrders.length})`}</button></div></form>
    <div className="table-responsive"><table className="table align-middle"><thead><tr><th className="text-center">Paid to vendor</th><th>Order</th><th>Order receiver</th><th>Order amounts</th><th style={{ minWidth: 360 }}>Statement payments / M-Pesa payer</th><th style={{ minWidth: 240 }}>Find another receipt</th></tr></thead><tbody>
      {!loading && !rows.length && <tr><td colSpan="6" className="text-center text-muted py-5">No delivered COD orders found.</td></tr>}
      {rows.map((order) => { const results = receiptResults[order.orderNO] || order.suggestions || []; const chosen = selectedReceipts[order.orderNO] || []; return <tr key={order.orderNO}>
        <td className="text-center"><input type="checkbox" className="form-check-input" checked={selectedOrders.includes(order.orderNO)} onChange={(event) => toggleOrder(order.orderNO, event.target.checked)} aria-label={`Mark ${order.orderNO} as paid directly to vendor`} /></td>
        <td><strong>{order.orderNO}</strong><small className="d-block text-muted">{order.vendorCode}</small></td>
        <td><strong className="d-block">{order.receiverName || "Name not recorded"}</strong><small className="d-block text-muted">{order.receiverPhone || "Phone not recorded"}</small></td>
        <td><span className="d-block">Order: <strong>KES {money(order.orderAmount)}</strong></span><small className="d-block text-success">Matched: KES {money(order.verifiedAmount)}</small><small className="d-block text-danger">Outstanding: KES {money(order.outstandingAmount)}</small></td>
        <td>{results.length ? <div className="d-grid gap-2">{results.map((receipt) => <label className={`border rounded p-2 ${chosen.includes(receipt.receiptNo) ? "border-success bg-light" : ""}`} key={receipt.receiptNo}><div className="d-flex gap-2 align-items-start"><input type="checkbox" className="form-check-input mt-1" checked={chosen.includes(receipt.receiptNo)} onChange={(event) => toggleReceipt(order.orderNO, receipt.receiptNo, event.target.checked)} /><div className="flex-grow-1"><div className="d-flex justify-content-between gap-2"><strong>{receipt.receiptNo}</strong><strong>KES {money(receipt.paidInAmount)}</strong></div><span className="d-block">{receipt.payerName || "Payer name unavailable"}</span><small className="d-block text-muted">M-Pesa phone: {receipt.payerPhone || `ending ${receipt.phoneLast4 || "----"}`}</small><small className="d-block text-muted">Order: {order.receiverName || "-"} / {order.receiverPhone || "-"}</small><small className="d-block text-primary">Suggestion {receipt.score || 0}%{receipt.matchReasons ? ` - ${receipt.matchReasons}` : ""}</small></div></div></label>)}</div> : <span className="text-muted">No suggestions. Search the statement by receipt, payer, phone, or account.</span>}<button className="btn btn-success btn-sm mt-2" disabled={!chosen.length || busyOrder === order.orderNO} onClick={() => match(order.orderNO)}>{busyOrder === order.orderNO ? "Matching..." : `Match selected payments (${chosen.length})`}</button></td>
        <td><div className="input-group input-group-sm"><input className="form-control" value={receiptSearch[order.orderNO] || ""} onChange={(event) => setReceiptSearch((old) => ({ ...old, [order.orderNO]: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); findReceipts(order, event.currentTarget.value); } }} placeholder="Receipt, M-Pesa name, phone..." /><button className="btn btn-outline-primary" type="button" disabled={busyOrder === order.orderNO} onClick={() => findReceipts(order)}>Find</button></div><small className="d-block text-muted">Search replaces suggestions; selections may include multiple receipts.</small><button className="btn btn-outline-danger btn-sm mt-3" type="button" disabled={busyOrder === order.orderNO} onClick={() => reject(order.orderNO)}>Reject non-compliant</button></td>
      </tr>; })}
    </tbody></table></div>
  </>;
}

function ReconciliationBatches({ refreshKey }) {
  const [view, setView] = useState("list"), [batches, setBatches] = useState([]), [transactions, setTransactions] = useState([]);
  const [batch, setBatch] = useState(null), [usage, setUsage] = useState("all"), [search, setSearch] = useState(""), [loading, setLoading] = useState(true);
  const loadBatches = useCallback(async () => { setLoading(true); try { setBatches((await getReconciliationBatches()).Data || []); } catch (error) { notify.error(error.message); } finally { setLoading(false); } }, []);
  const loadTransactions = useCallback(async (nextUsage, batchID, query = "") => { setLoading(true); try { setTransactions((await getReconciliationTransactions({ usage: nextUsage, batchID, search: query })).Data || []); } catch (error) { notify.error(error.message); } finally { setLoading(false); } }, []);
  useEffect(() => { loadBatches(); }, [refreshKey]);
  const openBatch = (item) => { setBatch(item); setView("detail"); setUsage("reconcile"); setSearch(""); };
  const filter = (next) => { setUsage(next); if (next !== "reconcile") loadTransactions(next, batch.uploadBatchID, search); };
  if (view === "list") return <div className="table-responsive"><table className="table align-middle table-hover"><thead><tr><th>Batch</th><th>Statement period</th><th>Transactions</th><th>Total amount</th><th>Used</th><th>Unused</th><th></th></tr></thead><tbody>{!loading && !batches.length && <tr><td colSpan="7" className="text-center text-muted py-5">No reconciliation batches uploaded yet.</td></tr>}{batches.map((item) => <tr key={item.uploadBatchID}><td><strong>{item.fileName || "M-Pesa statement"}</strong><small className="d-block text-muted">{item.uploadBatchID}</small></td><td>{date(item.statementFrom)}<small className="d-block text-muted">to {date(item.statementTo)}</small></td><td>{item.transactionCount}</td><td><strong>KES {money(item.totalAmount)}</strong></td><td className="text-success"><strong>KES {money(item.usedAmount)}</strong><small className="d-block">{item.usedCount} transactions</small></td><td className="text-warning"><strong>KES {money(item.unusedAmount)}</strong><small className="d-block">{item.unusedCount} transactions</small></td><td><button className="btn btn-outline-primary btn-sm" onClick={() => openBatch(item)}>View details</button></td></tr>)}</tbody></table></div>;
  return <><div className="mb-3"><button className="btn btn-link ps-0" onClick={() => { setView("list"); loadBatches(); }}>← Back to batches</button><h5>{batch.fileName || "M-Pesa statement"}</h5><small className="text-muted">Total KES {money(batch.totalAmount)} · Used KES {money(batch.usedAmount)} · Unused KES {money(batch.unusedAmount)}</small></div><ul className="nav nav-tabs mb-3">{[["reconcile","Reconcile"],["unused","Unused"],["used","Used"],["all","All"]].map(([item,label]) => <li className="nav-item" key={item}><button className={`nav-link ${usage === item ? "active" : ""}`} onClick={() => filter(item)}>{label}</button></li>)}</ul>{usage === "reconcile" ? <OrderReconciliation refreshKey={`${refreshKey}-${batch.uploadBatchID}`} /> : <><form className="row g-2 mb-3" onSubmit={(event) => { event.preventDefault(); loadTransactions(usage, batch.uploadBatchID, search); }}><div className="col"><input className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search receipt, payer, account or order" /></div><div className="col-auto"><button className="btn btn-primary">Search</button></div></form><div className="table-responsive"><table className="table align-middle"><thead><tr><th>Receipt</th><th>Date</th><th>Payer / Account</th><th>Amount</th><th>Status</th><th>Matched order</th></tr></thead><tbody>{!loading && !transactions.length && <tr><td colSpan="6" className="text-center text-muted py-5">No statement transactions found.</td></tr>}{transactions.map((item) => <tr key={`${item.uploadBatchID}-${item.receiptNo}`}><td><strong>{item.receiptNo}</strong><small className="d-block text-muted">{item.transactionStatus}</small></td><td>{date(item.completionTime)}</td><td>{item.payer || "-"}<small className="d-block text-muted">{item.accountNo || "No account reference"}</small></td><td><strong>KES {money(item.amount)}</strong></td><td><span className={`badge ${item.used ? "bg-success" : "bg-warning text-dark"}`}>{item.used ? "Used" : "Unused"}</span></td><td>{item.orderNO || "-"}</td></tr>)}</tbody></table></div></>}</>;
}

export default function PaymentReconciliationPage() {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false), [refreshKey, setRefreshKey] = useState(0);
  const upload = async (event) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; setUploading(true); try { const response = await importDeliveredOrderPayments(file); notify.success(response.Message); setRefreshKey((value) => value + 1); } catch (error) { notify.error(error.message); } finally { setUploading(false); } };
  return <div className="content"><div className="page-header"><div className="page-title"><h4>COD Payment Reconciliation</h4><h6>Review statement batches and match delivered orders</h6></div><div className="d-flex gap-2"><Link href="/admin/reports/delivered-orders" className="btn btn-outline-secondary">Back to Delivered Orders</Link><input ref={inputRef} className="d-none" type="file" accept=".xls,.xlsx" onChange={upload} /><button className="btn btn-primary" disabled={uploading} onClick={() => inputRef.current?.click()}>{uploading ? "Uploading..." : "Upload M-Pesa statement"}</button></div></div><div className="card"><div className="card-body"><ReconciliationBatches refreshKey={refreshKey} /></div></div></div>;
}
