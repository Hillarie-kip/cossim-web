"use client"
import React, { useState, useEffect } from "react";
import SSRSelect from "@/components/SSRSelect";
import { useAdmin } from "@/hooks/useAdmin";

const EditCustomerModal = ({ show, onClose, onSubmit, customer, currentUserId }) => {
  const [form, setForm] = useState({
    customerName: "",
    phoneNumber: "",
    emailAddress: "",
    preferredDCCode: "",
    addedBy: currentUserId || ""
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

  // Populate form when customer data is available
  useEffect(() => {
    if (customer && show) {
      setForm({
        customerName: customer.customerName || "",
        phoneNumber: customer.phoneNumber || "",
        emailAddress: customer.emailAddress || "",
        preferredDCCode: customer.preferredDCCode || "",
        addedBy: currentUserId || ""
      });
    }
  }, [customer, show, currentUserId]);

  // Prepare options for the select dropdown
  const dcOptions = distributionCenters.filter(dc => dc.DistributionCenterTypeID === 300).map(dc => ({
    value: dc.DCCode,
    label: `${dc.CityName} ${dc.DCCode} - ${dc.DCName}`
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDCSelectChange = (selectedOption) => {
    setForm((prev) => ({ ...prev, preferredDCCode: selectedOption?.value || "" }));
  };

  const handleSubmit = async (e) => {
    // Avoid triggering any parent form submit
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();

    setSubmitting(true);
    try {
      const result = await onSubmit(form);
      if (!result || !result.success) return;

      // Reset form
      setForm({
        customerName: "",
        phoneNumber: "",
        emailAddress: "",
        preferredDCCode: "",
        addedBy: currentUserId || ""
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
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Customer</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={submitting}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="customerName" className="form-label">
                      Customer Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="customerName"
                      name="customerName"
                      value={form.customerName}
                      onChange={handleChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="phoneNumber" className="form-label">
                      Phone Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={form.phoneNumber}
                      onChange={handleChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="emailAddress" className="form-label">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="emailAddress"
                      name="emailAddress"
                      value={form.emailAddress}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="preferredDCCode" className="form-label">
                      Preferred Distribution Center
                    </label>
                    <SSRSelect
                      options={dcOptions}
                      value={dcOptions.find(option => option.value === form.preferredDCCode) || null}
                      onChange={handleDCSelectChange}
                      placeholder="Select distribution center..."
                      isLoading={dcLoading}
                      isDisabled={submitting}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !form.customerName.trim() || !form.phoneNumber.trim()}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Updating...
                  </>
                ) : (
                  "Update Customer"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditCustomerModal;
