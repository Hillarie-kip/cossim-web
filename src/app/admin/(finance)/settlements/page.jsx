"use client"
import {
  ChevronUp,
  RotateCcw,
  Eye,
  Package,
  DollarSign,
  Calendar,
  Filter,
} from "feather-icons-react";
import React, { useState, useEffect } from "react";
import { OverlayTrigger, Tooltip, Badge, Button, Form, Row, Col, Card } from "react-bootstrap";
import Link from "@/components/Link";
import { all_routes } from "@/Router/all_routes";
import Datatable from "@/core/pagination/datatable";
import { useFinance } from "@/hooks/useFinance";
import SSRSelect from "@/components/SSRSelect";
import vendorService from "@/services/vendorService";

const SettlementsList = () => {
  const route = all_routes;

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [vendorCode, setVendorCode] = useState("");
  const [statusID, setStatusID] = useState("");

  // Use hooks
  const {
    settlements,
    settlementsPagination,
    loading,
    error,
    fetchSettlements,
  } = useFinance();

  // Local state for vendors
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchSettlements({
      fromDate,
      toDate,
      vendorCode,
      statusID,
      search: searchTerm,
      pageNo: currentPage,
      pageSize,
    });
  }, [currentPage, pageSize, fromDate, toDate, vendorCode, statusID]);

  // Fetch vendors for filter dropdown
  useEffect(() => {
    const loadVendors = async () => {
      setVendorsLoading(true);
      try {
        const response = await vendorService.getVendors();
        if (response && !response.Error) {
          setVendors(response.Data || []);
        }
      } catch (error) {
        console.error('Error fetching vendors:', error);
      } finally {
        setVendorsLoading(false);
      }
    };

    loadVendors();
  }, []);

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
    fetchSettlements({
      fromDate,
      toDate,
      vendorCode,
      statusID,
      search: value,
      pageNo: 1,
      pageSize,
    });
  };

  // Handle filter application
  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchSettlements({
      fromDate,
      toDate,
      vendorCode,
      statusID,
      search: searchTerm,
      pageNo: 1,
      pageSize,
    });
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setFromDate("");
    setToDate("");
    setVendorCode("");
    setStatusID("");
    setCurrentPage(1);
    fetchSettlements({
      fromDate: "",
      toDate: "",
      vendorCode: "",
      statusID: "",
      search: searchTerm,
      pageNo: 1,
      pageSize,
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

  // Get status badge
  const getStatusBadge = (statusID) => {
    const statusMap = {
      1: { variant: "success", text: "Active" },
      2: { variant: "warning", text: "Pending" },
      3: { variant: "info", text: "Processing" },
      4: { variant: "primary", text: "Completed" },
      5: { variant: "danger", text: "Cancelled" },
    };
    const status = statusMap[statusID] || { variant: "secondary", text: "Unknown" };
    return <Badge bg={status.variant}>{status.text}</Badge>;
  };

  // Vendor options for filter
  const vendorOptions = vendors?.map(vendor => ({
    value: vendor.vendorCode,
    label: `${vendor.vendorCode} - ${vendor.vendorName}`
  })) || [];

  // Status options for filter
  const statusOptions = [
    { value: "1", label: "Active" },
    { value: "2", label: "Pending" },
    { value: "3", label: "Processing" },
    { value: "4", label: "Completed" },
    { value: "5", label: "Cancelled" },
  ];

  // Table columns configuration
  const columns = [
    {
      title: "Settlement NO",
      dataIndex: "settlementNO",
      sorter: (a, b) => a.settlementNO.localeCompare(b.settlementNO),
      render: (settlementNO) => (
        <Link href={`/admin/settlements/${settlementNO}`} className="text-primary fw-bold">
          {settlementNO}
        </Link>
      ),
    },
    {
      title: "Vendor",
      dataIndex: "vendorCode",
      sorter: (a, b) => a.vendorCode.localeCompare(b.vendorCode),
      render: (vendorCode) => {
        const vendor = vendors?.find(v => v.vendorCode === vendorCode);
        return vendor ? `${vendor.vendorCode} - ${vendor.vendorName}` : vendorCode;
      },
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      render: (amount) => formatCurrency(amount),
      sorter: (a, b) => a.totalAmount - b.totalAmount,
      className: "text-end",
    },
    {
      title: "Status",
      dataIndex: "statusID",
      render: (statusID) => getStatusBadge(statusID),
      sorter: (a, b) => a.statusID - b.statusID,
    },
    {
      title: "Settled At",
      dataIndex: "settledAt",
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.settledAt) - new Date(b.settledAt),
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
        <Link href={`/admin/settlements/${record.settlementNO}`}>
          <Button variant="outline-primary" size="sm">
            <Eye size={14} className="me-1" />
            View Details
          </Button>
        </Link>
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

  return (
    <React.Fragment>
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Settlements</h4>
              <h6>Manage COD settlements and payments</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <li>
              <OverlayTrigger placement="top" overlay={renderTooltip}>
                <Link>
                  <Package className="feather-pdf" />
                </Link>
              </OverlayTrigger>
            </li>
            <li>
              <OverlayTrigger placement="top" overlay={renderExcelTooltip}>
                <Link>
                  <DollarSign className="feather-excel" />
                </Link>
              </OverlayTrigger>
            </li>
            <li>
              <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
                <Link
                  onClick={() => fetchSettlements({
                    fromDate,
                    toDate,
                    vendorCode,
                    statusID,
                    search: searchTerm,
                    pageNo: currentPage,
                    pageSize,
                  })}
                >
                  <RotateCcw />
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
          </ul>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="mb-3">
            <Card.Body>
              <Form>
                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>From Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>To Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Vendor</Form.Label>
                      <SSRSelect
                        options={vendorOptions}
                        value={vendorOptions.find(option => option.value === vendorCode)}
                        onChange={(selected) => setVendorCode(selected?.value || "")}
                        placeholder="Select Vendor"
                        isClearable
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <SSRSelect
                        options={statusOptions}
                        value={statusOptions.find(option => option.value === statusID)}
                        onChange={(selected) => setStatusID(selected?.value || "")}
                        placeholder="Select Status"
                        isClearable
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-flex gap-2">
                  <Button variant="primary" onClick={handleApplyFilters}>
                    Apply Filters
                  </Button>
                  <Button variant="outline-secondary" onClick={handleResetFilters}>
                    Reset
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        )}

        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-top">
              <div className="search-set">
                <input
                  type="text"
                  placeholder="Search settlements..."
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
                  dataSource={settlements}
                  pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: settlementsPagination?.totalItems || 0,
                    showSizeChanger: true,
                    pageSizeOptions: ['50', '100', '200', '500'],
                    onChange: (page, size) => {
                      setCurrentPage(page);
                      setPageSize(size);
                    }
                  }}
                  rowKey={"settlementNO"}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default SettlementsList;
