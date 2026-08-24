"use client";
import React, { useState } from 'react';
import { Card, Row, Col, Badge, Button, Form, InputGroup, Tab, Tabs, Alert, Modal } from 'react-bootstrap';
import { 
  Bell, 
  Mail, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  Clock,
  Search,
  Filter,
  Settings,
  Plus,
  Eye,
  Trash2,
  MailOpen,
  RotateCcw,
  ChevronUp
} from 'lucide-react';
import DCSwitcher from '@/components/DCSwitcher';
import DashCard from '@/components/cards/DashCard';
import CountUp from "react-countup";
import "./../dc-overview/dc-overview-styles.css";
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import Link from "@/components/Link";

const notificationStats = [
  {
    title: "Total Notifications",
    value: "47",
    subtitle: "All notifications",
    color: "primary",
    icon: Bell,
    trend: "+5 today"
  },
  {
    title: "Unread",
    value: "12",
    subtitle: "Require attention",
    color: "warning",
    icon: Mail,
    trend: "3 urgent"
  },
  {
    title: "Alerts",
    value: "8",
    subtitle: "System alerts", 
    color: "danger",
    icon: AlertTriangle,
    trend: "2 critical"
  },
  {
    title: "Resolved",
    value: "35",
    subtitle: "Completed",
    color: "success",
    icon: CheckCircle,
    trend: "74% rate"
  }
];

const notifications = [
  {
    id: 1,
    title: "High Priority Package Delivery",
    message: "Package PKG001 requires urgent delivery to customer John Doe. Current location: DC-North",
    type: "urgent",
    category: "Delivery",
    timestamp: "2 minutes ago",
    isRead: false,
    priority: "High",
    source: "System"
  },
  {
    id: 2,
    title: "Route Optimization Complete",
    message: "Route DC-A-12 has been optimized. New delivery sequence available for review.",
    type: "info",
    category: "Operations",
    timestamp: "15 minutes ago", 
    isRead: false,
    priority: "Medium",
    source: "AI System"
  },
  {
    id: 3,
    title: "Courier Performance Alert",
    message: "Courier Ahmed Hassan has exceeded daily delivery targets by 20%. Consider recognition.",
    type: "success",
    category: "Performance",
    timestamp: "1 hour ago",
    isRead: true,
    priority: "Low",
    source: "Performance Monitor"
  },
  {
    id: 4,
    title: "System Maintenance Scheduled",
    message: "Scheduled system maintenance on August 12, 2024 from 2:00 AM to 4:00 AM. Plan accordingly.",
    type: "warning",
    category: "System",
    timestamp: "2 hours ago",
    isRead: false,
    priority: "Medium",
    source: "System Admin"
  },
  {
    id: 5,
    title: "Package Processing Delayed",
    message: "Processing of 15 packages delayed due to scanner malfunction. Technical team notified.",
    type: "error", 
    category: "Technical",
    timestamp: "3 hours ago",
    isRead: true,
    priority: "High",
    source: "Technical System"
  }
];

