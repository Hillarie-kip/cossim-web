"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import notify from "@/lib/toast";
import {
  confirmShipmentOrderPayment,
  deleteShipmentOrderPayment,
  getShipmentOrderItems,
  getShipmentOrderPayment,
  getShipmentTimeline,
  saveShipmentOrderPayment,
} from "@/services/shipmentService";

const list = (response) => response?.Data || response?.data || [];
const money = (value) => `KES ${Number(value || 0).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
const paymentMethod = (code) => ({ "1": "M-Pesa", "2": "Cash", "3": "Vendor account" }[String(code)] || code || "Not specified");
const displayDate = (value) => value ? new Date(value).toLocaleString("en-GB") : "-";
const normalizePayment = (payment = {}) => ({
  ...payment,
  shipmentOrderPaymentID: payment.shipmentOrderPaymentID ?? payment.ShipmentOrderPaymentID ?? 0,
  paymentNO: payment.paymentNO ?? payment.PaymentNO ?? "",
  transactionID: payment.transactionID ?? payment.TransactionID ?? "",
  amountPaid: payment.amountPaid ?? payment.AmountPaid ?? 0,
  isVerified: payment.isVerified ?? payment.IsVerified ?? false,
  paymentMethodTypeCode: payment.paymentMethodTypeCode ?? payment.PaymentMethodTypeCode ?? "",
  dateAdded: payment.dateAdded ?? payment.DateAdded ?? null,
  addedBy: payment.addedBy ?? payment.AddedBy ?? "",
  addedByName: payment.addedByName ?? payment.AddedByName ?? "",
  verifiedBy: payment.verifiedBy ?? payment.VerifiedBy ?? "",
  verifiedAt: payment.verifiedAt ?? payment.VerifiedAt ?? null,
  verificationMethod: payment.verificationMethod ?? payment.VerificationMethod ?? "",
  matchedReceiptNo: payment.matchedReceiptNo ?? payment.MatchedReceiptNo ?? "",
});
const paymentList = (response) => list(response).map(normalizePayment);

export default function OrderExpandedDetails({ order }) {
  const [items, setItems] = useState(order.ShipmentOrderItems || []);
  const [payments, setPayments] = useState((order.ShipmentOrderPayment || order.shipmentOrderPayment || []).map(normalizePayment));
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const orderNO = order.OrderNO;

  const loadPayments = async () => setPayments(paymentList(await getShipmentOrderPayment({ orderNO })));

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      getShipmentOrderItems({ orderNO }),
      getShipmentOrderPayment({ orderNO }),
      getShipmentTimeline({ orderNo: orderNO }),
    ]).then(([itemResult, paymentResult, historyResult]) => {
      if (!active) return;
      if (itemResult.status === "fulfilled") setItems(list(itemResult.value));
      if (paymentResult.status === "fulfilled") setPayments(paymentList(paymentResult.value));
      if (historyResult.status === "fulfilled") setHistory(list(historyResult.value));
      setLoading(false);
    });
    return () => { active = false; };
  }, [orderNO]);

  const editPayment = async (payment = null) => {
    const { value } = await Swal.fire({
      title: payment ? "Edit payment" : "Add payment",
      html: `<div class="text-start"><label class="form-label">Transaction/reference *</label><input id="payment-ref" class="form-control" value="${payment?.transactionID || ""}"><label class="form-label mt-3">Amount *</label><input id="payment-amount" type="number" min="0.01" step="0.01" class="form-control" value="${payment?.amountPaid || order.CODAmount || ""}"><label class="form-label mt-3">Method *</label><select id="payment-method" class="form-select"><option value="1">M-Pesa</option><option value="2">Cash</option><option value="3">Vendor account</option></select></div>`,
      showCancelButton: true,
      confirmButtonText: "Save payment",
      didOpen: () => { document.getElementById("payment-method").value = String(payment?.paymentMethodTypeCode || 1); },
      preConfirm: () => {
        const transactionID = document.getElementById("payment-ref").value.trim();
        const amountPaid = Number(document.getElementById("payment-amount").value);
        if (!transactionID || amountPaid <= 0) return Swal.showValidationMessage("Enter a reference and valid amount");
        return { transactionID, amountPaid, paymentMethodTypeCode: Number(document.getElementById("payment-method").value) };
      },
    });
    if (!value) return;
    await saveShipmentOrderPayment({ shipmentOrderPaymentID: payment?.shipmentOrderPaymentID || 0, orderNO, isCODPayment: true, ...value });
    await loadPayments();
    notify.success("Payment saved");
  };

  const confirmPayment = async (payment) => {
    await confirmShipmentOrderPayment({ id: payment.shipmentOrderPaymentID, orderNO });
    await loadPayments();
    notify.success("Payment confirmed");
  };

  const removePayment = async (payment) => {
    const result = await Swal.fire({ title: "Delete payment?", text: payment.transactionID, icon: "warning", showCancelButton: true, confirmButtonText: "Delete", confirmButtonColor: "#dc3545" });
    if (!result.isConfirmed) return;
    await deleteShipmentOrderPayment({ id: payment.shipmentOrderPaymentID, orderNO });
    await loadPayments();
    notify.success("Payment deleted");
  };

  if (loading) return <div className="py-4 text-center"><span className="spinner-border spinner-border-sm" /></div>;
  return <div className="row g-3 p-2 bg-light text-dark">
    <section className="col-12 col-xl-4"><div className="bg-white border rounded-3 p-3 h-100"><h6>Items ({items.length})</h6>{items.length ? items.map((item, index) => <div className="border-bottom py-2" key={item.id || index}><strong className="d-block">{item.productName || item.itemCode || `Item ${index + 1}`}</strong><small className="text-muted">Weight: {item.weight || 0} kg · Value: {money(item.productValue)}</small></div>) : <p className="text-muted small mb-0">No items found.</p>}</div></section>
    <section className="col-12 col-xl-4"><div className="bg-white border rounded-3 p-3 h-100"><div className="d-flex justify-content-between align-items-center mb-2"><h6 className="mb-0">Payments ({payments.length})</h6><button className="btn btn-primary btn-sm" onClick={() => editPayment()}>Add payment</button></div>{payments.length ? payments.map((payment) => <div className="border rounded-3 p-3 mb-2" key={payment.shipmentOrderPaymentID}><div className="d-flex justify-content-between align-items-start gap-2 mb-2"><div><small className="text-muted d-block">Reference / transaction</small><strong className="text-break">{payment.transactionID || payment.paymentNO || "No reference"}</strong></div><span className={`badge ${payment.isVerified ? "bg-success" : "bg-warning text-dark"}`}>{payment.isVerified ? "Verified" : "Pending"}</span></div><div className="row g-2 small"><div className="col-6"><span className="text-muted d-block">Amount</span><strong>{money(payment.amountPaid)}</strong></div><div className="col-6"><span className="text-muted d-block">Payment method</span><strong>{paymentMethod(payment.paymentMethodTypeCode)}</strong></div><div className="col-6"><span className="text-muted d-block">Date added</span><span>{displayDate(payment.dateAdded)}</span></div><div className="col-6"><span className="text-muted d-block">Added by</span><span>{payment.addedByName || payment.addedBy || "Not recorded"}</span></div>{payment.matchedReceiptNo && <div className="col-6"><span className="text-muted d-block">Matched receipt</span><span>{payment.matchedReceiptNo}</span></div>}{payment.isVerified && <div className="col-6"><span className="text-muted d-block">Verified by</span><span>{payment.verifiedBy || "System / not recorded"}</span></div>}{payment.isVerified && payment.verifiedAt && <div className="col-12"><span className="text-muted d-block">Verified at</span><span>{displayDate(payment.verifiedAt)}{payment.verificationMethod ? ` · ${payment.verificationMethod.replaceAll("_", " ")}` : ""}</span></div>}</div><div className="d-flex gap-1 mt-3"><button className="btn btn-outline-primary btn-sm" onClick={() => editPayment(payment)}>Edit</button>{!payment.isVerified && <button className="btn btn-outline-success btn-sm" onClick={() => confirmPayment(payment)}>Confirm</button>}<button className="btn btn-outline-danger btn-sm" onClick={() => removePayment(payment)}>Delete</button></div></div>) : <p className="text-muted small mb-0 mt-3">No payment exists for this order.</p>}</div></section>
    <section className="col-12 col-xl-4"><div className="bg-white border rounded-3 p-3 h-100"><h6>History ({history.length})</h6><div style={{ maxHeight: 280, overflowY: "auto" }}>{history.length ? [...history].sort((a, b) => new Date(b.EventTime || b.DateAdded) - new Date(a.EventTime || a.DateAdded)).map((event, index) => <div className="border-bottom py-2" key={event.ShipmentTrackingEventID || index}><strong className="d-block">{event.StatusName || event.StatusCode || "Shipment update"}</strong><small className="text-muted">{new Date(event.EventTime || event.DateAdded).toLocaleString("en-GB")}</small>{event.Notes && <small className="d-block">{event.Notes}</small>}</div>) : <p className="text-muted small mb-0">No history found.</p>}</div></div></section>
  </div>;
}
