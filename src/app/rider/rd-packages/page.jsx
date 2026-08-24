"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "@/components/Link";
import { Card, Row, Col, Badge, Button, Modal, Form, Alert, Nav } from "react-bootstrap";
import {
  Package,
  MapPin,
  Clock,
  Phone,
  User,
  AlertCircle,
  CheckCircle,
  Truck,
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from "feather-icons-react";
import { useUser } from "@/hooks/useUser";
import { useShipment } from "@/hooks/useShipment";
import { UpdateStatusModal } from "@/components/modals";
import notify from "@/lib/toast";

const PAGE_SIZES = [10, 20, 50];

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "assigned", label: "Assigned" },
  { key: "inTransit", label: "In Transit" },
  { key: "completed", label: "Completed" },
  { key: "failed", label: "Failed" },
];

const mapStatus = (statusCode) => {
  const map = {
    SERVICE_FEE_REQUIRED: "assigned",
    PAYMENT_CONFIRMED: "assigned",
    PENDING: "assigned",
    OUT_FOR_DELIVERY: "inTransit",
    DELIVERED: "completed",
    FAILED: "failed",
    CANCELLED: "failed",
  };
  return map[statusCode] || "assigned";
};

const STATUS_META = {
  assigned: {
    label: "Assigned",
    className: "is-assigned",
  },
  inTransit: {
    label: "In Transit",
    className: "is-in-transit",
  },
  completed: {
    label: "Completed",
    className: "is-completed",
  },
  failed: {
    label: "Failed",
    className: "is-failed",
  },
};

const formatCurrency = (value) =>
  `KES ${Number(value || 0).toLocaleString("en-KE")}`;

