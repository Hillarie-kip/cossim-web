export const parsePackageDrilldownDate = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

export const readPackageDrilldownQuery = () => {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    searchTerm: params.get("searchTerm") || "",
    statusName: params.get("statusName") || "",
    vendorCode: params.get("vendorCode") || "",
    fromDCCode: params.get("fromDCCode") || "",
    toDCCode: params.get("toDCCode") || "",
    onlyActive: params.get("onlyActive") === "true",
    startDate: parsePackageDrilldownDate(params.get("startDate")),
    endDate: parsePackageDrilldownDate(params.get("endDate")),
  };
};
