"use client";

import { useState } from "react";
import { Modal } from "react-bootstrap";
import { adjustShipmentCOD } from "@/services/shipmentService";
import notify from "@/lib/toast";

export default function AdjustCODModal({ order, onClose, onSuccess }) {
  const [amount, setAmount] = useState(String(order.CODAmount ?? order.CashOnDeliveryAmount ?? ""));
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    const value = Number(amount);
    if (amount.trim() === "" || !Number.isFinite(value) || value < 0 || !reason.trim()) return;
    setSubmitting(true);
    setError("");
    let result;
    try {
      result = await adjustShipmentCOD({ OrderNO: order.OrderNO, NewCODAmount: value, Reason: reason.trim() });
    } catch (error) {
      setError(error.response?.data?.Message || error.message || "Could not update COD.");
      setSubmitting(false);
      return;
    }
    notify.success("COD amount updated successfully.");
    onClose();
    onSuccess(result.Data?.NewCODAmount ?? value);
  };

  return (
    <Modal show onHide={() => !submitting && onClose()} centered backdrop={submitting ? "static" : true} keyboard={!submitting}>
      <form onSubmit={submit}>
        <Modal.Header closeButton={!submitting}><Modal.Title>Edit COD amount</Modal.Title></Modal.Header>
        <Modal.Body>
          <p><strong>{order.OrderNO}</strong><br />Current COD: KES {Number(order.CODAmount ?? order.CashOnDeliveryAmount ?? 0).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</p>
          <label className="form-label" htmlFor="adjust-cod-amount">New COD amount (KES)</label>
          <input id="adjust-cod-amount" className="form-control mb-3" type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={submitting} required />
          <label className="form-label" htmlFor="adjust-cod-reason">Reason for adjustment</label>
          <textarea id="adjust-cod-reason" className="form-control" rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Customer agreed a lower price at delivery" disabled={submitting} required />
          <small className="text-muted d-block mt-2">COD cannot be lower than verified payments or changed after vendor settlement.</small>
          {error && <div className="alert alert-danger mt-3 mb-0" role="alert">{error}</div>}
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-light" onClick={onClose} disabled={submitting}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting || !reason.trim() || amount.trim() === ""}>{submitting ? "Saving..." : "Save COD"}</button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
