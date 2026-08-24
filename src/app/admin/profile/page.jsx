"use client";
import React, { useState, useEffect } from 'react';
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
  Users,
  Package,
  TrendingUp,
  Target,
  Building,
  BarChart3,
  FileText,
  DollarSign
} from 'lucide-react';

export default function AdminProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user data from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("cossim-user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserData(user);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Default form data structure
  const defaultFormData = {
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    userCode: "",
    status: "Active",
    department: "Administration"
  };

  const [formData, setFormData] = useState(defaultFormData);

  // Update form data when userData is loaded
  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.FirstName || "",
        lastName: userData.LastName || "",
        email: userData.EmailAddress || "",
        phoneNumber: userData.PhoneNumber || "",
        userCode: userData.UserCode || "",
        status: userData.StatusID === 1 ? "Active" : "Inactive",
        department: "Administration"
      });
    }
  }, [userData]);

  // Admin specific performance stats
  const performanceStats = [
    {
      title: "Total Users",
      value: "0", // This would come from API
      subtitle: "System users",
      color: "primary",
      icon: Users
    },
    {
      title: "Active Vendors",
      value: "0", // This would come from API
      subtitle: "Registered vendors",
      color: "success",
      icon: Building
    },
    {
      title: "Total Packages",
      value: "0", // This would come from API
      subtitle: "All packages",
      color: "info",
      icon: Package
    },
    {
      title: "System Health",
      value: "98%", // This would come from API
      subtitle: "Uptime",
      color: "warning",
      icon: BarChart3
    }
  ];

  // Mock recent activities for admin
  const recentActivities = [
    {
      action: "Approved new vendor registration",
      timestamp: "2 hours ago",
      type: "success"
    },
    {
      action: "Updated system configuration",
      timestamp: "4 hours ago",
      type: "info"
    },
    {
      action: "Generated monthly reports",
      timestamp: "1 day ago",
      type: "primary"
    },
    {
      action: "Resolved user support ticket",
      timestamp: "2 days ago",
      type: "warning"
    }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Save logic here - would call API to update user profile
    setIsEditing(false);
    // Show success message
  };

  if (loading) {
    return (
      <div className="content">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="content">
        <Alert variant="danger">
          <Alert.Heading>Profile Error</Alert.Heading>
          <p>Unable to load user profile data. Please try logging in again.</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="content">
      {/* Enhanced Page Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="page-title mb-1">Admin Profile</h4>
          <p className="text-muted mb-0">Manage your administrative account and system access</p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant={isEditing ? "success" : "outline-primary"}
            size="sm"
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          >
            {isEditing ? <Save size={16} className="me-1" /> : <Edit size={16} className="me-1" />}
            {isEditing ? "Save Changes" : "Edit Profile"}
          </Button>
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
              <p className="text-muted mb-2">System Administrator</p>
              <div className="d-flex align-items-center justify-content-center mb-3">
                <Badge bg={formData.status === "Active" ? "success" : "danger"} className="px-3 py-2">
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
                  {formData.phoneNumber}
                </div>
                <div className="d-flex align-items-center justify-content-center text-muted small">
                  <Shield size={14} className="me-2" />
                  Admin ID: {formData.userCode}
                </div>
              </div>

              {/* Roles Information */}
              {userData.AssignedRoles && userData.AssignedRoles.length > 0 && (
                <div className="mt-3 p-3 bg-light rounded-3">
                  <h6 className="fw-semibold mb-2">System Roles</h6>
                  <div className="d-flex flex-wrap gap-1 justify-content-center">
                    {userData.AssignedRoles.slice(0, 3).map((role, idx) => (
                      <Badge key={idx} bg="secondary" className="px-2 py-1 small">
                        {role.RoleTypeName}
                      </Badge>
                    ))}
                    {userData.AssignedRoles.length > 3 && (
                      <Badge bg="secondary" className="px-2 py-1 small">
                        +{userData.AssignedRoles.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Performance Stats */}
          <Card className="border-0 shadow-sm rounded-3 mt-4">
            <Card.Header className="border-0 bg-transparent pt-4 px-4 pb-0">
              <h6 className="fw-semibold mb-0">System Overview</h6>
            </Card.Header>
            <Card.Body className="p-4">
              <Row className="g-3">
                {performanceStats.map((stat, idx) => (
                  <Col key={idx} xs={6}>
                    <div className="text-center">
                      <div className={`p-2 rounded-circle bg-${stat.color} bg-opacity-10 d-inline-flex mb-2`}>
                        <stat.icon className={`text-${stat.color}`} size={20} />
                      </div>
                      <div className="fw-bold">{stat.value}</div>
                      <div className="small text-muted">{stat.title}</div>
                    </div>
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
                          <Form.Label className="fw-semibold">Email Address</Form.Label>
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
                          <Form.Label className="fw-semibold">Phone Number</Form.Label>
                          <Form.Control
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                            disabled={!isEditing}
                            className={isEditing ? 'border-primary' : ''}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Admin Code</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.userCode}
                            disabled
                            className="bg-light"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Status</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.status}
                            disabled
                            className="bg-light"
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

                      {/* Roles Information */}
                      {userData.AssignedRoles && userData.AssignedRoles.length > 0 && (
                        <>
                          <Col xs={12}>
                            <hr />
                            <h6 className="fw-semibold mb-3">System Access & Roles</h6>
                          </Col>
                          <Col xs={12}>
                            <div className="d-flex flex-wrap gap-2">
                              {userData.AssignedRoles.map((role, idx) => (
                                <Badge key={idx} bg="primary" className="px-3 py-2">
                                  <Shield size={12} className="me-1" />
                                  {role.RoleTypeName}
                                </Badge>
                              ))}
                            </div>
                            <small className="text-muted mt-2 d-block">
                              These roles determine your system access and permissions
                            </small>
                          </Col>
                        </>
                      )}

                      {/* Distribution Centers */}
                      {userData.AssignedDistributionCenter && userData.AssignedDistributionCenter.length > 0 && (
                        <>
                          <Col xs={12}>
                            <hr />
                            <h6 className="fw-semibold mb-3">Assigned Distribution Centers</h6>
                          </Col>
                          <Col xs={12}>
                            <div className="d-flex flex-wrap gap-2">
                              {userData.AssignedDistributionCenter.map((dc, idx) => (
                                <Badge key={idx} bg="info" className="px-3 py-2">
                                  <MapPin size={12} className="me-1" />
                                  {dc.DCName} ({dc.DCCode})
                                </Badge>
                              ))}
                            </div>
                          </Col>
                        </>
                      )}
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
                      <Col md={6}>
                        <Card className="border-2 border-light">
                          <Card.Body className="p-3 d-flex align-items-center">
                            <div className="p-2 bg-warning bg-opacity-10 rounded me-3">
                              <FileText size={20} className="text-warning" />
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="mb-1">Audit Logs</h6>
                              <small className="text-muted">View admin activity logs</small>
                            </div>
                            <Button variant="outline-warning" size="sm">
                              View Logs
                            </Button>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6}>
                        <Card className="border-2 border-light">
                          <Card.Body className="p-3 d-flex align-items-center">
                            <div className="p-2 bg-info bg-opacity-10 rounded me-3">
                              <Settings size={20} className="text-info" />
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="mb-1">System Access</h6>
                              <small className="text-muted">Manage system permissions</small>
                            </div>
                            <Button variant="outline-info" size="sm">
                              Configure
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
                                <span>System Alerts</span>
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
                                <Users size={16} className="me-2 text-success" />
                                <span>User Registrations</span>
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
                                <Package size={16} className="me-2 text-warning" />
                                <span>Package Updates</span>
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
                                <DollarSign size={16} className="me-2 text-info" />
                                <span>Financial Reports</span>
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
                    <h6 className="fw-semibold mb-3">Administrative Activities</h6>
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
