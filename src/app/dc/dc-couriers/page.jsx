"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Row, Col, Badge, Button, Form, InputGroup, Modal, Alert, Tab, Tabs, Spinner } from 'react-bootstrap';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Star,
  Activity,
  Route,
  Calendar,
  RotateCcw,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import DCSwitcher from '@/components/DCSwitcher';
import DashCard from '@/components/cards/DashCard';
import useDCDashboard from '@/hooks/useDCDashboard';
import { useShipment } from '@/hooks/useShipment';
import { getDCAssignedUsers } from '@/services/distributionCenterService';
import "./../dc-overview/dc-overview-styles.css";
import Link from "@/components/Link";
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

// Mock data removed in favor of API integration

export default function DCCouriers() {
  const { dcCode } = useShipment();
  const { data: dashboardData, loading: dashboardLoading, refetch: refetchDashboard } = useDCDashboard();
  
  const [couriers, setCouriers] = useState([]);
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [courierError, setCourierError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [activeTab, setActiveTab] = useState('list');

  const fetchCouriersList = useCallback(async () => {
    if (!dcCode) return;
    
    try {
      setLoadingCouriers(true);
      setCourierError(null);
      const response = await getDCAssignedUsers({
        dcCode: dcCode,
        pageSize: 100,
        searchTerm: searchTerm
      });
      
      if (response && !response.Error) {
        // Filter users who have 'Rider' or equivalent role if possible, 
        // but typically getDCAssignedUsers returns the relevant users for the DC.
        setCouriers(response.Data || []);
      } else {
        throw new Error(response?.Message || 'Failed to fetch couriers');
      }
    } catch (err) {
      setCourierError(err.message);
    } finally {
      setLoadingCouriers(false);
    }
  }, [dcCode, searchTerm]);

  useEffect(() => {
    fetchCouriersList();
  }, [fetchCouriersList]);

  const handleRefresh = () => {
    refetchDashboard();
    fetchCouriersList();
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Active': 'badge-soft-success',
      'On Break': 'badge-soft-warning',
      'Offline': 'badge-soft-secondary',
      'Busy': 'badge-soft-danger'
    };
    
    return (
      <span className={`badge ${statusMap[status] || 'badge-soft-secondary'}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  const dashboardSummary = dashboardData?.Summary || {};

  const stats = [
    {
      title: "Total Couriers",
      value: couriers.length || 0,
      color: "bg-primary",
      icon: <Users size={24} />,
    },
    {
      title: "Active Today",
      value: dashboardSummary.ActiveRoutes || 0,
      color: "bg-success",
      icon: <CheckCircle size={24} />,
    },
    {
      title: "On Delivery",
      value: dashboardSummary.ReadyForDispatch || 0,
      color: "bg-warning",
      icon: <Truck size={24} />,
    },
    {
      title: "Efficiency",
      value: Math.round(dashboardSummary.EfficiencyPct || 0),
      color: "bg-info",
      icon: <Activity size={24} />,
    }
  ];

  const getRatingDisplay = (rating) => {
    return (
      <div className="d-flex align-items-center">
        <Star size={14} className="text-warning me-1" fill="currentColor" />
        <span className="fw-medium">{rating}</span>
      </div>
    );
  };

  return (
      <div className="content">
        {/* Enhanced Page Header */}
        <div className="page-header mb-4">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4 className="fw-bold">Courier Management</h4>
              <h6 className="text-muted">Manage your delivery team and monitor performance</h6>
            </div>
          </div>
          
          <div className="d-flex align-items-center gap-3">
            <DCSwitcher />
            
            <ul className="table-top-head mb-0">
              <li>
                <OverlayTrigger placement="top" overlay={(props) => <Tooltip {...props}>Refresh</Tooltip>}>
                  <Link
                    className="btn-filter rounded-pill shadow-sm"
                    style={{ cursor: 'pointer' }}
                    onClick={handleRefresh}
                  >
                    <RotateCcw size={18} className={(dashboardLoading || loadingCouriers) ? "spin" : ""} />
                  </Link>
                </OverlayTrigger>
              </li>
              <li>
                <OverlayTrigger placement="top" overlay={(props) => <Tooltip {...props}>Schedule</Tooltip>}>
                  <Link className="btn-filter rounded-pill shadow-sm">
                    <Calendar size={18} />
                  </Link>
                </OverlayTrigger>
              </li>
            </ul>

            <div className="page-btn">
              <Button variant="primary" className="btn btn-added rounded-pill shadow-sm py-2 px-4 transition-all">
                <Plus size={18} className="me-2" />
                Add Courier
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <Row className="g-4 mb-4">
          {stats.map((stat, idx) => (
            <DashCard
              key={idx}
              title={stat.title}
              value={stat.value}
              className={stat.color}
              icon={stat.icon}
              textColor="white"
            />
          ))}
        </Row>

        {/* Performance Alert */}
        <Alert variant="info" className="border-0 shadow-sm rounded-3 mb-4 bg-primary bg-opacity-10 text-primary">
          <div className="d-flex align-items-center">
            <Activity size={20} className="me-3" />
            <div className="flex-grow-1">
              <strong className="fw-bold">High Performance Alert:</strong> 
              <span className="ms-1">3 couriers are performing above daily targets. Consider route optimizations for even better efficiency.</span>
            </div>
            <Button variant="primary" size="sm" className="rounded-pill px-3 shadow-none">
              Optimization Plan →
            </Button>
          </div>
        </Alert>

        {/* Main Couriers Card */}
        <Card className="border-0 shadow-sm rounded-3 overflow-hidden">
          <Card.Header className="bg-transparent border-bottom pt-4 px-4 pb-0">
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
              <h5 className="fw-bold mb-0">Rider Directory</h5>
              <div className="d-flex gap-2">
                <InputGroup className="shadow-none" style={{ maxWidth: '250px' }}>
                  <InputGroup.Text className="bg-light border-0">
                    <Search size={16} />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search riders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-light border-0 shadow-none ps-0"
                  />
                </InputGroup>
                <div className="d-flex border rounded-pill overflow-hidden bg-light" style={{ height: '38px' }}>
                  <Button 
                    variant={activeTab === 'grid' ? 'primary' : 'transparent'} 
                    size="sm"
                    className={`rounded-0 border-0 px-3 ${activeTab === 'grid' ? '' : 'text-muted'}`}
                    onClick={() => setActiveTab('grid')}
                  >
                    Grid
                  </Button>
                  <Button 
                    variant={activeTab === 'list' ? 'primary' : 'transparent'} 
                    size="sm"
                    className={`rounded-0 border-0 px-3 ${activeTab === 'list' ? '' : 'text-muted'}`}
                    onClick={() => setActiveTab('list')}
                  >
                    Table
                  </Button>
                </div>
              </div>
            </div>
          </Card.Header>
          <Card.Body className="p-4">
            {courierError && (
              <Alert variant="danger" className="mb-4 border-0 shadow-sm">
                <AlertCircle size={18} className="me-2" />
                {courierError}
              </Alert>
            )}

            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
              <Tab eventKey="list" title="Table View">
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Courier Details</th>
                        <th>Contact</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th>Vehicle</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingCouriers ? (
                        <tr>
                          <td colSpan="6" className="text-center py-5">
                            <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                            Loading riders...
                          </td>
                        </tr>
                      ) : couriers.length > 0 ? (
                        couriers.map((courier, idx) => (
                          <tr key={idx}>
                            <td>
                              <div>
                                <h6 className="mb-1 fw-semibold">{courier.FullName}</h6>
                                <small className="text-muted">Code: {courier.UserCode}</small>
                              </div>
                            </td>
                            <td>
                              <div className="small">
                                <div className="mb-1">
                                  <Phone size={12} className="me-1 text-muted" />
                                  {courier.PhoneNumber || 'N/A'}
                                </div>
                                <div>
                                  <Mail size={12} className="me-1 text-muted" />
                                  {courier.Email || 'N/A'}
                                </div>
                              </div>
                            </td>
                            <td>{getStatusBadge(courier.IsActive ? 'Active' : 'Offline')}</td>
                            <td>
                              <div className="small text-muted">
                                {courier.CreatedDate ? new Date(courier.CreatedDate).toLocaleDateString() : 'N/A'}
                              </div>
                            </td>
                            <td>
                              <Badge bg="light" text="dark" className="px-2 py-1">
                                {courier.VehicleType || 'Motorcycle'}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  className="rounded-pill px-3"
                                  onClick={() => {
                                    setSelectedCourier(courier);
                                    setShowModal(true);
                                  }}
                                >
                                  View
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-5 text-muted">
                            No riders assigned to this DC.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Tab>

              <Tab eventKey="grid" title="Grid View">
                <Row className="g-4">
                  {loadingCouriers ? (
                    <Col xs={12} className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                    </Col>
                  ) : couriers.length > 0 ? (
                    couriers.map((courier, idx) => (
                      <Col key={idx} lg={4} md={6}>
                        <Card className="border-0 shadow-sm rounded-3 h-100 hover-translate-y transition-all bg-light bg-opacity-25">
                          <Card.Body className="p-4">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                              <h6 className="fw-semibold mb-0">{courier.FullName}</h6>
                              {getStatusBadge(courier.IsActive ? 'Active' : 'Offline')}
                            </div>
                            
                            <div className="mb-3">
                              <div className="small text-muted mb-2">
                                <Phone size={12} className="me-1" />{courier.PhoneNumber || 'N/A'}
                              </div>
                              <div className="small text-muted">
                                Vehicle: {courier.VehicleType || 'Motorcycle'}
                              </div>
                            </div>

                            <div className="d-flex gap-2">
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="flex-grow-1 rounded-pill"
                                onClick={() => {
                                  setSelectedCourier(courier);
                                  setShowModal(true);
                                }}
                              >
                                View Details
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))
                  ) : (
                    <Col xs={12} className="text-center py-5 text-muted font-italic">
                      No riders found.
                    </Col>
                  )}
                </Row>
              </Tab>
            </Tabs>
          </Card.Body>

        </Card>

        {/* Courier Details Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Courier Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedCourier && (
              <Row className="g-4">
                <Col md={12}>
                  <Card className="border-0 shadow-sm bg-light">
                    <Card.Body>
                      <div className="d-flex align-items-center gap-3 mb-4">
                        <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                          <Users className="text-primary" size={24} />
                        </div>
                        <div>
                          <h5 className="fw-bold mb-0">{selectedCourier.FullName}</h5>
                          <p className="text-muted mb-0">{selectedCourier.UserCode}</p>
                        </div>
                        <div className="ms-auto">
                          {getStatusBadge(selectedCourier.IsActive ? 'Active' : 'Offline')}
                        </div>
                      </div>

                      <Row className="g-3">
                        <Col sm={6}>
                          <div className="p-3 bg-white rounded-3 border">
                            <h6 className="text-muted small mb-2 text-uppercase fw-bold">Contact Info</h6>
                            <div className="mb-2 d-flex align-items-center"><Phone size={14} className="me-2 text-muted" /> {selectedCourier.PhoneNumber || 'N/A'}</div>
                            <div className="d-flex align-items-center"><Mail size={14} className="me-2 text-muted" /> {selectedCourier.Email || 'N/A'}</div>
                          </div>
                        </Col>
                        <Col sm={6}>
                          <div className="p-3 bg-white rounded-3 border">
                            <h6 className="text-muted small mb-2 text-uppercase fw-bold">Assignment</h6>
                            <div className="mb-2"><strong>Vehicle:</strong> {selectedCourier.VehicleType || 'Motorcycle'}</div>
                            <div><strong>Joined:</strong> {selectedCourier.CreatedDate ? new Date(selectedCourier.CreatedDate).toLocaleDateString() : 'N/A'}</div>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
            <Button variant="success">
              Assign Route
            </Button>
            <Button variant="primary">
              Update Details
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
  );
}
