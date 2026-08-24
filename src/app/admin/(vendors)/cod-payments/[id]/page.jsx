"use client"
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Row, Col, Badge, Button, Alert, Modal, Form, Tab, Tabs, Table } from "react-bootstrap";
import { ArrowLeft, DollarSign, User, Calendar, CheckCircle, XCircle, Clock, Edit3, Trash2, Package } from "feather-icons-react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { cod_payments } from "@/core/data/cod_payments.mock";
import Link from "@/components/Link";
import { Receipt } from "lucide-react";
import notify from "@/lib/toast";

const CODPaymentDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const MySwal = withReactContent(Swal);
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    // Find payment by ID
    const foundPayment = cod_payments.find(payment => payment.id === params.id);
    if (foundPayment) {
      setPaymentData(foundPayment);
    }
    setLoading(false);
  }, [params.id]);

  const handleDeletePayment = () => {
    MySwal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the payment record!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Yes, delete it!",
      cancelButtonColor: "#6c757d",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        notify.success("Payment record has been deleted.");
        router.push('/admin/cod-payments');
      }
    });
  };

  const handleUpdateStatus = (newStatus) => {
    MySwal.fire({
      title: `Update Status?`,
      text: `This will change the payment status to ${newStatus}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#28a745",
      confirmButtonText: `Yes, update!`,
      cancelButtonColor: "#6c757d",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setPaymentData({...paymentData, payment_status: newStatus});
        notify.success(`Payment status has been updated to ${newStatus}.`);
      }
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: "warning",
      paid: "success",
      failed: "danger",
      refunded: "info",
      cancelled: "secondary"
    };
    return statusMap[status] || "secondary";
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'paid': return CheckCircle;
      case 'failed': return XCircle;
      case 'pending': return Clock;
      default: return Clock;
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

  if (!paymentData) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Alert variant="danger" className="text-center">
            <Receipt size={48} className="mb-3" />
            <h4>Payment Not Found</h4>
            <p>The payment record you're looking for doesn't exist or has been removed.</p>
            <Link to="/cod-payments" className="btn btn-primary">
              <ArrowLeft size={16} className="me-2" />
              Back to COD Payments
            </Link>
          </Alert>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(paymentData.payment_status);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>COD Payment Details</h4>
              <h6>Payment ID: {paymentData.id}</h6>
            </div>
          </div>
          <div className="page-btn d-flex gap-2">
            <Link to="/cod-payments" className="btn btn-outline-secondary">
              <ArrowLeft size={16} className="me-2" />
              Back to Payments
            </Link>
            {paymentData.payment_status === 'pending' && (
              <>
                <Button variant="success" onClick={() => handleUpdateStatus('paid')}>
                  <CheckCircle size={16} className="me-2" />
                  Mark as Paid
                </Button>
                <Button variant="danger" onClick={() => handleUpdateStatus('failed')}>
                  <XCircle size={16} className="me-2" />
                  Mark as Failed
                </Button>
              </>
            )}
            <Button variant="primary" onClick={() => setShowEditModal(true)}>
              <Edit3 size={16} className="me-2" />
              Edit Payment
            </Button>
            <Button variant="danger" onClick={handleDeletePayment}>
              <Trash2 size={16} className="me-2" />
              Delete
            </Button>
          </div>
        </div>

        <Row>
          {/* Payment Status Cards */}
          <Col lg={3} md={6} className="mb-4">
            <Card className="bg-primary text-white">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">Amount</h6>
                    <h4 className="mb-0">₹{paymentData.amount}</h4>
                  </div>
                  <DollarSign size={36} className="opacity-75" />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className={`bg-${getStatusBadge(paymentData.payment_status)} text-white`}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">Status</h6>
                    <h4 className="mb-0">{paymentData.payment_status?.charAt(0).toUpperCase() + paymentData.payment_status?.slice(1)}</h4>
                  </div>
                  <StatusIcon size={36} className="opacity-75" />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="bg-info text-white">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">Package ID</h6>
                    <h4 className="mb-0">{paymentData.package_id}</h4>
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
                    <h6 className="mb-1">Payment Date</h6>
                    <h4 className="mb-0 small">{new Date(paymentData.payment_date).toLocaleDateString()}</h4>
                  </div>
                  <Calendar size={36} className="opacity-75" />
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Payment Information Card */}
          <Col lg={6} className="mb-4">
            <Card>
              <Card.Header>
                <h5 className="mb-0">Payment Information</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <span className="text-muted">Payment ID:</span>
                  <span className="fw-bold">{paymentData.id}</span>
                </div>
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <span className="text-muted">Package ID:</span>
                  <Link to={`/packages/${paymentData.package_id}`} className="text-primary text-decoration-none">
                    {paymentData.package_id}
                  </Link>
                </div>
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <span className="text-muted">Amount:</span>
                  <span className="fw-bold text-success">₹{paymentData.amount}</span>
                </div>
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <span className="text-muted">Status:</span>
                  <Badge bg={getStatusBadge(paymentData.payment_status)} className="fs-6">
                    <StatusIcon size={16} className="me-1" />
                    {paymentData.payment_status?.charAt(0).toUpperCase() + paymentData.payment_status?.slice(1)}
                  </Badge>
                </div>
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <span className="text-muted">Payment Method:</span>
                  <span className="fw-bold">Cash on Delivery</span>
                </div>
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <span className="text-muted">Payment Date:</span>
                  <span>{new Date(paymentData.payment_date).toLocaleDateString()}</span>
                </div>
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <span className="text-muted">Created:</span>
                  <span>{new Date(paymentData.created_at).toLocaleDateString()}</span>
                </div>
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <span className="text-muted">Last Updated:</span>
                  <span>{new Date(paymentData.updated_at).toLocaleDateString()}</span>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Customer Information Card */}
          <Col lg={6} className="mb-4">
            <Card>
              <Card.Header>
                <h5 className="mb-0">Customer Information</h5>
              </Card.Header>
              <Card.Body>
                <div className="text-center mb-3">
                  <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: "60px", height: "60px" }}>
                    <User size={30} className="text-primary" />
                  </div>
                  <h6 className="mb-0">{paymentData.customer_name || "Customer Name"}</h6>
                  <small className="text-muted">Customer ID: CUST-{Math.floor(Math.random() * 1000) + 100}</small>
                </div>

                <hr />

                <div className="mb-2">
                  <small className="text-muted">Phone Number:</small>
                  <p className="mb-1 fw-bold">{paymentData.customer_phone || "+91 9876543210"}</p>
                </div>
                <div className="mb-2">
                  <small className="text-muted">Email:</small>
                  <p className="mb-1">{paymentData.customer_email || "customer@email.com"}</p>
                </div>
                <div className="mb-2">
                  <small className="text-muted">Address:</small>
                  <p className="mb-1">123 Customer Street, City, State - 123456</p>
                </div>
                <div className="mb-2">
                  <small className="text-muted">Total Orders:</small>
                  <p className="mb-1">15 orders</p>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Detailed Tabs */}
          <Col lg={12}>
            <Card>
              <Card.Body>
                <Tabs defaultActiveKey="details" className="mb-3">
                  <Tab eventKey="details" title="Payment Details">
                    <Row>
                      <Col md={6}>
                        <h6 className="mb-3">Transaction Details</h6>
                        <Table striped bordered>
                          <tbody>
                            <tr>
                              <td className="fw-bold">Transaction ID</td>
                              <td>TXN-{Math.floor(Math.random() * 1000000) + 100000}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Payment Method</td>
                              <td>Cash on Delivery (COD)</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Amount</td>
                              <td className="text-success">₹{paymentData.amount}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Processing Fee</td>
                              <td>₹0.00</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Total Amount</td>
                              <td className="fw-bold text-success">₹{paymentData.amount}</td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                      <Col md={6}>
                        <h6 className="mb-3">Payment Timeline</h6>
                        <div className="timeline">
                          <div className="timeline-item">
                            <div className="timeline-marker bg-primary"></div>
                            <div className="timeline-content">
                              <h6 className="mb-1">Payment Created</h6>
                              <p className="text-muted mb-1">{new Date(paymentData.created_at).toLocaleString()}</p>
                              <small className="text-muted">COD payment request created</small>
                            </div>
                          </div>
                          {paymentData.payment_status === 'paid' && (
                            <div className="timeline-item">
                              <div className="timeline-marker bg-success"></div>
                              <div className="timeline-content">
                                <h6 className="mb-1">Payment Received</h6>
                                <p className="text-muted mb-1">{new Date(paymentData.payment_date).toLocaleString()}</p>
                                <small className="text-muted">Cash payment collected successfully</small>
                              </div>
                            </div>
                          )}
                          {paymentData.updated_at !== paymentData.created_at && (
                            <div className="timeline-item">
                              <div className="timeline-marker bg-info"></div>
                              <div className="timeline-content">
                                <h6 className="mb-1">Status Updated</h6>
                                <p className="text-muted mb-1">{new Date(paymentData.updated_at).toLocaleString()}</p>
                                <small className="text-muted">Payment status updated</small>
                              </div>
                            </div>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Tab>

                  <Tab eventKey="package" title="Package Details">
                    <Card className="border-0 bg-light">
                      <Card.Body>
                        <Row>
                          <Col md={6}>
                            <h6 className="mb-3">Package Information</h6>
                            <div className="mb-3 d-flex align-items-center">
                              <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                                <Package className="text-primary" size={16} />
                              </div>
                              <div>
                                <small className="text-muted">Package ID</small>
                                <p className="mb-0 fw-bold">{paymentData.package_id}</p>
                              </div>
                            </div>
                            <div className="mb-3 d-flex align-items-center">
                              <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                                <DollarSign className="text-success" size={16} />
                              </div>
                              <div>
                                <small className="text-muted">Package Value</small>
                                <p className="mb-0">₹{paymentData.amount}</p>
                              </div>
                            </div>
                          </Col>
                          <Col md={6}>
                            <h6 className="mb-3">Delivery Status</h6>
                            <div className="mb-2">
                              <div className="d-flex justify-content-between">
                                <span>Order Placed</span>
                                <CheckCircle className="text-success" size={16} />
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="d-flex justify-content-between">
                                <span>Package Shipped</span>
                                <CheckCircle className="text-success" size={16} />
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="d-flex justify-content-between">
                                <span>Out for Delivery</span>
                                <CheckCircle className="text-success" size={16} />
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="d-flex justify-content-between">
                                <span>Delivered & Payment Collected</span>
                                {paymentData.payment_status === 'paid' ? 
                                  <CheckCircle className="text-success" size={16} /> : 
                                  <Clock className="text-warning" size={16} />
                                }
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Tab>

                  <Tab eventKey="history" title="History">
                    <div className="table-responsive">
                      <Table striped>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Action</th>
                            <th>User</th>
                            <th>Details</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{new Date(paymentData.created_at).toLocaleDateString()}</td>
                            <td>Payment Created</td>
                            <td>System</td>
                            <td>COD payment request initiated</td>
                            <td><Badge bg="primary">Created</Badge></td>
                          </tr>
                          {paymentData.payment_status === 'paid' && (
                            <tr>
                              <td>{new Date(paymentData.payment_date).toLocaleDateString()}</td>
                              <td>Payment Collected</td>
                              <td>Rider-{Math.floor(Math.random() * 100) + 1}</td>
                              <td>Cash payment collected from customer</td>
                              <td><Badge bg="success">Paid</Badge></td>
                            </tr>
                          )}
                          <tr>
                            <td>{new Date(paymentData.updated_at).toLocaleDateString()}</td>
                            <td>Status Updated</td>
                            <td>Admin</td>
                            <td>Payment status updated to {paymentData.payment_status}</td>
                            <td><Badge bg={getStatusBadge(paymentData.payment_status)}>Updated</Badge></td>
                          </tr>
                        </tbody>
                      </Table>
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
            <Modal.Title>Edit COD Payment</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Package ID</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={paymentData.package_id}
                      readOnly
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Amount</Form.Label>
                    <Form.Control
                      type="number"
                      defaultValue={paymentData.amount}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Payment Status</Form.Label>
                    <Form.Select defaultValue={paymentData.payment_status}>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                      <option value="cancelled">Cancelled</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Payment Date</Form.Label>
                    <Form.Control
                      type="date"
                      defaultValue={paymentData.payment_date ? paymentData.payment_date.split('T')[0] : ''}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Add any notes about this payment..."
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
              notify.success("Payment updated successfully.");
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

export default CODPaymentDetailPage;
