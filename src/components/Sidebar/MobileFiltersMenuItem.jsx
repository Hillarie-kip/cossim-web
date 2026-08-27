"use client";

import React from "react";
import { Filter } from "react-feather";

const MobileFiltersMenuItem = ({ onOpen }) => {
  const openFilters = () => {
    onOpen?.();
    window.setTimeout(() => {
      window.dispatchEvent(new Event("cossim:toggle-global-filters"));
    }, 180);
  };

  return (
    <li className="mobile-sidebar-filters">
      <button type="button" onClick={openFilters}>
        <span className="sidebar-icon"><Filter /></span>
        <span className="sidebar-label">
          <strong>Filters</strong>
          <small>Date, vendor and DC</small>
        </span>
      </button>
    </li>
  );
};

export default MobileFiltersMenuItem;
