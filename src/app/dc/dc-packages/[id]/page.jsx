"use client"
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Row, Col, Badge, Button, Alert, Modal, Form, Table } from "react-bootstrap";
import { ArrowLeft, Package, MapPin, Phone, Mail, Calendar, DollarSign, Truck, Edit3, Trash2, Eye } from "feather-icons-react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import Link from "@/components/Link";
import useShipment from "@/hooks/useShipment";
import Datatable from "@/core/pagination/datatable";
import notify from "@/lib/toast";

const PackageDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const MySwal = withReactContent(Swal);
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

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
      "Failed": "danger",
      "Batched for DC→DC Transfer": "info",
      "DC Transfer": "primary"
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

  const handleDeletePackage = () => {
    MySwal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the package!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Yes, delete it!",
      cancelButtonColor: "#6c757d",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        notify.success("Package has been deleted.");
        router.push('/dc/dc-packages');
      }
    });
  };

  // Define columns for ShipmentOrderItems table
  const itemColumns = [
    {
      title: "Item Code",
      dataIndex: "itemCode",
      key: "itemCode",
      render: (text) => text || 'N/A',
    },
    {
      title: "Product Name",
      dataIndex: "productName",
      key: "productName",
      render: (text) => <span className="fw-bold">{text || 'N/A'}</span>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => text || 'N/A',
    },
    {
      title: "Weight (kg)",
      dataIndex: "weight",
      key: "weight",
      render: (text) => text ? `${text} kg` : 'N/A',
    },
    {
      title: "Value (KSh)",
      dataIndex: "productValue",
      key: "productValue",
      render: (text) => (
        <span className="text-success fw-bold">
          {text ? `KSh ${Number(text).toLocaleString()}` : 'N/A'}
        </span>
      ),
    },
    {
      title: "Fragile",
      dataIndex: "isFragile",
      key: "isFragile",
      render: (isFragile) => (
        <Badge bg={isFragile ? "warning" : "secondary"}>
          {isFragile ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      title: "Perishable",
      dataIndex: "isPerishable",
      key: "isPerishable",
      render: (isPerishable) => (
        <Badge bg={isPerishable ? "danger" : "secondary"}>
          {isPerishable ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      key: "remarks",
      render: (text) => text || 'N/A',
    },
    {
      title: "Date Added",
      dataIndex: "dateAdded",
      key: "dateAdded",
      render: (text) => text ? new Date(text).toLocaleDateString() : 'N/A',
    },
  ];

  if (loading || fetchLoading) {
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
          <Package size={48} className="mb-3" />
          <h4>Error Loading Package</h4>
          <p>{error}</p>
          <button className="btn btn-outline-danger me-2" onClick={clearError}>
            Retry
          </button>
          <Link to="/dc/dc-packages" className="btn btn-primary">
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
          <Alert variant="danger" className="text-center">
            <Package size={48} className="mb-3" />
            <h4>Package Not Found</h4>
            <p>The package you're looking for doesn't exist or has been removed.</p>
            <Link to="/dc/dc-packages" className="btn btn-primary">
              <ArrowLeft size={16} className="me-2" />
              Back to Packages
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
              <h6>Tracking Code: {packageData.OrderNO}</h6>
            </div>
          </div>
          <div className="page-btn d-flex gap-2">
            <Link to="/dc/dc-packages" className="btn btn-outline-secondary">
              <ArrowLeft size={16} className="me-2" />
              Back to Packages
            </Link>
            <Button variant="primary" onClick={() => setShowEditModal(true)}>
              <Edit3 size={16} className="me-2" />
              Edit Package
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
                      <label className="form-label text-muted">Tracking Code</label>
                      <p className="fw-bold">{packageData.OrderNO}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">Delivery Type</label>
                      <p>{packageData.DeliveryType || "N/A"}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">Package Description</label>
                      <p>{packageData.Notes || packageData.ShipmentOrderItems?.[0]?.description || "N/A"}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">Express Delivery</label>
                      <Badge bg={packageData.DeliveryType?.toLowerCase().includes('express') ? "success" : "secondary"}>
                        {packageData.DeliveryType?.toLowerCase().includes('express') ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="form-label text-muted">Origin DC</label>
                      <p>{packageData.OriginDCName || "N/A"}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">Destination DC</label>
                      <p>{packageData.DestinationDCName || "N/A"}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">Vendor</label>
                      <p>{packageData.VendorName || "N/A"}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">COD Required</label>
                      <Badge bg={packageData.CashOnDeliveryRequired ? "warning" : "secondary"}>
                        {packageData.CashOnDeliveryRequired ? "Yes" : "No"}
                      </Badge>
                    </div>
                    {packageData.CashOnDeliveryRequired && (
                      <div className="mb-3">
                        <label className="form-label text-muted">COD Amount</label>
                        <p className="fw-bold text-warning">KSh {packageData.CODAmount?.toFixed(2) || "0.00"}</p>
                      </div>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          
          {/* Recipient Information */}
          <Col lg={4} className="mb-4">
            <Card>
              <Card.Header>
                <h5 className="mb-0">Recipient Details</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3 d-flex align-items-center">
                  <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                    <Phone className="text-info" size={16} />
                  </div>
                  <div>
                    <small className="text-muted">Name</small>
                    <p className="mb-0 fw-bold">{packageData.CustomerName}</p>
                  </div>
                </div>
                <div className="mb-3 d-flex align-items-center">
                  <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                    <Phone className="text-success" size={16} />
                  </div>
                  <div>
                    <small className="text-muted">Phone</small>
                    <p className="mb-0">{packageData.CustomerPhone}</p>
                  </div>
                </div>
                {packageData.CustomerLandMark && (
                  <div className="mb-3 d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                      <MapPin className="text-primary" size={16} />
                    </div>
                    <div>
                      <small className="text-muted">Landmark</small>
                      <p className="mb-0">{packageData.CustomerLandMark}</p>
                    </div>
                  </div>
                )}
                {packageData.CustomerAddress && (
                  <div className="mb-3 d-flex align-items-center">
                    <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                      <MapPin className="text-warning" size={16} />
                    </div>
                    <div>
                      <small className="text-muted">Address</small>
                      <p className="mb-0">{packageData.CustomerAddress}</p>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Package Items */}
          {packageData.ShipmentOrderItems && packageData.ShipmentOrderItems.length > 0 && (
            <Col lg={12} className="mb-4">
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Package Items</h5>
                </Card.Header>
                <Card.Body>
                  <Datatable
                    columns={itemColumns}
                    dataSource={packageData.ShipmentOrderItems}
                    rowKey={(record) => record.id || record.itemCode || Math.random()}
                    pagination={false}
                  />
                  <div className="mt-3">
                    <small className="text-muted">
                      Total Items: {packageData.ShipmentOrderItems.length}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )}


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
                  {packageData.StatusTransitionArray && packageData.StatusTransitionArray.length > 0 && (
                    <div className="timeline-item">
                      <div className="timeline-marker bg-info"></div>
                      <div className="timeline-content">
                        <h6 className="mb-1">Status Transitions Available</h6>
                        <p className="text-muted mb-1">Available actions: {packageData.StatusTransitionArray.map(t => t.actionName).join(', ')}</p>
                        <small className="text-muted">Package can be transitioned to different statuses</small>
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
