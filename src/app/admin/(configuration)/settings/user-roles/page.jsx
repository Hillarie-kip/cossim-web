"use client"
import React, { useState, useEffect } from "react";
import { RotateCcw, Eye, Edit, Trash2 } from "feather-icons-react";
import { OverlayTrigger, Tooltip, Badge } from "react-bootstrap";
import Link from "@/components/Link";
import { all_routes } from "@/Router/all_routes";
import Datatable from "@/core/pagination/datatable";
import { useAdmin } from "@/hooks/useAdmin";

const UserRolesList = () => {

  // State management
  const [searchTerm, setSearchTerm] = useState("");

  // Use admin hook for API calls
  const {
    systemRoles,
    loading,
    error,
    fetchSystemRoles,
  } = useAdmin();

  // Fetch roles on component mount
  useEffect(() => {
    fetchSystemRoles();
  }, [fetchSystemRoles]);

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter roles based on search term
  const filteredRoles = systemRoles.filter(role =>
    role.RoleTypeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.RoleTypeCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get status badge variant
  const getStatusBadgeVariant = (role) => {
    return role.IsVendorApplicableRole === 1 ? "success" : "secondary";
  };

  // Get status text
  const getStatusText = (role) => {
    return role.IsVendorApplicableRole === 1 ? "Vendor Applicable" : "System Only";
  };

  // Define table columns
  const columns = [
    {
      title: "Role Code",
      dataIndex: "RoleTypeCode",
      sorter: (a, b) => a.RoleTypeCode?.localeCompare(b.RoleTypeCode),
    },
    {
      title: "Role Name",
      dataIndex: "RoleTypeName",
      sorter: (a, b) => a.RoleTypeName?.localeCompare(b.RoleTypeName),
    },
    {
      title: "Description",
      dataIndex: "Description",
      render: (_, record) => record.Description || "No description available",
    },
    {
      title: "Vendor Applicable",
      dataIndex: "IsVendorApplicableRole",
      render: (isVendorApplicable, record) => (
        <Badge bg={getStatusBadgeVariant(record)}>
          {getStatusText(record)}
        </Badge>
      ),
      sorter: (a, b) => a.IsVendorApplicableRole - b.IsVendorApplicableRole,
    },
    {
      title: "Actions",
      render: (_, record) => (
        <div className="d-flex align-items-center">
          <OverlayTrigger placement="top" overlay={<Tooltip>View Details</Tooltip>}>
            <Link
              to="#"
              className="btn btn-sm btn-outline-primary me-2"
              onClick={() => handleViewRole(record)}
            >
              <Eye size={14} />
            </Link>
          </OverlayTrigger>
          <OverlayTrigger placement="top" overlay={<Tooltip>Edit Role</Tooltip>}>
            <Link
              to="#"
              className="btn btn-sm btn-outline-warning me-2"
              onClick={() => handleEditRole(record)}
            >
              <Edit size={14} />
            </Link>
          </OverlayTrigger>
          <OverlayTrigger placement="top" overlay={<Tooltip>Delete Role</Tooltip>}>
            <Link
              to="#"
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleDeleteRole(record)}
            >
              <Trash2 size={14} />
            </Link>
          </OverlayTrigger>
        </div>
      ),
    },
  ];

  // Handle view role
  const handleViewRole = (role) => {
    console.log('Viewing role:', role);
    // TODO: Implement view role modal/details page
  };

  // Handle edit role
  const handleEditRole = (role) => {
    console.log('Editing role:', role);
    // TODO: Implement edit role modal
  };

  // Handle delete role
  const handleDeleteRole = (role) => {
    console.log('Deleting role:', role);
    // TODO: Implement delete role confirmation and API call
  };

  // Render refresh tooltip
  const renderRefreshTooltip = (
    <Tooltip>Refresh Roles</Tooltip>
  );

  return (
    <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>User Roles</h4>
              <h6>Manage system user roles and permissions</h6>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            {/* Search and Actions */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center">
                <div className="input-group" style={{ maxWidth: "300px" }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search roles..."
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                  <button className="btn btn-outline-secondary" type="button">
                    <i className="fa fa-search" />
                  </button>
                </div>
              </div>
              <div className="d-flex align-items-center">
                <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
                  <Link
                    className="btn btn-outline-primary me-2"
                    onClick={() => fetchSystemRoles()}
                    disabled={loading}
                  >
                    <RotateCcw size={16} className={loading ? "rotate" : ""} />
                  </Link>
                </OverlayTrigger>
                <Link
                  to="#"
                  className="btn btn-primary"
                  onClick={() => console.log('Add new role')}
                >
                  <i className="fa fa-plus me-2"></i>
                  Add Role
                </Link>
              </div>
            </div>

            {/* Roles Table */}
            <div className="table-responsive">
              {(() => {
                if (loading) {
                  return (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading roles...</p>
                    </div>
                  );
                }

                if (error) {
                  return (
                    <div className="text-center py-4">
                      <div className="text-danger">
                        <i className="fa fa-exclamation-triangle fa-3x mb-3"></i>
                        <h5>Error Loading Roles</h5>
                        <p>{error}</p>
                        <button
                          className="btn btn-primary mt-2"
                          onClick={() => fetchSystemRoles()}
                        >
                          <RotateCcw size={16} className="me-2" />
                          Try Again
                        </button>
                      </div>
                    </div>
                  );
                }

                if (systemRoles.length === 0) {
                  return (
                    <div className="text-center py-4">
                      <div className="text-muted">
                        <i className="fa fa-users fa-3x mb-3"></i>
                        <h5>No Roles Found</h5>
                        <p>There are no system roles available at the moment.</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <Datatable
                    columns={columns}
                    dataSource={filteredRoles}
                    rowKey="RoleTypeCode"
                    pagination={{
                      current: 1,
                      pageSize: filteredRoles.length,
                      total: filteredRoles.length,
                      showSizeChanger: false,
                      showQuickJumper: false,
                      showTotal: (total, range) =>
                        `Showing ${range[0]}-${range[1]} of ${total} roles`,
                    }}
                  />
                );
              })()}
            </div>

            {/* Summary */}
            {!loading && !error && systemRoles.length > 0 && (
              <div className="mt-3 text-muted">
                <small>
                  Total Roles: {systemRoles.length} |
                  Vendor Applicable: {systemRoles.filter(role => role.IsVendorApplicableRole === 1).length} |
                  System Only: {systemRoles.filter(role => role.IsVendorApplicableRole === 0).length} |
                  Filtered: {filteredRoles.length}
                </small>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default UserRolesList;
