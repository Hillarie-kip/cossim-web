"use client"
import React, { useState } from "react";
import { Card, Row, Col, Badge, Button, Modal, Form, Tab, Tabs } from "react-bootstrap";
import { FileText, Plus, Edit3, Eye, Clock, User, Shield } from "feather-icons-react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import notify from "@/lib/toast";

const PoliciesPage = () => {
  const MySwal = withReactContent(Swal);
  const [showModal, setShowModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [activeTab, setActiveTab] = useState("active");

  // Mock policies data
  const [policies] = useState([
    {
      id: 1,
      title: "Privacy Policy",
      type: "Privacy",
      status: "active",
      version: "v2.1",
      lastUpdated: "2025-01-15T10:30:00.000Z",
      updatedBy: "Admin User",
      description: "Outlines how we collect, use, and protect user data in compliance with GDPR and local regulations.",
      content: `
        <h3>1. Information We Collect</h3>
        <p>We collect information you provide directly to us, such as when you create an account...</p>
        
        <h3>2. How We Use Your Information</h3>
        <p>We use the information we collect to provide, maintain, and improve our services...</p>
        
        <h3>3. Information Sharing and Disclosure</h3>
        <p>We may share your information in certain circumstances as outlined below...</p>
      `,
      effectiveDate: "2025-02-01T00:00:00.000Z",
      applicableRegions: ["Kenya", "Tanzania", "Uganda"]
    },
    {
      id: 2,
      title: "Terms of Service",
      type: "Legal",
      status: "active",
      version: "v1.8",
      lastUpdated: "2025-01-10T14:20:00.000Z",
      updatedBy: "Legal Team",
      description: "Defines the terms and conditions for using our delivery platform and services.",
      content: `
        <h3>1. Acceptance of Terms</h3>
        <p>By accessing and using this service, you accept and agree to be bound by the terms...</p>
        
        <h3>2. Use License</h3>
        <p>Permission is granted to temporarily download one copy of the materials...</p>
        
        <h3>3. User Responsibilities</h3>
        <p>Users are responsible for maintaining the confidentiality of their account...</p>
      `,
      effectiveDate: "2025-01-15T00:00:00.000Z",
      applicableRegions: ["Kenya", "Tanzania"]
    },
    {
      id: 3,
      title: "Delivery Policy",
      type: "Operational",
      status: "active",
      version: "v3.2",
      lastUpdated: "2025-01-08T09:15:00.000Z",
      updatedBy: "Operations Team",
      description: "Guidelines for package handling, delivery timeframes, and customer responsibilities.",
      content: `
        <h3>1. Delivery Timeframes</h3>
        <p>Standard delivery is within 2-5 business days...</p>
        
        <h3>2. Package Requirements</h3>
        <p>All packages must be properly packaged and labeled...</p>
        
        <h3>3. Delivery Confirmation</h3>
        <p>Delivery confirmation requires recipient signature or OTP...</p>
      `,
      effectiveDate: "2025-01-10T00:00:00.000Z",
      applicableRegions: ["Kenya", "Tanzania", "Uganda", "Rwanda"]
    },
    {
      id: 4,
      title: "Refund Policy",
      type: "Financial",
      status: "draft",
      version: "v2.0",
      lastUpdated: "2025-01-05T16:45:00.000Z",
      updatedBy: "Finance Team",
      description: "Conditions and procedures for refunds and compensation claims.",
      content: `
        <h3>1. Refund Eligibility</h3>
        <p>Refunds may be issued under the following circumstances...</p>
        
        <h3>2. Processing Time</h3>
        <p>Approved refunds will be processed within 5-10 business days...</p>
      `,
      effectiveDate: null,
      applicableRegions: ["Kenya"]
    },
    {
      id: 5,
      title: "Data Retention Policy",
      type: "Privacy",
      status: "archived",
      version: "v1.5",
      lastUpdated: "2024-12-20T11:30:00.000Z",
      updatedBy: "IT Team",
      description: "Previous version of our data retention guidelines (replaced by Privacy Policy v2.1).",
      content: `
        <h3>1. Data Categories</h3>
        <p>We categorize data into different types for retention purposes...</p>
      `,
      effectiveDate: "2024-12-25T00:00:00.000Z",
      applicableRegions: ["Kenya", "Tanzania"]
    }
  ]);

  const getStatusBadge = (status) => {
    const statusMap = {
      active: "success",
      draft: "warning", 
      archived: "secondary",
      expired: "danger"
    };
    return statusMap[status] || "secondary";
  };

  const getTypeBadge = (type) => {
    const typeMap = {
      Privacy: "info",
      Legal: "primary",
      Operational: "success",
      Financial: "warning"
    };
    return typeMap[type] || "secondary";
  };

  const handleViewPolicy = (policy) => {
    setSelectedPolicy(policy);
    setShowModal(true);
  };

  const handleDeletePolicy = (policyId) => {
    MySwal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the policy!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Yes, delete it!",
      cancelButtonColor: "#6c757d",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        notify.success("Policy has been deleted.");
      }
    });
  };

  const filterPoliciesByStatus = (status) => {
    if (status === "active") return policies.filter(p => p.status === "active");
    if (status === "draft") return policies.filter(p => p.status === "draft");
    if (status === "archived") return policies.filter(p => p.status === "archived");
    return policies;
  };

  const PolicyCard = ({ policy }) => (
    <Card className="mb-3">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h5 className="mb-1 d-flex align-items-center">
              <FileText size={18} className="me-2" />
              {policy.title}
              <Badge bg={getTypeBadge(policy.type)} className="ms-2 small">
                {policy.type}
              </Badge>
            </h5>
            <p className="text-muted small mb-2">{policy.description}</p>
          </div>
          <Badge bg={getStatusBadge(policy.status)}>
            {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
          </Badge>
        </div>
        
        <Row className="small text-muted mb-3">
          <Col md={6}>
            <div className="d-flex align-items-center mb-1">
              <Shield size={14} className="me-1" />
              Version: {policy.version}
            </div>
            <div className="d-flex align-items-center">
              <Clock size={14} className="me-1" />
              Updated: {new Date(policy.lastUpdated).toLocaleDateString()}
            </div>
          </Col>
          <Col md={6}>
            <div className="d-flex align-items-center mb-1">
              <User size={14} className="me-1" />
              By: {policy.updatedBy}
            </div>
            {policy.effectiveDate && (
              <div className="d-flex align-items-center">
                <Clock size={14} className="me-1" />
                Effective: {new Date(policy.effectiveDate).toLocaleDateString()}
              </div>
            )}
          </Col>
        </Row>
        
        <div className="mb-3">
          <small className="text-muted">Applicable Regions: </small>
          {policy.applicableRegions.map((region, index) => (
            <Badge key={index} bg="light" text="dark" className="me-1 small">
              {region}
            </Badge>
          ))}
        </div>
        
        <div className="d-flex gap-2">
          <Button size="sm" variant="outline-primary" onClick={() => handleViewPolicy(policy)}>
            <Eye size={14} className="me-1" />
            View
          </Button>
          <Button size="sm" variant="outline-secondary">
            <Edit3 size={14} className="me-1" />
            Edit
          </Button>
          {policy.status !== "active" && (
            <Button size="sm" variant="outline-danger" onClick={() => handleDeletePolicy(policy.id)}>
              Delete
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );

  return (
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Policies & Legal</h4>
              <h6>Manage company policies, terms, and legal documents</h6>
            </div>
          </div>
          <div className="page-btn">
            <Button variant="primary">
              <Plus size={16} className="me-2" />
              Create Policy
            </Button>
          </div>
        </div>

        <Row>
          <Col lg={12}>
            <Card>
              <Card.Body>
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k)}
                  className="mb-4"
                >
                  <Tab 
                    eventKey="active" 
                    title={
                      <span>
                        Active Policies 
                        <Badge bg="success" className="ms-2">
                          {filterPoliciesByStatus("active").length}
                        </Badge>
                      </span>
                    }
                  >
                    {filterPoliciesByStatus("active").map(policy => (
                      <PolicyCard key={policy.id} policy={policy} />
                    ))}
                  </Tab>
                  
                  <Tab 
                    eventKey="draft" 
                    title={
                      <span>
                        Drafts 
                        <Badge bg="warning" className="ms-2">
                          {filterPoliciesByStatus("draft").length}
                        </Badge>
                      </span>
                    }
                  >
                    {filterPoliciesByStatus("draft").map(policy => (
                      <PolicyCard key={policy.id} policy={policy} />
                    ))}
                  </Tab>
                  
                  <Tab 
                    eventKey="archived" 
                    title={
                      <span>
                        Archived 
                        <Badge bg="secondary" className="ms-2">
                          {filterPoliciesByStatus("archived").length}
                        </Badge>
                      </span>
                    }
                  >
                    {filterPoliciesByStatus("archived").map(policy => (
                      <PolicyCard key={policy.id} policy={policy} />
                    ))}
                  </Tab>
                  
                  <Tab 
                    eventKey="all" 
                    title={
                      <span>
                        All Policies 
                        <Badge bg="info" className="ms-2">
                          {policies.length}
                        </Badge>
                      </span>
                    }
                  >
                    {policies.map(policy => (
                      <PolicyCard key={policy.id} policy={policy} />
                    ))}
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Policy View Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title className="d-flex align-items-center">
              <FileText size={20} className="me-2" />
              {selectedPolicy?.title}
              <Badge bg={getTypeBadge(selectedPolicy?.type)} className="ms-2">
                {selectedPolicy?.type}
              </Badge>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedPolicy && (
              <>
                <div className="mb-3 p-3 bg-light rounded">
                  <Row className="small">
                    <Col md={6}>
                      <strong>Version:</strong> {selectedPolicy.version}<br />
                      <strong>Status:</strong> <Badge bg={getStatusBadge(selectedPolicy.status)} className="small">
                        {selectedPolicy.status}
                      </Badge><br />
                      <strong>Last Updated:</strong> {new Date(selectedPolicy.lastUpdated).toLocaleString()}
                    </Col>
                    <Col md={6}>
                      <strong>Updated By:</strong> {selectedPolicy.updatedBy}<br />
                      {selectedPolicy.effectiveDate && (
                        <>
                          <strong>Effective Date:</strong> {new Date(selectedPolicy.effectiveDate).toLocaleDateString()}<br />
                        </>
                      )}
                      <strong>Regions:</strong> {selectedPolicy.applicableRegions.join(', ')}
                    </Col>
                  </Row>
                </div>
                
                <div dangerouslySetInnerHTML={{ __html: selectedPolicy.content }} />
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
            <Button variant="primary">
              <Edit3 size={16} className="me-2" />
              Edit Policy
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
  );
};

export default PoliciesPage;
