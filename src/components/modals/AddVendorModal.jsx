"use client"
import React, { useState, useEffect } from "react";
import SSRSelect from "@/components/SSRSelect";
import { useAdmin } from "@/hooks/useAdmin";

const AddVendorModal = ({ show, onClose, onSubmit, referralCode = "" }) => {
  const [form, setForm] = useState({
    vendorName: "",
    firstName: "",
    lastName: "",
    contactName: "",
    phoneNumber: "",
    emailAddress: "",
    defaultDCCode: "",
    countryCode: "",
    refferalCode: referralCode,
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

      // if error occurs with submission, do not reset form
      if (result.Error) return;

      setForm({
        vendorName: "",
        firstName: "",
        lastName: "",
        contactName: "",
        phoneNumber: "",
        emailAddress: "",
        defaultDCCode: "",
        refferalCode: referralCode, // Preserve the referral code
        countryCode: "",
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
            <h5 className="modal-title">Create New Vendor</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p style={{ color: "#a85b2a" }}>Create a new vendor with business and contact information.</p>
            <form onSubmit={handleSubmit}>
              <div className="row g-2">
                <div className="col-12 mb-3">
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
                <div className="col-6 mb-3">
                  <label className="form-label">First Name</label>
                  <input 
                    name="firstName" 
                    value={form.firstName} 
                    onChange={handleChange} 
                    className="form-control" 
                    placeholder="First Name" 
                  />
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label">Last Name</label>
                  <input 
                    name="lastName" 
                    value={form.lastName} 
                    onChange={handleChange} 
                    className="form-control" 
                    placeholder="Last Name" 
                  />
                </div>
                <div className="col-6 mb-3">
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
                {/* <div className="col-6 mb-3">
                  <label className="form-label">Country Code *</label>
                  <input 
                    name="countryCode" 
                    value={form.countryCode} 
                    onChange={handleChange} 
                    className="form-control" 
                    placeholder="Country Code" 
                    required 
                  />
                </div> */}
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
                  <label className="form-label">Default DC Code *</label>
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
                    required
                  />
                </div>
              
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-light" onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: "#e97b3a", border: "none" }} disabled={submitting}>
                  <span className="me-2"><i className="fa fa-plus" /></span> 
                  {submitting ? 'Creating...' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddVendorModal;
