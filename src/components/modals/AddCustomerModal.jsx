"use client"
import React, { useState, useEffect } from "react";
import SSRSelect from "@/components/SSRSelect";
import { useAdmin } from "@/hooks/useAdmin";

const AddCustomerModal = ({ show, onClose, onSubmit, currentUserId }) => {
  const [form, setForm] = useState({
    customerName: "",
    phoneNumber: "",
    emailAddress: "",
    preferredDCCode: "",
    addedBy: currentUserId || "",
    locationarray: [
      {
        vendorCustomerAddressCode: "",
        vendorCustomerCode: "",
        customerAddressDCCode: "",
        addressLine: "",
        landmark: "",
        isDefault: true,
        addedBy: currentUserId || ""
      }
    ]
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
  const dcOptions = distributionCenters.filter(dc => dc.DistributionCenterTypeID === 300).map(dc => ({
    value: dc.DCCode,
    label: `${dc.CityName} ${dc.DCCode} - ${dc.DCName}`
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // address handlers support multiple addresses
  const handleAddressChange = (index) => (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setForm((prev) => ({
      ...prev,
      locationarray: prev.locationarray.map((loc, i) => i === index ? { ...loc, [name]: val } : loc)
    }));
  };

  const addAddress = () => {
    setForm((prev) => ({
      ...prev,
      locationarray: [
        ...prev.locationarray,
        {
          vendorCustomerAddressCode: "",
          vendorCustomerCode: "",
          customerAddressDCCode: "",
          addressLine: "",
          landmark: "",
          isDefault: false,
          addedBy: currentUserId || ""
        }
      ]
    }));
  };

  const removeAddress = (index) => {
    setForm((prev) => {
      const locations = prev.locationarray.filter((_, i) => i !== index);
      if (locations.length === 0) {
        locations.push({
          vendorCustomerAddressCode: "",
          vendorCustomerCode: "",
          customerAddressDCCode: "",
          addressLine: "",
          landmark: "",
          isDefault: true,
          addedBy: currentUserId || ""
        });
      }
      if (!locations.some(l => l.isDefault)) locations[0].isDefault = true;
      return { ...prev, locationarray: locations };
    });
  };

  const setDefaultAddress = (index) => {
    setForm((prev) => ({
      ...prev,
      locationarray: prev.locationarray.map((loc, i) => ({ ...loc, isDefault: i === index }))
    }));
  };

  const handleDCSelectChange = (idx) => (selectedOption, actionMeta) => {
    setForm((prev) => ({
      ...prev,
      locationarray: prev.locationarray.map((loc, i) => i === idx ? { ...loc, customerAddressDCCode: selectedOption?.value || "" } : loc)
    }));
  };

  const handleSubmit = async (e) => {
    // Avoid triggering any parent form submit
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        addedBy: currentUserId || form.addedBy || "system",
        locationarray: form.locationarray.map(loc => ({ ...loc, addedBy: currentUserId || loc.addedBy || "" }))
      };
      const result = await onSubmit(payload);
      if (!result?.success) return;
      setForm({
        customerName: "",
        phoneNumber: "",
        emailAddress: "",
        preferredDCCode: "",
        addedBy: currentUserId || "",
        locationarray: [
          {
            vendorCustomerAddressCode: "",
            vendorCustomerCode: "",
            customerAddressDCCode: "",
            addressLine: "",
            landmark: "",
            isDefault: true,
            addedBy: currentUserId || ""
          }
        ]
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
            <h5 className="modal-title">Register New Customer</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p style={{ color: "#a85b2a" }}>Register a new customer with contact and address information.</p>
            {/* Use a form container but avoid native submission to prevent parent form GET */}
            <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <div className="row g-2">
                <div className="col-12 mb-3">
                  <label className="form-label">Customer Name *</label>
                  <input 
                    name="customerName" 
                    value={form.customerName} 
                    onChange={handleChange} 
                    className="form-control" 
                    placeholder="Full Name" 
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
                  <label className="form-label">Email Address</label>
                  <input 
                    name="emailAddress" 
                    type="email"
                    value={form.emailAddress} 
                    onChange={handleChange} 
                    className="form-control" 
                    placeholder="customer@example.com" 
                  />
                </div>

                <div className="col-12 mb-3">
                  <h6>Address Information</h6>
                </div>
                {form.locationarray.map((loc, idx) => (
                  <React.Fragment key={idx}>
                    <div className="col-6 mb-3">
                      <label className="form-label">Nearest Pickup Point *</label>
                      <SSRSelect
                        name="customerAddressDCCode"
                        value={dcOptions.find(option => option.value === loc.customerAddressDCCode) || null}
                        onChange={handleDCSelectChange(idx)}
                        options={dcOptions}
                        placeholder="Select Distribution Center..."
                        isLoading={dcLoading}
                        isSearchable={true}
                        isClearable={true}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        instanceId={`customerAddressDCCode-select-${idx}`}
                      />
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label">Address Line *</label>
                      <input
                        name="addressLine"
                        value={loc.addressLine}
                        onChange={handleAddressChange(idx)}
                        className="form-control"
                        placeholder="Street address"
                        required={idx === 0}
                      />
                    </div>
                    <div className="col-8 mb-3">
                      <label className="form-label">Landmark</label>
                      <input
                        name="landmark"
                        value={loc.landmark}
                        onChange={handleAddressChange(idx)}
                        className="form-control"
                        placeholder="Nearby landmark"
                      />
                    </div>
                    <div className="col-4 mb-3 d-flex align-items-center gap-2">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id={`default-${idx}`}
                          name="isDefault"
                          checked={!!loc.isDefault}
                          onChange={() => setDefaultAddress(idx)}
                        />
                        <label className="form-check-label" htmlFor={`default-${idx}`}>Default</label>
                      </div>
                      {form.locationarray.length > 1 && (
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => removeAddress(idx)}>Remove</button>
                      )}
                    </div>
                  </React.Fragment>
                ))}
                <div className="col-12 mb-3">
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={addAddress}>Add Address</button>
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-light" onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
                <button type="button" onClick={handleSubmit} className="btn btn-primary" style={{ background: "#e97b3a", border: "none" }} disabled={submitting}>
                  <span className="me-2"><i className="fa fa-plus" /></span>
                  {submitting ? 'Registering...' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCustomerModal;
