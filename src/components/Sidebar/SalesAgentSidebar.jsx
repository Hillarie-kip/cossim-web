"use client"

import React from "react";
import { useLocation } from "@/hooks/useLocation";
import { sales_agent_dashboard_sidebar_data } from "@/core/data/siderbar_data";
import SidebarMenu from "./SidebarMenu";

const SalesAgentSidebar = () => {
  const Location = useLocation();

  return (
    <SidebarMenu
      sidebarData={sales_agent_dashboard_sidebar_data}
      currentPath={Location.pathname}
    />
  );
};

export default SalesAgentSidebar;
