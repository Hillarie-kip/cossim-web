"use client";
import React, { useState } from 'react';
import { Card, Row, Col, Badge, Button, Form, Alert, Tab, Tabs } from 'react-bootstrap';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Settings,
  Shield,
  Edit,
  Save,
  Camera,
  Key,
  Bell,
  Activity,
  Award,
  Clock,
  RotateCcw,
  ChevronUp
} from 'lucide-react';
import DCSwitcher from '@/components/DCSwitcher';
import DashCard from '@/components/cards/DashCard';
import CountUp from "react-countup";
import "./../dc-overview/dc-overview-styles.css";
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import Link from "@/components/Link";

const profileData = {
  firstName: "Ahmed",
  lastName: "Hassan",
  email: "ahmed.hassan@cossim.com",
  phone: "+234-801-234-5678",
  employeeId: "DC001",
  position: "Distribution Center Manager",
  department: "Operations",
  joinDate: "January 15, 2024",
  location: "Lagos, Nigeria",
  manager: "Sarah Johnson",
  status: "Active"
};

const performanceStats = [
  {
    title: "Centers Managed",
    value: "5",
    subtitle: "Distribution centers",
    color: "primary",
    icon: MapPin
  },
  {
    title: "Team Size",
    value: "42",
    subtitle: "Direct reports",
    color: "success",
    icon: User
  },
  {
    title: "Experience",
    value: "3.2 years",
    subtitle: "With company",
    color: "info",
    icon: Calendar
  },
  {
    title: "Performance",
    value: "98.5%",
    subtitle: "Efficiency rating",
    color: "warning",
    icon: Award
  }
];

const recentActivities = [
  {
    action: "Updated delivery route optimization",
    timestamp: "2 hours ago",
    type: "success"
  },
  {
    action: "Approved courier performance bonus",
    timestamp: "4 hours ago",
    type: "info"
  },
  {
    action: "Completed monthly inventory audit",
    timestamp: "1 day ago",
    type: "primary"
  },
  {
    action: "Resolved system maintenance issue",
    timestamp: "2 days ago",
    type: "warning"
  }
];

