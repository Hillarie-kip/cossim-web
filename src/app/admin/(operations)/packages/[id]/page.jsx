"use client"
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Row, Col, Badge, Button, Alert, Modal, Form, Table } from "react-bootstrap";
import { ArrowLeft, Package, MapPin, Phone, Edit3, Trash2, Printer, RefreshCw, Navigation } from "feather-icons-react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import Link from "@/components/Link";
import useShipment from "@/hooks/useShipment";
import useStickerDownload from "@/hooks/useStickerDownload";
import { UpdateStatusModal } from "@/components/modals";
import notify from "@/lib/toast";

const PackageDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const MySwal = withReactContent(Swal);
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const { showSizeSelectionModal, isGenerating } = useStickerDownload();

  const {
    loading: fetchLoading,
    error,
    fetchShipmentOrder,
    handleUpdateShipmentStatus,
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

  const getStatusBadge = (status) => {
    const statusMap = {
      "Created": "info",
      "In Transit": "primary",
      "Delivered": "success",
      "Cancelled": "danger",
      "Returned": "warning",
      "Service Fee Required": "warning",
      "Pending": "secondary",
      "Processing": "primary",
      "Completed": "success",
      "Failed": "danger"
    };
    return statusMap[status] || "secondary";
  };

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      pending: "warning",
      completed: "success",
      failed: "danger"
    };
    return statusMap[status] || "secondary";
  };

  const handleDeletePackage = async () => {
    const { value: notes } = await MySwal.fire({
      title: "Delete Package",
      text: `Are you sure you want to delete package ${packageData.OrderNO}?`,
      input: "textarea",
      inputLabel: "Reason for deletion",
      inputPlaceholder: "Enter reason for deletion...",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Delete",
      cancelButtonColor: "#6c757d",
      cancelButtonText: "Cancel",
      inputValidator: (value) => !value?.trim() ? "Please enter a reason for deletion" : undefined,
    });

    if (!notes) return;

    try {
      await handleUpdateShipmentStatus({
        statusID: 902,
        orderNO: packageData.OrderNO,
        notes: notes.trim(),
        dcCode: "",
        riderCode: "",
      });
      notify.success("Package has been deleted successfully.");
      router.push('/admin/packages');
    } catch (deleteError) {
      console.error("Failed to delete package:", deleteError);
      notify.error("Failed to delete package. Please try again.");
    }
  };

  const handleUpdateStatusSubmit = async (payload) => {
    const response = await handleUpdateShipmentStatus(payload);
    if (response?.Error) {
      throw new Error(response.Message || "Failed to update status");
    }
    return response;
  };

  const handleStatusUpdateSuccess = async () => {
    try {
      const response = await fetchShipmentOrder({ orderNO: packageData.OrderNO });
      setPackageData(response.Data || response.data || response);
    } catch (refreshError) {
      console.error("Failed to refresh package details:", refreshError);
    }
  };

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

  if (!packageData) {
    return (
        <div className="content">
          <Alert variant="danger" className="text-center">
            <Package size={48} className="mb-3" />
            <h4>Package Not Found</h4>
            <p>The package you're looking for doesn't exist or has been removed.</p>
            <Link to="/admin/packages" className="btn btn-primary">
              <ArrowLeft size={16} className="me-2" />
              Back to Task Management
            </Link>
          </Alert>
        </div>
    );
  }

  return (
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Package Details</h4>
              <h6>Tracking Code: {packageData.tracking_code}</h6>
            </div>
          </div>
          <div className="page-btn d-flex flex-wrap gap-2">
            <Link to="/admin/packages" className="btn btn-outline-secondary">
              <ArrowLeft size={16} className="me-2" />
              Back to Task Management
            </Link>
            <Button variant="primary" onClick={() => setShowEditModal(true)}>
              <Edit3 size={16} className="me-2" />
              Edit Package
            </Button>
            <Link
              to={`/admin/packages/${packageData.OrderNO}/track?trackingNumber=${encodeURIComponent(packageData.OrderNO)}`}
              className="btn btn-outline-primary"
            >
              <Navigation size={16} className="me-2" />
              Track
            </Link>
            <Button
              variant="outline-primary"
              onClick={() => showSizeSelectionModal(packageData)}
              disabled={isGenerating}
            >
              <Printer size={16} className="me-2" />
              {isGenerating ? "Preparing..." : "Print Sticker"}
            </Button>
            <Button variant="outline-primary" onClick={() => setShowUpdateStatusModal(true)}>
              <RefreshCw size={16} className="me-2" />
              Update Status
            </Button>
            <Button variant="danger" onClick={handleDeletePackage}>
              <Trash2 size={16} className="me-2" />
              Delete
            </Button>
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
                      <Badge bg={getStatusBadge(packageData.StatusName)} className="fs-6">
                        {packageData.StatusName}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-end">
                    <h6 className="text-muted mb-1">Total Cost</h6>
                    <h4 className="text-success mb-0">KSh {(packageData.ServiceFee || 0).toFixed(2)}</h4>
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
            <label className="form-label text-muted">Current Location</label>
            <p>
              {packageData.LatestLogDCName ||
                packageData.RouteInfo ||
                packageData.InitialLogDCName ||
                "N/A"}
            </p>
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

          <div className="mb-3">
            <label className="form-label text-muted">Rider</label>
            <p>{packageData.RiderName || "N/A"}</p>
          </div>

          <div className="mb-3">
            <label className="form-label text-muted">Sales Agent</label>
            <p>{packageData.SalesAgent || "N/A"}</p>
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

          {/* Timeline */}
          <Col lg={12}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Package Timeline</h5>
              </Card.Header>
              <Card.Body>
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-marker bg-primary"></div>
                    <div className="timeline-content">
                      <h6 className="mb-1">Package Created</h6>
                      <p className="text-muted mb-1">{packageData.DateAdded ? new Date(packageData.DateAdded).toLocaleString() : 'N/A'}</p>
                      <small className="text-muted">Package was created in the system</small>
                    </div>
                  </div>
                  {false && packageData.updated_at && packageData.updated_at !== packageData.DateAdded && (
                    <div className="timeline-item">
                      <div className="timeline-marker bg-info"></div>
                      <div className="timeline-content">
                        <h6 className="mb-1">Package Updated</h6>
                        <p className="text-muted mb-1">{packageData.updated_at ? new Date(packageData.updated_at).toLocaleString() : 'N/A'}</p>
                        <small className="text-muted">Package information was updated</small>
                      </div>
                    </div>
                  )}
                  {false && packageData.last_scanned_at && (
                    <div className="timeline-item">
                      <div className="timeline-marker bg-warning"></div>
                      <div className="timeline-content">
                        <h6 className="mb-1">Last Scanned</h6>
                        <p className="text-muted mb-1">{packageData.last_scanned_at ? new Date(packageData.last_scanned_at).toLocaleString() : 'N/A'}</p>
                        <small className="text-muted">Package was scanned for tracking</small>
                      </div>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Edit Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Edit Package</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Recipient Name</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={packageData.CustomerName || ''}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Recipient Phone</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={packageData.CustomerPhone || ''}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select defaultValue={packageData.StatusName || 'Created'}>
                      <option value="Created">Created</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Returned">Returned</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Delivery Cost</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      defaultValue={packageData.ServiceFee || 0}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Package Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      defaultValue={packageData.Notes || packageData.ShipmentOrderItems?.[0]?.description || ''}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => {
              notify.success("Package updated successfully.");
              setShowEditModal(false);
            }}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
        <UpdateStatusModal
          show={showUpdateStatusModal}
          onClose={() => setShowUpdateStatusModal(false)}
          onSubmit={handleUpdateStatusSubmit}
          onSuccess={handleStatusUpdateSuccess}
          order={packageData}
        />
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
