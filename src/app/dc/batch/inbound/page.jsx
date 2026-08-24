"use client";
import { RotateCcw, ArrowDown } from "feather-icons-react";
import React, { useState, useEffect } from "react";
import notify from "@/lib/toast";
import { OverlayTrigger, Tooltip, Badge } from "react-bootstrap";
import Datatable from "@/core/pagination/datatable";
import { useShipment } from "@/hooks/useShipment";
import DCSwitcher from "@/components/DCSwitcher";
import RowActionsDropdown from "@/components/RowActionsDropdown";

const HANDOVER_STATUS_CLOSED = 2;

const InboundBatches = () => {
  // Use shipment hook
  const {
    handoverBatchList,
    fetchHandoverBatchList,
    loading,
    error,
    pagination,
    clearHandoverData,
    dcCode,
  } = useShipment();

  // Local state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch inbound handover batches
  const fetchInboundBatches = async (params = {}) => {
    if (!dcCode) {
      console.warn("DC code not available");
      return;
    }

    try {
      const queryParams = {
        pageNo: params.pageNo || pagination.currentPage,
        pageSize: params.pageSize || pagination.pageSize,
        search: params.search || searchTerm,
        startDate: params.startDate || startDate,
        endDate: params.endDate || endDate,
        orderBy: params.orderBy || "HandoverCode",
        sortDir: params.sortDir || "DESC",
        IsInBound: 1, // Inbound batches
        ToDCCode: dcCode, // Filter by destination DC
        ...params,
      };

      await fetchHandoverBatchList(queryParams);
    } catch (error) {
      console.error("Error fetching inbound batches:", error);
      notify.error(error || "Failed to fetch inbound batches");
    }
  };

  useEffect(() => {
    if (dcCode) {
      fetchInboundBatches();
    }
  }, [dcCode, pagination.currentPage, pagination.pageSize]);

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    fetchInboundBatches({ search: term, pageNo: 1 });
  };

  // Handle date filter
  const handleDateFilter = () => {
    fetchInboundBatches({ startDate, endDate, pageNo: 1 });
  };

  // Handle view batch details
  const handleViewBatch = (batch) => {
    setSelectedBatch(batch);
    setShowDetailsModal(true);
  };

  // Handle close details modal
  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedBatch(null);
  };

  // Handle refresh
  const handleRefresh = () => {
    clearHandoverData();
    fetchInboundBatches();
  };

  // Table columns
  const columns = [
    {
      title: "Handover Code",
      dataIndex: "HandoverCode",
      key: "HandoverCode",
      sorter: true,
      width: 220,
      render: (text, record) => (
        <div className="d-flex align-items-center">
          <ArrowDown size={16} className="me-2 text-success" />
          <span className="fw-bold">{text}</span>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "StatusID",
      key: "StatusID",
      width: 130,
      render: (statusID) =>
        statusID === HANDOVER_STATUS_CLOSED ? (
          <Badge bg="secondary">Closed</Badge>
        ) : (
          <Badge bg="warning" text="dark">
            Pending Receipt
          </Badge>
        ),
    },
  {
  title: "Source",
  dataIndex: "FromDCName",
  key: "FromDCName",
  width: 180,
  sorter: (a, b) =>
    (a.FromDCName || "").localeCompare(b.FromDCName || ""),
  render: (_, record) => (
    <OverlayTrigger
      overlay={<Tooltip>{record.FromDCName || "N/A"}</Tooltip>}
    >
      <span className="fw-medium text-primary">
        {record.FromDCName || "N/A"}
      </span>
    </OverlayTrigger>
  ),
},
{
  title: "Destination",
  dataIndex: "ToDCName",
  key: "ToDCName",
  width: 180,
  sorter: (a, b) =>
    (a.ToDCName || "").localeCompare(b.ToDCName || ""),
  render: (_, record) => (
    <OverlayTrigger
      overlay={<Tooltip>{record.ToDCName || "N/A"}</Tooltip>}
    >
      <span className="fw-medium text-success">
        {record.ToDCName || "N/A"}
      </span>
    </OverlayTrigger>
  ),
},
    {
      title: "Rider",
      dataIndex: "RiderUserCode",
      key: "RiderUserCode",
      width: 170,
      render: (text, record) =>
        text ? (record.RiderName ? `${record.RiderName} (${text})` : text) : "N/A",
    },
    {
      title: "Total Items",
      dataIndex: "TotalItems",
      key: "TotalItems",
      sorter: true,
      width: 110,
      render: (text) => text || "N/A",
    },
    {
      title: "Created Date",
      dataIndex: "DateAdded",
      key: "DateAdded",
      width: 120,
      render: (text) => (text ? new Date(text).toLocaleDateString() : "N/A"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record) => (
        <RowActionsDropdown
          id={`dropdown-${record.HandoverCode}`}
          items={[
            { key: 'view-details', label: 'View Details', icon: 'feather-eye', onClick: () => handleViewBatch(record) },
            { key: 'view-items', label: 'View Items', icon: 'feather-package', href: `/dc/batch/inbound/${record.HandoverCode}` },
          ]}
        />
      ),
    },
  ];

  return (
    <React.Fragment>
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <div className="d-flex align-items-center">
                <div className="ms-3">
                  <h4>Inbound Batches</h4>
                  <h6>Manage inbound handover batches for {dcCode}</h6>
                </div>
              </div>
            </div>
          </div>
          <DCSwitcher />
        </div>

        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">Inbound Batches List</h5>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RotateCcw size={14} className="me-1" />
              Refresh
            </button>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-4">
                <div className="d-flex">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search by handover code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
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
              <div className="col-md-3">
                <input
                  type="date"
                  className="form-control form-control-sm"
                  placeholder="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <input
                  type="date"
                  className="form-control form-control-sm"
                  placeholder="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <button
                  className="btn btn-sm btn-secondary w-100"
                  onClick={handleDateFilter}
                >
                  Filter
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
                  dataSource={handoverBatchList}
                  pagination={{
                    current: pagination.currentPage,
                    pageSize: pagination.pageSize,
                    total: pagination.totalItems,
                    showSizeChanger: true,
                    pageSizeOptions: ['50', '100', '200', '500'],
                    onChange: (page, size) => {
                      fetchInboundBatches({ pageNo: page, pageSize: size });
                    },
                  }}
                  rowKey="HandoverCode"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedBatch && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Inbound Batch Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseDetailsModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        Handover Code:
                      </label>
                      <p>{selectedBatch.HandoverCode || "N/A"}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Status:</label>
                      <p>
                        {selectedBatch.StatusID === HANDOVER_STATUS_CLOSED ? (
                          <Badge bg="secondary">Closed</Badge>
                        ) : (
                          <Badge bg="warning" text="dark">
                            Pending Receipt
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">From DC:</label>
                      <p>
                        {selectedBatch.FromDCName
                          ? `${selectedBatch.FromDCName} (${selectedBatch.FromDCCode})`
                          : selectedBatch.FromDCCode || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">To DC:</label>
                      <p>
                        {selectedBatch.ToDCName
                          ? `${selectedBatch.ToDCName} (${selectedBatch.ToDCCode})`
                          : selectedBatch.ToDCCode || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Rider:</label>
                      <p>
                        {selectedBatch.RiderName
                          ? `${selectedBatch.RiderName} (${selectedBatch.RiderUserCode})`
                          : selectedBatch.RiderUserCode || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Total Items:</label>
                      <p>{selectedBatch.TotalItems || "N/A"}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        Created:
                      </label>
                      <p>
                        {selectedBatch.DateAdded
                          ? new Date(selectedBatch.DateAdded).toLocaleString()
                          : "N/A"}
                        {selectedBatch.CreatedBy ? ` by ${selectedBatch.CreatedBy}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        {selectedBatch.StatusID === HANDOVER_STATUS_CLOSED ? "Closed:" : "Received:"}
                      </label>
                      <p>
                        {selectedBatch.ClosedAt || selectedBatch.ConfirmedAt
                          ? new Date(
                              selectedBatch.ClosedAt || selectedBatch.ConfirmedAt
                            ).toLocaleString()
                          : "Not yet received"}
                        {selectedBatch.ConfirmedBy ? ` by ${selectedBatch.ConfirmedBy}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Notes:</label>
                      <p>{selectedBatch.Notes || "No notes available"}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseDetailsModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {showDetailsModal && (
        <div
          className="modal-backdrop fade show"
          onClick={handleCloseDetailsModal}
        ></div>
      )}
    </React.Fragment>
  );
};

export default InboundBatches;
