"use client"
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Row, Col, Badge, Button, Alert, Tab, Tabs, OverlayTrigger, Tooltip } from "react-bootstrap";
import { ArrowLeft, FileText, Truck, MapPin, Clock, Package, CheckCircle, XCircle, AlertCircle, RefreshCw, Eye, MoreVertical, Trash2, ChevronUp, RotateCcw, PlusCircle, Send, Target } from "feather-icons-react";
import Link from "@/components/Link";
import RowActionsDropdown from "@/components/RowActionsDropdown";
import Datatable from "@/core/pagination/datatable";
import { useShipment } from "@/hooks/useShipment";
import { UpdateStatusModal, BulkUpdateStatusModal } from "@/components/modals";
import { PACKAGE_STATUSES } from "@/constants/package_status";
import Swal from "sweetalert2";
import notify from "@/lib/toast";

// Fallback rider status transitions used when the manifest item doesn't already carry its own StatusTransitionArray
const getDefaultRiderTransitions = (codRequired) => [
  {
    toOrderStatusID: 501,
    actionName: "Mark as Out for Delivery",
    requiresDeliveryFlow: true,
    requiresPickupFlow: false,
    requiresCOD: false,
    requiresPOD: false
  },
  {
    toOrderStatusID: 502,
    actionName: "Mark as Delivery Attempted",
    requiresDeliveryFlow: false,
    requiresPickupFlow: false,
    requiresCOD: false,
    requiresPOD: false
  },
  {
    toOrderStatusID: 503,
    actionName: "Mark as Delivered",
    requiresDeliveryFlow: false,
    requiresPickupFlow: false,
    requiresCOD: codRequired,
    requiresPOD: true
  }
];

const RiderManifestDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const manifestNO = params.manifestId; // This is the [manifestId] param

  const {
    riderManifest,
    loading,
    error,
    fetchRiderManifest,
    clearRiderManifest,
    dcCode,
    handleUpdateShipmentStatus,
    fetchShipmentOrder,
    handleRemoveManifestOrder,
    handleUpdateShipmentStatusBatch
  } = useShipment();

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsPageSize, setItemsPageSize] = useState(100);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsPageSize, setEventsPageSize] = useState(100);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showBulkUpdateStatusModal, setShowBulkUpdateStatusModal] = useState(false);
  const [bulkOrders, setBulkOrders] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [preparingBulkUpdate, setPreparingBulkUpdate] = useState(false);

  // Get user from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('cossim-user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      }
    } catch (err) {
      console.error('Error parsing user data from localStorage:', err);
    }
  }, []);

  // Get rider code from user data
  const riderUserCode = user?.UserCode || user?.RiderCode || '';

  // Fetch manifest data when core parameters change (excluding pagination)
  useEffect(() => {
    if (riderUserCode && manifestNO) {
      const params = {
        riderUserCode: riderUserCode,
        manifestNO: manifestNO,
        activeOnly: false,
        itemsPage: 1, // Always start with page 1 for parameter changes
        itemsPageSize: 100,
        eventsPage: 1,
        eventsPageSize: 100
      };

      // Add dcCode if available
      if (dcCode) {
        params.dcCode = dcCode;
      }

      fetchRiderManifest(params);
    }

    return () => {
      clearRiderManifest();
    };
  }, [riderUserCode, manifestNO, dcCode]);

  // Handle pagination changes separately
  const handleItemsPageChange = (page, size) => {
    setItemsPage(page);
    setItemsPageSize(size);
    
    const params = {
      riderUserCode: riderUserCode,
      manifestNO: manifestNO,
      activeOnly: false,
      itemsPage: page,
      itemsPageSize: size,
      eventsPage: eventsPage,
      eventsPageSize: eventsPageSize
    };

    if (dcCode) params.dcCode = dcCode;

    fetchRiderManifest(params);
  };

  const handleEventsPageChange = (page, size) => {
    setEventsPage(page);
    setEventsPageSize(size);
    
    const params = {
      riderUserCode: riderUserCode,
      manifestNO: manifestNO,
      activeOnly: false,
      itemsPage: itemsPage,
      itemsPageSize: itemsPageSize,
      eventsPage: page,
      eventsPageSize: size
    };

    if (dcCode) params.dcCode = dcCode;

    fetchRiderManifest(params);
  };

  // Fetch (if needed) and transform a manifest item into the shape UpdateStatusModal/BulkUpdateStatusModal expect
  const transformManifestItemForStatusUpdate = async (record) => {
    try {
      let orderWithTransitions = record;

      if (!record.StatusTransitionArray) {
        const detailedOrder = await fetchShipmentOrder({ orderNO: record.orderNO });
        if (detailedOrder) {
          orderWithTransitions = detailedOrder;
        }
      }

      const codRequired = orderWithTransitions.CashOnDeliveryRequired || record.codRequired || false;

      return {
        OrderNO: orderWithTransitions.OrderNO || record.orderNO,
        StatusName: orderWithTransitions.StatusName || record.orderStatusName || `Status ${record.orderStatusID}`,
        StatusID: orderWithTransitions.StatusID || record.orderStatusID,
        OriginDCCode: orderWithTransitions.OriginDCCode || record.dcCode,
        DestinationDCCode: orderWithTransitions.DestinationDCCode || record.dcCode,
        CashOnDeliveryRequired: codRequired,
        CODAmount: orderWithTransitions.CODAmount || record.codAmount || 0,
        StatusTransitionArray: orderWithTransitions.StatusTransitionArray || getDefaultRiderTransitions(codRequired),
      };
    } catch (error) {
      console.error('Error fetching order details for status update:', error);
      return {
        OrderNO: record.orderNO,
        StatusName: record.orderStatusName || `Status ${record.orderStatusID}`,
        StatusID: record.orderStatusID,
        OriginDCCode: record.dcCode,
        DestinationDCCode: record.dcCode,
        CashOnDeliveryRequired: record.codRequired || false,
        CODAmount: record.codAmount || 0,
        StatusTransitionArray: getDefaultRiderTransitions(record.codRequired || false),
      };
    }
  };

  // Handle update status modal
  const handleUpdateStatus = async (record) => {
    const transformedOrder = await transformManifestItemForStatusUpdate(record);
    setSelectedOrder(transformedOrder);
    setShowUpdateStatusModal(true);
  };

  const handleCloseUpdateStatusModal = () => {
    setShowUpdateStatusModal(false);
    setSelectedOrder(null);
  };

  const handleUpdateStatusSubmit = async (payload) => {
    try {
      // Use the shipment hook's update function
      await handleUpdateShipmentStatus(payload);
      // Refresh the manifest after successful update
      const params = {
        riderUserCode: riderUserCode,
        manifestNO: manifestNO,
        activeOnly: false,
        itemsPage: itemsPage,
        itemsPageSize: itemsPageSize,
        eventsPage: eventsPage,
        eventsPageSize: eventsPageSize
      };

      if (dcCode) params.dcCode = dcCode;

      fetchRiderManifest(params);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Bulk update status for the selected manifest items
  const handleBulkUpdateStatus = async (records) => {
    if (records.length === 0) return;
    setPreparingBulkUpdate(true);
    try {
      const transformedOrders = await Promise.all(records.map(transformManifestItemForStatusUpdate));
      setBulkOrders(transformedOrders);
      setShowBulkUpdateStatusModal(true);
    } finally {
      setPreparingBulkUpdate(false);
    }
  };

  const handleCloseBulkUpdateStatusModal = () => {
    setShowBulkUpdateStatusModal(false);
    setBulkOrders([]);
  };

  const handleBulkUpdateStatusSubmit = async (batchOrders) => {
    try {
      await handleUpdateShipmentStatusBatch(batchOrders);
      setSelectedRowKeys([]);
      refreshManifest();
    } catch (error) {
      console.error('Error updating bulk status:', error);
    }
  };

  // Handle remove order from manifest
  const handleRemoveFromManifest = async (record) => {
    try {
      const result = await Swal.fire({
        title: 'Remove Order from Manifest',
        text: `Are you sure you want to remove order "${record.orderNO}" from this manifest?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, remove it!',
        cancelButtonText: 'Cancel'
      });
      
      if (!result.isConfirmed) return;

      const data = {
        manifestNO: manifestNO,
        orderNO: record.orderNO
      };

      await handleRemoveManifestOrder(data);

      // Show success message
      notify.success('Order has been removed from the manifest.');

      // Refresh the manifest data after successful removal
      refreshManifest();
    } catch (error) {
      console.error('Error removing order from manifest:', error);

      // Show error message
      notify.error('Failed to remove order from manifest. Please try again.');
    }
  };

  const refreshManifest = () => {
    const params = {
      riderUserCode: riderUserCode,
      manifestNO: manifestNO,
      activeOnly: false,
      itemsPage: itemsPage,
      itemsPageSize: itemsPageSize,
      eventsPage: eventsPage,
      eventsPageSize: eventsPageSize
    };

    if (dcCode) params.dcCode = dcCode;

    fetchRiderManifest(params);
  };

  const getStatusBadge = (statusID) => {
    const statusMap = {
      0: { variant: 'secondary', text: 'Pending' },
      1: { variant: 'primary', text: 'Open' },
      2: { variant: 'success', text: 'In Progress' },
      3: { variant: 'success', text: 'Completed' },
      4: { variant: 'danger', text: 'Failed' },
      5: { variant: 'warning', text: 'Cancelled' }
    };
    return statusMap[statusID] || { variant: 'secondary', text: 'Unknown' };
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

  const formatDateTime = (dateString) => {
    if (!dateString || dateString === '0001-01-01T00:00:00') return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Items table columns - Matching overview page structure
  const itemsColumns = [
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
            { key: 'remove', label: 'Remove', icon: 'feather-trash-2', onClick: () => handleRemoveFromManifest(record) },
          ]}
        />
      ),
    },
  ];

  // Events table columns - Enhanced with comprehensive data
  const eventsColumns = [
    {
      title: "Event ID",
      dataIndex: "riderManifestEventID",
      sorter: (a, b) => a.riderManifestEventID - b.riderManifestEventID,
      width: 120,
      render: (text) => (
        <Badge bg="light" text="dark" className="rounded-pill">
          #{text}
        </Badge>
      )
    },
    {
      title: "Status",
      dataIndex: "statusID",
      sorter: (a, b) => a.statusID - b.statusID,
      width: 140,
      render: (statusID, record) => {
        return (
          <span className={getStatusBadgeClass(statusID)}>
            {record.statusName || getStatusBadge(statusID).text}
          </span>
        );
      }
    },
    {
      title: "Actor",
      dataIndex: "actorUserCode",
      sorter: (a, b) => (a.actorUserCode || '').localeCompare(b.actorUserCode || ''),
      width: 150,
      render: (actor, record) => (
        <div>
          <div className="fw-semibold">{actor || 'System'}</div>
          {record.actorName && (
            <small className="text-muted">{record.actorName}</small>
          )}
        </div>
      )
    },
    {
      title: "DC Code",
      dataIndex: "dCCode",
      sorter: (a, b) => (a.dCCode || '').localeCompare(b.dCCode || ''),
      width: 120,
      render: (text) => (
        <Badge bg="outline-primary" className="border">
          {text || 'N/A'}
        </Badge>
      )
    },
    {
      title: "Location",
      dataIndex: "location",
      sorter: (a, b) => (a.location || '').localeCompare(b.location || ''),
      width: 180,
      render: (text, record) => (
        <div>
          {text ? (
            <>
              <div className="fw-semibold">{text}</div>
              {record.coordinates && (
                <small className="text-muted">
                  <MapPin size={12} className="me-1" />
                  {record.coordinates}
                </small>
              )}
            </>
          ) : (
            <span className="text-muted">N/A</span>
          )}
        </div>
      )
    },
    {
      title: "Notes",
      dataIndex: "notes",
      sorter: (a, b) => (a.notes || '').localeCompare(b.notes || ''),
      width: 200,
      render: (notes) => (
        <div className="text-truncate" style={{ maxWidth: '200px' }} title={notes}>
          {notes || <span className="text-muted">No notes</span>}
        </div>
      )
    },
    {
      title: "Event Time",
      dataIndex: "eventTime",
      sorter: (a, b) => new Date(a.eventTime) - new Date(b.eventTime),
      width: 160,
      fixed: 'right',
      render: (date) => {
        if (!date || date === '0001-01-01T00:00:00') {
          return <span className="text-muted">N/A</span>;
        }
        const eventDate = new Date(date);
        const now = new Date();
        const diffInHours = (now - eventDate) / (1000 * 60 * 60);

        return (
          <div>
            <div className="fw-semibold">{eventDate.toLocaleDateString()}</div>
            <small className="text-muted">{eventDate.toLocaleTimeString()}</small>
            {diffInHours < 24 && (
              <div>
                <Badge bg="success" className="mt-1">
                  <Clock size={10} className="me-1" />
                  Recent
                </Badge>
              </div>
            )}
          </div>
        );
      }
    }
  ];

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content">
        <Alert variant="danger" className="text-center">
          <AlertCircle size={48} className="mb-3" />
          <h4>Error Loading Manifest</h4>
          <p>{error}</p>
          <Button variant="primary" onClick={refreshManifest}>
            <RefreshCw size={16} className="me-2" />
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  if (!riderManifest || !riderManifest.length) {
    return (
      <div className="content">
        <Alert variant="info" className="text-center">
          <FileText size={48} className="mb-3" />
          <h4>Manifest Not Found</h4>
          <p>The requested manifest could not be found.</p>
          <Link to={`/rider/rd-manifest`} className="btn btn-primary">
            <ArrowLeft size={16} className="me-2" />
            Back to My Manifests
          </Link>
        </Alert>
      </div>
    );
  }

  // Extract the first manifest from the array
  const manifest = riderManifest[0];
  const { header, items, events } = manifest;

  return (
    <div className="content">
      <div className="page-header">
        <div className="add-item d-flex">
          <div className="page-title">
            <h4>Manifest Details</h4>
            <h6>{header.manifestNO}</h6>
          </div>
        </div>
        <div className="page-btn d-flex gap-2">
          <Link to={`/rider/rd-manifest`} className="btn btn-outline-secondary">
            <ArrowLeft size={16} className="me-2" />
            Back to My Manifests
          </Link>
          <Button variant="outline-primary" onClick={refreshManifest}>
            <RefreshCw size={16} className="me-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Row className="mb-4">
        {/* Manifest Status Cards */}
        <Col lg={3} md={6} className="mb-4">
          <Card className="bg-primary text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Total Items</h6>
                  <h4 className="mb-0">{header.totalItems}</h4>
                </div>
                <Package size={36} className="opacity-75" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="bg-success text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Delivered</h6>
                  <h4 className="mb-0">{header.deliveredItems}</h4>
                </div>
                <CheckCircle size={36} className="opacity-75" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="bg-warning text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Pending</h6>
                  <h4 className="mb-0">{header.pendingItems}</h4>
                </div>
                <Clock size={36} className="opacity-75" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="bg-info text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Status</h6>
                  <h4 className="mb-0">
                    <span className={getStatusBadgeClass(header.statusID)}>{header.statusName || getStatusBadge(header.statusID).text}</span>
                  </h4>
                </div>
                <FileText size={36} className="opacity-75" />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Manifest Details */}
      <Row className="mb-4">
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Manifest Information</h5>
            </Card.Header>
            <Card.Body>
              <div className="row">
                <div className="col-sm-6">
                  <p className="mb-2"><strong>Manifest NO:</strong></p>
                  <p className="text-muted">{header.manifestNO}</p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-2"><strong>DC Code:</strong></p>
                  <p className="text-muted">{header.dCCode || dcCode || 'N/A'}</p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-2"><strong>Rider Code:</strong></p>
                  <p className="text-muted">{header.riderUserCode}</p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-2"><strong>Route Code:</strong></p>
                  <p className="text-muted">{header.routeCode || 'N/A'}</p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-2"><strong>Planned Departure:</strong></p>
                  <p className="text-muted">{formatDateTime(header.plannedDepartAt)}</p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-2"><strong>Actual Departure:</strong></p>
                  <p className="text-muted">{formatDateTime(header.departedAt)}</p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-2"><strong>Closed At:</strong></p>
                  <p className="text-muted">{formatDateTime(header.closedAt)}</p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-2"><strong>Notes:</strong></p>
                  <p className="text-muted">{header.notes || 'N/A'}</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Manifest Statistics</h5>
            </Card.Header>
            <Card.Body>
              <div className="row text-center">
                <div className="col-4">
                  <h4 className="text-primary">{manifest.totalItemsCount}</h4>
                  <p className="text-muted mb-0">Total Items</p>
                </div>
                <div className="col-4">
                  <h4 className="text-success">{header.deliveredItems}</h4>
                  <p className="text-muted mb-0">Delivered</p>
                </div>
                <div className="col-4">
                  <h4 className="text-warning">{header.pendingItems}</h4>
                  <p className="text-muted mb-0">Pending</p>
                </div>
              </div>
              <hr />
              <div className="row text-center">
                <div className="col-6">
                  <h6 className="text-info">{manifest.totalEventsCount}</h6>
                  <p className="text-muted mb-0">Total Events</p>
                </div>
                <div className="col-6">
                  <h6 className="text-secondary">{header.statusID}</h6>
                  <p className="text-muted mb-0">Status ID</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs for Items and Events */}
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Manifest Details</h5>
          </div>
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-0">
            <Tab eventKey="overview" title="Items Overview">
              <Card.Body>
                {items && items.length > 0 ? (
                  <>
                    <div className="d-flex justify-content-end mb-3">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleBulkUpdateStatus(items.filter(item => selectedRowKeys.includes(item.manifestItemNO)))}
                        disabled={selectedRowKeys.length === 0 || preparingBulkUpdate}
                      >
                        <RefreshCw size={14} className="me-1" />
                        {preparingBulkUpdate ? 'Preparing...' : `Update Status${selectedRowKeys.length > 0 ? ` (${selectedRowKeys.length})` : ''}`}
                      </Button>
                    </div>
                    <div className="table-responsive">
                      <Datatable
                        columns={itemsColumns}
                        dataSource={items}
                        rowKey="manifestItemNO"
                        rowSelection={{
                          selectedRowKeys,
                          onChange: setSelectedRowKeys,
                        }}
                        pagination={{
                          current: manifest.itemsPage || 1,
                          pageSize: manifest.itemsPageSize || itemsPageSize,
                          total: manifest.totalItemsCount || 0,
                          showSizeChanger: true,
                          pageSizeOptions: ['50', '100', '200', '500'],
                          onChange: handleItemsPageChange,
                          onShowSizeChange: handleItemsPageChange,
                        }}
                        loading={loading}
                        scroll={{ x: 'max-content' }}
                      />
                    </div>
                  </>
                ) : (
                  <Alert variant="info" className="text-center">
                    <Package size={48} className="mb-3" />
                    <h5>No Items Found</h5>
                    <p>This manifest has no items assigned.</p>
                  </Alert>
                )}
              </Card.Body>
            </Tab>

            <Tab eventKey="events" title="Events History">
              <Card.Body>
                {events && events.length > 0 ? (
                  <>
                    <div className="table-responsive">
                      <Datatable
                        columns={eventsColumns}
                        dataSource={events}
                        rowKey="riderManifestEventID"
                        pagination={{
                          current: manifest.eventsPage || 1,
                          pageSize: manifest.eventsPageSize || eventsPageSize,
                          total: manifest.totalEventsCount || 0,
                          showSizeChanger: true,
                          pageSizeOptions: ['50', '100', '200', '500'],
                          onChange: handleEventsPageChange,
                          onShowSizeChange: handleEventsPageChange,
                        }}
                        loading={loading}
                        scroll={{ x: 'max-content' }}
                      />
                    </div>
                  </>
                ) : (
                  <Alert variant="info" className="text-center">
                    <Clock size={48} className="mb-3" />
                    <h5>No Events Found</h5>
                    <p>This manifest has no events recorded.</p>
                  </Alert>
                )}
              </Card.Body>
            </Tab>
          </Tabs>
        </Card.Header>
      </Card>

      {/* Update Status Modal */}
      {showUpdateStatusModal && (
        <UpdateStatusModal
          show={showUpdateStatusModal}
          onClose={handleCloseUpdateStatusModal}
          onSubmit={handleUpdateStatusSubmit}
          order={selectedOrder}
          userRole="rider"
        />
      )}

      {/* Bulk Update Status Modal */}
      {showBulkUpdateStatusModal && (
        <BulkUpdateStatusModal
          show={showBulkUpdateStatusModal}
          onClose={handleCloseBulkUpdateStatusModal}
          onSubmit={handleBulkUpdateStatusSubmit}
          orders={bulkOrders}
        />
      )}
    </div>
  );
};

export default RiderManifestDetailPage;
