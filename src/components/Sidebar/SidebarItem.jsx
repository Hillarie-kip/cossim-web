"use client"
import React from "react";
import Link from "@/components/Link";

// Small reusable item to keep sidebar link markup consistent
const SidebarItem = ({ to, icon, label, isActive, isSubdrop, hasSubmenu, onClick, children, extraClass = "" }) => {
  const linkClass = `${isActive ? "active" : ""} ${isSubdrop ? "subdrop" : ""} ${extraClass}`.trim();

  return (
    <>
      <Link 
        to={to || "#"} 
        onClick={onClick} 
        className={linkClass}
        style={{
          '--hover-transform': 'translateY(-2px)',
          '--active-shadow': '0 8px 25px rgba(255, 98, 0, 0.25)'
        }}
        prefetch
      >
        {icon && (
          <span className="sidebar-icon">
            {icon}
          </span>
        )}
        <span className="sidebar-label">{label}</span>
        {hasSubmenu && <span className="menu-arrow" />}
      </Link>
      {children}
    </>
  );
};

export default SidebarItem;
