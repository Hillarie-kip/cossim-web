"use client";

import CreatePackageForm from '@/components/CreatePackageForm';

const CreatePackagePage = () => {
  // show vendor select since we need to associate the package with a vendor
  return <CreatePackageForm showVendorInput={true} backRoute='/admin/packages' />;
};

export default CreatePackagePage;
