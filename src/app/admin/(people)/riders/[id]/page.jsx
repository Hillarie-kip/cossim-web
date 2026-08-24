"use client"
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Row, Col, Badge, Button, Alert, Modal, Form, Tab, Tabs } from "react-bootstrap";
import { ArrowLeft, Truck, MapPin, Phone, Calendar, Star, Activity, Edit3, Trash2, Package, Clock } from "feather-icons-react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import Link from "@/components/Link";
import { ridersMock } from "@/core/data/riders.mock";
import notify from "@/lib/toast";

const RiderDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const MySwal = withReactContent(Swal);
  const [riderData, setRiderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    // Find rider by ID
    const foundRider = ridersMock.find(rider => rider.id === params.id);
    if (foundRider) {
      setRiderData(foundRider);
    }
    setLoading(false);
  }, [params.id]);

  const handleDeleteRider = () => {
    MySwal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the rider!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Yes, delete it!",
      cancelButtonColor: "#6c757d",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        notify.success("Rider has been deleted.");
        router.push('/admin/riders');
      }
    });
  };

  const handleToggleStatus = () => {
    const newStatus = riderData.status === "active" ? "inactive" : "active";
    MySwal.fire({
      title: `${newStatus === "active" ? 'Activate' : 'Deactivate'} Rider?`,
      text: `This will ${newStatus === "active" ? 'activate' : 'deactivate'} the rider.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#28a745",
      confirmButtonText: `Yes, ${newStatus === "active" ? 'activate' : 'deactivate'}!`,
      cancelButtonColor: "#6c757d",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setRiderData({...riderData, status: newStatus});
        notify.success(`Rider has been ${newStatus === "active" ? 'activated' : 'deactivated'}.`);
      }
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: "success",
      inactive: "danger",
      busy: "warning",
      offline: "secondary"
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

  if (!riderData) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Alert variant="danger" className="text-center">
            <Truck size={48} className="mb-3" />
            <h4>Rider Not Found</h4>
            <p>The rider you're looking for doesn't exist or has been removed.</p>
            <Link to="/admin/riders" className="btn btn-primary">
              <ArrowLeft size={16} className="me-2" />
              Back to Riders
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
              <h4>Rider Details</h4>
              <h6>{riderData.name}</h6>
            </div>
          </div>
          <div className="page-btn d-flex gap-2">
            <Link to="/admin/riders" className="btn btn-outline-secondary">
              <ArrowLeft size={16} className="me-2" />
              Back to Riders
            </Link>
            <Button 
              variant={riderData.status === "active" ? "warning" : "success"} 
              onClick={handleToggleStatus}
            >
              {riderData.status === "active" ? "Deactivate" : "Activate"}
            </Button>
            <Button variant="primary" onClick={() => setShowEditModal(true)}>
              <Edit3 size={16} className="me-2" />
              Edit Rider
            </Button>
            <Button variant="danger" onClick={handleDeleteRider}>
              <Trash2 size={16} className="me-2" />
              Delete
            </Button>
          </div>
        </div>

        <Row>
          {/* Rider Status Cards */}
          <Col lg={3} md={6} className="mb-4">
            <Card className="bg-primary text-white">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">Total Deliveries</h6>
                    <h4 className="mb-0">{riderData.total_deliveries || Math.floor(Math.random() * 500) + 100}</h4>
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
                    <h6 className="mb-1">Success Rate</h6>
                    <h4 className="mb-0">{riderData.success_rate || Math.floor(Math.random() * 20) + 80}%</h4>
                  </div>
                  <Star size={36} className="opacity-75" />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="bg-warning text-white">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">Average Rating</h6>
                    <h4 className="mb-0">{riderData.rating || (Math.random() * 2 + 3).toFixed(1)}/5</h4>
                  </div>
                  <Star size={36} className="opacity-75" />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="bg-info text-white">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">Active Hours</h6>
                    <h4 className="mb-0">{riderData.active_hours || Math.floor(Math.random() * 12) + 6}h</h4>
                  </div>
                  <Clock size={36} className="opacity-75" />
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Rider Profile Card */}
          <Col lg={4} className="mb-4">
            <Card className="text-center">
              <Card.Body>
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "80px", height: "80px" }}>
                  <Truck size={40} className="text-primary" />
                </div>
                <h4 className="mb-1">{riderData.name}</h4>
                <p className="text-muted mb-3">ID: {riderData.id}</p>
                
                <div className="d-flex justify-content-center mb-3">
                  <Badge bg={getStatusBadge(riderData.status)} className="me-2">
                    {riderData.status.charAt(0).toUpperCase() + riderData.status.slice(1)}
                  </Badge>
                  <Badge bg="info">
                    Vehicle: {riderData.vehicle_type || "Bike"}
                  </Badge>
                </div>
                
                <hr />
                
                <div className="row text-center">
                  <div className="col-6">
                    <h6 className="mb-0">{riderData.total_deliveries || Math.floor(Math.random() * 500) + 100}</h6>
                    <small className="text-muted">Total Deliveries</small>
                  </div>
                  <div className="col-6">
                    <h6 className="mb-0">{riderData.rating || (Math.random() * 2 + 3).toFixed(1)}/5</h6>
                    <small className="text-muted">Rating</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Rider Information */}
          <Col lg={8} className="mb-4">
            <Card>
              <Card.Header>
                <h5 className="mb-0">Rider Information</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <div className="mb-3 d-flex align-items-center">
                      <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                        <Phone className="text-primary" size={16} />
                      </div>
                      <div>
                        <small className="text-muted">Phone Number</small>
                        <p className="mb-0 fw-bold">{riderData.phone}</p>
                      </div>
                    </div>
                    <div className="mb-3 d-flex align-items-center">
                      <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                        <MapPin className="text-success" size={16} />
                      </div>
                      <div>
                        <small className="text-muted">Current Location</small>
                        <p className="mb-0">{riderData.location || "Location not available"}</p>
                      </div>
                    </div>
                    <div className="mb-3 d-flex align-items-center">
                      <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                        <Truck className="text-info" size={16} />
                      </div>
                      <div>
                        <small className="text-muted">Vehicle Type</small>
                        <p className="mb-0">{riderData.vehicle_type || "Motorcycle"}</p>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3 d-flex align-items-center">
                      <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                        <Calendar className="text-warning" size={16} />
                      </div>
                      <div>
                        <small className="text-muted">Join Date</small>
                        <p className="mb-0">{new Date(riderData.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="mb-3 d-flex align-items-center">
                      <div className="bg-danger bg-opacity-10 p-2 rounded me-3">
                        <Activity className="text-danger" size={16} />
                      </div>
                      <div>
                        <small className="text-muted">Status</small>
                        <p className="mb-0">
                          <Badge bg={getStatusBadge(riderData.status)}>
                            {riderData.status.charAt(0).toUpperCase() + riderData.status.slice(1)}
                          </Badge>
                        </p>
                      </div>
                    </div>
                    <div className="mb-3 d-flex align-items-center">
                      <div className="bg-secondary bg-opacity-10 p-2 rounded me-3">
                        <Star className="text-secondary" size={16} />
                      </div>
                      <div>
                        <small className="text-muted">Manager</small>
                        <p className="mb-0">{riderData.manager_name || "Not assigned"}</p>
                      </div>
                    </div>
                  </Col>
                </Row>

                <hr />

                <Row>
                  <Col md={12}>
                    <h6 className="mb-3">Performance Metrics</h6>
                    <Row>
                      <Col md={3}>
                        <div className="text-center p-3 border rounded">
                          <h5 className="text-primary mb-1">{riderData.total_deliveries || Math.floor(Math.random() * 500) + 100}</h5>
                          <small className="text-muted">Total Deliveries</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="text-center p-3 border rounded">
                          <h5 className="text-success mb-1">{riderData.success_rate || Math.floor(Math.random() * 20) + 80}%</h5>
                          <small className="text-muted">Success Rate</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="text-center p-3 border rounded">
                          <h5 className="text-warning mb-1">{riderData.rating || (Math.random() * 2 + 3).toFixed(1)}</h5>
                          <small className="text-muted">Rating</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="text-center p-3 border rounded">
                          <h5 className="text-info mb-1">{Math.floor(Math.random() * 50) + 10}</h5>
                          <small className="text-muted">Pending</small>
                        </div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* Detailed Tabs */}
          <Col lg={12}>
            <Card>
              <Card.Body>
                <Tabs defaultActiveKey="deliveries" className="mb-3">
                  <Tab eventKey="deliveries" title="Recent Deliveries">
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Package ID</th>
                            <th>Recipient</th>
                            <th>Address</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Rating</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[1, 2, 3, 4, 5].map((item, index) => (
                            <tr key={index}>
                              <td>PKG-{1000 + index}</td>
                              <td>Customer {index + 1}</td>
                              <td>123 Street {index + 1}, City</td>
                              <td>
                                <Badge bg={index % 2 === 0 ? "success" : "warning"}>
                                  {index % 2 === 0 ? "Delivered" : "In Transit"}
                                </Badge>
                              </td>
                              <td>{new Date().toLocaleDateString()}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <Star size={14} className="text-warning me-1" />
                                  {(Math.random() * 2 + 3).toFixed(1)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Tab>
                  
                  <Tab eventKey="performance" title="Performance">
                    <Row>
                      <Col md={6}>
                        <h6 className="mb-3">Delivery Statistics</h6>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between">
                            <span>On-time Deliveries</span>
                            <span className="fw-bold text-success">85%</span>
                          </div>
                          <div className="progress mt-1">
                            <div className="progress-bar bg-success" style={{width: "85%"}}></div>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between">
                            <span>Customer Satisfaction</span>
                            <span className="fw-bold text-primary">92%</span>
                          </div>
                          <div className="progress mt-1">
                            <div className="progress-bar bg-primary" style={{width: "92%"}}></div>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between">
                            <span>Fuel Efficiency</span>
                            <span className="fw-bold text-warning">78%</span>
                          </div>
                          <div className="progress mt-1">
                            <div className="progress-bar bg-warning" style={{width: "78%"}}></div>
                          </div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <h6 className="mb-3">Monthly Performance</h6>
                        <div className="d-flex justify-content-between mb-2">
                          <span>January</span>
                          <Badge bg="success">Excellent</Badge>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>February</span>
                          <Badge bg="primary">Good</Badge>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>March</span>
                          <Badge bg="success">Excellent</Badge>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>April</span>
                          <Badge bg="warning">Average</Badge>
                        </div>
                      </Col>
                    </Row>
                  </Tab>
                  
                  <Tab eventKey="vehicle" title="Vehicle Info">
                    <Row>
                      <Col md={6}>
                        <h6 className="mb-3">Vehicle Details</h6>
                        <div className="mb-3">
                          <div className="row">
                            <div className="col-4"><strong>Type:</strong></div>
                            <div className="col-8">{riderData.vehicle_type || "Motorcycle"}</div>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="row">
                            <div className="col-4"><strong>License Plate:</strong></div>
                            <div className="col-8">ABC-{Math.floor(Math.random() * 999) + 100}</div>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="row">
                            <div className="col-4"><strong>Model:</strong></div>
                            <div className="col-8">Honda CG 125</div>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="row">
                            <div className="col-4"><strong>Year:</strong></div>
                            <div className="col-8">2022</div>
                          </div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <h6 className="mb-3">Maintenance Status</h6>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Last Service</span>
                            <Badge bg="success">2 weeks ago</Badge>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Next Service Due</span>
                            <Badge bg="warning">In 2 weeks</Badge>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Insurance</span>
                            <Badge bg="success">Valid</Badge>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Registration</span>
                            <Badge bg="success">Valid</Badge>
                          </div>
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
            <Modal.Title>Edit Rider</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Rider Name</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={riderData.name}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={riderData.phone}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Vehicle Type</Form.Label>
                    <Form.Select defaultValue={riderData.vehicle_type || "motorcycle"}>
                      <option value="motorcycle">Motorcycle</option>
                      <option value="bike">Bike</option>
                      <option value="car">Car</option>
                      <option value="van">Van</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select defaultValue={riderData.status}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="busy">Busy</option>
                      <option value="offline">Offline</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Manager</Form.Label>
                    <Form.Select defaultValue={riderData.manager_name || ""}>
                      <option value="">Select Manager</option>
                      <option value="John Smith">John Smith</option>
                      <option value="Jane Doe">Jane Doe</option>
                      <option value="Mike Johnson">Mike Johnson</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Location</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={riderData.location || ""}
                      placeholder="Current location"
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
              notify.success("Rider updated successfully.");
              setShowEditModal(false);
            }}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default RiderDetailPage;
