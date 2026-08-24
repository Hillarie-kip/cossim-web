"use client"
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Row, Col, Badge, Button, Alert, Modal, Form, Tab, Tabs } from "react-bootstrap";
import { ArrowLeft, MessageSquare, User, Phone, Calendar, CheckCircle, XCircle, Clock, Edit3, Trash2, Send, AlertCircle } from "feather-icons-react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import Link from "@/components/Link";
import { smsAuditLogsMock } from "@/core/data/sms_audit_logs.mock";
import notify from "@/lib/toast";

const SMSDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const MySwal = withReactContent(Swal);
  const [smsData, setSmsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    // Find SMS by ID
    const foundSMS = smsAuditLogsMock.find(sms => sms.id === params.id);
    if (foundSMS) {
      setSmsData(foundSMS);
    }
    setLoading(false);
  }, [params.id]);

  const handleDeleteSMS = () => {
    MySwal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the SMS log!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Yes, delete it!",
      cancelButtonColor: "#6c757d",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        notify.success("SMS log has been deleted.");
        router.push('/admin/sms');
      }
    });
  };

  const handleResendSMS = () => {
    MySwal.fire({
      title: "Resend SMS?",
      text: "This will resend the SMS to the recipient.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#28a745",
      confirmButtonText: "Yes, resend!",
      cancelButtonColor: "#6c757d",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        notify.success("SMS has been resent successfully.");
      }
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      sent: "success",
      failed: "danger",
      pending: "warning",
      delivered: "primary"
    };
    return statusMap[status] || "secondary";
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'sent': return Send;
      case 'delivered': return CheckCircle;
      case 'failed': return XCircle;
      case 'pending': return Clock;
      default: return AlertCircle;
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

  if (!smsData) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Alert variant="danger" className="text-center">
            <MessageSquare size={48} className="mb-3" />
            <h4>SMS Log Not Found</h4>
            <p>The SMS log you're looking for doesn't exist or has been removed.</p>
            <Link to="/sms" className="btn btn-primary">
              <ArrowLeft size={16} className="me-2" />
              Back to SMS Logs
            </Link>
          </Alert>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(smsData.status);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>SMS Details</h4>
              <h6>Message ID: {smsData.id}</h6>
            </div>
          </div>
          <div className="page-btn d-flex gap-2">
            <Link to="/sms" className="btn btn-outline-secondary">
              <ArrowLeft size={16} className="me-2" />
              Back to SMS Logs
            </Link>
            {(smsData.status === 'failed' || smsData.status === 'pending') && (
              <Button variant="success" onClick={handleResendSMS}>
                <Send size={16} className="me-2" />
                Resend SMS
              </Button>
            )}
            <Button variant="primary" onClick={() => setShowEditModal(true)}>
              <Edit3 size={16} className="me-2" />
              Edit SMS
            </Button>
            <Button variant="danger" onClick={handleDeleteSMS}>
              <Trash2 size={16} className="me-2" />
              Delete
            </Button>
          </div>
        </div>

        <Row>
          {/* SMS Status Card */}
          <Col lg={12} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className={`bg-${getStatusBadge(smsData.status)} bg-opacity-10 p-3 rounded me-3`}>
                      <StatusIcon className={`text-${getStatusBadge(smsData.status)}`} size={24} />
                    </div>
                    <div>
                      <h5 className="mb-1">SMS Status</h5>
                      <div className="d-flex gap-2">
                        <Badge bg={getStatusBadge(smsData.status)} className="fs-6">
                          <StatusIcon size={16} className="me-1" />
                          {smsData.status.charAt(0).toUpperCase() + smsData.status.slice(1)}
                        </Badge>
                        <Badge bg="info" className="fs-6">
                          {smsData.sms_type || "Notification"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <h6 className="text-muted mb-1">Sent Date</h6>
                    <h6 className="mb-0">{new Date(smsData.sent_at).toLocaleDateString()}</h6>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* SMS Content Card */}
          <Col lg={8} className="mb-4">
            <Card>
              <Card.Header>
                <h5 className="mb-0">SMS Content</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-4">
                  <div className="bg-light p-4 rounded border-start border-primary border-3">
                    <div className="d-flex justify-content-between mb-2">
                      <small className="text-muted">Message Content:</small>
                      <Badge bg="secondary">{smsData.content ? smsData.content.length : 0} characters</Badge>
                    </div>
                    <p className="mb-0 fs-5 text-dark">
                      {smsData.content || "Your package #PKG001 has been dispatched and will be delivered today between 2-6 PM. Track: bit.ly/track123"}
                    </p>
                  </div>
                </div>

                <Row>
                  <Col md={6}>
                    <div className="mb-3 d-flex align-items-center">
                      <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                        <Phone className="text-primary" size={16} />
                      </div>
                      <div>
                        <small className="text-muted">Recipient Number</small>
                        <p className="mb-0 fw-bold">{smsData.phone_number}</p>
                      </div>
                    </div>
                    <div className="mb-3 d-flex align-items-center">
                      <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                        <MessageSquare className="text-success" size={16} />
                      </div>
                      <div>
                        <small className="text-muted">SMS Type</small>
                        <p className="mb-0">{smsData.sms_type || "Delivery Notification"}</p>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3 d-flex align-items-center">
                      <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                        <Calendar className="text-info" size={16} />
                      </div>
                      <div>
                        <small className="text-muted">Sent Date</small>
                        <p className="mb-0">{new Date(smsData.sent_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="mb-3 d-flex align-items-center">
                      <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                        <Clock className="text-warning" size={16} />
                      </div>
                      <div>
                        <small className="text-muted">Sent Time</small>
                        <p className="mb-0">{new Date(smsData.sent_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </Col>
                </Row>

                <hr />

                <Row>
                  <Col md={12}>
                    <h6 className="mb-3">Delivery Information</h6>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <Badge bg={getStatusBadge(smsData.status)} className="p-2">
                        <StatusIcon size={16} className="me-1" />
                        Status: {smsData.status.charAt(0).toUpperCase() + smsData.status.slice(1)}
                      </Badge>
                      {smsData.status === 'delivered' && (
                        <Badge bg="success" className="p-2">
                          <CheckCircle size={16} className="me-1" />
                          Delivered Successfully
                        </Badge>
                      )}
                      {smsData.status === 'failed' && (
                        <Badge bg="danger" className="p-2">
                          <XCircle size={16} className="me-1" />
                          Delivery Failed
                        </Badge>
                      )}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* Recipient Information */}
          <Col lg={4} className="mb-4">
            <Card>
              <Card.Header>
                <h5 className="mb-0">Recipient Information</h5>
              </Card.Header>
              <Card.Body>
                <div className="text-center mb-3">
                  <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: "60px", height: "60px" }}>
                    <User size={30} className="text-primary" />
                  </div>
                  <h6 className="mb-0">{smsData.recipient_name || "Customer Name"}</h6>
                  <small className="text-muted">Customer</small>
                </div>

                <hr />

                <div className="mb-2">
                  <small className="text-muted">Phone Number:</small>
                  <p className="mb-1 fw-bold">{smsData.phone_number}</p>
                </div>
                <div className="mb-2">
                  <small className="text-muted">SMS Type:</small>
                  <p className="mb-1">{smsData.sms_type || "Delivery Notification"}</p>
                </div>
                <div className="mb-2">
                  <small className="text-muted">Package Reference:</small>
                  <p className="mb-1">
                    <Link to={`/packages/${smsData.package_id || 'PKG001'}`} className="text-primary text-decoration-none">
                      {smsData.package_id || 'PKG001'}
                    </Link>
                  </p>
                </div>
                <div className="mb-2">
                  <small className="text-muted">Message Length:</small>
                  <p className="mb-1">{smsData.content ? smsData.content.length : 160} characters</p>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Detailed Tabs */}
          <Col lg={12}>
            <Card>
              <Card.Body>
                <Tabs defaultActiveKey="details" className="mb-3">
                  <Tab eventKey="details" title="Message Details">
                    <Row>
                      <Col md={6}>
                        <h6 className="mb-3">Technical Details</h6>
                        <div className="table-responsive">
                          <table className="table table-sm">
                            <tbody>
                              <tr>
                                <td className="fw-bold">Message ID</td>
                                <td>{smsData.id}</td>
                              </tr>
                              <tr>
                                <td className="fw-bold">SMS Gateway</td>
                                <td>Twilio / AWS SNS</td>
                              </tr>
                              <tr>
                                <td className="fw-bold">Message Type</td>
                                <td>{smsData.sms_type || "Transactional"}</td>
                              </tr>
                              <tr>
                                <td className="fw-bold">Character Count</td>
                                <td>{smsData.content ? smsData.content.length : 160} / 160</td>
                              </tr>
                              <tr>
                                <td className="fw-bold">SMS Parts</td>
                                <td>{smsData.content && smsData.content.length > 160 ? Math.ceil(smsData.content.length / 160) : 1}</td>
                              </tr>
                              <tr>
                                <td className="fw-bold">Cost</td>
                                <td>₹0.50</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </Col>
                      <Col md={6}>
                        <h6 className="mb-3">Delivery Timeline</h6>
                        <div className="timeline">
                          <div className="timeline-item">
                            <div className="timeline-marker bg-primary"></div>
                            <div className="timeline-content">
                              <h6 className="mb-1">SMS Created</h6>
                              <p className="text-muted mb-1">{new Date(smsData.created_at).toLocaleString()}</p>
                              <small className="text-muted">SMS request generated by system</small>
                            </div>
                          </div>
                          <div className="timeline-item">
                            <div className="timeline-marker bg-info"></div>
                            <div className="timeline-content">
                              <h6 className="mb-1">SMS Sent</h6>
                              <p className="text-muted mb-1">{new Date(smsData.sent_at).toLocaleString()}</p>
                              <small className="text-muted">Message sent to SMS gateway</small>
                            </div>
                          </div>
                          {smsData.status === 'delivered' && (
                            <div className="timeline-item">
                              <div className="timeline-marker bg-success"></div>
                              <div className="timeline-content">
                                <h6 className="mb-1">SMS Delivered</h6>
                                <p className="text-muted mb-1">{new Date(smsData.updated_at).toLocaleString()}</p>
                                <small className="text-muted">Message delivered successfully</small>
                              </div>
                            </div>
                          )}
                          {smsData.status === 'failed' && (
                            <div className="timeline-item">
                              <div className="timeline-marker bg-danger"></div>
                              <div className="timeline-content">
                                <h6 className="mb-1">Delivery Failed</h6>
                                <p className="text-muted mb-1">{new Date(smsData.updated_at).toLocaleString()}</p>
                                <small className="text-muted">Message delivery failed - Invalid number or network error</small>
                              </div>
                            </div>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Tab>

                  <Tab eventKey="analytics" title="Analytics">
                    <Row>
                      <Col md={6}>
                        <h6 className="mb-3">Delivery Metrics</h6>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between">
                            <span>Delivery Rate</span>
                            <span className="fw-bold text-success">95%</span>
                          </div>
                          <div className="progress mt-1">
                            <div className="progress-bar bg-success" style={{width: "95%"}}></div>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between">
                            <span>Average Delivery Time</span>
                            <span className="fw-bold text-primary">2.3 seconds</span>
                          </div>
                          <div className="progress mt-1">
                            <div className="progress-bar bg-primary" style={{width: "85%"}}></div>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between">
                            <span>Customer Response Rate</span>
                            <span className="fw-bold text-warning">12%</span>
                          </div>
                          <div className="progress mt-1">
                            <div className="progress-bar bg-warning" style={{width: "12%"}}></div>
                          </div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <h6 className="mb-3">SMS Statistics</h6>
                        <div className="row text-center">
                          <div className="col-6">
                            <Card className="bg-light border-0 mb-3">
                              <Card.Body>
                                <h5 className="text-primary mb-0">2,450</h5>
                                <small className="text-muted">Total SMS Sent</small>
                              </Card.Body>
                            </Card>
                          </div>
                          <div className="col-6">
                            <Card className="bg-light border-0 mb-3">
                              <Card.Body>
                                <h5 className="text-success mb-0">2,328</h5>
                                <small className="text-muted">Delivered</small>
                              </Card.Body>
                            </Card>
                          </div>
                          <div className="col-6">
                            <Card className="bg-light border-0 mb-3">
                              <Card.Body>
                                <h5 className="text-danger mb-0">122</h5>
                                <small className="text-muted">Failed</small>
                              </Card.Body>
                            </Card>
                          </div>
                          <div className="col-6">
                            <Card className="bg-light border-0 mb-3">
                              <Card.Body>
                                <h5 className="text-warning mb-0">294</h5>
                                <small className="text-muted">Responses</small>
                              </Card.Body>
                            </Card>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Tab>

                  <Tab eventKey="similar" title="Related Messages">
                    <h6 className="mb-3">Messages to Same Number</h6>
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Content Preview</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[1, 2, 3].map((item, index) => (
                            <tr key={index}>
                              <td>{new Date(Date.now() - index * 86400000).toLocaleDateString()}</td>
                              <td>
                                <Badge bg="info">
                                  {index === 0 ? "Delivery" : index === 1 ? "Confirmation" : "Notification"}
                                </Badge>
                              </td>
                              <td>
                                <small className="text-muted">
                                  {index === 0 ? "Your package has been..." : 
                                   index === 1 ? "Order confirmed for..." : 
                                   "Thank you for your..."}
                                </small>
                              </td>
                              <td>
                                <Badge bg={index % 2 === 0 ? "success" : "warning"}>
                                  {index % 2 === 0 ? "Delivered" : "Pending"}
                                </Badge>
                              </td>
                              <td>
                                <Button size="sm" variant="outline-primary">View</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
            <Modal.Title>Edit SMS</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Recipient Phone</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={smsData.phone_number}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>SMS Type</Form.Label>
                    <Form.Select defaultValue={smsData.sms_type || "notification"}>
                      <option value="notification">Notification</option>
                      <option value="delivery">Delivery Update</option>
                      <option value="confirmation">Confirmation</option>
                      <option value="promotional">Promotional</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Message Content</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      defaultValue={smsData.content || "Your package #PKG001 has been dispatched and will be delivered today between 2-6 PM. Track: bit.ly/track123"}
                      maxLength={160}
                    />
                    <Form.Text className="text-muted">
                      Maximum 160 characters for a single SMS
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select defaultValue={smsData.status}>
                      <option value="pending">Pending</option>
                      <option value="sent">Sent</option>
                      <option value="delivered">Delivered</option>
                      <option value="failed">Failed</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Package Reference</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={smsData.package_id || ""}
                      placeholder="PKG001"
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
              notify.success("SMS updated successfully.");
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

export default SMSDetailPage;
