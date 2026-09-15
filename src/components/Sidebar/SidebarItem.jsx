"use client"
import React from "react";
import Link from "next/link";
import { useSidebarNavigation } from "@/components/NavigationLoader";

// Small reusable item to keep sidebar link markup consistent
const SidebarItem = ({ to, icon, label, isActive, isSubdrop, hasSubmenu, onClick, children, extraClass = "" }) => {
  const linkClass = `${isActive ? "active" : ""} ${isSubdrop ? "subdrop" : ""} ${extraClass}`.trim();
  const navigate = useSidebarNavigation();

  return (
    <>
      <Link 
        href={to || "#"}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          if (!to || to === "#" || hasSubmenu) {
            event.preventDefault();
            return;
          }
          if (!navigate || !to.startsWith("/") || to.startsWith("//")) return;
          event.preventDefault();
          if (to !== window.location.pathname + window.location.search + window.location.hash) navigate(to);
        }}
        className={linkClass}
        style={{
          '--hover-transform': 'translateY(-2px)',
          '--active-shadow': '0 8px 25px rgba(255, 98, 0, 0.25)'
        }}
        prefetch={hasSubmenu ? false : undefined}
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
