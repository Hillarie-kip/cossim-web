"use client"
import React, { useState, useEffect } from "react";
import { useLocation } from "@/hooks/useLocation";
import ClientScrollbars from "../ClientScrollbars";
import { SidebarData } from "@/core/data/siderbar_data";
import SidebarItem from "./SidebarItem";
import { useAuth } from "@/contexts/AuthContext";
import { RoleType } from "@/constants/user-roles";
import MobileFiltersMenuItem from "./MobileFiltersMenuItem";

const Sidebar = () => {
  const Location = useLocation();
  const { user } = useAuth();
  const currentHref = `${Location.pathname}${Location.search || ""}`;
  const [subOpen, setSubopen] = useState("");
  const [subsidebar, setSubsidebar] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const roleCodes = new Set((user?.AssignedRoles || []).map((role) => role.RoleTypeCode));
  const isVendorOnly = roleCodes.has(RoleType.VENDOR) && !roleCodes.has(RoleType.ADMIN);
  const sidebarData = isVendorOnly
    ? SidebarData
        .filter((section) => !["Finance", "General"].includes(section.label))
        .map((section) => section.label === "Operations"
          ? { ...section, submenuItems: section.submenuItems.filter((item) => item.label === "Task Management") }
          : section)
    : SidebarData;

  const closeMobileSidebar = () => {
    if (window.innerWidth <= 991) {
      document.querySelector(".main-wrapper")?.classList.remove("slide-nav");
      document.querySelector(".sidebar-overlay")?.classList.remove("opened");
    }
  };

  const toggleSidebar = (title) => {
    if (title === subOpen) {
      setSubopen("");
    } else {
      setSubopen(title);
    }
  };

  const toggleSubsidebar = (subitem) => {
    if (subitem === subsidebar) {
      setSubsidebar("");
    } else {
      setSubsidebar(subitem);
    }
  };

  // Auto-expand active submenu on page load
  useEffect(() => {
    sidebarData.forEach((mainLabel) => {
      mainLabel?.submenuItems?.forEach((title) => {
        if (title?.links?.includes(Location.pathname) || title?.links?.includes(currentHref)) {
          setSubopen(title?.label);
        }
        title?.submenuItems?.forEach((item) => {
          if (item?.submenuItems?.map((link) => link?.link).includes(Location.pathname)) {
            setSubsidebar(item?.label);
          }
        });
      });
    });
  }, [Location.pathname, Location.search, currentHref, isVendorOnly]);

  return (
    <div>
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} id="sidebar">
        <ClientScrollbars style={{ height: 'calc(100vh - 66px)' }}>
          <div className="sidebar-inner slimscroll">
            <div id="sidebar-menu" className="sidebar-menu">
              <ul>
                <li className="submenu-open mobile-sidebar-filter-section">
                  <h6 className="submenu-hdr">TASK FILTERS</h6>
                  <ul><MobileFiltersMenuItem onOpen={closeMobileSidebar} /></ul>
                </li>
                {sidebarData?.map((mainLabel) => (
                  <li className="submenu-open" key={mainLabel?.label}>
                    <h6 className="submenu-hdr">{mainLabel?.label}</h6>

                    <ul>
                      {mainLabel?.submenuItems?.map((title, i) => {
                        const useWorkflowStyle = title?.submenu && ["Task Management", "Orders", "Returns"].includes(title?.label);
                        // Build array of all possible links for this menu item
                        let link_array = [title?.link]; // Include the parent link
                        title?.submenuItems?.map((link) => {
                          if (link?.link) {
                            link_array.push(link.link);
                          }
                          if (link?.submenu && link?.submenuItems) {
                            link?.submenuItems?.map((item) => {
                              if (item?.link) {
                                link_array.push(item.link);
                              }
                            });
                          }
                          return link_array;
                        });

                        title.links = [...new Set(link_array.filter(Boolean))];

                        return (
                          <li className={`submenu ${useWorkflowStyle ? "workflow-sidebar-menu" : ""}`} key={i}>
                            <SidebarItem
                              to={title?.link}
                              icon={title?.icon}
                              label={title?.label}
                              onClick={() => {
                                toggleSidebar(title?.label);
                                if (!title?.submenu) closeMobileSidebar();
                              }}
                              isSubdrop={subOpen === title?.label}
                              isActive={title?.links?.includes(Location.pathname) || title?.links?.includes(currentHref)}
                              hasSubmenu={title?.submenu}
                            />
                            <ul
                              className={useWorkflowStyle ? "workflow-sidebar-submenu" : ""}
                              style={{
                                display: subOpen === title?.label ? "block" : "none",
                                animation: subOpen === title?.label ? 'slideDown 0.3s ease-out' : ''
                              }}
                            >
                              {title?.submenuItems?.map((item, titleIndex) => (
                                <li className="submenu submenu-two" key={titleIndex}>
                                  <SidebarItem
                                    to={item?.link}
                                    icon={item?.icon}
                                    label={item?.label}
                                    isActive={
                                      item?.submenuItems?.map((link) => link?.link).includes(currentHref) || item?.link === currentHref
                                    }
                                    onClick={() => {
                                      toggleSubsidebar(item?.label);
                                      if (!item?.submenu) closeMobileSidebar();
                                    }}
                                    hasSubmenu={item?.submenu}
                                  />
                                  <ul
                                    style={{
                                      display: subsidebar === item?.label ? "block" : "none",
                                      animation: subsidebar === item?.label ? 'slideDown 0.2s ease-out' : ''
                                    }}
                                  >
                                    {item?.submenuItems?.map((items, titleIndex2) => (
                                      <li key={titleIndex2}>
                                        <SidebarItem
                                          to={items?.link}
                                          label={items?.label}
                                          isActive={
                                            subsidebar === items?.label || items?.submenuItems?.map((link) => link.link).includes(Location.pathname) || items?.link === Location.pathname
                                          }
                                          extraClass={subsidebar === items?.label ? "submenu-two subdrop" : "submenu-two"}
                                          onClick={closeMobileSidebar}
                                        />
                                      </li>
                                    ))}
                                  </ul>
                                </li>
                              ))}
                            </ul>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ClientScrollbars>
      </div>
    </div>
  );
};

export default Sidebar;