const formatDate = (value) => {
  if (!value) return "Date not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not available";

  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const transformItem = (item) => ({
  id: item.OrderNO,
  recipient: item.ReceiverContactName || "Customer",
  phone: item.ReceiverContactPhone || "",
  address:
    [item.ReceiverStreetName, item.ReceiverArea, item.ReceiverCity]
      .filter(Boolean)
      .join(", ") || "Address not specified",
  codAmount: item.CODAmount || 0,
  serviceFee: item.ServiceFee || 0,
  weight: item.ShipmentOrderItems?.[0]?.weight
    ? `${item.ShipmentOrderItems[0].weight} kg`
    : "N/A",
  notes: item.Notes || "",
  pickupTime: item.DateAdded,
  status: mapStatus(item.StatusCode),
  statusID: item.StatusID,
  statusCode: item.StatusCode,
  statusName: item.StatusName,
  statusTransitions: item.StatusTransitionArray || [],
  vendorName: item.VendorName || "",
  deliveryType: item.DeliveryType || "",
  originDC: item.OriginDCName || "",
  destinationDC: item.DestinationDCName || "",
  hasCOD: item.CashOnDeliveryRequired,
  originalData: item,
});

const RiderPackages = () => {
  const { user } = useUser();
  const {
    loading,
    error,
    shipmentOrders,
    pagination,
    fetchShipmentOrdersByRider,
    clearError,
    handleUpdateShipmentStatus,
  } = useShipment();

  // Pagination & filter state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Committed search params (sent to API only on Search button / Enter)
  const [activeSearch, setActiveSearch] = useState("");
  const [activeStartDate, setActiveStartDate] = useState("");
  const [activeEndDate, setActiveEndDate] = useState("");

  // UI state
  const [activeTab, setActiveTab] = useState("all");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);

  // Fetch from backend whenever page/size/active filters change
  useEffect(() => {
    if (!user?.UserCode) return;
    fetchShipmentOrdersByRider({
      RiderUserCode: user.UserCode,
      pageNo: currentPage,
      pageSize,
      onlyActive: false,
      ...(activeSearch && { searchTerm: activeSearch }),
      ...(activeStartDate && { startDate: activeStartDate }),
      ...(activeEndDate && { endDate: activeEndDate }),
    });
  }, [user?.UserCode, currentPage, pageSize, activeSearch, activeStartDate, activeEndDate, fetchShipmentOrdersByRider]);

  const packages = (shipmentOrders || []).map(transformItem);

  const filteredPackages =
    activeTab === "all"
      ? packages
      : packages.filter((p) => p.status === activeTab);

  const tabCount = (key) =>
    key === "all"
      ? packages.length
      : packages.filter((p) => p.status === key).length;

  // Commit search params and reset to page 1
  const handleSearch = () => {
    setActiveSearch(searchInput);
    setActiveStartDate(startDate);
    setActiveEndDate(endDate);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setStartDate("");
    setEndDate("");
    setActiveSearch("");
    setActiveStartDate("");
    setActiveEndDate("");
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(Number(newSize));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRefresh = () => {
    if (!user?.UserCode) return;
    fetchShipmentOrdersByRider({
      RiderUserCode: user.UserCode,
      pageNo: currentPage,
      pageSize,
      onlyActive: false,
      ...(activeSearch && { searchTerm: activeSearch }),
      ...(activeStartDate && { startDate: activeStartDate }),
      ...(activeEndDate && { endDate: activeEndDate }),
    });
  };

  // Update status
  const handleUpdateStatus = (pkg) => {
    setSelectedPackage(pkg);
    setShowUpdateStatusModal(true);
  };

  const handleUpdateStatusSubmit = async (payload) => {
    try {
      const response = await handleUpdateShipmentStatus(payload);
      if (response?.Error) {
        throw new Error(response.Message || "Failed to update status");
      }
      return response;
    } catch (e) {
      console.error("Failed to update status:", e);
      throw e;
    }
  };

  const handleStatusUpdateSuccess = async (orderNO) => {
    if (!orderNO || !user?.UserCode) return;

    setSearchInput(orderNO);
    setStartDate("");
    setEndDate("");
    setActiveSearch(orderNO);
    setActiveStartDate("");
    setActiveEndDate("");
    setActiveTab("all");
    setCurrentPage(1);

    await fetchShipmentOrdersByRider({
      RiderUserCode: user.UserCode,
      pageNo: 1,
      pageSize,
      onlyActive: false,
      searchTerm: orderNO,
    });
  };

  // Complete delivery
  const handleCompleteDelivery = (pkg) => {
    setSelectedPackage(pkg);
    setDeliveryNotes("");
    setDeliveryConfirmed(false);
    setShowDeliveryModal(true);
  };

  const confirmDelivery = async () => {
    try {
      await handleUpdateShipmentStatus({
        orderNO: selectedPackage.id,
        statusID: 503,
        notes: deliveryNotes,
      });
      setShowDeliveryModal(false);
      handleRefresh();
      notify.success("Package has been successfully delivered.");
    } catch (e) {
      notify.error("Failed to complete delivery. Please try again.");
    }
  };

  // Pagination controls
  const totalPages = pagination?.totalPages || 0;
  const totalItems = pagination?.totalItems || 0;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

    const pageNumbers = [];
    for (let i = start; i <= end; i++) pageNumbers.push(i);

    return (
      <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-2">
        <small className="text-muted">
          Showing {startItem}–{endItem} of {totalItems} packages
        </small>
        <div className="d-flex align-items-center gap-1">
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={currentPage === 1 || loading}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <ChevronLeft size={14} />
          </Button>

          {start > 1 && (
            <>
              <Button variant="outline-secondary" size="sm" onClick={() => handlePageChange(1)}>
                1
              </Button>
              {start > 2 && <span className="px-1 text-muted">…</span>}
            </>
          )}

          {pageNumbers.map((p) => (
            <Button
              key={p}
              size="sm"
              variant={p === currentPage ? "primary" : "outline-secondary"}
              onClick={() => handlePageChange(p)}
              disabled={loading}
            >
              {p}
            </Button>
          ))}

          {end < totalPages && (
            <>
              {end < totalPages - 1 && <span className="px-1 text-muted">…</span>}
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}

          <Button
            variant="outline-secondary"
            size="sm"
            disabled={currentPage === totalPages || loading}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    );
  };

  const PackageCard = ({ pkg }) => (
    <Card className={`rider-package-card ${STATUS_META[pkg.status]?.className || ""}`}>
      <Card.Body>
        <div className="package-card-grid">
          <div className="package-main">
            <Link
              to={`/rider/rd-packages/${pkg.id}`}
              className="package-id"
            >
              {pkg.id}
            </Link>
            <div className="package-badges">
              {pkg.deliveryType && (
                <Badge className="package-badge delivery-badge">
                  {pkg.deliveryType}
                </Badge>
              )}
              <Badge className={`package-badge status-badge status-${pkg.status}`}>
                {pkg.statusName || STATUS_META[pkg.status]?.label || pkg.status}
              </Badge>
              {pkg.hasCOD && <Badge className="package-badge cod-badge">COD</Badge>}
            </div>

            <div className="package-contact">
              <div className="info-row">
                <User size={15} className="text-primary" />
                <div>
                  <span className="info-title">{pkg.recipient}</span>
                  <span className="info-subtitle">{pkg.phone || "No phone number"}</span>
                </div>
              </div>
              <div className="info-row align-items-start">
                <MapPin size={15} className="text-success mt-1" />
                <span className="info-subtitle">{pkg.address}</span>
              </div>
            </div>
          </div>

          <div className="package-route">
            {pkg.vendorName && (
              <div className="info-row">
                <Package size={15} className="text-info" />
                <small>
                  <span className="text-muted">Vendor: </span>
                  <span className="fw-semibold">{pkg.vendorName}</span>
                </small>
              </div>
            )}
            <div className="info-row">
              <Truck size={15} className="text-secondary" />
              <small className="text-muted">
                {pkg.originDC || "Origin not specified"}
                {pkg.destinationDC && pkg.destinationDC !== pkg.originDC
                  ? ` -> ${pkg.destinationDC}`
                  : ""}
              </small>
            </div>
            <div className="info-row">
              <Clock size={15} className="text-warning" />
              <small className="text-muted">{formatDate(pkg.pickupTime)}</small>
            </div>
          </div>

          <div className="package-money-actions">
            <div className="package-money">
              {pkg.codAmount > 0 ? (
                <>
                  <span className="money-label">COD Amount</span>
                  <strong className="money-value text-success">
                    {formatCurrency(pkg.codAmount)}
                  </strong>
                </>
              ) : pkg.serviceFee > 0 ? (
                <>
                  <span className="money-label">Service Fee</span>
                  <strong className="money-value">{formatCurrency(pkg.serviceFee)}</strong>
                </>
              ) : (
                <>
                  <span className="money-label">Payment</span>
                  <strong className="money-value">No collection</strong>
                </>
              )}
            </div>

            {(pkg.status === "assigned" || pkg.status === "inTransit") && (
              <div className="package-actions">
                {pkg.status === "inTransit" && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="primary-action"
                    onClick={() => handleCompleteDelivery(pkg)}
                  >
                    <CheckCircle size={14} className="me-1" />
                    Mark Delivered
                  </Button>
                )}
                <Button
                  variant={pkg.status === "inTransit" ? "outline-success" : "success"}
                  size="sm"
                  onClick={() => handleUpdateStatus(pkg)}
                >
                  <Truck size={14} className="me-1" />
                  Update
                </Button>
                {pkg.phone && (
                  <a className="btn btn-sm btn-outline-info" href={`tel:${pkg.phone}`}>
                    <Phone size={14} className="me-1" />
                    Call
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {pkg.notes && (
          <Alert variant="info" className="package-note">
            <AlertCircle size={13} className="me-1" />
            {pkg.notes}
          </Alert>
        )}
      </Card.Body>
    </Card>
  );

  const EmptyState = () => (
    <div className="empty-packages">
      <Inbox size={46} />
      <h5>No packages found</h5>
      <p>
        {hasActiveFilters
          ? "Try adjusting your search or date filters."
          : activeTab !== "all"
          ? `No ${STATUS_TABS.find((tab) => tab.key === activeTab)?.label.toLowerCase()} packages on this page.`
          : "You have no packages assigned yet."}
      </p>
    </div>
  );

  const hasActiveFilters = activeSearch || activeStartDate || activeEndDate;

  return (
    <div className="content">
      <div className="page-header">
        <div className="add-item d-flex">
          <div className="page-title">
            <h4>My Packages</h4>
            <h6>Scan your route, update delivery status, and collect COD faster</h6>
          </div>
        </div>
        <div className="page-btn">
          <Link to="/rider/rd-packages/create" className="btn btn-added">
            <Plus size={16} className="me-2" />
            Create Package
          </Link>
        </div>
      </div>

      <Card className="rider-filter-card">
        <Card.Body className="py-3">
          <Row className="g-2 align-items-end">
            <Col md={4} sm={12}>
              <Form.Label className="small fw-semibold mb-1">Search</Form.Label>
              <Form.Control
                size="sm"
                type="text"
                placeholder="Order ID, recipient, phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </Col>
            <Col md={2} sm={6}>
              <Form.Label className="small fw-semibold mb-1">From</Form.Label>
              <Form.Control
                size="sm"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Col>
            <Col md={2} sm={6}>
              <Form.Label className="small fw-semibold mb-1">To</Form.Label>
              <Form.Control
                size="sm"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Col>
            <Col md={1} sm={4}>
              <Form.Label className="small fw-semibold mb-1">Per page</Form.Label>
              <Form.Select
                size="sm"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(e.target.value)}
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3} sm={8} className="d-flex gap-2">
              <Button size="sm" variant="primary" className="flex-fill" onClick={handleSearch}>
                <Search size={13} className="me-1" />
                Search
              </Button>
              {hasActiveFilters && (
                <Button size="sm" variant="outline-secondary" onClick={handleClearFilters}>
                  Clear
                </Button>
              )}
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={handleRefresh}
                disabled={loading}
                title="Refresh"
              >
                <RefreshCw size={13} className={loading ? "spin" : ""} />
              </Button>
            </Col>
          </Row>

          {hasActiveFilters && (
            <div className="mt-2">
              <small className="text-muted">
                Filters active:{" "}
                {[
                  activeSearch && `search "${activeSearch}"`,
                  activeStartDate && `from ${activeStartDate}`,
                  activeEndDate && `to ${activeEndDate}`,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </small>
            </div>
          )}
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger" className="mb-3">
          <AlertCircle size={16} className="me-2" />
          {error}
          <button type="button" className="btn-close float-end" onClick={clearError} />
        </Alert>
      )}

      <Card className="rider-list-panel">
        <Card.Body>
          <Nav
            variant="pills"
            className="rider-status-tabs"
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
          >
            {STATUS_TABS.map((tab) => (
              <Nav.Item key={tab.key}>
                <Nav.Link eventKey={tab.key}>
                  {tab.label}
                  <Badge pill className="ms-2 tab-count">
                    {tabCount(tab.key)}
                  </Badge>
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted small">Loading packages...</p>
            </div>
          ) : filteredPackages.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {filteredPackages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
              {renderPagination()}
            </>
          )}
        </Card.Body>
      </Card>

      <style jsx global>{`
        .money-label {
          display: block;
          color: #7e8ca3;
          font-size: 12px;
          line-height: 1.3;
        }

        .rider-filter-card,
        .rider-list-panel {
          border: 1px solid #e8edf3;
          border-radius: 8px;
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.035);
        }

        .rider-filter-card {
          margin-bottom: 14px;
        }

        .rider-status-tabs {
          gap: 8px;
          margin-bottom: 16px;
          border-bottom: 1px solid #edf0f4;
          padding-bottom: 12px;
        }

        .rider-status-tabs .nav-link {
          border-radius: 8px;
          color: #526174;
          font-weight: 700;
          font-size: 13px;
          padding: 8px 12px;
        }

        .rider-status-tabs .nav-link.active {
          background: #fff4ec;
          color: #ff5c00;
        }

        .rider-status-tabs .tab-count {
          background: #111827;
          color: #fff;
        }

        .rider-package-card {
          border: 1px solid #e6ebf2;
          border-left: 4px solid #8aa4c8;
          border-radius: 8px;
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.035);
          margin-bottom: 12px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }

        .rider-package-card:hover {
          border-color: #d3dce9;
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
          transform: translateY(-1px);
        }

        .rider-package-card.is-assigned {
          border-left-color: #2f6fed;
        }

        .rider-package-card.is-in-transit {
          border-left-color: #ff8a00;
        }

        .rider-package-card.is-completed {
          border-left-color: #16a34a;
        }

        .rider-package-card.is-failed {
          border-left-color: #dc3545;
        }

        .package-card-grid {
          display: grid;
          grid-template-columns: minmax(260px, 1.35fr) minmax(240px, 1fr) minmax(190px, 0.72fr);
          gap: 20px;
          align-items: start;
        }

        .package-id {
          color: #1f2a44;
          display: inline-block;
          font-size: 14px;
          font-weight: 800;
          margin-bottom: 7px;
          text-decoration: none;
          word-break: break-word;
        }

        .package-id:hover {
          color: #ff5c00;
        }

        .package-badges,
        .package-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .package-badge {
          border-radius: 5px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0;
          padding: 4px 7px;
        }

        .delivery-badge {
          background: #f04438 !important;
          color: #fff;
        }

        .cod-badge {
          background: #0ea5b7 !important;
          color: #fff;
        }

        .status-assigned {
          background: #2f6fed !important;
        }

        .status-inTransit {
          background: #ff8a00 !important;
          color: #fff;
        }

        .status-completed {
          background: #16a34a !important;
        }

        .status-failed {
          background: #dc3545 !important;
        }

        .package-contact {
          display: grid;
          gap: 8px;
          margin-top: 14px;
        }

        .package-route {
          display: grid;
          gap: 9px;
          padding-top: 2px;
        }

        .info-row {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .info-row svg {
          flex: 0 0 auto;
        }

        .info-title {
          display: block;
          color: #1f2a44;
          font-weight: 800;
          line-height: 1.3;
        }

        .info-subtitle {
          color: #7e8ca3;
          display: block;
          font-size: 12px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .package-money-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 14px;
          text-align: right;
        }

        .money-value {
          color: #1f2a44;
          display: block;
          font-size: 15px;
          line-height: 1.3;
        }

        .package-actions {
          justify-content: flex-end;
        }

        .package-actions .btn {
          border-radius: 5px;
          font-weight: 800;
          min-height: 30px;
          white-space: nowrap;
        }

        .package-actions .primary-action {
          background: #ff5c00;
          border-color: #ff5c00;
        }

        .package-note {
          align-items: center;
          border: 0;
          border-radius: 6px;
          display: flex;
          font-size: 12px;
          margin: 14px 0 0;
          padding: 8px 10px;
        }

        .empty-packages {
          color: #7e8ca3;
          padding: 58px 16px;
          text-align: center;
        }

        .empty-packages svg {
          color: #b7c1cf;
          margin-bottom: 14px;
        }

        .empty-packages h5 {
          color: #1f2a44;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .empty-packages p {
          margin: 0;
        }

        @media (max-width: 1199.98px) {
          .package-card-grid {
            grid-template-columns: minmax(260px, 1.2fr) minmax(220px, 1fr);
          }

          .package-money-actions {
            align-items: flex-start;
            border-top: 1px solid #edf0f4;
            grid-column: 1 / -1;
            padding-top: 12px;
            text-align: left;
          }

          .package-actions {
            justify-content: flex-start;
          }
        }

        @media (max-width: 767.98px) {
          .package-card-grid {
            grid-template-columns: 1fr;
          }

          .rider-status-tabs {
            flex-wrap: nowrap;
            overflow-x: auto;
            padding-bottom: 10px;
          }

          .rider-status-tabs .nav-item {
            flex: 0 0 auto;
          }

          .package-card-grid {
            gap: 14px;
          }

          .package-route,
          .package-money-actions {
            border-top: 1px solid #edf0f4;
            padding-top: 12px;
          }

          .package-actions,
          .package-actions .btn {
            width: 100%;
          }

          .package-actions .btn {
            justify-content: center;
          }
        }
      `}</style>

      {/* Delivery Completion Modal */}
      <Modal show={showDeliveryModal} onHide={() => setShowDeliveryModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Complete Delivery</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPackage && (
            <>
              <Alert variant="info" className="py-2 mb-3">
                <strong>{selectedPackage.id}</strong>
                <br />
                <span>{selectedPackage.recipient}</span>
                <br />
                <small className="text-muted">{selectedPackage.address}</small>
              </Alert>
              <Form.Group className="mb-3">
                <Form.Label>Delivery Notes <span className="text-muted">(optional)</span></Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="e.g. Left with neighbour, handed to security..."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                />
              </Form.Group>
              <Form.Check
                type="checkbox"
                id="delivery-confirm"
                label="I confirm the package was delivered to the correct recipient"
                checked={deliveryConfirmed}
                onChange={(e) => setDeliveryConfirmed(e.target.checked)}
              />
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeliveryModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={confirmDelivery} disabled={!deliveryConfirmed}>
            <CheckCircle size={16} className="me-2" />
            Confirm Delivery
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Update Status Modal */}
      <UpdateStatusModal
        show={showUpdateStatusModal}
        onClose={() => {
          setShowUpdateStatusModal(false);
          setSelectedPackage(null);
        }}
        onSubmit={handleUpdateStatusSubmit}
        onSuccess={handleStatusUpdateSuccess}
        order={selectedPackage?.originalData}
        userRole="rider"
      />
    </div>
  );
};

export default RiderPackages;
