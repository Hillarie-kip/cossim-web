"use client";

import React, { Suspense } from 'react';
import TrackingComponent from '@/components/TrackingComponent';

const PublicTrackPage = () => {
  const basePath = '/track';

  return (
    <div className="content">
      {/* Hero Section */}
      <div className="hero-section py-5 position-relative overflow-hidden d-flex align-items-center" style={{
        background: 'linear-gradient(135deg, #FF6200 0%, #FF8533 50%, #FFA366 100%)',
        minHeight: '500px',
        marginTop: '-1rem',
        marginBottom: '2rem'
      }}>
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-md-10 text-center text-white position-relative" style={{ zIndex: 2 }}>
              <div className="hero-icon mb-4" style={{
                fontSize: '4rem',
                animation: 'float 3s ease-in-out infinite'
              }}>
                <i className="feather-package"></i>
              </div>
              <h1 className="display-4 fw-bold mb-3" style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                lineHeight: '1.2'
              }}>
                Track Your Package
              </h1>
              <p className="lead mb-4" style={{
                maxWidth: '600px',
                margin: '0 auto 2rem',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                Get real-time updates on your package status and location.
                Simply enter your tracking number below to see the complete journey of your shipment.
              </p>
              <div className="d-flex justify-content-center flex-wrap gap-3 mb-4">
                <div className="badge text-white px-3 py-2 border border-white border-opacity-25 d-flex align-items-center">
                  <i className="feather-clock me-2"></i>
                  <span className="fw-medium">Real-time Updates</span>
                </div>
                <div className="badge text-white px-3 py-2 border border-white border-opacity-25 d-flex align-items-center">
                  <i className="feather-map-pin me-2"></i>
                  <span className="fw-medium">Location Tracking</span>
                </div>
                <div className="badge text-white px-3 py-2 border border-white border-opacity-25 d-flex align-items-center">
                  <i className="feather-shield me-2"></i>
                  <span className="fw-medium">Secure & Private</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Subtle texture overlay */}
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{
          backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/><circle cx="90" cy="40" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>')`,
          opacity: 0.3,
          pointerEvents: 'none'
        }}></div>
      </div>

      {/* Tracking Section */}
      <div className="py-5 bg-light">
        <div className="container-fluid">
          <Suspense fallback={<div className="text-center py-4">Loading tracking component...</div>}>
            <TrackingComponent
              basePath={basePath}
              title="Enter Tracking Number"
              placeholder="Enter your tracking number (e.g., ORD-123456789)..."
            />
          </Suspense>
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="py-4" style={{
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderTop: '1px solid #dee2e6'
      }}>
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-md-10">
              <div className="row text-center g-4">
                <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm" style={{
                    transition: 'all 0.3s ease',
                    borderRadius: '15px'
                  }}>
                    <div className="card-body p-4 position-relative">
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #FF6200, #FF8533)',
                        borderRadius: '15px 15px 0 0'
                      }}></div>
                      <div className="text-primary mb-3" style={{ fontSize: '2rem' }}>
                        <i className="feather-search"></i>
                      </div>
                      <h6 className="card-title fw-semibold mb-3">Easy Tracking</h6>
                      <p className="card-text text-muted small mb-0">
                        Track any package with just a tracking number
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm" style={{
                    transition: 'all 0.3s ease',
                    borderRadius: '15px'
                  }}>
                    <div className="card-body p-4 position-relative">
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #FF6200, #FF8533)',
                        borderRadius: '15px 15px 0 0'
                      }}></div>
                      <div className="text-success mb-3" style={{ fontSize: '2rem' }}>
                        <i className="feather-activity"></i>
                      </div>
                      <h6 className="card-title fw-semibold mb-3">Live Updates</h6>
                      <p className="card-text text-muted small mb-0">
                        Get instant notifications on status changes
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm" style={{
                    transition: 'all 0.3s ease',
                    borderRadius: '15px'
                  }}>
                    <div className="card-body p-4 position-relative">
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #FF6200, #FF8533)',
                        borderRadius: '15px 15px 0 0'
                      }}></div>
                      <div className="text-info mb-3" style={{ fontSize: '2rem' }}>
                        <i className="feather-globe"></i>
                      </div>
                      <h6 className="card-title fw-semibold mb-3">Global Coverage</h6>
                      <p className="card-text text-muted small mb-0">
                        Track packages across all locations
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* Immediate background application to prevent FOUC */
        .hero-section {
          background-color: #FF6200 !important;
        }
      `}</style>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .hero-section {
            min-height: 400px !important;
            padding: 3rem 0 !important;
          }

          .display-4 {
            font-size: 2rem !important;
          }

          .lead {
            font-size: 1rem !important;
            padding: 0 1rem !important;
          }
        }

        @media (max-width: 480px) {
          .display-4 {
            font-size: 1.75rem !important;
          }

          .badge {
            font-size: 0.8rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PublicTrackPage;
