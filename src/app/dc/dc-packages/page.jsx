"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, OverlayTrigger, Tooltip, Card } from 'react-bootstrap';
import {
  Package,
  Plus,
  Eye,
  Edit,
  MapPin,
  Truck,
  AlertCircle,
  RotateCcw,
  RefreshCw,
  ChevronUp
} from 'lucide-react';
import Link from "@/components/Link";
import RowActionsDropdown from "@/components/RowActionsDropdown";
import SSRSelect from "@/components/SSRSelect";
import { all_routes } from "@/Router/all_routes";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import { useShipment } from "@/hooks/useShipment";
import { getShipmentOrdersByDC } from "@/services/shipmentService";
import { useVendors } from "@/hooks/useVendors";
import useStickerDownload from "@/hooks/useStickerDownload";
import { DCOrderTypes } from "@/constants/constants";
import { UpdateStatusModal, BulkUpdateStatusModal } from "@/components/modals";
import Datatable from "@/core/pagination/datatable";
import DCSwitcher from '@/components/DCSwitcher';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { formatLocalDateOnly } from "@/lib/utils/dateFormat";
import TableExportIcons from "@/components/TableExportIcons";
import { createFetchAllDataFunction } from "@/utils/tableExport";
import { exportColumns, pdfColumns } from "./components/tableColumns";
import { readPackageDrilldownQuery } from "@/utils/packageDrilldownUtils";
import "./../dc-overview/dc-overview-styles.css";

const getVendorCode = (vendor) =>
  vendor?.vendorCode ||
  vendor?.VendorCode ||
  "";

const getVendorName = (vendor) =>
  vendor?.vendorName ||
  vendor?.VendorName ||
  vendor?.name ||
  vendor?.Name ||
  getVendorCode(vendor);

const getStatusName = (status) =>
  status?.statusName ||
  status?.StatusName ||
  status?.name ||
  status?.Name ||
  "";

const directionToOrderType = (direction) => {
  if (direction === "inbound") return DCOrderTypes.INBOUND;
  if (direction === "outbound") return DCOrderTypes.OUTBOUND;
  return undefined;
};

