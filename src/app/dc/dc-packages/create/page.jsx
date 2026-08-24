"use client";

import CreatePackageForm from '@/components/CreatePackageForm';

const CreatePackagePage = () => {
  return <CreatePackageForm showVendorInput={true} backRoute='/dc/dc-packages' />;
};

export default CreatePackagePage;
