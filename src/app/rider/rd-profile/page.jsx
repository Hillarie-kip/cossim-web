"use client"
import React, { useState, useEffect } from "react";
import { Card, Row, Col, Form, Button, Alert, Badge, Tab, Tabs, Modal } from "react-bootstrap";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Truck, 
  Calendar, 
  Edit3, 
  Camera,
  Shield,
  CreditCard,
  Star,
  Settings,
  Bell,
  Lock
} from "feather-icons-react";
import notify from "@/lib/toast";

const RiderProfile = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [riderData, setRiderData] = useState({
    id: "RIDER-001",
    name: "Hillary",
    email: "hillary@cossim.co.ke",
    phone: "+254712345678",
    address: "123 Main Street, Nairobi",
    vehicleType: "Motorcycle",
    licensePlate: "KCA 123A",
    licenseNumber: "DL-12345678",
    joinDate: "2024-01-15",
    status: "active",
    rating: 4.8,
    totalDeliveries: 856,
    profileImage: null
  });

  const [notifications, setNotifications] = useState({
    deliveryUpdates: true,
    paymentAlerts: true,
    promotions: false,
    systemNotifications: true
  });

  const handleProfileUpdate = (updatedData) => {
    setRiderData({ ...riderData, ...updatedData });
    setShowEditModal(false);
    notify.success("Your profile has been successfully updated.");
  };

  const handlePasswordChange = (passwordData) => {
    setShowPasswordModal(false);
    notify.success("Your password has been successfully changed.");
  };

  const handleProfileImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // In real app, this would upload to server
      const reader = new FileReader();
      reader.onloadend = () => {
        setRiderData({ ...riderData, profileImage: reader.result });
        notify.success("Your profile photo has been updated successfully.");
      };
      reader.readAsDataURL(file);
    }
  };

  const saveNotificationSettings = () => {
    notify.success("Your notification preferences have been updated.");
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>My Profile</h4>
              <h6>Manage your account information</h6>
            </div>
          </div>
        </div>

        <Row>
          {/* Profile Summary Card */}
          <Col lg={4} className="mb-4">
            <Card>
              <Card.Body className="text-center">
                <div className="position-relative d-inline-block mb-3">
                  {riderData.profileImage ? (
                    <img
                      src={riderData.profileImage}
                      alt="Profile"
                      className="rounded-circle"
                      width={100}
                      height={100}
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div 
                      className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: "100px", height: "100px" }}
                    >
                      <User size={40} className="text-primary" />
                    </div>
                  )}
                  <label 
                    className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-2 cursor-pointer"
                    style={{ cursor: "pointer" }}
                  >
                    <Camera size={16} className="text-white" />
                    <input 
                      type="file" 
                      className="d-none" 
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                    />
                  </label>
                </div>
                
                <h4 className="mb-1">{riderData.name}</h4>
                <p className="text-muted mb-3">Rider ID: {riderData.id}</p>
                
                <div className="d-flex justify-content-center gap-2 mb-3">
                  <Badge bg="success">
                    {riderData.status.charAt(0).toUpperCase() + riderData.status.slice(1)}
                  </Badge>
                  <Badge bg="info">
                    {riderData.vehicleType}
                  </Badge>
                </div>

                <Row className="text-center">
                  <Col>
                    <h6 className="mb-0">{riderData.totalDeliveries}</h6>
                    <small className="text-muted">Total Deliveries</small>
                  </Col>
                  <Col>
                    <h6 className="mb-0">{riderData.rating}/5</h6>
                    <small className="text-muted">Rating</small>
                  </Col>
                </Row>

                <hr />

                <Button variant="primary" className="w-100" onClick={() => setShowEditModal(true)}>
                  <Edit3 size={16} className="me-2" />
                  Edit Profile
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Profile Details */}
          <Col lg={8}>
            <Card>
              <Card.Body>
                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                  <Tab eventKey="profile" title="Profile Information">
                    <div className="mt-4">
                      <Row>
                        <Col md={6} className="mb-4">
                          <div className="d-flex align-items-center">
                            <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                              <User className="text-primary" size={20} />
                            </div>
                            <div>
                              <small className="text-muted">Full Name</small>
                              <p className="mb-0 fw-bold">{riderData.name}</p>
                            </div>
                          </div>
                        </Col>

                        <Col md={6} className="mb-4">
                          <div className="d-flex align-items-center">
                            <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                              <Mail className="text-info" size={20} />
                            </div>
                            <div>
                              <small className="text-muted">Email Address</small>
                              <p className="mb-0 fw-bold">{riderData.email}</p>
                            </div>
                          </div>
                        </Col>

                        <Col md={6} className="mb-4">
                          <div className="d-flex align-items-center">
                            <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                              <Phone className="text-success" size={20} />
                            </div>
                            <div>
                              <small className="text-muted">Phone Number</small>
                              <p className="mb-0 fw-bold">{riderData.phone}</p>
                            </div>
                          </div>
                        </Col>

                        <Col md={6} className="mb-4">
                          <div className="d-flex align-items-center">
                            <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                              <MapPin className="text-warning" size={20} />
                            </div>
                            <div>
                              <small className="text-muted">Address</small>
                              <p className="mb-0 fw-bold">{riderData.address}</p>
                            </div>
                          </div>
                        </Col>

                        <Col md={6} className="mb-4">
                          <div className="d-flex align-items-center">
                            <div className="bg-danger bg-opacity-10 p-2 rounded me-3">
                              <Calendar className="text-danger" size={20} />
                            </div>
                            <div>
                              <small className="text-muted">Join Date</small>
                              <p className="mb-0 fw-bold">{new Date(riderData.joinDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </Col>

                        <Col md={6} className="mb-4">
                          <div className="d-flex align-items-center">
                            <div className="bg-secondary bg-opacity-10 p-2 rounded me-3">
                              <Star className="text-secondary" size={20} />
                            </div>
                            <div>
                              <small className="text-muted">Average Rating</small>
                              <p className="mb-0 fw-bold">{riderData.rating}/5 ⭐</p>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </Tab>

                  <Tab eventKey="vehicle" title="Vehicle Information">
                    <div className="mt-4">
                      <Row>
                        <Col md={6} className="mb-4">
                          <div className="d-flex align-items-center">
                            <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                              <Truck className="text-primary" size={20} />
                            </div>
                            <div>
                              <small className="text-muted">Vehicle Type</small>
                              <p className="mb-0 fw-bold">{riderData.vehicleType}</p>
                            </div>
                          </div>
                        </Col>

                        <Col md={6} className="mb-4">
                          <div className="d-flex align-items-center">
                            <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                              <Shield className="text-info" size={20} />
                            </div>
                            <div>
                              <small className="text-muted">License Plate</small>
                              <p className="mb-0 fw-bold">{riderData.licensePlate}</p>
                            </div>
                          </div>
                        </Col>

                        <Col md={6} className="mb-4">
                          <div className="d-flex align-items-center">
                            <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                              <CreditCard className="text-success" size={20} />
                            </div>
                            <div>
                              <small className="text-muted">License Number</small>
                              <p className="mb-0 fw-bold">{riderData.licenseNumber}</p>
                            </div>
                          </div>
                        </Col>
                      </Row>

                      <Alert variant="info">
                        <strong>Vehicle Registration:</strong> Keep your vehicle documents up to date. 
                        Contact support if you need to update your vehicle information.
                      </Alert>
                    </div>
                  </Tab>

                  <Tab eventKey="security" title="Security">
                    <div className="mt-4">
                      <Card>
                        <Card.Body>
                          <h6 className="mb-3">Password & Security</h6>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                              <h6 className="mb-1">Password</h6>
                              <small className="text-muted">Last updated 30 days ago</small>
                            </div>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => setShowPasswordModal(true)}
                            >
                              <Lock size={14} className="me-1" />
                              Change Password
                            </Button>
                          </div>

                          <Alert variant="warning">
                            <strong>Security Tips:</strong>
                            <ul className="mb-0 mt-2">
                              <li>Use a strong password with at least 8 characters</li>
                              <li>Don't share your login credentials with anyone</li>
                              <li>Log out from shared devices</li>
                            </ul>
                          </Alert>
                        </Card.Body>
                      </Card>
                    </div>
                  </Tab>

                  <Tab eventKey="notifications" title="Notifications">
                    <div className="mt-4">
                      <Card>
                        <Card.Body>
                          <h6 className="mb-3">Notification Preferences</h6>
                          
                          <Form>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <div>
                                <h6 className="mb-1">Delivery Updates</h6>
                                <small className="text-muted">Get notified about new deliveries and updates</small>
                              </div>
                              <Form.Check 
                                type="switch"
                                checked={notifications.deliveryUpdates}
                                onChange={(e) => setNotifications({
                                  ...notifications,
                                  deliveryUpdates: e.target.checked
                                })}
                              />
                            </div>

                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <div>
                                <h6 className="mb-1">Payment Alerts</h6>
                                <small className="text-muted">Receive notifications about earnings and payments</small>
                              </div>
                              <Form.Check 
                                type="switch"
                                checked={notifications.paymentAlerts}
                                onChange={(e) => setNotifications({
                                  ...notifications,
                                  paymentAlerts: e.target.checked
                                })}
                              />
                            </div>

                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <div>
                                <h6 className="mb-1">Promotions</h6>
                                <small className="text-muted">Get notified about promotions and bonuses</small>
                              </div>
                              <Form.Check 
                                type="switch"
                                checked={notifications.promotions}
                                onChange={(e) => setNotifications({
                                  ...notifications,
                                  promotions: e.target.checked
                                })}
                              />
                            </div>

                            <div className="d-flex justify-content-between align-items-center mb-4">
                              <div>
                                <h6 className="mb-1">System Notifications</h6>
                                <small className="text-muted">Important system updates and maintenance</small>
                              </div>
                              <Form.Check 
                                type="switch"
                                checked={notifications.systemNotifications}
                                onChange={(e) => setNotifications({
                                  ...notifications,
                                  systemNotifications: e.target.checked
                                })}
                              />
                            </div>

                            <Button variant="primary" onClick={saveNotificationSettings}>
                              <Settings size={16} className="me-2" />
                              Save Preferences
                            </Button>
                          </Form>
                        </Card.Body>
                      </Card>
                    </div>
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Edit Profile Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Edit Profile</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Full Name</Form.Label>
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
                      type="tel"
                      defaultValue={riderData.phone}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      defaultValue={riderData.email}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      defaultValue={riderData.address}
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
            <Button variant="primary" onClick={() => handleProfileUpdate({})}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Change Password Modal */}
        <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Change Password</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Current Password</Form.Label>
                <Form.Control type="password" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>New Password</Form.Label>
                <Form.Control type="password" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Confirm New Password</Form.Label>
                <Form.Control type="password" />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => handlePasswordChange({})}>
              Update Password
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default RiderProfile;
