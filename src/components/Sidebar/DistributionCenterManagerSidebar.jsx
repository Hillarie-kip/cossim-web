"use client"

import React from "react";
import { useLocation } from "@/hooks/useLocation";
import { distribution_center_manager_sidebar_data } from "@/core/data/siderbar_data";
import SidebarMenu from "./SidebarMenu";

const DistributionCenterManagerSidebar = () => {
  const Location = useLocation();

  return (
    <SidebarMenu
      sidebarData={distribution_center_manager_sidebar_data}
      currentPath={Location.pathname}
    />
  );
};

export default DistributionCenterManagerSidebar;
