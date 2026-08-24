"use client"

import React from "react";
import { useLocation } from "@/hooks/useLocation";
import { rider_dashboard_sidebar_data } from "@/core/data/siderbar_data";
import SidebarMenu from "./SidebarMenu";

const RiderSidebar = () => {
  const Location = useLocation();

  return (
    <SidebarMenu
      sidebarData={rider_dashboard_sidebar_data}
      currentPath={Location.pathname}
    />
  );
};

export default RiderSidebar;
