"use client"
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Row, Col, Badge, Button, Alert, Modal, Form, Table, Tab, Tabs } from "react-bootstrap";
import { ArrowLeft, User, Mail, Phone, Calendar, Award, Package, DollarSign, Edit3, Trash2, TrendingUp } from "feather-icons-react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { sales_agents } from "@/core/data/sales_agents.mock";
import { packages } from "@/core/data/packages.mock";
import Link from "@/components/Link";
import Chart from "@/components/ClientChart";
import notify from "@/lib/toast";

const AgentDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const MySwal = withReactContent(Swal);
  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [agentPackages, setAgentPackages] = useState([]);
  const [agentStats, setAgentStats] = useState({
    totalPackages: 0,
    deliveredPackages: 0,
    totalRevenue: 0,
    successRate: 0
  });

  const [performanceChart] = useState({
    series: [{
      name: 'Packages Handled',
      data: [31, 40, 28, 51, 42, 82, 56]
    }],
    options: {
      chart: {
        type: 'area',
        height: 350,
        toolbar: { show: false }
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth' },
      xaxis: {
        type: 'datetime',
        categories: [
          "2025-01-01T00:00:00.000Z",
          "2025-01-02T00:00:00.000Z", 
          "2025-01-03T00:00:00.000Z",
          "2025-01-04T00:00:00.000Z",
          "2025-01-05T00:00:00.000Z",
          "2025-01-06T00:00:00.000Z",
          "2025-01-07T00:00:00.000Z"
        ]
      },
      colors: ["#28a745"],
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.3,
          opacityTo: 0.9,
          stops: [0, 90, 100]
        }
      }
    }
  });

  useEffect(() => {
    // Find agent by ID
    const foundAgent = sales_agents.find(agent => agent.id === params.id);
    if (foundAgent) {
      setAgentData(foundAgent);
      
      // Get packages created by this agent
      const relatedPackages = packages.filter(pkg => 
        pkg.created_by_sales_agent === foundAgent.id
      );
      setAgentPackages(relatedPackages);
      
      // Calculate stats
      const totalPackages = relatedPackages.length;
      const deliveredPackages = relatedPackages.filter(pkg => pkg.status === "Delivered").length;
      const totalRevenue = relatedPackages.reduce((sum, pkg) => sum + pkg.delivery_cost, 0);
      const successRate = totalPackages > 0 ? (deliveredPackages / totalPackages) * 100 : 0;
      
      setAgentStats({
        totalPackages,
        deliveredPackages,
        totalRevenue,
        successRate
      });
    }
    setLoading(false);
  }, [params.id]);

  const handleDeleteAgent = () => {
    MySwal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the agent!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Yes, delete it!",
      cancelButtonColor: "#6c757d",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        notify.success("Agent has been deleted.");
        router.push('/admin/agents');
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

  if (!agentData) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Alert variant="danger" className="text-center">
            <User size={48} className="mb-3" />
            <h4>Agent Not Found</h4>
            <p>The agent you're looking for doesn't exist or has been removed.</p>
            <Link to="/admin/agents" className="btn btn-primary">
              <ArrowLeft size={16} className="me-2" />
              Back to Agents
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
              <h4>Agent Details</h4>
              <h6>{agentData.full_name}</h6>
            </div>
          </div>
          <div className="page-btn d-flex gap-2">
            <Link to="/admin/agents" className="btn btn-outline-secondary">
              <ArrowLeft size={16} className="me-2" />
              Back to Agents
            </Link>
            <Button variant="primary" onClick={() => setShowEditModal(true)}>
              <Edit3 size={16} className="me-2" />
              Edit Agent
            </Button>
            <Button variant="danger" onClick={handleDeleteAgent}>
              <Trash2 size={16} className="me-2" />
              Delete
            </Button>
          </div>
        </div>

        <Row>
          {/* Agent Profile Card */}
          <Col lg={4} className="mb-4">
            <Card className="text-center">
              <Card.Body>
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "80px", height: "80px" }}>
                  <User size={40} className="text-primary" />
                </div>
                <h4 className="mb-1">{agentData.full_name}</h4>
                <p className="text-muted mb-3">Sales Agent</p>
                
                <div className="d-flex justify-content-center mb-3">
                  <Badge bg="success" className="me-2">Active</Badge>
                  <Badge bg="info">Verified</Badge>
                </div>
                
                <hr />
                
                <div className="row text-center">
                  <div className="col-4">
                    <h5 className="mb-0">{agentStats.totalPackages}</h5>
                    <small className="text-muted">Packages</small>
                  </div>
                  <div className="col-4">
                    <h5 className="mb-0">{agentStats.successRate.toFixed(1)}%</h5>
                    <small className="text-muted">Success Rate</small>
                  </div>
                  <div className="col-4">
                    <h5 className="mb-0">KSh {agentStats.totalRevenue.toLocaleString()}</h5>
                    <small className="text-muted">Revenue</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Agent Information */}
          <Col lg={8} className="mb-4">
            <Card>
              <Card.Header>
                <h5 className="mb-0">Agent Information</h5>
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
                        <p className="mb-0 fw-bold">{agentData.email}</p>
                      </div>
                    </div>
                    <div className="mb-3 d-flex align-items-center">
                      <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                        <Phone className="text-success" size={16} />
                      </div>
                      <div>
                        <small className="text-muted">Phone Number</small>
                        <p className="mb-0">{agentData.phone}</p>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3 d-flex align-items-center">
                      <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                        <Calendar className="text-info" size={16} />
                      </div>
                      <div>
                        <small className="text-muted">Join Date</small>
                        <p className="mb-0">{new Date(agentData.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="mb-3 d-flex align-items-center">
                      <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                        <Award className="text-warning" size={16} />
                      </div>
                      <div>
                        <small className="text-muted">Agent ID</small>
                        <p className="mb-0"><code>{agentData.id.split('-')[0]}</code></p>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* Performance Stats */}
          <Col lg={12} className="mb-4">
            <Row>
              <Col md={3}>
                <Card className="text-center border-0 shadow-sm">
                  <Card.Body>
                    <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: "50px", height: "50px" }}>
                      <Package size={24} className="text-primary" />
                    </div>
                    <h4 className="mb-0">{agentStats.totalPackages}</h4>
                    <small className="text-muted">Total Packages</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center border-0 shadow-sm">
                  <Card.Body>
                    <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: "50px", height: "50px" }}>
                      <TrendingUp size={24} className="text-success" />
                    </div>
                    <h4 className="mb-0">{agentStats.deliveredPackages}</h4>
                    <small className="text-muted">Delivered</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center border-0 shadow-sm">
                  <Card.Body>
                    <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: "50px", height: "50px" }}>
                      <Award size={24} className="text-info" />
                    </div>
                    <h4 className="mb-0">{agentStats.successRate.toFixed(1)}%</h4>
                    <small className="text-muted">Success Rate</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center border-0 shadow-sm">
                  <Card.Body>
                    <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: "50px", height: "50px" }}>
                      <DollarSign size={24} className="text-warning" />
                    </div>
                    <h4 className="mb-0">KSh {agentStats.totalRevenue.toLocaleString()}</h4>
                    <small className="text-muted">Revenue Generated</small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>

          {/* Tabs for detailed information */}
          <Col lg={12}>
            <Card>
              <Card.Body>
                <Tabs defaultActiveKey="performance" className="mb-3">
                  <Tab eventKey="performance" title="Performance">
                    <Card className="border-0">
                      <Card.Header>
                        <h6 className="mb-0">7-Day Performance Trend</h6>
                      </Card.Header>
                      <Card.Body>
                        <Chart
                          options={performanceChart.options}
                          series={performanceChart.series}
                          type="area"
                          height={350}
                        />
                      </Card.Body>
                    </Card>
                  </Tab>
                  
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
                          {agentPackages.slice(0, 10).map((pkg, index) => (
                            <tr key={index}>
                              <td><code>{pkg.tracking_code}</code></td>
                              <td>{pkg.recipient_name}</td>
                              <td>
                                <Badge bg={pkg.status === "Delivered" ? "success" : pkg.status === "Created" ? "info" : "warning"}>
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
                      {agentPackages.length === 0 && (
                        <div className="text-center py-4">
                          <Package size={48} className="text-muted mb-3" />
                          <p className="text-muted">No packages found for this agent.</p>
                        </div>
                      )}
                    </div>
                  </Tab>
                  
                  <Tab eventKey="activity" title="Recent Activity">
                    <div className="timeline">
                      <div className="timeline-item">
                        <div className="timeline-marker bg-primary"></div>
                        <div className="timeline-content">
                          <h6 className="mb-1">Agent Registered</h6>
                          <p className="text-muted mb-1">{new Date(agentData.created_at).toLocaleString()}</p>
                          <small className="text-muted">Agent was added to the system</small>
                        </div>
                      </div>
                      {agentPackages.slice(0, 5).map((pkg, index) => (
                        <div key={index} className="timeline-item">
                          <div className="timeline-marker bg-success"></div>
                          <div className="timeline-content">
                            <h6 className="mb-1">Package Created</h6>
                            <p className="text-muted mb-1">{new Date(pkg.created_at).toLocaleString()}</p>
                            <small className="text-muted">Created package {pkg.tracking_code}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Edit Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Edit Agent</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={agentData.full_name}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      defaultValue={agentData.email}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={agentData.phone}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select defaultValue="active">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </Form.Select>
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
              notify.success("Agent updated successfully.");
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

export default AgentDetailPage;
