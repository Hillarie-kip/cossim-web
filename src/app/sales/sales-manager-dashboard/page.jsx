"use client";
import React, { useState } from 'react';
import { Package, Users, DollarSign, Copy, ExternalLink, RefreshCw, Filter, TrendingUp, Target, Award } from 'react-feather';
import useAgentDashboard from '@/hooks/useAgentDashboard';

export default function SalesManagerDashboard() {
  const [referralLink] = useState("https://app.cossim.co.ke/signup?manager&ref=MGR-385");
  const [referralCode] = useState("MGR-825");
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Use the agent dashboard hook (can be customized for managers)
  const { dashboardData, loading, error, refreshData, fetchDashboardData } = useAgentDashboard({
    recentTop: 10
  });

  // Get dashboard summary with fallback values
  const summary = dashboardData?.Summary || {
    userCode: "",
    activeCodes: 0,
    totalCodes: 0,
    totalVendors: 0,
    activeVendors: 0,
    vendorsThisMonth: 0,
    totalPackages: 0,
    commissionThisMonth: 0,
    totalCommissionAllTime: 0
  };

  const recentVendors = dashboardData?.RecentVendorArray || [];   
  const recentShipments = dashboardData?.RecentShipmentArray || [];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleDateRangeChange = (field, value) => {
    const newDateRange = { ...dateRange, [field]: value };
    setDateRange(newDateRange);

    // Fetch data with new date range
    if (newDateRange.startDate && newDateRange.endDate) {
      fetchDashboardData(newDateRange);
    }
  };

  const handleRefresh = () => {
    refreshData();
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  return (
    <div className="content">
      {/* Loading Overlay */}
      {loading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
             style={{ backgroundColor: 'rgba(0,0,0,0.1)', zIndex: 1050 }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="add-item d-flex">
          <div className="page-title">
            <h4>Welcome back, Sales Manager</h4>
            <h6>Manage your sales team and track performance metrics</h6>
          </div>
        </div>
        <ul className="table-top-head">
          <li>
            <div className="page-btn">
              <button
                className="btn btn-secondary"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw size={16} className={`me-2 ${loading ? 'fa-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </li>
          <li>
            <Filter size={16} className="me-2" />
            <input
              type="date"
              className="form-control"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              placeholder="Start Date"
            />
          </li>
          <li>
            <input
              type="date"
              className="form-control"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              placeholder="End Date"
            />
          </li>
        </ul>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <strong>Success!</strong> Dashboard data refreshed successfully.
          <button type="button" className="btn-close" onClick={() => setShowSuccessMessage(false)}></button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Manager-Specific Stats Cards */}
      <div className="row">
        <div className="col-lg-3 col-sm-6 col-12">
          <div className="dash-widget">
            <div className="dash-widgetimg">
              <span><Users size={40} /></span>
            </div>
            <div className="dash-widgetcontent">
              <h5>{loading ? '...' : summary.activeCodes}</h5>
              <h6>Active Codes</h6>
              <p className="dash-widget-desc">Currently active referral codes</p>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-sm-6 col-12">
          <div className="dash-widget">
            <div className="dash-widgetimg">
              <span><Target size={40} /></span>
            </div>
            <div className="dash-widgetcontent">
              <h5>{loading ? '...' : summary.totalCodes}</h5>
              <h6>Total Codes</h6>
              <p className="dash-widget-desc">Total referral codes created</p>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-sm-6 col-12">
          <div className="dash-widget">
            <div className="dash-widgetimg">
              <span><Package size={40} /></span>
            </div>
            <div className="dash-widgetcontent">
              <h5>{loading ? '...' : summary.totalPackages}</h5>
              <h6>Total Packages</h6>
              <p className="dash-widget-desc">From team referrals</p>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-sm-6 col-12">
          <div className="dash-widget">
            <div className="dash-widgetimg">
              <span><DollarSign size={40} /></span>
            </div>
            <div className="dash-widgetcontent">
              <h5>{loading ? '...' : `KES ${summary.commissionThisMonth?.toLocaleString() || 0}`}</h5>
              <h6>Commission</h6>
              <p className="dash-widget-desc">This month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Manager Stats */}
      <div className="row">
        <div className="col-lg-4 col-sm-6 col-12">
          <div className="dash-widget dash-widget-color-2">
            <div className="dash-widgetimg">
              <span><Users size={40} /></span>
            </div>
            <div className="dash-widgetcontent">
              <h5>{loading ? '...' : summary.totalVendors}</h5>
              <h6>Total Vendors</h6>
              <p className="dash-widget-desc">Referred by team</p>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-sm-6 col-12">
          <div className="dash-widget dash-widget-color-3">
            <div className="dash-widgetimg">
              <span><Award size={40} /></span>
            </div>
            <div className="dash-widgetcontent">
              <h5>{loading ? '...' : summary.activeVendors}</h5>
              <h6>Active Vendors</h6>
              <p className="dash-widget-desc">Currently active</p>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-sm-6 col-12">
          <div className="dash-widget dash-widget-color-4">
            <div className="dash-widgetimg">
              <span><TrendingUp size={40} /></span>
            </div>
            <div className="dash-widgetcontent">
              <h5>{loading ? '...' : `KES ${summary.totalCommissionAllTime?.toLocaleString() || 0}`}</h5>
              <h6>Total Commission</h6>
              <p className="dash-widget-desc">All time earnings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Team Management */}
        <div className="col-lg-6 col-sm-12 col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">
                <Users size={20} className="me-2" />
                Team Management
              </h5>
              <p className="card-desc">Manage your sales agents and monitor performance</p>
            </div>
            <div className="card-body">
              <button className="btn btn-primary btn-lg w-100 mb-3">
                <Users size={20} className="me-2" />
                Add New Sales Agent
              </button>
              <button className="btn btn-outline-primary btn-lg w-100">
                <Target size={20} className="me-2" />
                View Team Performance
              </button>
            </div>
          </div>
        </div>

        {/* Referral Management */}
        <div className="col-lg-6 col-sm-12 col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">
                <ExternalLink size={20} className="me-2" />
                Manager Referral Program
              </h5>
              <p className="card-desc">Share this link to recruit new sales agents</p>
            </div>
            <div className="card-body">
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  value={referralLink}
                  readOnly
                />
              </div>
              <div className="row">
                <div className="col-6">
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => copyToClipboard(referralLink)}
                  >
                    <Copy size={16} className="me-2" />
                    Copy Link
                  </button>
                </div>
                <div className="col-6">
                  <button className="btn btn-outline-primary w-100">
                    <ExternalLink size={16} className="me-2" />
                    Test
                  </button>
                </div>
              </div>
              <small className="text-muted mt-2 d-block">
                When agents sign up using this link, they'll be assigned to your team
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* My Referral Codes */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">
                <Package size={20} className="me-2" />
                My Manager Codes
              </h5>
              <p className="card-desc">Share these codes with potential sales agents</p>
            </div>
            <div className="card-body">
              <div className="referral-code-item d-flex justify-content-between align-items-center p-3 border rounded mb-3">
                <div>
                  <span className="badge bg-primary me-2">{summary.userCode || referralCode}</span>
                  <span className="text-success">Active</span>
                  <small className="text-muted d-block">{summary.activeCodes} active codes</small>
                </div>
                <div>
                  <button
                    className="btn btn-outline-primary btn-sm me-2"
                    onClick={() => copyToClipboard(summary.userCode || referralCode)}
                  >
                    <Copy size={14} className="me-1" />
                    Copy Code
                  </button>
                  <button className="btn btn-outline-secondary btn-sm">
                    <ExternalLink size={14} className="me-1" />
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="row">
        <div className="col-lg-6 col-sm-12 col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="card-title">
                  <Users size={20} className="me-2" />
                  Recent Vendors
                </h5>
                <p className="card-desc">Recently referred vendors</p>
              </div>
              <button className="btn btn-outline-primary" onClick={handleRefresh} disabled={loading}>
                <RefreshCw size={16} className={loading ? 'fa-spin' : ''} />
              </button>
            </div>
            <div className="card-body">
              {recentVendors.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Vendor Name</th>
                        <th>Code</th>
                        <th>Packages</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentVendors.map((vendor, index) => (
                        <tr key={index}>
                          <td>{vendor.VendorName || 'N/A'}</td>
                          <td>{vendor.VendorCode || 'N/A'}</td>
                          <td>{vendor.TotalPackages || 0}</td>
                          <td>
                            <span className={`badge ${vendor.IsActive ? 'bg-success' : 'bg-secondary'}`}>
                              {vendor.IsActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">No recent vendors found.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-6 col-sm-12 col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">
                <Package size={20} className="me-2" />
                Recent Shipments
              </h5>
              <p className="card-desc">Recent package shipments</p>
            </div>
            <div className="card-body">
              {recentShipments.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Order NO</th>
                        <th>Vendor</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentShipments.map((shipment, index) => (
                        <tr key={index}>
                          <td>{shipment.OrderNO || 'N/A'}</td>
                          <td>{shipment.VendorName || 'N/A'}</td>
                          <td>
                            <span className="badge bg-primary">{shipment.StatusName || 'N/A'}</span>
                          </td>
                          <td>{shipment.DateAdded ? new Date(shipment.DateAdded).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">No recent shipments found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
