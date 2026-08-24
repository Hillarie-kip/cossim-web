"use client";

import React from 'react';
import Link from '@/components/Link';
import VendorPageHeader from '@/components/vendor/VendorPageHeader';
import TrackingComponent from '@/components/TrackingComponent';

const VendorTrack = () => {
  const backButton = (
    <Link to="/vendor/vendor-overview" className="btn btn-outline-primary">
      <i className="feather-arrow-left me-1"></i>
      Back to Dashboard
    </Link>
  );

  return (
    <>
      <VendorPageHeader
        title="Track Package"
        subtitle="Enter tracking number to get real-time updates"
        actions={backButton}
      />
      <TrackingComponent
        basePath="/vendor/vendor-track"
        title="Track Your Package"
        placeholder="Enter tracking number..."
      />
    </>
  );
};

export default VendorTrack;
