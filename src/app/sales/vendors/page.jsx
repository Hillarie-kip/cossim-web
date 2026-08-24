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
import { all_routes } from "@/Router/all_routes";
import Datatable from "@/core/pagination/datatable";
import RowActionsDropdown from "@/components/RowActionsDropdown";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import vendorService from "@/services/vendorService";
import SSRSelect from "@/components/SSRSelect";
import { useVendors } from "@/hooks/useVendors";
import { AddVendorModal, EditVendorModal } from "@/components/modals";
import notify from "@/lib/toast";

const VendorsList = () => {
  const route = all_routes;
  const MySwal = withReactContent(Swal);
  
  // State management
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  
  // Use vendors hook
  const {
    vendors,
    totalCount,
    loading,
    error,
    fetchVendors,
    updateVendor: updateVendorHook
  } = useVendors({
    pageNo: currentPage,
    pageSize: pageSize,
    searchTerm: searchTerm || undefined
  });

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page
  };

  // Handle add vendor
  const handleAddVendor = async (data) => {
    try {
      const response = await vendorService.createVendor({
        ...data,
        countryCode: '254',
      });
      if (response && !response.Error) {
        setShowAddModal(false);
        notify.success("Vendor created successfully.");
        fetchVendors(); // Refresh the list
      } else {
        notify.error(response?.Message || "Failed to create vendor");
      }
    } catch (error) {
      notify.error(error.message || "Failed to create vendor");
    }
  };

  // Handle edit vendor
  const handleEditVendor = (vendor) => {
    setSelectedVendor(vendor);
    setShowEditModal(true);
  };

  // Handle update vendor
  const handleUpdateVendor = async (data) => {
    try {
      await updateVendorHook(data);
      setShowEditModal(false);
      setSelectedVendor(null);
      notify.success("Vendor updated successfully.");
    } catch (error) {
      notify.error(error.message || "Failed to update vendor");
    }
  };

  // Handle vendor deactivation
  const handleDeactivateVendor = async (vendorCode) => {
    try {
      const result = await MySwal.fire({
        title: "Are you sure?",
        text: "This will deactivate the vendor!",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        confirmButtonText: "Yes, deactivate it!",
        cancelButtonColor: "#6c757d",
        cancelButtonText: "Cancel",
      });

      if (result.isConfirmed) {
        const response = await vendorService.deactivateVendor({ vendorCode });
        if (response && !response.Error) {
          notify.success("Vendor has been deactivated.");
          fetchVendors(); // Refresh the list
        } else {
          notify.error(response?.Message || "Failed to deactivate vendor");
        }
      }
    } catch (error) {
      console.error('Error deactivating vendor:', error);
      notify.error(error.message || "Failed to deactivate vendor");
    }
  };

  // Get status badge
  const getStatusBadge = (statusID) => {
    return statusID === 1 ? "success" : "danger";
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Table columns configuration
  const columns = [
    {
      title: "Vendor Code",
      dataIndex: "vendorCode",
      sorter: (a, b) => a.vendorCode.localeCompare(b.vendorCode),
    },
    {
      title: "Vendor Name",
      dataIndex: "vendorName",
      sorter: (a, b) => a.vendorName.localeCompare(b.vendorName),
    },
    {
      title: "Contact Name",
      dataIndex: "contactName",
      sorter: (a, b) => a.contactName.localeCompare(b.contactName),
    },
    {
      title: "Phone/Email",
      dataIndex: "contact",
      render: (_, record) => (
        <>
          <div>{record.phoneNumber || "N/A"}</div>
          <div><span className="text-muted">{record.emailAddress || "N/A"}</span></div>
        </>
      ),
    },
    {
      title: "Service Fee",
      dataIndex: "isServiceFeeMandatory",
      render: (isServiceFeeMandatory) => isServiceFeeMandatory ? "Yes" : "No",
    },
    {
      title: "DC",
      dataIndex: "defaultDCCode",
      render: (_, record) => (
        <>
          <div>{record.DCName || "N/A"}</div>
          <div><span className="text-muted">{record.defaultDCCode || "N/A"}</span></div>
        </>
      )
    },
    {
      title: "Status",
      dataIndex: "statusID",
      render: (statusID) => (
        <Badge bg={getStatusBadge(statusID)}>
          {statusID === 1 ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      title: "Date Added",
      dataIndex: "dateAdded",
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.dateAdded) - new Date(b.dateAdded),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => (
        <RowActionsDropdown
          id={`dropdown-${record.vendorCode}`}
          items={[
            { key: 'view', label: 'View', icon: 'feather-eye', href: `/sales/vendors/${record.vendorCode}` },
            { key: 'edit', label: 'Edit', icon: 'feather-edit', onClick: () => handleEditVendor(record) },
            { key: 'customers', label: 'Customers', icon: 'feather-users', href: `/sales/vendors/${record.vendorCode}/customers` },
            record.statusID === 1 && { key: 'deactivate', label: 'Deactivate', icon: 'feather-slash', onClick: () => handleDeactivateVendor(record.vendorCode) },
          ]}
        />
      ),
    },
  ];

  // Tooltip render functions
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
      <AddVendorModal 
        show={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSubmit={handleAddVendor} 
      />
      <EditVendorModal 
        show={showEditModal} 
        onClose={() => {
          setShowEditModal(false);
          setSelectedVendor(null);
        }} 
        onSubmit={handleUpdateVendor}
        vendor={selectedVendor}
      />
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Vendors</h4>
                <h6>Manage vendor accounts and information</h6>
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
                    onClick={() => fetchVendors()}
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
                onClick={() => setShowAddModal(true)}
              >
                <PlusCircle className="me-2 iconsize" />
                Add New Vendor
              </button>
            </div>
          </div>

          <div className="card table-list-card">
            <div className="card-body">
              <div className="table-top">
                <div className="search-set">
                  <input 
                    type="text" 
                    placeholder="Search vendors..." 
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
                    dataSource={vendors}
                    pagination={{
                      current: currentPage,
                      pageSize: pageSize,
                      total: totalCount,
                      showSizeChanger: true,
                      pageSizeOptions: ['50', '100', '200', '500'],
                      onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                      }
                    }}
                    rowKey={"vendorCode"}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
    </React.Fragment>
  );
};

export default VendorsList;
