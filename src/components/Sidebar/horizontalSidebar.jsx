import { sales_agent_dashboard_sidebar_data } from "@/core/data/siderbar_data";
import React, { useState } from "react";
import Link from "../Link";
import SidebarItem from "./SidebarItem";

const HorizontalSidebar = () => {
  const [activeItems, setActiveItems] = useState({});

  const handleItemClick = (itemIndex) => {
    setActiveItems(prev => ({
      ...prev,
      [itemIndex]: !prev[itemIndex]
    }));
  };

  return (
    <div className="sidebar horizontal-sidebar">
      <div id="sidebar-menu-3" className="sidebar-menu">
        <ul className="nav">
          {sales_agent_dashboard_sidebar_data.map((item, index) => (
            <li key={index} className={item.submenu ? "submenu" : ""}>
              {item.submenu ? (
                <>
                  <SidebarItem
                    to="#"
                    icon={item.icon}
                    label={item.label}
                    onClick={() => handleItemClick(index)}
                    isSubdrop={activeItems[index]}
                    hasSubmenu
                  />
                  <ul style={{ display: activeItems[index] ? "block" : "none" }}>
                    {item.submenuItems?.map((subItem, subIndex) => (
                      <li key={subIndex}>
                        <SidebarItem to={subItem.link} label={subItem.label} />
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <SidebarItem to={item.link} icon={item.icon} label={item.label} extraClass="" />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HorizontalSidebar;
