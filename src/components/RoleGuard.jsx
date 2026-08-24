/**
 * Role-based route protection component
 */

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { hasRole, getAvailableDashboards } from "@/utils/roleMapping";
import { Spinner } from "react-bootstrap";

const RoleGuard = ({ 
  children, 
  allowedRoles = [], 
  redirectTo = "/signin", 
  fallback = null 
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const checkAccess = () => {
      setCheckingAccess(true);

      // If still loading auth status, wait
      if (loading) {
        return;
      }

      // If no user, redirect to login
      if (!user) {
        router.push(redirectTo);
        return;
      }

      // If no roles specified, allow access (basic auth check)
      if (allowedRoles.length === 0) {
        setHasAccess(true);
        setCheckingAccess(false);
        return;
      }

      // Check if user has any of the allowed roles
      const userRoles = user.AssignedRoles || [];
      const hasAnyAllowedRole = allowedRoles.some(role => 
        hasRole(userRoles, role)
      );

      if (hasAnyAllowedRole) {
        setHasAccess(true);
      } else {
        // User doesn't have required role, redirect to appropriate dashboard
        const availableDashboards = getAvailableDashboards(userRoles);
        if (availableDashboards.length > 0) {
          router.push(availableDashboards[0].route);
        } else {
          router.push(redirectTo);
        }
      }

      setCheckingAccess(false);
    };

    checkAccess();
  }, [user, loading, allowedRoles, redirectTo, router]);

  // Show loading spinner while checking access
  if (loading || checkingAccess) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  // Show fallback component if no access
  if (!hasAccess) {
    return fallback || (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
        <div className="text-center">
          <h5>Access Denied</h5>
          <p className="text-muted">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Render children if access is granted
  return children;
};

export default RoleGuard;