export default function DCPackages() {
  const route = all_routes;

  const [selectedStatusName, setSelectedStatusName] = useState("");
  const [direction, setDirection] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [vendorCode, setVendorCode] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [showBulkUpdateStatusModal, setShowBulkUpdateStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    const query = readPackageDrilldownQuery();
    setSelectedStatusName(query.statusName || "");
    setSearchInput(query.searchTerm || "");
    setSearchTerm(query.searchTerm || "");
    setVendorCode(query.vendorCode || "");
    setDirection(query.fromDCCode ? "outbound" : query.toDCCode ? "inbound" : "all");
    setStartDate(query.startDate || null);
    setEndDate(query.endDate || null);
  }, []);

  // Use the shipment hook
  const {
    fetchShipmentOrdersByDC,
    shipmentOrders,
    pagination,
    loading,
    error,
    dcCode,
    handleUpdateShipmentStatus,
    handleUpdateShipmentStatusBatch
  } = useShipment();
  const {
    orderStatuses,
    fetchShipmentOrderStatus,
  } = useShipment();
  const { vendors } = useVendors({ pageNo: 1, pageSize: 500 });

  const statusOptions = useMemo(
    () =>
      orderStatuses
        .map((status) => {
          const statusName = getStatusName(status);
          return statusName
            ? {
                value: statusName,
                label: statusName,
              }
            : null;
        })
        .filter(Boolean),
    [orderStatuses]
  );

  const vendorOptions = useMemo(
    () =>
      vendors
        .map((vendor) => {
          const code = getVendorCode(vendor);
          return code
            ? {
                value: code,
                label: `${getVendorName(vendor)} (${code})`,
              }
            : null;
        })
        .filter(Boolean),
    [vendors]
  );

  // Sticker download hook
  const { showSizeSelectionModal, isGenerating } = useStickerDownload();

  // Filter params shared between the regular paginated fetch and the "fetch everything" export path
  const buildPackageParams = useCallback((overrides = {}) => ({
    searchTerm: selectedStatusName || searchTerm || undefined,
    vendorCode: vendorCode || undefined,
    DCCode: dcCode,
    DCOrderType: directionToOrderType(direction),
    startDate: formatLocalDateOnly(startDate),
    endDate: formatLocalDateOnly(endDate),
    ...overrides,
  }), [dcCode, direction, selectedStatusName, searchTerm, vendorCode, startDate, endDate]);

  const fetchPackages = useCallback(async () => {
    if (!dcCode) return;

    try {
      await fetchShipmentOrdersByDC(buildPackageParams({ pageNo, pageSize }));
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  }, [dcCode, fetchShipmentOrdersByDC, buildPackageParams, pageNo, pageSize]);

  // Fetch shipment orders on component mount and whenever filters or pagination change
  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Fetch all data for export, in small batches instead of one huge request,
  // reporting progress back to the export UI as each batch completes.
  // Uses the stateless service call directly (not the hook's fetchShipmentOrdersByDC)
  // so the export batches don't overwrite the paginated data currently shown in the table.
  const fetchAllDataForExport = async (onProgress) => {
    try {
      const fetchInBatches = createFetchAllDataFunction(
        getShipmentOrdersByDC,
        buildPackageParams(),
        { chunkSize: 500 }
      );
      return await fetchInBatches(onProgress);
    } catch (error) {
      console.error('Error fetching all data for export:', error);
      // Fallback to current page data if fetch fails
      return shipmentOrders || [];
    }
  };

  useEffect(() => {
    fetchShipmentOrderStatus();
  }, [fetchShipmentOrderStatus]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle download sticker
  const handleDownloadSticker = (record) => {
    showSizeSelectionModal(record);
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
    if (!orderNO || !dcCode) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setSearchInput(orderNO);
    setSearchTerm(orderNO);
    setSelectedStatusName("");
    setDirection("all");
    setVendorCode("");
    setStartDate(null);
    setEndDate(null);
    setPageNo(1);

    await fetchShipmentOrdersByDC({
      DCCode: dcCode,
      pageNo: 1,
      pageSize,
      searchTerm: orderNO,
      startDate: "",
      endDate: "",
    });
  };

  const packagesData = useMemo(() => shipmentOrders || [], [shipmentOrders]);

  // Handle refresh
  const handleRefresh = async () => {
    setSearchInput("");
    setSearchTerm("");
    setVendorCode("");
    setSelectedStatusName("");
    setStartDate(null);
    setEndDate(null);
    setPageNo(1);
    fetchPackages();
  };

  const handleStatusFilterChange = (selected) => {
    setSelectedStatusName(selected?.value || "");
    setPageNo(1);
  };

  // Handle search functionality (debounced so it doesn't refetch on every keystroke)
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(value);
      setPageNo(1);
    }, 500);
  };

  const renderTooltip = (props, text) => (
    <Tooltip id="tooltip" {...props}>
      {text}
    </Tooltip>
  );



      const getStatusBadgeColor = (statusCode) => {
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
      return "badge-soft-secondary";
  }
};

  // Define table columns (shared across All/Inbound/Outbound views)
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
      title: "Receiver",
      dataIndex: "ReceiverContactPhone",
      sorter: (a, b) => {
        const codeCompare = (a.ReceiverContactPhone || "").localeCompare(b.ReceiverContactPhone || "");
        if (codeCompare !== 0) return codeCompare;
        return (a.ReceiverContactName || "").localeCompare(b.ReceiverContactName || "");
      },
      render: (text, record) => {
        const address = [record.ReceiverStreetName, record.ReceiverBuilding, record.ReceiverCity]
          .filter(Boolean)
          .join(", ");
        return (
          <div>
            <div>{record.ReceiverContactName || "-"}{address && ` (${address})`}</div>
            <small className="text-muted">{record.ReceiverContactPhone || "-"}</small>
          </div>
        );
      },
    },
    {
      title: "Origin",
      dataIndex: "OriginDCCode",
      sorter: (a, b) => a.OriginDCCode.localeCompare(b.OriginDCCode),
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
      sorter: (a, b) => a.DestinationDCCode.localeCompare(b.DestinationDCCode),
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
      render: (text) => new Date(text).toLocaleDateString(),
    },
    
    {
      title: "Status",
      dataIndex: "StatusID",
      sorter: (a, b) => (a.StatusID || 0) - (b.StatusID || 0),
      render: (text, record) => (
        <span className={`badge ${getStatusBadgeColor(record.StatusID)}`}>
          {record.StatusName}
        </span>
      ),
    },
    
    {
      title: "Actions",
      dataIndex: "action",
      render: (_, record) => (
        <RowActionsDropdown
          id={`dropdown-${record.ShipmentOrderID}`}
          variant="outline-secondary"
          items={[
            { key: 'view', label: 'View', icon: 'feather-eye', href: `/dc/dc-packages/${record.OrderNO}` },
            { key: 'track', label: 'Track', icon: 'feather-map-pin', href: `/dc/dc-packages/${record.OrderNO}/track?trackingNumber=${record.OrderNO}` },
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

  // Handle bulk update status modal
  const selectedOrders = packagesData.filter((pkg) => selectedRowKeys.includes(pkg.ShipmentOrderID));

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
      fetchPackages();
    } catch (error) {
      console.error('Failed to update bulk status:', error);
    }
  };

  const handleDirectionChange = (nextDirection) => {
    setDirection(nextDirection);
    setSelectedRowKeys([]);
    setPageNo(1);
  };

  return (
    <div className="content">
      {/* Enhanced Page Header */}
      <div className="page-header mb-4">
        <div className="add-item d-flex">
          <div className="page-title">
            <h4 className="fw-bold">DC Package Management</h4>
            <h6 className="text-muted">Monitor and manage all packages in your distribution center</h6>
          </div>
        </div>
        
        <div className="d-flex align-items-center gap-3">
          <DCSwitcher />
          
          <ul className="table-top-head mb-0">
            <TableExportIcons
              data={packagesData}
              columns={columns}
              pdfColumns={pdfColumns}
              excelColumns={exportColumns}
              filename="dc-packages-export"
              title="DC Packages"
              fetchAllData={fetchAllDataForExport}
              pdfOrientation="landscape"
            />
            <li>
              <OverlayTrigger placement="top" overlay={renderTooltip({}, "Refresh")}>
                <Link
                  onClick={handleRefresh}
                  className="btn-filter rounded-pill shadow-sm"
                  style={{ cursor: 'pointer' }}
                >
                  <RotateCcw size={18} className={loading ? "spin" : ""} />
                </Link>
              </OverlayTrigger>
            </li>
            <li>
              <OverlayTrigger placement="top" overlay={renderTooltip({}, "Collapse")}>
                <Link id="collapse-header" className="btn-filter rounded-pill shadow-sm">
                  <ChevronUp size={18} />
                </Link>
              </OverlayTrigger>
            </li>
          </ul>

          <div className="page-btn d-flex align-items-center gap-2">
            <button
              className="btn btn-outline-primary rounded-pill shadow-sm py-2 px-4 d-flex align-items-center"
              onClick={handleBulkUpdateStatus}
              disabled={selectedRowKeys.length === 0}
            >
              <RefreshCw className="me-2" size={16} />
              {`Update Status${selectedRowKeys.length > 0 ? ` (${selectedRowKeys.length})` : ''}`}
            </button>
            <Link to={route.createPackage} className="btn btn-added rounded-pill shadow-sm py-2 px-4 transition-all">
              <Plus className="me-2" size={18} />
              Add New Package
            </Link>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle className="me-2" size={16} />
          {error}
        </div>
      )}

      {/* No DC Code State */}
      {!dcCode && !loading && (
        <div className="alert alert-warning" role="alert">
          <AlertCircle className="me-2" size={16} />
          Distribution Center code not found. Please ensure you are logged in with proper DC credentials.
        </div>
      )}

      {/* Packages Table */}
      {!error && dcCode && (
        <Card className="border-0 shadow-sm rounded-3 overflow-hidden">
          <Card.Header className="bg-transparent border-bottom pt-4 px-4 pb-3 position-relative">
            <div className="dc-packages-filter-bar">
              <div className="btn-group dc-packages-direction-toggle" role="group">
                <button
                  type="button"
                  className={`btn btn-sm ${direction === 'all' ? 'btn-primary' : 'btn-outline-primary'} d-flex align-items-center`}
                  onClick={() => handleDirectionChange('all')}
                >
                  <Package size={14} className="me-1" />
                  All
                  {direction === 'all' && (
                    <Badge bg="light" text="dark" className="ms-2 rounded-pill">{pagination.totalItems}</Badge>
                  )}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${direction === 'outbound' ? 'btn-primary' : 'btn-outline-primary'} d-flex align-items-center`}
                  onClick={() => handleDirectionChange('outbound')}
                >
                  <Truck size={14} className="me-1" />
                  Outbound
                  {direction === 'outbound' && (
                    <Badge bg="light" text="dark" className="ms-2 rounded-pill">{pagination.totalItems}</Badge>
                  )}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${direction === 'inbound' ? 'btn-primary' : 'btn-outline-primary'} d-flex align-items-center`}
                  onClick={() => handleDirectionChange('inbound')}
                >
                  <MapPin size={14} className="me-1" />
                  Inbound
                  {direction === 'inbound' && (
                    <Badge bg="light" text="dark" className="ms-2 rounded-pill">{pagination.totalItems}</Badge>
                  )}
                </button>
              </div>

              <div className="dc-packages-filter-field dc-packages-filter-search">
                <input
                  type="text"
                  placeholder="Search by Order NO, Vendor, or Status"
                  className="form-control form-control-sm"
                  value={searchInput}
                  onChange={handleSearch}
                  aria-label="Search packages"
                />
              </div>

              <div className="dc-packages-filter-field dc-packages-filter-select">
                <SSRSelect
                  instanceId="dc-packages-status-filter"
                  options={statusOptions}
                  value={statusOptions.find((option) => option.value === selectedStatusName) || null}
                  onChange={handleStatusFilterChange}
                  placeholder="All Statuses"
                  isClearable
                  aria-label="Filter by status"
                />
              </div>

              <div className="dc-packages-filter-field dc-packages-filter-select">
                <SSRSelect
                  instanceId="dc-packages-vendor-filter"
                  options={vendorOptions}
                  value={vendorOptions.find((option) => option.value === vendorCode) || null}
                  onChange={(selected) => {
                    setVendorCode(selected?.value || "");
                    setPageNo(1);
                  }}
                  placeholder="All Vendors"
                  isClearable
                  aria-label="Filter by vendor"
                />
              </div>

              <div className="dc-packages-filter-field dc-packages-filter-date">
                <DatePicker
                  selected={startDate}
                  onChange={(date) => { setStartDate(date); setPageNo(1); }}
                  dateFormat="dd-MM-yyyy"
                  placeholderText="Start Date"
                  className="form-control form-control-sm"
                  isClearable
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>
              <div className="dc-packages-filter-field dc-packages-filter-date">
                <DatePicker
                  selected={endDate}
                  onChange={(date) => { setEndDate(date); setPageNo(1); }}
                  dateFormat="dd-MM-yyyy"
                  placeholderText="End Date"
                  className="form-control form-control-sm"
                  isClearable
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>
            </div>
            <div
              className={`dc-packages-fetch-status ${loading ? "is-visible" : ""}`}
              role="status"
              aria-live="polite"
            >
              {loading && (
                <span className="visually-hidden">
                  {packagesData.length === 0
                    ? "Loading packages"
                    : "Updating package results"}
                </span>
              )}
              <span className="dc-packages-loading-progress" aria-hidden="true">
                <span />
              </span>
            </div>
          </Card.Header>
          <Card.Body className="p-4" aria-busy={loading}>
            {packagesData.length > 0 ? (
              <Datatable
                columns={columns}
                dataSource={packagesData}
                rowKey="ShipmentOrderID"
                loading={false}
                pagination={{
                  current: pagination.currentPage,
                  total: pagination.totalItems,
                  pageSize: pagination.pageSize,
                  showSizeChanger: true,
                  pageSizeOptions: ['50', '100', '200', '500'],
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} items`,
                  onChange: (page, newPageSize) => {
                    setPageNo(page);
                    setPageSize(newPageSize);
                  },
                }}
                rowSelection={{
                  selectedRowKeys,
                  onChange: setSelectedRowKeys,
                }}
              />
            ) : loading ? (
              <div
                className="dc-packages-table-skeleton"
                aria-hidden="true"
              >
                <div className="dc-packages-skeleton-header">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <span key={`header-${index}`} />
                  ))}
                </div>
                {Array.from({ length: 5 }).map((_, rowIndex) => (
                  <div
                    className="dc-packages-skeleton-row"
                    key={`row-${rowIndex}`}
                  >
                    {Array.from({ length: 6 }).map((_, cellIndex) => (
                      <span key={`cell-${rowIndex}-${cellIndex}`} />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 bg-light rounded-3">
                <Package size={48} className="text-muted mb-3 opacity-20" />
                <h6 className="text-muted fw-normal">
                  No {direction === "all" ? "" : `${direction} `}packages found
                </h6>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

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
      <style jsx global>{`
        .dc-packages-filter-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          width: 100%;
        }

        .dc-packages-direction-toggle {
          flex: 0 0 auto;
        }

        .dc-packages-filter-field {
          flex: 1 1 150px;
          min-width: 0;
        }

        .dc-packages-filter-search {
          flex-basis: 240px;
          flex-grow: 1.4;
        }

        .dc-packages-filter-select {
          flex-basis: 190px;
        }

        .dc-packages-filter-date {
          flex-basis: 140px;
        }

        .dc-packages-filter-field .form-control {
          width: 100%;
          min-height: 36px;
        }

        .dc-packages-filter-field .react-datepicker-wrapper,
        .dc-packages-filter-field .react-datepicker__input-container {
          display: block;
          width: 100%;
        }

        .dc-packages-fetch-status {
          position: absolute;
          right: 0;
          bottom: -1px;
          left: 0;
          height: 2px;
          overflow: hidden;
          opacity: 0;
          transition: opacity 160ms ease;
          pointer-events: none;
        }

        .dc-packages-fetch-status.is-visible {
          opacity: 1;
        }

        .dc-packages-loading-progress {
          display: block;
          position: absolute;
          inset: 0;
          overflow: hidden;
          background: rgba(255, 102, 0, 0.1);
        }

        .dc-packages-loading-progress span {
          display: block;
          width: 35%;
          height: 100%;
          border-radius: 999px;
          background: #ff6600;
          box-shadow: 0 0 8px rgba(255, 102, 0, 0.35);
          animation: dc-packages-progress 1.05s ease-in-out infinite;
        }

        .dc-packages-table-skeleton {
          overflow: hidden;
          border: 1px solid #edf0f5;
          border-radius: 8px;
          background: #fff;
        }

        .dc-packages-skeleton-header,
        .dc-packages-skeleton-row {
          display: grid;
          grid-template-columns: 1fr 1.35fr 1.55fr 1fr 1fr 0.8fr;
          align-items: center;
          gap: 24px;
          padding: 0 16px;
        }

        .dc-packages-skeleton-header {
          height: 44px;
          background: #f8fafc;
          border-bottom: 1px solid #e6eaf0;
        }

        .dc-packages-skeleton-row {
          height: 56px;
          border-bottom: 1px solid #eef1f5;
        }

        .dc-packages-skeleton-row:last-child {
          border-bottom: 0;
        }

        .dc-packages-skeleton-header span,
        .dc-packages-skeleton-row span {
          display: block;
          width: 76%;
          height: 9px;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            #eef1f5 25%,
            #f8fafc 50%,
            #eef1f5 75%
          );
          background-size: 200% 100%;
          animation: dc-packages-skeleton 1.35s ease-in-out infinite;
        }

        .dc-packages-skeleton-header span {
          width: 52%;
          height: 8px;
        }

        .dc-packages-skeleton-row span:nth-child(even) {
          width: 60%;
        }

        @keyframes dc-packages-progress {
          0% {
            transform: translateX(-110%);
          }
          100% {
            transform: translateX(300%);
          }
        }

        @keyframes dc-packages-skeleton {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        [data-layout-mode=dark_mode] .dc-packages-table-skeleton {
          border-color: #2d2d58;
          background: #1d1d42;
        }

        [data-layout-mode=dark_mode] .dc-packages-skeleton-header {
          border-bottom-color: #343463;
          background: #24244d;
        }

        [data-layout-mode=dark_mode] .dc-packages-skeleton-row {
          border-bottom-color: #2d2d58;
        }

        [data-layout-mode=dark_mode] .dc-packages-skeleton-header span,
        [data-layout-mode=dark_mode] .dc-packages-skeleton-row span {
          background: linear-gradient(
            90deg,
            #292952 25%,
            #343463 50%,
            #292952 75%
          );
          background-size: 200% 100%;
        }

        @media (prefers-reduced-motion: reduce) {
          .dc-packages-loading-progress span,
          .dc-packages-skeleton-header span,
          .dc-packages-skeleton-row span {
            animation-duration: 2.5s;
          }
        }

        @media (max-width: 767.98px) {
          .dc-packages-filter-bar {
            align-items: stretch;
          }

          .dc-packages-direction-toggle,
          .dc-packages-filter-field {
            flex: 1 1 100%;
            width: 100%;
          }

          .dc-packages-skeleton-header,
          .dc-packages-skeleton-row {
            grid-template-columns: 1.1fr 1fr 1fr;
          }

          .dc-packages-skeleton-header span:nth-child(n + 4),
          .dc-packages-skeleton-row span:nth-child(n + 4) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
