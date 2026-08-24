/**
 * Example component demonstrating role-based functionality
 * This shows how to conditionally render content based on user roles
 */

"use client";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { hasRole } from "@/utils/roleMapping";
import { RoleType } from "@/constants/user-roles";
import { Card, Badge, Alert } from "react-bootstrap";
import { Shield, Users, Package, Truck } from "feather-icons-react";

const RoleBasedContentExample = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Alert variant="warning">
        <Shield className="me-2" size={16} />
        Please log in to view role-based content.
      </Alert>
    );
  }

  const userRoles = user.AssignedRoles || [];
  const isAdmin = hasRole(userRoles, RoleType.ADMIN);
  const isVendor = hasRole(userRoles, RoleType.VENDOR);
  const isRider = hasRole(userRoles, RoleType.RIDER);
  const isSalesAgent = hasRole(userRoles, RoleType.SALES_AGENT);

  return (
    <div className="role-based-content">
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <Shield className="me-2" size={20} />
            Your Role Information
          </h5>
        </Card.Header>
        <Card.Body>
          <p><strong>User:</strong> {user.FirstName} {user.LastName}</p>
          <p><strong>Assigned Roles:</strong></p>
          <div className="mb-3">
            {userRoles.map((role, index) => (
              <Badge 
                key={index} 
                bg="primary" 
                className="me-2 mb-2"
              >
                {role.RoleTypeName}
              </Badge>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Admin-only content */}
      {isAdmin && (
        <Card className="mb-4 border-success">
          <Card.Header className="bg-success text-white">
            <Users className="me-2" size={16} />
            Administrator Content
          </Card.Header>
          <Card.Body>
            <p>This content is only visible to administrators.</p>
            <ul>
              <li>User management</li>
              <li>System settings</li>
              <li>Analytics and reports</li>
            </ul>
          </Card.Body>
        </Card>
      )}

      {/* Vendor-only content */}
      {isVendor && (
        <Card className="mb-4 border-info">
          <Card.Header className="bg-info text-white">
            <Package className="me-2" size={16} />
            Vendor Content
          </Card.Header>
          <Card.Body>
            <p>This content is only visible to vendors.</p>
            <ul>
              <li>Package management</li>
              <li>Customer tracking</li>
              <li>Vendor profile settings</li>
            </ul>
          </Card.Body>
        </Card>
      )}

      {/* Rider-only content */}
      {isRider && (
        <Card className="mb-4 border-warning">
          <Card.Header className="bg-warning text-dark">
            <Truck className="me-2" size={16} />
            Rider Content
          </Card.Header>
          <Card.Body>
            <p>This content is only visible to riders.</p>
            <ul>
              <li>Delivery routes</li>
              <li>Earnings tracking</li>
              <li>Package pickup/delivery</li>
            </ul>
          </Card.Body>
        </Card>
      )}

      {/* Multi-role content */}
      {(isAdmin || isSalesAgent) && (
        <Card className="mb-4 border-secondary">
          <Card.Header className="bg-secondary text-white">
            Multi-Role Content
          </Card.Header>
          <Card.Body>
            <p>This content is visible to both administrators and sales agents.</p>
            <ul>
              <li>Sales reports</li>
              <li>Customer management</li>
              <li>Performance metrics</li>
            </ul>
          </Card.Body>
        </Card>
      )}

      {/* No special roles */}
      {!isAdmin && !isVendor && !isRider && !isSalesAgent && (
        <Alert variant="info">
          <p>You don't have any special roles assigned yet.</p>
          <p>Contact your administrator to get appropriate access permissions.</p>
        </Alert>
      )}
    </div>
  );
};

export default RoleBasedContentExample;
