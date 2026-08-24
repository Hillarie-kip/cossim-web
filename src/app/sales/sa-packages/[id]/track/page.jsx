"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import Link from '@/components/Link';
import TrackingComponent from '@/components/TrackingComponent';

const SalesAgentPackageTrack = () => {
  const params = useParams();
  const id = params.id;
  const basePath = `/sales/sa-packages/${id}/track`;

  const backButton = (
    <Link to={`/sales/sa-packages`} className="btn btn-outline-primary">
      <i className="feather-arrow-left me-1"></i>
      Back to Packages
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
                <Link to="/sales/sa-packages">Packages</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={`/sales/sa-packages/${id}`}>Package {id}</Link>
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
        placeholder="Enter order number..."
        readOnly={true}
      />
    </div>
  );
};

export default SalesAgentPackageTrack;
