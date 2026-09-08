"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { getDefaultReportDates } from "@/utils/analyticsReportUtils";
import { useAuth } from "@/contexts/AuthContext";
import { RoleType } from "@/constants/user-roles";

const GlobalFiltersContext = createContext(null);
const STORAGE_KEY = "cossim-global-filters";

export function GlobalFiltersProvider({ children }) {
  const { user } = useAuth();
  const roles = new Set((user?.AssignedRoles || []).map((role) => role.RoleTypeCode));
  const isVendorOnly = roles.has(RoleType.VENDOR) && !roles.has(RoleType.ADMIN);
  const vendorCode = user?.AssignedVendor?.VendorCode || user?.AssignedVendor?.vendorCode || user?.VendorCode || user?.vendorCode || "";
  const defaults = getDefaultReportDates();
  const [filters, setFilters] = useState({
    startDate: defaults.startDate,
    endDate: defaults.endDate,
    vendorCode: "",
    dcCode: "",
    dcCodes: "",
  });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved) setFilters((current) => {
        const dcCodes = saved.dcCodes || saved.dcCode || "";
        const selectedCodes = dcCodes.split(",").filter(Boolean);
        const { actionDCCode: _discardedActionDC, ...savedFilters } = saved;
        return { ...current, ...savedFilters, dcCodes, dcCode: selectedCodes[0] || "" };
      });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const value = useMemo(() => ({
    filters: isVendorOnly ? { ...filters, vendorCode, dcCode: "__ALL__", dcCodes: "__ALL__" } : filters,
    setFilter: (key, value) => setFilters((current) => {
      if (key === "dcCodes") {
        if (value === "__NONE__") return { ...current, dcCodes: "__NONE__", dcCode: "" };
        const codes = String(value || "").split(",").filter(Boolean);
        return { ...current, dcCodes: codes.join(","), dcCode: codes[0] || "" };
      }
      if (key === "dcCode") return { ...current, dcCode: value, dcCodes: value };
      return { ...current, [key]: value };
    }),
    setFilters,
  }), [filters, isVendorOnly, vendorCode]);

  return <GlobalFiltersContext.Provider value={value}>{children}</GlobalFiltersContext.Provider>;
}

GlobalFiltersProvider.propTypes = { children: PropTypes.node.isRequired };

export function useGlobalFilters() {
  const context = useContext(GlobalFiltersContext);
  if (!context) throw new Error("useGlobalFilters must be used within GlobalFiltersProvider");
  return context;
}
