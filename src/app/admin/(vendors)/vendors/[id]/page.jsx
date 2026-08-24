"use client"
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Row, Col, Badge, Button, Alert, Modal, Form, Tabs, Tab } from "react-bootstrap";
import { ArrowLeft, User, Mail, Phone, Calendar, Home, MapPin, Edit3, Trash2 } from "feather-icons-react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import Link from "@/components/Link";
import vendorService from "@/services/vendorService";
import notify from "@/lib/toast";

const VendorDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const MySwal = withReactContent(Swal);
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    vendorCode: "",
    vendorName: "",
    contactName: "",
    phoneNumber: "",
    emailAddress: "",
    defaultDCCode: "",
  });

  useEffect(() => {
    // Fetch vendor data by ID/code
    // For now, we'll simulate this. In a real app, you'd make an API call
    // to get specific vendor details by ID
    fetchVendorData();
  }, [params.id]);

  const fetchVendorData = async () => {
    try {
      // Since there's no specific get vendor by ID endpoint in the swagger,
      // we'll fetch all vendors and find the one with matching code
      const response = await vendorService.getVendors({ searchTerm: params.id });

      if (response && !response.Error && response.Data) {
        const vendor = response.Data.find(v => v.vendorCode === params.id);
        if (vendor) {
          setVendorData(vendor);
          setEditForm({
            vendorCode: vendor.vendorCode,
            vendorName: vendor.vendorName,
            contactName: vendor.contactName,
            phoneNumber: vendor.phoneNumber,
            emailAddress: vendor.emailAddress,
            defaultDCCode: vendor.defaultDCCode,
          });
        } else {
          notify.error("Vendor not found");
          router.push('/admin/vendors');
        }
      }
    } catch (error) {
      console.error('Error fetching vendor:', error);
      notify.error("Failed to fetch vendor details");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateVendor = () => {
    MySwal.fire({
      title: "Are you sure?",
      text: "This will deactivate the vendor!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Yes, deactivate it!",
      cancelButtonColor: "#6c757d",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await vendorService.deactivateVendor({
            vendorCode: vendorData.vendorCode
          });

          if (response && !response.Error) {
            notify.success("Vendor has been deactivated.");
            router.push('/admin/vendors');
          } else {
            notify.error(response?.Message || "Failed to deactivate vendor");
          }
        } catch (error) {
          notify.error(error.message || "Failed to deactivate vendor");
        }
      }
    });
  };

  const handleUpdateVendor = async () => {
    try {
      const response = await vendorService.updateVendor(editForm);

      if (response && !response.Error) {
        setVendorData({ ...vendorData, ...editForm });
        setShowEditModal(false);
        notify.success("Vendor has been updated successfully.");
      } else {
        notify.error(response?.Message || "Failed to update vendor");
      }
    } catch (error) {
      notify.error(error.message || "Failed to update vendor");
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const getStatusBadge = (statusID) => {
    return statusID === 1 ? "success" : "danger";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
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

  if (!vendorData) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Alert variant="danger" className="text-center">
            <Home size={48} className="mb-3" />
            <h4>Vendor Not Found</h4>
            <p>The vendor you're looking for doesn't exist or has been removed.</p>
            <Link to="/admin/vendors" className="btn btn-primary">
              <ArrowLeft size={16} className="me-2" />
              Back to Vendors
            </Link>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="page-header">
        <div className="add-item d-flex">
          <div className="page-title">
            <h4>Vendor Details</h4>
            <h6>{vendorData.vendorName}</h6>
          </div>
        </div>
        <div className="page-btn d-flex gap-2">
          <Link to="/admin/vendors" className="btn btn-outline-secondary">
            <ArrowLeft size={16} className="me-2" />
            Back to Vendors
          </Link>
          {vendorData.statusID === 1 && (
            <Button variant="warning" onClick={handleDeactivateVendor}>
              <Trash2 size={16} className="me-2" />
              Deactivate
            </Button>
          )}
          <Button variant="primary" onClick={() => setShowEditModal(true)}>
            <Edit3 size={16} className="me-2" />
            Edit Vendor
          </Button>
        </div>
      </div>

      <Row>
        {/* Vendor Status Card */}
        <Col lg={12} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                    <Home className="text-primary" size={24} />
                  </div>
                  <div>
                    <h5 className="mb-1">Vendor Status</h5>
                    <div className="d-flex gap-2">
                      <Badge bg={getStatusBadge(vendorData.statusID)} className="fs-6">
                        {vendorData.statusID === 1 ? "Active" : "Inactive"}
                      </Badge>
                      <Badge bg="info" className="fs-6">
                        Vendor Code: {vendorData.vendorCode}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <h6 className="text-muted mb-1">Date Added</h6>
                  <h6 className="mb-0">{formatDate(vendorData.dateAdded)}</h6>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Vendor Profile Card */}
        <Col lg={4} className="mb-4">
          <Card className="text-center">
            <Card.Body>
              <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "80px", height: "80px" }}>
                <Home size={40} className="text-primary" />
              </div>
              <h4 className="mb-1">{vendorData.vendorName}</h4>
              <p className="text-muted mb-3">Vendor Code: {vendorData.vendorCode}</p>

              <div className="d-flex justify-content-center mb-3">
                <Badge bg={getStatusBadge(vendorData.statusID)} className="me-2">
                  {vendorData.statusID === 1 ? "Active" : "Inactive"}
                </Badge>
                <Badge bg="secondary">
                  DC: {vendorData.defaultDCCode}
                </Badge>
              </div>

              <hr />

              <div className="row text-center">
                <div className="col-12">
                  <h6 className="mb-0">{formatDate(vendorData.dateAdded)}</h6>
                  <small className="text-muted">Registration Date</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Vendor Information */}
        <Col lg={8} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Vendor Information</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="mb-3 d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                      <Mail className="text-primary" size={16} />
                    </div>
                    <div>
                      <small className="text-muted">Email Address</small>
                      <p className="mb-0 fw-bold">{vendorData.emailAddress || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="mb-3 d-flex align-items-center">
                    <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                      <Phone className="text-success" size={16} />
                    </div>
                    <div>
                      <small className="text-muted">Phone Number</small>
                      <p className="mb-0">{vendorData.phoneNumber || "Not provided"}</p>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3 d-flex align-items-center">
                    <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                      <User className="text-info" size={16} />
                    </div>
                    <div>
                      <small className="text-muted">Contact Name</small>
                      <p className="mb-0">{vendorData.contactName || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="mb-3 d-flex align-items-center">
                    <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                      <MapPin className="text-warning" size={16} />
                    </div>
                    <div>
                      <small className="text-muted">Default DC Code</small>
                      <p className="mb-0">{vendorData.defaultDCCode || "Not assigned"}</p>
                    </div>
                  </div>
                </Col>
              </Row>

              {vendorData.refferalCode && (
                <Row>
                  <Col md={12}>
                    <div className="mb-3 d-flex align-items-center">
                      <div className="bg-secondary bg-opacity-10 p-2 rounded me-3">
                        <Calendar className="text-secondary" size={16} />
                      </div>
                      <div>
                        <small className="text-muted">Referral Code</small>
                        <p className="mb-0">{vendorData.refferalCode}</p>
                      </div>
                    </div>
                  </Col>
                </Row>
              )}

              <hr />

              <Row>
                <Col md={12}>
                  <h6 className="mb-3">Vendor Details</h6>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span>Added By:</span>
                      <Badge bg="info">{vendorData.addedByName || vendorData.addedBy || "System"}</Badge>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span>Registration Date:</span>
                      <span>{formatDate(vendorData.dateAdded)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span>Current Status:</span>
                      <Badge bg={getStatusBadge(vendorData.statusID)}>
                        {vendorData.statusID === 1 ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Tabs for detailed vendor information */}
        <Col lg={12}>
          <Card>
            <Card.Body>
              <Tabs defaultActiveKey="activity" className="mb-3">
                <Tab eventKey="activity" title="Vendor Activity">
                  <div className="timeline">
                    <div className="timeline-item">
                      <div className="timeline-marker bg-primary"></div>
                      <div className="timeline-content">
                        <h6 className="mb-1">Vendor Registered</h6>
                        <p className="text-muted mb-1">{formatDate(vendorData.dateAdded)}</p>
                        <small className="text-muted">Vendor account was created in the system</small>
                      </div>
                    </div>
                    <div className="timeline-item">
                      <div className="timeline-marker bg-success"></div>
                      <div className="timeline-content">
                        <h6 className="mb-1">Status: {vendorData.statusID === 1 ? 'Active' : 'Inactive'}</h6>
                        <p className="text-muted mb-1">Current Status</p>
                        <small className="text-muted">Vendor is currently {vendorData.statusID === 1 ? 'active and operational' : 'inactive'}</small>
                      </div>
                    </div>
                    {vendorData.defaultDCCode && (
                      <div className="timeline-item">
                        <div className="timeline-marker bg-info"></div>
                        <div className="timeline-content">
                          <h6 className="mb-1">DC Assignment</h6>
                          <p className="text-muted mb-1">Assigned to DC: {vendorData.defaultDCCode}</p>
                          <small className="text-muted">Default distribution center assigned</small>
                        </div>
                      </div>
                    )}
                  </div>
                </Tab>

                <Tab eventKey="contact" title="Contact Details">
                  <Row>
                    <Col md={6}>
                      <h6 className="mb-3">Primary Contact</h6>
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <User size={16} className="me-2 text-primary" />
                          <div>
                            <small className="text-muted">Contact Person</small>
                            <p className="mb-0">{vendorData.contactName || "Not provided"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <Phone size={16} className="me-2 text-success" />
                          <div>
                            <small className="text-muted">Phone Number</small>
                            <p className="mb-0">{vendorData.phoneNumber || "Not provided"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <Mail size={16} className="me-2 text-info" />
                          <div>
                            <small className="text-muted">Email Address</small>
                            <p className="mb-0">{vendorData.emailAddress || "Not provided"}</p>
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <h6 className="mb-3">Business Information</h6>
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <Home size={16} className="me-2 text-warning" />
                          <div>
                            <small className="text-muted">Business Name</small>
                            <p className="mb-0">{vendorData.vendorName}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <MapPin size={16} className="me-2 text-danger" />
                          <div>
                            <small className="text-muted">Default DC</small>
                            <p className="mb-0">{vendorData.defaultDCCode || "Not assigned"}</p>
                          </div>
                        </div>
                      </div>
                      {vendorData.refferalCode && (
                        <div className="mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <Calendar size={16} className="me-2 text-secondary" />
                            <div>
                              <small className="text-muted">Referral Code</small>
                              <p className="mb-0">{vendorData.refferalCode}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </Col>
                  </Row>
                </Tab>

                <Tab eventKey="settings" title="Vendor Settings">
                  <Row>
                    <Col md={6}>
                      <h6 className="mb-3">Account Settings</h6>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <span>Vendor Status</span>
                          <Badge bg={getStatusBadge(vendorData.statusID)}>
                            {vendorData.statusID === 1 ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <span>Notifications</span>
                          <Badge bg="success">Enabled</Badge>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <span>API Access</span>
                          <Badge bg="info">Available</Badge>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <h6 className="mb-3">Vendor Actions</h6>
                      <div className="d-grid gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => setShowEditModal(true)}
                        >
                          <Edit3 size={16} className="me-1" />
                          Edit Vendor Details
                        </Button>
                        {vendorData.statusID === 1 && (
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={handleDeactivateVendor}
                          >
                            <Trash2 size={16} className="me-1" />
                            Deactivate Vendor
                          </Button>
                        )}
                        <Button variant="outline-info" size="sm">
                          <Mail size={16} className="me-1" />
                          Send Notification
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Edit Vendor Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Vendor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vendor Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="vendorCode"
                    value={editForm.vendorCode}
                    onChange={handleEditFormChange}
                    disabled
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vendor Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="vendorName"
                    value={editForm.vendorName}
                    onChange={handleEditFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="contactName"
                    value={editForm.contactName}
                    onChange={handleEditFormChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="phoneNumber"
                    value={editForm.phoneNumber}
                    onChange={handleEditFormChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="emailAddress"
                    value={editForm.emailAddress}
                    onChange={handleEditFormChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Default DC Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="defaultDCCode"
                    value={editForm.defaultDCCode}
                    onChange={handleEditFormChange}
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
          <Button variant="primary" onClick={handleUpdateVendor}>
            Update Vendor
          </Button>
        </Modal.Footer>
      </Modal>
    </div>

  );
};

export default VendorDetailPage;
