"use client";
import React, { useState, use } from "react";
import {
  ChevronLeft,
  RotateCcw,
} from "feather-icons-react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import Link from "@/components/Link";
import Datatable from "@/core/pagination/datatable";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import { useVendorStatement } from "@/hooks/useVendorStatement";
import { exportToExcel, exportToPDF } from "@/utils/tableExport";
import { useAuth } from "@/contexts/AuthContext";
import { getVendorStatement } from "@/services/vendorService";

const VendorStatementsDetailPage = ({ params }) => {
  const { user } = useAuth();
  const unwrappedParams = use(params);
  const vendorCode = decodeURIComponent(unwrappedParams.id);
  
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  });

  // Use vendor statement hook
  const {
    statements,
    totalCount,
    loading,
    fetchStatements,
    error
  } = useVendorStatement({
    VendorCode: vendorCode,
    PageNO: currentPage,
    PageSize: pageSize,
    StartDate: dateRange.startDate || undefined,
    EndDate: dateRange.endDate || undefined
  });

  // Handle date filter
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // Export functions
  const fetchAllData = async () => {
    try {
      const response = await getVendorStatement({
        VendorCode: vendorCode,
        StartDate: dateRange.startDate || undefined,
        EndDate: dateRange.endDate || undefined,
        PageNO: 1,
        PageSize: 5000 // Large enough to get all transaction records
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
        data: statements,
        columns: columns,
        filename: `Statements_${vendorCode}`,
        title: `Vendor Statements: ${vendorCode}`,
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
        data: statements,
        columns: columns,
        filename: `Statements_${vendorCode}`,
        sheetName: "Statements",
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
      dataIndex: "transactionDate",
      key: "transactionDate",
      render: (date) => date ? new Date(date).toLocaleDateString() : "N/A",
      sorter: (a, b) => new Date(a.transactionDate) - new Date(b.transactionDate),
    },
    {
        title: "Reference NO",
        dataIndex: "referenceNO",
        key: "referenceNO",
        sorter: (a, b) => (a.referenceNO || "").localeCompare(b.referenceNO || ""),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      sorter: (a, b) => (a.description || "").localeCompare(b.description || ""),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      className: "text-center",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (val) => val?.toLocaleString() || "0",
      sorter: (a, b) => a.amount - b.amount,
      className: "text-end",
    },
    {
      title: "Balance",
      dataIndex: "accountBalance",
      key: "accountBalance",
      render: (val) => val?.toLocaleString() || "0",
      sorter: (a, b) => a.accountBalance - b.accountBalance,
      className: "text-end",
    },
  ];

  // Tooltip render functions
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
                <h4 className="mb-0">Vendor Statements: {vendorCode}</h4>
            </div>
            <h6>Detailed financial transactions for {vendorCode}</h6>
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
                <ImageWithBasePath
                  src="assets/img/icons/excel.svg"
                  alt="img"
                />
              </Link>
            </OverlayTrigger>
          </li>
          <li>
            <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
              <Link onClick={() => fetchStatements()}>
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
              <div className="row w-100 g-3 justify-content-end">
                <div className="col-md-3">
                  <input 
                    type="date" 
                    name="startDate"
                    className="form-control" 
                    value={dateRange.startDate}
                    onChange={handleDateChange}
                    placeholder="Start Date"
                  />
                </div>
                <div className="col-md-3">
                  <input 
                    type="date" 
                    name="endDate"
                    className="form-control" 
                    value={dateRange.endDate}
                    onChange={handleDateChange}
                    placeholder="End Date"
                  />
                </div>
                <div className="col-md-2">
                  <button 
                    className="btn btn-secondary w-100"
                    onClick={() => {
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
                dataSource={statements}
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

export default VendorStatementsDetailPage;
