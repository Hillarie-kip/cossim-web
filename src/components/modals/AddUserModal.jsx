"use client";
import React, { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import SSRSelect from "@/components/SSRSelect";
import notify from "@/lib/toast";

const AddUserModal = ({ show, onClose, onSubmit, lockedRole = null }) => {
  const getInitialFormState = () => ({
    countryCode: "+254",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    emailAddress: "",
    userImage: "",
    distributionCenterCodes: [],
    userRoleArray: lockedRole?.roleTypeCode
      ? [{ roleTypeCode: lockedRole.roleTypeCode }]
      : [],
  });

  const [form, setForm] = useState({
    ...getInitialFormState(),
  });
  const [submitting, setSubmitting] = useState(false);

  // Get system roles for the dropdown
  const { systemRoles, distributionCenters, fetchSystemRoles, fetchDistributionCenters, loading: rolesLoading } = useAdmin();

  // Fetch system roles when modal opens
  useEffect(() => {
    if (show) {
      fetchSystemRoles();
      fetchDistributionCenters({ pageNo: 1, pageSize: 1000 });
    }
  }, [show, fetchSystemRoles, fetchDistributionCenters]);

  useEffect(() => {
    if (show) {
      setForm((prev) => ({
        ...prev,
        userRoleArray: lockedRole?.roleTypeCode
          ? [{ roleTypeCode: lockedRole.roleTypeCode }]
          : prev.userRoleArray,
      }));
    }
  }, [show, lockedRole]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (selectedOptions) => {
    if (lockedRole?.roleTypeCode) return;

    const userRoleArray = selectedOptions ? selectedOptions.map(option => ({
      roleTypeCode: option.value
    })) : [];
    setForm((prev) => ({ ...prev, userRoleArray }));
  };

  const dcOptions = (Array.isArray(distributionCenters) ? distributionCenters : [])
    .filter((dc) => dc.StatusID === undefined || Number(dc.StatusID) === 1)
    .map((dc) => ({ value: dc.DCCode, label: dc.DCName || dc.DCCode }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.userRoleArray.length === 0) {
      notify.error("Please select at least one role for the user");
      return;
    }
    setSubmitting(true);
    
    // Log the payload for debugging (remove in production)
    console.log('User registration payload:', form);
    
    try {
      const payload = lockedRole?.roleTypeCode
        ? {
            ...form,
            userRoleArray: [{ roleTypeCode: lockedRole.roleTypeCode }],
          }
        : form;

      await onSubmit(payload);
      // Reset form on success
      setForm(getInitialFormState());
    } catch (error) {
      notify.error(error.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  // Prepare role options for the select dropdown
  const roleOptions = systemRoles.map(role => ({
    value: role.RoleTypeCode,
    label: role.RoleTypeName
  }));

  if (!show) return null;
  return (
    <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,0.3)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ background: "#ffe5d0", borderRadius: 12 }}>
          <div className="modal-header">
            <h5 className="modal-title">Create New User</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p style={{ color: "#a85b2a" }}>Create a new user account with the specified role and permissions.</p>
            <form onSubmit={handleSubmit}>
              <div className="row g-2">
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
                  <label className="form-label">Email Address *</label>
                  <input
                    name="emailAddress"
                    type="email"
                    value={form.emailAddress}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="user@example.com"
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
                    placeholder="712345678"
                    required
                  />
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label">User Image URL</label>
                  <input
                    name="userImage"
                    value={form.userImage}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="https://example.com/image.jpg"
                    type="url"
                  />
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label">Country Code</label>
                  <input
                    name="countryCode"
                    value={form.countryCode}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="+254"
                  />
                </div>
                <div className="col-12 mb-3">
                  <label className="form-label">
                    Roles * 
                    {form.userRoleArray.length > 0 && (
                      <span className="text-muted ms-2">({form.userRoleArray.length} selected)</span>
                    )}
                  </label>
                  {lockedRole?.roleTypeCode ? (
                    <input
                      className="form-control"
                      value={`${lockedRole.roleTypeName || "Vendor Admin"} (${lockedRole.roleTypeCode})`}
                      disabled
                      readOnly
                    />
                  ) : (
                    <SSRSelect
                      name="userRoleArray"
                      value={roleOptions.filter(option =>
                        form.userRoleArray.some(role => role.roleTypeCode === option.value)
                      )}
                      onChange={handleRoleChange}
                      options={roleOptions}
                      placeholder="Select one or more roles..."
                      isLoading={rolesLoading}
                      isSearchable={true}
                      isMulti={true}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      instanceId="user-roles-select"
                      required
                    />
                  )}
                  {form.userRoleArray.length > 0 && (
                    <div className="mt-2">
                      <small className="text-muted">
                        Selected roles: {form.userRoleArray.map(role => role.roleTypeCode).join(', ')}
                      </small>
                    </div>
                  )}
                </div>
                <div className="col-12 mb-3">
                  <label className="form-label">Assigned Distribution Centers</label>
                  <SSRSelect
                    instanceId="new-user-dc-select"
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
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-light" onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: "#e97b3a", border: "none" }} disabled={submitting}>
                  <span className="me-2"><i className="fa fa-user-plus" /></span>
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;
