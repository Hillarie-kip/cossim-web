"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ChevronUp,
  RotateCcw,
  PlusCircle,
  ArrowLeft,
} from "feather-icons-react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { OverlayTrigger, Tooltip, Badge } from "react-bootstrap";
import Link from "@/components/Link";
import Datatable from "@/core/pagination/datatable";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import { useAdmin } from "@/hooks/useAdmin";
import { AssignUserModal } from "@/components/modals";
import notify from "@/lib/toast";

const DCUsersPage = () => {
  const params = useParams();
  const dcCode = params.id;
  const {
    assignedUsers,
    pagination,
    loading,
    error,
    fetchDCAssignedUsers,
    handleDeactivateDCAssignedUser,
    handleAssignDCUser,
    updateParams,
    clearError,
    fetchUsers,
    users,
  } = useAdmin({ dcCode });

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch assigned users on mount and when dcCode changes
  useEffect(() => {
    if (dcCode) {
      fetchDCAssignedUsers({ dcCode, pageNo: 1, pageSize: 100 });
    }
  }, [dcCode, fetchDCAssignedUsers]);

  // Fetch a starter list of users once for the assign modal's select dropdown
  useEffect(() => {
    fetchUsers({ pageNo: 1, pageSize: 50 });
  }, [fetchUsers]);

  // Let the assign modal search the full user list server-side as the admin types
  const handleSearchUsers = (term) =>
    fetchUsers({ pageNo: 1, pageSize: 50, searchTerm: term });

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    updateParams({ searchTerm: value });
    fetchDCAssignedUsers({ dcCode, searchTerm: value, status: statusFilter, pageNo: 1 });
  };

  // Handle status filter
  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    updateParams({ status: value });
    fetchDCAssignedUsers({ dcCode, searchTerm, status: value, pageNo: 1 });
  };

  // Handle deactivate user
  const handleDeactivateUser = async (userId, userCode) => {
    const MySwal = withReactContent(Swal);
    MySwal.fire({
      title: "Are you sure?",
      text: `This will deactivate the assignment for ${userCode}!`,
      showCancelButton: true,
      confirmButtonColor: "#00ff00",
      confirmButtonText: "Yes, deactivate it!",
      cancelButtonColor: "#ff0000",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await handleDeactivateDCAssignedUser({
            distributionCenterUserID: userId,
            dcCode,
            userCode,
          });
          notify.success("User assignment deactivated.");
        } catch (error) {
          notify.error("Failed to deactivate user assignment.");
        }
      }
    });
  };

  // Handle assign user
  const handleAssignUser = async (assignmentData) => {
    try {
      setIsAssigning(true);
      await handleAssignDCUser(assignmentData);
      setShowAssignModal(false);
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchDCAssignedUsers({ dcCode });
  };

  const columns = [
    {
      title: "User ID",
      dataIndex: "AssignedUserCode",
      render: (code) => <strong>{code}</strong>,
      sorter: (a, b) => a.AssignedUserCode.localeCompare(b.AssignedUserCode),
    },
    {
      title: "Name",
      dataIndex: "FirstName",
      render: (_, record) => (
        <div>
          <div>
            <strong>{record.FirstName} {record.LastName}</strong>
          </div>
          <div className="text-muted">
            {record.DCName}
          </div>
        </div>
      ),
      sorter: (a, b) => `${a.FirstName} ${a.LastName}`.localeCompare(`${b.FirstName} ${b.LastName}`),
    },
    {
      title: "Email",
      dataIndex: "EmailAddress",
      render: (email) => email || <span className="text-muted">N/A</span>,
    },
    {
      title: "Phone",
      dataIndex: "PhoneNumber",
      render: (phone) => phone || <span className="text-muted">N/A</span>,
    },
    {
      title: "Status",
      dataIndex: "StatusID",
      render: (statusId) => (
        <Badge bg={statusId === 1 ? "success" : "danger"}>
          {statusId === 1 ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      title: "Assigned Date",
      dataIndex: "DateAdded",
      render: (date) => date ? new Date(date).toLocaleDateString() : <span className="text-muted">N/A</span>,
      sorter: (a, b) => new Date(a.DateAdded) - new Date(b.DateAdded),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => (
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip id={`tooltip-cta-${record.DistributionCenterUserID}`}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <button
                  className="mb-2 text-light btn btn-link p-0"
                  onClick={() => handleDeactivateUser(record.DistributionCenterUserID, record.AssignedUserCode)}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  Deactivate
                </button>
              </div>
            </Tooltip>
          }
          trigger={["click"]}
          rootClose
        >
          <button className="btn btn-sm btn-light" type="button">
            ...
          </button>
        </OverlayTrigger>
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
      <AssignUserModal
        show={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onSubmit={handleAssignUser}
        isLoading={isAssigning}
        dcCode={dcCode}
        users={users}
        onSearchUsers={handleSearchUsers}
      />
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>
                  <Link href={`/distribution-centers/${dcCode}`} className="me-2">
                    <ArrowLeft size={20} />
                  </Link>
                  DC Users - {dcCode}
                </h4>
                <h6>Manage users assigned to this distribution center</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <li>
                <OverlayTrigger placement="top" overlay={renderTooltip}>
                  <Link>
                    <ImageWithBasePath
                      src="assets/img/icons/pdf.svg"
                      alt="img"
                    />
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
                    onClick={handleRefresh}
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
              <button
                className="btn btn-added"
                type="button"
                onClick={() => setShowAssignModal(true)}
                disabled={loading}
              >
                <PlusCircle className="me-2 iconsize" />
                Assign User
              </button>
            </div>
          </div>

          <div className="card table-list-card">
            <div className="card-body">
              <div className="table-top">
                <div className="search-set">
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="form-control form-control-sm"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                <div className="search-set ms-2">
                  <select
                    className="form-select form-select-sm"
                    value={statusFilter}
                    onChange={(e) => handleStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <strong>Error:</strong> {error}
                  <button
                    className="btn btn-sm btn-outline-danger ms-2"
                    onClick={() => {
                      clearError();
                      handleRefresh();
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading assigned users...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Datatable
                    columns={columns}
                    dataSource={Array.isArray(assignedUsers) ? assignedUsers : assignedUsers?.Data || []}
                    pagination={{
                      current: pagination.currentPage,
                      pageSize: pagination.pageSize,
                      total: pagination.totalItems,
                      showSizeChanger: true,
                      pageSizeOptions: ['50', '100', '200', '500'],
                      showQuickJumper: true,
                      showTotal: (total, range) =>
                        `${range[0]}-${range[1]} of ${total} assigned users`,
                      onChange: (page, pageSize) => {
                        updateParams({ pageNo: page, pageSize });
                        fetchDCAssignedUsers({ dcCode, pageNo: page, pageSize, searchTerm, status: statusFilter });
                      },
                    }}
                    rowKey={'DistributionCenterUserID'}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
    </React.Fragment>
  );
};

export default DCUsersPage;
