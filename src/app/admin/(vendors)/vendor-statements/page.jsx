"use client";
import React, { useState } from "react";
import {
  ChevronUp,
  RotateCcw,
} from "feather-icons-react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import Link from "@/components/Link";
import Datatable from "@/core/pagination/datatable";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import RowActionsDropdown from "@/components/RowActionsDropdown";
import { useVendorSummary } from "@/hooks/useVendorSummary";
import { exportToExcel, exportToPDF } from "@/utils/tableExport";
import { useAuth } from "@/contexts/AuthContext";
import { getVendorSummary } from "@/services/vendorService";

const VendorStatementsPage = () => {
  const { user } = useAuth();
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  });

  // Use vendor summary hook
  const {
    summary,
    totalCount,
    loading,
    fetchSummary
  } = useVendorSummary({
    pageNo: currentPage,
    pageSize: pageSize,
    searchTerm: searchTerm || undefined,
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined
  });

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Handle date filter
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // Export functions
  const fetchAllData = async () => {
    try {
      const response = await getVendorSummary({
        searchTerm: searchTerm || undefined,
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
        pageNo: 1,
        pageSize: 1000 // Large enough to get all summary records
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
        data: summary,
        columns: columns,
        filename: "Vendor_Summary",
        title: "Vendor Financial Summary",
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
        data: summary,
        columns: columns,
        filename: "Vendor_Summary",
        sheetName: "Summary",
        fetchAllData: fetchAllData
      });
    } catch (error) {
      console.error("Excel Export failed:", error);
    }
  };

  // Table columns configuration
  const columns = [
    {
      title: "Vendor Code",
      dataIndex: "vendorCode",
      key: "vendorCode",
      sorter: (a, b) => (a.vendorCode || "").localeCompare(b.vendorCode || ""),
    },
    {
      title: "Opening Bal",
      dataIndex: "openingBalance",
      key: "openingBalance",
      render: (val) => val?.toLocaleString() || "0",
      sorter: (a, b) => a.openingBalance - b.openingBalance,
    },
    {
      title: "Period Credits",
      dataIndex: "periodCredits",
      key: "periodCredits",
      render: (val) => val?.toLocaleString() || "0",
      sorter: (a, b) => a.periodCredits - b.periodCredits,
    },
    {
      title: "Period Debits",
      dataIndex: "periodDebits",
      key: "periodDebits",
      render: (val) => val?.toLocaleString() || "0",
      sorter: (a, b) => a.periodDebits - b.periodDebits,
    },
    {
      title: "Closing Bal",
      dataIndex: "closingBalance",
      key: "closingBalance",
      render: (val) => val?.toLocaleString() || "0",
      sorter: (a, b) => a.closingBalance - b.closingBalance,
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (_, record) => (
        <RowActionsDropdown
          id={`dropdown-${record.vendorCode}`}
          items={[
            { key: 'vendor-statements', label: 'Vendor Statements', icon: 'feather-file-text', href: `/admin/vendor-statements/${record.vendorCode}` },
            { key: 'vendor-payments', label: 'Vendor Payments', icon: 'feather-credit-card', href: `/admin/vendor-payments/${record.vendorCode}` },
          ]}
        />
      ),
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
  const renderCollapseTooltip = (props) => (
    <Tooltip id="collapse-tooltip" {...props}>
      Collapse
    </Tooltip>
  );

  return (
    <div className="content">
      <div className="page-header">
        <div className="add-item d-flex">
          <div className="page-title">
            <h4>Vendor Summary</h4>
            <h6>Manage and view vendor financial statements</h6>
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
              <Link onClick={() => fetchSummary()}>
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

      <div className="card table-list-card">
        <div className="card-body">
          <div className="table-top">
            <div className="search-set w-100">
              <div className="row w-100 g-3">
                <div className="col-md-4">
                  <input 
                    type="text" 
                    placeholder="Search vendors..." 
                    className="form-control" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch(e.target.value);
                      }
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
                <div className="col-md-2 d-flex gap-2">
                  <button 
                    className="btn btn-primary w-100"
                    onClick={() => handleSearch(searchTerm)}
                  >
                    Search
                  </button>
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
                dataSource={summary}
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
                rowKey="vendorCode"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorStatementsPage;
