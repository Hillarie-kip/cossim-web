"use client"
import React, { useState } from "react";

const AddProductModal = ({ show, onClose, onSubmit, currentUserId }) => {
  const [form, setForm] = useState({
    vendorProductName: "",
    isFragile: false,
    isPerishable: false,
    currentPrice: "",
    productValue: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Convert price and value to numbers
      const submitData = {
        ...form,
        currentPrice: parseFloat(form.currentPrice) || 0,
        productValue: parseFloat(form.productValue) || 0,
      };

      await onSubmit(submitData);

      // Reset form on success
      setForm({
        vendorProductName: "",
        isFragile: false,
        isPerishable: false,
        currentPrice: "",
        productValue: "",
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,0.3)" }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content" style={{ background: "#ffe5d0", borderRadius: 12 }}>
          <div className="modal-header">
            <h5 className="modal-title">Add New Product</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p style={{ color: "#a85b2a" }}>Add a new product to the vendor catalog.</p>
            <form onSubmit={handleSubmit}>
              <div className="row g-2">
                <div className="col-12 mb-3">
                  <label className="form-label">Product Name *</label>
                  <input
                    name="vendorProductName"
                    value={form.vendorProductName}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Product Name"
                    required
                  />
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label">Current Price (KES) *</label>
                  <input
                    name="currentPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.currentPrice}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label">Product Value (KES) *</label>
                  <input
                    name="productValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.productValue}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="col-6 mb-3">
                  <div className="form-check">
                    <input
                      name="isFragile"
                      type="checkbox"
                      checked={form.isFragile}
                      onChange={handleChange}
                      className="form-check-input"
                      id="isFragileCheck"
                    />
                    <label className="form-check-label" htmlFor="isFragileCheck">
                      Fragile Product
                    </label>
                  </div>
                </div>
                <div className="col-6 mb-3">
                  <div className="form-check">
                    <input
                      name="isPerishable"
                      type="checkbox"
                      checked={form.isPerishable}
                      onChange={handleChange}
                      className="form-check-input"
                      id="isPerishableCheck"
                    />
                    <label className="form-check-label" htmlFor="isPerishableCheck">
                      Perishable Product
                    </label>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-light" onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: "#e97b3a", border: "none" }} disabled={submitting}>
                  <span className="me-2"><i className="fa fa-plus" /></span>
                  {submitting ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;
