"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from '@/components/Link';
import SSRSelect from '@/components/SSRSelect';
import VendorPageHeader from '@/components/vendor/VendorPageHeader';
import { useShipment } from '@/hooks/useShipment';
import { Spinner, Alert } from 'react-bootstrap';
import Datatable from '@/core/pagination/datatable';
import RowActionsDropdown from '@/components/RowActionsDropdown';
import DashCard from '@/components/cards/DashCard';
import { CheckCircle, Clock, Package, Truck, Printer, UploadCloud, RefreshCw } from 'lucide-react';
import useStickerDownload from '@/hooks/useStickerDownload';
import { ImportExcelModal, UpdateStatusModal, BulkUpdateStatusModal } from '@/components/modals';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { formatLocalDateOnly } from '@/lib/utils/dateFormat';
import TableExportIcons from '@/components/TableExportIcons';
import { createFetchAllDataFunction } from '@/utils/tableExport';
import { exportColumns, pdfColumns } from './components/tableColumns';
import { readPackageDrilldownQuery } from '@/utils/packageDrilldownUtils';

const getStatusName = (status) =>
  status?.statusName ||
  status?.StatusName ||
  status?.name ||
  status?.Name ||
  "";

const VendorPackages = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusName, setSelectedStatusName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [showBulkUpdateStatusModal, setShowBulkUpdateStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const query = readPackageDrilldownQuery();
    setSearchTerm(query.searchTerm || "");
    setSelectedStatusName(query.statusName || "");
    setStartDate(query.startDate || null);
    setEndDate(query.endDate || null);
  }, []);

  // Sticker download hook
  const { showSizeSelectionModal, showBulkSizeSelectionModal, isGenerating } = useStickerDownload();

  // Use the shipment hook
  const {
    loading,
    error,
    shipmentOrders,
    pagination,
    fetchShipmentOrdersByVendor,
    vendorCode,
    clearError,
    handleUpdateShipmentStatus,
    handleUpdateShipmentStatusBatch
  } = useShipment();
  const {
    orderStatuses,
    fetchShipmentOrderStatus,
  } = useShipment();

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

  const buildQueryParams = (overrides = {}) => ({
    vendorCode,
    pageNo: currentPage,
    pageSize,
    searchTerm: selectedStatusName || searchTerm || undefined,
    onlyActive: false,
    startDate: formatLocalDateOnly(startDate),
    endDate: formatLocalDateOnly(endDate),
    ...overrides,
  });

  // Fetch orders on component mount and when filters change
  useEffect(() => {
    if (vendorCode) {
      fetchShipmentOrdersByVendor(buildQueryParams());
    }
  }, [vendorCode, currentPage, pageSize, searchTerm, selectedStatusName, startDate, endDate, fetchShipmentOrdersByVendor]);

  // Fetch all data for export, in small batches instead of one huge request,
  // reporting progress back to the export UI as each batch completes.
  const fetchAllDataForExport = async (onProgress) => {
    try {
      const fetchInBatches = createFetchAllDataFunction(
        fetchShipmentOrdersByVendor,
        buildQueryParams(),
        { chunkSize: 500 }
      );
      return await fetchInBatches(onProgress);
    } catch (error) {
      console.error('Error fetching all data for export:', error);
      // Fallback to current page data if fetch fails
      return packages || [];
    }
  };

  useEffect(() => {
    fetchShipmentOrderStatus();
  }, [fetchShipmentOrderStatus]);

  // Get packages from the API response
  const packages = shipmentOrders?.Data || shipmentOrders || [];

  const getStatusBadge = (statusCode, statusName) => {
    const statusMap = {
      'VENDOR_CREATED': { variant: 'warning', label: 'Pending' },
      'PICKED_UP': { variant: 'info', label: 'Picked Up' },
      'IN_TRANSIT': { variant: 'info', label: 'In Transit' },
      'IN_DC': { variant: 'primary', label: 'In DC' },
      'OUT_FOR_DELIVERY': { variant: 'info', label: 'Out for Delivery' },
      'DELIVERED': { variant: 'success', label: 'Delivered' },
      'CANCELLED': { variant: 'danger', label: 'Cancelled' },
      'RETURNED': { variant: 'secondary', label: 'Returned' },
      'FAILED': { variant: 'danger', label: 'Failed' }
    };

    const statusInfo = statusMap[statusCode] || { variant: 'secondary', label: statusName || statusCode || 'Unknown' };
    return <span className={`badge bg-${statusInfo.variant}`}>{statusInfo.label}</span>;
  };

  // Calculate package statistics
  const packageStats = useMemo(() => {
    const stats = {
      total: packages.length,
      pending: 0,
      inTransit: 0,
      delivered: 0
    };

    packages.forEach(pkg => {
      switch (pkg.StatusCode) {
        case 'VENDOR_CREATED':
          stats.pending++;
          break;
        case 'PICKED_UP':
        case 'IN_TRANSIT':
        case 'IN_DC':
        case 'OUT_FOR_DELIVERY':
          stats.inTransit++;
          break;
        case 'DELIVERED':
          stats.delivered++;
          break;
        default:
          break;
      }
    });

    return stats;
  }, [packages]);

  const filteredPackages = packages.filter(pkg => {
    if (activeTab === 'all') return true;
    
    switch (activeTab) {
      case 'pending':
        return pkg.StatusCode === 'VENDOR_CREATED';
      case 'in_transit':
        return ['PICKED_UP', 'IN_TRANSIT', 'IN_DC', 'OUT_FOR_DELIVERY'].includes(pkg.StatusCode);
      case 'delivered':
        return pkg.StatusCode === 'DELIVERED';
      default:
        return true;
    }
  });

  // Define table columns for Datatable
  const columns = [
    {
      title: 'Tracking #',
      dataIndex: 'OrderNO',
      key: 'OrderNO',
      width: 190,
      tooltip: false,
      render: (text) => <strong className="text-primary text-break">{text}</strong>,
    },
    {
      title: 'Recipient',
      key: 'recipient',
      width: 175,
      tooltip: false,
      render: (_, record) => (
        <div className="text-break">
          <strong>{record.ReceiverContactName || 'N/A'}</strong>
          <br />
          <small className="text-muted">{record.ReceiverContactPhone || 'N/A'}</small>
        </div>
      ),
    },
    {
      title: 'From → To',
      key: 'route',
      render: (_, record) => (
        <div>
          <small className="text-muted">{record.OriginDCName || 'N/A'}</small>
          <i className="feather-arrow-right mx-1 text-muted"></i>
          <small className="text-muted">{record.DestinationDCName || 'N/A'}</small>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'StatusCode',
      key: 'StatusCode',
      render: (statusCode, record) => getStatusBadge(statusCode, record.StatusName),
    },
    {
      title: 'Date Created',
      dataIndex: 'DateAdded',
      key: 'DateAdded',
      render: (date) => (
        <small>{date ? new Date(date).toLocaleDateString() : 'N/A'}</small>
      ),
    },
    {
      title: 'Amount',
      key: 'Amount',
      render: (_, record) => {
        const serviceFee = record.ServiceFee ? parseFloat(record.ServiceFee).toFixed(2) : "0.00";
        const codAmount = record.CODAmount ? parseFloat(record.CODAmount).toFixed(2) : "0.00";
        return (
          <div>
            <div><small className="text-muted">Fee:</small> <strong>KES {serviceFee}</strong></div>
            {record.CashOnDeliveryRequired && (
              <div><small className="text-muted">COD:</small> <strong>KES {codAmount}</strong></div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <RowActionsDropdown
          id={`dropdown-${record.OrderNO}`}
          variant="outline-secondary"
          items={[
            {
              key: 'view',
              label: 'View Details',
              icon: 'feather-eye',
              href: `/vendor/vendor-track?trackingNumber=${record.OrderNO}`,
            },
            {
              key: 'track',
              label: 'Track Package',
              icon: 'feather-map-pin',
              href: `/vendor/vendor-track?trackingNumber=${record.OrderNO}`,
            },
            {
              key: 'print',
              label: 'Print Sticker',
              icon: 'feather-download',
              disabled: isGenerating,
              onClick: () => handleDownloadSticker(record),
            },
            { key: 'update-status', label: 'Update Status', icon: 'feather-refresh-cw', onClick: () => handleUpdateStatus(record) },
            record.StatusCode === 'VENDOR_CREATED' && { divider: true },
            record.StatusCode === 'VENDOR_CREATED' && {
              key: 'cancel',
              label: 'Cancel Package',
              icon: 'feather-x',
              danger: true,
            },
          ]}
        />
      ),
    },
  ];

  const handleDownloadSticker = (record) => {
    // Convert the record to match PackageSticker expected format
    const packageData = {
      OrderNO: record.OrderNO,
      CustomerName: record.ReceiverContactName || record.ReceiverCompanyName,
      CustomerPhone: record.ReceiverContactPhone,
      CustomerAddress: record.ReceiverStreetName || record.DestinationDCName,
      VendorName: record.SenderCompanyName || record.VendorName,
      VendorPhone: record.SenderContactPhone || record.VendorPhone,
      DeliveryType: record.DeliveryType,
      StatusID: record.StatusCode || record.StatusID, 
      DateAdded: record.DateAdded
    };

    showSizeSelectionModal(packageData);
  };

  const handleBulkDownloadStickers = () => {
    if (!selectedRowKeys || selectedRowKeys.length === 0) return;
    
    // Get the full records for the selected keys
    const selectedPackages = packages.filter(pkg => 
      selectedRowKeys.includes(pkg.OrderNO)
    ).map(record => ({
      OrderNO: record.OrderNO,
      CustomerName: record.ReceiverContactName || record.ReceiverCompanyName,
      CustomerPhone: record.ReceiverContactPhone,
      CustomerAddress: record.ReceiverStreetName || record.DestinationDCName,
      VendorName: record.SenderCompanyName || record.VendorName,
      VendorPhone: record.SenderContactPhone || record.VendorPhone,
      DeliveryType: record.DeliveryType,
      StatusID: record.StatusCode || record.StatusID,
      DateAdded: record.DateAdded
    }));

    showBulkSizeSelectionModal(selectedPackages);
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
    if (!orderNO || !vendorCode) return;

    setSearchTerm(orderNO);
    setSelectedStatusName('');
    setActiveTab('all');
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);

    await fetchShipmentOrdersByVendor({
      vendorCode,
      pageNo: 1,
      pageSize,
      searchTerm: orderNO,
      onlyActive: false,
      startDate: '',
      endDate: '',
    });
  };

  // Handle bulk update status modal
  const selectedOrders = filteredPackages.filter(pkg => selectedRowKeys.includes(pkg.OrderNO || pkg.id));

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
      if (vendorCode) {
        fetchShipmentOrdersByVendor(buildQueryParams({ pageNo: currentPage }));
      }
    } catch (error) {
      console.error('Failed to update bulk status:', error);
    }
  };

  const handleSearch = (searchValue) => {
    setSearchTerm(searchValue);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleStatusFilterChange = (selected) => {
    setSelectedStatusName(selected?.value || "");
    setCurrentPage(1);
  };

  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    if (size && size !== pageSize) {
      setPageSize(size);
    }
  };

  const handleDateFilter = () => {
    if (vendorCode) {
      fetchShipmentOrdersByVendor(buildQueryParams({ pageNo: 1 }));
      setCurrentPage(1);
    }
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setSelectedStatusName('');
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
    if (vendorCode) {
      fetchShipmentOrdersByVendor({
        vendorCode,
        pageNo: 1,
        pageSize,
        searchTerm: undefined,
        onlyActive: false,
        startDate: '',
        endDate: '',
      });
    }
  };

  return (
    <div className="content">
      <VendorPageHeader
        title="My Packages"
        subtitle="Manage and track all your packages"
        actions={(
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <ul className="table-top-head mb-0">
              <TableExportIcons
                data={packages}
                columns={columns}
                pdfColumns={pdfColumns}
                excelColumns={exportColumns}
                filename="vendor-packages-export"
                title="My Packages"
                fetchAllData={fetchAllDataForExport}
                pdfOrientation="landscape"
                onExportSuccess={() => {
                  // Restore the current page view after exporting all data
                  fetchShipmentOrdersByVendor(buildQueryParams());
                }}
              />
            </ul>
            <button
              className="btn btn-outline-secondary d-flex align-items-center"
              onClick={handleRefresh}
              disabled={loading}
            >
              <i className="feather-refresh-cw me-1"></i>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              className="btn btn-outline-primary d-flex align-items-center"
              onClick={() => setShowImportModal(true)}
            >
              <UploadCloud size={16} className="me-2" />
              Import Excel
            </button>
            <button
              className="btn btn-primary d-flex align-items-center"
              onClick={handleBulkDownloadStickers}
              disabled={isGenerating || selectedRowKeys.length === 0}
            >
              <Printer size={16} className="me-2" />
              {isGenerating ? 'Preparing...' : `Print Stickers${selectedRowKeys.length > 0 ? ` (${selectedRowKeys.length})` : ''}`}
            </button>
            <button
              className="btn btn-outline-primary d-flex align-items-center"
              onClick={handleBulkUpdateStatus}
              disabled={selectedRowKeys.length === 0}
            >
              <RefreshCw size={16} className="me-2" />
              {`Update Status${selectedRowKeys.length > 0 ? ` (${selectedRowKeys.length})` : ''}`}
            </button>
            <Link to="/vendor/vendor-create-package" className="btn btn-added d-flex align-items-center" style={{ backgroundColor: '#ff902f', color: '#fff' }}>
              <i className="feather-plus me-1"></i>
              Create Package
            </Link>
          </div>
        )}
      />

      {/* Package Stats */}
      <div className="row mb-4">
        <DashCard
          title="Total Packages"
          value={packageStats.total}
          icon={<Package className="text-white" />}
          className="bg-primary"
          textColor="light"
        />

        <DashCard
          title="Pending"
          value={packageStats.pending}
          icon={<Clock className="text-white" />}
          className="bg-warning"
          textColor="light"
        />

        <DashCard
          title="In Transit"
          value={packageStats.inTransit}
          icon={<Truck className="text-white" />}
          className="bg-info"
          textColor="light"
        />

        <DashCard
          title="Delivered"
          value={packageStats.delivered}
          icon={<CheckCircle className="text-white" />}
          className="bg-success"
          textColor="light"
        />
      </div>

      {/* Packages Table */}
      <div className="card">
        <div className="card-header">
          <div className="row align-items-center">
            <div className="col">
              <h4 className="card-title">Package List</h4>
            </div>
            <div className="col-auto">
              <div className="d-flex gap-2 align-items-center">
                {/* Search Input */}
                <div className="position-relative">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search packages..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{ minWidth: '200px' }}
                  />
                  <i className="feather-search position-absolute" style={{
                    top: '50%',
                    right: '10px',
                    transform: 'translateY(-50%)',
                    fontSize: '14px',
                    color: '#6c757d'
                  }}></i>
                </div>

                <div className="vendor-packages-status-filter">
                  <SSRSelect
                    instanceId="vendor-packages-status-filter"
                    options={statusOptions}
                    value={statusOptions.find((option) => option.value === selectedStatusName) || null}
                    onChange={handleStatusFilterChange}
                    placeholder="All Statuses"
                    isClearable
                  />
                </div>

                <div className="vendor-packages-date-filter">
                  <DatePicker
                    selected={startDate}
                    onChange={setStartDate}
                    dateFormat="dd-MM-yyyy"
                    placeholderText="Start Date"
                    className="form-control form-control-sm"
                    isClearable
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </div>
                <div className="vendor-packages-date-filter">
                  <DatePicker
                    selected={endDate}
                    onChange={setEndDate}
                    dateFormat="dd-MM-yyyy"
                    placeholderText="End Date"
                    className="form-control form-control-sm"
                    isClearable
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </div>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={handleDateFilter}
                >
                  Filter
                </button>

                {/* Filter Buttons */}
                <div className="btn-group vendor-packages-status-tabs" role="group">
                  <button
                    type="button"
                    className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setActiveTab('all')}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeTab === 'pending' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setActiveTab('pending')}
                  >
                    Pending
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeTab === 'in_transit' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setActiveTab('in_transit')}
                  >
                    In Transit
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeTab === 'delivered' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setActiveTab('delivered')}
                  >
                    Delivered
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="card-body">
          {loading && (
            <div className="text-center py-4">
              <Spinner size="sm" className="me-2" />
              Loading packages...
            </div>
          )}

          {error && (
            <Alert variant="danger" className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <span>{error}</span>
                <button 
                  className="btn btn-sm btn-outline-danger"
                  onClick={clearError}
                >
                  Dismiss
                </button>
              </div>
            </Alert>
          )}
          {!loading && filteredPackages.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="feather-package text-muted" style={{fontSize: '4rem'}}></i>
              </div>
              <h5 className="text-muted mb-3">No packages found</h5>
              <p className="text-muted mb-4">
                {activeTab === 'all' 
                  ? "You haven't created any packages yet. Start by creating your first package."
                  : `No packages with ${activeTab.replace('_', ' ')} status found.`
                }
              </p>
              {activeTab === 'all' && !searchTerm && (
                <Link to="/vendor/vendor-create-package" className="btn btn-primary">
                  <i className="feather-plus me-1"></i>
                  Create Your First Package
                </Link>
              )}
            </div>
          ) : !loading && (
            <Datatable
              columns={columns}
              dataSource={filteredPackages}
              loading={loading}
              rowKey={(record) => record.OrderNO || record.id}
              pagination={{
                current: currentPage,
                pageSize,
                total: pagination?.totalItems || 0,
                showSizeChanger: true,
                pageSizeOptions: ['50', '100', '200', '500'],
                showQuickJumper: false,
                showTotal: (total, range) =>
                  `Showing ${range[0]} to ${range[1]} of ${total} packages`,
                onChange: handlePageChange,
                onShowSizeChange: handlePageChange,
              }}
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              }}
            />
          )}
        </div>
      </div>

      {/* Import Excel Modal */}
      <ImportExcelModal
        show={showImportModal}
        showVendorInput={false}
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
      <style jsx global>{`
        /*
         * The theme's ".btn-group .btn" rule (padding: 0.45rem 0.75rem) has
         * the same specificity as ".btn.btn-sm" and is declared later in the
         * stylesheet, so it wins the cascade and silently overrides btn-sm's
         * smaller padding inside a button group. That makes these tabs look
         * noticeably bulkier than the neighboring btn-sm toolbar buttons.
         */
        .vendor-packages-status-tabs.btn-group .btn {
          padding: 0.25rem 0.5rem !important;
          font-size: 0.75rem !important;
          box-shadow: none !important;
        }

        .vendor-packages-status-filter {
          min-width: 220px;
        }

        .vendor-packages-status-filter .css-b62m3t-container,
        .vendor-packages-status-filter > div {
          min-width: 220px;
        }

        @media (max-width: 767.98px) {
          .card-header .d-flex.gap-2 {
            align-items: stretch !important;
            flex-direction: column;
          }

          .vendor-packages-status-filter,
          .vendor-packages-status-filter .css-b62m3t-container,
          .vendor-packages-status-filter > div,
          .card-header .position-relative,
          .card-header .btn-group {
            width: 100%;
            min-width: 100%;
          }
        }
        .vendor-packages-date-filter {
          min-width: 130px;
        }

        .vendor-packages-date-filter .react-datepicker-wrapper,
        .vendor-packages-date-filter .react-datepicker__input-container {
          display: block;
          width: 100%;
        }

        .vendor-packages-date-filter .form-control {
          width: 100%;
        }

        @media (max-width: 767.98px) {
          .vendor-packages-date-filter {
            width: 100%;
            min-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default VendorPackages;
