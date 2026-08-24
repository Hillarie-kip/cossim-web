"use client"
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Row, Col, Badge, Alert } from "react-bootstrap";
import { ArrowLeft, Package, MapPin, Phone, Mail, Calendar, DollarSign, Truck, Eye } from "feather-icons-react";
import Link from "@/components/Link";
import useShipment from "@/hooks/useShipment";
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
          <Link to="/sales/sa-packages" className="btn btn-primary">
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
          <Link to="/sales/sa-packages" className="btn btn-primary">
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
          <Link to="/sales/sa-packages" className="btn btn-outline-secondary">
            <ArrowLeft size={16} className="me-2" />
            Back to Packages
          </Link>
          <Link to={`/sales/sa-packages/${packageData.OrderNO}/track?trackingNumber=${packageData.OrderNO}`} className="btn btn-primary">
            <Eye size={16} className="me-2" />
            Track Package
          </Link>
        </div>
      </div>

      <Row>
        {/* Package Status Card */}
        <Col lg={12} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                    <Package className="text-primary" size={24} />
                  </div>
                  <div>
                    <h5 className="mb-1">Package Status</h5>
                    <div>
                      <span className={getStatusBadge(parseInt(packageData.StatusID))}>
                        {statusInfo.statusName}
                      </span>
                      {statusInfo.description && (
                        <div className="mt-1">
                          <small className="text-muted">{statusInfo.description}</small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <h6 className="text-muted mb-1">Delivery Type</h6>
                  <h5 className="text-info mb-0">{packageData.DeliveryType || 'Standard'}</h5>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
{/* Package Information */}
<Col lg={8} className="mb-4">
  <Card>
    <Card.Header>
      <h5 className="mb-0">Package Information</h5>
    </Card.Header>
    <Card.Body>
      <Row>
        <Col md={6}>
          <div className="mb-3">
            <label className="form-label text-muted">Order No</label>
            <p className="fw-bold">{packageData.OrderNO || "N/A"}</p>
          </div>

          <div className="mb-3">
            <label className="form-label text-muted">Delivery Type</label>
            <p>{packageData.DeliveryType || "N/A"}</p>
          </div>

          <div className="mb-3">
            <label className="form-label text-muted">Origin DC</label>
            <p className="mb-0 fw-bold">
              {packageData.OriginDCName || "N/A"}
            </p>
            <small className="text-muted">
              {packageData.OriginDCCode || ""}
            </small>
          </div>

          <div className="mb-3">
            <label className="form-label text-muted">Destination DC</label>
            <p className="mb-0 fw-bold">
              {packageData.DestinationDCName || "N/A"}
            </p>
            <small className="text-muted">
              {packageData.DestinationDCCode || ""}
            </small>
          </div>

          <div className="mb-3">
            <label className="form-label text-muted">Package Description</label>
            <p>
              {packageData.Notes ||
                packageData.ShipmentOrderItems?.[0]?.description ||
                packageData.ShipmentOrderItems?.[0]?.productName ||
                "N/A"}
            </p>
          </div>

          <div className="mb-3">
            <label className="form-label text-muted">Express Delivery</label>
            <Badge
              bg={
                packageData.DeliveryType?.toLowerCase().includes("express")
                  ? "success"
                  : "secondary"
              }
            >
              {packageData.DeliveryType?.toLowerCase().includes("express")
                ? "Yes"
                : "No"}
            </Badge>
          </div>
        </Col>

        <Col md={6}>
          <div className="mb-3">
            <label className="form-label text-muted">Payment Method</label>
            <p>
              {packageData.CashOnDeliveryRequired
                ? "Cash on Delivery"
                : "Prepaid"}
            </p>
          </div>

          <div className="mb-3">
            <label className="form-label text-muted">Payment Status</label>
            <Badge
              bg={packageData.CashOnDeliveryRequired ? "warning" : "success"}
            >
              {packageData.CashOnDeliveryRequired ? "Pending COD" : "Paid"}
            </Badge>
          </div>

          <div className="mb-3">
            <label className="form-label text-muted">COD Required</label>
            <Badge
              bg={packageData.CashOnDeliveryRequired ? "warning" : "secondary"}
            >
              {packageData.CashOnDeliveryRequired ? "Yes" : "No"}
            </Badge>
          </div>

          {packageData.CashOnDeliveryRequired && (
            <div className="mb-3">
              <label className="form-label text-muted">COD Amount</label>
              <p className="fw-bold text-warning">
                KSh{" "}
                {(
                  typeof packageData.CODAmount === "number"
                    ? packageData.CODAmount
                    : parseFloat(
                        (packageData.CODAmount || "0").toString().trim()
                      )
                ).toFixed(2)}
              </p>
            </div>
          )}

          <div className="mb-3">
            <label className="form-label text-muted">Vendor</label>
            <p className="mb-0 fw-bold">{packageData.VendorName || "N/A"}</p>
            {packageData.VendorPhone && (
              <small className="text-muted d-flex align-items-center">
                <Phone size={14} className="me-1" />
                {packageData.VendorPhone}
              </small>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label text-muted">Has Pickup</label>
            <Badge bg={packageData.HasPickUp ? "success" : "secondary"}>
              {packageData.HasPickUp ? "Yes" : "No"}
            </Badge>
          </div>
        </Col>
      </Row>
    </Card.Body>
  </Card>
</Col>

{/* Sender & Recipient Information */}
<Col lg={4} className="mb-4">
  <Card>
    <Card.Header>
      <h5 className="mb-0">Sender & Recipient</h5>
    </Card.Header>
    <Card.Body>
      {/* Sender */}
      <div className="mb-3">
        <small className="text-uppercase text-muted fw-semibold">
          Sender
        </small>

        <div className="mt-2 d-flex align-items-center">
          <div className="bg-info bg-opacity-10 p-2 rounded me-3">
            <Phone className="text-info" size={16} />
          </div>
          <div>
            <small className="text-muted">Name</small>
            <p className="mb-0 fw-bold">
              {packageData.SenderContactName ||
                packageData.SenderCompanyName ||
                "N/A"}
            </p>
          </div>
        </div>

        {(packageData.SenderContactPhone || packageData.VendorPhone) && (
          <div className="mt-2 d-flex align-items-center">
            <div className="bg-success bg-opacity-10 p-2 rounded me-3">
              <Phone className="text-success" size={16} />
            </div>
            <div>
              <small className="text-muted">Phone</small>
              <p className="mb-0">
                {packageData.SenderContactPhone || packageData.VendorPhone}
              </p>
            </div>
          </div>
        )}

     

        {(
          packageData.SenderApartment ||
          packageData.SenderBuilding ||
          packageData.SenderStreetName ||
          packageData.SenderArea ||
          packageData.SenderCity ||
          packageData.SenderPostalCode
        ) && (
          <div className="mt-2 d-flex align-items-center">
            <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
              <MapPin className="text-primary" size={16} />
            </div>
            <div>
              <small className="text-muted">Address</small>
              <p className="mb-0">
                {[
                  packageData.SenderApartment,
                  packageData.SenderBuilding,
                  packageData.SenderStreetName,
                  packageData.SenderArea,
                  packageData.SenderCity,
                  packageData.SenderPostalCode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </div>
        )}
      </div>

      <hr />

      {/* Recipient */}
      <div className="mb-3">
        <small className="text-uppercase text-muted fw-semibold">
          Recipient
        </small>

        <div className="mt-2 d-flex align-items-center">
          <div className="bg-info bg-opacity-10 p-2 rounded me-3">
            <Phone className="text-info" size={16} />
          </div>
          <div>
            <small className="text-muted">Name</small>
            <p className="mb-0 fw-bold">
              {packageData.CustomerName ||
                packageData.ReceiverContactName ||
                packageData.ReceiverCompanyName ||
                "N/A"}
            </p>
          </div>
        </div>

        {(packageData.CustomerPhone ||
          packageData.ReceiverContactPhone) && (
          <div className="mt-2 d-flex align-items-center">
            <div className="bg-success bg-opacity-10 p-2 rounded me-3">
              <Phone className="text-success" size={16} />
            </div>
            <div>
              <small className="text-muted">Phone</small>
              <p className="mb-0">
                {packageData.CustomerPhone ||
                  packageData.ReceiverContactPhone}
              </p>
            </div>
          </div>
        )}

    

        {(packageData.CustomerLandMark ||
          packageData.ReceiverArea) && (
          <div className="mt-2 d-flex align-items-center">
            <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
              <MapPin className="text-primary" size={16} />
            </div>
            <div>
              <small className="text-muted">Landmark / Area</small>
              <p className="mb-0">
                {packageData.CustomerLandMark ||
                  packageData.ReceiverArea}
              </p>
            </div>
          </div>
        )}

        {(packageData.CustomerAddress ||
          packageData.ReceiverApartment ||
          packageData.ReceiverBuilding ||
          packageData.ReceiverStreetName ||
          packageData.ReceiverArea ||
          packageData.ReceiverCity ||
          packageData.ReceiverPostalCode) && (
          <div className="mt-2 d-flex align-items-center">
            <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
              <MapPin className="text-warning" size={16} />
            </div>
            <div>
              <small className="text-muted">Address</small>
              <p className="mb-0">
                {packageData.CustomerAddress ||
                  [
                    packageData.ReceiverApartment,
                    packageData.ReceiverBuilding,
                    packageData.ReceiverStreetName,
                    packageData.ReceiverArea,
                    packageData.ReceiverCity,
                    packageData.ReceiverPostalCode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card.Body>
  </Card>
</Col>

        {/* Actions Card */}
        <Col lg={12}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Available Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex gap-3 flex-wrap">
                <Link to={`/sales/sa-packages/${packageData.OrderNO}/track?trackingNumber=${packageData.OrderNO}`} className="btn btn-primary">
                  <Truck size={16} className="me-2" />
                  Track Package
                </Link>
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => window.print()}
                >
                  <Calendar size={16} className="me-2" />
                  Print Details
                </button>
                <Link to="/sales/sa-packages" className="btn btn-outline-primary">
                  <ArrowLeft size={16} className="me-2" />
                  Back to All Packages
                </Link>
              </div>
              
              <div className="mt-4 p-3 bg-light rounded">
                <h6 className="text-muted mb-2">Note:</h6>
                <p className="text-muted mb-0 small">
                  As a sales agent, you have view-only access to package details. 
                  For any changes or updates, please contact the admin or vendor directly.
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style jsx>{`
        .timeline {
          position: relative;
          padding-left: 30px;
        }
        
        .timeline::before {
          content: '';
          position: absolute;
          left: 15px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #dee2e6;
        }
        
        .timeline-item {
          position: relative;
          margin-bottom: 30px;
        }
        
        .timeline-marker {
          position: absolute;
          left: -22px;
          top: 0;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 3px solid #fff;
          box-shadow: 0 0 0 2px #dee2e6;
        }
        
        .timeline-content {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          border-left: 3px solid #0d6efd;
        }
      `}</style>
    </div>
  );
};

export default PackageDetailPage;
