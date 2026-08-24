"use client";
import React, { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import SSRSelect from "@/components/SSRSelect";
import notify from "@/lib/toast";

const AddUserRoleModal = ({ show, onClose, onSubmit, userCode, currentRoles = [] }) => {
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Debug logging
  console.log('AddUserRoleModal props:', { show, userCode, currentRoles });

  // Get system roles for the dropdown
  const { systemRoles, fetchSystemRoles, loading: rolesLoading } = useAdmin();

  // Fetch system roles when modal opens
  useEffect(() => {
    if (show) {
      fetchSystemRoles();
    }
  }, [show, fetchSystemRoles]);

  // Initialize selected roles when modal opens
  useEffect(() => {
    if (show && currentRoles.length > 0) {
      setSelectedRoles(currentRoles.map(role => ({
        roleTypeCode: role.RoleTypeCode || role.roleTypeCode
      })));
    } else {
      setSelectedRoles([]);
    }
  }, [show, currentRoles]);

  const handleRoleChange = (selectedOptions) => {
    const userRoleArray = selectedOptions ? selectedOptions.map(option => ({
      roleTypeCode: option.value
    })) : [];
    setSelectedRoles(userRoleArray);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate userCode
    if (!userCode) {
      notify.error("User code is missing. Please try again.");
      return;
    }

    if (selectedRoles.length === 0) {
      notify.error("Please select at least one role for the user");
      return;
    }
    setSubmitting(true);

    const payload = {
      userCode: userCode,
      userRoleArray: selectedRoles
    };

    // Log the payload for debugging (remove in production)
    console.log('Add user role payload:', payload);

    try {
      await onSubmit(payload);
      onClose();
    } catch (error) {
      notify.error(error.message || "Failed to update user roles");
    } finally {
      setSubmitting(false);
    }
  };

  // Prepare role options for the select dropdown
  const roleOptions = systemRoles.map(role => ({
    value: role.RoleTypeCode,
    label: role.RoleTypeName
  }));

  // Get currently selected role options for the select component
  const selectedRoleOptions = roleOptions.filter(option =>
    selectedRoles.some(role => role.roleTypeCode === option.value)
  );

  if (!show) return null;

  // Don't render if userCode is not available
  if (!userCode) {
    return null;
  }

  return (
    <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,0.3)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ background: "#ffe5d0", borderRadius: 12 }}>
          <div className="modal-header">
            <h5 className="modal-title">Update User Roles</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p style={{ color: "#a85b2a" }}>Select the roles you want to assign to this user. This will update their permissions and access levels.</p>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">
                  User Roles *
                  {selectedRoles.length > 0 && (
                    <span className="text-muted ms-2">({selectedRoles.length} selected)</span>
                  )}
                </label>
                <SSRSelect
                  name="userRoleArray"
                  value={selectedRoleOptions}
                  onChange={handleRoleChange}
                  options={roleOptions}
                  placeholder="Select one or more roles..."
                  isLoading={rolesLoading}
                  isSearchable={true}
                  isMulti={true}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  instanceId="update-user-roles-select"
                  required
                />
                {selectedRoles.length > 0 && (
                  <div className="mt-2">
                    <small className="text-muted">
                      Selected roles: {selectedRoles.map(role => role.roleTypeCode).join(', ')}
                    </small>
                  </div>
                )}
                {currentRoles.length > 0 && (
                  <div className="mt-2">
                    <small className="text-info">
                      Current roles: {currentRoles.map(role => role.RoleTypeName || role.roleTypeCode).join(', ')}
                    </small>
                  </div>
                )}
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-light" onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: "#e97b3a", border: "none" }} disabled={submitting}>
                  <span className="me-2"><i className="fa fa-user-shield" /></span>
                  {submitting ? 'Updating...' : 'Update Roles'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUserRoleModal;