export default function DCProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profileData);
  const [activeTab, setActiveTab] = useState('profile');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Save logic here
    setIsEditing(false);
    // Show success message
  };

  return (
      <div className="content">
        {/* Enhanced Page Header */}
        <div className="page-header mb-4">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4 className="fw-bold">User Profile</h4>
              <h6 className="text-muted">Manage your account information and settings</h6>
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
                <OverlayTrigger placement="top" overlay={(props) => <Tooltip {...props}>Collapse</Tooltip>}>
                  <Link id="collapse-header" className="btn-filter rounded-pill shadow-sm">
                    <ChevronUp size={18} />
                  </Link>
                </OverlayTrigger>
              </li>
            </ul>

            <div className="page-btn">
              <Button 
                variant={isEditing ? "success" : "primary"} 
                className="btn btn-added rounded-pill shadow-sm py-2 px-4 transition-all"
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              >
                {isEditing ? <Save size={18} className="me-2" /> : <Edit size={18} className="me-2" />}
                {isEditing ? "Save Changes" : "Edit Profile"}
              </Button>
            </div>
          </div>
        </div>

        <Row className="g-4">
          {/* Profile Card */}
          <Col lg={4}>
            <Card className="border-0 shadow-sm rounded-3 h-100">
              <Card.Body className="p-4 text-center">
                <div className="position-relative d-inline-block mb-4">
                  <div className="bg-primary bg-opacity-10 rounded-circle p-4" style={{width: '120px', height: '120px'}}>
                    <User size={64} className="text-primary" />
                  </div>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="position-absolute bottom-0 end-0 rounded-circle p-2"
                  >
                    <Camera size={14} />
                  </Button>
                </div>
                <h5 className="fw-bold mb-1">{formData.firstName} {formData.lastName}</h5>
                <p className="text-muted mb-2">{formData.position}</p>
                <div className="d-flex align-items-center justify-content-center mb-3">
                  <Badge bg="success" className="px-3 py-2">
                    <Activity size={12} className="me-1" />
                    {formData.status}
                  </Badge>
                </div>
                
                <div className="d-grid gap-2">
                  <div className="d-flex align-items-center justify-content-center text-muted small">
                    <Mail size={14} className="me-2" />
                    {formData.email}
                  </div>
                  <div className="d-flex align-items-center justify-content-center text-muted small">
                    <Phone size={14} className="me-2" />
                    {formData.phone}
                  </div>
                  <div className="d-flex align-items-center justify-content-center text-muted small">
                    <MapPin size={14} className="me-2" />
                    {formData.location}
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Performance Stats - Modern DashCard Grid */}
            <Card className="border-0 bg-transparent mt-4">
              <Card.Body className="p-0">
                <Row className="g-3">
                  {performanceStats.map((stat, idx) => (
                    <Col key={idx} xs={6}>
                      <DashCard
                        title={stat.title}
                        value={
                          <CountUp
                            end={parseFloat(stat.value)}
                            duration={2}
                            decimals={stat.value.includes('.') ? 1 : 0}
                            suffix={stat.value.includes('year') ? 'y' : ''}
                          />
                        }
                        color={stat.color}
                        icon={<stat.icon size={20} />}
                        textColor={'white'}
                        className="hover-translate-y shadow-sm h-100"
                        titleSize="0.8rem"
                      />
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Content */}
          <Col lg={8}>
            <Card className="border-0 shadow-sm rounded-3">
              <Card.Body className="p-4">
                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
                  <Tab eventKey="profile" title="Profile Information">
                    <Form>
                      <Row className="g-4">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">First Name</Form.Label>
                            <Form.Control
                              type="text"
                              value={formData.firstName}
                              onChange={(e) => handleInputChange('firstName', e.target.value)}
                              disabled={!isEditing}
                              className={isEditing ? 'border-primary' : ''}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Last Name</Form.Label>
                            <Form.Control
                              type="text"
                              value={formData.lastName}
                              onChange={(e) => handleInputChange('lastName', e.target.value)}
                              disabled={!isEditing}
                              className={isEditing ? 'border-primary' : ''}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Email</Form.Label>
                            <Form.Control
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              disabled={!isEditing}
                              className={isEditing ? 'border-primary' : ''}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Phone</Form.Label>
                            <Form.Control
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              disabled={!isEditing}
                              className={isEditing ? 'border-primary' : ''}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Employee ID</Form.Label>
                            <Form.Control
                              type="text"
                              value={formData.employeeId}
                              disabled
                              className="bg-light"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Position</Form.Label>
                            <Form.Control
                              type="text"
                              value={formData.position}
                              onChange={(e) => handleInputChange('position', e.target.value)}
                              disabled={!isEditing}
                              className={isEditing ? 'border-primary' : ''}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Department</Form.Label>
                            <Form.Control
                              type="text"
                              value={formData.department}
                              disabled
                              className="bg-light"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Location</Form.Label>
                            <Form.Control
                              type="text"
                              value={formData.location}
                              onChange={(e) => handleInputChange('location', e.target.value)}
                              disabled={!isEditing}
                              className={isEditing ? 'border-primary' : ''}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Join Date</Form.Label>
                            <Form.Control
                              type="text"
                              value={formData.joinDate}
                              disabled
                              className="bg-light"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Manager</Form.Label>
                            <Form.Control
                              type="text"
                              value={formData.manager}
                              disabled
                              className="bg-light"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Form>
                  </Tab>

                  <Tab eventKey="security" title="Security Settings">
                    <div className="security-settings">
                      <h6 className="fw-semibold mb-3">Password & Security</h6>
                      <Row className="g-4">
                        <Col md={6}>
                          <Card className="border-2 border-light">
                            <Card.Body className="p-3 d-flex align-items-center">
                              <div className="p-2 bg-primary bg-opacity-10 rounded me-3">
                                <Key size={20} className="text-primary" />
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="mb-1">Change Password</h6>
                                <small className="text-muted">Last updated 30 days ago</small>
                              </div>
                              <Button variant="outline-primary" size="sm">
                                Update
                              </Button>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={6}>
                          <Card className="border-2 border-light">
                            <Card.Body className="p-3 d-flex align-items-center">
                              <div className="p-2 bg-success bg-opacity-10 rounded me-3">
                                <Shield size={20} className="text-success" />
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="mb-1">Two-Factor Auth</h6>
                                <small className="text-success">Enabled</small>
                              </div>
                              <Button variant="outline-success" size="sm">
                                Manage
                              </Button>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </div>
                  </Tab>

                  <Tab eventKey="notifications" title="Notification Settings">
                    <div className="notification-settings">
                      <h6 className="fw-semibold mb-3">Notification Preferences</h6>
                      <Row className="g-3">
                        <Col md={6}>
                          <Card className="border-2 border-light">
                            <Card.Body className="p-3">
                              <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                  <Bell size={16} className="me-2 text-primary" />
                                  <span>Email Notifications</span>
                                </div>
                                <Form.Check type="switch" defaultChecked />
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={6}>
                          <Card className="border-2 border-light">
                            <Card.Body className="p-3">
                              <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                  <Phone size={16} className="me-2 text-warning" />
                                  <span>SMS Alerts</span>
                                </div>
                                <Form.Check type="switch" defaultChecked />
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </div>
                  </Tab>

                  <Tab eventKey="activity" title="Recent Activity">
                    <div className="activity-log">
                      <h6 className="fw-semibold mb-3">Recent Activities</h6>
                      <div className="d-flex flex-column gap-3">
                        {recentActivities.map((activity, idx) => (
                          <div key={idx} className="d-flex align-items-center p-3 border rounded-3">
                            <div className={`p-2 rounded-circle bg-${activity.type} bg-opacity-10 me-3`}>
                              <Activity className={`text-${activity.type}`} size={16} />
                            </div>
                            <div className="flex-grow-1">
                              <div className="fw-medium">{activity.action}</div>
                              <small className="text-muted">
                                <Clock size={12} className="me-1" />
                                {activity.timestamp}
                              </small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
  );
}
       