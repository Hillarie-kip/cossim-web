"use client"
import React, { useState, useEffect } from "react";
import SSRSelect from "@/components/SSRSelect";
import { useAdmin } from "@/hooks/useAdmin";

const EditUserModal = ({ show, onClose, onSubmit, user }) => {
  const [form, setForm] = useState({
    userCode: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    userImageID: "",
    distributionCenterCodes: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const { distributionCenters, fetchDistributionCenters } = useAdmin();

  useEffect(() => {
    if (show) fetchDistributionCenters({ pageNo: 1, pageSize: 1000 });
  }, [show, fetchDistributionCenters]);

  // Populate form from the row data when the modal opens
  useEffect(() => {
    if (show && user) {
      setForm({
        userCode: user.UserCode || user.userCode || "",
        firstName: user.FirstName || "",
        lastName: user.LastName || "",
        phoneNumber: user.PhoneNumber || "",
        email: user.EmailAddress || "",
        userImageID: user.UserImageID || "",
        distributionCenterCodes: (Array.isArray(user.AssignedDistributionCenter) ? user.AssignedDistributionCenter : []).map((dc) => dc.DCCode),
      });
    }
  }, [show, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (error) {
      // Error toast already shown by the useAdmin hook
    } finally {
      setSubmitting(false);
    }
  };

  if (!show || !user) return null;

  const dcOptions = (Array.isArray(distributionCenters) ? distributionCenters : [])
    .filter((dc) => dc.StatusID === undefined || Number(dc.StatusID) === 1)
    .map((dc) => ({ value: dc.DCCode, label: dc.DCName || dc.DCCode }));

  return (
    <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,0.3)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ background: "#ffe5d0", borderRadius: 12 }}>
          <div className="modal-header">
            <h5 className="modal-title">Edit User</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p style={{ color: "#a85b2a" }}>Update this user's profile information.</p>
            <form onSubmit={handleSubmit}>
              <div className="row g-2">
                <div className="col-12 mb-3">
                  <label className="form-label">Assigned Distribution Centers</label>
                  <SSRSelect
                    instanceId="edit-user-dc-select"
                    options={dcOptions}
                    value={dcOptions.filter((option) => form.distributionCenterCodes.includes(option.value))}
                    onChange={(selected) => setForm((previous) => ({ ...previous, distributionCenterCodes: (selected || []).map((option) => option.value) }))}
                    placeholder="Select one or more distribution centers"
                    isMulti
                    isSearchable
                    closeMenuOnSelect={false}
                    blurInputOnSelect={false}
                    hideSelectedOptions={false}
                    openMenuOnFocus
                    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                    styles={{ menuPortal: (base) => ({ ...base, zIndex: 10000 }) }}
                  />
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label">First Name *</label>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="John"
                    required
                  />
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label">Last Name *</label>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Doe"
                    required
                  />
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="user@example.com"
                  />
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label">Phone Number</label>
                  <input
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="712345678"
                  />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-light" onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: "#e97b3a", border: "none" }} disabled={submitting || !form.userCode}>
                  <span className="me-2"><i className="fa fa-edit" /></span>
                  {submitting ? 'Updating...' : 'Update User'}
                </button>
              </div>
              {!form.userCode && (
                <div className="mt-2">
                  <small className="text-danger">This user record is missing a User Code, so it cannot be updated.</small>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
