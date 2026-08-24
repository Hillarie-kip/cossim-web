"use client";
import React, { useState } from 'react';
import { Package, Users, DollarSign, Copy, ExternalLink, RefreshCw, Filter, TrendingUp, Target, Award, Share2 } from 'react-feather';
import useAgentDashboard from '@/hooks/useAgentDashboard';
import { AddVendorModal } from '@/components/modals';
import { useAdmin } from '@/hooks/useAdmin';
import vendorService from '@/services/vendorService';
import notify from '@/lib/toast';

export default function SalesAgentDashboard() {
  const [referralLink] = useState("https://app.cossim.co.ke/signup?vendor&ref=HILL-385");
  // Extract referral code from the link more robustly
  const referralCode = React.useMemo(() => {
    try {
      const url = new URL(referralLink);
      return url.searchParams.get('ref') || '';
    } catch {
      // Fallback to simple string splitting if URL parsing fails
      return referralLink.split('ref=')[1] || '';
    }
  }, [referralLink]);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);

  // Use the agent dashboard hook
  const { dashboardData, loading, error, refreshData, fetchDashboardData } = useAgentDashboard({
    recentTop: 10
  });

  // Use admin hook for distribution centers
  const { distributionCenters, fetchDistributionCenters, loading: dcLoading } = useAdmin();

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

  // Handle vendor creation
  const handleCreateVendor = async (vendorData) => {
    try {
      // Add the agent's referral code to the vendor data
      const payload = {
        ...vendorData,
        referralCode: referralCode, // Use the agent's referral code from the link
        countryCode: '254' // Default country code
      };

      const response = await vendorService.createVendor(payload);
      
      if (response && !response.Error) {
        setShowAddVendorModal(false);
        notify.success("Vendor created successfully.");
        // Refresh dashboard data to show updated stats
        refreshData();
      } else {
        notify.error(response?.Message || "Failed to create vendor");
      }
    } catch (error) {
      notify.error(error.message || "Failed to create vendor");
    }
  };

  // Handle opening vendor creation modal
  const handleOpenVendorModal = () => {
    setShowAddVendorModal(true);
    // Fetch distribution centers when modal opens
    fetchDistributionCenters();
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
            <h4>Welcome back, {summary.userCode || 'Agent'}</h4>
            <h6>Track your referral performance and commission earnings</h6>
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

      {/* Primary Stats Cards */}
      <div className="row">
        <div className="col-lg-3 col-sm-6 col-12">
          <div className="dash-widget">
            <div className="dash-widgetimg">
              <span><Target size={40} /></span>
            </div>
            <div className="dash-widgetcontent">
              <h5>{loading ? '...' : summary.activeCodes}</h5>
              <h6>Active Codes</h6>
              <p className="dash-widget-desc">Referral codes in use</p>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-sm-6 col-12">
          <div className="dash-widget">
            <div className="dash-widgetimg">
              <span><Users size={40} /></span>
            </div>
            <div className="dash-widgetcontent">
              <h5>{loading ? '...' : summary.activeVendors}</h5>
              <h6>Active Vendors</h6>
              <p className="dash-widget-desc">Currently active</p>
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
              <p className="dash-widget-desc">From your referrals</p>
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
              <h6>This Month</h6>
              <p className="dash-widget-desc">Commission earned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats Cards */}
      <div className="row">
        <div className="col-lg-4 col-sm-6 col-12">
          <div className="dash-widget dash-widget-color-2">
            <div className="dash-widgetimg">
              <span><Users size={40} /></span>
            </div>
            <div className="dash-widgetcontent">
              <h5>{loading ? '...' : summary.totalVendors}</h5>
              <h6>Total Vendors</h6>
              <p className="dash-widget-desc">All time referrals</p>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-sm-6 col-12">
          <div className="dash-widget dash-widget-color-3">
            <div className="dash-widgetimg">
              <span><TrendingUp size={40} /></span>
            </div>
            <div className="dash-widgetcontent">
              <h5>{loading ? '...' : summary.vendorsThisMonth}</h5>
              <h6>New This Month</h6>
              <p className="dash-widget-desc">Recent referrals</p>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-sm-6 col-12">
          <div className="dash-widget dash-widget-color-4">
            <div className="dash-widgetimg">
              <span><Award size={40} /></span>
            </div>
            <div className="dash-widgetcontent">
              <h5>{loading ? '...' : `KES ${summary.totalCommissionAllTime?.toLocaleString() || 0}`}</h5>
              <h6>All Time Earnings</h6>
              <p className="dash-widget-desc">Total commission</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create New Vendor and Referral Link */}
      <div className="row">
        <div className="col-lg-6 col-sm-12 col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">
                <Users size={20} className="me-2" />
                Create New Vendor
              </h5>
              <p className="card-desc">Sign up vendors directly and earn commission on their first package</p>
            </div>
            <div className="card-body">
              <button 
                className="btn btn-primary btn-lg w-100"
                onClick={handleOpenVendorModal}
              >
                <Users size={20} className="me-2" />
                Create Vendor Account
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-6 col-sm-12 col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">
                <ExternalLink size={20} className="me-2" />
                Referral Signup Link
              </h5>
              <p className="card-desc">Share this link for vendors to sign up with your referral code</p>
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
                When vendors sign up using this link, your referral code will be automatically applied
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Vendors and Shipments */}
      <div className="row">
        <div className="col-lg-6 col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="card-title">
                  <Users size={20} className="me-2" />
                  Recent Vendors
                </h5>
                <p className="card-desc">Latest vendors you've referred</p>
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
                        <th>Vendor</th>
                        <th>Status</th>
                        <th>Date Created</th>
                        <th>Packages</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentVendors.slice(0, 5).map((vendor, index) => (
                        <tr key={vendor.id || vendor.email || `vendor-${index}`}>
                          <td>
                            <div>
                              <strong>{vendor.name || `Vendor ${index + 1}`}</strong>
                              <br />
                              <small className="text-muted">{vendor.email || 'No email'}</small>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${vendor.isActive ? 'bg-success' : 'bg-secondary'}`}>
                              {vendor.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>{vendor.dateCreated ? new Date(vendor.dateCreated).toLocaleDateString() : 'N/A'}</td>
                          <td>{vendor.packageCount || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <Users size={64} className="text-muted mb-3" />
                  <h5 className="text-muted">No vendors yet</h5>
                  <p className="text-muted">Recent vendors will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-6 col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="card-title">
                  <Package size={20} className="me-2" />
                  Recent Shipments
                </h5>
                <p className="card-desc">Latest shipments from your vendors</p>
              </div>
              <button className="btn btn-outline-primary" onClick={handleRefresh}>
                <RefreshCw size={16} />
              </button>
            </div>
            <div className="card-body">
              {recentShipments.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Tracking No.</th>
                        <th>Vendor</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentShipments.slice(0, 5).map((shipment, index) => (
                        <tr key={shipment.id || shipment.trackingNumber || `shipment-${index}`}>
                          <td>
                            <strong>{shipment.trackingNumber || `TRK${index + 1}`}</strong>
                          </td>
                          <td>{shipment.vendorName || 'Unknown Vendor'}</td>
                          <td>
                            <span className={`badge ${shipment.status === 'Delivered' ? 'bg-success' : 
                              shipment.status === 'In Transit' ? 'bg-warning' : 'bg-info'}`}>
                              {shipment.status || 'Pending'}
                            </span>
                          </td>
                          <td>{shipment.date ? new Date(shipment.date).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <Package size={64} className="text-muted mb-3" />
                  <h5 className="text-muted">No recent shipments</h5>
                  <p className="text-muted">Recent shipments will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Quick Actions</h5>
              <p className="card-desc">Access key features from your dashboard</p>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-lg-4 col-md-6 col-12 mb-3">
                  <a href="/sales/sa-referral" className="text-decoration-none">
                    <div className="card h-100 border-primary">
                      <div className="card-body text-center">
                        <Users size={48} className="text-primary mb-3" />
                        <h6 className="card-title">Manage Referrals</h6>
                        <p className="card-text text-muted">Create vendors and track referral codes</p>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="col-lg-4 col-md-6 col-12 mb-3">
                  <a href="/sales/sa-packages" className="text-decoration-none">
                    <div className="card h-100 border-success">
                      <div className="card-body text-center">
                        <Package size={48} className="text-success mb-3" />
                        <h6 className="card-title">View Packages</h6>
                        <p className="card-text text-muted">Track shipments from your vendors</p>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="col-lg-4 col-md-6 col-12 mb-3">
                  <a href="/sales/sa-referral" className="text-decoration-none">
                    <div className="card h-100 border-info">
                      <div className="card-body text-center">
                        <DollarSign size={48} className="text-info mb-3" />
                        <h6 className="card-title">Commission Details</h6>
                        <p className="card-text text-muted">View detailed earnings breakdown</p>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Vendor Modal */}
      <AddVendorModal 
        show={showAddVendorModal} 
        onClose={() => setShowAddVendorModal(false)} 
        onSubmit={handleCreateVendor}
        referralCode={referralCode}
      />
    </div>
  );
}
