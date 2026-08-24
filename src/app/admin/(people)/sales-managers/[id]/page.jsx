"use client"
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Row, Col, Badge, Button, Alert, Modal, Form, Tab, Tabs, Table, ProgressBar } from "react-bootstrap";
import { ArrowLeft, User, Users, TrendingUp, Target, Phone, Mail, Calendar, Edit3, Trash2, Activity, Award } from "feather-icons-react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import Link from "@/components/Link";
import { salesManagersMock } from "@/core/data/sales_managers.mock";
import notify from "@/lib/toast";

const SalesManagerDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const MySwal = withReactContent(Swal);
  const [managerData, setManagerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    // Find manager by ID
    const foundManager = salesManagersMock.find(manager => manager.id === params.id);
    if (foundManager) {
      setManagerData(foundManager);
    }
    setLoading(false);
  }, [params.id]);

  const handleDeleteManager = () => {
    MySwal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the sales manager!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Yes, delete it!",
      cancelButtonColor: "#6c757d",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        notify.success("Sales manager has been deleted.");
        router.push('/admin/sales-managers');
      }
    });
  };

  const handleToggleStatus = () => {
    const newStatus = managerData.is_active ? false : true;
    MySwal.fire({
      title: `${newStatus ? 'Activate' : 'Deactivate'} Manager?`,
      text: `This will ${newStatus ? 'activate' : 'deactivate'} the sales manager.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#28a745",
      confirmButtonText: `Yes, ${newStatus ? 'activate' : 'deactivate'}!`,
      cancelButtonColor: "#6c757d",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setManagerData({...managerData, is_active: newStatus});
        notify.success(`Sales manager has been ${newStatus ? 'activated' : 'deactivated'}.`);
      }
    });
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

  if (!managerData) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Alert variant="danger" className="text-center">
            <User size={48} className="mb-3" />
            <h4>Sales Manager Not Found</h4>
            <p>The sales manager you're looking for doesn't exist or has been removed.</p>
            <Link to="/admin/sales-managers" className="btn btn-primary">
              <ArrowLeft size={16} className="me-2" />
              Back to Sales Managers
            </Link>
          </Alert>
        </div>
      </div>
    );
  }

  const currentMonthSales = Math.floor(Math.random() * 50) + 20;
  const salesTarget = 100;
  const salesProgress = (currentMonthSales / salesTarget) * 100;

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Sales Manager Details</h4>
              <h6>{managerData.name}</h6>
            </div>
          </div>
          <div className="page-btn d-flex gap-2">
            <Link to="/admin/sales-managers" className="btn btn-outline-secondary">
              <ArrowLeft size={16} className="me-2" />
              Back to Managers
            </Link>
            <Button 
              variant={managerData.is_active ? "warning" : "success"} 
              onClick={handleToggleStatus}
            >
              {managerData.is_active ? "Deactivate" : "Activate"}
            </Button>
            <Button variant="primary" onClick={() => setShowEditModal(true)}>
              <Edit3 size={16} className="me-2" />
              Edit Manager
            </Button>
            <Button variant="danger" onClick={handleDeleteManager}>
              <Trash2 size={16} className="me-2" />
              Delete
            </Button>
          </div>
        </div>

        <Row>
          {/* Performance Cards */}
          <Col lg={3} md={6} className="mb-4">
            <Card className="bg-primary text-white">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">Agents Managed</h6>
                    <h4 className="mb-0">{managerData.agents_count || Math.floor(Math.random() * 20) + 5}</h4>
                  </div>
                  <Users size={36} className="opacity-75" />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="bg-success text-white">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">Monthly Sales</h6>
                    <h4 className="mb-0">{currentMonthSales}</h4>
                  </div>
                  <TrendingUp size={36} className="opacity-75" />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="bg-warning text-white">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">Target Progress</h6>
                    <h4 className="mb-0">{salesProgress.toFixed(0)}%</h4>
                  </div>
                  <Target size={36} className="opacity-75" />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="bg-info text-white">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">Team Rating</h6>
                    <h4 className="mb-0">{(Math.random() * 1.5 + 3.5).toFixed(1)}/5</h4>
                  </div>
                  <Award size={36} className="opacity-75" />
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Manager Profile Card */}
          <Col lg={4} className="mb-4">
            <Card className="text-center">
              <Card.Body>
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "80px", height: "80px" }}>
                  <User size={40} className="text-primary" />
                </div>
                <h4 className="mb-1">{managerData.name}</h4>
                <p className="text-muted mb-3">Sales Manager</p>
                
                <div className="d-flex justify-content-center mb-3">
                  <Badge bg={managerData.is_active ? "success" : "danger"} className="me-2">
                    {managerData.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge bg="info">
                    Region: {managerData.region || "Central"}
                  </Badge>
                </div>
                
                <hr />
                
                <div className="row text-center">
                  <div className="col-6">
                    <h6 className="mb-0">{managerData.agents_count || Math.floor(Math.random() * 20) + 5}</h6>
                    <small className="text-muted">Agents</small>
                  </div>
                  <div className="col-6">
                    <h6 className="mb-0">{(Math.random() * 1.5 + 3.5).toFixed(1)}/5</h6>
                    <small className="text-muted">Rating</small>
                  </div>
                </div>

                <div className="mt-3">
                  <h6 className="mb-2">Sales Target Progress</h6>
                  <ProgressBar 
                    now={salesProgress} 
                    label={`${salesProgress.toFixed(0)}%`}
                    variant={salesProgress >= 80 ? "success" : salesProgress >= 60 ? "warning" : "danger"}
                  />
                  <small className="text-muted">{currentMonthSales} / {salesTarget} this month</small>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Manager Information */}
          <Col lg={8} className="mb-4">
            <Card>
              <Card.Header>
                <h5 className="mb-0">Manager Information</h5>
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
                        <p className="mb-0 fw-bold">{managerData.email}</p>
                      </div>
                    </div>
                    <div className="mb-3 d-flex align-items-center">
                      <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                        <Phone className="text-success" size={16} />
                      </div>
                      <div>
                        <small className="text-muted">Phone Number</small>
                        <p className="mb-0">{managerData.phone}</p>
                      </div>
                    </div>
                    <div className="mb-3 d-flex align-items-center">
                      <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                        <Users className="text-info" size={16} />
                      </div>
                      <div>
                        <small className="text-muted">Agents Managed</small>
                        <p className="mb-0">{managerData.agents_count || Math.floor(Math.random() * 20) + 5} agents</p>
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
                        <p className="mb-0">{new Date(managerData.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="mb-3 d-flex align-items-center">
                      <div className="bg-danger bg-opacity-10 p-2 rounded me-3">
                        <Activity className="text-danger" size={16} />
                      </div>
                      <div>
                        <small className="text-muted">Status</small>
                        <p className="mb-0">
                          <Badge bg={managerData.is_active ? "success" : "danger"}>
                            {managerData.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </p>
                      </div>
                    </div>
                    <div className="mb-3 d-flex align-items-center">
                      <div className="bg-secondary bg-opacity-10 p-2 rounded me-3">
                        <Target className="text-secondary" size={16} />
                      </div>
                      <div>
                        <small className="text-muted">Region</small>
                        <p className="mb-0">{managerData.region || "Central Region"}</p>
                      </div>
                    </div>
                  </Col>
                </Row>

                <hr />

                <Row>
                  <Col md={12}>
                    <h6 className="mb-3">Performance Overview</h6>
                    <Row>
                      <Col md={3}>
                        <div className="text-center p-3 border rounded">
                          <h5 className="text-primary mb-1">{managerData.agents_count || Math.floor(Math.random() * 20) + 5}</h5>
                          <small className="text-muted">Active Agents</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="text-center p-3 border rounded">
                          <h5 className="text-success mb-1">{currentMonthSales}</h5>
                          <small className="text-muted">This Month</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="text-center p-3 border rounded">
                          <h5 className="text-warning mb-1">{Math.floor(Math.random() * 300) + 200}</h5>
                          <small className="text-muted">All Time Sales</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="text-center p-3 border rounded">
                          <h5 className="text-info mb-1">{(Math.random() * 1.5 + 3.5).toFixed(1)}</h5>
                          <small className="text-muted">Team Rating</small>
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
                <Tabs defaultActiveKey="team" className="mb-3">
                  <Tab eventKey="team" title="Team Management">
                    <h6 className="mb-3">Managed Agents</h6>
                    <div className="table-responsive">
                      <Table striped>
                        <thead>
                          <tr>
                            <th>Agent ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th>Performance</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[1, 2, 3, 4, 5].map((item, index) => (
                            <tr key={index}>
                              <td>AGT-{1000 + index}</td>
                              <td>Agent {index + 1}</td>
                              <td>agent{index + 1}@company.com</td>
                              <td>+91 98765432{index}</td>
                              <td>
                                <Badge bg={index % 2 === 0 ? "success" : "warning"}>
                                  {index % 2 === 0 ? "Active" : "Busy"}
                                </Badge>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="progress me-2" style={{ width: "60px", height: "5px" }}>
                                    <div 
                                      className="progress-bar bg-success" 
                                      style={{width: `${Math.floor(Math.random() * 40) + 60}%`}}
                                    ></div>
                                  </div>
                                  <small>{Math.floor(Math.random() * 40) + 60}%</small>
                                </div>
                              </td>
                              <td>
                                <Link to={`/admin/agents/AGT-${1000 + index}`} className="btn btn-sm btn-outline-primary">
                                  View
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Tab>

                  <Tab eventKey="performance" title="Performance Analytics">
                    <Row>
                      <Col md={6}>
                        <h6 className="mb-3">Sales Performance</h6>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between">
                            <span>Monthly Target Achievement</span>
                            <span className="fw-bold text-success">{salesProgress.toFixed(0)}%</span>
                          </div>
                          <ProgressBar now={salesProgress} variant="success" className="mt-1" />
                        </div>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between">
                            <span>Team Performance</span>
                            <span className="fw-bold text-primary">85%</span>
                          </div>
                          <ProgressBar now={85} variant="primary" className="mt-1" />
                        </div>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between">
                            <span>Customer Satisfaction</span>
                            <span className="fw-bold text-warning">92%</span>
                          </div>
                          <ProgressBar now={92} variant="warning" className="mt-1" />
                        </div>
                      </Col>
                      <Col md={6}>
                        <h6 className="mb-3">Monthly Breakdown</h6>
                        <div className="d-flex justify-content-between mb-2">
                          <span>January</span>
                          <Badge bg="success">{Math.floor(Math.random() * 50) + 80}</Badge>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>February</span>
                          <Badge bg="primary">{Math.floor(Math.random() * 50) + 80}</Badge>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>March</span>
                          <Badge bg="success">{Math.floor(Math.random() * 50) + 80}</Badge>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>April</span>
                          <Badge bg="warning">{Math.floor(Math.random() * 50) + 80}</Badge>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>May (Current)</span>
                          <Badge bg="info">{currentMonthSales}</Badge>
                        </div>
                      </Col>
                    </Row>
                  </Tab>

                  <Tab eventKey="activity" title="Recent Activity">
                    <div className="timeline">
                      <div className="timeline-item">
                        <div className="timeline-marker bg-primary"></div>
                        <div className="timeline-content">
                          <h6 className="mb-1">Team Meeting Conducted</h6>
                          <p className="text-muted mb-1">Today, 2:30 PM</p>
                          <small className="text-muted">Monthly team performance review meeting</small>
                        </div>
                      </div>
                      <div className="timeline-item">
                        <div className="timeline-marker bg-success"></div>
                        <div className="timeline-content">
                          <h6 className="mb-1">New Agent Assigned</h6>
                          <p className="text-muted mb-1">Yesterday, 10:15 AM</p>
                          <small className="text-muted">Agent John Doe assigned to team</small>
                        </div>
                      </div>
                      <div className="timeline-item">
                        <div className="timeline-marker bg-info"></div>
                        <div className="timeline-content">
                          <h6 className="mb-1">Performance Target Updated</h6>
                          <p className="text-muted mb-1">2 days ago</p>
                          <small className="text-muted">Monthly sales target updated to {salesTarget} units</small>
                        </div>
                      </div>
                      <div className="timeline-item">
                        <div className="timeline-marker bg-warning"></div>
                        <div className="timeline-content">
                          <h6 className="mb-1">Training Session Completed</h6>
                          <p className="text-muted mb-1">1 week ago</p>
                          <small className="text-muted">Conducted sales training for new agents</small>
                        </div>
                      </div>
                    </div>
                  </Tab>

                  <Tab eventKey="reports" title="Reports">
                    <Row>
                      <Col md={6}>
                        <h6 className="mb-3">Generate Reports</h6>
                        <div className="d-grid gap-2">
                          <Button variant="outline-primary">
                            Team Performance Report
                          </Button>
                          <Button variant="outline-success">
                            Sales Summary Report
                          </Button>
                          <Button variant="outline-info">
                            Agent Activity Report
                          </Button>
                          <Button variant="outline-warning">
                            Monthly Target Report
                          </Button>
                        </div>
                      </Col>
                      <Col md={6}>
                        <h6 className="mb-3">Quick Stats</h6>
                        <Table size="sm" striped>
                          <tbody>
                            <tr>
                              <td>Total Sales This Month</td>
                              <td className="fw-bold text-success">{currentMonthSales}</td>
                            </tr>
                            <tr>
                              <td>Average Agent Performance</td>
                              <td className="fw-bold text-primary">85%</td>
                            </tr>
                            <tr>
                              <td>Team Satisfaction Score</td>
                              <td className="fw-bold text-warning">{(Math.random() * 1.5 + 3.5).toFixed(1)}/5</td>
                            </tr>
                            <tr>
                              <td>Active Agents</td>
                              <td className="fw-bold text-info">{managerData.agents_count || Math.floor(Math.random() * 20) + 5}</td>
                            </tr>
                          </tbody>
                        </Table>
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
            <Modal.Title>Edit Sales Manager</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={managerData.name}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      defaultValue={managerData.email}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={managerData.phone}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Region</Form.Label>
                    <Form.Select defaultValue={managerData.region || "central"}>
                      <option value="north">North</option>
                      <option value="south">South</option>
                      <option value="east">East</option>
                      <option value="west">West</option>
                      <option value="central">Central</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select defaultValue={managerData.is_active ? "active" : "inactive"}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Monthly Target</Form.Label>
                    <Form.Control
                      type="number"
                      defaultValue={salesTarget}
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
              notify.success("Sales manager updated successfully.");
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

export default SalesManagerDetailPage;
