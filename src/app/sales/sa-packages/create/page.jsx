"use client";

import CreatePackageForm from '@/components/CreatePackageForm';

const SalesAgentCreatePackagePage = () => {
  // show vendor select since sales agents need to associate the package with their referred vendors
  return <CreatePackageForm showVendorInput={true} backRoute='/sales/sa-packages' />;
};

export default SalesAgentCreatePackagePage;
