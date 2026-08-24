"use client";
import { RotateCcw, ArrowUp } from "feather-icons-react";
import React, { useState, useEffect } from "react";
import notify from "@/lib/toast";
import Link from "@/components/Link";
import Datatable from "@/core/pagination/datatable";
import { useShipment } from "@/hooks/useShipment";
import { PlusCircle } from "lucide-react";
import DCSwitcher from "@/components/DCSwitcher";
import RowActionsDropdown from "@/components/RowActionsDropdown";

const OutboundBatches = () => {
  // Use shipment hook
  const {
    handoverBatchList,
    fetchHandoverBatchList,
    loading,
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

  // Fetch outbound handover batches
  const fetchOutboundBatches = async (params = {}) => {
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
        IsInBound: 0, // Outbound batches
        FromDCCode: dcCode, // Filter by source DC
        ...params,
      };

      await fetchHandoverBatchList(queryParams);
    } catch (error) {
      console.error("Error fetching outbound batches:", error);
      notify.error(error || "Failed to fetch outbound batches");
    }
  };

  useEffect(() => {
    if (dcCode) {
      fetchOutboundBatches();
    }
  }, [dcCode, pagination.currentPage, pagination.pageSize]);

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    fetchOutboundBatches({ search: term, pageNo: 1 });
  };

  // Handle date filter
  const handleDateFilter = () => {
    fetchOutboundBatches({ startDate, endDate, pageNo: 1 });
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
    fetchOutboundBatches();
  };

  // Table columns
  const columns = [
    {
      title: "Handover Code",
      dataIndex: "HandoverCode",
      key: "HandoverCode",
      sorter: true,
      render: (text, record) => (
        <div className="d-flex align-items-center">
          <ArrowUp size={16} className="me-2 text-warning" />
          <span className="fw-bold">{text}</span>
        </div>
      ),
    },
    {
      title: "From DC",
      dataIndex: "FromDCName",
      key: "FromDCName",
      render: (text) => <span className="badge bg-info">{text}</span>,
    },
    {
      title: "To DC",
      dataIndex: "ToDCName",
      key: "ToDCName",
      render: (text) => <span className="badge bg-success">{text}</span>,
    },
    {
      title: "Rider",
      dataIndex: "RiderName",
      key: "RiderName",
      render: (text) => text || "N/A",
    },
    {
      title: "Total Items",
      dataIndex: "TotalItems",
      key: "TotalItems",
      render: (text) => text || "N/A",
    },
    {
      title: "Created Date",
      dataIndex: "CreatedDate",
      key: "CreatedDate",
      render: (text) => (text ? new Date(text).toLocaleDateString() : "N/A"),
    },
     {
      title: "Confirmed Date",
      dataIndex: "ConfirmedAt",
      key: "ConfirmedAt",
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
            { key: 'view-items', label: 'View Items', icon: 'feather-package', href: `/dc/batch/outbound/${record.HandoverCode}` },
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
                  <h4>Outbound Batches</h4>
                  <h6>Manage outbound handover batches from {dcCode}</h6>
                </div>
              </div>
            </div>
          </div>
          <DCSwitcher />

          <div className="page-btn">
            <Link
              to="/dc/batch/create"
              className="btn btn-primary d-flex align-items-center"
            >
              <PlusCircle size={16} className="me-2" />
              Create Batch
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">Outbound Batches List</h5>
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
                  <div className="spinner-border">
                    <output className="visually-hidden">Loading...</output>
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
                      fetchOutboundBatches({ pageNo: page, pageSize: size });
                    },
                  }}
                  rowKey={"HandoverCode"}
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
                <h5 className="modal-title">Outbound Batch Details</h5>
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
                      <label className="form-label fw-bold" htmlFor="handover-code">
                        Handover Code:
                      </label>
                      <p id="handover-code">{selectedBatch.HandoverCode || "N/A"}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold" htmlFor="from-dc-value">From DC:</label>
                      <p id="from-dc-value">{selectedBatch.FromDCCode || "N/A"}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold" htmlFor="to-dc-value">To DC:</label>
                      <p id="to-dc-value">{selectedBatch.ToDCCode || "N/A"}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold" htmlFor="rider-value">Rider:</label>
                      <p id="rider-value">{selectedBatch.RiderUserCode || "N/A"}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold" htmlFor="total-items-value">Total Items:</label>
                      <p id="total-items-value">{selectedBatch.TotalItems || "N/A"}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold" htmlFor="created-date-value">
                        Created Date:
                      </label>
                      <p id="created-date-value">
                        {selectedBatch.CreatedDate
                          ? new Date(
                              selectedBatch.CreatedDate
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label fw-bold" htmlFor="notes-value">Notes:</label>
                      <p id="notes-value">{selectedBatch.Notes || "No notes available"}</p>
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
        <button
          type="button"
          className="modal-backdrop fade show"
          aria-label="Close modal"
          onClick={handleCloseDetailsModal}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleCloseDetailsModal();
            }
          }}
          style={{ border: "none", background: "transparent", padding: 0, margin: 0, width: "100%", height: "100%", position: "fixed", top: 0, left: 0, zIndex: 1050 }}
        ></button>
      )}
    </React.Fragment>
  );
};

export default OutboundBatches;
