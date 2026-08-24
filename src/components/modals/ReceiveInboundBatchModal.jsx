"use client";
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import SSRSelect from "@/components/SSRSelect";
import { PACKAGE_STATUSES } from "@/constants/package_status";

// Statuses that make sense to apply while receiving an inbound handover at a DC
const RECEIVE_STATUS_OPTIONS = [
  PACKAGE_STATUSES.ARRIVED_AT_DC,
].map((status) => ({
  value: status.orderStatusID,
  label: status.statusName,
  description: status.description,
}));

const DEFAULT_STATUS_ID = PACKAGE_STATUSES.ARRIVED_AT_DC.orderStatusID;

const ReceiveInboundBatchModal = ({
  show,
  onClose,
  onSubmit,
  handoverCode,
  dcCode,
  courierCode,
  batchCount,
  orders = [],
}) => {
  const [selectedStatus, setSelectedStatus] = useState(
    RECEIVE_STATUS_OPTIONS.find((o) => o.value === DEFAULT_STATUS_ID) || RECEIVE_STATUS_OPTIONS[0]
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset form whenever the modal opens with a new selection
  useEffect(() => {
    if (show) {
      setSelectedStatus(
        RECEIVE_STATUS_OPTIONS.find((o) => o.value === DEFAULT_STATUS_ID) || RECEIVE_STATUS_OPTIONS[0]
      );
      setNotes("");
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStatus || orders.length === 0) return;

    setSubmitting(true);
    try {
      const payload = {
        HandoverCode: handoverCode,
        StatusID: selectedStatus.value,
        DCCode: dcCode,
        CourierCode: courierCode,
        Notes: notes,
        Orders: orders.map((order) => ({
          OrderNO: order.OrderNO,
          HandoverCode: order.HandoverCode,
        })),
      };

      await onSubmit(payload);
      onClose();
    } catch (error) {
      console.error("Error receiving inbound batch:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,0.3)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {handoverCode || batchCount ? "Accept Batch" : "Acknowledge Receipt"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {handoverCode && <div className="mb-3">
              <strong>Handover Code:</strong> <span className="text-muted">{handoverCode}</span>
            </div>}
            {batchCount > 1 && <div className="mb-3">
              <strong>Selected batches:</strong> <span className="text-muted">{batchCount}</span>
            </div>}
            <div className="mb-3">
              <strong>Order Numbers:</strong>{" "}
              <span className="text-muted">
                {orders.slice(0, 5).map((o) => o.OrderNO).join(", ")}
                {orders.length > 5 ? ` +${orders.length - 5} more` : ""}
              </span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Receive As *</label>
                <SSRSelect
                  name="receiveStatus"
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  options={RECEIVE_STATUS_OPTIONS}
                  isSearchable={false}
                  isClearable={false}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  instanceId="receive-batch-status-select"
                  required
                />
                {selectedStatus?.description && (
                  <small className="text-muted">{selectedStatus.description}</small>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Notes (Optional)</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Add any notes about this receipt..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="alert alert-warning mb-3">
                {handoverCode || batchCount
                  ? "Any order not actually found in this handover will be marked as an exception. Submitting will close this handover batch."
                  : "Only the selected package IDs will be acknowledged as received."}
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-light" onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={submitting || !selectedStatus || orders.length === 0}
                >
                  {submitting ? "Accepting..." : `${handoverCode || batchCount ? "Accept Batch" : "Acknowledge Receipt"} (${orders.length})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiveInboundBatchModal;

ReceiveInboundBatchModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  handoverCode: PropTypes.string,
  dcCode: PropTypes.string,
  courierCode: PropTypes.string,
  batchCount: PropTypes.number,
  orders: PropTypes.arrayOf(
    PropTypes.shape({
      OrderNO: PropTypes.string,
      HandoverCode: PropTypes.string,
    })
  ),
};
