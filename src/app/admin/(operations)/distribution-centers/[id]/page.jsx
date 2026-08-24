"use client"
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Row, Col, Badge, Button, Alert, Modal, Form, Table, Tab, Tabs } from "react-bootstrap";
import { ArrowLeft, Package, Users, Edit3, Trash2, Clock } from "feather-icons-react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import notify from "@/lib/toast";
import { distribution_centers } from "@/core/data/distribution_centers.mock";
import { packages } from "@/core/data/packages.mock";
import Link from "@/components/Link";
import { Building, Building2 } from "lucide-react";

const DistributionCenterDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const MySwal = withReactContent(Swal);
  const [dcData, setDcData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [dcPackages, setDcPackages] = useState([]);
  const [dcStats, setDcStats] = useState({
    totalPackages: 0,
    activePackages: 0,
    completedPackages: 0,
    capacity: 100
  });

  useEffect(() => {
    // Find DC by ID
    const foundDC = distribution_centers.find(dc => dc.id === params.id);
    if (foundDC) {
      setDcData(foundDC);
      
      // Get packages assigned to this DC
      const relatedPackages = packages.filter(pkg => 
        pkg.assigned_dc_id === foundDC.id
      );
      setDcPackages(relatedPackages);
      
      // Calculate stats
      const totalPackages = relatedPackages.length;
      const activePackages = relatedPackages.filter(pkg => 
        pkg.status === "Created" || pkg.status === "In Transit"
      ).length;
      const completedPackages = relatedPackages.filter(pkg => 
        pkg.status === "Delivered"
      ).length;
      
      setDcStats({
        totalPackages,
        activePackages,
        completedPackages,
        capacity: 150 // Mock capacity
      });
    }
    setLoading(false);
  }, [params.id]);

  const handleDeleteDC = () => {
    MySwal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the distribution center!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Yes, delete it!",
      cancelButtonColor: "#6c757d",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        notify.success("Distribution center has been deleted.");
        router.push('/admin/distribution-centers');
      }
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      "Created": "info",
      "In Transit": "primary", 
      "Delivered": "success",
      "Cancelled": "danger",
      "Returned": "warning"
    };
    return statusMap[status] || "secondary";
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

  if (!dcData) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Alert variant="danger" className="text-center">
            <Building2 size={48} className="mb-3" />
            <h4>Distribution Center Not Found</h4>
            <p>The distribution center you're looking for doesn't exist or has been removed.</p>
            <Link to="/admin/distribution-centers" className="btn btn-primary">
              <ArrowLeft size={16} className="me-2" />
              Back to Distribution Centers
            </Link>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Distribution Center Details</h4>
              <h6>{dcData.name}</h6>
            </div>
          </div>
          <div className="page-btn d-flex gap-2">
            <Link to="/admin/distribution-centers" className="btn btn-outline-secondary">
              <ArrowLeft size={16} className="me-2" />
              Back to Centers
            </Link>
            <Button variant="primary" onClick={() => setShowEditModal(true)}>
              <Edit3 size={16} className="me-2" />
              Edit Center
            </Button>
            <Button variant="danger" onClick={handleDeleteDC}>
              <Trash2 size={16} className="me-2" />
              Delete
            </Button>
          </div>
        </div>

        <Row>
          {/* DC Status Card */}
          <Col lg={12} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                      <Building2 className="text-primary" size={24} />
                    </div>
                    <div>
                      <h5 className="mb-1">Distribution Center Status</h5>
                      <Badge bg={dcData.is_active ? "success" : "danger"} className="fs-6">
                        {dcData.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-end">
                    <h6 className="text-muted mb-1">Capacity Usage</h6>
                    <div className="d-flex align-items-center">
                      <div className="progress me-2" style={{ width: "100px", height: "8px" }}>
                        <div 
                          className="progress-bar bg-info" 
                          style={{ width: `${(dcStats.activePackages / dcStats.capacity) * 100}%` }}
                        ></div>
                      </div>
                      <span className="small">{dcStats.activePackages}/{dcStats.capacity}</span>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* DC Information */}
          <Col lg={8} className="mb-4">
            <Card>
              <Card.Header>
                <h5 className="mb-0">Center Information</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="form-label text-muted">Center Name</label>
                      <p className="fw-bold">{dcData.name}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">City</label>
                      <p>{dcData.city}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">Region</label>
                      <p>{dcData.region || "N/A"}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">Address</label>
                      <p>{dcData.address || "N/A"}</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="form-label text-muted">Phone</label>
                      <p>{dcData.phone || "N/A"}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">Email</label>
                      <p>{dcData.email || "N/A"}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">Manager</label>
                      <p>{dcData.manager?.full_name || "N/A"}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">Foot Pickup Support</label>
                      <Badge bg={dcData.supports_foot_pickup ? "info" : "secondary"}>
                        {dcData.supports_foot_pickup ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* Manager Information */}
          <Col lg={4} className="mb-4">
            <Card>
              <Card.Header>
                <h5 className="mb-0">Manager Details</h5>
              </Card.Header>
              <Card.Body>
                {dcData.manager ? (
                  <>
                    <div className="text-center mb-3">
                      <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: "60px", height: "60px" }}>
                        <Users size={30} className="text-primary" />
                      </div>
                      <h6 className="mb-1">{dcData.manager.full_name}</h6>
                      <small className="text-muted">Distribution Center Manager</small>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                      <div className="bg-info bg-opacity-10 p-2 rounded me-2">
                        <Users className="text-info" size={14} />
                      </div>
                      <small>Manager ID: <code>{dcData.manager_id?.split('-')[0]}</code></small>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted">
                    <Users size={48} className="mb-2" />
                    <p>No manager assigned</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Stats Cards */}
          <Col lg={12} className="mb-4">
            <Row>
              <Col md={3}>
                <Card className="text-center border-0 shadow-sm">
                  <Card.Body>
                    <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: "50px", height: "50px" }}>
                      <Package size={24} className="text-primary" />
                    </div>
                    <h4 className="mb-0">{dcStats.totalPackages}</h4>
                    <small className="text-muted">Total Packages</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center border-0 shadow-sm">
                  <Card.Body>
                    <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: "50px", height: "50px" }}>
                      <Clock size={24} className="text-warning" />
                    </div>
                    <h4 className="mb-0">{dcStats.activePackages}</h4>
                    <small className="text-muted">Active Packages</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center border-0 shadow-sm">
                  <Card.Body>
                    <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: "50px", height: "50px" }}>
                      <Package size={24} className="text-success" />
                    </div>
                    <h4 className="mb-0">{dcStats.completedPackages}</h4>
                    <small className="text-muted">Completed</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center border-0 shadow-sm">
                  <Card.Body>
                    <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: "50px", height: "50px" }}>
                      <Building size={24} className="text-info" />
                    </div>
                    <h4 className="mb-0">{dcStats.capacity}</h4>
                    <small className="text-muted">Capacity</small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>

          {/* Tabs for detailed information */}
          <Col lg={12}>
            <Card>
              <Card.Body>
                <Tabs defaultActiveKey="packages" className="mb-3">
                  <Tab eventKey="packages" title="Packages">
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Tracking Code</th>
                            <th>Recipient</th>
                            <th>Status</th>
                            <th>Cost</th>
                            <th>Created Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dcPackages.slice(0, 10).map((pkg, index) => (
                            <tr key={index}>
                              <td><code>{pkg.tracking_code}</code></td>
                              <td>{pkg.recipient_name}</td>
                              <td>
                                <Badge bg={getStatusBadge(pkg.status)}>
                                  {pkg.status}
                                </Badge>
                              </td>
                              <td>KSh {pkg.delivery_cost.toFixed(2)}</td>
                              <td>{new Date(pkg.created_at).toLocaleDateString()}</td>
                              <td>
                                <Link to={`/admin/packages/${pkg.id}`} className="btn btn-sm btn-outline-primary">
                                  View
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                      {dcPackages.length === 0 && (
                        <div className="text-center py-4">
                          <Package size={48} className="text-muted mb-3" />
                          <p className="text-muted">No packages assigned to this distribution center.</p>
                        </div>
                      )}
                    </div>
                  </Tab>
                  
                  <Tab eventKey="activity" title="Recent Activity">
                    <div className="timeline">
                      <div className="timeline-item">
                        <div className="timeline-marker bg-primary"></div>
                        <div className="timeline-content">
                          <h6 className="mb-1">Distribution Center Created</h6>
                          <p className="text-muted mb-1">{new Date(dcData.created_at).toLocaleString()}</p>
                          <small className="text-muted">Distribution center was added to the system</small>
                        </div>
                      </div>
                      {dcData.updated_at && dcData.updated_at !== dcData.created_at && (
                        <div className="timeline-item">
                          <div className="timeline-marker bg-info"></div>
                          <div className="timeline-content">
                            <h6 className="mb-1">Information Updated</h6>
                            <p className="text-muted mb-1">{new Date(dcData.updated_at).toLocaleString()}</p>
                            <small className="text-muted">Distribution center information was updated</small>
                          </div>
                        </div>
                      )}
                      {dcPackages.slice(0, 5).map((pkg, index) => (
                        <div key={index} className="timeline-item">
                          <div className="timeline-marker bg-success"></div>
                          <div className="timeline-content">
                            <h6 className="mb-1">Package Assigned</h6>
                            <p className="text-muted mb-1">{new Date(pkg.created_at).toLocaleString()}</p>
                            <small className="text-muted">Package {pkg.tracking_code} was assigned to this center</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Tab>
                  
                  <Tab eventKey="settings" title="Settings">
                    <Row>
                      <Col md={6}>
                        <h6 className="mb-3">Operational Settings</h6>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Active Status</span>
                            <Badge bg={dcData.is_active ? "success" : "danger"}>
                              {dcData.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Foot Pickup Support</span>
                            <Badge bg={dcData.supports_foot_pickup ? "info" : "secondary"}>
                              {dcData.supports_foot_pickup ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Current Capacity</span>
                            <span>{dcStats.activePackages}/{dcStats.capacity}</span>
                          </div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <h6 className="mb-3">Contact Information</h6>
                        <div className="mb-2">
                          <small className="text-muted">Phone:</small>
                          <p className="mb-1">{dcData.phone || "Not set"}</p>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted">Email:</small>
                          <p className="mb-1">{dcData.email || "Not set"}</p>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted">Address:</small>
                          <p className="mb-1">{dcData.address || "Not set"}</p>
                        </div>
                      </Col>
                    </Row>
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Edit Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Edit Distribution Center</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Center Name</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={dcData.name}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>City</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={dcData.city}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Region</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={dcData.region}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={dcData.phone}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      defaultValue={dcData.email}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select defaultValue={dcData.is_active ? "active" : "inactive"}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      defaultValue={dcData.address}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      id="supports_foot_pickup"
                      label="Supports Foot Pickup"
                      defaultChecked={dcData.supports_foot_pickup}
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
              notify.success("Distribution center updated successfully.");
              setShowEditModal(false);
            }}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      </div>

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

export default DistributionCenterDetailPage;
