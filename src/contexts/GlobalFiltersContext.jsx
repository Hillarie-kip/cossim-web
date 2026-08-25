"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { getDefaultReportDates } from "@/utils/analyticsReportUtils";

const GlobalFiltersContext = createContext(null);
const STORAGE_KEY = "cossim-global-filters";

export function GlobalFiltersProvider({ children }) {
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
    filters,
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
  }), [filters]);

  return <GlobalFiltersContext.Provider value={value}>{children}</GlobalFiltersContext.Provider>;
}

GlobalFiltersProvider.propTypes = { children: PropTypes.node.isRequired };

export function useGlobalFilters() {
  const context = useContext(GlobalFiltersContext);
  if (!context) throw new Error("useGlobalFilters must be used within GlobalFiltersProvider");
  return context;
}
