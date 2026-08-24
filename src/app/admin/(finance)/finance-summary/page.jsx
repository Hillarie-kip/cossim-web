'use client';

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useFinance } from '@/hooks/useFinance';
import DashCard from '@/components/cards/DashCard';
import { AlertCircle } from 'feather-icons-react';

export default function FinanceSummaryPage() {
  const {
    summaryDashboard,
    loading,
    error,
    fetchSummaryDashboard,
    clearError
  } = useFinance();

  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    vendorCode: '',
    dcCode: '',
    verifiedOnly: false
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchSummaryDashboard(filters);
  }, []);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    fetchSummaryDashboard(filters);
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      fromDate: '',
      toDate: '',
      vendorCode: '',
      dcCode: '',
      verifiedOnly: false
    });
    fetchSummaryDashboard({});
  };

  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  // Loading state
  if (loading && !summaryDashboard) {
    return (
      <div className="content">
        <div className="container-fluid">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <Spinner animation="border" variant="primary" />
            <span className="ms-2">Loading finance summary...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="container-fluid">
        {/* Page Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-title-box d-flex align-items-center justify-content-between">
              <h4 className="mb-0">Finance Summary</h4>
              <div className="page-title-right">
                <button
                  className="btn btn-primary"
                  onClick={() => fetchSummaryDashboard(filters)}
                  disabled={loading}
                >
                  {loading ? <Spinner size="sm" className="me-2" /> : null}
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="row mb-4">
            <div className="col-12">
              <Alert variant="danger" dismissible onClose={clearError}>
                <AlertCircle size={16} className="me-2" />
                {error}
              </Alert>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="row mb-4">
          <div className="col-12">
            <Card>
              <Card.Header>
                <h5 className="mb-0">Filters</h5>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={3}>
                    <label className="form-label">From Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={filters.fromDate}
                      onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                    />
                  </Col>
                  <Col md={3}>
                    <label className="form-label">To Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={filters.toDate}
                      onChange={(e) => handleFilterChange('toDate', e.target.value)}
                    />
                  </Col>
                  <Col md={2}>
                    <label className="form-label">Vendor Code</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Vendor Code"
                      value={filters.vendorCode}
                      onChange={(e) => handleFilterChange('vendorCode', e.target.value)}
                    />
                  </Col>
                  <Col md={2}>
                    <label className="form-label">DC Code</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="DC Code"
                      value={filters.dcCode}
                      onChange={(e) => handleFilterChange('dcCode', e.target.value)}
                    />
                  </Col>
                  <Col md={2} className="d-flex align-items-end">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="verifiedOnly"
                        checked={filters.verifiedOnly}
                        onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="verifiedOnly">
                        Verified Only
                      </label>
                    </div>
                  </Col>
                </Row>
                <div className="mt-3">
                  <button
                    className="btn btn-primary me-2"
                    onClick={handleApplyFilters}
                    disabled={loading}
                  >
                    Apply Filters
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={handleClearFilters}
                    disabled={loading}
                  >
                    Clear Filters
                  </button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Summary Cards */}
        {summaryDashboard && (
          <>
            {/* Platform Fees Section */}
            <div className="row mb-4">
              <div className="col-12">
                <h5 className="mb-3">Platform Fees</h5>
              </div>
              <DashCard
                title="Fees Billed"
                value={summaryDashboard.platformFeesBilled || 0}
                icon="fe fe-dollar-sign"
                className="bg-primary-transparent"
                textColor="primary"
              />
              <DashCard
                title="Fees Collected"
                value={summaryDashboard.platformFeesCollected || 0}
                icon="fe fe-trending-up"
                className="bg-success-transparent"
                textColor="success"
              />
              <DashCard
                title="Fees Outstanding"
                value={summaryDashboard.platformFeesOutstanding || 0}
                icon="fe fe-alert-circle"
                className="bg-warning-transparent"
                textColor="warning"
              />
              <DashCard
                title="Total Payments"
                value={summaryDashboard.totalPaymentsCollected || 0}
                icon="fe fe-credit-card"
                className="bg-info-transparent"
                textColor="info"
              />
            </div>

            {/* Vendor COD Section */}
            <div className="row mb-4">
              <div className="col-12">
                <h5 className="mb-3">Vendor COD (Cash on Delivery)</h5>
              </div>
              <DashCard
                title="COD Required"
                value={summaryDashboard.vendorCODRequired || 0}
                icon="fe fe-package"
                className="bg-secondary-transparent"
                textColor="secondary"
              />
              <DashCard
                title="COD Collected"
                value={summaryDashboard.vendorCODCollected || 0}
                icon="fe fe-trending-up"
                className="bg-success-transparent"
                textColor="success"
              />
              <DashCard
                title="COD Settled"
                value={summaryDashboard.vendorCODSettled || 0}
                icon="fe fe-credit-card"
                className="bg-info-transparent"
                textColor="info"
              />
              <DashCard
                title="COD Uncollected"
                value={summaryDashboard.vendorCODUncollected || 0}
                icon="fe fe-alert-circle"
                className="bg-danger-transparent"
                textColor="danger"
              />
            </div>

            {/* Additional COD Metrics */}
            <div className="row mb-4">
              <div className="col-12">
                <h5 className="mb-3">Additional COD Metrics</h5>
              </div>
              <DashCard
                title="COD Unsettled"
                value={summaryDashboard.vendorCODUnsettled || 0}
                icon="fe fe-trending-down"
                className="bg-warning-transparent"
                textColor="warning"
              />
            </div>

            {/* Summary Table */}
            <div className="row">
              <div className="col-12">
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Financial Summary Details</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Metric</th>
                            <th>Value</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Platform Fees Billed</td>
                            <td className="fw-bold">{formatCurrency(summaryDashboard.platformFeesBilled)}</td>
                            <td><span className="badge bg-primary">Billed</span></td>
                          </tr>
                          <tr>
                            <td>Platform Fees Collected</td>
                            <td className="fw-bold text-success">{formatCurrency(summaryDashboard.platformFeesCollected)}</td>
                            <td><span className="badge bg-success">Collected</span></td>
                          </tr>
                          <tr>
                            <td>Platform Fees Outstanding</td>
                            <td className="fw-bold text-warning">{formatCurrency(summaryDashboard.platformFeesOutstanding)}</td>
                            <td><span className="badge bg-warning">Outstanding</span></td>
                          </tr>
                          <tr>
                            <td>Vendor COD Required</td>
                            <td className="fw-bold">{formatCurrency(summaryDashboard.vendorCODRequired)}</td>
                            <td><span className="badge bg-secondary">Required</span></td>
                          </tr>
                          <tr>
                            <td>Vendor COD Collected</td>
                            <td className="fw-bold text-success">{formatCurrency(summaryDashboard.vendorCODCollected)}</td>
                            <td><span className="badge bg-success">Collected</span></td>
                          </tr>
                          <tr>
                            <td>Vendor COD Settled</td>
                            <td className="fw-bold text-info">{formatCurrency(summaryDashboard.vendorCODSettled)}</td>
                            <td><span className="badge bg-info">Settled</span></td>
                          </tr>
                          <tr>
                            <td>Vendor COD Uncollected</td>
                            <td className="fw-bold text-danger">{formatCurrency(summaryDashboard.vendorCODUncollected)}</td>
                            <td><span className="badge bg-danger">Uncollected</span></td>
                          </tr>
                          <tr>
                            <td>Vendor COD Unsettled</td>
                            <td className="fw-bold text-warning">{formatCurrency(summaryDashboard.vendorCODUnsettled)}</td>
                            <td><span className="badge bg-warning">Unsettled</span></td>
                          </tr>
                          <tr className="table-primary">
                            <td><strong>Total Payments Collected</strong></td>
                            <td className="fw-bold text-primary">{formatCurrency(summaryDashboard.totalPaymentsCollected)}</td>
                            <td><span className="badge bg-primary">Total</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
          </>
        )}

        {/* No Data State */}
        {!loading && !summaryDashboard && !error && (
          <div className="row">
            <div className="col-12">
              <Card className="text-center py-5">
                <Card.Body>
                  <AlertCircle size={48} className="text-muted mb-3" />
                  <h5>No Finance Summary Data</h5>
                  <p className="text-muted">No financial summary data is available at the moment.</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => fetchSummaryDashboard(filters)}
                  >
                    Load Data
                  </button>
                </Card.Body>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
