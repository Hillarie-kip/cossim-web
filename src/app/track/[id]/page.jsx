"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import TrackingComponent from '@/components/TrackingComponent';

const PublicPackageTrack = () => {
  const params = useParams();
  const id = params.id;
  const basePath = `/track/${id}`;

  return (
    <div className="content">
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col">
            <h3 className="page-title">Track Your Package</h3>
            <p className="text-muted">Enter your tracking number to see the current status and location of your package.</p>
          </div>
        </div>
      </div>

      <TrackingComponent
        basePath={basePath}
        title="Track Package"
        placeholder="Enter your tracking number..."
      />
    </div>
  );
};

export default PublicPackageTrack;