export default function DCNotifications() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const getNotificationIcon = (type) => {
    const icons = {
      urgent: AlertTriangle,
      info: Info,
      success: CheckCircle,
      warning: Clock,
      error: XCircle
    };
    return icons[type] || Bell;
  };

  const getNotificationColor = (type) => {
    const colors = {
      urgent: 'danger',
      info: 'info', 
      success: 'success',
      warning: 'warning',
      error: 'danger'
    };
    return colors[type] || 'primary';
  };

  const getPriorityBadge = (priority) => {
    const statusMap = {
      High: 'badge-soft-danger',
      Medium: 'badge-soft-warning',
      Low: 'badge-soft-success'
    };
    return <span className={`badge ${statusMap[priority] || 'badge-soft-secondary'} px-2 py-1`}>{priority}</span>;
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'unread') return !notification.isRead;
    if (activeTab === 'read') return notification.isRead;
    return true;
  }).filter(notification => 
    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
      <div className="content">
        {/* Enhanced Page Header */}
        <div className="page-header mb-4">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4 className="fw-bold">Notification Center</h4>
              <h6 className="text-muted">Manage alerts, updates, and system notifications</h6>
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
                  >
                    <RotateCcw size={18} />
                  </Link>
                </OverlayTrigger>
              </li>
              <li>
                <OverlayTrigger placement="top" overlay={(props) => <Tooltip {...props}>Settings</Tooltip>}>
                  <Link className="btn-filter rounded-pill shadow-sm">
                    <Settings size={18} />
                  </Link>
                </OverlayTrigger>
              </li>
            </ul>

            <div className="page-btn">
              <Button variant="primary" className="btn btn-added rounded-pill shadow-sm py-2 px-4 transition-all">
                <Plus size={18} className="me-2" />
                New Alert
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <Row className="g-4 mb-4">
          {notificationStats.map((stat, idx) => (
            <Col key={idx} xl={3} md={6}>
              <DashCard
                title={stat.title}
                value={
                  <CountUp
                    end={parseFloat(stat.value)}
                    duration={2}
                    decimals={stat.value.includes('.') ? 1 : 0}
                  />
                }
                color={stat.color}
                icon={<stat.icon size={24} />}
                textColor={'white'}
                className="hover-translate-y shadow-sm h-100"
              />
            </Col>
          ))}
        </Row>

        {/* Active Alerts */}
        <Alert variant="warning" className="border-0 shadow-sm rounded-3 mb-4">
          <div className="d-flex align-items-center">
            <AlertTriangle size={20} className="me-3 text-warning" />
            <div className="flex-grow-1">
              <strong>Active Alerts:</strong> You have 3 urgent notifications requiring immediate attention.
            </div>
            <Button variant="outline-warning" size="sm">
              View All →
            </Button>
          </div>
        </Alert>

        {/* Main Notifications Card */}
        <Card className="border-0 shadow-sm rounded-3 overflow-hidden">
          <Card.Header className="bg-transparent border-bottom pt-4 px-4 pb-0">
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
              <h5 className="fw-bold mb-0">System Intelligence Feed</h5>
              <div className="d-flex gap-2">
                <InputGroup className="shadow-none" style={{ maxWidth: '250px' }}>
                  <InputGroup.Text className="bg-light border-0">
                    <Search size={16} />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search feed..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-light border-0 shadow-none ps-0"
                  />
                </InputGroup>
                <Button variant="outline-success" size="sm" className="rounded-pill px-3">
                  <MailOpen size={16} className="me-1" />
                  Mark All Read
                </Button>
              </div>
            </div>
          </Card.Header>

          <Card.Body className="p-4">
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
              <Tab eventKey="all" title={`All (${notifications.length})`}>
                <div className="notification-list">
                  {filteredNotifications.map((notification, idx) => {
                    const IconComponent = getNotificationIcon(notification.type);
                    return (
                      <Card key={idx} className={`border-start border-4 border-${getNotificationColor(notification.type)} mb-3 ${!notification.isRead ? 'bg-light' : ''}`}>
                        <Card.Body className="p-4">
                          <div className="d-flex align-items-start justify-content-between">
                            <div className="d-flex align-items-start flex-grow-1">
                              <div className={`p-2 rounded-circle bg-${getNotificationColor(notification.type)} bg-opacity-10 me-3`}>
                                <IconComponent className={`text-${getNotificationColor(notification.type)}`} size={20} />
                              </div>
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center mb-2">
                                  <h6 className={`mb-0 ${!notification.isRead ? 'fw-bold' : 'fw-semibold text-muted'}`}>
                                    {notification.title}
                                  </h6>
                                  {!notification.isRead && (
                                    <span className="badge badge-soft-primary ms-2 rounded-pill">New</span>
                                  )}
                                </div>
                                <p className="text-muted small mb-2">{notification.message}</p>
                                <div className="d-flex align-items-center gap-3 small text-muted">
                                  <span><Clock size={12} className="me-1" />{notification.timestamp}</span>
                                  <span>{notification.category}</span>
                                  {getPriorityBadge(notification.priority)}
                                </div>
                              </div>
                            </div>
                            <div className="d-flex gap-1 ms-3">
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => {
                                  setSelectedNotification(notification);
                                  setShowModal(true);
                                }}
                              >
                                <Eye size={14} />
                              </Button>
                              <Button variant="outline-danger" size="sm">
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    );
                  })}
                </div>
              </Tab>
              
              <Tab eventKey="unread" title={`Unread (${notifications.filter(n => !n.isRead).length})`}>
                <div className="notification-list">
                  {filteredNotifications.map((notification, idx) => {
                    if (notification.isRead) return null;
                    const IconComponent = getNotificationIcon(notification.type);
                    return (
                      <Card key={idx} className={`border-start border-4 border-${getNotificationColor(notification.type)} mb-3 bg-light`}>
                        <Card.Body className="p-4">
                          <div className="d-flex align-items-start justify-content-between">
                            <div className="d-flex align-items-start flex-grow-1">
                              <div className={`p-2 rounded-circle bg-${getNotificationColor(notification.type)} bg-opacity-10 me-3`}>
                                <IconComponent className={`text-${getNotificationColor(notification.type)}`} size={20} />
                              </div>
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center mb-2">
                                  <h6 className="mb-0 fw-bold">{notification.title}</h6>
                                  <Badge bg="primary" className="ms-2 rounded-pill">New</Badge>
                                </div>
                                <p className="text-muted mb-2">{notification.message}</p>
                                <div className="d-flex align-items-center gap-3 small text-muted">
                                  <span><Clock size={12} className="me-1" />{notification.timestamp}</span>
                                  <span>Category: {notification.category}</span>
                                  {getPriorityBadge(notification.priority)}
                                </div>
                              </div>
                            </div>
                            <div className="d-flex gap-1 ms-3">
                              <Button variant="outline-success" size="sm">
                                Mark Read
                              </Button>
                              <Button variant="outline-danger" size="sm">
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    );
                  })}
                </div>
              </Tab>

              <Tab eventKey="read" title={`Read (${notifications.filter(n => n.isRead).length})`}>
                <div className="notification-list">
                  {filteredNotifications.map((notification, idx) => {
                    if (!notification.isRead) return null;
                    const IconComponent = getNotificationIcon(notification.type);
                    return (
                      <Card key={idx} className={`border-start border-4 border-${getNotificationColor(notification.type)} mb-3`}>
                        <Card.Body className="p-4">
                          <div className="d-flex align-items-start justify-content-between">
                            <div className="d-flex align-items-start flex-grow-1">
                              <div className={`p-2 rounded-circle bg-${getNotificationColor(notification.type)} bg-opacity-10 me-3`}>
                                <IconComponent className={`text-${getNotificationColor(notification.type)}`} size={20} />
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="mb-2 fw-semibold text-muted">{notification.title}</h6>
                                <p className="text-muted mb-2">{notification.message}</p>
                                <div className="d-flex align-items-center gap-3 small text-muted">
                                  <span><Clock size={12} className="me-1" />{notification.timestamp}</span>
                                  <span>Category: {notification.category}</span>
                                  {getPriorityBadge(notification.priority)}
                                </div>
                              </div>
                            </div>
                            <div className="d-flex gap-1 ms-3">
                              <Button variant="outline-warning" size="sm">
                                Mark Unread
                              </Button>
                              <Button variant="outline-danger" size="sm">
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    );
                  })}
                </div>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>

        {/* Notification Details Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Notification Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedNotification && (
              <div>
                <div className="d-flex align-items-center mb-3">
                  <div className={`p-3 rounded-circle bg-${getNotificationColor(selectedNotification.type)} bg-opacity-10 me-3`}>
                    {React.createElement(getNotificationIcon(selectedNotification.type), { 
                      className: `text-${getNotificationColor(selectedNotification.type)}`, 
                      size: 24 
                    })}
                  </div>
                  <div>
                    <h5 className="mb-1">{selectedNotification.title}</h5>
                    <div className="d-flex gap-2">
                      {getPriorityBadge(selectedNotification.priority)}
                      <Badge bg="light" text="dark">{selectedNotification.category}</Badge>
                    </div>
                  </div>
                </div>
                <p className="mb-3">{selectedNotification.message}</p>
                <div className="row g-3">
                  <div className="col-md-6">
                    <small className="text-muted">Timestamp:</small>
                    <div>{selectedNotification.timestamp}</div>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted">Source:</small>
                    <div>{selectedNotification.source}</div>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted">Status:</small>
                    <div>{selectedNotification.isRead ? 'Read' : 'Unread'}</div>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted">ID:</small>
                    <div>#{selectedNotification.id}</div>
                  </div>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
            <Button variant="success">
              Mark as Read
            </Button>
            <Button variant="primary">
              Take Action
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
  );
}
