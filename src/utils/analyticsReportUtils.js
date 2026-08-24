export const readAnalyticsValue = (source, key, fallback = undefined) => {
  if (!source) return fallback;
  if (source[key] !== undefined && source[key] !== null) return source[key];

  const camelKey = `${key.charAt(0).toLowerCase()}${key.slice(1)}`;
  if (source[camelKey] !== undefined && source[camelKey] !== null) {
    return source[camelKey];
  }

  return fallback;
};

export const readAnalyticsArray = (source, key) => {
  const value = readAnalyticsValue(source, key, []);
  return Array.isArray(value) ? value : [];
};

export const formatReportNumber = (value, maximumFractionDigits = 0) =>
  Number(value || 0).toLocaleString("en-KE", { maximumFractionDigits });

export const formatReportCurrency = (value) =>
  `KES ${Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

export const formatReportPercent = (value) =>
  `${Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`;

export const formatReportDate = (value, withTime = false) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return withTime
    ? date.toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })
    : date.toLocaleDateString("en-KE", { dateStyle: "medium" });
};

export const formatMinutes = (value) => {
  const minutes = Number(value || 0);
  if (minutes < 60) return `${formatReportNumber(minutes, 1)} min`;
  if (minutes < 1440) return `${formatReportNumber(minutes / 60, 1)} hr`;
  return `${formatReportNumber(minutes / 1440, 1)} days`;
};

export const getDefaultReportDates = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);

  const toInputDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return { startDate: toInputDate(start), endDate: toInputDate(end) };
};

export const toReportDateTime = (value, endOfDay = false) => {
  if (!value) return undefined;
  return `${value}T${endOfDay ? "23:59:59" : "00:00:00"}`;
};

export const buildAdminPackagesUrl = (
  filters = {},
  overrides = {},
  basePath = "/admin/packages"
) => {
  const values = {
    searchTerm: filters.orderNO || filters.searchTerm,
    statusName: filters.statusName,
    vendorCode: filters.vendorCode,
    fromDCCode: filters.originDCCode || filters.fromDCCode,
    toDCCode: filters.destinationDCCode || filters.toDCCode,
    startDate: filters.startDate,
    endDate: filters.endDate,
    onlyActive: filters.onlyActive,
    ...overrides,
  };
  const params = new URLSearchParams();

  [
    "searchTerm",
    "statusName",
    "vendorCode",
    "fromDCCode",
    "toDCCode",
    "startDate",
    "endDate",
  ].forEach((key) => {
    if (values[key] !== undefined && values[key] !== null && values[key] !== "") {
      params.set(key, String(values[key]));
    }
  });

  if (values.onlyActive) params.set("onlyActive", "true");
  const query = params.toString();
  return `${basePath}${query ? `?${query}` : ""}`;
};

export const downloadReportCsv = (filename, columns, rows) => {
  if (!rows?.length || typeof window === "undefined") return;

  const escapeCell = (value) => {
    const normalized = value === null || value === undefined ? "" : String(value);
    return `"${normalized.replace(/"/g, '""')}"`;
  };

  const csv = [
    columns.map((column) => escapeCell(column.label)).join(","),
    ...rows.map((row) =>
      columns.map((column) => escapeCell(column.value(row))).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};
