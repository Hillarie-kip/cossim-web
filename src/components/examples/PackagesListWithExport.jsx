"use client";

/**
 * EXAMPLE: How to use TableExportIcons in the Packages page
 * 
 * This file demonstrates the integration of the table export utility
 * into the existing packages list page with server-side pagination.
 */

import {
  ChevronUp,
  RotateCcw,
  PlusCircle,
} from "feather-icons-react";
import React, { useEffect, useState } from "react";
import { Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import Link from "@/components/Link";
import { all_routes } from "@/Router/all_routes";
import Datatable from "@/core/pagination/datatable";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import useShipment from "@/hooks/useShipment";
import useStickerDownload from "@/hooks/useStickerDownload";
import { UpdateStatusModal } from "@/components/modals";
import { PACKAGE_STATUSES } from "@/constants/package_status";

// Import the new export component
import TableExportIcons from "@/components/TableExportIcons";

const PackagesListWithExport = () => {
  const route = all_routes;
  const [searchTerm, setSearchTerm] = useState("");
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const { showSizeSelectionModal, isGenerating } = useStickerDownload();

  const {
    loading,
    error,
    shipmentOrders,
    pagination,
    fetchShipmentOrders,
    clearError,
    updateParams,
    handleUpdateShipmentStatus
  } = useShipment();

  useEffect(() => {
    fetchShipmentOrders({
      pageNo: 1,
      pageSize: 50,
      searchTerm: "",
      onlyActive: false
    });
  }, []);

  // Create a function to fetch ALL data for export (server-side pagination support)
  const fetchAllDataForExport = async () => {
    try {
      // Fetch all records by requesting a large page size
      const allData = await fetchShipmentOrders({
        pageNo: 1,
        pageSize: 10000, // Adjust based on your API's max limit
        searchTerm: searchTerm, // Include current search filter
        onlyActive: false
      });
      
      // Return the data array
      return allData;
    } catch (error) {
      console.error('Error fetching all data for export:', error);
      throw error;
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    const delayDebounceFn = setTimeout(() => {
      updateParams({ searchTerm: value, pageNo: 1 });
      fetchShipmentOrders({
        pageNo: 1,
        pageSize: 50,
        searchTerm: value,
        onlyActive: false
      });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  };

  const handleRefresh = () => {
    setSearchTerm("");
    fetchShipmentOrders({
      pageNo: 1,
      pageSize: 50,
      searchTerm: "",
      onlyActive: false
    });
  };

  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setShowUpdateStatusModal(true);
  };

  const handleCloseUpdateStatusModal = () => {
    setShowUpdateStatusModal(false);
    setSelectedOrder(null);
  };

  const handleUpdateStatusSubmit = async (payload) => {
    try {
      await handleUpdateShipmentStatus(payload);
      fetchShipmentOrders({
        pageNo: pagination.currentPage,
        pageSize: pagination.pageSize,
        searchTerm,
        onlyActive: false
      });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDownloadSticker = (record) => {
    const packageData = {
      OrderNO: record.OrderNO,
      CustomerName: record.CustomerName,
      CustomerPhone: record.CustomerPhone,
      CustomerAddress: record.CustomerAddress,
      VendorName: record.VendorName,
      VendorPhone: record.VendorPhone,
      DeliveryType: record.DeliveryType,
      StatusID: record.StatusID,
      DateAdded: record.DateAdded
    };
    
    showSizeSelectionModal(packageData);
  };

  // Define columns (same as before, but we can mark action column explicitly)
  const columns = [
    {
      title: "Order NO",
      dataIndex: "OrderNO",
      sorter: (a, b) => a.OrderNO.localeCompare(b.OrderNO),
    },
    {
      title: "Vendor",
      dataIndex: "VendorPhone",
      sorter: (a, b) => {
        const codeCompare = a.VendorPhone.localeCompare(b.VendorPhone);
        if (codeCompare !== 0) return codeCompare;
        return a.VendorName.localeCompare(b.VendorName);
      },
      render: (text, record) => (
        <div>
          <div>{record.VendorName}</div>
          <small className="text-muted">{record.VendorPhone}</small>
        </div>
      ),
    },
    {
      title: "Customer",
      dataIndex: "CustomerPhone",
      sorter: (a, b) => {
        const codeCompare = a.CustomerPhone.localeCompare(b.CustomerPhone);
        if (codeCompare !== 0) return codeCompare;
        return a.CustomerName.localeCompare(b.CustomerName);
      },
      render: (text, record) => (
        <div>
          <div>{record.CustomerName}({record.CustomerAddress})</div>
          <small className="text-muted">{record.CustomerPhone}</small>
        </div>
      ),
    },
    {
      title: "Origin",
      dataIndex: "OriginDCCode",
      sorter: (a, b) => {
        const codeCompare = a.OriginDCCode.localeCompare(b.OriginDCCode);
        if (codeCompare !== 0) return codeCompare;
        return a.OriginDCName.localeCompare(b.OriginDCName);
      },
      render: (text, record) => (
        <div>
          <div>{record.OriginDCCode}</div>
          <small className="text-muted">{record.OriginDCName}</small>
        </div>
      ),
    },
    {
      title: "Destination",
      dataIndex: "DestinationDCCode",
      sorter: (a, b) => {
        const codeCompare = a.DestinationDCCode.localeCompare(
          b.DestinationDCCode
        );
        if (codeCompare !== 0) return codeCompare;
        return a.DestinationDCName.localeCompare(b.DestinationDCName);
      },
      render: (text, record) => (
        <div>
          <div>{record.DestinationDCCode}</div>
          <small className="text-muted">{record.DestinationDCName}</small>
        </div>
      ),
    },
    {
      title: "Date Added",
      dataIndex: "DateAdded",
      sorter: (a, b) => new Date(a.DateAdded) - new Date(b.DateAdded),
      render: (text) => {
        if (!text) return "-";
        const date = new Date(text);
        return (
          <div>
            <div>{date.toLocaleDateString()}</div>
            <small className="text-muted">{date.toLocaleTimeString()}</small>
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "StatusID",
      sorter: (a, b) => a.StatusID.localeCompare(b.StatusID),
      render: (text, record) => {
        const getStatusBadgeClass = (statusCode) => {
          switch (statusCode) {
            case 101: return "badge bg-primary";
            case 102: return "badge bg-info";
            case 103: return "badge bg-dark";
            case 201: return "badge bg-warning text-dark";
            case 202: return "badge bg-success";
            case 503: return "badge bg-success";
            default: return "badge bg-secondary";
          }
        };

        return (
          <span className={getStatusBadgeClass(text)}>{record.StatusName}</span>
        );
      },
    },
    {
      title: "Action",
      dataIndex: "action",
      // This column will be automatically excluded from exports
      render: (_, record) => (
        <Dropdown>
          <Dropdown.Toggle variant="outline-secondary" size="sm">
            Actions
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item as={Link} to={`${route.packages}/${record.OrderNO}`}>
              <i className="feather-eye me-1" />
              View
            </Dropdown.Item>
            <Dropdown.Item as={Link} to={`${route.packages}/${record.OrderNO}/edit`}>
              <i className="feather-edit me-1" />
              Edit
            </Dropdown.Item>
            <Dropdown.Item 
              as={Link} 
              to="#" 
              onClick={() => handleDownloadSticker(record)}
            >
              <i className="feather-download me-1" />
              Print Sticker
            </Dropdown.Item>
            <Dropdown.Item as={Link} to="#" onClick={() => handleUpdateStatus(record)}>
              <i className="feather-refresh-cw me-1" />
              Update Status
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      ),
    },
  ];
  
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
            <h4>Packages</h4>
            <h6>Manage your packages</h6>
          </div>
        </div>
        
        <ul className="table-top-head">
          {/* 
            NEW: Replace the old PDF and Excel icons with TableExportIcons component
            This handles both exports with loading states and toast notifications
          */}
          <TableExportIcons
            data={shipmentOrders}
            columns={columns}
            filename="packages-export"
            title="Packages List"
            fetchAllData={fetchAllDataForExport} // Important for server-side pagination
            pdfOrientation="landscape"
            onExportSuccess={(format, result) => {
              console.log(`Successfully exported ${result.recordCount} packages as ${format}`);
            }}
          />
          
          {/* Keep your existing icons */}
          <li>
            <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
              <Link 
                data-bs-toggle="tooltip" 
                data-bs-placement="top"
                onClick={handleRefresh}
                style={{ cursor: 'pointer' }}
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
          <Link to={route.createPackage} className="btn btn-added">
            <PlusCircle className="me-2 iconsize" />
            Add New Package
          </Link>
        </div>
      </div>

      <div className="card table-list-card">
        <div className="card-body">
          <div className="table-top">
            <div className="search-set">
              <input 
                type="text" 
                placeholder="Search by Order NO, Vendor, DC, or Status" 
                className="form-control form-control-sm"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          
          {loading && (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading shipment orders...</p>
            </div>
          )}

          {error && (
            <div className="alert alert-danger" role="alert">
              <strong>Error:</strong> {error}
              <button 
                type="button" 
                className="btn-close float-end" 
                onClick={clearError}
                aria-label="Close"
              ></button>
            </div>
          )}

          {!loading && !error && (
            <div className="table-responsive">
              <Datatable 
                columns={columns} 
                dataSource={shipmentOrders} 
                pagination={{
                  current: pagination.currentPage,
                  total: pagination.totalItems,
                  pageSize: pagination.pageSize,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => 
                    `${range[0]}-${range[1]} of ${total} items`,
                  onChange: (page, pageSize) => {
                    fetchShipmentOrders({
                      pageNo: page,
                      pageSize,
                      searchTerm,
                      onlyActive: false
                    });
                  }
                }}
                rowKey="OrderNO"
                loading={loading}
              />
            </div>
          )}

          {!loading && !error && shipmentOrders?.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted">No shipment orders found.</p>
              <Link to={route.createPackage} className="btn btn-primary">
                <PlusCircle className="me-2" size={16} />
                Create Your First Package
              </Link>
            </div>
          )}
        </div>
      </div>

      <UpdateStatusModal
        show={showUpdateStatusModal}
        onClose={handleCloseUpdateStatusModal}
        onSubmit={handleUpdateStatusSubmit}
        order={selectedOrder}
      />
    </div>
  );
};

export default PackagesListWithExport;
