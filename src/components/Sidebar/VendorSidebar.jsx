"use client"

import React from "react";
import { useLocation } from "@/hooks/useLocation";
import { vendor_dashboard_sidebar_data } from "@/core/data/siderbar_data";
import SidebarMenu from "./SidebarMenu";

const VendorSidebar = () => {
  const Location = useLocation();

  return (
    <SidebarMenu
      sidebarData={vendor_dashboard_sidebar_data}
      currentPath={Location.pathname}
    />
  );
};

export default VendorSidebar;
