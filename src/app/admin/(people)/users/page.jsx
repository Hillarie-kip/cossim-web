"use client"
import {
  ChevronUp,
  RotateCcw,
  PlusCircle,
} from "feather-icons-react";
import React, { useState, useEffect } from "react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { OverlayTrigger, Tooltip, Badge } from "react-bootstrap";
import Link from "@/components/Link";
import RowActionsDropdown from "@/components/RowActionsDropdown";
import { all_routes } from "@/Router/all_routes";
import Datatable from "@/core/pagination/datatable";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import { useAdmin } from "@/hooks/useAdmin";
import { AddUserModal } from "@/components/modals";
import { AddUserRoleModal } from "@/components/modals";
import { EditUserModal } from "@/components/modals";
import notify from "@/lib/toast";

const UsersList = () => {
  const route = all_routes;
  const MySwal = withReactContent(Swal);

  // State management
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleTypeCode, setSelectedRoleTypeCode] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Use admin hook for API calls
  const {
    users,
    loading,
    pagination,
    fetchUsers,
    handleRegisterUser,
    handleAddUserRole,
    handleUpdateUserInfo,
    systemRoles,
    fetchSystemRoles,
  } = useAdmin();

  // Fetch users on component mount and when pagination changes
  useEffect(() => {
    fetchUsers({
      pageNo: currentPage,
      pageSize: pageSize,
      searchTerm: searchTerm,
      roleTypeCode: selectedRoleTypeCode,
    });
  }, [currentPage, pageSize, searchTerm, selectedRoleTypeCode, fetchUsers]);

  // Fetch system roles on component mount
  useEffect(() => {
    fetchSystemRoles();
  }, [fetchSystemRoles]);

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page
  };

  // Handle add user
  const handleAddUser = async (userData) => {
    try {
      const { distributionCenterCodes = [], ...registrationData } = userData;
      const response = await handleRegisterUser({
        ...registrationData,
        assignedDistributionCenters: distributionCenterCodes.map((dcCode) => ({ dcCode, statusID: 1 })),
      });

      if (!response.Error) {
        setShowAddModal(false);
        notify.success("User created successfully.");

        await fetchUsers({
          pageNo: currentPage,
          pageSize: pageSize,
          searchTerm: searchTerm,
          roleTypeCode: selectedRoleTypeCode,
        });
      } else {
        notify.error(response.message || "Failed to create user");
      }
    } catch (error) {
      notify.error(error.message || "Failed to create user");
    }
  };

  // Handle manage roles
  const handleManageRoles = (user) => {

    // Validate that we have a valid identifier
    const userIdentifier = user?.UserCode || user?.userID;
    if (!userIdentifier) {
      notify.error("User identifier is missing. Cannot manage roles for this user.");
      return;
    }

    setSelectedUser(user);
    setShowRoleModal(true);
  };

  // Handle edit user (uses row data already loaded in the table, no detail fetch needed)
  const handleEditUser = (user) => {
    const userIdentifier = user?.UserCode || user?.userID;
    if (!userIdentifier) {
      notify.error("User identifier is missing. Cannot edit this user.");
      return;
    }

    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Handle edit user submission (handleUpdateUserInfo already toasts success/error and refreshes the list)
  const handleEditUserSubmit = async (userInfoData) => {
    const { distributionCenterCodes = [], ...profileData } = userInfoData;
    const selectedCodes = new Set(distributionCenterCodes);
    const existingAssignments = Array.isArray(selectedUser?.AssignedDistributionCenter)
      ? selectedUser.AssignedDistributionCenter
      : [];
    const existingCodes = new Set(existingAssignments.map((dc) => dc.DCCode || dc.dcCode).filter(Boolean));
    const assignedDistributionCenters = [
      ...distributionCenterCodes.map((dcCode) => ({ dcCode, statusID: 1 })),
      ...[...existingCodes]
        .filter((dcCode) => !selectedCodes.has(dcCode))
        .map((dcCode) => ({ dcCode, statusID: 0 })),
    ];

    await handleUpdateUserInfo({ ...profileData, assignedDistributionCenters });
    await fetchUsers({ pageNo: currentPage, pageSize, searchTerm, roleTypeCode: selectedRoleTypeCode });
    setShowEditModal(false);
  };

  // Handle add user role submission
  const handleAddUserRoleSubmit = async (roleData) => {
    try {
      await handleAddUserRole(roleData);
      notify.success("User roles updated successfully.");
      // Refresh the users list to show updated roles
      fetchUsers({
        pageNo: currentPage,
        pageSize: pageSize,
        searchTerm: searchTerm,
        roleTypeCode: selectedRoleTypeCode,
      });
    } catch (error) {
      notify.error(error.message || "Failed to update user roles");
    }
  };

  // Handle user deactivation (we'll implement this later when we have the API)
  const handleUserStatusToggle = async (userCode, currentStatus) => {
    const action = currentStatus === 1 ? 'deactivate' : 'activate';
    const result = await MySwal.fire({
      title: `Are you sure?`,
      text: `This will ${action} the user account.`,
      showCancelButton: true,
      confirmButtonColor: "#00ff00",
      confirmButtonText: `Yes, ${action}!`,
      cancelButtonColor: "#ff0000",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      // TODO: Implement user status toggle API call
      notify.success(`User ${action}d successfully.`);
    }
  };

  // Handle user deletion (we'll implement this later when we have the API)
  const handleUserDelete = async (userCode) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the user!",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Yes, delete it!",
      cancelButtonColor: "#6c757d",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      // TODO: Implement user deletion API call
      notify.success("User deleted successfully.");
    }
  };

  // Get status badge
  const getStatusBadge = (statusID) => {
    return statusID === 1 ? "success" : "danger";
  };

  // Get role display name
  const getRoleDisplay = (assignedRoles) => {
    const roles = Array.isArray(assignedRoles) ? assignedRoles : [];
    if (roles.length === 0) return "No Role";
    if (roles.length === 1) return roles[0]?.RoleTypeName || "No Role";
    return `${roles[0]?.RoleTypeName || "Role"} +${roles.length - 1}`;
  };

  // Format full name
  const getFullName = (user) => {
    return `${user.FirstName || ''} ${user.LastName || ''}`.trim() || 'N/A';
  };

  const columns = [
    {
      title: "User Code",
      dataIndex: "UserCode",
      sorter: (a, b) => String(a?.UserCode || "").localeCompare(String(b?.UserCode || "")),
    },
    {
      title: "Full Name",
      dataIndex: "fullName",
      render: (_, record) => getFullName(record),
      sorter: (a, b) => getFullName(a).localeCompare(getFullName(b)),
    },
    {
      title: "Contact",
      dataIndex: "EmailAddress",
      render: (_, record) => (
        <div>
          <div>{record.EmailAddress || "N/A"}</div>
          <div className="text-muted" style={{ fontSize: "0.9em" }}>
            {record.PhoneNumber || "N/A"}
          </div>
        </div>
      ),
      sorter: (a, b) => String(a?.EmailAddress || "").localeCompare(String(b?.EmailAddress || "")),
    },
    {
      title: "Roles",
      dataIndex: "AssignedRoles",
      render: (assignedRoles) => (
        <div className="d-flex flex-wrap">
          {Array.isArray(assignedRoles) && assignedRoles.length > 0 ? (
            assignedRoles.map((role, index) => (
              <Badge key={role?.RoleTypeCode || index} bg="primary" className="me-1 mb-1">
                {role?.RoleTypeName || "Role"}
              </Badge>
            ))
          ) : (
            <Badge bg="secondary">No Role</Badge>
          )}
        </div>
      ),
      width: '250px',
    },
    {
      title: "Vendor",
      dataIndex: "AssignedVendor",
      render: (assignedVendor) => assignedVendor?.VendorName || "N/A",
    },
    {
      title: "Status",
      dataIndex: "StatusID",
      render: (statusID) => (
        <Badge bg={getStatusBadge(statusID)}>
          {statusID === 1 ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => (
        <RowActionsDropdown
          id={`dropdown-${record.UserCode}`}
          items={[
            { key: 'view', label: 'View', icon: 'feather-eye', href: `/admin/users/${record.UserCode}` },
            { key: 'edit', label: 'Edit', icon: 'feather-edit', onClick: () => handleEditUser(record) },
            { key: 'manage-roles', label: 'Manage Roles', icon: 'feather-lock', onClick: () => handleManageRoles(record) },
            {
              key: 'toggle-status',
              label: record.StatusID === 1 ? 'Deactivate' : 'Activate',
              icon: `feather-${record.StatusID === 1 ? 'slash' : 'check'}`,
              onClick: () => handleUserStatusToggle(record.UserCode, record.StatusID),
            },
            { key: 'delete', label: 'Delete', icon: 'feather-trash', onClick: () => handleUserDelete(record.UserCode) },
          ]}
        />
      ),
    },
  ];

  const renderTooltip = (props) => (
    <Tooltip id="pdf-tooltip" {...props}>
      Pdf
    </Tooltip>
  );
  const renderExcelTooltip = (props) => (
    <Tooltip id="excel-tooltip" {...props}>
      Excel
    </Tooltip>
  );
  const renderRefreshTooltip = (props) => (
    <Tooltip id="refresh-tooltip" {...props}>
      Refresh
    </Tooltip>
  );
  const renderCollapseTooltip = (props) => (
    <Tooltip id="refresh-tooltip" {...props}>
      Collapse
    </Tooltip>
  );

  return (
    <React.Fragment>
      <AddUserModal show={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleAddUser} />
      <EditUserModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditUserSubmit}
        user={selectedUser}
        key={`edit-${selectedUser?.UserCode || selectedUser?.userID}`} // Force re-render when user changes
      />
      <AddUserRoleModal
        show={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onSubmit={handleAddUserRoleSubmit}
        userCode={selectedUser?.UserCode || selectedUser?.userID}
        currentRoles={Array.isArray(selectedUser?.AssignedRoles) ? selectedUser.AssignedRoles : []}
        key={selectedUser?.UserCode || selectedUser?.userID} // Force re-render when user changes
      />
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Users</h4>
              <h6>Manage system users</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <li>
              <OverlayTrigger placement="top" overlay={renderTooltip}>
                <Link>
                  <ImageWithBasePath src="assets/img/icons/pdf.svg" alt="img" />
                </Link>
              </OverlayTrigger>
            </li>
            <li>
              <OverlayTrigger placement="top" overlay={renderExcelTooltip}>
                <Link data-bs-toggle="tooltip" data-bs-placement="top">
                  <ImageWithBasePath
                    src="assets/img/icons/excel.svg"
                    alt="img"
                  />
                </Link>
              </OverlayTrigger>
            </li>
            <li>
              <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
                <Link
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  onClick={() => fetchUsers({ pageNo: currentPage, pageSize, searchTerm, roleTypeCode: selectedRoleTypeCode })}
                >
                  <RotateCcw />
                </Link>
              </OverlayTrigger>
            </li>
            <li>
              <OverlayTrigger placement="top" overlay={renderCollapseTooltip}>
                <Link
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  id="collapse-header"
                >
                  <ChevronUp />
                </Link>
              </OverlayTrigger>
            </li>
          </ul>
          <div className="page-btn">
            <button className="btn btn-added" type="button" onClick={() => setShowAddModal(true)}>
              <PlusCircle className="me-2 iconsize" />
              Add New User
            </button>
          </div>

        </div>

        <div className="card table-list-card">
          <div className="card-body">
            <div className="row mb-4 p-3">
              <div className="col-md-5">
                <div className="d-flex">
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="form-control form-control-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch(e.target.value);
                      }
                    }}
                  />
                  <button
                    className="btn btn-sm btn-primary ms-2"
                    onClick={() => handleSearch(searchTerm)}
                  >
                    Search
                  </button>
                </div>
              </div>
              <div className="col-md-4">
                <select
                  className="form-control form-control-sm"
                  value={selectedRoleTypeCode}
                  onChange={(e) => setSelectedRoleTypeCode(e.target.value)}
                >
                  <option value="">All Roles</option>
                  {systemRoles.map((role) => (
                    <option key={role.RoleTypeCode} value={role.RoleTypeCode}>
                      {role.RoleTypeName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <button
                  className="btn btn-sm btn-secondary w-100"
                  onClick={() => fetchUsers({
                    pageNo: 1,
                    pageSize: pageSize,
                    searchTerm: searchTerm,
                    roleTypeCode: selectedRoleTypeCode,
                  })}
                >
                  Apply Filters
                </button>
              </div>
            </div>
            <div className="table-responsive">
              {loading ? (
                <div className="text-center p-3">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <Datatable
                  columns={columns}
                  dataSource={users}
                  pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: pagination.totalItems,
                    showSizeChanger: true,
                    pageSizeOptions: ['50', '100', '200', '500'],
                    onChange: (page, size) => {
                      setCurrentPage(page);
                      setPageSize(size);
                    }
                  }}
                  rowKey={'UserCode'}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default UsersList;
