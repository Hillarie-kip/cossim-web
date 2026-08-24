"use client"
import {
  RotateCcw,
  Package,
} from "feather-icons-react";
import React, { useState, useEffect } from "react";
import notify from "@/lib/toast";
import { OverlayTrigger, Tooltip, Badge } from "react-bootstrap";
import Link from "@/components/Link";
import RowActionsDropdown from "@/components/RowActionsDropdown";
import { all_routes } from "@/Router/all_routes";
import Datatable from "@/core/pagination/datatable";
import { useShipment } from "@/hooks/useShipment";
import { PlusCircle } from "lucide-react";

const HANDOVER_STATUS_CLOSED = 2;

const BatchesList = () => {
  const route = all_routes;

  // Use shipment hook
  const {
    handoverBatchList,
    fetchHandoverBatchList,
    loading,
    error,
    pagination,
    clearHandoverData
  } = useShipment();

  // Local state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch handover batches
  const fetchBatches = async (params = {}) => {
    try {
      const queryParams = {
        pageNo: params.pageNo || pagination.currentPage,
        pageSize: params.pageSize || pagination.pageSize,
        searchTerm: params.searchTerm || searchTerm,
        startDate: params.startDate || startDate,
        endDate: params.endDate || endDate,
        orderBy: params.orderBy || "HandoverCode",
        sortDir: params.sortDir || "DESC",
        ...params
      };

      await fetchHandoverBatchList(queryParams);
    } catch (error) {
      console.error('Error fetching handover batches:', error);
      notify.error(error || "Failed to fetch handover batches");
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [pagination.currentPage, pagination.pageSize]);

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    fetchBatches({ searchTerm: term, pageNo: 1 });
  };

  // Handle date filter
  const handleDateFilter = () => {
    fetchBatches({ startDate, endDate, pageNo: 1 });
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
    fetchBatches();
  };

  // Table columns
 const columns = [
  {
    title: "Handover",
    dataIndex: "HandoverCode",
    width: 210,
    sorter: true,
    render: (text) => (
      <div className="d-flex align-items-center">
        <Package size={16} className="me-2 text-primary" />
        <span className="fw-bold">{text}</span>
      </div>
    ),
  },



  {
    title: "Source DC",
    width: 180,
    render: (_, record) => (
      <div>
        <div className="fw-semibold">
          {record.FromDCName || "Unassigned"}
        </div>

        
      </div>
    ),
  },

  {
    title: "Destination DC",
    width: 180,
    render: (_, record) => (
      <div>
        <div className="fw-semibold">
          {record.ToDCName || "Unassigned"}
        </div>

     
      </div>
    ),
  },

  {
    title: "Rider",
    width: 180,
    render: (_, record) => (
      <div>
        <div className="fw-semibold">
          {record.RiderName || "Unassigned"}
        </div>

        <small className="text-muted">
          {record.RiderUserCode || "-"}
        </small>
      </div>
    ),
  },

  {
    title: "Items",
    dataIndex: "TotalItems",
    width: 90,
    align: "center",
    sorter: true,
    render: (value) => (
      <span className="badge bg-primary">
        {value}
      </span>
    ),
  },

  {
    title: "Status",
    width: 120,
    sorter: true,
    render: (_, record) =>
      record.StatusID === HANDOVER_STATUS_CLOSED ? (
        <Badge bg="secondary">
          Closed
        </Badge>
      ) : (
        <Badge bg="warning" text="dark">
          Open
        </Badge>
      ),
  },

  {
    title: "Created",
    width: 180,
    sorter: true,
    render: (_, record) => (
      <div>
        <div>
          {new Date(
            record.DateAdded
          ).toLocaleDateString()}
        </div>

        <small className="text-muted">
          {record.CreatedBy || "-"}
        </small>
      </div>
    ),
  },

  {
    title: "Notes",
    dataIndex: "Notes",
    width: 180,
    ellipsis: true,
    render: (text) =>
      text || (
        <span className="text-muted">
          No notes
        </span>
      ),
  },

  {
    title: "Actions",
    key: "actions",
    width: 100,
    fixed: "right",
    render: (record) => (
      <RowActionsDropdown
        id={`dropdown-${record.HandoverCode}`}
        items={[
          {
            key: "view-details",
            label: "View Details",
            icon: "feather-eye",
            onClick: () =>
              handleViewBatch(record),
          },
          {
            key: "view-items",
            label: "View Items",
            icon: "feather-package",
            href: `/admin/batches/items/${record.HandoverCode}`,
          },
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
                <h4>Handover Batches</h4>
                <h6>Manage handover batches for distribution centers</h6>
              </div>
            </div>
            <div className="page-btn">
              <Link
                to={route.batchesNew}
                className="btn btn-primary d-flex align-items-center"
              >
                <PlusCircle size={16} className="me-2" />
                Add Batch
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Handover Batches List</h5>
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
                    rowKey="HandoverCode"
                    pagination={{
                      current: pagination.currentPage,
                      pageSize: pagination.pageSize,
                      total: pagination.totalItems,
                      showSizeChanger: true,
                      pageSizeOptions: ['50', '100', '200', '500'],
                      onChange: (page, size) => {
                        fetchBatches({ pageNo: page, pageSize: size });
                      }
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Details Modal */}
      {showDetailsModal && selectedBatch && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Handover Batch Details</h5>
                <button type="button" className="btn-close" onClick={handleCloseDetailsModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Handover Code:</label>
                      <p>{selectedBatch.HandoverCode || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Status:</label>
                      <p>
                        {selectedBatch.StatusID === HANDOVER_STATUS_CLOSED ? (
                          <Badge bg="secondary">Closed</Badge>
                        ) : (
                          <Badge bg="warning" text="dark">Open</Badge>
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
                          : selectedBatch.FromDCCode || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">To DC:</label>
                      <p>
                        {selectedBatch.ToDCName
                          ? `${selectedBatch.ToDCName} (${selectedBatch.ToDCCode})`
                          : selectedBatch.ToDCCode || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Rider:</label>
                      <p>
                        {selectedBatch.RiderName
                          ? `${selectedBatch.RiderName} (${selectedBatch.RiderUserCode})`
                          : selectedBatch.RiderUserCode || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Total Items:</label>
                      <p>{selectedBatch.TotalItems || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Created:</label>
                      <p>
                        {selectedBatch.DateAdded ? new Date(selectedBatch.DateAdded).toLocaleString() : 'N/A'}
                        {selectedBatch.CreatedBy ? ` by ${selectedBatch.CreatedBy}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        {selectedBatch.StatusID === HANDOVER_STATUS_CLOSED ? 'Closed:' : 'Received:'}
                      </label>
                      <p>
                        {selectedBatch.ClosedAt || selectedBatch.ConfirmedAt
                          ? new Date(selectedBatch.ClosedAt || selectedBatch.ConfirmedAt).toLocaleString()
                          : 'Not yet received'}
                        {selectedBatch.ConfirmedBy ? ` by ${selectedBatch.ConfirmedBy}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Notes:</label>
                      <p>{selectedBatch.Notes || 'No notes available'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseDetailsModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {(showDetailsModal) && (
        <div className="modal-backdrop fade show" onClick={handleCloseDetailsModal}></div>
      )}
    </React.Fragment>
  );
};

export default BatchesList;
