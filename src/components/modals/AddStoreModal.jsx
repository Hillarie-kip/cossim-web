"use client"
import React, { useState, useEffect } from "react";
import SSRSelect from "@/components/SSRSelect";
import { useAdmin } from "@/hooks/useAdmin";

const AddStoreModal = ({ show, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    vendorStoreName: "",
    vendorStorePhone: "",
    vendorStoreAddress: "",
    primaryDCCode: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Use admin hook to fetch distribution centers for the primary DC select
  const { distributionCenters, fetchDistributionCenters, loading: dcLoading } = useAdmin();

  useEffect(() => {
    if (show) {
      fetchDistributionCenters();
    }
  }, [show, fetchDistributionCenters]);

  const dcOptions = distributionCenters.map((dc) => ({
    value: dc.DCCode,
    label: `${dc.DCCode} - ${dc.DCName}${dc.CityName ? ` (${dc.CityName})` : ""}`,
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (selectedOption) => {
    setForm((prev) => ({ ...prev, primaryDCCode: selectedOption?.value || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit(form);

      // Reset form on success
      setForm({
        vendorStoreName: "",
        vendorStorePhone: "",
        vendorStoreAddress: "",
        primaryDCCode: "",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
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
            <h5 className="modal-title">Add New Store</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p style={{ color: "#a85b2a" }}>Add a new pickup/drop-off store for this vendor.</p>
            <form onSubmit={handleSubmit}>
              <div className="row g-2">
                <div className="col-12 mb-3">
                  <label className="form-label">Store Name *</label>
                  <input
                    name="vendorStoreName"
                    value={form.vendorStoreName}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Store Name"
                    required
                  />
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label">Store Phone</label>
                  <input
                    name="vendorStorePhone"
                    value={form.vendorStorePhone}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="07xxxxxxxx"
                  />
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label">Primary Distribution Center</label>
                  <SSRSelect
                    name="primaryDCCode"
                    value={dcOptions.find((option) => option.value === form.primaryDCCode) || null}
                    onChange={handleSelectChange}
                    options={dcOptions}
                    placeholder="Select Distribution Center..."
                    isLoading={dcLoading}
                    isSearchable={true}
                    isClearable={true}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    instanceId="add-store-primaryDCCode-select"
                  />
                </div>
                <div className="col-12 mb-3">
                  <label className="form-label">Store Address</label>
                  <textarea
                    name="vendorStoreAddress"
                    value={form.vendorStoreAddress}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Street, building, landmark..."
                    rows={2}
                  />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-light" onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: "#e97b3a", border: "none" }} disabled={submitting}>
                  <span className="me-2"><i className="fa fa-plus" /></span>
                  {submitting ? "Creating..." : "Create Store"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStoreModal;
