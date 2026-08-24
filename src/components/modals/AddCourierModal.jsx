"use client";
import React, { useEffect, useState } from "react";

const AddCourierModal = ({ show, onClose, onSubmit, isLoading }) => {
  const [form, setForm] = useState({ CourierCode: "", CourierName: "" });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      setForm({ CourierCode: "", CourierName: "" });
      setFormErrors({});
    }
  }, [show]);

  const validateForm = () => {
    const errors = {};

    if (!form.CourierCode.trim()) {
      errors.CourierCode = "Courier code is required";
    }

    if (!form.CourierName.trim()) {
      errors.CourierName = "Courier name is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        courierCode: form.CourierCode.trim().toUpperCase(),
        courierName: form.CourierName.trim(),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  const busy = submitting || isLoading;

  return (
    <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,0.3)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ background: "#ffe5d0", borderRadius: 12 }}>
          <div className="modal-header">
            <h5 className="modal-title">Add Courier</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={busy}
            ></button>
          </div>
          <div className="modal-body">
            <p style={{ color: "#a85b2a" }}>
              Register a new courier partner that can be assigned to handover batches.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Courier Code *</label>
                <input
                  name="CourierCode"
                  value={form.CourierCode}
                  onChange={handleChange}
                  className={`form-control ${formErrors.CourierCode ? "is-invalid" : ""}`}
                  placeholder="e.g., G4S"
                  disabled={busy}
                />
                {formErrors.CourierCode && (
                  <div className="invalid-feedback">{formErrors.CourierCode}</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Courier Name *</label>
                <input
                  name="CourierName"
                  value={form.CourierName}
                  onChange={handleChange}
                  className={`form-control ${formErrors.CourierName ? "is-invalid" : ""}`}
                  placeholder="e.g., G4S Courier"
                  disabled={busy}
                />
                {formErrors.CourierName && (
                  <div className="invalid-feedback">{formErrors.CourierName}</div>
                )}
              </div>

              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-light" onClick={onClose} disabled={busy}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: "#e97b3a", border: "none" }}
                  disabled={busy}
                >
                  {busy ? "Saving..." : "Add Courier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCourierModal;
