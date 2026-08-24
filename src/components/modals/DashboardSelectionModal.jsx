/**
 * Dashboard Selection Modal Component
 * Allows users with multiple roles to select their preferred dashboard
 */

"use client";
import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Building,
  CheckCircle2,
  Package,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import PropTypes from "prop-types";

// Icon mapping for different dashboard types
const DASHBOARD_ICONS = {
  "/admin/dashboard": ShieldCheck,
  "/sales/sales-manager-dashboard": Briefcase,
  "/sales/sales-agent-dashboard": Users,
  "/dc/dc-overview": Building,
  "/rider/rd-overview": Truck,
  "/vendor/vendor-overview": Package,
};

const ROLE_ACCENTS = {
  "/admin/dashboard": "admin",
  "/sales/sales-manager-dashboard": "sales-manager",
  "/sales/sales-agent-dashboard": "sales-agent",
  "/dc/dc-overview": "dc",
  "/rider/rd-overview": "rider",
  "/vendor/vendor-overview": "vendor",
};

const DashboardSelectionModal = ({ 
  show, 
  onHide, 
  dashboards = [], 
  onSelectDashboard,
  loading = false 
}) => {
  const [selectedDashboard, setSelectedDashboard] = useState(null);

  const handleDashboardSelect = (dashboard) => {
    setSelectedDashboard(dashboard);
  };

  const handleConfirmSelection = () => {
    if (selectedDashboard && onSelectDashboard) {
      onSelectDashboard(selectedDashboard);
    }
  };

  const getIconForDashboard = (route) => {
    const IconComponent = DASHBOARD_ICONS[route] || Settings;
    return <IconComponent size={28} strokeWidth={2.2} />;
  };

  const getDashboardMeta = (dashboard) => {
    const name = dashboard.displayName || "";
    const role = dashboard.roleName || "";
    const key = `${name} ${role}`.toLowerCase();

    if (key.includes("admin")) {
      return {
        label: "Full access",
        helper: "Manage users, operations, and system-wide controls.",
      };
    }

    if (key.includes("sales") && key.includes("manager")) {
      return {
        label: "Sales leadership",
        helper: "Track team performance, territories, and revenue activity.",
      };
    }

    if (key.includes("sales")) {
      return {
        label: "Field sales",
        helper: "Manage leads, customers, and daily sales activity.",
      };
    }

    if (key.includes("dc") || key.includes("distribution") || key.includes("operator")) {
      return {
        label: "Distribution center",
        helper: "Coordinate warehouse movement and package processing.",
      };
    }

    if (key.includes("vendor")) {
      return {
        label: "Vendor tools",
        helper: "Create packages, review customers, and monitor payments.",
      };
    }

    if (key.includes("rider")) {
      return {
        label: "Delivery workspace",
        helper: "View routes, deliveries, earnings, and rider activity.",
      };
    }

    if (key.includes("finance")) {
      return {
        label: "Finance",
        helper: "Review settlements, payments, and account activity.",
        icon: Wallet,
      };
    }

    return {
      label: "Workspace",
      helper: "Open the tools and reports assigned to this role.",
    };
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      backdrop="static"
      keyboard={false}
      size="lg"
      centered
      dialogClassName="dashboard-selection-dialog"
      contentClassName="dashboard-selection-modal"
    >
      <Modal.Header className="dashboard-selection-header">
        <Modal.Title className="dashboard-selection-title">
          <span className="dashboard-selection-title-icon">
            <BarChart3 size={22} strokeWidth={2.4} />
          </span>
          <span>Select Your Dashboard</span>
        </Modal.Title>
        <button
          type="button"
          className="dashboard-selection-close"
          aria-label="Cancel dashboard selection"
          onClick={onHide}
          disabled={loading}
        >
          <X size={18} strokeWidth={2.4} />
        </button>
      </Modal.Header>
      
      <Modal.Body className="dashboard-selection-body">
        <div className="dashboard-selection-intro">
          <div>
            <p className="dashboard-selection-eyebrow">Available workspaces</p>
            <p className="dashboard-selection-copy">
              Choose the dashboard you want to continue with for this session.
            </p>
          </div>
          <span className="dashboard-selection-count">
            {dashboards.length} {dashboards.length === 1 ? "option" : "options"}
          </span>
        </div>

        <div className="dashboard-selection-grid">
          {dashboards.map((dashboard, index) => {
            const isSelected = selectedDashboard?.route === dashboard.route;
            const meta = getDashboardMeta(dashboard);
            const accent = ROLE_ACCENTS[dashboard.route] || "default";
            const IconOverride = meta.icon;

            return (
              <button
                type="button"
                key={dashboard.roleCode || dashboard.route || index}
                className={`dashboard-option dashboard-option-${accent} ${
                  isSelected ? "is-selected" : ""
                }`}
                onClick={() => handleDashboardSelect(dashboard)}
                aria-pressed={isSelected}
              >
                <span className="dashboard-option-topline">
                  <span className="dashboard-option-icon">
                    {IconOverride ? (
                      <IconOverride size={28} strokeWidth={2.2} />
                    ) : (
                      getIconForDashboard(dashboard.route)
                    )}
                  </span>
                  <span className="dashboard-option-status">
                    {isSelected ? (
                      <>
                        <CheckCircle2 size={16} strokeWidth={2.4} />
                        Selected
                      </>
                    ) : (
                      "Choose"
                    )}
                  </span>
                </span>

                <span className="dashboard-option-content">
                  <span className="dashboard-option-name">
                    {dashboard.displayName}
                  </span>
                  <span className="dashboard-option-role">
                    {dashboard.roleName}
                  </span>
                  <span className="dashboard-option-helper">
                    {meta.helper}
                  </span>
                </span>

                <span className="dashboard-option-footer">
                  <span>{meta.label}</span>
                  <ArrowRight size={17} strokeWidth={2.4} />
                </span>
              </button>
            );
          })}
        </div>

        {dashboards.length === 0 && (
          <div className="dashboard-empty-state">
            <span>
              <Package size={34} strokeWidth={2} />
            </span>
            <h3>No dashboards available</h3>
            <p>Please contact your administrator for access.</p>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="dashboard-selection-footer">
        <div className="dashboard-selection-actions">
          <Button 
            variant="light"
            onClick={onHide}
            disabled={loading}
            className="dashboard-cancel-button"
          >
            Cancel
          </Button>
          
          <Button 
            variant="primary" 
            onClick={handleConfirmSelection}
            disabled={!selectedDashboard || loading}
            className="dashboard-continue-button"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Loading...
              </>
            ) : (
              'Continue to Dashboard'
            )}
          </Button>
        </div>
      </Modal.Footer>

      <style jsx>{`
        :global(.dashboard-selection-dialog) {
          max-width: 920px;
        }

        :global(.dashboard-selection-modal) {
          border: 0;
          border-radius: 22px;
          box-shadow: 0 24px 70px rgba(14, 23, 51, 0.28);
          overflow: hidden;
        }

        .dashboard-selection-header {
          align-items: center;
          background:
            linear-gradient(135deg, rgba(255, 102, 0, 0.1), rgba(18, 128, 118, 0.08)),
            #ffffff;
          border-bottom: 1px solid #eef1f7;
          padding: 20px 24px;
        }

        .dashboard-selection-title {
          align-items: center;
          color: #17264d;
          display: flex;
          font-size: 20px;
          font-weight: 800;
          gap: 12px;
          letter-spacing: 0;
          margin: 0;
        }

        .dashboard-selection-title-icon,
        .dashboard-option-icon,
        .dashboard-empty-state span {
          align-items: center;
          display: inline-flex;
          justify-content: center;
        }

        .dashboard-selection-title-icon {
          background: #ff6600;
          border-radius: 14px;
          box-shadow: 0 12px 24px rgba(255, 102, 0, 0.22);
          color: #ffffff;
          height: 44px;
          width: 44px;
        }

        .dashboard-selection-close {
          align-items: center;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid #e4e8f1;
          border-radius: 12px;
          color: #66708a;
          display: inline-flex;
          height: 38px;
          justify-content: center;
          margin-left: auto;
          transition: all 0.2s ease;
          width: 38px;
        }

        .dashboard-selection-close:hover:not(:disabled) {
          border-color: #ff6600;
          color: #ff6600;
        }

        .dashboard-selection-close:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .dashboard-selection-body {
          background: #fbfcff;
          padding: 18px 24px 6px;
        }

        .dashboard-selection-intro {
          align-items: center;
          display: flex;
          gap: 16px;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .dashboard-selection-eyebrow {
          color: #ff6600;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          margin: 0 0 4px;
          text-transform: uppercase;
        }

        .dashboard-selection-copy {
          color: #6f7892;
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
        }

        .dashboard-selection-count {
          background: #ffffff;
          border: 1px solid #e7ebf3;
          border-radius: 999px;
          color: #17264d;
          flex: 0 0 auto;
          font-size: 13px;
          font-weight: 700;
          padding: 8px 12px;
        }

        .dashboard-selection-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          padding: 2px 2px 12px;
        }

        .dashboard-option {
          background: #ffffff;
          border: 1px solid #e5e9f2;
          border-radius: 16px;
          box-shadow: 0 10px 28px rgba(25, 35, 64, 0.06);
          color: #17264d;
          display: flex;
          flex-direction: column;
          min-height: 150px;
          padding: 14px;
          position: relative;
          text-align: left;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }

        .dashboard-option::before {
          background: #ff6600;
          border-radius: 16px 0 0 16px;
          bottom: 12px;
          content: "";
          left: 0;
          position: absolute;
          top: 12px;
          width: 4px;
        }

        .dashboard-option:hover,
        .dashboard-option:focus-visible {
          border-color: rgba(255, 102, 0, 0.62);
          box-shadow: 0 16px 38px rgba(25, 35, 64, 0.12);
          outline: none;
          transform: translateY(-2px);
        }

        .dashboard-option.is-selected {
          background:
            linear-gradient(135deg, rgba(255, 102, 0, 0.1), rgba(255, 255, 255, 0) 54%),
            #ffffff;
          border-color: #ff6600;
          box-shadow: 0 18px 44px rgba(255, 102, 0, 0.17);
        }

        .dashboard-option-sales-manager::before,
        .dashboard-option-sales-agent::before {
          background: #128076;
        }

        .dashboard-option-dc::before {
          background: #3158c9;
        }

        .dashboard-option-vendor::before {
          background: #8a5cf6;
        }

        .dashboard-option-rider::before {
          background: #d97706;
        }

        .dashboard-option-topline,
        .dashboard-option-footer {
          align-items: center;
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .dashboard-option-icon {
          background: #fff4ec;
          border-radius: 12px;
          color: #ff6600;
          height: 42px;
          width: 42px;
        }

        .dashboard-option-sales-manager .dashboard-option-icon,
        .dashboard-option-sales-agent .dashboard-option-icon {
          background: #e9f8f6;
          color: #128076;
        }

        .dashboard-option-dc .dashboard-option-icon {
          background: #eef3ff;
          color: #3158c9;
        }

        .dashboard-option-vendor .dashboard-option-icon {
          background: #f4efff;
          color: #8a5cf6;
        }

        .dashboard-option-rider .dashboard-option-icon {
          background: #fff7ed;
          color: #d97706;
        }

        .dashboard-option-status {
          align-items: center;
          background: #f4f6fa;
          border-radius: 999px;
          color: #7b849b;
          display: inline-flex;
          font-size: 11px;
          font-weight: 800;
          gap: 5px;
          padding: 6px 8px;
        }

        .dashboard-option.is-selected .dashboard-option-status {
          background: #ff6600;
          color: #ffffff;
        }

        .dashboard-option-content {
          display: flex;
          flex: 1;
          flex-direction: column;
          padding: 11px 0;
        }

        .dashboard-option-name {
          color: #17264d;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.25;
          margin-bottom: 4px;
        }

        .dashboard-option-role {
          color: #8b94ac;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.35;
          margin-bottom: 7px;
        }

        .dashboard-option-helper {
          color: #5f6982;
          font-size: 12px;
          line-height: 1.35;
        }

        .dashboard-option-footer {
          border-top: 1px solid #eef1f7;
          color: #17264d;
          font-size: 12px;
          font-weight: 800;
          padding-top: 9px;
        }

        .dashboard-option-footer svg {
          color: #ff6600;
          transition: transform 0.2s ease;
        }

        .dashboard-option:hover .dashboard-option-footer svg,
        .dashboard-option.is-selected .dashboard-option-footer svg {
          transform: translateX(3px);
        }

        .dashboard-empty-state {
          align-items: center;
          background: #ffffff;
          border: 1px dashed #d8deeb;
          border-radius: 16px;
          color: #6f7892;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 240px;
          padding: 32px;
          text-align: center;
        }

        .dashboard-empty-state span {
          background: #f4f6fa;
          border-radius: 16px;
          color: #9aa3b8;
          height: 60px;
          margin-bottom: 14px;
          width: 60px;
        }

        .dashboard-empty-state h3 {
          color: #17264d;
          font-size: 18px;
          font-weight: 800;
          margin: 0 0 6px;
        }

        .dashboard-empty-state p {
          margin: 0;
        }

        .dashboard-selection-footer {
          background: #fbfcff;
          border-top: 1px solid #eef1f7;
          padding: 16px 24px 20px;
        }

        .dashboard-selection-actions {
          display: flex;
          gap: 12px;
          justify-content: space-between;
          width: 100%;
        }

        .dashboard-cancel-button,
        .dashboard-continue-button {
          align-items: center;
          border-radius: 12px;
          display: inline-flex;
          font-weight: 800;
          justify-content: center;
          min-height: 46px;
          padding: 10px 20px;
        }

        .dashboard-cancel-button {
          background: #ffffff;
          border: 1px solid #d8deeb;
          color: #17264d;
        }

        .dashboard-cancel-button:hover:not(:disabled) {
          background: #f6f8fb;
          border-color: #bfc7d9;
          color: #17264d;
        }

        .dashboard-continue-button {
          background: #ff6600;
          border-color: #ff6600;
          box-shadow: 0 14px 30px rgba(255, 102, 0, 0.24);
          min-width: 220px;
        }

        .dashboard-continue-button:hover:not(:disabled),
        .dashboard-continue-button:focus {
          background: #e85f05;
          border-color: #e85f05;
        }

        .dashboard-continue-button:disabled {
          background: #f0b184;
          border-color: #f0b184;
          box-shadow: none;
        }

        @media (max-width: 767.98px) {
          :global(.dashboard-selection-dialog) {
            margin: 12px;
          }

          .dashboard-selection-header,
          .dashboard-selection-body,
          .dashboard-selection-footer {
            padding-left: 18px;
            padding-right: 18px;
          }

          .dashboard-selection-intro,
          .dashboard-selection-actions {
            align-items: stretch;
            flex-direction: column;
          }

          .dashboard-selection-count {
            align-self: flex-start;
          }

          .dashboard-selection-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .dashboard-option {
            min-height: 148px;
            padding: 16px;
          }

          .dashboard-cancel-button,
          .dashboard-continue-button {
            width: 100%;
          }
        }

        @media (max-width: 420px) {
          .dashboard-selection-title {
            font-size: 18px;
          }

          .dashboard-option-name {
            font-size: 16px;
          }

          .dashboard-selection-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Modal>
  );
};

export default DashboardSelectionModal;

DashboardSelectionModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  dashboards: PropTypes.arrayOf(
    PropTypes.shape({
      route: PropTypes.string.isRequired,
      displayName: PropTypes.string.isRequired,
      roleName: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSelectDashboard: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};
