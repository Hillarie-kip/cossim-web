"use client";
import React, { useState, useEffect } from "react";
import { Headphones, ChevronRight } from "react-feather";
import ClientScrollbars from "../ClientScrollbars";
import SidebarItem from "./SidebarItem";
import { useAuth } from "@/contexts/AuthContext";

const SidebarMenu = ({ sidebarData, currentPath }) => {
  const [subOpen, setSubopen] = useState("");
  const [subsidebar, setSubsidebar] = useState("");
  const { logout } = useAuth();

  const closeMobileSidebar = () => {
    if (window.innerWidth <= 991) {
      document.querySelector(".main-wrapper")?.classList.remove("slide-nav");
      document.querySelector(".sidebar-overlay")?.classList.remove("opened");
    }
  };

  const toggleSidebar = (title) => {
    setSubopen(title === subOpen ? "" : title);
  };

  const toggleSubsidebar = (subitem) => {
    setSubsidebar(subitem === subsidebar ? "" : subitem);
  };

  useEffect(() => {
    sidebarData.forEach((mainLabel) => {
      mainLabel?.submenuItems?.forEach((title) => {
        if (title?.links?.includes(currentPath)) {
          setSubopen(title?.label);
        }
        title?.submenuItems?.forEach((item) => {
          if (item?.submenuItems?.map((link) => link?.link).includes(currentPath)) {
            setSubsidebar(item?.label);
          }
        });
      });
    });
  }, [currentPath, sidebarData]);

  const handleLogout = async (e) => {
    e.preventDefault();
    await logout();
  };

  // Separate bottom-pinned categories (those containing a logout item) from scrollable ones
  const mainCategories = sidebarData.filter(
    (cat) => !cat.submenuItems?.some((item) => item.isLogout)
  );
  const bottomCategories = sidebarData.filter(
    (cat) => cat.submenuItems?.some((item) => item.isLogout)
  );

  const renderCategoryItems = (category) =>
    category.submenuItems?.map((title, i) => {
      const useWorkflowStyle = title?.submenu && ["Task Management", "Orders", "Returns"].includes(title?.label);
      if (title?.isLogout) {
        return (
          <li key={i}>
            <a href="#" onClick={handleLogout} style={{ cursor: "pointer" }}>
              {title?.icon && <span className="sidebar-icon">{title?.icon}</span>}
              <span className="sidebar-label">{title?.label}</span>
            </a>
          </li>
        );
      }

      let link_array = [title?.link];
      title?.submenuItems?.forEach((link) => {
        if (link?.link) link_array.push(link.link);
        if (link?.submenu && link?.submenuItems) {
          link.submenuItems.forEach((item) => {
            if (item?.link) link_array.push(item.link);
          });
        }
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
            isActive={title?.links?.includes(currentPath)}
            hasSubmenu={title?.submenu}
          />
          <ul
            className={useWorkflowStyle ? "workflow-sidebar-submenu" : ""}
            style={{
              display: subOpen === title?.label ? "block" : "none",
              animation: subOpen === title?.label ? "slideDown 0.3s ease-out" : "",
            }}
          >
            {title?.submenuItems?.map((item, titleIndex) => (
              <li className="submenu submenu-two" key={titleIndex}>
                <SidebarItem
                  to={item?.link}
                  icon={item?.icon}
                  label={item?.label}
                  isActive={
                    item?.submenuItems?.map((link) => link?.link).includes(currentPath) ||
                    item?.link === currentPath
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
                    animation: subsidebar === item?.label ? "slideDown 0.2s ease-out" : "",
                  }}
                >
                  {item?.submenuItems?.map((items, titleIndex2) => (
                    <li key={titleIndex2}>
                      <SidebarItem
                        to={items?.link}
                        label={items?.label}
                        isActive={
                          subsidebar === items?.label ||
                          items?.submenuItems?.map((link) => link.link).includes(currentPath) ||
                          items?.link === currentPath
                        }
                        extraClass={
                          subsidebar === items?.label ? "submenu-two subdrop" : "submenu-two"
                        }
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
    });

  return (
    <div>
      <div className="sidebar" id="sidebar">
        <ClientScrollbars style={{ height: "calc(100vh - 66px)" }}>
          <div className="sidebar-inner slimscroll">
            <div id="sidebar-menu" className="sidebar-menu">
              <ul>
                {sidebarData.map((mainLabel) => (
                  <li className="submenu-open" key={mainLabel?.label}>
                    <h6 className="submenu-hdr">{mainLabel?.label}</h6>
                    <ul>{renderCategoryItems(mainLabel)}</ul>
                  </li>
                ))}
              </ul>
            </div>

            {/* Help card — scrolls with the menu */}
            <div
              style={{
                margin: "8px 16px 16px",
                padding: "14px",
                background: "linear-gradient(135deg, #fff8f5 0%, #fff2eb 100%)",
                borderRadius: "12px",
                border: "1px solid rgba(255, 98, 0, 0.15)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "rgba(255, 98, 0, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Headphones size={18} color="#FF6200" />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "13px",
                      color: "#1a1a1a",
                      lineHeight: 1.3,
                    }}
                  >
                    Need Help?
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#6b7280",
                      marginTop: "3px",
                      lineHeight: 1.4,
                    }}
                  >
                    Get quick support for issues
                  </div>
                </div>
              </div>
              <a
                href="mailto:support@cossim.co.ke"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  background: "#FF6200",
                  color: "#fff",
                  padding: "9px 16px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Contact Support <ChevronRight size={14} />
              </a>
            </div>
          </div>
        </ClientScrollbars>
      </div>
    </div>
  );
};

export default SidebarMenu;
