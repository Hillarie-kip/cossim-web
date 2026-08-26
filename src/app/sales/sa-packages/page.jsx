"use client"
import {
  ChevronUp,
  RotateCcw,
  PlusCircle,
  Send,
  Target,
  Printer,
  UploadCloud,
  RefreshCw,
} from "feather-icons-react";
import React, { useEffect, useState } from "react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import notify from "@/lib/toast";
import Link from "@/components/Link";
import RowActionsDropdown from "@/components/RowActionsDropdown";
import { all_routes } from "@/Router/all_routes";
import Datatable from "@/core/pagination/datatable";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import { ImportExcelModal, UpdateStatusModal, BulkUpdateStatusModal } from "@/components/modals";
import useShipment from "@/hooks/useShipment";
import useStickerDownload from "@/hooks/useStickerDownload";
import { useUser } from "@/hooks/useUser";

const PackagesList = () => {
  const route = all_routes;
  const [searchTerm, setSearchTerm] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [showBulkUpdateStatusModal, setShowBulkUpdateStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Sticker download hook
  const { showSizeSelectionModal, showBulkSizeSelectionModal, isGenerating } = useStickerDownload();

  const { user } = useUser();

  const {
    loading,
    error,
    shipmentOrders,
    pagination,
    fetchShipmentOrders,
    clearError,
    updateParams,
    handleUpdateShipmentStatus,
    handleUpdateShipmentStatusBatch
  } = useShipment();

  // Fetch shipment orders on component mount
  useEffect(() => {
    if (user?.UserCode) {
      fetchShipmentOrders({
        pageNo: 1,
        pageSize: 100,
        searchTerm: "",
        onlyActive: false,
        userCode: user.UserCode
      });
    }
  }, [user?.UserCode, fetchShipmentOrders]);

  // Handle search functionality
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Debounced search - update params which will trigger refetch
    const delayDebounceFn = setTimeout(() => {
      updateParams({ searchTerm: value, pageNo: 1 });
      fetchShipmentOrders({
        pageNo: 1,
        pageSize: 100,
        searchTerm: value,
        onlyActive: false,
        userCode: user?.UserCode
      });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  };

  // Handle refresh
  const handleRefresh = () => {
    setSearchTerm("");
    fetchShipmentOrders({
      pageNo: 1,
      pageSize: 100,
      searchTerm: "",
      onlyActive: false,
      userCode: user?.UserCode
    });
  };

  const reloadOrders = () => {
    fetchShipmentOrders({
      pageNo: pagination.currentPage,
      pageSize: pagination.pageSize,
      searchTerm,
      onlyActive: false,
      userCode: user?.UserCode
    });
  };

  // Handle update status modal
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
      const response = await handleUpdateShipmentStatus(payload);
      if (response?.Error) {
        throw new Error(response.Message || 'Failed to update status');
      }
      return response;
    } catch (error) {
      console.error('Failed to update status:', error);
      throw error;
    }
  };

  const handleStatusUpdateSuccess = async (orderNO) => {
    if (!orderNO) return;

    setSearchTerm(orderNO);
    updateParams({ searchTerm: orderNO, pageNo: 1 });
    await fetchShipmentOrders({
      pageNo: 1,
      pageSize: pagination.pageSize || 100,
      searchTerm: orderNO,
      onlyActive: false,
      userCode: user?.UserCode,
    });
  };

  // Handle bulk update status modal
  const selectedOrders = (shipmentOrders || []).filter(order => selectedRowKeys.includes(order.OrderNO));

  const handleBulkUpdateStatus = () => {
    if (selectedOrders.length === 0) return;
    setShowBulkUpdateStatusModal(true);
  };

  const handleCloseBulkUpdateStatusModal = () => {
    setShowBulkUpdateStatusModal(false);
  };

  const handleBulkUpdateStatusSubmit = async (batchOrders) => {
    try {
      await handleUpdateShipmentStatusBatch(batchOrders);
      setSelectedRowKeys([]);
      reloadOrders();
    } catch (error) {
      console.error('Failed to update bulk status:', error);
    }
  };

  // Handle download sticker
  const handleDownloadSticker = (record) => {
    // Convert the record to match PackageSticker expected format
    const packageData = {
      ...record,
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

  const handleBulkDownloadStickers = () => {
    if (!selectedRowKeys || selectedRowKeys.length === 0) return;
    
    // Get the full records for the selected keys
    const selectedPackages = shipmentOrders.filter(order => 
      selectedRowKeys.includes(order.OrderNO)
    ).map(record => ({
      ...record,
      OrderNO: record.OrderNO,
      CustomerName: record.CustomerName,
      CustomerPhone: record.CustomerPhone,
      CustomerAddress: record.CustomerAddress,
      VendorName: record.VendorName,
      VendorPhone: record.VendorPhone,
      DeliveryType: record.DeliveryType,
      StatusID: record.StatusID,
      DateAdded: record.DateAdded
    }));

    showBulkSizeSelectionModal(selectedPackages);
  };

  const MySwal = withReactContent(Swal);
  const showConfirmationAlert = () => {
    MySwal.fire({
      title: "Are you sure?",
      text: "This will remove the package!",
      showCancelButton: true,
      confirmButtonColor: "#00ff00",
      confirmButtonText: "Yes, delete it!",
      cancelButtonColor: "#ff0000",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        notify.success("Package removed.");
      }
    });
  };

  const columns = [
    {
      title: "Order NO",
      dataIndex: "OrderNO",
      sorter: (a, b) => a.OrderNO.localeCompare(b.OrderNO),
    },

    {
      title: "Sender",
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
      title: "Receiver",
      dataIndex: "ReceiverContactName",
      sorter: (a, b) => {
        const codeCompare = a.ReceiverContactPhone.localeCompare(b.ReceiverContactPhone);
        if (codeCompare !== 0) return codeCompare;
        return a.ReceiverContactName.localeCompare(b.ReceiverContactName);
      },
      render: (text, record) => {
        if (!record.ReceiverContactName && !record.ReceiverContactPhone) {
          return <span>-</span>;
        }
        return (
          <div style={{ maxWidth: '200px' }} className="text-truncate" title={`${record.ReceiverContactName || "-"} (${record.ReceiverAddress || "-"}) - ${record.ReceiverContactPhone || "-"}`}>
            <div>{record.ReceiverContactName || "-"}</div>
            <small className="text-muted">{record.ReceiverContactPhone || "-"}</small>
          </div>
        );
      },
    },
    {
      title: "Amount",
      dataIndex: "ServiceFee",
      render: (text, record) => {
        // ServiceFee and CODAmount
        const serviceFee = record.ServiceFee ? parseFloat(record.ServiceFee).toFixed(2) : "0.00";
        const codAmount = record.CODAmount ? parseFloat(record.CODAmount).toFixed(2) : "0.00";
        return (
          <div>
            <div>Fee: {serviceFee}</div>
            <div>COD: {codAmount}</div>
          </div>
        );
      }
    },

    {
      title: "Route",
      dataIndex: "OriginDCCode",
      sorter: (a, b) => {
        const originCompare = a.OriginDCName.localeCompare(b.OriginDCName);
        if (originCompare !== 0) return originCompare;
        return a.DestinationDCName.localeCompare(b.DestinationDCName);
      },
      render: (text, record) => {
        const inTransit =
          record.LatestLogDCName &&
          record.LatestLogDCName !== record.DestinationDCName &&
          record.LatestLogDCName !== record.OriginDCName;
        return (
          <div title={record.RouteInfo || undefined}>
            <div className="d-flex align-items-center mb-1">
              <Send size={14} className="text-primary me-1" />
              <span className="ms-1 fw-medium">{record.OriginDCName}</span>
            </div>
            <div className="d-flex align-items-center">
              <Target size={14} className="text-success me-1" />
              <span className="ms-1 fw-medium">{record.DestinationDCName} <span>{record.ReceiverBuilding && (<>({record.ReceiverBuilding})</>)}</span></span>
            </div>
            {inTransit && (
              <small className="text-muted">Currently at: {record.LatestLogDCName}</small>
            )}
          </div>
        );
      },
    },
    {
      title: "Date Added",
      dataIndex: "DateAdded",
      sorter: (a, b) => new Date(a.DateAdded) - new Date(b.DateAdded),
      render: (text) => {
        if (!text) return "-";
        // Parse UTC date and convert to local time
        const utcDate = new Date(text + "Z");
        return (
          <div>
            <div>{utcDate.toLocaleDateString()}</div>
            <small className="text-muted">{utcDate.toLocaleTimeString()}</small>
          </div>
        );
      },
    },
    {
      title: "Added By",
      dataIndex: "AddedBy",
      sorter: (a, b) => a.AddedBy.localeCompare(b.AddedBy),
    },
    {
      title: "Status",
      dataIndex: "StatusID",
      sorter: (a, b) => a.StatusID.localeCompare(b.StatusID),
      render: (text, record) => {
        const getStatusBadgeClass = (statusCode) => {
          switch (statusCode) {
            // 100 Vendor
            case 101: // VENDOR_CREATED
              return "badge bg-primary"; // blue
            case 102: // VENDOR_READY_FOR_PICKUP
              return "badge bg-info"; // cyan
            case 103: // VENDOR_HANDED_TO_DC
              return "badge bg-dark"; // dark gray

            // 200 Inbound / DC transfer
            case 201: // INBOUND_TO_DC
              return "badge bg-warning text-dark"; // amber
            case 202: // ARRIVED_AT_DC
              return "badge bg-success"; // green
            case 206: // DC_HOLD_FOR_TRANSFER
              return "badge bg-secondary"; // gray
            case 207: // DC_TRANSFER_BATCHED
              return "badge bg-light text-dark"; // white
            case 208: // DC_TRANSFER_DISPATCHED
              return "badge bg-primary"; // blue
            case 209: // DC_TRANSFER_INBOUND
              return "badge bg-info"; // cyan

            // 300 DC & QC
            case 301: // DC_QC_CHECK
              return "badge bg-warning text-dark";
            case 302: // DC_QC_PASSED
              return "badge bg-success";
            case 303: // DC_QC_FAILED
              return "badge bg-danger";
            case 304: // DC_STOCKED
              return "badge bg-dark";
            case 305: // DC_TRACKING_ASSIGNED
              return "badge bg-secondary";

            // 400 Assignment
            case 401: // ASSIGNED_TO_DELIVERY
              return "badge bg-primary";
            case 402: // ASSIGNED_FOR_PICKUP
              return "badge bg-info";
            case 403: // ASSIGNED_TO_PACK_CENTER
              return "badge bg-secondary";
            case 410: // DELIVERY_BATCHED
              return "badge bg-dark";

            // 500 Delivery
            case 501: // OUT_FOR_DELIVERY
              return "badge bg-warning text-dark";
            case 502: // DELIVERY_ATTEMPTED
              return "badge bg-info";
            case 503: // DELIVERED
              return "badge bg-success";
            case 504: // DELIVERY_WAITLIST
              return "badge bg-light text-dark";

            // 600 Pickup
            case 601: // PICKUP_READY
              return "badge bg-info";
            case 602: // PICKUP_PENDING_CUSTOMER
              return "badge bg-warning text-dark";
            case 603: // PICKED_UP
              return "badge bg-success";

            // 700 Return
            case 701: // RETURN_REQUESTED_BY_CUSTOMER
              return "badge bg-primary";
            case 702: // RETURN_IN_TRANSIT
              return "badge bg-warning text-dark";
            case 703: // RETURNED_TO_VENDOR
              return "badge bg-info";
            case 704: // RETURN_CLOSED
              return "badge bg-secondary";

            // 800 Payment
            case 801: // PAYMENT_INITIATED
              return "badge bg-info";
            case 802: // COD_COLLECTED
              return "badge bg-primary";
            case 803: // COD_REMITTED_TO_VENDOR
              return "badge bg-dark";
            case 804: // PAYMENT_CONFIRMED
              return "badge bg-success";
            case 805: // PAYMENT_FAILED
              return "badge bg-danger";

            // 900 Closed
            case 901: // CLOSED_SUCCESS
              return "badge bg-success";
            case 902: // CLOSED_CANCELLED
              return "badge bg-danger";
            case 903: // CLOSED_FAILED
              return "badge bg-dark";

            default:
              return "badge bg-secondary";
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
      render: (_, record) => (
        <RowActionsDropdown
          id={`dropdown-${record.ShipmentOrderID}`}
          variant="outline-secondary"
          items={[
            { key: 'view', label: 'View', icon: 'feather-eye', href: `/sales/sa-packages/${record.OrderNO}` },
            { key: 'track', label: 'Track', icon: 'feather-map-pin', href: `/sales/sa-packages/${record.OrderNO}/track?trackingNumber=${record.OrderNO}` },
            {
              key: 'print-sticker',
              label: isGenerating ? 'Preparing...' : 'Print Sticker',
              icon: 'feather-download',
              onClick: () => handleDownloadSticker(record),
              disabled: isGenerating,
            },
            { key: 'update-status', label: 'Update Status', icon: 'feather-refresh-cw', onClick: () => handleUpdateStatus(record) },
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
            <h4>Packages</h4>
            <h6>View and track packages from your referred vendors</h6>
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
        <div className="page-btn d-flex align-items-center">
          <button
            className="btn btn-outline-primary me-2 d-flex align-items-center"
            onClick={() => setShowImportModal(true)}
          >
            <UploadCloud className="me-2 iconsize" />
            Import Excel
          </button>
          <button
            className="btn btn-primary me-2 d-flex align-items-center"
            onClick={handleBulkDownloadStickers}
            disabled={isGenerating || selectedRowKeys.length === 0}
          >
            <Printer className="me-2 iconsize" />
            {isGenerating ? 'Preparing...' : `Print Stickers${selectedRowKeys.length > 0 ? ` (${selectedRowKeys.length})` : ''}`}
          </button>
          <button
            className="btn btn-outline-primary me-2 d-flex align-items-center"
            onClick={handleBulkUpdateStatus}
            disabled={selectedRowKeys.length === 0}
          >
            <RefreshCw className="me-2 iconsize" />
            {`Update Status${selectedRowKeys.length > 0 ? ` (${selectedRowKeys.length})` : ''}`}
          </button>
          <Link to="/sales/sa-packages/create" className="btn btn-added">
            <PlusCircle className="me-2 iconsize" />
            Create New Package
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

          {/* Loading State */}
          {loading && (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading shipment orders...</p>
            </div>
          )}

          {/* Error State */}
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

          {/* Table */}
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
                  pageSizeOptions: ['50', '100', '200', '500'],
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} items`,
                  onChange: (page, pageSize) => {
                    fetchShipmentOrders({
                      pageNo: page,
                      pageSize,
                      searchTerm,
                      onlyActive: false,
                      userCode: user?.UserCode
                    });
                  }
                }}
                rowKey="OrderNO"
                loading={loading}
                rowSelection={{
                  selectedRowKeys,
                  onChange: setSelectedRowKeys,
                }}
              />
            </div>
          )}

          {/* No Data State */}
          {!loading && !error && shipmentOrders?.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted">No packages found from your referred vendors.</p>
              <Link to="/sales/sa-packages/create" className="btn btn-primary">
                <PlusCircle className="me-2" size={16} />
                Create Your First Package
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Import Excel Modal */}
      <ImportExcelModal
        show={showImportModal}
        showVendorInput={true}
        onClose={() => setShowImportModal(false)}
        onUploadSuccess={() => {
          handleRefresh();
        }}
      />

      {/* Update Status Modal */}
      <UpdateStatusModal
        show={showUpdateStatusModal}
        onClose={handleCloseUpdateStatusModal}
        onSubmit={handleUpdateStatusSubmit}
        onSuccess={handleStatusUpdateSuccess}
        order={selectedOrder}
      />

      {/* Bulk Update Status Modal */}
      <BulkUpdateStatusModal
        show={showBulkUpdateStatusModal}
        onClose={handleCloseBulkUpdateStatusModal}
        onSubmit={handleBulkUpdateStatusSubmit}
        orders={selectedOrders}
      />
    </div>
  );
};

export default PackagesList;
