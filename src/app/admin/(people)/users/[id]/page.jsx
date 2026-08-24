"use client"
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Row, Col, Badge, Button, Alert, Modal, Form, Table, Tab, Tabs } from "react-bootstrap";
import { ArrowLeft, User, Mail, Phone, Calendar, Shield, Activity, Edit3, Trash2, Settings, PlusCircle } from "feather-icons-react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import Link from "@/components/Link";
import { useAdmin } from "@/hooks/useAdmin";
import { AddUserRoleModal } from "@/components/modals";
import notify from "@/lib/toast";

const UserDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const MySwal = withReactContent(Swal);

  // State management
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Use admin hook for API calls
  const { handleAddUserRole: addUserRole } = useAdmin();

  useEffect(() => {
    // TODO: Replace with real API call to fetch user by ID
    // For now, we'll simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [params.id]);

  const handleDeleteUser = () => {
    MySwal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the user!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Yes, delete it!",
      cancelButtonColor: "#6c757d",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        notify.success("User has been deleted.");
        router.push('/admin/users');
      }
    });
  };

  const handleToggleStatus = () => {
    const newStatus = !userData.is_active;
    MySwal.fire({
      title: `${newStatus ? 'Activate' : 'Deactivate'} User?`,
      text: `This will ${newStatus ? 'activate' : 'deactivate'} the user account.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#28a745",
      confirmButtonText: `Yes, ${newStatus ? 'activate' : 'deactivate'}!`,
      cancelButtonColor: "#6c757d",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setUserData({...userData, is_active: newStatus});
        notify.success(`User has been ${newStatus ? 'activated' : 'deactivated'}.`);
      }
    });
  };

  const handleAddUserRole = async (roleData) => {
    try {
      await addUserRole(roleData);
      notify.success("User roles updated successfully.");
      // TODO: Refresh user data to show updated roles
    } catch (error) {
      notify.error(error.message || "Failed to update user roles");
    }
  };

  const handleShowRoleModal = () => {
    setShowRoleModal(true);
  };

  const getRoleBadge = (role) => {
    const roleMap = {
      admin: "danger",
      vendor: "primary",
      manager: "success",
      agent: "info",
      user: "secondary"
    };
    return roleMap[role] || "secondary";
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return Shield;
      case 'manager': return Settings;
      case 'vendor': return User;
      default: return User;
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

  if (!userData) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Alert variant="danger" className="text-center">
            <User size={48} className="mb-3" />
            <h4>User Not Found</h4>
            <p>The user you're looking for doesn't exist or has been removed.</p>
            <Link to="/admin/users" className="btn btn-primary">
              <ArrowLeft size={16} className="me-2" />
              Back to Users
            </Link>
          </Alert>
        </div>
      </div>
    );
  }

  const RoleIcon = getRoleIcon(userData.role);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>User Details</h4>
              <h6>{userData.full_name}</h6>
            </div>
          </div>
          <div className="page-btn d-flex gap-2">
            <Link to="/admin/users" className="btn btn-outline-secondary">
              <ArrowLeft size={16} className="me-2" />
              Back to Users
            </Link>
            <Button 
              variant={userData.is_active ? "warning" : "success"} 
              onClick={handleToggleStatus}
            >
              {userData.is_active ? "Deactivate" : "Activate"}
            </Button>
            <Button variant="primary" onClick={() => setShowEditModal(true)}>
              <Edit3 size={16} className="me-2" />
              Edit User
            </Button>
            <Button variant="secondary" onClick={handleShowRoleModal}>
              <PlusCircle size={16} className="me-2" />
              Add Role
            </Button>
            <Button variant="danger" onClick={handleDeleteUser}>
              <Trash2 size={16} className="me-2" />
              Delete
            </Button>
          </div>
        </div>

        <Row>
          {/* User Status Card */}
          <Col lg={12} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                      <RoleIcon className="text-primary" size={24} />
                    </div>
                    <div>
                      <h5 className="mb-1">Account Status</h5>
                      <div className="d-flex gap-2">
                        <Badge bg={userData.is_active ? "success" : "danger"} className="fs-6">
                          {userData.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge bg={getRoleBadge(userData.role)} className="fs-6">
                          {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <h6 className="text-muted mb-1">Member Since</h6>
                    <h6 className="mb-0">{new Date(userData.created_at).toLocaleDateString()}</h6>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* User Profile Card */}
          <Col lg={4} className="mb-4">
            <Card className="text-center">
              <Card.Body>
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "80px", height: "80px" }}>
                  <RoleIcon size={40} className="text-primary" />
                </div>
                <h4 className="mb-1">{userData.full_name}</h4>
                <p className="text-muted mb-3">{userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}</p>
                
                <div className="d-flex justify-content-center mb-3">
                  <Badge bg={userData.is_active ? "success" : "danger"} className="me-2">
                    {userData.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge bg={getRoleBadge(userData.role)}>
                    {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                  </Badge>
                </div>
                
                <hr />
                
                <div className="row text-center">
                  <div className="col-6">
                    <h6 className="mb-0">{new Date(userData.created_at).toLocaleDateString()}</h6>
                    <small className="text-muted">Join Date</small>
                  </div>
                  <div className="col-6">
                    <h6 className="mb-0">{new Date(userData.updated_at).toLocaleDateString()}</h6>
                    <small className="text-muted">Last Updated</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* User Information */}
          <Col lg={8} className="mb-4">
            <Card>
              <Card.Header>
                <h5 className="mb-0">User Information</h5>
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
                        <p className="mb-0 fw-bold">{userData.email}</p>
                      </div>
                    </div>
                    <div className="mb-3 d-flex align-items-center">
                      <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                        <Phone className="text-success" size={16} />
                      </div>
                      <div>
                        <small className="text-muted">Phone Number</small>
                        <p className="mb-0">{userData.phone || "Not provided"}</p>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3 d-flex align-items-center">
                      <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                        <Calendar className="text-info" size={16} />
                      </div>
                      <div>
                        <small className="text-muted">Created Date</small>
                        <p className="mb-0">{new Date(userData.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="mb-3 d-flex align-items-center">
                      <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                        <Activity className="text-warning" size={16} />
                      </div>
                      <div>
                        <small className="text-muted">Last Updated</small>
                        <p className="mb-0">{new Date(userData.updated_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </Col>
                </Row>

                <hr />

                <Row>
                  <Col md={12}>
                    <h6 className="mb-3">Role & Permissions</h6>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <Badge bg={getRoleBadge(userData.role)} className="p-2">
                        <RoleIcon size={16} className="me-1" />
                        {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="mb-3">
                      <h6 className="mb-2">Permissions Based on Role:</h6>
                      <ul className="list-unstyled small">
                        {userData.role === 'admin' && (
                          <>
                            <li>✅ Full system access</li>
                            <li>✅ User management</li>
                            <li>✅ System configuration</li>
                            <li>✅ Data export/import</li>
                          </>
                        )}
                        {userData.role === 'manager' && (
                          <>
                            <li>✅ Team management</li>
                            <li>✅ Reports access</li>
                            <li>✅ Package oversight</li>
                            <li>❌ System configuration</li>
                          </>
                        )}
                        {userData.role === 'vendor' && (
                          <>
                            <li>✅ Create packages</li>
                            <li>✅ Track shipments</li>
                            <li>✅ Manage deliveries</li>
                            <li>❌ User management</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* Tabs for detailed information */}
          <Col lg={12}>
            <Card>
              <Card.Body>
                <Tabs defaultActiveKey="activity" className="mb-3">
                  <Tab eventKey="activity" title="Activity Log">
                    <div className="timeline">
                      <div className="timeline-item">
                        <div className="timeline-marker bg-primary"></div>
                        <div className="timeline-content">
                          <h6 className="mb-1">Account Created</h6>
                          <p className="text-muted mb-1">{new Date(userData.created_at).toLocaleString()}</p>
                          <small className="text-muted">User account was created in the system</small>
                        </div>
                      </div>
                      {userData.updated_at && userData.updated_at !== userData.created_at && (
                        <div className="timeline-item">
                          <div className="timeline-marker bg-info"></div>
                          <div className="timeline-content">
                            <h6 className="mb-1">Profile Updated</h6>
                            <p className="text-muted mb-1">{new Date(userData.updated_at).toLocaleString()}</p>
                            <small className="text-muted">User profile information was updated</small>
                          </div>
                        </div>
                      )}
                      <div className="timeline-item">
                        <div className="timeline-marker bg-success"></div>
                        <div className="timeline-content">
                          <h6 className="mb-1">Status: Active</h6>
                          <p className="text-muted mb-1">Current Status</p>
                          <small className="text-muted">Account is currently {userData.is_active ? 'active' : 'inactive'}</small>
                        </div>
                      </div>
                    </div>
                  </Tab>
                  
                  <Tab eventKey="security" title="Security">
                    <Row>
                      <Col md={6}>
                        <h6 className="mb-3">Account Security</h6>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Account Status</span>
                            <Badge bg={userData.is_active ? "success" : "danger"}>
                              {userData.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Two-Factor Authentication</span>
                            <Badge bg="warning">Not Enabled</Badge>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Email Verified</span>
                            <Badge bg="success">Verified</Badge>
                          </div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <h6 className="mb-3">Login Information</h6>
                        <div className="mb-2">
                          <small className="text-muted">Last Login:</small>
                          <p className="mb-1">Not available</p>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted">Login Attempts:</small>
                          <p className="mb-1">0 failed attempts</p>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted">IP Address:</small>
                          <p className="mb-1">192.168.1.100</p>
                        </div>
                      </Col>
                    </Row>
                  </Tab>
                  
                  <Tab eventKey="settings" title="Account Settings">
                    <Row>
                      <Col md={6}>
                        <h6 className="mb-3">Profile Settings</h6>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Profile Visibility</span>
                            <Badge bg="info">Private</Badge>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Email Notifications</span>
                            <Badge bg="success">Enabled</Badge>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>SMS Notifications</span>
                            <Badge bg="secondary">Disabled</Badge>
                          </div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <h6 className="mb-3">Account Actions</h6>
                        <div className="d-grid gap-2">
                          <Button variant="outline-primary" size="sm">
                            Reset Password
                          </Button>
                          <Button variant="outline-warning" size="sm">
                            Suspend Account
                          </Button>
                          <Button variant="outline-info" size="sm">
                            Export Data
                          </Button>
                        </div>
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
            <Modal.Title>Edit User</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={userData.full_name}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      defaultValue={userData.email}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={userData.phone || ""}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Role</Form.Label>
                    <Form.Select defaultValue={userData.role}>
                      <option value="user">User</option>
                      <option value="vendor">Vendor</option>
                      <option value="agent">Agent</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select defaultValue={userData.is_active ? "active" : "inactive"}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
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
              notify.success("User updated successfully.");
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

      {/* Add User Role Modal */}
      <AddUserRoleModal
        show={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onSubmit={handleAddUserRole}
        userCode={params.id}
        currentRoles={userData?.AssignedRoles || []}
      />
    </div>
  );
};

export default UserDetailPage;
