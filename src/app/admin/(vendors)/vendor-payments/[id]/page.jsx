"use client";
import React, { useState, use } from "react";
import {
  ChevronLeft,
  RotateCcw,
} from "feather-icons-react";
import { OverlayTrigger, Tooltip, Badge } from "react-bootstrap";
import Link from "@/components/Link";
import Datatable from "@/core/pagination/datatable";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import { useVendorPayments } from "@/hooks/useVendorPayments";
import { exportToExcel, exportToPDF } from "@/utils/tableExport";
import { useAuth } from "@/contexts/AuthContext";
import { getVendorPayments } from "@/services/vendorService";

const VendorPaymentsDetailPage = ({ params }) => {
  const { user } = useAuth();
  const unwrappedParams = use(params);
  const vendorCode = decodeURIComponent(unwrappedParams.id);
  
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  });

  // Use vendor payments hook
  const {
    payments,
    totalCount,
    loading,
    fetchPayments,
    error
  } = useVendorPayments({
    vendorCode: vendorCode,
    pageNo: currentPage,
    pageSize: pageSize,
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
    searchTerm: searchTerm || undefined
  });

  // Handle filters
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Export functions
  const fetchAllData = async () => {
    try {
      const response = await getVendorPayments({
        VendorCode: vendorCode,
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
        searchTerm: searchTerm || undefined,
        PageNO: 1,
        PageSize: 5000 // Large enough to get all payment records
      });
      return response?.Data || [];
    } catch (error) {
      console.error("Error fetching all data for export:", error);
      return [];
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportToPDF({
        data: payments,
        columns: columns,
        filename: `Payments_${vendorCode}`,
        title: `Vendor Payments: ${vendorCode}`,
        user: user,
        fetchAllData: fetchAllData
      });
    } catch (error) {
      console.error("PDF Export failed:", error);
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportToExcel({
        data: payments,
        columns: columns,
        filename: `Payments_${vendorCode}`,
        sheetName: "Payments",
        fetchAllData: fetchAllData
      });
    } catch (error) {
      console.error("Excel Export failed:", error);
    }
  };

  // Table columns configuration
  const columns = [
    {
      title: "Date",
      dataIndex: "paymentDate",
      key: "paymentDate",
      render: (date) => date ? new Date(date).toLocaleDateString() : "N/A",
      sorter: (a, b) => new Date(a.paymentDate) - new Date(b.paymentDate),
    },
    {
        title: "Order NO",
        dataIndex: "orderNO",
        key: "orderNO",
        sorter: (a, b) => (a.orderNO || "").localeCompare(b.orderNO || ""),
    },
    {
      title: "Reference",
      dataIndex: "referenceNO",
      key: "referenceNO",
      sorter: (a, b) => (a.referenceNO || "").localeCompare(b.referenceNO || ""),
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      render: (name, record) => (
        <>
            <div>{name || "N/A"}</div>
            <div className="text-muted small">{record.phone || ""}</div>
        </>
      ),
      sorter: (a, b) => (a.customerName || "").localeCompare(b.customerName || ""),
    },
    {
      title: "Amount",
      dataIndex: "amountPaid",
      key: "amountPaid",
      render: (val) => (
        <span className="text-success fw-bold">
            {val?.toLocaleString() || "0"}
        </span>
      ),
      sorter: (a, b) => a.amountPaid - b.amountPaid,
      className: "text-end",
    },
    {
      title: "Source",
      dataIndex: "paymentSource",
      key: "paymentSource",
      render: (source) => (
        <Badge bg="info" className="text-dark">
            {source}
        </Badge>
      )
    },
  ];

  // Tooltip render functions
  const renderTooltip = (props) => (
    <Tooltip id="pdf-tooltip" {...props}>Pdf</Tooltip>
  );
  const renderExcelTooltip = (props) => (
    <Tooltip id="excel-tooltip" {...props}>Excel</Tooltip>
  );
  const renderRefreshTooltip = (props) => (
    <Tooltip id="refresh-tooltip" {...props}>Refresh</Tooltip>
  );

  return (
    <div className="content">
      <div className="page-header">
        <div className="add-item d-flex">
          <div className="page-title">
            <div className="d-flex align-items-center mb-2">
                <Link to="/admin/vendor-statements" className="btn btn-sm btn-outline-secondary me-2">
                    <ChevronLeft size={16} />
                    Back
                </Link>
                <h4 className="mb-0">Vendor Payments: {vendorCode}</h4>
            </div>
            <h6>History of payments received for {vendorCode}</h6>
          </div>
        </div>
        <ul className="table-top-head">
          <li>
            <OverlayTrigger placement="top" overlay={renderTooltip}>
              <Link onClick={(e) => { e.preventDefault(); handleExportPDF(); }}>
                <ImageWithBasePath src="assets/img/icons/pdf.svg" alt="img" />
              </Link>
            </OverlayTrigger>
          </li>
          <li>
            <OverlayTrigger placement="top" overlay={renderExcelTooltip}>
              <Link onClick={(e) => { e.preventDefault(); handleExportExcel(); }}>
                <ImageWithBasePath src="assets/img/icons/excel.svg" alt="img" />
              </Link>
            </OverlayTrigger>
          </li>
          <li>
            <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
              <Link onClick={() => fetchPayments()}>
                <RotateCcw />
              </Link>
            </OverlayTrigger>
          </li>
        </ul>
      </div>

      <div className="card table-list-card">
        <div className="card-body">
          <div className="table-top">
            <div className="search-set w-100">
              <div className="row w-100 g-3">
                <div className="col-md-4">
                  <input 
                    type="text" 
                    placeholder="Search payments..." 
                    className="form-control" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') { handleSearch(e.target.value); }
                    }}
                  />
                </div>
                <div className="col-md-3">
                  <input 
                    type="date" 
                    name="startDate"
                    className="form-control" 
                    value={dateRange.startDate}
                    onChange={handleDateChange}
                  />
                </div>
                <div className="col-md-3">
                  <input 
                    type="date" 
                    name="endDate"
                    className="form-control" 
                    value={dateRange.endDate}
                    onChange={handleDateChange}
                  />
                </div>
                <div className="col-md-2">
                  <button 
                    className="btn btn-secondary w-100"
                    onClick={() => {
                        setSearchTerm("");
                        setDateRange({ startDate: "", endDate: "" });
                        setCurrentPage(1);
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
          {error && <div className="alert alert-danger mb-3">{error}</div>}
          <div className="table-responsive">
            {loading ? (
              <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <Datatable 
                columns={columns} 
                dataSource={payments}
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: totalCount,
                  showSizeChanger: true,
                  pageSizeOptions: ['50', '100', '200', '500'],
                  onChange: (page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                  }
                }}
                rowKey="referenceNO"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPaymentsDetailPage;
