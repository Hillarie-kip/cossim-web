
"use client"
import {
  ChevronUp,
  RotateCcw,
  Download,
  PlusCircle,
} from "feather-icons-react";
import React, { useEffect, useState } from "react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { OverlayTrigger, Tooltip, Badge } from "react-bootstrap";
import Link from "@/components/Link";
import { all_routes } from "@/Router/all_routes";
import Datatable from "@/core/pagination/datatable";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import RowActionsDropdown from "@/components/RowActionsDropdown";
import { useAdmin } from "@/hooks/useAdmin";
import { RoleType } from "@/constants/user-roles";
import notify from "@/lib/toast";

const RidersList = () => {
  const route = all_routes;
  const { usersByRole, pagination, fetchUsersByRole, loading, error } = useAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    if (size && size !== pageSize) {
      setPageSize(size);
    }
  };

  // Fetch riders on component mount
  useEffect(() => {
    fetchUsersByRole({
      RoleTypeCode: RoleType.RIDER,
      PageNO: currentPage,
      PageSize: pageSize,
      SearchTerm: searchTerm,
    });
  }, [fetchUsersByRole, currentPage, pageSize, searchTerm]);

  const MySwal = withReactContent(Swal);
  const showConfirmationAlert = () => {
    MySwal.fire({
      title: "Are you sure?",
      text: "This will remove the rider!",
      showCancelButton: true,
      confirmButtonColor: "#00ff00",
      confirmButtonText: "Yes, delete it!",
      cancelButtonColor: "#ff0000",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        notify.success("Rider removed.");
      }
    });
  };

  const columns = [
    {
      title: "Full Name",
      dataIndex: "FullName",
      render: (_, record) => (
        <span>{record.FirstName} {record.LastName}</span>
      ),
      sorter: (a, b) => (a.FullName || "").localeCompare(b.FullName || ""),
    },
    {
      title: "Email",
      dataIndex: "EmailAddress",
      render: (email) => email || "N/A",
      sorter: (a, b) => (a.EmailAddress || "").localeCompare(b.EmailAddress || ""),
    },
    {
      title: "Phone",
      dataIndex: "PhoneNumber",
      render: (phone) => phone || "N/A",
    },
    {
      title: "User Code",
      dataIndex: "UserCode",
      render: (userCode) => userCode || "N/A",
    },
    {
      title: "Status",
      dataIndex: "StatusID",
      render: (StatusID) => (
        <Badge bg={StatusID === 1 ? "success" : "danger"}>
          {StatusID === 1 ? "Active" : "Inactive"}
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
            { key: 'view', label: 'View', icon: 'feather-eye', href: `/admin/riders/${record.UserCode}` },
            { key: 'manifest', label: 'Manifest', icon: 'feather-file-text', href: `/admin/riders/${record.UserCode}/manifest` },
            { key: 'edit', label: 'Edit', icon: 'feather-edit', href: `/admin/riders/edit/${record.UserCode}` },
            { key: 'delete', label: 'Delete', icon: 'feather-trash-2', onClick: showConfirmationAlert },
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
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Riders</h4>
              <h6>Manage your riders</h6>
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
                <Link data-bs-toggle="tooltip" data-bs-placement="top">
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
            <Link to="/admin/riders/add" className="btn btn-added">
              <PlusCircle className="me-2 iconsize" />
              Add New Rider
            </Link>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-top">
              <div className="search-set">
                <input 
                  type="text" 
                  placeholder="Search riders..." 
                  className="form-control form-control-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {loading && (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            {!loading && !error && (
              <div className="table-responsive">
                <Datatable
                  columns={columns}
                  dataSource={usersByRole}
                  pagination={{
                    current: pagination.currentPage || currentPage,
                    pageSize: pagination.pageSize || pageSize,
                    total: pagination.totalItems || 0,
                    showSizeChanger: true,
                    pageSizeOptions: ['50', '100', '200', '500'],
                    onChange: handlePageChange,
                    onShowSizeChange: handlePageChange,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default RidersList;
