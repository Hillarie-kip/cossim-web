"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import Link from '@/components/Link';
import TrackingComponent from '@/components/TrackingComponent';

const DCPackageTrack = () => {
  const params = useParams();
  const id = params.id;
  const basePath = `/dc/dc-packages/${id}/track`;

  const backButton = (
    <Link to={`/dc/dc-packages/${id}`} className="btn btn-outline-primary">
      <i className="feather-arrow-left me-1"></i>
      Back to Package Details
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
                <Link to="/dc/dc-packages">DC Packages</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={`/dc/dc-packages/${id}`}>Package Details</Link>
              </li>
              <li className="breadcrumb-item active">Track</li>
            </ul>
          </div>
          <div className="col-auto">
            {backButton}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-12">
          <TrackingComponent
            trackingNumber={id}
            basePath={basePath}
            backButton={backButton}
          />
        </div>
      </div>
    </div>
  );
};

export default DCPackageTrack;
