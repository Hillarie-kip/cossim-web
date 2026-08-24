"use client"
import {
  ChevronUp,
  RotateCcw,
  Filter,
} from "feather-icons-react";
import React, { useState, useEffect } from "react";
import { OverlayTrigger, Tooltip, Badge, Form, Row, Col } from "react-bootstrap";
import Link from "@/components/Link";
import RowActionsDropdown from "@/components/RowActionsDropdown";
import { all_routes } from "@/Router/all_routes";
import Datatable from "@/core/pagination/datatable";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import { useFinance } from "@/hooks/useFinance";
import SSRSelect from "@/components/SSRSelect";
import notify from "@/lib/toast";

const OrderReconciliation = () => {
  const route = all_routes;

  // Finance hook
  const {
    loading,
    error,
    orderReconciliation,
    fetchOrderReconciliation,
    clearError
  } = useFinance();

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [totalCount, setTotalCount] = useState(0);

  // Filter states
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [vendorCode, setVendorCode] = useState("");
  const [dcCode, setDcCode] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch reconciliation data
  const fetchData = async (params = {}) => {
    try {
      const queryParams = {
        pageNo: params.pageNo || currentPage,
        pageSize: params.pageSize || pageSize,
        search: params.search || searchTerm,
        fromDate: params.fromDate || fromDate,
        toDate: params.toDate || toDate,
        vendorCode: params.vendorCode || vendorCode,
        dcCode: params.dcCode || dcCode,
        verifiedOnly: params.verifiedOnly !== undefined ? params.verifiedOnly : verifiedOnly,
        ...params
      };

      const response = await fetchOrderReconciliation(queryParams);

      if (response && !response.Error) {
        setTotalCount(response.TotalCount || 0);
      } else {
        notify.error(response?.Message || "Failed to fetch reconciliation data");
      }
    } catch (error) {
      console.error('Error fetching reconciliation data:', error);
      notify.error(error.message || "Failed to fetch reconciliation data");
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Handle search
  const handleSearch = (searchValue) => {
    setSearchTerm(searchValue);
    setCurrentPage(1);
    fetchData({ search: searchValue, pageNo: 1 });
  };

  // Handle filter application
  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchData({ pageNo: 1 });
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setFromDate("");
    setToDate("");
    setVendorCode("");
    setDcCode("");
    setVerifiedOnly(false);
    setCurrentPage(1);
    fetchData({
      fromDate: "",
      toDate: "",
      vendorCode: "",
      dcCode: "",
      verifiedOnly: false,
      pageNo: 1
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Table columns configuration
  const columns = [
    {
      title: "Order No",
      dataIndex: "orderNO",
      sorter: (a, b) => a.orderNO.localeCompare(b.orderNO),
      render: (orderNO) => (
        <span className="text-primary fw-bold">{orderNO}</span>
      ),
    },
    {
      title: "Vendor",
      dataIndex: "vendorName",
      sorter: (a, b) => a.vendorName.localeCompare(b.vendorName),
      render: (vendorName, record) => (
        <div>
          <div className="fw-bold">{vendorName}</div>
          <small className="text-muted">{record.vendorCode}</small>
        </div>
      ),
    },
    {
      title: "Origin DC",
      dataIndex: "originDCCode",
      sorter: (a, b) => a.originDCCode.localeCompare(b.originDCCode),
    },
    {
      title: "Destination DC",
      dataIndex: "destinationDCCode",
      sorter: (a, b) => a.destinationDCCode.localeCompare(b.destinationDCCode),
    },
    {
      title: "Order Date",
      dataIndex: "orderDate",
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.orderDate) - new Date(b.orderDate),
    },
    {
      title: "Fees",
      dataIndex: "fees",
      render: (_, record) => {
        return (
          <div>
            <div className="fw-bold"> Billed {formatCurrency(record.feesBilled)}</div>
            <small className="text-muted">
              Collected {formatCurrency(record.feesCollectedAmt)}
            </small>
            <br />
            <small className="text-muted">
              Outstanding {formatCurrency(record.feesOutstanding)}
            </small>
          </div>
        );
      },
      sorter: (a, b) => a.feesBilled - b.feesBilled,
      className: "text-end",
    },
    
    {
      title: "COD",
      dataIndex: "cod",
      render: (amount, record) => {
        // required amount and collected amount
        const requiredAmount = record.codRequiredAmt;
        const collectedAmount = record.codCollectedAmt;
        return (
          <div>
            <div className="fw-bold"> required {formatCurrency(requiredAmount)}</div>
            <small className="text-muted">collected {formatCurrency(collectedAmount)}</small>
          </div>
        );
      },
      sorter: (a, b) => a.codRequiredAmt - b.codRequiredAmt,
      className: "text-end",
    },
    
    {
      title: "COD Settled",
      dataIndex: "codSettledAmt",
      render: (amount) => formatCurrency(amount),
      sorter: (a, b) => a.codSettledAmt - b.codSettledAmt,
      className: "text-end",
    },
    {
      title: "COD Outstanding",
      dataIndex: "codUnsettledAmt",
      render: (amount) => (
        <span className={amount > 0 ? "text-warning fw-bold" : "text-success"}>
          {formatCurrency(amount)}
        </span>
      ),
      sorter: (a, b) => a.codUnsettledAmt - b.codUnsettledAmt,
      className: "text-end",
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_, record) => (
        <RowActionsDropdown
          id={`dropdown-${record.orderNO}`}
          variant="outline-secondary"
          items={[
            { key: 'view-order', label: 'View Order', icon: 'feather-eye', href: `${route.packages}/${record.orderNO}` },
            { key: 'track-order', label: 'Track Order', icon: 'feather-map-pin', href: `${route.packages}/${record.orderNO}/track?trackingNumber=${record.orderNO}` },
            record.feesOutstanding > 0 && { key: 'pay-reconciliation', label: 'Pay Reconciliation', icon: 'feather-credit-card', href: `/admin/reconciliation-payment?orderNO=${record.orderNO}` },
          ]}
        />
      ),
    },
  ];

  // Tooltip render functions
  const renderTooltip = (props) => (
    <Tooltip id="pdf-tooltip" {...props}>
      Export PDF
    </Tooltip>
  );
  const renderExcelTooltip = (props) => (
    <Tooltip id="excel-tooltip" {...props}>
      Export Excel
    </Tooltip>
  );
  const renderRefreshTooltip = (props) => (
    <Tooltip id="refresh-tooltip" {...props}>
      Refresh
    </Tooltip>
  );
  const renderFilterTooltip = (props) => (
    <Tooltip id="filter-tooltip" {...props}>
      Toggle Filters
    </Tooltip>
  );
  const renderCollapseTooltip = (props) => (
    <Tooltip id="collapse-tooltip" {...props}>
      Collapse
    </Tooltip>
  );

  return (
    <React.Fragment>
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Order Reconciliation</h4>
              <h6>Track and reconcile order fees and COD payments</h6>
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
                <Link>
                  <ImageWithBasePath src="assets/img/icons/excel.svg" alt="img" />
                </Link>
              </OverlayTrigger>
            </li>
            <li>
              <OverlayTrigger placement="top" overlay={renderFilterTooltip}>
                <Link
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? "active" : ""}
                >
                  <Filter />
                </Link>
              </OverlayTrigger>
            </li>
            <li>
              <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
                <Link onClick={() => fetchData()}>
                  <RotateCcw />
                </Link>
              </OverlayTrigger>
            </li>
            <li>
              <OverlayTrigger placement="top" overlay={renderCollapseTooltip}>
                <Link id="collapse-header">
                  <ChevronUp />
                </Link>
              </OverlayTrigger>
            </li>
          </ul>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="card mb-3">
            <div className="card-body">
              <Form>
                <Row className="g-3">
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>From Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>To Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Vendor Code</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter vendor code"
                        value={vendorCode}
                        onChange={(e) => setVendorCode(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>DC Code</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter DC code"
                        value={dcCode}
                        onChange={(e) => setDcCode(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Verified Only</Form.Label>
                      <Form.Check
                        type="checkbox"
                        label="Show only verified records"
                        checked={verifiedOnly}
                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex gap-2 mt-4">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleApplyFilters}
                      >
                        Apply Filters
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={handleResetFilters}
                      >
                        Reset Filters
                      </button>
                    </div>
                  </Col>
                </Row>
              </Form>
            </div>
          </div>
        )}

        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-top">
              <div className="search-set">
                <input
                  type="text"
                  placeholder="Search orders..."
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
              <div className="total-count">
                <span>Total Records: {totalCount}</span>
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
                  dataSource={orderReconciliation?.Data || []}
                  pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: totalCount,
                    showSizeChanger: true,
                    pageSizeOptions: ['50', '100', '200', '500'],
                    onChange: (page, size) => {
                      setCurrentPage(page);
                      setPageSize(size);
                      fetchData({ pageNo: page, pageSize: size });
                    }
                  }}
                  rowKey={"orderNO"}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default OrderReconciliation;
