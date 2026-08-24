"use client"
import React, { useState, useEffect } from "react";
import SSRSelect from "@/components/SSRSelect";
import { useAdmin } from "@/hooks/useAdmin";

const EditVendorModal = ({ show, onClose, onSubmit, vendor }) => {
  const [form, setForm] = useState({
    vendorCode: "",
    vendorName: "",
    contactName: "",
    phoneNumber: "",
    emailAddress: "",
    defaultDCCode: "",
    isServiceFeeMandatory: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  // Use admin hook to fetch distribution centers
  const { distributionCenters, fetchDistributionCenters, loading: dcLoading } = useAdmin();

  // Fetch distribution centers when modal opens
  useEffect(() => {
    if (show) {
      fetchDistributionCenters();
    }
  }, [show, fetchDistributionCenters]);

  // Populate form when vendor data is available
  useEffect(() => {
    if (vendor && show) {
      setForm({
        vendorCode: vendor.vendorCode || "",
        vendorName: vendor.vendorName || "",
        contactName: vendor.contactName || "",
        phoneNumber: vendor.phoneNumber || "",
        emailAddress: vendor.emailAddress || "",
        defaultDCCode: vendor.defaultDCCode || "",
        isServiceFeeMandatory: vendor.isServiceFeeMandatory || 0,
      });
    }
  }, [vendor, show]);

  // Prepare options for the select dropdown
  const dcOptions = distributionCenters.filter(dc => dc.IsPrimary).map(dc => ({
    value: dc.DCCode,
    label: `${dc.DCCode} - ${dc.DCName} (${dc.CityName})`
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (selectedOption, actionMeta) => {
    if (actionMeta.name === 'defaultDCCode') {
      setForm((prev) => ({ ...prev, defaultDCCode: selectedOption?.value || "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit(form);
      setSubmitting(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,0.3)" }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content" style={{ background: "#ffe5d0", borderRadius: 12 }}>
          <div className="modal-header">
            <h5 className="modal-title">Edit Vendor</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p style={{ color: "#a85b2a" }}>Update vendor information and settings.</p>
            <form onSubmit={handleSubmit}>
              <div className="row g-2">
                <div className="col-6 mb-3">
                  <label className="form-label">Vendor Code *</label>
                  <input
                    name="vendorCode"
                    value={form.vendorCode}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Vendor Code"
                    required
                    readOnly
                  />
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label">Vendor Name *</label>
                  <input
                    name="vendorName"
                    value={form.vendorName}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Business Name"
                    required
                  />
                </div>
                <div className="col-12 mb-3">
                  <label className="form-label">Contact Name *</label>
                  <input
                    name="contactName"
                    value={form.contactName}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Contact Person"
                    required
                  />
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label">Phone Number *</label>
                  <input
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="07xxxxxxxx"
                    required
                  />
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label">Email Address *</label>
                  <input
                    name="emailAddress"
                    type="email"
                    value={form.emailAddress}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="vendor@example.com"
                    required
                  />
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label">Default DC Code</label>
                  <SSRSelect
                    name="defaultDCCode"
                    value={dcOptions.find(option => option.value === form.defaultDCCode) || null}
                    onChange={handleSelectChange}
                    options={dcOptions}
                    placeholder="Select Distribution Center..."
                    isLoading={dcLoading}
                    isSearchable={true}
                    isClearable={true}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    instanceId="defaultDCCode-select"
                  />
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label">Service Fee Mandatory</label>
                  <select
                    name="isServiceFeeMandatory"
                    value={form.isServiceFeeMandatory}
                    onChange={handleChange}
                    className="form-control"
                  >
                    <option value={0}>No</option>
                    <option value={1}>Yes</option>
                  </select>
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-light" onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: "#e97b3a", border: "none" }} disabled={submitting}>
                  <span className="me-2"><i className="fa fa-edit" /></span>
                  {submitting ? 'Updating...' : 'Update Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditVendorModal;
