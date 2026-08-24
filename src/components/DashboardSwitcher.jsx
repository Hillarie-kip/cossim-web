/**
 * Dashboard Switcher Component
 * Allows users with multiple roles to switch between different dashboards
 */

"use client";
import React, { useState, useEffect } from "react";
import { Dropdown } from "react-bootstrap";
import { Monitor, ChevronDown } from "feather-icons-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getAvailableDashboards, 
  storeDashboardPreference,
  getDashboardPreference 
} from "@/utils/roleMapping";

const DashboardSwitcher = ({ className = "" }) => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [availableDashboards, setAvailableDashboards] = useState([]);
  const [currentDashboard, setCurrentDashboard] = useState(null);

  useEffect(() => {
    if (user?.AssignedRoles) {
      const dashboards = getAvailableDashboards(user.AssignedRoles);
      setAvailableDashboards(dashboards);

      // Find current dashboard based on pathname
      const current = dashboards.find(dashboard => 
        pathname.startsWith(dashboard.route)
      );
      setCurrentDashboard(current);
    }
  }, [user, pathname]);

  const handleDashboardSwitch = (dashboard) => {
    if (dashboard.route !== pathname) {
      // Store preference
      storeDashboardPreference(dashboard.route);
      
      // Navigate to new dashboard
      router.push(dashboard.route);
    }
  };

  // Don't show switcher if user has only one dashboard or no dashboards
  if (availableDashboards.length <= 1) {
    return null;
  }

  return (
    <Dropdown className={`dashboard-switcher ${className}`}>
      <Dropdown.Toggle
        variant="outline-primary"
        id="dashboard-switcher-dropdown"
        className="d-flex align-items-center border-0 bg-transparent text-dark"
        style={{ boxShadow: 'none' }}
      >
        <Monitor size={16} className="me-2" />
        <span className="me-2">
          {currentDashboard?.displayName || "Dashboard"}
        </span>
        <ChevronDown size={14} />
      </Dropdown.Toggle>

      <Dropdown.Menu className="shadow">
        <Dropdown.Header className="text-muted small">
          Switch Dashboard
        </Dropdown.Header>
        
        {availableDashboards.map((dashboard, index) => (
          <Dropdown.Item
            key={dashboard.roleCode || index}
            onClick={() => handleDashboardSwitch(dashboard)}
            active={currentDashboard?.route === dashboard.route}
            className="d-flex align-items-center py-2"
          >
            <Monitor size={14} className="me-2 text-primary" />
            <div>
              <div className="fw-medium">{dashboard.displayName}</div>
              <small className="text-muted">{dashboard.roleName}</small>
            </div>
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>

      <style jsx>{`
        .dashboard-switcher .dropdown-toggle::after {
          display: none;
        }
        
        .dashboard-switcher .dropdown-toggle:focus {
          box-shadow: none;
        }
        
        .dashboard-switcher .dropdown-item.active {
          background-color: var(--bs-primary);
          color: white;
        }
        
        .dashboard-switcher .dropdown-item.active .text-muted {
          color: rgba(255, 255, 255, 0.8) !important;
        }
        
        .dashboard-switcher .dropdown-item:hover {
          background-color: var(--bs-light);
        }
      `}</style>
    </Dropdown>
  );
};

export default DashboardSwitcher;
