"use client"
import React, { useState, useEffect } from "react";
import { Card, Row, Col, Badge, Button, Table, Form, Alert } from "react-bootstrap";
import { 
  DollarSign, 
  TrendingUp,
  Download, 
  CreditCard,
  Truck,
  Package,
  Clock
} from "feather-icons-react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { BarChart3 } from "lucide-react";
import notify from "@/lib/toast";

const RiderEarnings = () => {
  const MySwal = withReactContent(Swal);
  const [selectedPeriod, setSelectedPeriod] = useState("this_month");
  const [earningsData, setEarningsData] = useState({
    totalEarnings: 0,
    codCollections: 0,
    deliveryFees: 0,
    bonuses: 0,
    pendingPayment: 0,
    lastPayment: null
  });

  const [earningsHistory, setEarningsHistory] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);

  useEffect(() => {
    // Mock data - in real app this would come from API
    setEarningsData({
      totalEarnings: 0,
      codCollections: 0, 
      deliveryFees: 0,
      bonuses: 0,
      pendingPayment: 0,
      lastPayment: null
    });

    setEarningsHistory([]);
    setPaymentHistory([]);
  }, [selectedPeriod]);

  const requestPayment = () => {
    if (earningsData.pendingPayment === 0) {
      notify.error("You don't have any pending earnings to request payment for.");
      return;
    }

    MySwal.fire({
      title: "Request Payment?",
      text: `Request payment for KES ${earningsData.pendingPayment.toLocaleString()}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#28a745",
      confirmButtonText: "Yes, request payment!",
      cancelButtonColor: "#6c757d",
      cancelButtonText: "Cancel"
    }).then((result) => {
      if (result.isConfirmed) {
        notify.success("Your payment request has been submitted. You'll receive payment within 1-2 business days.");
      }
    });
  };

  const downloadStatement = () => {
    notify.success("Your earnings statement will be downloaded shortly.");
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>My Earnings</h4>
              <h6>Track your delivery earnings and payments</h6>
            </div>
          </div>
          <div className="page-btn d-flex gap-2">
            <Button variant="outline-primary" onClick={downloadStatement}>
              <Download size={16} className="me-2" />
              Download Statement
            </Button>
            <Button variant="success" onClick={requestPayment}>
              <CreditCard size={16} className="me-2" />
              Request Payment
            </Button>
          </div>
        </div>

        {/* Period Selection */}
        <Row className="mb-4">
          <Col lg={12}>
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Earnings Period</h6>
                  <Form.Select 
                    value={selectedPeriod} 
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    style={{ width: "200px" }}
                  >
                    <option value="today">Today</option>
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="custom">Custom Range</option>
                  </Form.Select>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Earnings Summary Cards */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-4">
            <Card className="bg-success text-white">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1 text-white">Total Earnings</h6>
                    <h4 className="mb-0 text-white">KES {earningsData.totalEarnings.toLocaleString()}</h4>
                  </div>
                  <DollarSign size={36} className="opacity-75" />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="bg-primary text-white">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1 text-white">COD Collections</h6>
                    <h4 className="mb-0 text-white">KES {earningsData.codCollections.toLocaleString()}</h4>
                  </div>
                  <CreditCard size={36} className="opacity-75" />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="bg-info text-white">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1 text-white">Delivery Fees</h6>
                    <h4 className="mb-0 text-white">KES {earningsData.deliveryFees.toLocaleString()}</h4>
                  </div>
                  <Truck size={36} className="opacity-75" />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="bg-warning text-white">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1 text-white">Bonuses</h6>
                    <h4 className="mb-0 text-white">KES {earningsData.bonuses.toLocaleString()}</h4>
                  </div>
                  <TrendingUp size={36} className="opacity-75" />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* Earnings Breakdown */}
          <Col lg={8} className="mb-4">
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  <BarChart3 size={20} className="me-2" />
                  Earnings Breakdown
                </h5>
              </Card.Header>
              <Card.Body>
                {earningsHistory.length === 0 ? (
                  <div className="text-center py-5">
                    <DollarSign size={48} className="text-muted mb-3" />
                    <h6 className="text-muted">No earnings data available</h6>
                    <p className="text-muted">Complete some deliveries to start earning!</p>
                  </div>
                ) : (
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Deliveries</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {earningsHistory.map((earning, index) => (
                        <tr key={index}>
                          <td>{earning.date}</td>
                          <td>
                            <Badge bg="primary">{earning.type}</Badge>
                          </td>
                          <td>{earning.deliveries}</td>
                          <td>KES {earning.amount.toLocaleString()}</td>
                          <td>
                            <Badge bg={earning.status === "paid" ? "success" : "warning"}>
                              {earning.status.toUpperCase()}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Payment Info */}
          <Col lg={4} className="mb-4">
            <Card>
              <Card.Header>
                <h5 className="mb-0">Payment Information</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>Pending Payment:</span>
                    <strong className="text-success">KES {earningsData.pendingPayment.toLocaleString()}</strong>
                  </div>
                  
                  {earningsData.lastPayment ? (
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span>Last Payment:</span>
                      <div className="text-end">
                        <div>KES {earningsData.lastPayment.amount.toLocaleString()}</div>
                        <small className="text-muted">{earningsData.lastPayment.date}</small>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <Clock size={24} className="text-muted mb-2" />
                      <small className="text-muted">No payment history yet</small>
                    </div>
                  )}
                </div>

                <Alert variant="info">
                  <strong>Payment Schedule:</strong><br />
                  Payments are processed weekly on Fridays. Minimum payout is KES 500.
                </Alert>

                <div className="d-grid">
                  <Button 
                    variant="success" 
                    onClick={requestPayment}
                    disabled={earningsData.pendingPayment === 0}
                  >
                    <CreditCard size={16} className="me-2" />
                    Request Payment
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Performance Tips */}
            <Card className="mt-3">
              <Card.Header>
                <h6 className="mb-0">Earning Tips</h6>
              </Card.Header>
              <Card.Body>
                <div className="earning-tips">
                  <div className="d-flex align-items-start mb-3">
                    <Package size={16} className="text-primary me-2 mt-1 flex-shrink-0" />
                    <small>Complete more deliveries to earn higher daily bonuses</small>
                  </div>
                  <div className="d-flex align-items-start mb-3">
                    <Clock size={16} className="text-success me-2 mt-1 flex-shrink-0" />
                    <small>On-time deliveries earn performance bonuses</small>
                  </div>
                  <div className="d-flex align-items-start mb-3">
                    <TrendingUp size={16} className="text-warning me-2 mt-1 flex-shrink-0" />
                    <small>High customer ratings unlock tier bonuses</small>
                  </div>
                  <div className="d-flex align-items-start">
                    <CreditCard size={16} className="text-info me-2 mt-1 flex-shrink-0" />
                    <small>COD collections earn additional commission</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Payment History */}
        <Row>
          <Col lg={12}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Payment History</h5>
              </Card.Header>
              <Card.Body>
                {paymentHistory.length === 0 ? (
                  <div className="text-center py-5">
                    <CreditCard size={48} className="text-muted mb-3" />
                    <h6 className="text-muted">No payment history</h6>
                    <p className="text-muted">Your payment transactions will appear here</p>
                  </div>
                ) : (
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Payment Date</th>
                        <th>Amount</th>
                        <th>Period</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((payment, index) => (
                        <tr key={index}>
                          <td>{payment.date}</td>
                          <td>KES {payment.amount.toLocaleString()}</td>
                          <td>{payment.period}</td>
                          <td>{payment.method}</td>
                          <td>
                            <Badge bg={payment.status === "completed" ? "success" : "warning"}>
                              {payment.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td><small>{payment.reference}</small></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default RiderEarnings;
