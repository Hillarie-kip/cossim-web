"use client"
import React, { useState } from "react";
import { Card, Row, Col, Badge, Alert, Button } from "react-bootstrap";
import {
  Package,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCcw,
  BarChart,
  TrendingUp,
  Send,
  Target,
  Eye,
  MapPin,
  RefreshCw as RefreshCwIcon
} from "feather-icons-react";
import DashCard from "@/components/cards/DashCard";
import Datatable from "@/core/pagination/datatable";
import StatsCard from "@/components/cards/StatsCard";
import { useRiderDashboard } from "@/hooks/useDashboard";
import { useShipment } from "@/hooks/useShipment";
import Link from "@/components/Link";
import RowActionsDropdown from "@/components/RowActionsDropdown";
import { UpdateStatusModal, BulkUpdateStatusModal } from "@/components/modals";
import notify from "@/lib/toast";

const RiderDashboard = () => {
  // Use the rider dashboard hook
  const {
    summaryStats,
    riderShipments,
    loading,
    error,
    refetch
  } = useRiderDashboard();

  const { handleUpdateShipmentStatus, handleUpdateShipmentStatusBatch } = useShipment();

  // Transform API data to match component expectations
  const riderData = {
    name: "Rider", // Could be from user context if available
    role: "Rider",
    status: "online",
    todayDeliveries: summaryStats?.todayDeliveries || 0,
    totalDeliveries: summaryStats?.totalDeliveries || 0,
    outForDelivery: summaryStats?.activeManifestCount || 0,
    codCollections: summaryStats?.todayCodAmount || 0,
    successRate: "94.2%", // Could calculate from API data
    avgRating: "4.7", // Could be from API if available
    totalEarnings: `KES ${summaryStats?.totalCodAmount || 0}`,
    completionRate: "94%", // Could calculate from API data
    onTimeRate: "89%", // Could calculate from API data
    customerSatisfaction: "4.7" // Could be from API if available
  };

  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showBulkUpdateStatusModal, setShowBulkUpdateStatusModal] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Transform shipments data for today's deliveries table
  const todaysDeliveries = (riderShipments || []).map(shipment => ({
    OrderNO: shipment.OrderNO,
    VendorName: shipment.VendorName,
    VendorPhone: shipment.VendorPhone,
    ReceiverContactName: shipment.ReceiverContactName,
    ReceiverContactPhone: shipment.ReceiverContactPhone,
    ReceiverAddress: shipment.ReceiverStreetName ? `${shipment.ReceiverStreetName}, ${shipment.ReceiverCity}` : shipment.ReceiverCity || "-",
    ServiceFee: shipment.ServiceFee,
    CODAmount: shipment.CODAmount,
    OriginDCName: shipment.OriginDCName,
    DestinationDCName: shipment.DestinationDCName,
    ReceiverBuilding: shipment.ReceiverBuilding,
    DateAdded: shipment.DateAdded,
    AddedBy: shipment.AddedBy,
    StatusID: shipment.StatusID,
    StatusName: shipment.StatusName,
    ShipmentOrderID: shipment.ShipmentOrderID,
    StatusTransitionArray: shipment.StatusTransitionArray || [],
    CashOnDeliveryRequired: shipment.CashOnDeliveryRequired
  }));

  const refreshData = () => {
    notify.info("Updating your dashboard information");
    refetch();
  };

  const getStatusBadgeClass = (statusCode) => {
    switch (statusCode) {
      // 100 Vendor
      case 101: // VENDOR_CREATED
        return "badge bg-primary"; // blue
      case 102: // VENDOR_READY_FOR_PICKUP
        return "badge bg-info"; // cyan
      case 103: // VENDOR_HANDED_TO_DC
        return "badge bg-dark"; // dark gray

      // 200 Inbound / DC transfer
      case 201: // INBOUND_TO_DC
        return "badge bg-warning text-dark"; // amber
      case 202: // ARRIVED_AT_DC
        return "badge bg-success"; // green
      case 206: // DC_HOLD_FOR_TRANSFER
        return "badge bg-secondary"; // gray
      case 207: // DC_TRANSFER_BATCHED
        return "badge bg-light text-dark"; // white
      case 208: // DC_TRANSFER_DISPATCHED
        return "badge bg-primary"; // blue
      case 209: // DC_TRANSFER_INBOUND
        return "badge bg-info"; // cyan

      // 300 DC & QC
      case 301: // DC_QC_CHECK
        return "badge bg-warning text-dark";
      case 302: // DC_QC_PASSED
        return "badge bg-success";
      case 303: // DC_QC_FAILED
        return "badge bg-danger";
      case 304: // DC_STOCKED
        return "badge bg-dark";
      case 305: // DC_TRACKING_ASSIGNED
        return "badge bg-secondary";

      // 400 Assignment
      case 401: // ASSIGNED_TO_DELIVERY
        return "badge bg-primary";
      case 402: // ASSIGNED_FOR_PICKUP
        return "badge bg-info";
      case 403: // ASSIGNED_TO_PACK_CENTER
        return "badge bg-secondary";
      case 410: // DELIVERY_BATCHED
        return "badge bg-dark";

      // 500 Delivery
      case 501: // OUT_FOR_DELIVERY
        return "badge bg-warning text-dark";
      case 502: // DELIVERY_ATTEMPTED
        return "badge bg-info";
      case 503: // DELIVERED
        return "badge bg-success";
      case 504: // DELIVERY_WAITLIST
        return "badge bg-light text-dark";

      // 600 Pickup
      case 601: // PICKUP_READY
        return "badge bg-info";
      case 602: // PICKUP_PENDING_CUSTOMER
        return "badge bg-warning text-dark";
      case 603: // PICKED_UP
        return "badge bg-success";

      // 700 Return
      case 701: // RETURN_REQUESTED_BY_CUSTOMER
        return "badge bg-primary";
      case 702: // RETURN_IN_TRANSIT
        return "badge bg-warning text-dark";
      case 703: // RETURNED_TO_VENDOR
        return "badge bg-info";
      case 704: // RETURN_CLOSED
        return "badge bg-secondary";

      // 800 Payment
      case 801: // PAYMENT_INITIATED
        return "badge bg-info";
      case 802: // COD_COLLECTED
        return "badge bg-primary";
      case 803: // COD_REMITTED_TO_VENDOR
        return "badge bg-dark";
      case 804: // PAYMENT_CONFIRMED
        return "badge bg-success";
      case 805: // PAYMENT_FAILED
        return "badge bg-danger";

      // 900 Closed
      case 901: // CLOSED_SUCCESS
        return "badge bg-success";
      case 902: // CLOSED_CANCELLED
        return "badge bg-danger";
      case 903: // CLOSED_FAILED
        return "badge bg-dark";

      default:
        return "badge bg-secondary";
    }
  };

  const todaysDeliveriesColumns = [
    {
      title: "Order NO",
      dataIndex: "OrderNO",
      sorter: (a, b) => a.OrderNO.localeCompare(b.OrderNO),
      render: (text, record) => (
        <Link to={`/rider/rd-packages/${record.OrderNO}/track?trackingNumber=${record.OrderNO}`} className="text-primary">
          {text}
        </Link>
      )
    },
    {
      title: "Sender",
      dataIndex: "VendorPhone",
      sorter: (a, b) => {
        const codeCompare = a.VendorPhone.localeCompare(b.VendorPhone);
        if (codeCompare !== 0) return codeCompare;
        return a.VendorName.localeCompare(b.VendorName);
      },
      render: (text, record) => (
        <div>
          <div>{record.VendorName}</div>
          <small className="text-muted">{record.VendorPhone}</small>
        </div>
      ),
    },
    {
      title: "Receiver",
      dataIndex: "ReceiverContactName",
      sorter: (a, b) => {
        const codeCompare = a.ReceiverContactPhone.localeCompare(b.ReceiverContactPhone);
        if (codeCompare !== 0) return codeCompare;
        return a.ReceiverContactName.localeCompare(b.ReceiverContactName);
      },
      render: (text, record) => {
        if (!record.ReceiverContactName && !record.ReceiverContactPhone) {
          return <span>-</span>;
        }
        return (
          <div style={{ maxWidth: '200px' }} className="text-truncate" title={`${record.ReceiverContactName || "-"} (${record.ReceiverAddress || "-"}) - ${record.ReceiverContactPhone || "-"}`}>
            <div>{record.ReceiverContactName || "-"}</div>
            <small className="text-muted">{record.ReceiverContactPhone || "-"}</small>
          </div>
        );
      },
    },
    {
      title: "Amount",
      dataIndex: "ServiceFee",
      render: (text, record) => {
        const serviceFee = record.ServiceFee ? parseFloat(record.ServiceFee).toFixed(2) : "0.00";
        const codAmount = record.CODAmount ? parseFloat(record.CODAmount).toFixed(2) : "0.00";
        return (
          <div>
            <div>Fee: {serviceFee}</div>
            <div>COD: {codAmount}</div>
          </div>
        );
      }
    },
    {
      title: "Route",
      dataIndex: "OriginDCCode",
      sorter: (a, b) => {
        const originCompare = a.OriginDCName.localeCompare(b.OriginDCName);
        if (originCompare !== 0) return originCompare;
        return a.DestinationDCName.localeCompare(b.DestinationDCName);
      },
      render: (text, record) => (
        <div>
          <div className="d-flex align-items-center mb-1">
            <Send size={14} className="text-primary me-1" />
            <span className="ms-1 fw-medium">{record.OriginDCName}</span>
          </div>
          <div className="d-flex align-items-center">
            <Target size={14} className="text-success me-1" />
            <span className="ms-1 fw-medium">{record.DestinationDCName} <span>{record.ReceiverBuilding && (<>({record.ReceiverBuilding})</>)}</span></span>
          </div>
        </div>
      ),
    },
    {
      title: "Date Added",
      dataIndex: "DateAdded",
      sorter: (a, b) => new Date(a.DateAdded) - new Date(b.DateAdded),
      render: (text) => {
        if (!text) return "-";
        const utcDate = new Date(text + "Z");
        return (
          <div>
            <div>{utcDate.toLocaleDateString()}</div>
            <small className="text-muted">{utcDate.toLocaleTimeString()}</small>
          </div>
        );
      },
    },
    {
      title: "Added By",
      dataIndex: "AddedBy",
      sorter: (a, b) => a.AddedBy.localeCompare(b.AddedBy),
    },
    {
      title: "Status",
      dataIndex: "StatusID",
      sorter: (a, b) => a.StatusID - b.StatusID,
      render: (text, record) => (
        <span className={getStatusBadgeClass(text)}>{record.StatusName}</span>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => (
        <RowActionsDropdown
          id={`dropdown-${record.ShipmentOrderID}`}
          variant="outline-secondary"
          items={[
            { key: 'view', label: 'View', icon: 'feather-eye', href: `/rider/rd-packages/${record.OrderNO}/track?trackingNumber=${record.OrderNO}` },
            { key: 'track', label: 'Track', icon: 'feather-map-pin', href: `/rider/rd-packages/${record.OrderNO}/track?trackingNumber=${record.OrderNO}` },
            { key: 'update-status', label: 'Update Status', icon: 'feather-refresh-cw', onClick: () => handleUpdateStatus(record) },
          ]}
        />
      ),
    },
  ];

  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setShowUpdateStatusModal(true);
  };

  const handleCloseUpdateStatusModal = () => {
    setShowUpdateStatusModal(false);
    setSelectedOrder(null);
  };

  const handleUpdateStatusSubmit = async (payload) => {
    try {
      await handleUpdateShipmentStatus(payload);
      // Refresh the list after successful update
      refetch();
    } catch (error) {
      // Error is already handled in the hook
      console.error('Failed to update status:', error);
    }
  };

  // Bulk update status
  const selectedDeliveries = todaysDeliveries.filter(order => selectedRowKeys.includes(order.OrderNO));

  const handleBulkUpdateStatus = () => {
    if (selectedDeliveries.length === 0) return;
    setShowBulkUpdateStatusModal(true);
  };

  const handleCloseBulkUpdateStatusModal = () => {
    setShowBulkUpdateStatusModal(false);
  };

  const handleBulkUpdateStatusSubmit = async (batchOrders) => {
    try {
      await handleUpdateShipmentStatusBatch(batchOrders);
      setSelectedRowKeys([]);
      refetch();
    } catch (error) {
      // Error is already handled in the hook
      console.error('Failed to update bulk status:', error);
    }
  };

  return (
    <div className="rider-dashboard">
      <div className="content">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading dashboard data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="danger" className="mb-4">
            <AlertCircle size={20} className="me-2" />
            {error}
            <Button
              variant="outline-danger"
              size="sm"
              className="ms-3"
              onClick={refetch}
            >
              Retry
            </Button>
          </Alert>
        )}

        {/* Custom CSS for enhanced styling */}
        <style jsx>{`
          .timeline {
            position: relative;
          }
          .performance-metric {
            transition: all 0.3s ease;
          }
          .performance-metric:hover {
            transform: scale(1.05);
          }
          .table-hover tbody tr:hover {
            background-color: rgba(0, 123, 255, 0.05);
          }
          .sale-widget {
            border-radius: 12px;
          }
          .sale-icon {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .custome-heading {
            font-size: 1.5rem;
            font-weight: 700;
          }
          .badge-soft-primary {
            background-color: rgba(255, 255, 255, 0.2);
            color: white;
          }
          .badge-soft-success {
            background-color: rgba(255, 255, 255, 0.2);
            color: white;
          }
          .badge-soft-danger {
            background-color: rgba(255, 255, 255, 0.2);
            color: white;
          }
          .tip-item {
            transition: background 0.15s ease, transform 0.12s ease;
            border-radius: 8px;
          }
          .tip-item:hover {
            background: rgba(13, 110, 253, 0.03);
            transform: translateY(-2px);
          }
          .tip-icon {
            width: 36px;
            height: 36px;
          }
        `}</style>

        {/* Main Content */}
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Rider Dashboard</h4>
              <h6>
                Welcome back, {riderData.name}
                <Badge bg="success" className="ms-2 rounded-pill">
                  <div className="d-flex align-items-center">
                    <div
                      className="bg-white rounded-circle me-1"
                      style={{ width: "8px", height: "8px" }}
                    ></div>
                    Online
                  </div>
                </Badge>
              </h6>
            </div>
          </div>
          <div className="page-btn">
            <Button
              variant="outline-primary"
              onClick={refreshData}
              className="rounded-pill"
            >
              <RefreshCcw size={16} className="me-2" />
              Refresh Dashboard
            </Button>
          </div>
        </div>

        {/* Enhanced Status and Metrics Cards */}
        <Row className="mb-4">
          <DashCard
            title="Today's Deliveries"
            value={riderData.todayDeliveries}
            icon={<Package size={24} />}
            className="bg-info"
            textColor="white"
          />

          <DashCard
            title="Total Deliveries"
            value={riderData.totalDeliveries}
            icon={<CheckCircle size={24} />}
            className="bg-primary"
            textColor="white"
          />

          <DashCard
            title="Success Rate"
            value={riderData.successRate}
            icon={<TrendingUp size={24} />}
            className="bg-success"
            textColor="white"
          />

          <DashCard
            title="Out for Delivery"
            value={riderData.outForDelivery}
            icon={<Truck size={24} />}
            className="bg-secondary"
            textColor="white"
          />
        </Row>

        <Row>
          {/* Today's Deliveries Section - Enhanced */}
          <Col lg={12} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1 fw-bold">Today's Deliveries</h5>
                    <small className="text-muted">
                      Packages scheduled for delivery today
                    </small>
                  </div>
                  <div className="d-flex gap-2">
                    <Badge bg="primary" className="rounded-pill px-3">
                      {todaysDeliveries.length} packages
                    </Badge>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={handleBulkUpdateStatus}
                      disabled={selectedRowKeys.length === 0}
                    >
                      <RefreshCwIcon size={14} className="me-1" />
                      {`Update Status${selectedRowKeys.length > 0 ? ` (${selectedRowKeys.length})` : ''}`}
                    </Button>
                    <Button variant="outline-primary" size="sm">
                      <RefreshCcw size={14} className="me-1" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                <Datatable
                  columns={todaysDeliveriesColumns}
                  dataSource={todaysDeliveries}
                  rowKey="OrderNO"
                  noDataMessage="No deliveries scheduled for today"
                  rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                  }}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        
        <Row>
          {/* Enhanced Performance Metrics */}
          <Col lg={12} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Header className="d-flex justify-content-between align-items-center bg-light border-0">
                <div>
                  <h5 className="mb-1 fw-bold d-flex align-items-center gap-2">
                    <BarChart size={18} /> Performance Metrics
                  </h5>
                  <small className="text-muted">
                    Detailed breakdown of your delivery performance
                  </small>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <Badge bg="success" className="rounded-pill px-3">
                    Performance Score: A+
                  </Badge>
                  <Button variant="outline-secondary" size="sm">
                    Refresh
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={3} sm={6}>
                    <div className="performance-metric p-3 rounded shadow-sm h-100">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0 fw-semibold text-primary">
                          Total COD Amount
                        </h6>
                        <small className="text-muted">
                          KES {summaryStats?.totalCodAmount || 0}
                        </small>
                      </div>
                      <div
                        className="progress rounded-pill"
                        style={{ height: 10 }}
                      >
                        <div
                          className="progress-bar bg-primary rounded-pill"
                          role="progressbar"
                          style={{ width: "75%" }}
                          aria-valuenow="75"
                          aria-valuemin="0"
                          aria-valuemax="100"
                        />
                      </div>
                      <small className="text-muted d-block mt-2">
                        Target: KES 50,000
                      </small>
                    </div>
                  </Col>

                  <Col md={3} sm={6}>
                    <div className="performance-metric p-3 rounded shadow-sm h-100">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0 fw-semibold text-success">
                          Today's COD
                        </h6>
                        <small className="text-muted">
                          KES {summaryStats?.todayCodAmount || 0}
                        </small>
                      </div>
                      <div
                        className="progress rounded-pill"
                        style={{ height: 10 }}
                      >
                        <div
                          className="progress-bar bg-success rounded-pill"
                          role="progressbar"
                          style={{ width: "60%" }}
                          aria-valuenow="60"
                          aria-valuemin="0"
                          aria-valuemax="100"
                        />
                      </div>
                      <small className="text-muted d-block mt-2">
                        Target: KES 5,000
                      </small>
                    </div>
                  </Col>

                  <Col md={3} sm={6}>
                    <div className="performance-metric p-3 rounded shadow-sm h-100">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0 fw-semibold text-warning">
                          Pending COD Payments
                        </h6>
                        <small className="text-muted">
                          {summaryStats?.pendingCodPayments || 0}
                        </small>
                      </div>
                      <div
                        className="progress rounded-pill"
                        style={{ height: 10 }}
                      >
                        <div
                          className="progress-bar bg-warning rounded-pill"
                          role="progressbar"
                          style={{ width: `${Math.min(((summaryStats?.pendingCodPayments || 0) / 10) * 100, 100)}%` }}
                          aria-valuenow={summaryStats?.pendingCodPayments || 0}
                          aria-valuemin="0"
                          aria-valuemax="10"
                        />
                      </div>
                      <small className="text-muted d-block mt-2">
                        Target: 0 pending
                      </small>
                    </div>
                  </Col>

                  <Col md={3} sm={6}>
                    <div className="performance-metric p-3 rounded shadow-sm h-100 text-center">
                      <h6 className="mb-2 fw-semibold text-info">
                        Active Manifests
                      </h6>
                      <div
                        className="progress rounded-pill mb-2"
                        style={{ height: 10 }}
                      >
                        <div
                          className="progress-bar bg-info rounded-pill"
                          role="progressbar"
                          style={{ width: `${((summaryStats?.activeManifestCount || 0) / Math.max(summaryStats?.totalManifestCount || 1, 1)) * 100}%` }}
                          aria-valuenow={summaryStats?.activeManifestCount || 0}
                          aria-valuemin="0"
                          aria-valuemax={summaryStats?.totalManifestCount || 1}
                        />
                      </div>
                      <h5 className="mb-1 fw-bold text-info">
                        {summaryStats?.activeManifestCount || 0}
                      </h5>
                      <small className="text-muted">of {summaryStats?.totalManifestCount || 0} total</small>
                    </div>
                  </Col>
                </Row>

                {/* Quick Stats Row */}
                <Row className="mt-4 pt-4 border-top g-3">
                  <Col md={3} sm={6}>
                    <StatsCard
                      title="Total Deliveries"
                      value={summaryStats.totalDeliveries}
                      icon="fa-solid fa-layer-group"
                      comparison="+4%"
                      comparedTo="last week"
                      viewAllLink="#"
                    />
                  </Col>

                  <Col md={3} sm={6}>
                    <StatsCard
                      title="Today's Deliveries"
                      value={summaryStats.todayDeliveries}
                      icon="fa-solid fa-calendar-day"
                      comparison="+12%"
                      comparedTo="yesterday"
                      viewAllLink="#"
                    />
                  </Col>

                  <Col md={3} sm={6}>
                    <StatsCard
                      title="Active Manifests"
                      value={summaryStats.activeManifestCount}
                      icon="fa-solid fa-spinner"
                      comparison={`${summaryStats.activeManifestCount > 0 ? '+' : ''}${summaryStats.activeManifestCount}`}
                      comparedTo="current"
                      viewAllLink="#"
                    />
                  </Col>

                  <Col md={3} sm={6}>
                    <StatsCard
                      title="Total COD Amount"
                      value={`KES ${summaryStats.totalCodAmount}`}
                      icon="fa-solid fa-money-bill-wave"
                      comparison="+8%"
                      comparedTo="last week"
                      viewAllLink="#"
                    />
                  </Col>

                  
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* Quick Summary Cards - Enhanced */}
          <Col lg={3} md={6} className="mb-4">
            <StatsCard
              title="Today's Deliveries"
              value={summaryStats.todayDeliveries}
              icon="fa-solid fa-calendar-day"
              comparison="+3"
              comparedTo="yesterday"
              viewAllLink="#"
            />
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <StatsCard
              title="Total Deliveries"
              value={summaryStats.totalDeliveries}
              icon="fa-solid fa-layer-group"
              comparison="+4%"
              comparedTo="last week"
              viewAllLink="#"
            />
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <StatsCard
              title="Active Manifests"
              value={summaryStats.activeManifestCount}
              icon="fa-solid fa-list-check"
              comparison={`${summaryStats.activeManifestCount > 0 ? '+' : ''}${summaryStats.activeManifestCount}`}
              comparedTo="current"
              viewAllLink="#"
            />
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <StatsCard
              title="Today's COD"
              value={`KES ${summaryStats.todayCodAmount}`}
              icon="fa-solid fa-money-bill-wave"
              comparison="+8%"
              comparedTo="yesterday"
              viewAllLink="#"
            />
          </Col>

          

          
        </Row>

        {/* Current Shipments Overview */}
        <Row>
          <Col lg={12}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1 fw-bold">
                      <Package size={20} className="me-2" />
                      Current Shipments
                    </h5>
                    <small className="text-muted">
                      Active shipments assigned to you
                    </small>
                  </div>
                  <div className="d-flex gap-2">
                    <Badge bg="light" text="dark" className="rounded-pill">
                      {riderShipments.length} shipments
                    </Badge>
                    <Button variant="outline-primary" size="sm">
                      View All
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                {riderShipments.length === 0 ? (
                  <div className="text-center py-5">
                    <Package size={48} className="text-muted mb-3" />
                    <h6 className="text-muted">No active shipments found.</h6>
                    <p className="text-muted small">New shipments will appear here when assigned.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="border-0 fw-semibold">Package ID</th>
                          <th className="border-0 fw-semibold">Recipient</th>
                          <th className="border-0 fw-semibold">Address</th>
                          <th className="border-0 fw-semibold">Vendor</th>
                          <th className="border-0 fw-semibold">Status</th>
                          <th className="border-0 fw-semibold">Priority</th>
                        </tr>
                      </thead>
                      <tbody>
                        {riderShipments.slice(0, 5).map((shipment, index) => (
                          <tr key={`shipment-${shipment.riderManifestItemID || index}`}>
                            <td className="fw-semibold text-primary">
                              {shipment.manifestItemNO || shipment.OrderNO}
                            </td>
                            <td>{shipment.ReceiverContactName}</td>
                            <td className="text-muted">{shipment.ReceiverStreetName ? `${shipment.ReceiverStreetName}, ${shipment.ReceiverCity}` : shipment.ReceiverCity}</td>
                            <td>{shipment.VendorName}</td>
                            <td>
                              <Badge bg={
                                shipment.StatusID === 503 ? "success" :
                                shipment.StatusID === 801 ? "warning" :
                                shipment.StatusID === 811 ? "info" : "secondary"
                              } className="rounded-pill">
                                {shipment.StatusName}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={shipment.stopNo === 0 ? "danger" : "secondary"} className="rounded-pill">
                                {shipment.stopNo === 0 ? "High" : "Normal"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Update Status Modal */}
      <UpdateStatusModal
        show={showUpdateStatusModal}
        onClose={handleCloseUpdateStatusModal}
        onSubmit={handleUpdateStatusSubmit}
        order={selectedOrder}
        userRole="rider"
      />

      {/* Bulk Update Status Modal */}
      <BulkUpdateStatusModal
        show={showBulkUpdateStatusModal}
        onClose={handleCloseBulkUpdateStatusModal}
        onSubmit={handleBulkUpdateStatusSubmit}
        orders={selectedDeliveries}
      />
    </div>
  );
};

export default RiderDashboard;
