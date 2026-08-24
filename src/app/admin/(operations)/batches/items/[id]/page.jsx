"use client"
import {
  ChevronUp,
  RotateCcw,
} from "feather-icons-react";
import React, { useEffect, useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import Link from "@/components/Link";
import RowActionsDropdown from "@/components/RowActionsDropdown";
import { all_routes } from "@/Router/all_routes";
import Datatable from "@/core/pagination/datatable";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import { useShipment } from "@/hooks/useShipment";
import { useParams } from "next/navigation";

const HandoverItemsList = () => {
  const route = all_routes;
  const params = useParams();
  const handoverCode = params.id;

  const [searchTerm, setSearchTerm] = useState("");

  const {
    loading,
    error,
    handoverItems,
    pagination,
    fetchHandoverItems,
    clearError,
    updateParams
  } = useShipment();

  // Fetch handover items on component mount
  useEffect(() => {
    if (handoverCode) {
      fetchHandoverItems({
        handoverCode,
        pageNo: 1,
        pageSize: 100,
        search: "",
        orderBy: "OrderNO",
        sortDir: "ASC"
      });
    }
  }, [handoverCode]);

  // Handle search functionality
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Debounced search - update params which will trigger refetch
    const delayDebounceFn = setTimeout(() => {
      updateParams({ search: value, pageNo: 1 });
      fetchHandoverItems({
        handoverCode,
        pageNo: 1,
        pageSize: 100,
        search: value,
        orderBy: "OrderNO",
        sortDir: "ASC"
      });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  };

  // Handle refresh
  const handleRefresh = () => {
    setSearchTerm("");
    fetchHandoverItems({
      handoverCode,
      pageNo: 1,
      pageSize: 100,
      search: "",
      orderBy: "OrderNO",
      sortDir: "ASC"
    });
  };

  const columns = [
    {
      title: "Order NO",
      dataIndex: "OrderNO",
      sorter: (a, b) => a.OrderNO.localeCompare(b.OrderNO),
      render: (text) => (
        <div className="fw-bold text-primary">{text}</div>
      ),
    },
    {
      title: "Origin DC",
      dataIndex: "OriginDCCode",
      sorter: (a, b) => a.OriginDCCode.localeCompare(b.OriginDCCode),
      render: (text, record) => (
        <div>
          <div className="badge bg-info">{text}</div>
        </div>
      ),
    },
    {
      title: "Destination DC",
      dataIndex: "DestinationDCCode",
      sorter: (a, b) => a.DestinationDCCode.localeCompare(b.DestinationDCCode),
      render: (text, record) => (
        <div>
          <div className="badge bg-success">{text}</div>
        </div>
      ),
    },
    {
      title: "Vendor",
      dataIndex: "VendorCode",
      sorter: (a, b) => a.VendorCode.localeCompare(b.VendorCode),
      render: (text, record) => (
        <div>
          <div>{record.VendorCode}</div>
          <small className="text-muted">{record.VendorName}</small>
        </div>
      ),
    },
    {
      title: "Customer",
      dataIndex: "CustomerName",
      sorter: (a, b) => a.CustomerName.localeCompare(b.CustomerName),
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <small className="text-muted">{record.CustomerPhone}</small>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "StatusName",
      sorter: (a, b) => (a.StatusName || "").localeCompare(b.StatusName || ""),
      render: (text, record) => {
        if (!text) {
          return <span className="badge bg-secondary">Pending</span>;
        }

        const getStatusBadgeClass = (statusName) => {
          switch (statusName?.toLowerCase()) {
            case "delivered":
              return "badge bg-success";
            case "in transit":
              return "badge bg-warning";
            case "cancelled":
              return "badge bg-danger";
            case "pending":
              return "badge bg-secondary";
            default:
              return "badge bg-primary";
          }
        };

        return (
          <span className={getStatusBadgeClass(text)}>{text}</span>
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
            { key: 'view', label: 'View Package', icon: 'feather-eye', href: `${route.packages}/${record.OrderNO}` },
            { key: 'track', label: 'Track Package', icon: 'feather-map-pin', href: `${route.packages}/${record.OrderNO}/track?trackingNumber=${record.OrderNO}` },
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
              <h4>Handover Items</h4>
              <h6>Items in handover batch: <span className="text-primary fw-bold">{handoverCode}</span></h6>
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
          <div className="page-btn">
            <Link to={route.batches} className="btn btn-secondary">
              <i className="feather-arrow-left me-2" />
              Back to Batches
            </Link>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-top">
              <div className="search-set">
                <input
                  type="text"
                  placeholder="Search by Order NO, Vendor, Customer, or Status"
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
                <p className="mt-2">Loading handover items...</p>
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
                  dataSource={handoverItems}
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
                      fetchHandoverItems({
                        handoverCode,
                        pageNo: page,
                        pageSize,
                        search: searchTerm,
                        orderBy: "OrderNO",
                        sortDir: "ASC"
                      });
                    }
                  }}
                  rowKey="ShipmentOrderID"
                  loading={loading}
                />
              </div>
            )}

            {/* No Data State */}
            {!loading && !error && handoverItems.length === 0 && (
              <div className="text-center py-4">
                <p className="text-muted">No handover items found for this batch.</p>
                <Link to={route.batches} className="btn btn-primary">
                  <i className="feather-arrow-left me-2" />
                  Back to Batches
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default HandoverItemsList;
