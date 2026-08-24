"use client"
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Row, Col, Badge, Alert } from "react-bootstrap";
import { ArrowLeft, Package, MapPin, Phone, Mail, Calendar, DollarSign, Truck, Eye, Printer } from "feather-icons-react";
import Link from "@/components/Link";
import useShipment from "@/hooks/useShipment";
import useStickerDownload from "@/hooks/useStickerDownload";
import { PACKAGE_STATUSES } from "@/constants/package_status";

const PackageDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);

  const {
    loading: fetchLoading,
    error,
    fetchShipmentOrder,
    clearError
  } = useShipment();

  const { showSizeSelectionModal, isGenerating } = useStickerDownload();

  const handleViewSticker = () => {
    showSizeSelectionModal(packageData);
  };

  useEffect(() => {
    const fetchPackageDetails = async () => {
      if (params.id) {
        try {
          const response = await fetchShipmentOrder({ orderNO: params.id });
          setPackageData(response.Data || response.data || response);
        } catch (err) {
          console.error('Error fetching package details:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPackageDetails();
  }, [params.id, fetchShipmentOrder]);

  const getStatusBadge = (statusCode) => {
    switch (statusCode) {
      // 100 Vendor
      case 101: // VENDOR_CREATED
        return "badge bg-primary"; // blue
      case 102: // VENDOR_READY_FOR_PICKUP
        return "badge bg-info"; // cyan
      case 103: // VENDOR_HANDED_TO_DC
        return "badge bg-dark"; // dark gray

      // 200 Inbound / DC transfer
      case 201: // DC_RECEIVED
        return "badge bg-success"; // green
      case 202: // DC_SORTED
        return "badge bg-info"; // cyan
      case 203: // DC_DISPATCHED
        return "badge bg-dark"; // dark gray

      // 300 Outbound
      case 301: // OUTBOUND_LOADED
        return "badge bg-info"; // cyan
      case 302: // OUTBOUND_IN_TRANSIT
        return "badge bg-warning text-dark"; // yellow
      case 303: // OUTBOUND_ARRIVED_DESTINATION_DC
        return "badge bg-success"; // green

      // 400 Final mile prep
      case 401: // ASSIGNED_TO_DELIVERY_AREA
        return "badge bg-info";
      case 402: // ASSIGNED_TO_RIDER
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
        return "badge bg-warning text-dark";
      case 702: // RETURN_REQUESTED_BY_VENDOR
        return "badge bg-warning text-dark";
      case 703: // RETURN_IN_PROGRESS
        return "badge bg-info";
      case 704: // RETURNED_TO_VENDOR
        return "badge bg-secondary";

      // 800 Special statuses
      case 801: // PACKAGE_LOST
        return "badge bg-danger";
      case 802: // PACKAGE_DAMAGED
        return "badge bg-warning text-dark";
      case 803: // PACKAGE_ON_HOLD
        return "badge bg-secondary";
      case 804: // PACKAGE_CANCELLED
        return "badge bg-danger";

      default:
        return "badge bg-secondary"; // default gray for unknown statuses
    }
  };

  if (loading || fetchLoading) {
    return (
      <div className="content">
        <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content">
        <Alert variant="danger" className="text-center">
          <Package size={48} className="mb-3" />
          <h4>Error Loading Package</h4>
          <p>{error}</p>
          <button className="btn btn-outline-danger me-2" onClick={clearError}>
            Retry
          </button>
          <Link to="/rider/rd-packages" className="btn btn-primary">
            <ArrowLeft size={16} className="me-2" />
            Back to Packages
          </Link>
        </Alert>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="content">
        <Alert variant="warning" className="text-center">
          <Package size={48} className="mb-3" />
          <h4>Package Not Found</h4>
          <p>The package you're looking for doesn't exist or has been removed.</p>
          <Link to="/rider/rd-packages" className="btn btn-primary">
            <ArrowLeft size={16} className="me-2" />
            Back to Packages
          </Link>
        </Alert>
      </div>
    );
  }

  // Find status by orderStatusID
  const statusInfo = Object.values(PACKAGE_STATUSES).find(
    status => status.orderStatusID === parseInt(packageData.StatusID)
  ) || { statusName: 'Unknown Status', description: '' };

  return (
    <div className="content">
      <div className="page-header">
        <div className="add-item d-flex">
          <div className="page-title">
            <h4>Package Details</h4>
            <h6>Order No: {packageData.OrderNO}</h6>
          </div>
        </div>
        <div className="page-btn d-flex gap-2">
          <Link to="/rider/rd-packages" className="btn btn-outline-secondary">
            <ArrowLeft size={16} className="me-2" />
            Back to Packages
          </Link>
          <Link to={`/rider/rd-packages/${packageData.OrderNO}/track?trackingNumber=${packageData.OrderNO}`} className="btn btn-primary">
            <Eye size={16} className="me-2" />
            Track Package
          </Link>
          <button className="btn btn-outline-primary" onClick={handleViewSticker} disabled={isGenerating}>
            <Printer size={16} className="me-2" />
            {isGenerating ? 'Preparing...' : 'View Sticker'}
          </button>
        </div>
      </div>

      <Row className="mt-4">
        {/* Package Overview */}
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header className="bg-primary text-white">
              <div className="d-flex align-items-center">
                <Package size={20} className="me-2" />
                <h5 className="mb-0">Package Information</h5>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <strong>Order Number:</strong>
                    <p className="mb-0 text-muted">{packageData.OrderNO}</p>
                  </div>
                  <div className="mb-3">
                    <strong>Status:</strong>
                    <div className="mt-1">
                      <span className={getStatusBadge(packageData.StatusID)}>
                        {statusInfo.statusName}
                      </span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <strong>Delivery Type:</strong>
                    <p className="mb-0 text-muted">{packageData.DeliveryTypeName || 'N/A'}</p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <strong>Created Date:</strong>
                    <p className="mb-0 text-muted">{packageData.CreatedOn ? new Date(packageData.CreatedOn).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div className="mb-3">
                    <strong>Total Amount:</strong>
                    <p className="mb-0 text-muted fw-bold text-success">
                      KES {packageData.TotalAmount ? Number(packageData.TotalAmount).toLocaleString() : '0'}
                    </p>
                  </div>
                  <div className="mb-3">
                    <strong>Payment Status:</strong>
                    <Badge bg={packageData.PaymentStatusName === 'Paid' ? 'success' : 'warning'}>
                      {packageData.PaymentStatusName || 'Pending'}
                    </Badge>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Delivery Information */}
          <Card className="mb-4">
            <Card.Header className="bg-warning text-dark">
              <div className="d-flex align-items-center">
                <Truck size={20} className="me-2" />
                <h5 className="mb-0">Delivery Information</h5>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <strong>Customer Name:</strong>
                    <p className="mb-0 text-muted">{packageData.CustomerName || 'N/A'}</p>
                  </div>
                  <div className="mb-3">
                    <strong>Phone Number:</strong>
                    <p className="mb-0 text-muted">
                      <Phone size={16} className="me-1" />
                      {packageData.CustomerPhone || 'N/A'}
                    </p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <strong>Email:</strong>
                    <p className="mb-0 text-muted">
                      <Mail size={16} className="me-1" />
                      {packageData.CustomerEmail || 'N/A'}
                    </p>
                  </div>
                  <div className="mb-3">
                    <strong>Delivery Address:</strong>
                    <p className="mb-0 text-muted">{packageData.DeliveryAddress || 'N/A'}</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Actions Sidebar */}
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Delivery Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex gap-3 flex-wrap">
                <Link to={`/rider/rd-packages/${packageData.OrderNO}/track?trackingNumber=${packageData.OrderNO}`} className="btn btn-primary">
                  <Truck size={16} className="me-2" />
                  Track Package
                </Link>
                <button
                  className="btn btn-outline-primary"
                  onClick={handleViewSticker}
                  disabled={isGenerating}
                >
                  <Printer size={16} className="me-2" />
                  {isGenerating ? 'Preparing...' : 'View Sticker'}
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => window.print()}
                >
                  <Calendar size={16} className="me-2" />
                  Print Details
                </button>
                <Link to="/rider/rd-packages" className="btn btn-outline-primary">
                  <ArrowLeft size={16} className="me-2" />
                  Back to All Packages
                </Link>
              </div>
              
              <div className="mt-4 p-3 bg-light rounded">
                <h6 className="text-muted mb-2">Delivery Note:</h6>
                <p className="text-muted mb-0 small">
                  Ensure customer verification before delivery. Contact customer at the provided phone number
                  if delivery address is not clear.
                </p>
              </div>
            </Card.Body>
          </Card>

          {/* Quick Stats */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">Package Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                <div className="mb-3">
                  <Package size={40} className="text-primary mb-2" />
                  <h6 className="text-muted">Current Status</h6>
                  <span className={getStatusBadge(packageData.StatusID)}>
                    {statusInfo.statusName}
                  </span>
                </div>
                <hr />
                <div className="mb-3">
                  <DollarSign size={40} className="text-success mb-2" />
                  <h6 className="text-muted">Package Value</h6>
                  <p className="h5 text-success mb-0">
                    KES {packageData.TotalAmount ? Number(packageData.TotalAmount).toLocaleString() : '0'}
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PackageDetailPage;
