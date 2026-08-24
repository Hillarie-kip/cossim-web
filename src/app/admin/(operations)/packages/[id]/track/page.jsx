"use client";

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from '@/components/Link';
import TrackingComponent from '@/components/TrackingComponent';

const AdminPackageTrack = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id;
  const basePath = `/admin/packages/${id}/track`;
  const fromDashboard = searchParams.get('from') === 'dashboard';

  const backButton = (
    <Link to={fromDashboard ? '/admin/dashboard' : `/admin/packages/${id}`} className="btn btn-outline-primary">
      <i className="feather-arrow-left me-1"></i>
      {fromDashboard ? 'Back to Dashboard' : 'Back to Package Details'}
    </Link>
  );

  return (
    <div className="content">
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col">
            <h3 className="page-title">Track Package</h3>
            <ul className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/admin/packages">Task Management</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={`/admin/packages/${id}`}>Package {id}</Link>
              </li>
              <li className="breadcrumb-item active">Track</li>
            </ul>
          </div>
          <div className="col-auto">
            {backButton}
          </div>
        </div>
      </div>

      <TrackingComponent
        basePath={basePath}
        title="Track Package"
        placeholder="Enter tracking number..."
      />
    </div>
  );
};

export default AdminPackageTrack;
