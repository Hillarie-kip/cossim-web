"use client";

import CreatePackageForm from "@/components/CreatePackageForm";
import { all_routes } from "@/Router/all_routes";

const CreatePackagePage = () => {
  return (
    <CreatePackageForm
      backRoute={all_routes.vendorPackages}
      showBadges={true}
    />
  );
};

export default CreatePackagePage;
