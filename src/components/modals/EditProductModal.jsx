"use client"
import React, { useState, useEffect } from "react";

const EditProductModal = ({ show, onClose, onSubmit, product, currentUserId }) => {
  const [form, setForm] = useState({
    vendorProductName: "",
    isFragile: false,
    isPerishable: false,
    currentPrice: "",
    productValue: "",
    statusID: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  // Populate form when product changes
  useEffect(() => {
    if (product && show) {
      setForm({
        vendorProductName: product.vendorProductName || product.productName || "",
        isFragile: product.isFragile || false,
        isPerishable: product.isPerishable || false,
        currentPrice: product.currentPrice || product.price || "",
        productValue: product.productValue || "",
        statusID: product.statusID || product.isActive ? 1 : 0,
      });
    }
  }, [product, show]);

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
        vendorProductCode: product?.vendorProductCode || product?.id || ""
      };

      await onSubmit(submitData, product?.vendorProductCode || product?.id || "");
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
            <h5 className="modal-title">Edit Product</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p style={{ color: "#a85b2a" }}>Update product information.</p>
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
                  <label className="form-label">Current Price (KES)</label>
                  <input
                    name="currentPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.currentPrice}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="0.00"
                  />
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label">Product Value (KES)</label>
                  <input
                    name="productValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.productValue}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="0.00"
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
                      id="isFragileCheckEdit"
                    />
                    <label className="form-check-label" htmlFor="isFragileCheckEdit">
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
                      id="isPerishableCheckEdit"
                    />
                    <label className="form-check-label" htmlFor="isPerishableCheckEdit">
                      Perishable Product
                    </label>
                  </div>
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label">Status</label>
                  <select
                    name="statusID"
                    value={form.statusID}
                    onChange={handleChange}
                    className="form-control"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-light" onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: "#e97b3a", border: "none" }} disabled={submitting}>
                  <span className="me-2"><i className="fa fa-save" /></span>
                  {submitting ? 'Updating...' : 'Update Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProductModal;
