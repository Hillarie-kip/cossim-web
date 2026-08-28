"use client"
import {
  ChevronUp,
  RotateCcw,
  PlusCircle,
  Send,
  Printer,
  UploadCloud,
  RefreshCw,
  Layers,
  Search,
  ArrowLeft,
  X,
} from "feather-icons-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import notify from "@/lib/toast";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import Link from "@/components/Link";
import RowActionsDropdown from "@/components/RowActionsDropdown";
import SSRSelect from "@/components/SSRSelect";
import { all_routes } from "@/Router/all_routes";
import Datatable from "@/core/pagination/datatable";
import useShipment from "@/hooks/useShipment";
import { completeHandoverBatch, editHandoverBatch, getHandoverBatchList, getShipmentOrders, getShipmentOrderItems, getShipmentTimeline, postShipmentHandoverBatch, saveShipmentOrderPayment, uploadHandoverReceipt } from "@/services/shipmentService";
import OrderExpandedDetails from "@/components/OrderExpandedDetails";
import CameraScanInput from "@/components/CameraScanInput";
import useAdmin from "@/hooks/useAdmin";
import { useVendors } from "@/hooks/useVendors";
import useStickerDownload from "@/hooks/useStickerDownload";
import { ImportExcelModal, ReceiveInboundBatchModal } from "@/components/modals";
import { PACKAGE_STATUSES } from "@/constants/package_status";
import { RoleType } from "@/constants/user-roles";
import { checkStkPush, requestSTKPush } from "@/services/accountService";
import TableExportIcons from "@/components/TableExportIcons";
import { createFetchAllDataFunction } from "@/utils/tableExport";
import { Modal } from "react-bootstrap";
import CreatePackageForm from "@/components/CreatePackageForm";
import { formatLocalDateOnly } from "@/lib/utils/dateFormat";
import { exportColumns, pdfColumns } from "./components/tableColumns";
import { useGlobalFilters } from "@/contexts/GlobalFiltersContext";
import { useAuth } from "@/contexts/AuthContext";
import { filterDistributionCentersToAssigned } from "@/services/dcService";

const getStatusName = (status) =>
  status?.statusName ||
  status?.StatusName ||
  status?.name ||
  status?.Name ||
  "";

const normalizeDCScope = (value, availableCodes) => {
  const raw = String(value || "").trim();
  if (["__ALL__", "__NONE__"].includes(raw)) return raw;
  if (raw.startsWith("__ALL_EXCEPT__:")) {
    const excluded = raw.slice("__ALL_EXCEPT__:".length)
      .split("|")
      .map((code) => code.trim())
      .filter((code) => code && availableCodes.has(code));
    return excluded.length ? `__ALL_EXCEPT__:${excluded.join("|")}` : "__ALL__";
  }
  return raw.split(",")
    .map((code) => code.trim())
    .filter((code) => code && availableCodes.has(code))
    .join(",");
};

const getStatusBadgeClass = (statusCode) => {
  const code = Number(statusCode);
  if ([202, 302, 503, 603, 804, 901].includes(code)) return "badge bg-success";
  if ([303, 805, 902].includes(code)) return "badge bg-danger";
  if ([201, 301, 501, 602, 702].includes(code)) return "badge bg-warning text-dark";
  if ([102, 209, 402, 502, 601, 703, 801].includes(code)) return "badge bg-info";
  if ([101, 208, 401, 701, 802].includes(code)) return "badge bg-primary";
  if ([103, 304, 410, 803, 903].includes(code)) return "badge bg-dark";
  if ([207, 504].includes(code)) return "badge bg-light text-dark";
  return "badge bg-secondary";
};

const getVendorCode = (vendor) =>
  vendor?.vendorCode ||
  vendor?.VendorCode ||
  "";

const getVendorName = (vendor) =>
  vendor?.vendorName ||
  vendor?.VendorName ||
  vendor?.name ||
  vendor?.Name ||
  getVendorCode(vendor);

const getDCCode = (dc) =>
  dc?.DCCode ||
  dc?.dcCode ||
  "";

const getDCName = (dc) =>
  dc?.DCName ||
  dc?.dcName ||
  dc?.name ||
  dc?.Name ||
  getDCCode(dc);

const DetailItem = ({ label, value }) => (
  <div className="packages-detail-item">
    <small>{label}</small>
    <span>{value || "-"}</span>
  </div>
);

const extractResponseList = (response) => {
  const data = response?.Data ?? response?.data ?? response;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.Items)) return data.Items;
  return [];
};

const parsePackageFilterDate = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const REVERSAL_REASON_CODES = [
  ["CUSTOMER_REQUESTED_RETURN", "Customer requested return"],
  ["CUSTOMER_UNAVAILABLE", "Customer unavailable"],
  ["REFUSED_DELIVERY", "Customer refused delivery"],
  ["INCORRECT_ADDRESS", "Incorrect or incomplete address"],
  ["DAMAGED_PACKAGE", "Package damaged"],
  ["DUPLICATE_ORDER", "Duplicate order"],
  ["OTHER", "Other"],
];

const LOST_REASON_CODES = [
  ["LS02", "Not received in the movable unit"],
  ["LS03", "Movable unit not received"],
  ["LS04", "Not found during cycle count"],
  ["LS05", "Lost in delivery"],
  ["LS06", "Lost due to SLA breached"],
];

const TASK_TYPE_BY_STATUS_ID = {
  101: "confirmed", // Order Confirmed by Vendor
  102: "dispatch",  // Order Picked by Courier
  201: "deliver",   // Received at DC
  202: "receive",   // In Transit to DC
  301: "deliver",   // Assigned to Rider
  302: "deliver",   // Out for Delivery
  303: "completed", // Delivered
  304: "deliver",   // Rescheduled by Rider
  305: "deliver",   // 2nd Attempt by Rider
  306: "deliver",   // 3rd Attempt by Rider
  307: "deliver",   // Re Assigned Order
  401: "receive",   // In Transit to DC Return
  402: "reversed",  // Returned to Vendor
  801: "deliver",   // Payment Pending
  802: "completed", // Payment Received
  803: "deliver",   // Payment Failed
  804: "confirmed", // Payment Waived
  901: "completed", // Accepted
  902: "reversed",  // Declined
  111: "unassigned", // Express
  112: "unassigned", // Next Day
  113: "unassigned", // Same Day Consolidated
};

const TASK_TYPE_BY_STATUS_CODE = {
  ORDER_CONFIRMED: "confirmed",
  PICKED_BY_COURIER: "dispatch",
  RECEIVED_AT_DC: "deliver",
  IN_TRANSIT_TO_DC: "receive",
  ASSIGNED_TO_RIDER: "deliver",
  OUT_FOR_DELIVERY: "deliver",
  DELIVERED: "completed",
  RESCHEDULED: "deliver",
  DELIVERY_ATTEMPT_2: "deliver",
  DELIVERY_ATTEMPT_3: "deliver",
  RE_ASSIGNED: "deliver",
  RETURN_IN_TRANSIT: "receive",
  RETURNED_TO_VENDOR: "reversed",
  PAYMENT_PENDING: "deliver",
  PAYMENT_RECEIVED: "completed",
  PAYMENT_FAILED: "deliver",
  PAYMENT_WAIVED: "confirmed",
  ACCEPTED: "completed",
  DECLINED: "reversed",
  EXPRESS: "unassigned",
  NEXT_DAY: "unassigned",
  SAME_DAY_CONSOLIDATED: "unassigned",
};

const getSlaWindowStart = (selectedStartDate, slaDays = 7) => {
  const slaStart = new Date();
  slaStart.setHours(0, 0, 0, 0);
  slaStart.setDate(slaStart.getDate() - slaDays);
  if (!selectedStartDate) return slaStart;
  const selected = selectedStartDate instanceof Date ? selectedStartDate : new Date(selectedStartDate);
  return Number.isNaN(selected.getTime()) || selected < slaStart ? slaStart : selected;
};

const getTaskType = (order) => {
  // The API commonly returns StatusCode as a numeric status ID. Prefer the
  // descriptive name so task routing does not try to classify values like 401.
  const numericStatus = Number(order?.StatusID ?? order?.StatusCode);
  if (Number.isFinite(numericStatus) && TASK_TYPE_BY_STATUS_ID[numericStatus]) {
    return TASK_TYPE_BY_STATUS_ID[numericStatus];
  }
  const rawStatusCode = String(order?.StatusCode || order?.statusCode || "").trim().toUpperCase();
  if (TASK_TYPE_BY_STATUS_CODE[rawStatusCode]) return TASK_TYPE_BY_STATUS_CODE[rawStatusCode];
  const statusFromID = Number.isFinite(numericStatus)
    ? Object.values(PACKAGE_STATUSES).find((item) => item.orderStatusID === numericStatus)?.statusName
    : "";
  const status = String(order?.StatusName || order?.statusName || order?.OrderStatusName || statusFromID || order?.StatusCode || "")
    .replaceAll("_", " ")
    .toUpperCase();
  if (numericStatus === 101 || /ORDER CONFIRMED|CONFIRMED BY VENDOR|VENDOR CREATED/.test(status)) return "confirmed";
  if (/RETURN|REVERSE|FAILED|DECLINED|CANCELLED/.test(status)) return "reversed";
  if (/ASSIGNED|DELIVERY|PICKUP|WAITLIST|OUT FOR|PAYMENT/.test(status)) return "deliver";
  if (/CLOSED SUCCESS|COMPLETED/.test(status)) return "completed";
  // Receiving is batch-driven, not order-driven. Every other actionable order
  // belongs in dispatch, including stocked and inter-DC orders.
  return "dispatch";
};

const isAssignedDeliveryOrder = (order) => {
  const statusID = Number(order?.StatusID ?? order?.StatusCode);
  const statusName = String(order?.StatusName || order?.statusName || order?.OrderStatusName || "").toUpperCase();
  return statusID === PACKAGE_STATUSES.ASSIGNED_TO_DELIVERY.orderStatusID || statusName.includes("ASSIGNED TO DELIVERY");
};

const getOrderAgeDays = (value) => {
  if (!value) return 0;
  const added = new Date(value);
  if (Number.isNaN(added.getTime())) return 0;
  const today = new Date();
  const addedDay = new Date(added.getFullYear(), added.getMonth(), added.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.floor((todayDay - addedDay) / 86400000));
};

const getOrderSlaState = (order) => {
  const status = String(order?.SLAStatus || order?.slaStatus || "").replaceAll("_", " ").trim().toUpperCase();
  const isBreached = order?.IsSLABreached ?? order?.SLABreached ?? order?.isSlaBreached;
  const percentage = Number(order?.SLAPercentageUsed ?? order?.slaPercentageUsed ?? order?.SLAPercentage);
  const timeDifference = Number(order?.SLATimeDifference ?? order?.slaTimeDifference);
  const timeThreshold = Number(order?.SLATimeThreshold ?? order?.slaTimeThreshold);
  const slaHours = Number(order?.SLAHours ?? order?.slaHours);
  const added = order?.DateAdded ? new Date(order.DateAdded) : null;
  const ageHours = added && !Number.isNaN(added.getTime()) ? (Date.now() - added.getTime()) / 3600000 : 0;
  const deadlineValue = order?.SLADeadline || order?.ExpectedDeliveryDate || order?.DueDate;
  const deadline = deadlineValue ? new Date(deadlineValue) : null;

  let level = "green";
  if (isBreached === true || /PAST SLA|BREACH|OVERDUE|EXPIRED/.test(status)) level = "red";
  else if (isBreached === false || /WITHIN|COMPLIANT|ON TRACK/.test(status)) level = "green";
  else if (Number.isFinite(timeDifference) && Number.isFinite(timeThreshold) && timeThreshold > 0) {
    level = timeDifference > timeThreshold ? "red" : "green";
  }
  else if (Number.isFinite(percentage)) level = percentage >= 100 ? "red" : percentage >= 80 ? "yellow" : "green";
  else if (Number.isFinite(slaHours) && slaHours > 0) {
    const used = ageHours / slaHours * 100;
    level = used >= 100 ? "red" : used >= 80 ? "yellow" : "green";
  } else if (deadline && !Number.isNaN(deadline.getTime())) {
    const remainingHours = (deadline.getTime() - Date.now()) / 3600000;
    level = remainingHours <= 0 ? "red" : remainingHours <= 24 ? "yellow" : "green";
  } else {
    const days = getOrderAgeDays(order?.DateAdded);
    level = days >= 3 ? "red" : days >= 2 ? "yellow" : "green";
  }

  return {
    level,
    priority: level === "red" ? 0 : level === "yellow" ? 1 : 2,
    label: level === "red" ? "Past SLA" : level === "yellow" ? "Nearing SLA breach" : "Within SLA",
    color: level === "red" ? "#f04438" : level === "yellow" ? "#f79009" : "#12b76a",
  };
};

const abbreviateSlaUnit = (unit, value) => {
  const normalized = String(unit || "").trim().toLowerCase();
  const abbreviations = {
    second: "sec", seconds: "sec", minute: "min", minutes: "min",
    hour: "hr", hours: "hr", day: "day", days: "days",
    week: "wk", weeks: "wks", month: "mo", months: "mos",
  };
  if (!normalized) return "";
  if ((normalized === "day" || normalized === "days") && Number(value) === 1) return "day";
  return abbreviations[normalized] || normalized;
};

const formatSlaNumber = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 }).format(number);
};

const formatExpectedSlaStage = (value) => {
  const stage = String(value || "").trim();
  const stages = {
    "Vendor to Cossim HQ": "Received at Cossim HQ",
    "Cossim HQ to Cossim DC": "Received at DC",
    "Cossim HQ to Rider": "Dispatched to Rider",
    "Rider to Customer": "First Delivery Attempt",
    "DC to 1st Attempt": "First Attempt",
    "DC to Second Attempt": "2nd Attempt",
    "DC to Third Attempt": "3rd Attempt",
    "DC to Last attempt": "Final Attempt",
    "DC to reverse state": "Moved to Reverse",
    "HQ to Vendor": "Returned to Vendor",
    "Order Delivered": "Delivered",
  };
  return stages[stage] || stage || null;
};

const inferExpectedSlaStage = (order) => {
  const statusID = Number(order?.StatusID ?? order?.statusID);
  const deliveryType = String(order?.DeliveryTypeCode || order?.DeliveryType || "").replaceAll(" ", "").toUpperCase();
  if (statusID === 102 || statusID === 202) return deliveryType.includes("EXPRESS") ? "Dispatched to Rider" : "Received at DC";
  if ([201, 301, 302, 304, 307, 801, 803].includes(statusID)) return "First Attempt";
  if (statusID === 305) return "2nd Attempt";
  if (statusID === 306) return "3rd Attempt";
  if ([303, 802, 901].includes(statusID)) return "Delivered";
  if (statusID === 401) return "Moved to Reverse";
  if (statusID === 402) return "Returned to Vendor";
  if ([101, 804].includes(statusID)) return "Received at Cossim HQ";
  return null;
};

const getOrderSlaTiming = (order) => {
  const lapseValue = order?.SLATimeLapse ?? order?.slaTimeLapse;
  const overdueMinutes = order?.SLATimeDifference ?? order?.slaTimeDifference;
  const thresholdValue = order?.SLATimeThreshold ?? order?.slaTimeThreshold;
  const rawUnit = order?.SLATimeUnit ?? order?.slaTimeUnit;
  const expectedStage = formatExpectedSlaStage(order?.ExpectedStep ?? order?.expectedStep)
    || inferExpectedSlaStage(order);
  const normalizedUnit = String(rawUnit || "").trim().toLowerCase();
  const hasLapse = lapseValue !== null && lapseValue !== undefined && lapseValue !== "";
  const hasOverdue = overdueMinutes !== null && overdueMinutes !== undefined && overdueMinutes !== "" && Number(overdueMinutes) > 0;
  const threshold = Number(thresholdValue);
  // Compatibility for a running API that has not yet exposed SLATimeLapse:
  // SLATimeDifference is always overdue minutes, so convert it before adding
  // it to the configured step threshold. Never label raw minutes as days.
  const legacyElapsed = hasOverdue && Number.isFinite(threshold)
    ? threshold + Math.ceil(Number(overdueMinutes) / (
        ["day", "days"].includes(normalizedUnit) ? 1440
          : ["hour", "hours", "hr", "hrs"].includes(normalizedUnit) ? 60
            : 1
      ))
    : null;
  const differenceValue = hasLapse ? lapseValue : legacyElapsed;
  const difference = formatSlaNumber(differenceValue);
  const formattedThreshold = formatSlaNumber(thresholdValue);
  return {
    difference: difference === null ? "-" : `${difference} ${abbreviateSlaUnit(rawUnit, differenceValue)}`.trim(),
    expected: expectedStage || (formattedThreshold === null ? "-" : `${formattedThreshold} ${abbreviateSlaUnit(rawUnit, thresholdValue)}`.trim()),
  };
};

const getPackageQueryFilters = () => {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const storedTask = window.localStorage.getItem("cossim-packages-active-task") || "";
  return {
    searchTerm: params.get("searchTerm") || "",
    statusName: params.get("statusName") || "",
    vendorCode: params.get("vendorCode") || "",
    fromDCCode: params.get("fromDCCode") || "",
    toDCCode: params.get("toDCCode") || "",
    onlyActive: params.get("onlyActive") === "true",
    task: params.get("task") || storedTask,
    taskModule: params.get("taskModule") || "",
    fromDashboard: params.get("from") === "dashboard",
    startDate: parsePackageFilterDate(params.get("startDate")),
    endDate: parsePackageFilterDate(params.get("endDate")),
  };
};

const PackagesList = ({ initialStatusName = "", initialTask = "deliver" }) => {
  const route = all_routes;
  const urlSearchParams = useSearchParams();
  const { user } = useAuth();
  const roleCodes = new Set((user?.AssignedRoles || []).map((role) => role.RoleTypeCode));
  const isVendorOnly = roleCodes.has(RoleType.VENDOR) && !roleCodes.has(RoleType.ADMIN);
  const loggedInVendorCode = user?.AssignedVendor?.VendorCode
    || user?.AssignedVendor?.vendorCode
    || user?.VendorCode
    || user?.vendorCode
    || "";
  const [searchTerm, setSearchTerm] = useState("");
  const [vendorCode, setVendorCode] = useState("");
  const [fromDCCode, setFromDCCode] = useState("");
  const [toDCCode, setToDCCode] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [selectedStatusName, setSelectedStatusName] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCreatePackage, setShowCreatePackage] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const searchTimeoutRef = useRef(null);

  const [activeTask, setActiveTask] = useState(
    ["confirmed", "deliver", "dispatch", "receive", "forwardReverse", "reversed", "reverseReceive"].includes(initialTask) ? initialTask : "deliver"
  );
  const [selectedRowKeysByTask, setSelectedRowKeysByTask] = useState({});
  const selectedRowKeys = selectedRowKeysByTask[activeTask] || [];
  const setSelectedRowKeys = useCallback((nextSelection) => {
    setSelectedRowKeysByTask((currentSelections) => {
      const currentTaskSelection = currentSelections[activeTask] || [];
      const resolvedSelection = typeof nextSelection === "function"
        ? nextSelection(currentTaskSelection)
        : nextSelection;
      return { ...currentSelections, [activeTask]: resolvedSelection };
    });
  }, [activeTask]);
  const [taskModule, setTaskModule] = useState(initialTask === "reverseReceive" ? "reverse" : "forward");
  // Only the forward receive view is batch-based. reverseReceive is backed by
  // GetShipmentOrders (status 401) and must render the returned orders.
  const isReceiveTask = activeTask === "receive";
  const [showDashboardBack, setShowDashboardBack] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailPanelWidth, setDetailPanelWidth] = useState(480);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [mobileConsolidatedOpen, setMobileConsolidatedOpen] = useState(false);
  const [detailItems, setDetailItems] = useState([]);
  const [detailHistory, setDetailHistory] = useState([]);
  const [detailDataLoading, setDetailDataLoading] = useState(false);
  const [detailView, setDetailView] = useState("general");
  const [inboundBatches, setInboundBatches] = useState([]);
  const [allInboundBatches, setAllInboundBatches] = useState([]);
  const [inboundBatchTotal, setInboundBatchTotal] = useState(0);
  const [inboundBatchesLoading, setInboundBatchesLoading] = useState(false);
  const [parentTaskCounts, setParentTaskCounts] = useState({ confirmed: 0, deliver: 0, dispatch: 0, receive: 0, forwardReverse: 0, reversed: 0, reverseReceive: 0 });
  const [receiveBatch, setReceiveBatch] = useState(null);
  const [receiveItems, setReceiveItems] = useState([]);
  const [receiveItemsLoading, setReceiveItemsLoading] = useState(false);
  const [receivedOrderKeys, setReceivedOrderKeys] = useState([]);
  const [receiveScan, setReceiveScan] = useState("");
  const [showReceiveBatchModal, setShowReceiveBatchModal] = useState(false);
  const [batchPanelMode, setBatchPanelMode] = useState("");
  const [batchPanelOrders, setBatchPanelOrders] = useState([]);
  const [batchDestination, setBatchDestination] = useState(null);
  const [batchCourier, setBatchCourier] = useState(null);
  const [batchPanelStage, setBatchPanelStage] = useState("consolidate");
  const [batchCourierCost, setBatchCourierCost] = useState("");
  const [batchReceipt, setBatchReceipt] = useState(null);
  const [batchScan, setBatchScan] = useState("");
  const [batchScannedKeys, setBatchScannedKeys] = useState([]);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [outboundBatches, setOutboundBatches] = useState([]);
  const [outboundBatchPage, setOutboundBatchPage] = useState(1);
  const [outboundBatchPageSize] = useState(1000);
  const [outboundBatchTotal, setOutboundBatchTotal] = useState(0);
  const [outboundBatchesLoading, setOutboundBatchesLoading] = useState(false);
  const [outboundBatchSearch, setOutboundBatchSearch] = useState("");
  const [debouncedOutboundBatchSearch, setDebouncedOutboundBatchSearch] = useState("");
  const [existingBatchCode, setExistingBatchCode] = useState("");
  const [existingBatchOriginalOrders, setExistingBatchOriginalOrders] = useState([]);
  const [existingBatchEditOnly, setExistingBatchEditOnly] = useState(false);

  // Sticker download hook
  const { showSizeSelectionModal, showBulkSizeSelectionModal, isGenerating } = useStickerDownload();

  const {
    loading,
    error,
    shipmentOrders,
    pagination,
    fetchShipmentOrders,
    clearShipmentOrder,
    clearError,
    updateParams,
    handleUpdateShipmentStatusBatch,
    fetchShipmentOrder,
    fetchHandoverItems,
    handleReceiveInboundShipmentBatch,
    handlePostRiderManifestTx,
    dcCode: assignedDefaultDCCode,
  } = useShipment();
  const { vendors } = useVendors({ pageNo: 1, pageSize: 500 });
  const { filters: globalFilters } = useGlobalFilters();
  const {
    distributionCenters, couriers,
    fetchDistributionCenters,
    fetchCouriers,
    fetchUsersByRole,
  } = useAdmin();
  const scopedVendorCode = isVendorOnly ? loggedInVendorCode : vendorCode;
  const rawGlobalDCFilter = String(globalFilters.dcCodes || globalFilters.dcCode || "");
  const assignedDistributionCenters = useMemo(() => filterDistributionCentersToAssigned(user, distributionCenters), [user, distributionCenters]);
  const assignedGlobalDCCodes = assignedDistributionCenters
    .map((dc) => dc.DCCode || dc.dcCode)
    .filter(Boolean);
  const allExceptSelected = rawGlobalDCFilter.startsWith("__ALL_EXCEPT__:");
  const excludedGlobalDCCodes = new Set(allExceptSelected
    ? rawGlobalDCFilter.slice("__ALL_EXCEPT__:".length).split("|").filter(Boolean)
    : []);
  const selectedGlobalDCCodes = (rawGlobalDCFilter === "__ALL__" || allExceptSelected
    ? assignedGlobalDCCodes.filter((code) => !excludedGlobalDCCodes.has(code))
    : rawGlobalDCFilter.split(","))
    .map((code) => code.trim())
    .filter((code) => code && code !== "__NONE__");
  const noDCSelected = rawGlobalDCFilter === "__NONE__";
  const allDCsSelected = rawGlobalDCFilter === "__ALL__";
  const shipmentScopeDCCodes = noDCSelected
    ? ""
    : (allDCsSelected || allExceptSelected ? rawGlobalDCFilter : selectedGlobalDCCodes.join(",")) || assignedDefaultDCCode || "";
  const currentDCCode = !allDCsSelected && !allExceptSelected && selectedGlobalDCCodes.length === 1
    ? selectedGlobalDCCodes[0]
    : (selectedGlobalDCCodes.length || noDCSelected ? "" : assignedDefaultDCCode || "");
  const inboundDestinationScope = noDCSelected ? "" : shipmentScopeDCCodes || currentDCCode;

  const selectedDetailOrder = selectedRowKeys.length === 1 && Array.isArray(shipmentOrders)
    ? shipmentOrders.find((order) => order.OrderNO === selectedRowKeys[0])
    : null;
  const detailPanelOrder = selectedRowKeys.length > 1 ? null : (selectedDetailOrder || detailOrder);

  const pickScanStorageKey = `cossim-pick-scan-draft:${shipmentScopeDCCodes || "unassigned"}`;

  useEffect(() => {
    if (typeof window === "undefined" || batchPanelMode !== "confirmed") return;
    window.localStorage.setItem(pickScanStorageKey, JSON.stringify({
      orders: batchPanelOrders,
      scannedKeys: batchScannedKeys,
      savedAt: new Date().toISOString(),
    }));
  }, [batchPanelMode, batchPanelOrders, batchScannedKeys, pickScanStorageKey]);

  useEffect(() => {
    const orderNO = detailPanelOrder?.OrderNO;
    setDetailView("general");
    if (!orderNO) {
      setDetailItems([]);
      setDetailHistory([]);
      setDetailDataLoading(false);
      return undefined;
    }

    let active = true;
    const embeddedItems = Array.isArray(detailPanelOrder.ShipmentOrderItems)
      ? detailPanelOrder.ShipmentOrderItems
      : [];
    setDetailItems(embeddedItems);
    setDetailHistory([]);
    setDetailDataLoading(true);

    const timer = window.setTimeout(async () => {
      const [itemsResult, historyResult] = await Promise.allSettled([
        getShipmentOrderItems({ orderNO }),
        getShipmentTimeline({ orderNo: orderNO }),
      ]);
      if (!active) return;

      if (itemsResult.status === "fulfilled") {
        setDetailItems(extractResponseList(itemsResult.value));
      }
      if (historyResult.status === "fulfilled") {
        setDetailHistory(extractResponseList(historyResult.value));
      }
      setDetailDataLoading(false);
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [detailPanelOrder]);

  useEffect(() => {
    const destinationDCCodes = inboundDestinationScope.split(",").map((code) => code.trim()).filter(Boolean);
    if (!destinationDCCodes.length) {
      setAllInboundBatches([]);
      setInboundBatches([]);
      setInboundBatchTotal(0);
      setParentTaskCounts((current) => ({ ...current, receive: 0 }));
      setInboundBatchesLoading(false);
      return undefined;
    }
    let active = true;
    setInboundBatchesLoading(true);
    Promise.all(destinationDCCodes.map((destinationDCCode) => getHandoverBatchList({
        pageNo: 1,
        pageSize: 1000,
        search: searchTerm || undefined,
        DestinationDCCode: destinationDCCode,
        startDate: formatLocalDateOnly(getSlaWindowStart(startDate)),
        endDate: formatLocalDateOnly(endDate),
        IsInBound: 1,
        orderBy: "DateAdded",
        sortDir: "DESC",
      }))).then((responses) => {
      if (!active) return;
      const selectedDestinations = new Set(destinationDCCodes.map((code) => code.toUpperCase()));
      const uniqueBatches = new Map(responses.flatMap(extractResponseList).map((batch) => [batch.HandoverCode, batch]));
      const destinationBatches = [...uniqueBatches.values()].filter((batch) => {
        const destinationCode = batch.ToDCCode || batch.DestinationDCCode || batch.DestinationCode;
        return Number(batch.StatusID) === 1 && selectedDestinations.has(String(destinationCode || "").toUpperCase());
      });
      return Promise.all(destinationBatches.map(async (batch) => {
        try {
          const batchDestinationDC = batch.ToDCCode || batch.DestinationDCCode || batch.DestinationCode;
          const itemResponse = await fetchHandoverItems({ handoverCode: batch.HandoverCode, ToDCCode: batchDestinationDC, pageNo: 1, pageSize: 1000 });
          const items = extractResponseList(itemResponse);
          const isReverse = items.some((item) => [401, 402, 701, 702, 703, 704, 902].includes(Number(item.OrderStatusID)) || /RETURN|REVERSE|DECLINED/i.test(`${item.StatusName || ""}`));
          const receivedItems = items.filter((item) => [201, 402, 703].includes(Number(item.OrderStatusID)) || /RECEIVED|RETURNED TO VENDOR/i.test(`${item.StatusName || ""}`)).length;
          return { ...batch, _IsReverse: isReverse, _ReceivedItems: receivedItems, _LoadedItems: items.length };
        } catch {
          return { ...batch, _IsReverse: false, _ReceivedItems: 0 };
        }
      }));
    }).then((enrichedBatches) => {
      if (!active) return;
      const forwardBatches = enrichedBatches.filter((batch) => !batch._IsReverse);
      setAllInboundBatches(enrichedBatches);
      setParentTaskCounts((current) => ({
        ...current,
        receive: forwardBatches.length,
      }));
    }).catch((batchError) => {
      if (active) notify.error(batchError?.message || "Failed to load inbound batches");
    }).finally(() => {
      if (active) setInboundBatchesLoading(false);
    });
    return () => { active = false; };
  }, [searchTerm, startDate, endDate, inboundDestinationScope]);

  useEffect(() => {
    if (!isReceiveTask) return;
    const taskBatches = allInboundBatches.filter((batch) => !batch._IsReverse);
    setInboundBatches(taskBatches);
    setInboundBatchTotal(taskBatches.length);
  }, [activeTask, allInboundBatches, isReceiveTask]);

  const loadOutboundBatches = async (pageNo = outboundBatchPage) => {
    if (!shipmentScopeDCCodes && !isVendorOnly) {
      setOutboundBatches([]);
      setOutboundBatchTotal(0);
      return;
    }
    setOutboundBatchesLoading(true);
    try {
      const response = await getHandoverBatchList({ pageNo, pageSize: outboundBatchPageSize, search: debouncedOutboundBatchSearch || undefined, statusID: 2, FromDCCode: shipmentScopeDCCodes, IsInBound: 0, startDate: formatLocalDateOnly(getSlaWindowStart(startDate)), endDate: formatLocalDateOnly(endDate), orderBy: "DateAdded", sortDir: "DESC" });
      const batches = extractResponseList(response).filter((batch) => Number(batch.StatusID) === 2);
      const total = Number(response?.TotalCount ?? response?.totalCount ?? response?.Data?.TotalCount ?? response?.data?.totalCount);
      setOutboundBatches(batches);
      setOutboundBatchTotal(Number.isFinite(total) ? total : batches.length);
    } catch (batchError) {
      notify.error(batchError?.message || "Failed to load consolidated batches");
    } finally {
      setOutboundBatchesLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOutboundBatchPage(1);
      setDebouncedOutboundBatchSearch(outboundBatchSearch.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [outboundBatchSearch]);

  useEffect(() => {
    if (activeTask === "dispatch") loadOutboundBatches(outboundBatchPage);
  }, [activeTask, shipmentScopeDCCodes, outboundBatchPage, outboundBatchPageSize, startDate, endDate, debouncedOutboundBatchSearch]);

  // Cached responses can briefly expose the full API envelope instead of its
  // Data array. Keep rendering resilient while the fresh request replaces it.
  const apiShipmentOrderList = Array.isArray(shipmentOrders) ? shipmentOrders : [];
  const shipmentOrderList = apiShipmentOrderList;
  const vendorList = Array.isArray(vendors) ? vendors : [];
  const distributionCenterList = assignedDistributionCenters;

  useEffect(() => {
    let active = true;
    if (!shipmentScopeDCCodes && !isVendorOnly) {
      clearShipmentOrder();
      setParentTaskCounts((current) => ({
        ...current,
        deliver: 0,
        dispatch: 0,
        confirmed: 0,
        forwardReverse: 0,
        receive: 0,
        reverseReceive: 0,
      }));
      return () => { active = false; };
    }
    const commonParams = {
      pageNo: 1,
      countOnly: true,
      requireDCScope: true,
      vendorCode: scopedVendorCode || undefined,
      toDCCode: toDCCode || undefined,
      onlyActive,
      startDate: formatLocalDateOnly(startDate),
      endDate: formatLocalDateOnly(endDate),
    };
    const responseTotal = (response) => Number(response?.TotalCount ?? response?.totalCount ?? extractResponseList(response).length ?? 0);
    const taskCountParams = (taskType) => ({
      ...commonParams,
      startDate: formatLocalDateOnly(startDate),
      taskType,
      // Dispatch/handover orders leave the selected DC, so scope them by origin.
      fromDCCode: taskType === "dispatch" ? shipmentScopeDCCodes : undefined,
      toDCCode: taskType === "dispatch" ? undefined : commonParams.toDCCode,
      checkSLA: taskType !== "confirmed",
      // Badge counts are independent, disposable requests. Do not let cached
      // background refreshes outlive a tab change or share the active-list UI.
      indexedDBCache: false,
      backgroundRefresh: false,
    });

    const countTaskTypes = ["deliver", "dispatch", "confirmed", "forwardReverse", "reversed", "reverseReceive"];
    Promise.allSettled(countTaskTypes.map((taskType) => getShipmentOrders(taskCountParams(taskType)))).then((results) => {
      if (!active) return;
      setParentTaskCounts((current) => {
        const next = { ...current };
        results.forEach((result, index) => {
          if (result.status === "fulfilled") next[countTaskTypes[index]] = responseTotal(result.value);
        });
        return next;
      });
    });

    return () => { active = false; };
  }, [vendorCode, fromDCCode, toDCCode, onlyActive, startDate, endDate, distributionCenterList, shipmentScopeDCCodes, clearShipmentOrder]);

  const taskCounts = parentTaskCounts;
  useEffect(() => {
    const counts = { ...parentTaskCounts };
    window.localStorage.setItem("cossim-task-navigation-counts", JSON.stringify(counts));
    window.dispatchEvent(new CustomEvent("cossim:task-counts-updated", { detail: counts }));
  }, [parentTaskCounts]);
  const taskOrders = useMemo(
    () => [...shipmentOrderList].sort((a, b) => {
        const slaDifference = getOrderSlaState(a).priority - getOrderSlaState(b).priority;
        return slaDifference || getOrderAgeDays(b.DateAdded) - getOrderAgeDays(a.DateAdded);
      }),
    [shipmentOrderList]
  );
  const taskPageLoading = isReceiveTask
    ? inboundBatchesLoading && inboundBatches.length === 0
    : loading && shipmentOrderList.length === 0;
  const selectedOrdersForActions = useMemo(
    () => shipmentOrderList.filter((order) => selectedRowKeys.includes(order.OrderNO)),
    [shipmentOrderList, selectedRowKeys]
  );
  const selectionHasThirdAttempt = selectedOrdersForActions.some((order) => {
    const statusID = Number(order.OrderStatusID ?? order.StatusID);
    const statusName = String(order.StatusName || order.OrderStatusName || "").toUpperCase();
    return statusID === 306 || statusName.includes("3RD ATTEMPT") || statusName.includes("THIRD ATTEMPT");
  });
  const selectedReturnsAreAtOrigin = ["reversed", "forwardreverse"].includes(String(activeTask || "").toLowerCase()) && selectedOrdersForActions.length > 0
    && selectedOrdersForActions.every((order) => {
      const normalizeDC = (value) => String(value || "").trim().toUpperCase();
      const originCode = normalizeDC(order.OriginDCCode);
      const destinationCode = normalizeDC(order.DestinationDCCode);
      return Boolean(originCode && destinationCode && originCode === destinationCode);
    });
  const allSelectedOrdersAssigned = selectedOrdersForActions.length > 0
    && selectedOrdersForActions.every(isAssignedDeliveryOrder);

  const vendorOptions = useMemo(
    () =>
      vendorList
        .map((vendor) => {
          const code = getVendorCode(vendor);
          return code
            ? {
                value: code,
                label: `${getVendorName(vendor)} (${code})`,
              }
            : null;
        })
        .filter(Boolean),
    [vendorList]
  );

  const dcOptions = useMemo(
    () =>
      distributionCenterList
        .map((dc) => {
          const code = getDCCode(dc);
          return code
            ? {
                value: code,
                label: `${getDCName(dc)} (${code})`,
              }
            : null;
        })
        .filter(Boolean),
    [distributionCenterList]
  );

  const globalDCOptions = useMemo(
    () =>
      (Array.isArray(distributionCenters) ? distributionCenters : [])
        .map((dc) => {
          const code = getDCCode(dc);
          return code
            ? {
                value: code,
                label: `${getDCName(dc)} (${code})`,
              }
            : null;
        })
        .filter(Boolean),
    [distributionCenters]
  );

  const chooseActionDC = async (actionLabel = "post this action") => {
    if (!allDCsSelected && !allExceptSelected && selectedGlobalDCCodes.length === 1) return selectedGlobalDCCodes[0];
    if (!selectedGlobalDCCodes.length) return assignedDefaultDCCode || "";

    const actionDCCodes = allDCsSelected
      ? dcOptions.map((option) => option.value)
      : allExceptSelected
        ? dcOptions.map((option) => option.value).filter((code) => !excludedGlobalDCCodes.has(code))
        : selectedGlobalDCCodes;
    const selectedOptions = actionDCCodes.map((code) => {
      const option = dcOptions.find((item) => item.value === code);
      return [code, option?.label || code];
    });
    const optionLookup = new Map(selectedOptions.flatMap(([code, label]) => [
      [code.toLowerCase(), code],
      [label.toLowerCase(), code],
    ]));
    const { value } = await Swal.fire({
      title: "Choose the posting DC",
      text: `Select the distribution center that will ${actionLabel}. This choice applies only to this submission.`,
      input: "text",
      inputPlaceholder: "Search distribution centers",
      showCancelButton: true,
      confirmButtonText: "Continue",
      didOpen: () => {
        const input = Swal.getInput();
        if (!input) return;
        input.setAttribute("list", "posting-dc-options");
        input.setAttribute("autocomplete", "off");
        const dataList = document.createElement("datalist");
        dataList.id = "posting-dc-options";
        selectedOptions.forEach(([code, label]) => {
          const option = document.createElement("option");
          option.value = label;
          option.label = code;
          dataList.appendChild(option);
        });
        input.parentElement?.appendChild(dataList);
      },
      inputValidator: (inputValue) => optionLookup.has((inputValue || "").trim().toLowerCase()) ? undefined : "Choose a distribution center from the list",
    });
    return optionLookup.get((value || "").trim().toLowerCase()) || "";
  };

  const courierOptions = useMemo(() => (Array.isArray(couriers) ? couriers : [])
    .filter((courier) => courier.IsActive !== false && !courier.IsDeleted)
    .map((courier) => ({ value: courier.CourierCode, label: `${courier.CourierName || courier.CourierCode} (${courier.CourierCode})` })), [couriers]);

  const buildShipmentOrderParams = (overrides = {}) => {
    const { taskType: requestedTaskType, ...requestOverrides } = overrides;
    const taskType = requestedTaskType || activeTask;
    const isDispatchTask = taskType === "dispatch";
    return ({
    pageNo: 1,
    pageSize: requestOverrides.pageSize || 1000,
    requireDCScope: true,
    searchTerm,
    vendorCode: scopedVendorCode || undefined,
    statusIDs: undefined,
    onlyActive,
    startDate: formatLocalDateOnly(startDate),
    endDate: formatLocalDateOnly(endDate),
    orderBy: "DateAdded",
    sortDir: "ASC",
    ...requestOverrides,
    startDate: formatLocalDateOnly(requestOverrides.startDate || startDate),
    fromDCCode: isDispatchTask ? shipmentScopeDCCodes : undefined,
    toDCCode: isDispatchTask
      ? undefined
      : (requestOverrides.toDCCode || toDCCode || undefined),
    vendorCategoryCode: undefined,
    taskType,
    checkSLA: taskType !== "confirmed",
  });
  };

  const loadShipmentOrders = (overrides = {}) => {
    if (!shipmentScopeDCCodes && !isVendorOnly) {
      clearShipmentOrder();
      setSelectedRowKeys([]);
      return Promise.resolve({ Data: [], TotalCount: 0 });
    }
    const params = buildShipmentOrderParams(overrides);
    updateParams(params);
    return fetchShipmentOrders(params);
  };

  useEffect(() => {
    if (isVendorOnly && loggedInVendorCode && vendorCode !== loggedInVendorCode) {
      setVendorCode(loggedInVendorCode);
    }
  }, [isVendorOnly, loggedInVendorCode, vendorCode]);

  useEffect(() => {
    const nextStartDate = parsePackageFilterDate(globalFilters.startDate);
    const nextEndDate = parsePackageFilterDate(globalFilters.endDate);
    const nextVendorCode = isVendorOnly ? loggedInVendorCode : (globalFilters.vendorCode || "");
    const availableCodes = new Set(dcOptions.map((option) => option.value));
    const nextDCCode = normalizeDCScope(globalFilters.dcCodes || globalFilters.dcCode, availableCodes);
    const datesChanged = formatLocalDateOnly(startDate) !== formatLocalDateOnly(nextStartDate)
      || formatLocalDateOnly(endDate) !== formatLocalDateOnly(nextEndDate);
    const vendorChanged = vendorCode !== nextVendorCode;
    const dcChanged = fromDCCode !== nextDCCode && toDCCode !== nextDCCode;
    if (!datesChanged && !vendorChanged && !dcChanged) return;

    setStartDate(nextStartDate);
    setEndDate(nextEndDate);
    setVendorCode(nextVendorCode);
    setFromDCCode(nextDCCode);
    setToDCCode(nextDCCode);
    loadShipmentOrders({
      pageNo: 1,
      vendorCode: nextVendorCode || undefined,
      toDCCode: nextDCCode || undefined,
      statusIDs: undefined,
      taskType: activeTask,
      checkSLA: activeTask !== "confirmed",
      startDate: formatLocalDateOnly(nextStartDate),
      endDate: formatLocalDateOnly(nextEndDate),
    });
  }, [globalFilters.startDate, globalFilters.endDate, globalFilters.vendorCode, globalFilters.dcCode, globalFilters.dcCodes, dcOptions]);

  // Fetch shipment orders on component mount
  useEffect(() => {
    const queryFilters = getPackageQueryFilters();
    const selectedInitialStatus = initialStatusName || queryFilters.statusName || "";
    const querySearchTerm = queryFilters.searchTerm || "";
    const effectiveStartDate = queryFilters.startDate || parsePackageFilterDate(globalFilters.startDate);
    const effectiveEndDate = queryFilters.endDate || parsePackageFilterDate(globalFilters.endDate);
    const effectiveVendorCode = isVendorOnly
      ? loggedInVendorCode
      : (queryFilters.vendorCode || globalFilters.vendorCode || "");
    const requestedDCCode = queryFilters.toDCCode || globalFilters.dcCodes || globalFilters.dcCode || "";
    const availableCodes = new Set(dcOptions.map((option) => option.value));
    const effectiveDCCode = normalizeDCScope(requestedDCCode, availableCodes);
    const resolvedInitialTask = queryFilters.task === "reverse-orders"
      ? "reversed"
      : ["confirmed", "deliver", "dispatch", "receive", "forwardReverse", "reversed", "reverseReceive"].includes(queryFilters.task)
        ? queryFilters.task
        : (["confirmed", "deliver", "dispatch", "receive", "forwardReverse", "reversed", "reverseReceive"].includes(initialTask) ? initialTask : "deliver");

    setActiveTask(resolvedInitialTask);
    setTaskModule(queryFilters.task === "reverse-orders"
      ? "reverse"
      : queryFilters.taskModule === "forward" || queryFilters.taskModule === "reverse"
        ? queryFilters.taskModule
        : resolvedInitialTask === "reverseReceive" ? "reverse" : "forward");
    setShowDashboardBack(queryFilters.fromDashboard);

    setSearchTerm(queryFilters.searchTerm || "");
    setSelectedStatusName(selectedInitialStatus);
    setVendorCode(effectiveVendorCode);
    setFromDCCode(queryFilters.fromDCCode || "");
    setToDCCode(effectiveDCCode);
    setOnlyActive(Boolean(queryFilters.onlyActive));
    setStartDate(effectiveStartDate || null);
    setEndDate(effectiveEndDate || null);

    const initialTaskUsesOriginDC = resolvedInitialTask === "dispatch";
    const initialParams = {
      pageNo: 1,
      pageSize: 1000,
      requireDCScope: true,
      searchTerm: querySearchTerm,
      vendorCode: effectiveVendorCode || undefined,
      fromDCCode: initialTaskUsesOriginDC ? effectiveDCCode || undefined : undefined,
      toDCCode: initialTaskUsesOriginDC ? undefined : effectiveDCCode || undefined,
      statusIDs: undefined,
      taskType: resolvedInitialTask,
      checkSLA: resolvedInitialTask !== "confirmed",
      onlyActive: Boolean(queryFilters.onlyActive),
      startDate: formatLocalDateOnly(effectiveStartDate),
      endDate: formatLocalDateOnly(effectiveEndDate),
      orderBy: "DateAdded",
      sortDir: "ASC",
    };
    updateParams(initialParams);
    // Each hook already records its own error state. Consume rejected requests
    // here so an offline/cache miss cannot escape the effect and trip Next's
    // global error boundary.
    if (shipmentScopeDCCodes || isVendorOnly) fetchShipmentOrders(initialParams).catch(() => {});
    else clearShipmentOrder();
    fetchDistributionCenters({ pageNo: 1, pageSize: 500 }).catch(() => {});
    fetchCouriers().catch(() => {});

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [urlSearchParams, shipmentScopeDCCodes]);

  // Fetch all data for export, in small batches instead of one huge request,
  // reporting progress back to the export UI as each batch completes.
  const fetchAllDataForExport = async (onProgress) => {
    try {
      const fetchInBatches = createFetchAllDataFunction(
        fetchShipmentOrders,
        buildShipmentOrderParams(),
        { chunkSize: 500 }
      );
      return await fetchInBatches(onProgress);
    } catch (error) {
      console.error('Error fetching all data for export:', error);
      // Fallback to current page data if fetch fails
      return shipmentOrderList;
    }
  };

  // Handle search functionality
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      loadShipmentOrders({
        pageNo: 1,
        searchTerm: selectedStatusName || value,
      });
    }, 500);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadShipmentOrders({
      pageNo: 1,
      pageSize: pagination.pageSize,
      forceRefresh: true,
      orderBy: "DateAdded",
      sortDir: "ASC"
    });
  };

  // Handle download sticker
  const handleDownloadSticker = (record) => {
    showSizeSelectionModal(record);
  };

  // Handle bulk download stickers
  const handleBulkDownloadStickers = () => {
    const selectedPackages = shipmentOrderList.filter(order => selectedRowKeys.includes(order.OrderNO));
    if (selectedPackages.length === 0) return;

    showBulkSizeSelectionModal(selectedPackages);
  };

  const openBatchPanel = (mode) => {
    const selectedVendorCode = selectedOrdersForActions[0]?.VendorCode;
    const selectedVendorCodes = [...new Set(selectedOrdersForActions.map((order) => order.VendorCode).filter(Boolean))];
    if (mode === "reversed" && selectedVendorCodes.length > 1) {
      notify.error("Select orders from one vendor at a time for a return.");
      return;
    }
    const selectedVendor = mode === "reversed" && selectedVendorCode
      ? vendorOptions.find((option) => option.value === selectedVendorCode) || { value: selectedVendorCode, label: selectedOrdersForActions[0]?.VendorName || selectedVendorCode }
      : null;
    let restoredOrders = [];
    let restoredScannedKeys = [];
    if (mode === "confirmed" && typeof window !== "undefined") {
      try {
        const draft = JSON.parse(window.localStorage.getItem(pickScanStorageKey) || "null");
        restoredOrders = Array.isArray(draft?.orders) ? draft.orders : [];
        restoredScannedKeys = Array.isArray(draft?.scannedKeys) ? draft.scannedKeys : [];
      } catch {
        window.localStorage.removeItem(pickScanStorageKey);
      }
    }
    const initialOrders = mode === "confirmed"
      ? [...restoredOrders, ...selectedOrdersForActions].filter((order, index, orders) => order?.OrderNO && orders.findIndex((item) => item?.OrderNO === order.OrderNO) === index)
      : selectedOrdersForActions;
    setBatchPanelMode(mode);
    setExistingBatchCode("");
    setExistingBatchEditOnly(false);
    setBatchPanelOrders(initialOrders);
    const hqDestination = mode === "forwardReverse"
      ? dcOptions.find((option) => /(^|\b)HQ(\b|$)|HEAD\s*OFFICE/i.test(option.label))
      : null;
    setBatchDestination(selectedVendor || hqDestination || null);
    setBatchCourier(null);
    setBatchPanelStage("consolidate");
    setBatchCourierCost("");
    setBatchReceipt(null);
    setBatchScan("");
    setBatchScannedKeys(mode === "confirmed" ? restoredScannedKeys.filter((key) => initialOrders.some((order) => order.OrderNO === key)) : []);
    setDetailOrder(null);
  };

  const handleConsolidate = () => openBatchPanel("dispatch");

  const handleDirectReturnToVendor = async () => {
    if (!selectedReturnsAreAtOrigin) return notify.error("Select return orders whose Current DC is their Origin DC.");
    const { isConfirmed } = await MySwal.fire({
      title: "Return directly to vendor?",
      text: `${selectedOrdersForActions.length} package${selectedOrdersForActions.length === 1 ? "" : "s"} will be marked Returned to Vendor without consolidation.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Return to Vendor",
      confirmButtonColor: "#dc3545",
    });
    if (!isConfirmed) return;
    try {
      const postingDC = selectedOrdersForActions[0].OriginDCCode || selectedOrdersForActions[0].LatestLogDCCode || selectedOrdersForActions[0].CurrentDCCode || selectedOrdersForActions[0].InitialLogDCCode || selectedOrdersForActions[0].DestinationDCCode;
      await updateTaskOrders(selectedOrdersForActions, (order) => ({
        statusID: PACKAGE_STATUSES.RETURNED_TO_VENDOR.orderStatusID,
        notes: "Returned directly to vendor from origin DC; consolidation not required",
        extra: { dcCode: order.OriginDCCode || order.LatestLogDCCode || order.CurrentDCCode || order.InitialLogDCCode || order.DestinationDCCode },
      }), postingDC);
      notify.success(`${selectedOrdersForActions.length} package${selectedOrdersForActions.length === 1 ? "" : "s"} returned to vendor`);
    } catch (error) {
      notify.error(error.message || "Failed to return the selected packages to vendor");
    }
  };

  const openSelectedMobilePanel = () => {
    if (!selectedRowKeys.length) {
      if (activeTask === "dispatch") setMobileConsolidatedOpen(true);
      else if (isReceiveTask) setReceiveBatch({});
      else if (activeTask === "confirmed") openBatchPanel("confirmed");
      else if (activeTask === "reversed") openBatchPanel("reversed");
      else if (activeTask === "forwardReverse") openBatchPanel("forwardReverse");
      return;
    }
    if (isReceiveTask) {
      openReceivePanels(inboundBatches.filter((batch) => selectedRowKeys.includes(batch.HandoverCode)));
      return;
    }
    if (activeTask === "confirmed") return openBatchPanel("confirmed");
    if (activeTask === "reversed") return openBatchPanel("reversed");
    if (activeTask === "forwardReverse") return openBatchPanel("forwardReverse");
    if (activeTask === "dispatch") return handleConsolidate();
    if (activeTask === "deliver") return openDeliveryActionChooser();
    if (selectedOrdersForActions.length === 1) {
      setDetailOrder(selectedOrdersForActions[0]);
      setMobileDetailOpen(true);
    }
  };

  const persistActiveTask = (task) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("cossim-packages-active-task", task);
    const params = new URLSearchParams(window.location.search);
    params.set("task", task);
    params.set("taskModule", taskModule);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  };

  const openExistingBatchCompletion = async (batch, editOnly = false) => {
    setBatchSubmitting(true);
    try {
      const response = await fetchHandoverItems({ handoverCode: batch.HandoverCode, pageNo: 1, pageSize: 500 });
      const items = extractResponseList(response);
      const orders = items.map((item) => ({ ...item, OrderNO: item.OrderNO })).filter((item) => item.OrderNO);
      setExistingBatchCode(batch.HandoverCode);
      setExistingBatchEditOnly(editOnly);
      setBatchPanelMode("dispatch");
      setBatchPanelStage("complete");
      setBatchPanelOrders(orders);
      setExistingBatchOriginalOrders(orders);
      setBatchScannedKeys(orders.map((order) => order.OrderNO));
      setBatchDestination(dcOptions.find((option) => option.value === batch.ToDCCode) || { value: batch.ToDCCode, label: batch.ToDCName || batch.ToDCCode });
      setBatchCourier(null);
      setBatchCourierCost("");
      setBatchReceipt(null);
    } catch (error) {
      notify.error(error.message || "Failed to open consolidated batch");
    } finally {
      setBatchSubmitting(false);
    }
  };

  const updateTaskOrders = async (orders, buildUpdate, requestedActionDCCode = "") => {
    const actionDCCode = requestedActionDCCode || await chooseActionDC("post this order action");
    if (!actionDCCode) throw new Error("Choose a distribution center to continue.");
    const updates = orders.map((order) => ({ order, ...buildUpdate(order) }));
    await handleUpdateShipmentStatusBatch(updates.map(({ order, statusID, notes, extra = {} }) => ({ statusID, orderNO: order.OrderNO, notes, dcCode: extra.dcCode || actionDCCode, courierCode: extra.courierCode || extra.riderCode || "" })));
    await loadShipmentOrders({ pageNo: pagination.currentPage });
    setSelectedRowKeys([]);
  };

  const handleExistingBatchEdit = async () => {
    const originalOrderNOs = new Set(existingBatchOriginalOrders.map((order) => order.OrderNO));
    const currentOrderNOs = new Set(batchPanelOrders.map((order) => order.OrderNO));
    const addOrderNOs = [...currentOrderNOs].filter((orderNO) => !originalOrderNOs.has(orderNO));
    const removeOrderNOs = [...originalOrderNOs].filter((orderNO) => !currentOrderNOs.has(orderNO));
    if (!addOrderNOs.length && !removeOrderNOs.length) return notify.error("No batch changes to save.");
    const { isConfirmed } = await MySwal.fire({
      title: "Save batch changes?",
      text: `${addOrderNOs.length} package${addOrderNOs.length === 1 ? "" : "s"} added and ${removeOrderNOs.length} removed. Removed packages will be released.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Save Changes",
    });
    if (!isConfirmed) return;
    setBatchSubmitting(true);
    try {
      const response = await editHandoverBatch({ handoverCode: existingBatchCode, addOrderNOs, removeOrderNOs });
      if (response?.Error) throw new Error(response.Message || "Failed to update batch");
      setExistingBatchOriginalOrders(batchPanelOrders);
      notify.success(response?.Message || "Batch updated successfully");
      await loadOutboundBatches();
    } catch (error) {
      notify.error(error.message || "Failed to update batch");
    } finally {
      setBatchSubmitting(false);
    }
  };

  const handleExistingBatchCancel = async () => {
    const { isConfirmed } = await MySwal.fire({
      title: "Cancel consolidated batch?",
      text: "All packages in this batch will be released back to pending dispatch.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Cancel Batch",
      confirmButtonColor: "#dc3545",
    });
    if (!isConfirmed) return;
    setBatchSubmitting(true);
    try {
      const response = await editHandoverBatch({ handoverCode: existingBatchCode, cancelBatch: true });
      if (response?.Error) throw new Error(response.Message || "Failed to cancel batch");
      notify.success(response?.Message || "Batch cancelled and packages released");
      setExistingBatchCode("");
      setExistingBatchEditOnly(false);
      setBatchPanelMode("");
      setBatchPanelOrders([]);
      setExistingBatchOriginalOrders([]);
      await loadOutboundBatches();
    } catch (error) {
      notify.error(error.message || "Failed to cancel batch");
    } finally {
      setBatchSubmitting(false);
    }
  };

  const chooseTaskOption = async ({ title, options }) => {
    let selectedValue = "";
    const result = await MySwal.fire({
      title,
      html: `<div class="delivery-action-grid">${options.map((option) => `
        <button type="button" class="delivery-action-button" data-task-option="${option.value}">
          <span class="delivery-action-button-icon"><i class="${option.icon}"></i></span>
          <span>${option.label}</span>
        </button>`).join("")}</div>`,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: "Cancel",
      width: 680,
      didOpen: (popup) => {
        popup.querySelectorAll("[data-task-option]").forEach((button) => {
          button.addEventListener("click", () => {
            selectedValue = button.dataset.taskOption;
            Swal.close();
          });
        });
      },
      willClose: () => selectedValue,
    });
    return selectedValue || result.value || "";
  };

  const chooseSearchableDC = async (orders = [], courierChoices = {}) => {
    const { value } = await MySwal.fire({
      title: "Reroute Packages",
      html: (
        <div className="task-searchable-select">
          <div className="text-start">
            <label className="form-label fw-semibold">Selected packages ({orders.length})</label>
            <div className="d-flex flex-wrap gap-2">
              {orders.map((order) => <span key={order.OrderNO} className="badge bg-light text-dark border">{order.OrderNO}</span>)}
            </div>
          </div>
          <label className="form-label fw-semibold text-start mb-0" htmlFor="task-dc-search">Destination DC</label>
          <input id="task-dc-search" className="swal2-input" placeholder="Search DC name or code" autoComplete="off" />
          <select id="task-dc-select" className="swal2-select" size="5" aria-label="Destination distribution center">
            {dcOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <small id="task-dc-empty" className="text-muted d-none">No matching distribution centers</small>
          <label className="form-label fw-semibold text-start mb-0 mt-2" htmlFor="task-courier-search">Courier</label>
          <input id="task-courier-search" className="swal2-input" placeholder="Search courier name or code" autoComplete="off" />
          <select id="task-courier-select" className="swal2-select" size="5" aria-label="Courier">
            {Object.entries(courierChoices).map(([code, name]) => <option key={code} value={code}>{`${name} (${code})`}</option>)}
          </select>
          <small id="task-courier-empty" className={`text-muted ${Object.keys(courierChoices).length ? "d-none" : ""}`}>No matching couriers</small>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: "Reroute",
      width: 680,
      didOpen: () => {
        const connectSearch = (searchID, selectID, emptyID) => {
          const search = document.getElementById(searchID);
          const select = document.getElementById(selectID);
          const empty = document.getElementById(emptyID);
          if (!search || !select || !empty) return;
          const filterOptions = () => {
          const query = search.value.trim().toLowerCase();
          let matches = 0;
          Array.from(select.options).forEach((option) => {
            const visible = option.text.toLowerCase().includes(query) || option.value.toLowerCase().includes(query);
            option.hidden = !visible;
            if (visible) matches += 1;
          });
          const firstVisible = Array.from(select.options).find((option) => !option.hidden);
          if (firstVisible) select.value = firstVisible.value;
          empty.classList.toggle("d-none", matches > 0);
          };
          search.addEventListener("input", filterOptions);
          select.addEventListener("change", () => { if (select.selectedOptions[0]) search.value = select.selectedOptions[0].text; });
        };
        connectSearch("task-dc-search", "task-dc-select", "task-dc-empty");
        connectSearch("task-courier-search", "task-courier-select", "task-courier-empty");
        document.getElementById("task-dc-search")?.focus();
      },
      preConfirm: () => {
        const selectedDC = document.getElementById("task-dc-select")?.selectedOptions?.[0];
        const selectedCourier = document.getElementById("task-courier-select")?.selectedOptions?.[0];
        if (!selectedDC || selectedDC.hidden) return Swal.showValidationMessage("Search for and select a destination DC");
        if (!selectedCourier || selectedCourier.hidden) return Swal.showValidationMessage("Search for and select a courier");
        return { dcCode: selectedDC.value, dcLabel: selectedDC.text, courierCode: selectedCourier.value, courierLabel: selectedCourier.text };
      },
    });
    return value || null;
  };

  const chooseSearchableRider = async () => {
    let riders = [];
    try {
      const response = await fetchUsersByRole({ RoleTypeCode: RoleType.RIDER, PageNO: 1, PageSize: 500 });
      riders = extractResponseList(response);
    } catch {
      // External rider assignment remains available if the fleet list cannot load.
    }
    const { value } = await MySwal.fire({
      title: "Choose a Rider",
      html: (
        <div className="task-searchable-select">
          <div className="d-flex gap-3 mb-2">
            <label className="d-flex align-items-center gap-2"><input type="radio" name="task-rider-type" value="fleet" defaultChecked /> COSSIM fleet</label>
            <label className="d-flex align-items-center gap-2"><input type="radio" name="task-rider-type" value="external" /> Non-COSSIM rider</label>
          </div>
          <div id="task-fleet-rider-fields">
            <input id="task-rider-search" className="swal2-input" placeholder="Search rider name, phone, or code" autoComplete="off" />
            <select id="task-rider-select" className="swal2-select" size="7" aria-label="Rider">
              {riders.map((rider) => <option key={rider.UserCode} value={rider.UserCode}>{`${rider.FirstName || ""} ${rider.LastName || ""} (${rider.UserCode})${rider.PhoneNumber ? ` - ${rider.PhoneNumber}` : ""}`}</option>)}
            </select>
            <small id="task-rider-empty" className={`text-muted ${riders.length ? "d-none" : ""}`}>No matching riders</small>
          </div>
          <div id="task-external-rider-fields" className="d-none">
            <input id="task-external-rider-name" className="swal2-input" placeholder="Rider or courier name" autoComplete="off" />
            <input id="task-external-rider-phone" className="swal2-input" type="tel" placeholder="Phone number" autoComplete="off" />
            <input id="task-external-rider-vehicle" className="swal2-input" placeholder="Vehicle / registration (optional)" autoComplete="off" />
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: "Choose Rider",
      didOpen: () => {
        const search = document.getElementById("task-rider-search");
        const select = document.getElementById("task-rider-select");
        const empty = document.getElementById("task-rider-empty");
        const fleetFields = document.getElementById("task-fleet-rider-fields");
        const externalFields = document.getElementById("task-external-rider-fields");
        document.querySelectorAll('input[name="task-rider-type"]').forEach((input) => input.addEventListener("change", () => {
          const external = input.checked && input.value === "external";
          fleetFields.classList.toggle("d-none", external);
          externalFields.classList.toggle("d-none", !external);
          document.getElementById(external ? "task-external-rider-name" : "task-rider-search")?.focus();
        }));
        search.addEventListener("input", () => {
          const query = search.value.trim().toLowerCase();
          let matches = 0;
          Array.from(select.options).forEach((option) => { const visible = option.text.toLowerCase().includes(query) || option.value.toLowerCase().includes(query); option.hidden = !visible; if (visible) matches += 1; });
          const first = Array.from(select.options).find((option) => !option.hidden);
          if (first) select.value = first.value;
          empty.classList.toggle("d-none", matches > 0);
        });
        const populateSelectedRider = () => {
          const selected = select.selectedOptions?.[0];
          if (selected) search.value = selected.text;
        };
        select.addEventListener("change", populateSelectedRider);
        select.addEventListener("click", populateSelectedRider);
        search.focus();
      },
      preConfirm: () => {
        const riderType = document.querySelector('input[name="task-rider-type"]:checked')?.value;
        if (riderType === "external") {
          const name = document.getElementById("task-external-rider-name")?.value?.trim();
          const phone = document.getElementById("task-external-rider-phone")?.value?.trim();
          const vehicle = document.getElementById("task-external-rider-vehicle")?.value?.trim();
          if (!name) return Swal.showValidationMessage("Enter the rider or courier name");
          if (!phone) return Swal.showValidationMessage("Enter the rider phone number");
          return { code: "", label: `${name} - ${phone}${vehicle ? ` - ${vehicle}` : ""}`, isExternal: true };
        }
        const selected = document.getElementById("task-rider-select")?.selectedOptions?.[0];
        if (!selected || selected.hidden) return Swal.showValidationMessage("Search for and select a rider");
        return { code: selected.value, label: selected.text };
      },
    });
    return value || null;
  };

  const requestPromptPhone = async () => {
    const { value } = await MySwal.fire({
      title: "Send M-Pesa Prompt",
      input: "tel",
      inputLabel: "Customer phone number",
      inputPlaceholder: "07XXXXXXXX or 2547XXXXXXXX",
      showCancelButton: true,
      confirmButtonText: "Send STK Push",
      inputValidator: (phone) => {
        const digits = String(phone || "").replace(/\D/g, "");
        if (!/^(?:0?7\d{8}|2547\d{8})$/.test(digits)) return "Enter a valid Kenyan mobile number";
      },
    });
    return value ? String(value).replace(/\D/g, "") : "";
  };

  const collectDeliveryDetails = async (action, onConfirm, onSendPrompt, requiresPayment = true) => {
    const paymentOptions = [
      { value: "prompt", label: "Prompt" },
      { value: "cod", label: "Cash on Delivery" },
    ];
    let promptConfirmation = null;
    const { value } = await MySwal.fire({
      title: "Delivery",
      html: (
        <div className="delivery-completion-form">
          {requiresPayment && <><label className="form-label fw-semibold">Payment option</label>
          <div className="delivery-payment-options">
            {paymentOptions.map((option) => <label key={option.value} className="delivery-payment-option"><input type="checkbox" name="delivery-payment" value={option.value} /><span>{option.label}</span></label>)}
          </div></>}
          {requiresPayment && <><div id="delivery-prompt-phone-wrap" className="mt-3 d-none">
            <label className="form-label fw-semibold" htmlFor="delivery-prompt-phone">M-Pesa phone number</label>
            <div className="input-group">
              <input id="delivery-prompt-phone" type="tel" className="form-control" placeholder="07XXXXXXXX or 2547XXXXXXXX" />
              <button id="delivery-send-prompt" type="button" className="btn btn-primary">Send Prompt</button>
            </div>
            <small className="text-muted">An STK Push will be sent to this number.</small>
          </div>
          <div id="delivery-reference-wrap" className="mt-3 d-none">
            <label className="form-label fw-semibold" htmlFor="delivery-reference">Payment reference number</label>
            <input id="delivery-reference" type="text" className="form-control" placeholder="Enter payment reference number" />
          </div></>}
          <div className="mt-3">
            <label className="form-label fw-semibold" htmlFor="delivery-notes">Notes</label>
            <textarea id="delivery-notes" className="form-control" rows="3" placeholder="Add delivery notes" />
          </div>
          <div id="delivery-wait-message" className="alert alert-info mt-3 mb-0 d-none">Waiting for the customer to confirm the M-Pesa prompt. Keep this window open.</div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: "Confirm Delivery",
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      allowEscapeKey: () => !Swal.isLoading(),
      width: 680,
      didOpen: () => {
        const phoneWrap = document.getElementById("delivery-prompt-phone-wrap");
        const referenceWrap = document.getElementById("delivery-reference-wrap");
        const promptButton = document.getElementById("delivery-send-prompt");
        const phoneInput = document.getElementById("delivery-prompt-phone");
        const confirmButton = Swal.getConfirmButton();
        if (confirmButton) confirmButton.disabled = requiresPayment;
        phoneInput?.addEventListener("input", () => {
          promptConfirmation = null;
          promptButton.disabled = false;
          promptButton.textContent = "Send Prompt";
          promptButton.classList.remove("btn-success");
          promptButton.classList.add("btn-primary");
          if (confirmButton) confirmButton.disabled = true;
        });
        promptButton?.addEventListener("click", async () => {
          const phone = String(phoneInput?.value || "").replace(/\D/g, "");
          if (!/^(?:0?7\d{8}|2547\d{8})$/.test(phone)) return Swal.showValidationMessage("Enter a valid Kenyan mobile number");
          Swal.resetValidationMessage();
          promptButton.disabled = true;
          promptButton.textContent = "Sending...";
          try {
            promptConfirmation = await onSendPrompt(phone);
            promptButton.textContent = "Prompt Confirmed";
            promptButton.classList.remove("btn-primary");
            promptButton.classList.add("btn-success");
            if (confirmButton) confirmButton.disabled = false;
          } catch (error) {
            promptConfirmation = null;
            promptButton.disabled = false;
            promptButton.textContent = "Send Prompt";
            Swal.showValidationMessage(error.message || "M-Pesa prompt could not be confirmed");
          }
        });
        document.querySelectorAll('input[name="delivery-payment"]').forEach((input) => input.addEventListener("change", () => {
          if (input.checked) document.querySelectorAll('input[name="delivery-payment"]').forEach((other) => { if (other !== input) other.checked = false; });
          phoneWrap.classList.toggle("d-none", !(input.checked && input.value === "prompt"));
          referenceWrap.classList.toggle("d-none", !(input.checked && input.value === "cod"));
          if (confirmButton) confirmButton.disabled = input.value === "prompt" ? !promptConfirmation : !input.checked;
        }));
      },
      preConfirm: async () => {
        const popup = Swal.getPopup();
        const payment = requiresPayment ? popup?.querySelector('input[name="delivery-payment"]:checked')?.value : "none";
        if (requiresPayment && !payment) return Swal.showValidationMessage("Choose a payment option");
        const phone = String(popup?.querySelector("#delivery-prompt-phone")?.value || "").replace(/\D/g, "");
        if (payment === "prompt" && !/^(?:0?7\d{8}|2547\d{8})$/.test(phone)) return Swal.showValidationMessage("Enter a valid Kenyan mobile number");
        if (payment === "prompt" && !promptConfirmation) return Swal.showValidationMessage("Click Send Prompt and wait for payment confirmation first");
        const reference = popup?.querySelector("#delivery-reference")?.value?.trim() || "";
        if (payment === "cod" && !reference) return Swal.showValidationMessage("Enter the payment reference number");
        const notes = popup?.querySelector("#delivery-notes")?.value?.trim() || "";
        const waitMessage = popup?.querySelector("#delivery-wait-message");
        if (payment === "prompt") waitMessage?.classList.remove("d-none");
        try {
          await onConfirm({ payment, phone, reference, notes, promptConfirmation });
          return { payment, phone, reference, notes };
        } catch (error) {
          waitMessage?.classList.add("d-none");
          Swal.showValidationMessage(error.message || "Delivery could not be confirmed");
          return false;
        }
      },
    });
    return value || null;
  };

  const waitForStkConfirmation = async (checkoutRequestID) => {
    if (!checkoutRequestID) throw new Error("The payment provider did not return a checkout request ID");
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await checkStkPush({ checkoutRequestID });
      const result = response?.Response ?? response?.response ?? response;
      const resultCode = Number(result?.ResultCode ?? result?.resultCode);
      if (resultCode === 0) return result;
      if (resultCode !== 99) throw new Error(result?.ResultDesc || result?.resultDesc || "M-Pesa payment was not completed");
    }
    throw new Error("M-Pesa confirmation is still pending. Please retry after the customer completes the prompt.");
  };

  const handleDeliveryAction = async (selectedAction) => {
    if (selectedOrdersForActions.length === 0) return notify.error("Select at least one order to continue.");
    const action = selectedAction;
    if (!action) return;
    if (action === "schedule" && selectionHasThirdAttempt) {
      return notify.error("Third-attempt orders cannot be rescheduled.");
    }
    const actionDCCode = await chooseActionDC("post this delivery action");
    if (!actionDCCode) return;
    const orders = selectedOrdersForActions;
    const updateSelectedTaskOrders = (selectedOrders, buildUpdate) => updateTaskOrders(selectedOrders, buildUpdate, actionDCCode);
    const courierChoices = Object.fromEntries((Array.isArray(couriers) ? couriers : []).filter((courier) => courier.IsActive !== false && !courier.IsDeleted).map((courier) => [courier.CourierCode, courier.CourierName || courier.CourierCode]));
    try {
      if (action === "rider" || action === "reassign") {
        const rider = await chooseSearchableRider();
        if (!rider) return;
        const { isConfirmed } = await MySwal.fire({
          title: `${action === "reassign" ? "Re-assign" : "Assign"} delivery?`,
          text: `${orders.length} order${orders.length === 1 ? "" : "s"} will be assigned to ${rider.label}.`,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: action === "reassign" ? "Confirm Re-assignment" : "Confirm Assignment",
        });
        if (!isConfirmed) return;
        if (rider.isExternal) {
          await updateSelectedTaskOrders(orders, () => ({
            statusID: PACKAGE_STATUSES.ASSIGNED_TO_DELIVERY.orderStatusID,
            notes: `${action === "reassign" ? "Re-assigned" : "Assigned"} to non-COSSIM rider: ${rider.label}`,
          }));
        } else {
          const response = await handlePostRiderManifestTx({
            dcCode: actionDCCode,
            riderUserCode: rider.code,
            notes: `${action === "reassign" ? "Re-assigned" : "Assigned"} from Task Management`,
            orderArray: orders.map((order) => ({ orderNO: order.OrderNO })),
          });
          if (response?.Error || response?.Data?.result === 0 || response?.result === 0) throw new Error(response?.Message || "Rider manifest could not be created");
          await loadShipmentOrders({ pageNo: pagination.currentPage });
          setSelectedRowKeys([]);
        }
        notify.success(`${orders.length} order${orders.length === 1 ? "" : "s"} assigned to ${rider.label}`);
      } else if (action === "unassign") {
        const { isConfirmed } = await MySwal.fire({
          title: `Unassign ${orders.length} order${orders.length === 1 ? "" : "s"}?`,
          text: "The order will remain pending delivery and available for reassignment or back-office completion.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Unassign",
        });
        if (isConfirmed) await updateSelectedTaskOrders(orders, () => ({
          statusID: PACKAGE_STATUSES.ASSIGNED_TO_DELIVERY.orderStatusID,
          notes: "Rider unassigned; pending delivery",
          extra: { riderCode: "", riderLabel: "" },
        }));
      } else if (action === "pus" || action === "complete") {
        const getCODAmount = (order) => Number(
          order.CODAmount
          ?? order.CashOnDeliveryAmount
          ?? order.cashOnDeliveryAmount
          ?? order.codAmount
          ?? 0
        );
        const codOrders = orders.filter((order) => getCODAmount(order) > 0);
        const requiresPayment = codOrders.length > 0;
        const paymentOptions = {
          prompt: "Prompt",
          cod: "Cash on Delivery",
          none: "No payment required",
        };
        const deliveryDetails = await collectDeliveryDetails(action, async ({ payment, reference, notes, promptConfirmation }) => {
          const confirmedPayments = promptConfirmation || {};
          await Promise.all(codOrders.map((order) => {
            const confirmedPayment = confirmedPayments[order.OrderNO] || {};
            const transactionID = confirmedPayment.TransID || confirmedPayment.transID || reference;
            const amountPaid = Number(confirmedPayment.Amount ?? confirmedPayment.amount ?? getCODAmount(order));
            if (!transactionID || amountPaid <= 0) throw new Error(`Payment details are missing for ${order.OrderNO}`);
            return saveShipmentOrderPayment({
              ShipmentOrderPaymentID: 0,
              OrderNO: order.OrderNO,
              TransactionID: transactionID.trim(),
              AmountPaid: amountPaid,
              IsCODPayment: true,
              PaymentMethodTypeCode: payment === "prompt" ? 1 : 2,
            });
          }));
          await updateSelectedTaskOrders(orders, (order) => {
            const confirmedPayment = confirmedPayments[order.OrderNO];
            const confirmedReference = confirmedPayment?.TransID || confirmedPayment?.transID || reference;
            return {
              statusID: action === "pus" ? PACKAGE_STATUSES.PICKED_UP_BY_CUSTOMER.orderStatusID : PACKAGE_STATUSES.DELIVERED_TO_CUSTOMER.orderStatusID,
              notes: `${action === "pus" ? "Delivered at PUS" : "Delivery completed by back office"}; Payment: ${paymentOptions[payment]}${confirmedReference ? `; Ref: ${confirmedReference}` : ""}${notes ? `; Notes: ${notes}` : ""}`,
              extra: { riderCode: order.RiderUserCode || order.RiderCode || "" },
            };
          });
        }, async (promptPhone) => {
          const promptResponses = await Promise.all(codOrders.map((order) => requestSTKPush({ phoneNumber: promptPhone, orderNO: order.OrderNO, isCashOnDelivery: true })));
          const failedPrompt = promptResponses.find((result) => result?.Error);
          if (failedPrompt) throw new Error(failedPrompt.Message || "M-Pesa prompt could not be sent");
          const confirmations = await Promise.all(promptResponses.map((response) => waitForStkConfirmation(response?.Response?.CheckoutRequestID ?? response?.response?.checkoutRequestID ?? response?.CheckoutRequestID)));
          return Object.fromEntries(codOrders.map((order, index) => [order.OrderNO, confirmations[index]]));
        }, requiresPayment);
        if (!deliveryDetails) return;
        notify.success(`${orders.length} delivery${orders.length === 1 ? "" : "ies"} confirmed`);
      } else if (action === "schedule") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const scheduleLimits = orders.map((order) => {
          const dateAdded = new Date(order.DateAdded);
          if (Number.isNaN(dateAdded.getTime())) return null;
          const configuredSlaHours = Number(order.SLAHours ?? order.slaHours);
          const slaDays = Number.isFinite(configuredSlaHours) && configuredSlaHours > 0
            ? Math.ceil(configuredSlaHours / 24)
            : 7;
          const lastAllowed = new Date(dateAdded);
          lastAllowed.setHours(0, 0, 0, 0);
          lastAllowed.setDate(lastAllowed.getDate() + slaDays);
          return { lastAllowed, slaDays };
        }).filter(Boolean);
        if (scheduleLimits.length !== orders.length) return notify.error("The Date Added value is missing for one or more selected orders.");
        const limitingSchedule = scheduleLimits.reduce((earliest, current) => current.lastAllowed < earliest.lastAllowed ? current : earliest);
        const maxScheduleDate = limitingSchedule.lastAllowed;
        if (maxScheduleDate < today) return notify.error("These orders are already beyond the scheduling window calculated from Date Added and SLA.");
        const minDate = formatLocalDateOnly(today);
        const maxDate = formatLocalDateOnly(maxScheduleDate);
        const { value } = await MySwal.fire({
          title: `Schedule ${orders.length} order${orders.length === 1 ? "" : "s"}`,
          html: `<div class="text-start"><label for="delivery-date" class="form-label fw-semibold">Delivery date</label><input id="delivery-date" type="date" min="${minDate}" max="${maxDate}" class="form-control"><small class="text-muted">Must be no later than Date Added plus the available SLA (${limitingSchedule.slaDays} day${limitingSchedule.slaDays === 1 ? "" : "s"}: ${maxDate}).</small><label for="delivery-notes" class="form-label fw-semibold mt-3">Notes *</label><textarea id="delivery-notes" class="form-control" rows="3" placeholder="Enter scheduling notes"></textarea></div>`,
          showCancelButton: true,
          confirmButtonText: "Schedule",
          preConfirm: () => {
            const date = document.getElementById("delivery-date")?.value;
            const notes = document.getElementById("delivery-notes")?.value?.trim();
            if (!date) return Swal.showValidationMessage("Choose a delivery date");
            if (!notes) return Swal.showValidationMessage("Scheduling notes are required");
            if (date < minDate || date > maxDate) return Swal.showValidationMessage(`Choose a date between ${minDate} and ${maxDate}`);
            return { date, notes };
          },
        });
        if (value) await updateSelectedTaskOrders(orders, (order) => {
          const count = Number(order.ScheduleCount ?? order.DeliveryScheduleCount ?? order.RescheduleCount ?? 0) + 1;
          const currentStatusID = Number(order.OrderStatusID ?? order.StatusID);
          const nextStatusID = currentStatusID === 304
            ? 305 // Rescheduling the first attempt moves the order to the second attempt.
            : currentStatusID === 305
              ? 306 // Do not reset an existing second attempt back to the first attempt.
              : PACKAGE_STATUSES.DELIVERY_ATTEMPTED.orderStatusID;
          const attemptLabel = nextStatusID === 305 ? "2nd" : nextStatusID === 306 ? "3rd" : "1st";
          return { statusID: nextStatusID, notes: `${attemptLabel} attempt scheduled for ${value.date}; Schedule ${count}: ${value.notes}` };
        });
      } else if (action === "lost") {
        const lostReasonOptions = LOST_REASON_CODES.map(([code, label]) => `<option value="${code}">${code} - ${label}</option>`).join("");
        const { value } = await MySwal.fire({
          title: `Mark ${orders.length} order${orders.length === 1 ? "" : "s"} as lost?`,
          html: `<div class="text-start"><label for="lost-reason-code" class="form-label fw-semibold">Lost reason *</label><select id="lost-reason-code" class="form-select"><option value="">Select a lost reason</option>${lostReasonOptions}</select><label for="lost-notes" class="form-label fw-semibold mt-3">Notes *</label><textarea id="lost-notes" class="form-control" rows="4" placeholder="Describe where and how the package was lost"></textarea></div>`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Mark Lost",
          confirmButtonColor: "#dc3545",
          preConfirm: () => {
            const reasonCode = document.getElementById("lost-reason-code")?.value;
            const notes = document.getElementById("lost-notes")?.value?.trim();
            if (!reasonCode) return Swal.showValidationMessage("Select a lost reason");
            if (!notes) return Swal.showValidationMessage("Notes are required");
            return { reasonCode, notes };
          },
        });
        if (value) {
          const reasonLabel = LOST_REASON_CODES.find(([code]) => code === value.reasonCode)?.[1] || value.reasonCode;
          await updateSelectedTaskOrders(orders, () => ({ statusID: PACKAGE_STATUSES.CLOSED_FAILED.orderStatusID, notes: `Marked lost; Reason: ${value.reasonCode} - ${reasonLabel}; Notes: ${value.notes}` }));
        }
      } else if (action === "reverse") {
        const reasonOptions = REVERSAL_REASON_CODES.map(([code, label]) => `<option value="${code}">${label}</option>`).join("");
        const { value } = await MySwal.fire({
          title: `Reverse ${orders.length} order${orders.length === 1 ? "" : "s"}`,
          html: `<div class="text-start"><label for="reversal-reason-code" class="form-label fw-semibold">Reversal reason *</label><select id="reversal-reason-code" class="form-select"><option value="">Select a reason</option>${reasonOptions}</select><label for="reversal-notes" class="form-label fw-semibold mt-3">Notes *</label><textarea id="reversal-notes" class="form-control" rows="3" placeholder="Provide reversal details"></textarea></div>`,
          showCancelButton: true,
          confirmButtonText: "Reverse",
          preConfirm: () => {
            const reasonCode = document.getElementById("reversal-reason-code")?.value;
            const notes = document.getElementById("reversal-notes")?.value?.trim();
            if (!reasonCode) return Swal.showValidationMessage("Select a reversal reason");
            if (!notes) return Swal.showValidationMessage("Reversal notes are required");
            return { reasonCode, notes };
          },
        });
        if (value) await updateSelectedTaskOrders(orders, () => ({ statusID: PACKAGE_STATUSES.RETURN_REQUESTED_BY_CUSTOMER.orderStatusID, notes: `Reason code: ${value.reasonCode}; Notes: ${value.notes}` }));
      } else if (action === "reroute") {
        const reroute = await chooseSearchableDC(orders, courierChoices);
        if (!reroute) return;
        await updateSelectedTaskOrders(orders, () => ({ statusID: PACKAGE_STATUSES.HOLD_FOR_DC_DC_DISPATCH.orderStatusID, notes: `Rerouted to ${reroute.dcLabel} via ${reroute.courierLabel}`, extra: { dcCode: reroute.dcCode, riderCode: reroute.courierCode } }));
      }
    } catch (error) { notify.error(error.message || "The task could not be completed"); }
  };

  const openDeliveryActionChooser = async () => {
    const options = allSelectedOrdersAssigned
      ? [
        { value: "reassign", label: "Re-assign", icon: "feather-refresh-cw" },
        { value: "unassign", label: "Unassign", icon: "feather-user-x" },
        { value: "complete", label: "Complete", icon: "feather-check-circle" },
        { value: "lost", label: "Mark Lost", icon: "feather-alert-triangle" },
      ]
      : [
        { value: "pus", label: "Delivery", icon: "feather-map-pin" },
        { value: "rider", label: "Assign Rider", icon: "feather-truck" },
        ...(!selectionHasThirdAttempt ? [{ value: "schedule", label: "Schedule", icon: "feather-calendar" }] : []),
        { value: "reverse", label: "Reverse", icon: "feather-rotate-ccw" },
        { value: "reroute", label: "Reroute", icon: "feather-navigation" },
        { value: "lost", label: "Mark Lost", icon: "feather-alert-triangle" },
      ];
    const selectedAction = await chooseTaskOption({
      title: `Choose action for ${selectedOrdersForActions.length} selected order${selectedOrdersForActions.length === 1 ? "" : "s"}`,
      options,
    });
    if (selectedAction) await handleDeliveryAction(selectedAction);
  };

  const handleBatchPanelScan = (event) => {
    event.preventDefault();
    const code = batchScan.trim().replace(/^.*?(PCK-[A-Z0-9-]+).*$/i, "$1").toUpperCase();
    const match = batchPanelOrders.find((order) => String(order.OrderNO).toUpperCase() === code);
    if (match) {
      setBatchScannedKeys((current) => current.includes(match.OrderNO) ? current : [...current, match.OrderNO]);
      setBatchScan("");
      return;
    }
    if (batchPanelMode === "reversed") return notify.error("Package number is not in the selected orders");
    fetchShipmentOrder({ orderNO: code }).then((response) => {
      const responseData = response?.Data ?? response?.data ?? response;
      const order = Array.isArray(responseData) ? responseData[0] : responseData;
      if (!order?.OrderNO) return notify.error("Package not found");
      if (batchPanelMode === "confirmed" && getTaskType(order) !== "confirmed") return notify.error("This package is not awaiting confirmation receipt");
      const packageDC = order.LatestLogDCCode || order.CurrentDCCode || order.OriginDCCode;
      const outsideSelectedScope = allExceptSelected
        ? excludedGlobalDCCodes.has(packageDC)
        : !allDCsSelected && selectedGlobalDCCodes.length && !selectedGlobalDCCodes.includes(packageDC);
      if (packageDC && outsideSelectedScope) return notify.error(`This package is at ${packageDC}, which is not among the selected DCs.`);
      setBatchPanelOrders((current) => current.some((item) => item.OrderNO === order.OrderNO) ? current : [...current, order]);
      setBatchScannedKeys((current) => current.includes(order.OrderNO) ? current : [...current, order.OrderNO]);
      setBatchScan("");
    }).catch(() => {});
  };

  const handleConfirmedPickSubmit = async () => {
    const scannedOrders = batchPanelOrders.filter((order) => batchScannedKeys.includes(order.OrderNO));
    if (!scannedOrders.length) return notify.error("Scan at least one confirmed package.");
    let refreshedOrders;
    try {
      refreshedOrders = await Promise.all(scannedOrders.map(async (scannedOrder) => {
        const response = await fetchShipmentOrder({ orderNO: scannedOrder.OrderNO });
        const responseData = response?.Data ?? response?.data ?? response;
        return Array.isArray(responseData) ? responseData[0] : responseData;
      }));
    } catch (refreshError) {
      return notify.error(refreshError?.message || "Could not verify the latest package statuses.");
    }
    const staleOrderNumbers = refreshedOrders
      .map((order, index) => (!order?.OrderNO || getTaskType(order) !== "confirmed")
        ? order?.OrderNO || scannedOrders[index]?.OrderNO
        : null)
      .filter(Boolean);
    if (staleOrderNumbers.length) {
      setBatchPanelOrders((current) => current.filter((order) => !staleOrderNumbers.includes(order.OrderNO)));
      setBatchScannedKeys((current) => current.filter((orderNO) => !staleOrderNumbers.includes(orderNO)));
      return notify.error(`${staleOrderNumbers.length} package${staleOrderNumbers.length === 1 ? " is" : "s are"} no longer awaiting vendor pickup and ${staleOrderNumbers.length === 1 ? "was" : "were"} removed.`);
    }
    const { isConfirmed } = await MySwal.fire({
      title: "Complete pick and scan?",
      text: `${scannedOrders.length} package${scannedOrders.length === 1 ? "" : "s"} will move to Picked by Rider.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Complete Pick",
    });
    if (!isConfirmed) return;
    setBatchSubmitting(true);
    try {
      await updateTaskOrders(refreshedOrders, () => ({ statusID: 102, notes: "Picked from Vendor via Pick and Scan" }));
      notify.success(`${refreshedOrders.length} package${refreshedOrders.length === 1 ? "" : "s"} marked as Picked by Rider`);
      if (typeof window !== "undefined") window.localStorage.removeItem(pickScanStorageKey);
      setBatchPanelMode("");
      setBatchPanelOrders([]);
      setBatchScannedKeys([]);
    } catch (error) {
      notify.error(error.message || "Failed to receive the scanned packages");
    } finally {
      setBatchSubmitting(false);
    }
  };

  const handleBatchPanelSubmit = async () => {
    if (!batchDestination || !batchCourier) return notify.error("Select the destination and courier.");
    if (!batchCourierCost || Number(batchCourierCost) <= 0) return notify.error("Enter the courier cost.");
    if (!batchReceipt) return notify.error("Attach the courier receipt.");
    if (batchScannedKeys.length !== batchPanelOrders.length) return notify.error("Scan every selected package before completing the batch.");
    const actionDCCode = await chooseActionDC("dispatch this batch");
    if (!actionDCCode) return;
    if (batchPanelMode !== "reversed" && actionDCCode === batchDestination.value) return notify.error("The posting DC and destination DC must be different.");
    const { isConfirmed } = await MySwal.fire({
      title: batchPanelMode === "reversed" || batchPanelMode === "forwardReverse" ? "Complete return dispatch?" : "Complete dispatch?",
      text: `${batchScannedKeys.length} package${batchScannedKeys.length === 1 ? "" : "s"} will be handed to ${batchCourier.label}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: batchPanelMode === "reversed" || batchPanelMode === "forwardReverse" ? "Confirm Return & Dispatch" : "Confirm Dispatch",
    });
    if (!isConfirmed) return;
    setBatchSubmitting(true);
    try {
      const receiptUpload = await uploadHandoverReceipt(batchReceipt);
      if (receiptUpload?.Error || !receiptUpload?.ImageID) throw new Error(receiptUpload?.Message || "Receipt image upload failed");
      if (existingBatchCode) {
        const response = await completeHandoverBatch({
          handoverCode: existingBatchCode,
          courierCode: batchCourier.value,
          courierCost: Number(batchCourierCost),
          receiptImageID: receiptUpload.ImageID,
          notes: `Destination: ${batchDestination?.label || batchDestination?.value || "-"}`,
        });
        if (response?.Error) throw new Error(response.Message || "Failed to complete batch");
        notify.success(response?.Message || "Batch completed successfully");
        setExistingBatchCode("");
        setExistingBatchEditOnly(false);
        await loadOutboundBatches();
      } else {
      const response = await postShipmentHandoverBatch({
          fromDCCode: actionDCCode,
          toDCCode: batchPanelMode === "reversed" ? actionDCCode : batchDestination.value,
          courierCode: batchCourier.value,
          riderUserCode: "",
          courierCost: Number(batchCourierCost),
          receiptImageID: receiptUpload.ImageID,
          notes: `${batchPanelMode === "reversed" ? `Reversed orders consolidated for vendor ${batchDestination.label}` : batchPanelMode === "forwardReverse" ? `Past-SLA or declined orders consolidated for return to HQ ${batchDestination.label}` : "Task Management dispatch"}`,
          shipmentOrderArray: batchScannedKeys.map((orderNO) => ({ orderNO })),
        });
        if (response?.Error) throw new Error(response.Message || "Failed to create batch");
        notify.success(response?.Message || "Batch created successfully");
      }
      await loadShipmentOrders({ pageNo: pagination.currentPage });
      setBatchPanelMode("");
      setBatchPanelOrders([]);
      setBatchScannedKeys([]);
      setBatchPanelStage("consolidate");
      setBatchCourierCost("");
      setBatchReceipt(null);
      setSelectedRowKeys([]);
    } catch (error) {
      notify.error(error.message || "Failed to complete batch");
    } finally {
      setBatchSubmitting(false);
    }
  };

  const handleCompleteConsolidation = async () => {
    if (!batchDestination) return notify.error("Select the destination.");
    if (!batchPanelOrders.length || batchScannedKeys.length !== batchPanelOrders.length) {
      return notify.error("Scan every selected package before completing the consolidation.");
    }
    const actionDCCode = await chooseActionDC("create this consolidation");
    if (!actionDCCode) return;
    if (batchPanelMode !== "reversed" && actionDCCode === batchDestination.value) return notify.error("The posting DC and destination DC must be different.");

    const { isConfirmed } = await MySwal.fire({
      title: "Complete consolidation?",
      text: `${batchScannedKeys.length} package${batchScannedKeys.length === 1 ? "" : "s"} will be saved as a consolidated batch for ${batchDestination.label}. Courier handover will be completed later.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Complete Consolidation",
    });
    if (!isConfirmed) return;

    setBatchSubmitting(true);
    try {
      const response = await postShipmentHandoverBatch({
        fromDCCode: actionDCCode,
        toDCCode: batchPanelMode === "reversed" ? actionDCCode : batchDestination.value,
        courierCode: "",
        riderUserCode: "",
        notes: batchPanelMode === "reversed"
          ? `Reversed orders consolidated for vendor ${batchDestination.label}; awaiting courier handover`
          : batchPanelMode === "forwardReverse"
            ? `Past-SLA or declined orders consolidated for return to HQ ${batchDestination.label}; awaiting courier handover`
            : "Task Management consolidation awaiting courier handover",
        shipmentOrderArray: batchScannedKeys.map((orderNO) => ({ orderNO })),
      });
      if (response?.Error) throw new Error(response.Message || "Failed to create consolidated batch");

      notify.success(response?.Message || "Consolidation completed successfully");
      await Promise.all([
        loadShipmentOrders({ pageNo: pagination.currentPage }),
        loadOutboundBatches(),
      ]);
      setBatchPanelMode("");
      setBatchPanelOrders([]);
      setBatchScannedKeys([]);
      setBatchDestination(null);
      setBatchPanelStage("consolidate");
      setSelectedRowKeys([]);
    } catch (error) {
      notify.error(error.message || "Failed to complete consolidation");
    } finally {
      setBatchSubmitting(false);
    }
  };

  const openReceivePanel = async (batch) => {
    setReceiveBatch(batch);
    setReceiveItems([]);
    setReceivedOrderKeys([]);
    setReceiveScan("");
    setReceiveItemsLoading(true);
    try {
      const response = await fetchHandoverItems({
        handoverCode: batch.HandoverCode,
        ToDCCode: batch.ToDCCode || undefined,
      });
      setReceiveItems(extractResponseList(response));
    } catch (error) {
      notify.error(error.message || "Failed to load batch packages");
    } finally {
      setReceiveItemsLoading(false);
    }
  };

  const openReceivePanels = async (batches) => {
    const selectedBatches = batches.filter(Boolean);
    if (selectedBatches.length === 1) {
      await openReceivePanel(selectedBatches[0]);
      return;
    }

    setReceiveBatch({ IsMultiBatch: true, Batches: selectedBatches });
    setReceiveItems([]);
    setReceivedOrderKeys([]);
    setReceiveScan("");
    setReceiveItemsLoading(true);
    try {
      const results = await Promise.all(selectedBatches.map(async (batch) => {
        const response = await fetchHandoverItems({
          handoverCode: batch.HandoverCode,
          ToDCCode: batch.ToDCCode || undefined,
        });
        return extractResponseList(response).map((item) => ({
          ...item,
          HandoverCode: item.HandoverCode || batch.HandoverCode,
        }));
      }));
      setReceiveItems(results.flat());
    } catch (error) {
      notify.error(error.message || "Failed to load selected batch packages");
    } finally {
      setReceiveItemsLoading(false);
    }
  };

  const handleReceiveScan = async (event) => {
    event.preventDefault();
    const code = receiveScan.trim().replace(/^.*?(PCK-[A-Z0-9-]+).*$/i, "$1");
    if (!receiveBatch?.HandoverCode) {
      const batch = inboundBatches.find((item) => String(item.HandoverCode).toUpperCase() === receiveScan.trim().toUpperCase());
      if (batch) {
        await openReceivePanel(batch);
        return;
      }
      try {
        const response = await fetchShipmentOrder({ orderNO: code });
        const responseData = response?.Data ?? response?.data ?? response;
        const order = Array.isArray(responseData) ? responseData[0] : responseData;
        if (!order?.OrderNO) return notify.error("Package not found");
        const handoverCode = order.HandoverCode || order.LatestHandoverCode;
        const matchingBatch = handoverCode ? inboundBatches.find((item) => item.HandoverCode === handoverCode) : null;
        if (matchingBatch) {
          await openReceivePanel(matchingBatch);
          setReceivedOrderKeys([order.OrderNO]);
        } else {
          setReceiveBatch((current) => ({ ...(current || {}), IsBlindReceipt: true, ToDCCode: order.DestinationDCCode || order.LatestLogDCCode }));
          setReceiveItems((current) => current.some((item) => item.OrderNO === order.OrderNO) ? current : [...current, order]);
          setReceivedOrderKeys((current) => current.includes(order.OrderNO) ? current : [...current, order.OrderNO]);
          setReceiveScan("");
          notify.success(`${order.OrderNO} added for receipt`);
        }
      } catch (error) {
        notify.error(error.message || "Package could not be loaded");
      }
      return;
    }
    const match = receiveItems.find((item) => String(item.OrderNO).toUpperCase() === code.toUpperCase());
    if (!match) return notify.error("Package number is not in this batch");
    setReceivedOrderKeys((current) => current.includes(match.OrderNO) ? current : [...current, match.OrderNO]);
    setReceiveScan("");
  };

  const handleAcceptBatch = async (payload) => {
    if (!payload.HandoverCode && !receiveBatch?.IsMultiBatch) {
      await handleUpdateShipmentStatusBatch(payload.Orders.map((order) => ({ statusID: payload.StatusID, orderNO: order.OrderNO, notes: payload.Notes || "Blind receipt acknowledged", dcCode: payload.DCCode || "", riderCode: "" })));
      notify.success(`${payload.Orders.length} package${payload.Orders.length === 1 ? "" : "s"} acknowledged`);
      setReceiveBatch(null);
      setReceiveItems([]);
      setReceivedOrderKeys([]);
      setSelectedRowKeys([]);
      return;
    }
    if (receiveBatch?.IsMultiBatch) {
      const selectedByBatch = payload.Orders.reduce((groups, order) => {
        const handoverCode = order.HandoverCode;
        if (!handoverCode) return groups;
        groups[handoverCode] = [...(groups[handoverCode] || []), { OrderNO: order.OrderNO }];
        return groups;
      }, {});
      const batchesToReceive = receiveBatch.Batches.filter((batch) => selectedByBatch[batch.HandoverCode]?.length);
      await Promise.all(batchesToReceive.map(async (batch) => {
        const response = await handleReceiveInboundShipmentBatch({
          ...payload,
          HandoverCode: batch.HandoverCode,
          DCCode: batch.ToDCCode || payload.DCCode,
          CourierCode: batch.CourierCode || batch.RiderUserCode || payload.CourierCode,
          Orders: selectedByBatch[batch.HandoverCode],
        });
        if (response?.Error) throw new Error(response.Message || `Batch ${batch.HandoverCode} could not be accepted`);
      }));
      notify.success(`${batchesToReceive.length} batches accepted`);
      setReceiveBatch(null);
      setReceiveItems([]);
      setReceivedOrderKeys([]);
      setSelectedRowKeys([]);
      const refreshed = await getHandoverBatchList({ pageNo: 1, pageSize: 100, DestinationDCCode: toDCCode || currentDCCode, IsInBound: 1, orderBy: "DateAdded", sortDir: "DESC" });
      const pending = extractResponseList(refreshed).filter((batch) => Number(batch.StatusID) !== 2);
      setInboundBatches(pending);
      setInboundBatchTotal(pending.length);
      return;
    }
    const response = await handleReceiveInboundShipmentBatch(payload);
    if (response?.Error) throw new Error(response.Message || "Batch could not be accepted");
    notify.success(response?.Message || "Batch accepted");
    setReceiveBatch(null);
    setReceiveItems([]);
    setReceivedOrderKeys([]);
    setSelectedRowKeys([]);
    const refreshed = await getHandoverBatchList({ pageNo: 1, pageSize: 100, DestinationDCCode: toDCCode || currentDCCode, IsInBound: 1, orderBy: "DateAdded", sortDir: "DESC" });
    const pending = extractResponseList(refreshed).filter((batch) => Number(batch.StatusID) !== 2);
    setInboundBatches(pending);
    setInboundBatchTotal(pending.length);
  };

  const MySwal = withReactContent(Swal);

  const getDisplayText = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    return String(value);
  };

  const getTooltipId = (prefix, value) =>
    `${prefix}-${getDisplayText(value).replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 32)}`;

  const TruncatedText = ({ value, className = "" }) => {
    const displayValue = getDisplayText(value);

    return (
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip id={getTooltipId("packages-tooltip", displayValue)}>{displayValue}</Tooltip>}
      >
        <span className={`packages-table-ellipsis ${className}`.trim()}>
          {displayValue}
        </span>
      </OverlayTrigger>
    );
  };

  // Stops are derived from the shipment's fixed Origin/Destination plus its live tracking
  // location (LatestLogDCName), so an intermediate hub shows up when the package hasn't
  // reached its destination yet.
  const getRouteStops = (record) => {
    const origin = getDisplayText(record.OriginDCName);
    const destination = getDisplayText(record.DestinationDCName);
    const currentLocation = getDisplayText(record.LatestLogDCName);

    const stops = [origin];
    if (
      currentLocation !== "-" &&
      currentLocation !== origin &&
      currentLocation !== destination
    ) {
      stops.push(currentLocation);
    }
    if (destination !== "-") {
      stops.push(destination);
    }

    return stops.filter((stop) => stop && stop !== "-");
  };

  const renderRoute = (record) => {
    const stops = getRouteStops(record);
    const firstStop = stops[0] || "-";
    const lastStop = stops[stops.length - 1] || "-";
    const intermediateCount = Math.max(stops.length - 2, 0);
    const receiverBuilding = record.ReceiverBuilding ? ` (${record.ReceiverBuilding})` : "";
    const routeSummary =
      firstStop === lastStop
        ? firstStop
        : `${firstStop} -> ${lastStop}${receiverBuilding}`;
    const routeDetails = stops.length > 0 ? stops.join(" -> ") : routeSummary;
    const inTransit = intermediateCount > 0 && record.LatestLogDCName;

    return (
      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip id={getTooltipId("route-tooltip", record.OrderNO || firstStop)}>
            {routeDetails}{receiverBuilding}
            {record.RouteInfo && <div>{record.RouteInfo}</div>}
            {record.InitialLogDCName && (
              <div>First logged at: {record.InitialLogDCName}</div>
            )}
          </Tooltip>
        }
      >
        <div className="packages-route-cell">
          <Send size={14} className="packages-route-icon" />
          <span className="packages-route-text">
            <span>{firstStop}</span>
            {firstStop !== lastStop && (
              <>
                <span className="packages-route-arrow" aria-hidden="true">&rarr;</span>
                <span>{lastStop}{receiverBuilding}</span>
              </>
            )}
            {inTransit && (
              <small className="text-muted d-block">
                Currently at: {record.LatestLogDCName}
              </small>
            )}
          </span>
          {intermediateCount > 0 && (
            <span className="packages-route-count">+{intermediateCount}</span>
          )}
        </div>
      </OverlayTrigger>
    );
  };

  // Handle delete package
  const handleDeletePackage = async (record) => {
    const { value: notes } = await MySwal.fire({
      title: 'Delete Package',
      text: `Are you sure you want to delete package ${record.OrderNO}?`,
      input: 'textarea',
      inputLabel: 'Notes (optional)',
      inputPlaceholder: 'Enter reason for deletion...',
      inputAttributes: {
        'aria-label': 'Type your notes here'
      },
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc3545',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'Please enter a reason for deletion';
        }
      }
    });

    if (notes) {
      try {
        await handleUpdateShipmentStatus({
          statusID: 902, // CLOSED_CANCELLED
          orderNO: record.OrderNO,
          notes: notes,
          dcCode: "",
          riderCode: ""
        });

        // Refresh the list after successful deletion
        loadShipmentOrders({
          pageNo: pagination.currentPage,
          pageSize: pagination.pageSize,
        });

        notify.success('Package has been deleted successfully.');
      } catch (error) {
        console.error('Failed to delete package:', error);
        notify.error('Failed to delete package. Please try again.');
      }
    }
  };

  const formatAmount = (value) => {
    const amount = Number(value || 0);

    return new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);
  };

  const formatPackageDate = (value) => {
    if (!value) return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  // Aging = days the order has stayed in the DC since it was added to the system.
  const getAgingDays = (dateAddedValue) => {
    const date = formatPackageDate(dateAddedValue);
    if (!date) return null;

    return Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const formatAgingLabel = (days) => {
    if (days === null) return "-";
    if (days === 0) return "Today";
    return days === 1 ? "1 day" : `${days} days`;
  };

  const startDetailPanelResize = (event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = detailPanelWidth;
    const resize = (moveEvent) => {
      setDetailPanelWidth(Math.min(720, Math.max(320, startWidth + startX - moveEvent.clientX)));
    };
    const stop = () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stop);
    };
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stop);
  };

  const columns = [
    {
      title: "Order NO",
      dataIndex: "OrderNO",
      width: 180,
      fixed: "left",
      sorter: (a, b) =>
        getDisplayText(a.OrderNO).localeCompare(getDisplayText(b.OrderNO)),
      render: (text, record) => (
        <div className="packages-person-cell">
          <TruncatedText value={text} className="fw-semibold text-primary" />
          <TruncatedText
            value={record.StatusName || record.StatusCode}
            className="text-muted small"
          />
        </div>
      ),
    },
    {
      title: "Customer",
      dataIndex: "ReceiverContactName",
      width: 190,
      sorter: (a, b) =>
        getDisplayText(a.ReceiverContactName).localeCompare(
          getDisplayText(b.ReceiverContactName)
        ),
      render: (_, record) => (
        <div className="packages-person-cell">
          <TruncatedText
            value={record.ReceiverContactName}
            className="fw-medium"
          />
          <TruncatedText
            value={record.ReceiverContactPhone}
            className="text-muted small"
          />
        </div>
      ),
    },
    {
      title: "COD Amount",
      dataIndex: "CODAmount",
      width: 130,
      align: "right",
      sorter: (a, b) =>
        Number(a.CODAmount || 0) - Number(b.CODAmount || 0),
      render: (value) => (
        <span className="fw-semibold">{formatAmount(value)}</span>
      ),
    },
    {
      title: "Date Added",
      dataIndex: "DateAdded",
      width: 150,
      defaultSortOrder: "descend",
      sorter: (a, b) =>
        (getAgingDays(a.DateAdded) ?? -1) - (getAgingDays(b.DateAdded) ?? -1),
      render: (value) => {
        const date = formatPackageDate(value);
        const aging = getAgingDays(value);

        if (!date) return "-";

        return (
          <div className="packages-date-cell">
            <div>{date.toLocaleDateString("en-GB")}</div>
            <small className={aging >= 7 ? "text-danger fw-semibold" : "text-muted"}>
              {formatAgingLabel(aging)}
            </small>
          </div>
        );
      },
    },
    {
      title: "Action",
      dataIndex: "action",
      width: 110,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <RowActionsDropdown
          id={`dropdown-${record.ShipmentOrderID}`}
          variant="outline-secondary"
          items={[
            {
              key: "view",
              label: "View",
              icon: "feather-eye",
              onClick: () => setDetailOrder(record),
            },
            {
              key: "edit",
              label: "Edit",
              icon: "feather-edit",
              href: `${route.packages}/${record.OrderNO}/edit`,
            },
            {
              key: "print-sticker",
              label: isGenerating ? "Preparing..." : "Print Sticker",
              icon: "feather-download",
              onClick: () => handleDownloadSticker(record),
              disabled: isGenerating,
            },
            record.StatusID ===
              PACKAGE_STATUSES.SERVICE_FEE_REQUIRED.orderStatusID && {
              key: "pay-service-fee",
              label: "Pay Service Fee",
              icon: "feather-credit-card",
              href: `/admin/service-fee-payment?orderNO=${record.OrderNO}`,
            },
            {
              key: "delete",
              label: "Delete",
              icon: "feather-trash-2",
              onClick: () => handleDeletePackage(record),
            },
          ].filter(Boolean)}
        />
      ),
    },
  ];

  const tableColumns = [
    {
      title: (
        <div className="d-flex flex-column gap-1">
          <span>Order NO</span>
          <span>Current DC</span>
          <span>Status</span>
        </div>
      ),
      dataIndex: "OrderNO",
      width: 210,
      sorter: (a, b) =>
        getDisplayText(a.OrderNO).localeCompare(getDisplayText(b.OrderNO)),
      render: (_, record) => {
        return (
          <div className="d-flex flex-column gap-2 py-1">
            <button
              type="button"
              className="packages-order-link fw-semibold text-primary"
              title={getDisplayText(record.OrderNO)}
              onClick={() => setDetailOrder(record)}
            >
              {getDisplayText(record.OrderNO)}
            </button>
            <div className="packages-person-cell">
              <TruncatedText
                value={`Current DC: ${getDisplayText(record.CurrentDCName || record.CurrentDCCode)}`}
                className="packages-current-location"
              />
            </div>
            <div>
              <span
                className={`${getStatusBadgeClass(record.StatusCode)} packages-status-badge`}
                title={record.StatusName || record.StatusCode}
              >
                {getDisplayText(record.StatusName || record.StatusCode)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: (
        <div className="d-flex flex-column gap-1">
          <span>SLA</span>
          <span>Date Added</span>
        </div>
      ),
      dataIndex: "DateAdded",
      width: 150,
      sorter: (a, b) => {
        const slaDifference = getOrderSlaState(a).priority - getOrderSlaState(b).priority;
        return slaDifference || getOrderAgeDays(b.DateAdded) - getOrderAgeDays(a.DateAdded);
      },
      render: (value, record) => {
        const date = formatPackageDate(value);
        const sla = getOrderSlaState(record);
        const timing = getOrderSlaTiming(record);
        return (
          <div className="packages-sla-date-cell py-1">
            <div className="packages-sla-value" title={sla.label} style={{ color: sla.color }}>
              <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: sla.color, flex: "0 0 9px" }} />
              <strong>{timing.difference}</strong>
            </div>
            <span className="packages-date-time">Expected {timing.expected}</span>
            <span className="packages-date-time allow-wrap">
              {date ? date.toLocaleString("en-GB") : "-"}
            </span>
          </div>
        );
      },
    },
    {
      title: (
        <div className="d-flex flex-column gap-1">
          <span>Sender</span>
          <span>Receiver</span>
        </div>
      ),
      dataIndex: "VendorName",
      width: 220,
      sorter: (a, b) =>
        getDisplayText(a.VendorName || a.SenderCompanyName).localeCompare(
          getDisplayText(b.VendorName || b.SenderCompanyName)
        ),
      render: (_, record) => (
        <div className="d-flex flex-column gap-2 py-1">
          <div className="packages-person-cell">
            <div className="d-flex align-items-baseline gap-1">
              <small className="text-muted flex-shrink-0">From:</small>
              <TruncatedText
                value={record.VendorName || record.SenderCompanyName}
                className="fw-medium"
              />
            </div>
            <TruncatedText
              value={record.VendorPhone || record.SenderContactPhone}
              className="text-muted small"
            />
          </div>
          <div className="packages-person-cell">
            <div className="d-flex align-items-baseline gap-1">
              <small className="text-muted flex-shrink-0">To:</small>
              <TruncatedText value={record.ReceiverContactName} className="fw-medium" />
            </div>
            <TruncatedText value={record.ReceiverContactPhone} className="text-muted small" />
            <TruncatedText value={record.ReceiverStreetName || record.ReceiverAddress} className="text-muted small packages-receiver-street" />
          </div>
        </div>
      ),
    },
    {
      title: "Current DC",
      dataIndex: "LatestLogDCName",
      width: 175,
      sorter: (a, b) =>
        getDisplayText(a.LatestLogDCName || a.RouteInfo || a.InitialLogDCName).localeCompare(
          getDisplayText(b.LatestLogDCName || b.RouteInfo || b.InitialLogDCName)
        ),
      render: (_, record) => (
        <div className="packages-person-cell py-1">
          <TruncatedText
            value={`Current DC: ${getDisplayText(record.CurrentDCName || record.CurrentDCCode)}`}
            className="fw-medium"
          />
        </div>
      ),
    },
    {
      title: "Route",
      dataIndex: "OriginDCName",
      width: 280,
      sorter: (a, b) =>
        getDisplayText(a.OriginDCName).localeCompare(getDisplayText(b.OriginDCName)),
      render: (_, record) => (
        <div className="d-flex align-items-center gap-3 py-1">
          <div className="flex-grow-1 overflow-hidden">
            <TruncatedText value={record.OriginDCName} className="fw-medium" />
            <TruncatedText value={record.OriginDCCode} className="text-muted small" />
          </div>
          <span className="text-primary" aria-hidden="true">→</span>
          <div className="flex-grow-1 overflow-hidden">
            <TruncatedText value={record.DestinationDCName} className="fw-medium" />
            <TruncatedText value={record.DestinationDCCode} className="text-muted small" />
          </div>
        </div>
      ),
    },
    {
      title: (
        <div className="d-flex flex-column gap-1 text-end">
          <span>Service Fee</span>
          <span>COD</span>
        </div>
      ),
      dataIndex: "ServiceFee",
      width: 160,
      align: "right",
      sorter: (a, b) => Number(a.ServiceFee || 0) - Number(b.ServiceFee || 0),
      render: (_, record) => (
        <div className="d-flex flex-column gap-2 py-1 text-end">
          <div>
            <small className="text-muted me-1">Fee:</small>
            <span className="fw-semibold">{formatAmount(record.ServiceFee)}</span>
          </div>
          <div>
            <div>
              <small className="text-muted me-1">COD:</small>
              <span className="fw-semibold">{formatAmount(record.CODAmount)}</span>
            </div>
            <small className="text-muted">
              {record.CashOnDeliveryRequired ? "Required" : "Not required"}
            </small>
          </div>
        </div>
      ),
    },
  ].filter((column) => !["OriginDCName", "LatestLogDCName"].includes(column.dataIndex))
    .map((column) => ({ ...column, ellipsis: false }));

  const inboundBatchColumns = [
    {
      title: "Code",
      dataIndex: "HandoverCode",
      width: 260,
      render: (value, record) => {
        const total = Number(record.TotalItems ?? record.ItemCount ?? record.ItemsCount ?? record.TotalOrders ?? record._LoadedItems ?? 0);
        return <div className="d-flex flex-column align-items-start gap-1"><strong className="text-primary d-block">{getDisplayText(value)}</strong><small className="text-muted d-block">Items: {Number(record._ReceivedItems || 0)}/{total}</small></div>;
      },
    },
    {
      title: "Destination / Origin",
      dataIndex: "FromDCName",
      width: 260,
      render: (_, record) => (
        <div className="packages-person-cell gap-1">
          <TruncatedText
            value={`Destination: ${record.ToDCName || record.DestinationDCName || "Unknown"}`}
            className="fw-medium"
          />
          <TruncatedText
            value={`Origin: ${record.FromDCName || record.OriginDCName || "Unknown"}`}
            className="text-muted small"
          />
        </div>
      ),
    },
    {
      title: <div className="d-flex flex-column"><span>SLA</span><span>Date</span></div>,
      dataIndex: "DateAdded",
      width: 220,
      render: (value, record) => {
        const date = formatPackageDate(value);
        const sla = getOrderSlaState(record);
        const timing = getOrderSlaTiming(record);
        return <div className="packages-sla-date-cell"><div className="packages-sla-value" style={{ color: sla.color }}><span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: sla.color }} /><strong>{timing.difference}</strong></div><span>Expected {timing.expected}</span><span>{date ? date.toLocaleString("en-GB") : "-"}</span></div>;
      },
    },
    {
      title: "Courier",
      dataIndex: "RiderName",
      width: 230,
      render: (_, record) => <div className="packages-person-cell"><TruncatedText value={record.RiderName || record.CourierName || record.RiderUserCode || record.CourierCode} /><TruncatedText value={record.RiderUserCode || record.CourierCode} className="text-muted small" /></div>,
    },
  ];

  const renderRefreshTooltip = (props) => (
    <Tooltip id="refresh-tooltip" {...props}>
      Refresh
    </Tooltip>
  );
  const renderCollapseTooltip = (props) => (
    <Tooltip id="refresh-tooltip" {...props}>
      Collapse
    </Tooltip>
  );

  return (
    <div className="content">
      <div className="page-header packages-mobile-hidden-header">
        <div className="add-item d-flex">
          <div className="page-title">
            <h4>Task Management</h4>
            <h6>Deliver, dispatch, receive, and reverse orders</h6>
          </div>
          {showDashboardBack && (
            <Link to="/admin/dashboard" className="btn btn-outline-primary ms-3 align-self-center">
              <ArrowLeft className="me-2 iconsize" />
              Back to Dashboard
            </Link>
          )}
        </div>
        <ul className="table-top-head">
          {/* Export Icons - PDF and Excel */}
          <TableExportIcons
            data={shipmentOrderList}
            columns={columns}
            pdfColumns={pdfColumns}
            excelColumns={exportColumns}
            filename="packages-export"
            title="Task Management Orders"
            fetchAllData={fetchAllDataForExport}
            pdfOrientation="landscape"
            onExportSuccess={(format, result) => {
              // Reset pagination to first page after export
              loadShipmentOrders({
                pageNo: 1,
                pageSize: pagination.pageSize,
              });
            }}
          />
          <li>
            <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
              <Link
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                onClick={handleRefresh}
                style={{ cursor: 'pointer' }}
              >
                <RotateCcw />
              </Link>
            </OverlayTrigger>
          </li>
          <li>
            <OverlayTrigger placement="top" overlay={renderCollapseTooltip}>
              <Link
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                id="collapse-header"
              >
                <ChevronUp />
              </Link>
            </OverlayTrigger>
          </li>
        </ul>
      </div>

      <div className="card table-list-card">
        <div className="card-body">
          <div className="packages-task-toolbar">
          <div className="packages-task-tabs" role="tablist" aria-label="Shipment tasks">
            {(taskModule === "forward" ? [
              ["deliver", "Orders to Deliver"], ["forwardReverse", "Orders to Reverse"], ["confirmed", "Order Confirmed"], ["receive", "Orders to Receive"], ["dispatch", "Orders to Dispatch"],
            ] : [
              ["reversed", "Orders to Return"], ["reverseReceive", "Reversals to Receive"],
            ]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activeTask === key}
                className={`packages-task-tab ${activeTask === key ? "packages-task-tab-active" : ""}`}
                onClick={() => {
                  clearError();
                  setActiveTask(key);
                  persistActiveTask(key);
                  setDetailOrder(null);
                  setBatchPanelMode("");
                  setBatchPanelStage("consolidate");
                  setReceiveBatch(null);
                  if (key !== "receive") loadShipmentOrders({
                    pageNo: 1,
                    taskType: key,
                    searchTerm: "",
                  });
                }}
              >
                <span>{label}</span><b>{taskCounts[key]}</b>
              </button>
            ))}
          </div>
          {isVendorOnly && (
            <button type="button" onClick={() => setShowImportModal(true)} className="btn btn-outline-primary btn-sm d-flex align-items-center">
              <UploadCloud className="me-2 iconsize" />Import Orders
            </button>
          )}
          {!isVendorOnly && (selectedRowKeys.length > 0 || activeTask === "confirmed" || activeTask === "dispatch" || isReceiveTask || activeTask === "forwardReverse" || activeTask === "reversed") && (
            <div className="packages-selection-actions" aria-label="Actions for selected packages">
              {selectedRowKeys.length > 0 && <span className="packages-selection-count">{selectedRowKeys.length} selected</span>}
              {isReceiveTask ? (
                <button
                  className="btn btn-primary btn-sm d-flex align-items-center"
                  onClick={() => selectedRowKeys.length
                    ? openReceivePanels(inboundBatches.filter((batch) => selectedRowKeys.includes(batch.HandoverCode)))
                    : setReceiveBatch({})}
                >
                  <Layers className="me-2 iconsize" />
                  Receive &amp; Scan
                </button>
              ) : activeTask === "deliver" ? (
                <div className="packages-delivery-actions" role="group" aria-label="Delivery actions">
                  {allSelectedOrdersAssigned ? <>
                    <button type="button" onClick={() => handleDeliveryAction("reassign")}><i className="feather-refresh-cw" />Re-assign</button>
                    <button type="button" className="warning" onClick={() => handleDeliveryAction("unassign")}><i className="feather-user-x" />Unassign</button>
                    <button type="button" onClick={() => handleDeliveryAction("complete")}><i className="feather-check-circle" />Complete</button>
                    <button type="button" className="warning" onClick={() => handleDeliveryAction("lost")}><i className="feather-alert-triangle" />Mark Lost</button>
                  </> : <>
                    <button type="button" disabled={selectedRowKeys.length === 0} onClick={() => handleDeliveryAction("pus")}><i className="feather-map-pin" />Delivery</button>
                    <button type="button" disabled={selectedRowKeys.length === 0} onClick={() => handleDeliveryAction("rider")}><i className="feather-truck" />Assign Rider</button>
                    {!selectionHasThirdAttempt && <button type="button" disabled={selectedRowKeys.length === 0} onClick={() => handleDeliveryAction("schedule")}><i className="feather-calendar" />Schedule</button>}
                    <button type="button" className="warning" disabled={selectedRowKeys.length === 0} onClick={() => handleDeliveryAction("reverse")}><i className="feather-rotate-ccw" />Reverse</button>
                    <button type="button" disabled={selectedRowKeys.length === 0} onClick={() => handleDeliveryAction("reroute")}><i className="feather-navigation" />Reroute</button>
                    <button type="button" className="warning" disabled={selectedRowKeys.length === 0} onClick={() => handleDeliveryAction("lost")}><i className="feather-alert-triangle" />Mark Lost</button>
                  </>}
                </div>
              ) : activeTask === "confirmed" ? (
                <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
                  {selectedRowKeys.length === 0 && <button type="button" onClick={() => setShowImportModal(true)} className="btn btn-outline-primary btn-sm d-flex align-items-center">
                    <UploadCloud className="me-2 iconsize" />Import
                  </button>}
                  {selectedRowKeys.length > 0 && <button type="button" className="btn btn-outline-primary btn-sm d-flex align-items-center" disabled={isGenerating} onClick={handleBulkDownloadStickers}>
                    <Printer className="me-2 iconsize" />{isGenerating ? "Preparing..." : "Print Stickers"}
                  </button>}
                  {selectedRowKeys.length === 0 && <button type="button" onClick={() => setShowCreatePackage(true)} className="btn btn-outline-primary btn-sm d-flex align-items-center">
                    <PlusCircle className="me-2 iconsize" />New Order
                  </button>}
                  <button type="button" className="btn btn-primary btn-sm d-flex align-items-center" onClick={() => openBatchPanel("confirmed")}>
                    <Layers className="me-2 iconsize" />Pick Orders from Vendor
                  </button>
                </div>
              ) : <div className="d-flex align-items-center gap-2 packages-step-actions">
                <button className={`btn ${selectedReturnsAreAtOrigin ? "btn-outline-danger" : "btn-primary"} btn-sm d-flex align-items-center packages-step-primary`} onClick={() => selectedReturnsAreAtOrigin ? handleDirectReturnToVendor() : activeTask === "reversed" ? openBatchPanel("reversed") : activeTask === "forwardReverse" ? openBatchPanel("forwardReverse") : handleConsolidate()}>
                  <Layers className="me-2 iconsize" />
                  {selectedReturnsAreAtOrigin ? "Return to Vendor" : activeTask === "reversed" || activeTask === "forwardReverse" ? "Consolidate Returns" : "Consolidate"}
                </button>
                {activeTask === "dispatch" && <div className="packages-delivery-actions" role="group" aria-label="Delivery actions for orders to dispatch">
                  <button type="button" disabled={!selectedRowKeys.length} onClick={() => handleDeliveryAction("pus")}><i className="feather-map-pin" />Delivery</button>
                  <button type="button" disabled={!selectedRowKeys.length} onClick={() => handleDeliveryAction("rider")}><i className="feather-truck" />Assign Rider</button>
                  {!selectionHasThirdAttempt && <button type="button" disabled={!selectedRowKeys.length} onClick={() => handleDeliveryAction("schedule")}><i className="feather-calendar" />Schedule</button>}
                  <button type="button" className="warning" disabled={!selectedRowKeys.length} onClick={() => handleDeliveryAction("reverse")}><i className="feather-rotate-ccw" />Reverse</button>
                  <button type="button" disabled={!selectedRowKeys.length} onClick={() => handleDeliveryAction("reroute")}><i className="feather-navigation" />Reroute</button>
                  <button type="button" className="warning" disabled={!selectedRowKeys.length} onClick={() => handleDeliveryAction("lost")}><i className="feather-alert-triangle" />Mark Lost</button>
                </div>}
                {activeTask === "reversed" && selectedRowKeys.length > 0 && <button type="button" className="btn btn-outline-danger btn-sm d-flex align-items-center" onClick={() => handleDeliveryAction("lost")}><i className="feather-alert-triangle me-2" />Mark Lost</button>}
              </div>
              }
            </div>
          )}
          </div>

          {/* Loading State */}
          {taskPageLoading && (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading shipment orders...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="alert alert-danger" role="alert">
              <strong>Error:</strong> {error}
              <button
                type="button"
                className="btn-close float-end"
                onClick={clearError}
                aria-label="Close"
              ></button>
            </div>
          )}

          {/* Table */}
          {!taskPageLoading && !error && (
            <div className="packages-table-workspace">
            <div className="packages-table-shell">
              <div className="d-flex align-items-center justify-content-between gap-2 px-3 py-2 border-bottom bg-white packages-mobile-search-row">
                <strong className="small text-muted">{isReceiveTask ? "Batches" : "Orders"}</strong>
                <div className="d-flex align-items-center gap-2 flex-grow-1 justify-content-end packages-mobile-search-controls">
                  <input
                    type="text"
                    placeholder="Search by order number, vendor, DC, or status"
                    className="form-control form-control-sm"
                    style={{ maxWidth: "360px" }}
                    value={searchTerm}
                    onChange={handleSearch}
                    aria-label="Search packages"
                  />
                </div>
              </div>
              <div className="packages-mobile-cards">
                {(isReceiveTask ? inboundBatches : taskOrders).map((record) => {
                  const recordKey = isReceiveTask ? record.HandoverCode : record.OrderNO;
                  const selected = selectedRowKeys.includes(recordKey);
                  const totalItems = Number(record.TotalItems ?? record.ItemCount ?? record.ItemsCount ?? record.TotalOrders ?? record._LoadedItems ?? 0);
                  return <article className={`packages-mobile-card ${selected ? "is-selected" : ""}`} key={recordKey}>
                    <div className="packages-mobile-card-head">
                      <span className="packages-mobile-card-status">{isReceiveTask ? `${Number(record._ReceivedItems || 0)}/${totalItems} received` : getDisplayText(record.StatusName || record.TaskManagementStatus)}</span>
                      <label className="packages-mobile-card-select">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selected}
                          onChange={(event) => setSelectedRowKeys((current) => event.target.checked
                            ? [...new Set([...current, recordKey])]
                            : current.filter((key) => key !== recordKey))}
                          aria-label={`Select ${isReceiveTask ? "batch" : "order"} ${recordKey}`}
                        />
                        <span>{selected ? "Selected" : "Select"}</span>
                      </label>
                    </div>
                    <button type="button" className="packages-mobile-card-body" onClick={() => {
                      if (isReceiveTask) openReceivePanel(record);
                      else { setDetailOrder(record); setMobileDetailOpen(true); }
                    }}>
                      <strong>{getDisplayText(recordKey)}</strong>
                      {isReceiveTask ? <>
                        <span><small>From</small>{getDisplayText(record.FromDCName || record.FromDCCode)}</span>
                        <span><small>Destination</small>{getDisplayText(record.ToDCName || record.ToDCCode)}</span>
                      </> : <>
                        <span><small>Sender</small>{getDisplayText(record.VendorName || record.SenderCompanyName)}</span>
                        <span><small>Receiver</small>{getDisplayText(record.ReceiverContactName)}{record.ReceiverCity ? ` · ${record.ReceiverCity}` : ""}</span>
                        <span><small>Current location</small>{getDisplayText(record.LatestLogDCName || record.RouteInfo || record.InitialLogDCName || record.CurrentDCCode)}</span>
                      </>}
                      <em>View details</em>
                    </button>
                  </article>;
                })}
                {!isReceiveTask && pagination.totalPages > 1 && <nav className="packages-mobile-pagination" aria-label="Orders pagination">
                  <button type="button" disabled={pagination.currentPage <= 1} onClick={() => loadShipmentOrders({ pageNo: pagination.currentPage - 1, pageSize: pagination.pageSize })}>Previous</button>
                  <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
                  <button type="button" disabled={pagination.currentPage >= pagination.totalPages} onClick={() => loadShipmentOrders({ pageNo: pagination.currentPage + 1, pageSize: pagination.pageSize })}>Next</button>
                </nav>}
              </div>
              <div className="table-responsive packages-desktop-table">
              <Datatable
                className="packages-table"
                rowSelection={{
                  selectedRowKeys,
                  onChange: setSelectedRowKeys,
                }}
                onRow={(record) => ({
                  onClick: () => {
                    if (isReceiveTask) openReceivePanel(record);
                  },
                  onMouseEnter: () => {
                    if (!isReceiveTask && selectedRowKeys.length === 0) setDetailOrder(record);
                  },
                  className: !isReceiveTask && detailPanelOrder?.OrderNO === record.OrderNO ? "packages-detail-selected-row" : "",
                  title: isReceiveTask ? "Click a batch line item to scan and receive" : "Hover to view package details",
                  style: { cursor: "pointer" },
                })}
                columns={isReceiveTask
                  ? inboundBatchColumns
                  : (isVendorOnly ? tableColumns.filter((column) => column.dataIndex !== "action") : tableColumns)}
                dataSource={isReceiveTask ? inboundBatches : taskOrders}
                expandable={isReceiveTask ? undefined : {
                  expandedRowRender: (record) => <OrderExpandedDetails order={record} />,
                  rowExpandable: (record) => Boolean(record?.OrderNO),
                  showExpandColumn: false,
                }}
                pagination={isReceiveTask ? false : {
                  current: pagination.currentPage,
                  total: pagination.totalItems,
                  pageSize: pagination.pageSize,
                  showSizeChanger: true,
                  pageSizeOptions: ['100', '500', '1000'],
                  showQuickJumper: true,
                  showTotal: (total) =>
                    `${taskOrders.length} matching on this page · ${total} total orders`,
                  onChange: (page, pageSize) => {
                    loadShipmentOrders({
                      pageNo: page,
                      pageSize,
                    });
                  }
                }}
                rowKey={isReceiveTask ? "HandoverCode" : "OrderNO"}
                loading={taskPageLoading}
                tableLayout="fixed"
                sticky={{ offsetHeader: 0 }}
                scroll={{ x: isReceiveTask ? 970 : 1050, y: 560 }}
                emptyTitle={isReceiveTask ? (activeTask === "reverseReceive" ? "No reversal batches found" : "No inbound batches found") : "No shipment orders found"}
                emptyDescription={isReceiveTask ? (activeTask === "reverseReceive" ? "No reversed orders are currently awaiting receipt." : "No batches are currently awaiting receipt.") : activeTask === "confirmed" ? "No vendor-confirmed orders are waiting to be received." : "Try a different search or clear your filters."}
                emptyAction={activeTask === "confirmed" ? (
                  <button type="button" onClick={() => setShowCreatePackage(true)} className="btn btn-primary">
                    <PlusCircle className="me-2" size={16} />
                    Create New Order
                  </button>
                ) : null}
              />
              </div>
            </div>
            {isReceiveTask && <aside
              className={`packages-detail-panel ${receiveBatch ? "is-open" : "is-collapsed"}`}
              style={{ width: receiveBatch ? detailPanelWidth : 76 }}
              aria-label="Receive batch"
            >
              <div className="packages-detail-resizer" onMouseDown={startDetailPanelResize} title="Drag to resize" />
              {receiveBatch ? <>
                <header className="packages-detail-header">
                  <div><small>{activeTask === "reverseReceive" ? "REVERSALS TO RECEIVE" : "ORDERS TO RECEIVE"}</small><h5>{receiveBatch.IsMultiBatch ? `${receiveBatch.Batches.length} selected batches` : receiveBatch.HandoverCode || (receiveBatch.IsBlindReceipt ? "Blind package receipt" : "Scan to receive")}</h5></div>
                  <button type="button" onClick={() => setReceiveBatch(null)} aria-label="Close receive panel"><X size={19} /></button>
                </header>
                <div className="packages-detail-body">
                  <section>
                    <h6>Scan packages</h6>
                    <p className="text-muted small">{receiveBatch.IsMultiBatch ? "Review and manually confirm packages from the selected handovers." : receiveBatch.HandoverCode ? "Only package numbers are shown while receiving." : "Scan a batch code or scan/enter individual package IDs for blind receipt."}</p>
                    <form className="d-flex align-items-start gap-2 mb-3" onSubmit={handleReceiveScan}>
                      <CameraScanInput onScan={setReceiveScan}>{({ onFocus }) => <input className="form-control" value={receiveScan} onChange={(event) => setReceiveScan(event.target.value)} onFocus={onFocus} placeholder={receiveBatch.HandoverCode ? "Scan or enter package number" : "Scan batch code or package ID"} autoFocus />}</CameraScanInput>
                      <button className="btn btn-primary" type="submit" disabled={!receiveScan.trim()}>Scan</button>
                    </form>
                    {receiveItemsLoading ? <div className="text-center py-4"><span className="spinner-border spinner-border-sm" /></div> : (
                      <div className="list-group mb-3">
                        {receiveItems.map((item) => <label className="list-group-item d-flex align-items-center justify-content-between gap-2" key={`${item.HandoverCode || "blind"}-${item.OrderNO}`}>
                          <span className="d-flex align-items-center gap-2">
                          <input type="checkbox" className="form-check-input m-0" checked={receivedOrderKeys.includes(item.OrderNO)} onChange={(event) => setReceivedOrderKeys((current) => event.target.checked ? [...new Set([...current, item.OrderNO])] : current.filter((key) => key !== item.OrderNO))} />
                          <strong>{item.OrderNO}</strong>
                          </span>
                          {receiveBatch.IsMultiBatch && <small className="text-muted">{item.HandoverCode}</small>}
                        </label>)}
                      </div>
                    )}
                    <div className="d-flex flex-wrap gap-2">
                      <button type="button" className="btn btn-outline-success" disabled={!receiveItems.length} onClick={() => setReceivedOrderKeys(receiveItems.map((item) => item.OrderNO))}>Confirm All Manually</button>
                      <button type="button" className="btn btn-success" disabled={!receivedOrderKeys.length} onClick={() => setShowReceiveBatchModal(true)}>{receiveBatch.HandoverCode || receiveBatch.IsMultiBatch ? "Accept Batch" : "Acknowledge Receipt"} ({receivedOrderKeys.length})</button>
                    </div>
                  </section>
                </div>
              </> : <div className="packages-detail-empty"><span className="packages-detail-empty-icon" aria-hidden="true">›</span><strong>RECEIVE</strong><small>CLICK A BATCH</small></div>}
            </aside>}
            {activeTask === "dispatch" && !batchPanelMode && selectedRowKeys.length === 0 && !detailPanelOrder && <aside className={`packages-detail-panel packages-consolidated-panel is-open ${mobileConsolidatedOpen ? "is-mobile-open" : ""}`} style={{ width: detailPanelWidth }} aria-label="Consolidated orders">
              <div className="packages-detail-resizer" onMouseDown={startDetailPanelResize} title="Drag to resize" />
              <header className="packages-detail-header"><div><small>ORDERS TO DISPATCH</small><h5>Consolidated Orders</h5></div><button type="button" className="packages-mobile-panel-close" onClick={() => setMobileConsolidatedOpen(false)} aria-label="Close consolidated orders"><X size={19} /></button></header>
              <div className="packages-detail-body" style={{ padding: "12px" }}>
                <div className="input-group input-group-sm mb-3">
                  <span className="input-group-text" aria-hidden="true"><Search size={15} /></span>
                  <input
                    type="search"
                    className="form-control"
                    value={outboundBatchSearch}
                    onChange={(event) => setOutboundBatchSearch(event.target.value)}
                    placeholder="Shipment no. or destination"
                    aria-label="Search batches by shipment number or destination"
                  />
                  {outboundBatchSearch && <button type="button" className="btn btn-outline-secondary" onClick={() => setOutboundBatchSearch("")} aria-label="Clear batch search"><X size={14} /></button>}
                </div>
                {outboundBatchesLoading ? <div className="text-center py-4"><span className="spinner-border spinner-border-sm" /></div> : outboundBatches.length ? <>
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: "calc(100vh - 330px)", overflowY: "auto", paddingRight: "6px" }}>
                    {outboundBatches.map((batch) => <div className="border rounded-3 p-2" key={batch.HandoverCode}>
                      <div className="d-flex align-items-start justify-content-between gap-2"><div className="min-w-0"><strong className="text-primary d-block text-truncate">{batch.HandoverCode}</strong><small className="text-muted d-block">{batch.ToDCName || batch.ToDCCode || "No destination"}</small><small className="text-muted d-block">{formatPackageDate(batch.DateAdded)?.toLocaleString("en-GB") || "-"}</small></div><div className="d-flex gap-1 flex-shrink-0"><button type="button" className="btn btn-outline-primary btn-sm" onClick={() => openExistingBatchCompletion(batch, true)}>Edit</button><button type="button" className="btn btn-primary btn-sm" onClick={() => openExistingBatchCompletion(batch)}>Complete</button></div></div>
                    </div>)}
                  </div>
                  {outboundBatchTotal > outboundBatchPageSize && <div className="d-flex align-items-center justify-content-between gap-2 mt-3 pt-2 border-top">
                    <button type="button" className="btn btn-outline-secondary btn-sm" disabled={outboundBatchPage === 1 || outboundBatchesLoading} onClick={() => setOutboundBatchPage((page) => Math.max(1, page - 1))}>Previous</button>
                    <small className="text-muted">Page {outboundBatchPage} of {Math.ceil(outboundBatchTotal / outboundBatchPageSize)}</small>
                    <button type="button" className="btn btn-outline-secondary btn-sm" disabled={outboundBatchPage >= Math.ceil(outboundBatchTotal / outboundBatchPageSize) || outboundBatchesLoading} onClick={() => setOutboundBatchPage((page) => page + 1)}>Next</button>
                  </div>}
                </> : <div className="text-center py-5 text-muted"><Layers size={28} className="mb-2" /><p className="mb-0">No consolidated batches awaiting action.</p></div>}
              </div>
            </aside>}
            {(["confirmed", "dispatch", "receive", "forwardReverse", "reversed"].includes(activeTask) || selectedRowKeys.length > 0) && !batchPanelMode && !receiveBatch && <button type="button" className="packages-mobile-selection-fab" onClick={openSelectedMobilePanel} aria-label={selectedRowKeys.length ? `${activeTask === "dispatch" ? "Consolidate" : "Open actions for"} ${selectedRowKeys.length} selected ${isReceiveTask ? "batches" : "orders"}` : `Open ${activeTask} action`}>
              <Layers size={20} />
              <span>{selectedRowKeys.length
                ? (activeTask === "dispatch" ? `Consolidate (${selectedRowKeys.length})` : `${selectedRowKeys.length} selected`)
                : activeTask === "dispatch" ? "Consolidated Orders"
                  : isReceiveTask ? "Receive & Scan"
                    : activeTask === "confirmed" ? "Pick Orders"
                      : activeTask === "reversed" || activeTask === "forwardReverse" ? "Consolidate Returns"
                        : "Open Action"}</span>
            </button>}
            {batchPanelMode && <aside className="packages-detail-panel is-open" style={{ width: detailPanelWidth }} aria-label={`${batchPanelMode} batch`}>
              <div className="packages-detail-resizer" onMouseDown={startDetailPanelResize} title="Drag to resize" />
              <header className="packages-detail-header">
                <div><small>{batchPanelMode === "reversed" ? "REVERSED ORDERS" : batchPanelMode === "forwardReverse" ? "ORDERS TO REVERSE" : batchPanelMode === "confirmed" ? "ORDER CONFIRMED" : "ORDERS TO DISPATCH"}</small><h5>{batchPanelOrders.length} packages {batchPanelMode === "confirmed" ? "ready to scan" : "selected"}</h5></div>
                <button type="button" onClick={() => { setBatchPanelMode(""); setBatchPanelStage("consolidate"); setExistingBatchCode(""); setExistingBatchEditOnly(false); }} aria-label="Close batch panel"><X size={19} /></button>
              </header>
              <div className="packages-detail-body">
                {batchPanelMode !== "confirmed" && !existingBatchEditOnly && <section>
                  <h6>{batchPanelStage === "consolidate" ? "Consolidation route" : "Complete courier handover"}</h6>
                  <div className="mb-3"><label className="form-label fw-semibold">{batchPanelMode === "reversed" ? "Vendor" : "Destination"}</label>{batchPanelMode === "reversed" ? <input className="form-control" value={batchDestination?.label || selectedOrdersForActions[0]?.VendorName || selectedOrdersForActions[0]?.VendorCode || "Vendor not recorded"} readOnly aria-readonly="true" /> : <SSRSelect instanceId="task-batch-destination" options={globalDCOptions.filter((option) => option.value !== currentDCCode)} value={batchDestination} onChange={setBatchDestination} placeholder="Select destination DC" isSearchable />}</div>
                  {batchPanelStage === "complete" && <>
                    <div className="mb-3"><label className="form-label fw-semibold">Courier *</label><SSRSelect instanceId="task-batch-courier" options={courierOptions} value={batchCourier} onChange={setBatchCourier} placeholder="Select courier" isSearchable /></div>
                    <div className="mb-3"><label className="form-label fw-semibold">Courier cost (KES) *</label><input type="number" min="0" step="0.01" className="form-control" value={batchCourierCost} onChange={(event) => setBatchCourierCost(event.target.value)} placeholder="Enter courier cost" /></div>
                    <div className="mb-3"><label className="form-label fw-semibold">Courier receipt *</label><input type="file" accept="image/jpeg,image/png,image/webp" className="form-control" onChange={(event) => setBatchReceipt(event.target.files?.[0] || null)} /></div>
                  </>}
                </section>}
                {batchPanelStage === "consolidate" && <section>
                  <h6>{batchPanelMode === "confirmed" ? "Pick and scan packages" : "Scan selected packages"}</h6>
                  {batchPanelMode === "confirmed" && <div className="d-flex align-items-start justify-content-between gap-2 mb-2"><p className="text-muted small mb-0">Scans are saved on this device until the pick is completed.</p>{batchScannedKeys.length > 0 && <button type="button" className="btn btn-link btn-sm text-danger p-0 flex-shrink-0" onClick={() => { window.localStorage.removeItem(pickScanStorageKey); setBatchPanelOrders([]); setBatchScannedKeys([]); }}>Clear saved scans</button>}</div>}
                  <form className="d-flex align-items-start gap-2 mb-3" onSubmit={handleBatchPanelScan}><CameraScanInput onScan={setBatchScan}>{({ onFocus }) => <input className="form-control" value={batchScan} onChange={(event) => setBatchScan(event.target.value)} onFocus={onFocus} placeholder="Scan or enter package number" />}</CameraScanInput><button type="submit" className="btn btn-primary" disabled={!batchScan.trim()}>Scan</button></form>
                  {batchPanelMode === "confirmed" && batchPanelOrders.length > 0 && <button type="button" className="btn btn-outline-primary w-100 mb-3" onClick={() => setBatchScannedKeys(batchPanelOrders.map((order) => order.OrderNO))}>Confirm All Manually</button>}
                  <div className="list-group mb-3">{batchPanelOrders.map((order) => {
                    const confirmed = batchScannedKeys.includes(order.OrderNO);
                    return <label className="list-group-item d-flex align-items-center justify-content-between gap-2" key={order.OrderNO}>
                      <span className="d-flex align-items-center gap-2"><input type="checkbox" className="form-check-input m-0" checked={confirmed} onChange={(event) => setBatchScannedKeys((current) => event.target.checked ? [...new Set([...current, order.OrderNO])] : current.filter((key) => key !== order.OrderNO))} /><strong>{order.OrderNO}</strong></span>
                      <span className={`badge ${confirmed ? "bg-success" : "bg-light text-dark"}`}>{confirmed ? "Confirmed" : "Waiting"}</span>
                    </label>;
                  })}</div>
                  {batchPanelMode === "confirmed" ? <button type="button" className="btn btn-success w-100" disabled={batchSubmitting || !batchScannedKeys.length} onClick={handleConfirmedPickSubmit}>{batchSubmitting ? "Receiving..." : `Receive Scanned Packages (${batchScannedKeys.length})`}</button> : <button type="button" className="btn btn-success w-100" disabled={batchSubmitting || !batchDestination || !batchPanelOrders.length || batchScannedKeys.length !== batchPanelOrders.length} onClick={handleCompleteConsolidation}>{batchSubmitting ? "Saving..." : "Complete Consolidation"}</button>}
                </section>}
                {batchPanelStage === "complete" && <section>
                  {existingBatchCode && existingBatchEditOnly && <>
                    <h6>Edit packages</h6>
                    <div className="list-group mb-3" style={{ maxHeight: "220px", overflowY: "auto" }}>
                      {batchPanelOrders.map((order) => <div className="list-group-item d-flex align-items-center justify-content-between gap-2 py-2" key={order.OrderNO}>
                        <strong className="text-truncate">{order.OrderNO}</strong>
                        <button type="button" className="btn btn-sm btn-outline-danger flex-shrink-0" disabled={batchSubmitting} onClick={() => {
                          setBatchPanelOrders((current) => current.filter((item) => item.OrderNO !== order.OrderNO));
                          setBatchScannedKeys((current) => current.filter((orderNO) => orderNO !== order.OrderNO));
                        }}>Remove</button>
                      </div>)}
                    </div>
                    <div className="d-flex gap-2 mb-3">
                      <button type="button" className="btn btn-outline-primary flex-fill" disabled={batchSubmitting || !batchPanelOrders.length} onClick={handleExistingBatchEdit}>Save Package Changes</button>
                      <button type="button" className="btn btn-outline-danger flex-fill" disabled={batchSubmitting} onClick={handleExistingBatchCancel}>Cancel Entire Batch</button>
                    </div>
                  </>}
                  {!existingBatchEditOnly && <>
                    <p className="text-muted small mb-3">{batchPanelOrders.length} consolidated package{batchPanelOrders.length === 1 ? "" : "s"}.</p>
                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-outline-secondary flex-fill" disabled={batchSubmitting} onClick={() => setBatchPanelStage("consolidate")}>Back</button>
                      <button type="button" className="btn btn-success flex-fill" disabled={batchSubmitting || !batchCourier || !batchCourierCost || Number(batchCourierCost) <= 0 || !batchReceipt} onClick={handleBatchPanelSubmit}>{batchSubmitting ? "Completing..." : batchPanelMode === "reversed" || batchPanelMode === "forwardReverse" ? "Return & Dispatch" : "Complete Dispatch"}</button>
                    </div>
                  </>}
                </section>}
              </div>
            </aside>}
            {!isReceiveTask && !batchPanelMode && selectedRowKeys.length <= 1 && (activeTask !== "dispatch" || selectedRowKeys.length > 0 || Boolean(detailPanelOrder)) && <aside
              className={`packages-detail-panel packages-order-detail-panel ${detailPanelOrder ? "is-open" : "is-collapsed"} ${mobileDetailOpen ? "is-mobile-open" : ""}`}
              style={{ width: detailPanelOrder ? detailPanelWidth : 76 }}
              aria-label="Package details"
            >
              <div className="packages-detail-resizer" onMouseDown={startDetailPanelResize} title="Drag to resize" />
              {detailPanelOrder ? (
                <>
                  <header className="packages-detail-header">
                    <div><small>PACKAGE DETAILS</small><h5>{getDisplayText(detailPanelOrder.OrderNO)}</h5></div>
                    <button type="button" onClick={() => { setDetailOrder(null); setMobileDetailOpen(false); }} aria-label="Close details"><X size={19} /></button>
                  </header>
                  <div className="packages-detail-actions" aria-label="Package actions">
                    <button type="button" className={detailView === "general" ? "active" : ""} onClick={() => setDetailView("general")}><i className="feather-file-text" />Details</button>
                    <button type="button" className={detailView === "history" ? "active" : ""} onClick={() => setDetailView("history")}><i className="feather-clock" />History</button>
                    <button type="button" className={detailView === "items" ? "active" : ""} onClick={() => setDetailView("items")}><i className="feather-package" />Items</button>
                    {activeTask === "confirmed" && selectedRowKeys.length > 0 && <button type="button" onClick={() => handleDownloadSticker(detailPanelOrder)} disabled={isGenerating}><i className="feather-download" />Sticker</button>}
                    <Link to={`${route.packages}/${detailPanelOrder.OrderNO}/edit`}><i className="feather-edit" />Edit</Link>
                    <button type="button" className="danger" onClick={() => handleDeletePackage(detailPanelOrder)}><i className="feather-trash-2" />Delete</button>
                  </div>
                  <div className="packages-detail-body">
                    {detailView === "general" && <>
                    <section><h6>Shipment</h6>
                      <DetailItem label="Status" value={detailPanelOrder.StatusName || detailPanelOrder.StatusCode} />
                      <DetailItem label="Date added" value={formatPackageDate(detailPanelOrder.DateAdded)?.toLocaleString("en-GB")} />
                      <DetailItem label="SLA" value={`${getOrderSlaState(detailPanelOrder).label} · ${getOrderSlaTiming(detailPanelOrder).difference} (expected ${getOrderSlaTiming(detailPanelOrder).expected})`} />
                    </section>
                    <section><h6>Contacts</h6>
                      <DetailItem label="Sender" value={detailPanelOrder.VendorName || detailPanelOrder.SenderCompanyName} />
                      <DetailItem label="Sender phone" value={detailPanelOrder.VendorPhone || detailPanelOrder.SenderContactPhone} />
                      <DetailItem label="Receiver" value={detailPanelOrder.ReceiverContactName} />
                      <DetailItem label="Receiver phone" value={detailPanelOrder.ReceiverContactPhone} />
                      <DetailItem label="Receiver city" value={detailPanelOrder.ReceiverCity} />
                      <DetailItem label="Receiver street" value={detailPanelOrder.ReceiverStreetName} />
                    </section>
                    <section><h6>Payment</h6>
                      <DetailItem label="Service fee" value={`KES ${formatAmount(detailPanelOrder.ServiceFee)}`} />
                      <DetailItem label="COD" value={`KES ${formatAmount(detailPanelOrder.CODAmount)}`} />
                      <DetailItem label="COD required" value={detailPanelOrder.CashOnDeliveryRequired ? "Yes" : "No"} />
                    </section>
                    </>}
                    {detailView === "items" && <section><h6>Items</h6>
                      {detailDataLoading && detailItems.length === 0 ? <p className="packages-detail-muted">Loading items…</p> : detailItems.length > 0 ? (
                        <div className="packages-detail-items">
                          <div className="packages-detail-items-head"><span>Name</span><span>SKU</span><span>Category</span><span>Qty</span><span>Price</span></div>
                          {detailItems.map((item, index) => (
                            <div className="packages-detail-items-row" key={item.ShipmentOrderItemID || item.ItemCode || item.itemCode || index}>
                              <span>{item.Name || item.ProductName || item.productName || item.ItemName || item.itemName || item.description || "-"}</span>
                              <span>{item.SKU || item.Sku || item.sku || item.ItemCode || item.itemCode || item.VendorProductCode || item.vendorProductCode || "-"}</span>
                              <span>{item.Category || item.CategoryName || item.categoryName || item.ProductCategoryName || item.productCategoryName || "-"}</span>
                              <span>{item.Quantity ?? item.quantity ?? 1}</span>
                              <span>{formatAmount(item.Price ?? item.price ?? item.UnitPrice ?? item.unitPrice ?? item.ProductValue ?? item.productValue ?? item.CurrentPrice ?? item.currentPrice)}</span>
                            </div>
                          ))}
                        </div>
                      ) : <p className="packages-detail-muted">No package items found.</p>}
                    </section>}
                    {detailView === "history" && <section><h6>Tracking history</h6>
                      {detailDataLoading && detailHistory.length === 0 ? <p className="packages-detail-muted">Loading tracking history…</p> : detailHistory.length > 0 ? (
                        <div className="packages-detail-history">
                          {[...detailHistory].sort((a, b) => new Date(b.EventTime || b.DateAdded || 0) - new Date(a.EventTime || a.DateAdded || 0)).map((event, index) => (
                            <div className="packages-detail-history-item" key={event.EventID || `${event.StatusName}-${index}`}>
                              <i aria-hidden="true" />
                              <div><strong>{event.StatusName || event.StatusCode || "Shipment update"}</strong><small>{formatPackageDate(event.EventTime || event.DateAdded)?.toLocaleString("en-GB") || "-"}</small>{event.Description && <p>{event.Description}</p>}{event.DCName && <span>{event.DCName}</span>}</div>
                            </div>
                          ))}
                        </div>
                      ) : <p className="packages-detail-muted">No tracking history found.</p>}
                    </section>}
                  </div>
                </>
              ) : (
                <div className="packages-detail-empty">
                  <span className="packages-detail-empty-icon" aria-hidden="true">›</span>
                  <strong>DETAILS</strong>
                  <small>HOVER A ROW</small>
                </div>
              )}
            </aside>
            }
            </div>
          )}
        </div>
      </div>

      {/* Import Excel Modal */}
      <ImportExcelModal
        show={showImportModal}
        showVendorInput={!isVendorOnly}
        onClose={() => setShowImportModal(false)}
        onUploadSuccess={() => {
          handleRefresh();
        }}
      />

      <ReceiveInboundBatchModal
        show={showReceiveBatchModal}
        onClose={() => setShowReceiveBatchModal(false)}
        onSubmit={handleAcceptBatch}
        handoverCode={receiveBatch?.HandoverCode}
        dcCode={receiveBatch?.ToDCCode}
        courierCode={receiveBatch?.CourierCode || receiveBatch?.RiderUserCode}
        batchCount={receiveBatch?.IsMultiBatch ? receiveBatch.Batches.length : undefined}
        orders={receiveItems.filter((item) => receivedOrderKeys.includes(item.OrderNO))}
      />

      <Modal show={showCreatePackage} onHide={() => setShowCreatePackage(false)} size="xl" fullscreen="lg-down" scrollable centered>
        <Modal.Body className="p-0">
          <CreatePackageForm
            embedded
            showVendorInput={!isVendorOnly}
            onClose={() => setShowCreatePackage(false)}
            onComplete={() => {
              setShowCreatePackage(false);
              setActiveTask("confirmed");
              loadShipmentOrders({ pageNo: 1, taskType: "confirmed", searchTerm: "" });
            }}
          />
        </Modal.Body>
      </Modal>

      {isVendorOnly && (
        <button
          type="button"
          className="packages-create-order-fab"
          onClick={() => setShowCreatePackage(true)}
          aria-label="Create new order"
        >
          <PlusCircle size={20} />
          Create new Order
        </button>
      )}

      <style jsx global>{`
        .packages-create-order-fab { position: fixed; right: 28px; bottom: 28px; z-index: 1040; display: inline-flex; align-items: center; gap: 9px; border: 0; border-radius: 999px; padding: 13px 20px; background: #ff6200; color: #fff; font-weight: 800; box-shadow: 0 10px 28px rgba(255, 98, 0, .32); }
        .packages-create-order-fab:hover, .packages-create-order-fab:focus-visible { background: #dd5500; transform: translateY(-1px); outline: none; }
        .delivery-action-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 18px; text-align: left; }
        .delivery-action-button { min-height: 76px; display: flex; align-items: center; gap: 13px; padding: 15px 17px; border: 1px solid #d9dee7; border-radius: 10px; background: #fff; color: #172b4d; font-size: 15px; font-weight: 700; text-align: left; transition: border-color .15s ease, background .15s ease, transform .15s ease, box-shadow .15s ease; }
        .delivery-action-button:hover, .delivery-action-button:focus-visible { border-color: #ff6200; background: #fff7f2; color: #d94f00; box-shadow: 0 5px 14px rgba(255, 98, 0, .14); transform: translateY(-1px); outline: none; }
        .delivery-action-button-icon { flex: 0 0 40px; width: 40px; height: 40px; display: grid; place-items: center; border-radius: 9px; background: #fff0e7; color: #ff6200; font-size: 18px; }
        .delivery-action-grid .delivery-action-button:last-child:nth-child(odd) { grid-column: 1 / -1; }
        .delivery-completion-form { text-align: left; }
        .delivery-payment-options { display: flex; align-items: stretch; gap: 9px; }
        .delivery-payment-option { flex: 1 1 0; min-width: 0; min-height: 44px; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 9px 10px; border: 1px solid #d0d5dd; border-radius: 8px; background: #fff; cursor: pointer; margin: 0; }
        .delivery-payment-option input { flex: 0 0 auto; width: 16px; height: 16px; margin: 0; accent-color: #ff6200; }
        .delivery-payment-option span { min-width: 0; color: #344054; font-size: 12px; font-weight: 700; text-align: center; }
        .delivery-payment-option:has(input:checked) { border-color: #ff6200; background: #fff2e9; box-shadow: 0 0 0 2px rgba(255, 98, 0, .12); }
        .delivery-payment-option:has(input:checked) span { color: #c54b00; }
        .delivery-completion-form .form-select[size] { min-height: 175px; }
        .task-searchable-select { display: flex; flex-direction: column; gap: 10px; text-align: left; }
        .task-searchable-select .swal2-input { width: 100%; height: 44px; margin: 12px 0 0; font-size: 14px; }
        .task-searchable-select .swal2-select { width: 100%; min-height: 230px; margin: 0; padding: 6px; border: 1px solid #d0d5dd; border-radius: 8px; background: #fff; font-size: 14px; }
        .task-searchable-select .swal2-select option { padding: 9px 10px; border-radius: 5px; }
        .task-searchable-select .swal2-select option:checked { background: #ff6200 linear-gradient(0deg, #ff6200 0%, #ff6200 100%); color: #fff; }
        @media (max-width: 575px) { .delivery-action-grid { grid-template-columns: 1fr; } .delivery-action-grid .delivery-action-button:last-child:nth-child(odd) { grid-column: auto; } .delivery-payment-options { flex-wrap: wrap; } .delivery-payment-option { flex: 1 1 calc(50% - 9px); } }
        .packages-table-workspace { display: flex; width: 100%; max-width: 100%; min-width: 0; border: 1px solid #e7eaf0; border-radius: 10px; overflow: hidden; }
        .packages-table-workspace .packages-table-shell { flex: 1 1 0; width: 0; min-width: 0; overflow: auto; border: 0; border-radius: 0; }
        .packages-detail-panel { position: relative; flex: 0 0 auto; display: flex; flex-direction: column; max-width: 55%; min-height: 610px; background: #fff; border-left: 2px solid #ff6200; box-shadow: -8px 0 22px rgba(16, 24, 40, .12); transition: width .2s ease; overflow: hidden; z-index: 4; }
        .packages-detail-panel.is-collapsed { border-left-width: 3px; background: #fff4ec; box-shadow: -5px 0 14px rgba(255, 98, 0, .12); }
        .packages-detail-resizer { position: absolute; inset: 0 auto 0 -4px; width: 8px; cursor: col-resize; z-index: 2; }
        .packages-detail-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 20px 20px 16px; background: #fff8f3; border-bottom: 1px solid #ffd7bf; }
        .packages-detail-header small { color: #ff5b00; font-weight: 700; letter-spacing: .08em; }
        .packages-detail-header h5 { margin: 5px 0 0; overflow-wrap: anywhere; }
        .packages-detail-header button { border: 0; background: #f5f6f8; border-radius: 50%; width: 32px; height: 32px; display: grid; place-items: center; }
        .packages-detail-actions { display: flex; align-items: center; gap: 6px; padding: 10px 12px; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin; background: #fffaf7; border-bottom: 1px solid #ffe0cc; }
        .packages-detail-actions button,
        .packages-detail-actions a { flex: 0 0 auto; min-height: 34px; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 7px 10px; border: 1px solid #ffd0b2; border-radius: 6px; background: #fff; color: #344054; font-size: 10px; font-weight: 600; text-decoration: none; white-space: nowrap; }
        .packages-detail-actions button:hover,
        .packages-detail-actions a:hover,
        .packages-detail-actions button.active { border-color: #ff6200; color: #ff6200; background: #fff4ec; }
        .packages-detail-actions button.danger { color: #d92d20; border-color: #fecdca; }
        .packages-detail-actions button:disabled { opacity: .55; cursor: not-allowed; }
        .packages-detail-actions a > span { display: flex; align-items: center; justify-content: center; gap: 6px; }
        .packages-detail-body { flex: 1 1 auto; min-height: 0; padding: 20px; overflow-y: auto; background: #fff; }
        .packages-detail-empty { flex: 1 1 auto; min-height: 610px; width: 73px; display: flex; align-items: center; flex-direction: column; gap: 12px; padding-top: 20px; background: linear-gradient(180deg, #fff1e6 0%, #fffaf7 100%); color: #e85a00; cursor: help; }
        .packages-detail-empty-icon { width: 38px; height: 38px; display: grid; place-items: center; border: 1px solid #ffc49e; border-radius: 50%; background: #fff; box-shadow: 0 3px 8px rgba(255, 98, 0, .14); font-size: 28px; font-weight: 800; line-height: 1; }
        .packages-detail-empty strong { writing-mode: vertical-rl; font-size: 12px; letter-spacing: .18em; }
        .packages-detail-empty small { writing-mode: vertical-rl; color: #b54708; font-size: 8px; font-weight: 700; letter-spacing: .1em; }
        .packages-detail-panel.is-collapsed .packages-detail-resizer { display: none; }
        .packages-detail-body section + section { margin-top: 24px; padding-top: 20px; border-top: 1px solid #edf0f4; }
        .packages-detail-body h6 { margin-bottom: 14px; }
        .packages-detail-muted { margin: 0; color: #98a2b3; font-size: 12px; }
        .packages-detail-items { overflow-x: auto; border: 1px solid #e7eaf0; border-radius: 7px; }
        .packages-detail-items-head,
        .packages-detail-items-row { min-width: 520px; display: grid; grid-template-columns: 1.45fr 1fr 1fr .45fr .8fr; gap: 8px; padding: 9px 10px; align-items: center; }
        .packages-detail-items-head { background: #f8fafc; color: #667085; font-size: 10px; font-weight: 800; text-transform: uppercase; }
        .packages-detail-items-row { border-top: 1px solid #edf0f4; color: #344054; font-size: 11px; }
        .packages-detail-items-row span { min-width: 0; overflow-wrap: anywhere; }
        .packages-detail-history { display: flex; flex-direction: column; }
        .packages-detail-history-item { position: relative; display: grid; grid-template-columns: 14px 1fr; gap: 10px; padding-bottom: 18px; }
        .packages-detail-history-item > i { width: 10px; height: 10px; margin-top: 4px; border: 2px solid #ff6200; border-radius: 50%; background: #fff; z-index: 1; }
        .packages-detail-history-item:not(:last-child)::before { content: ""; position: absolute; left: 4px; top: 14px; bottom: 0; width: 2px; background: #ffd9c2; }
        .packages-detail-history-item strong,
        .packages-detail-history-item small,
        .packages-detail-history-item span { display: block; }
        .packages-detail-history-item strong { color: #172b4d; font-size: 12px; }
        .packages-detail-history-item small { margin-top: 3px; color: #98a2b3; font-size: 10px; }
        .packages-detail-history-item p { margin: 5px 0 0; color: #667085; font-size: 11px; line-height: 1.45; }
        .packages-detail-history-item span { margin-top: 4px; color: #667085; font-size: 10px; }
        .packages-detail-item { display: grid; grid-template-columns: minmax(100px, 38%) 1fr; gap: 14px; padding: 7px 0; }
        .packages-detail-item small { color: #7a8495; }
        .packages-detail-item span { color: #172b4d; overflow-wrap: anywhere; }
        .packages-order-link { display: block; max-width: 100%; border: 0; padding: 0; background: transparent; text-align: left; }
        .packages-current-location { color: #98a2b3; font-size: 10px; font-weight: 400; }
        .packages-sla-date-cell { display: flex; flex-direction: column; align-items: flex-start; gap: 7px; min-width: 0; }
        .packages-sla-value { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; line-height: 1; letter-spacing: .02em; white-space: nowrap; }
        .packages-sla-value strong { font-weight: 800; }
        .packages-date-time { display: block; max-width: 100%; color: #667085; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .packages-date-time.allow-wrap { white-space: normal; overflow: visible; text-overflow: clip; }
        .packages-table .ant-table-tbody > tr.packages-detail-selected-row > td,
        .packages-table .ant-table-tbody > tr.packages-detail-selected-row:hover > td {
          background: #fff1e8 !important;
          box-shadow: inset 0 1px #ffb27f, inset 0 -1px #ffb27f;
        }
        .packages-table .ant-table-tbody > tr.packages-detail-selected-row > td:first-child { box-shadow: inset 4px 0 #ff6200, inset 0 1px #ffb27f, inset 0 -1px #ffb27f; }
        .packages-table .ant-table-thead > tr > th:last-child,
        .packages-table .ant-table-tbody > tr > td:last-child { padding-right: 8px; border-right: 1px solid #f0d7c7; }
        .packages-mobile-selection-fab { display: none; }
        .packages-mobile-panel-close { display: none; }
        .packages-mobile-cards { display: none; }

        .packages-filter-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          width: 100%;
        }

        .packages-filter-field {
          flex: 1 1 150px;
          min-width: 0;
        }

        .packages-filter-search {
          flex-basis: 260px;
          flex-grow: 1.4;
        }

        .packages-filter-select {
          flex-basis: 190px;
        }

        .packages-filter-compact,
        .packages-filter-date {
          flex-basis: 140px;
        }

        .packages-filter-field .form-control,
        .packages-filter-field .form-select {
          width: 100%;
          min-height: 36px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .packages-filter-select-control {
          width: 100%;
          font-size: 13px;
        }

        .packages-filter-select__control {
          min-height: 36px !important;
          border-color: #dfe5ef !important;
          border-radius: 6px !important;
          box-shadow: none !important;
        }

        .packages-filter-select__control:hover,
        .packages-filter-select__control--is-focused {
          border-color: #b8c2d4 !important;
        }

        .packages-filter-select__value-container {
          min-width: 0;
          padding: 2px 8px !important;
        }

        .packages-filter-select__single-value,
        .packages-filter-select__placeholder {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .packages-filter-select__indicator {
          padding: 6px !important;
        }

        .packages-filter-select__menu {
          z-index: 20 !important;
        }

        .packages-filter-field .react-datepicker-wrapper,
        .packages-filter-field .react-datepicker__input-container {
          display: block;
          width: 100%;
        }

        .packages-filter-active {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex: 0 0 auto;
          min-height: 36px;
          padding: 6px 12px;
          border: 1px solid #dfe5ef;
          border-radius: 6px;
          color: #344054;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.2;
          background: #fff;
          cursor: pointer;
          white-space: nowrap;
        }

        .packages-filter-active .form-check-input {
          flex: 0 0 auto;
          margin: 0;
        }

        .packages-filter-button {
          flex: 0 0 110px;
          min-height: 36px;
          padding-right: 16px;
          padding-left: 16px;
          white-space: nowrap;
        }

        .packages-table-shell {
          overflow: auto;
          border: 1px solid #edf0f5;
          border-radius: 8px;
        }

        .packages-table .ant-table {
          font-size: 13px;
        }

        .packages-table .ant-table-container table {
          table-layout: fixed !important;
        }

        .packages-table .ant-table-thead > tr > th {
          position: sticky;
          top: 0;
          z-index: 5;
          background: #f8fafc !important;
          color: #344054;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.01em;
          padding: 9px 6px;
          white-space: normal;
          border-bottom: 1px solid #e6eaf0;
        }

        .packages-table .ant-table-tbody > tr > td {
          padding: 9px 6px;
          vertical-align: middle;
          color: #344054;
          border-bottom: 1px solid #eef1f5;
        }

        .packages-table .ant-table-tbody > tr:hover > td,
        .packages-table .ant-table-tbody .ant-table-row > .ant-table-cell-row-hover {
          background: #f6f9ff !important;
        }

        .packages-table-ellipsis {
          display: block;
          max-width: 100%;
          overflow: visible;
          overflow-wrap: anywhere;
          text-overflow: clip;
          white-space: normal;
        }

        .packages-order-link,
        .packages-receiver-street { overflow-wrap: anywhere; white-space: normal; }

        .packages-person-cell {
          min-width: 0;
          line-height: 1.35;
        }

        .packages-person-cell .small,
        .packages-date-cell small,
        .packages-amount-cell small {
          font-size: 11px;
        }

        .packages-route-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          color: #344054;
        }

        .packages-route-icon {
          flex: 0 0 auto;
          color: #0d6efd;
        }

        .packages-route-text {
          display: flex;
          align-items: center;
          min-width: 0;
          overflow: hidden;
          font-weight: 600;
          white-space: nowrap;
        }

        .packages-route-text span:not(.packages-route-arrow) {
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .packages-route-arrow {
          flex: 0 0 auto;
          margin: 0 6px;
          color: #98a2b3;
          font-weight: 700;
        }

        .packages-route-count {
          flex: 0 0 auto;
          border-radius: 999px;
          background: #eef4ff;
          color: #175cd3;
          font-size: 11px;
          font-weight: 700;
          padding: 1px 6px;
        }

        .packages-amount-cell,
        .packages-date-cell {
          line-height: 1.35;
          white-space: nowrap;
        }

        .packages-table .dropdown-toggle {
          padding: 4px 8px;
          font-size: 12px;
        }

        .packages-table .ant-table-tbody > tr > td.ant-table-column-sort {
          background: inherit !important;
        }
.packages-route-combined-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.packages-route-point {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
  flex: 1 1 0;
}

.packages-route-label {
  flex: 0 0 auto;
  color: #667085;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.4;
  text-transform: uppercase;
}

.packages-route-details {
  min-width: 0;
  line-height: 1.3;
}

.packages-route-arrow {
  flex: 0 0 auto;
  color: #98a2b3;
  font-size: 16px;
  font-weight: 700;
}
        .packages-task-toolbar {
          min-height: 58px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          padding-right: 16px;
          border-bottom: 1px solid #ff6200;
        }
        .packages-task-tabs {
          display: flex;
          align-items: flex-end;
          gap: 5px;
          margin: 8px 14px -1px;
          padding-left: 14px;
          position: relative;
          z-index: 3;
          overflow: visible;
        }

        .packages-selection-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          padding-bottom: 8px;
          flex-wrap: wrap;
        }

        .packages-selection-count {
          color: #667085;
          font-size: 12px;
          font-weight: 700;
          margin-right: 4px;
        }

        .packages-selection-actions .btn {
          white-space: nowrap;
        }

        .packages-delivery-actions {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px;
          border: 1px solid #ffd3b8;
          border-radius: 8px;
          background: #fff7f2;
        }

        .packages-delivery-actions button {
          min-height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 6px 9px;
          border: 1px solid #ffb98d;
          border-radius: 6px;
          background: #fff;
          color: #b54708;
          font-size: 10px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
        }

        .packages-delivery-actions button:hover:not(:disabled) {
          border-color: #ff6200;
          background: #ff6200;
          color: #fff;
        }

        .packages-delivery-actions button.warning {
          border-color: #fda29b;
          color: #b42318;
        }

        .packages-delivery-actions button.warning:hover:not(:disabled) {
          border-color: #d92d20;
          background: #d92d20;
          color: #fff;
        }

        .packages-delivery-actions button:disabled { opacity: .5; cursor: not-allowed; }

        .packages-task-tab {
          position: relative;
          min-width: 138px;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          padding: 9px 13px;
          border: 1px solid #d0d5dd;
          border-bottom-color: #ff6200;
          border-radius: 17px 17px 0 0;
          background: #eaecf0;
          color: #667085;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          transition: background .18s ease, color .18s ease, min-height .18s ease;
        }

        .packages-task-tab b {
          position: absolute;
          top: -7px;
          right: 9px;
          z-index: 4;
          min-width: 20px;
          height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 2px 6px;
          border: 1px solid #e4e7ec;
          border-radius: 999px;
          background: #fff;
          color: #475467;
          font-size: 10px;
          font-weight: 800;
          line-height: 1.2;
          text-align: center;
          box-shadow: 0 1px 4px rgba(16, 24, 40, .16);
        }

        .packages-task-tab:hover {
          background: #f2f4f7;
          color: #344054;
        }

        .packages-task-tab-active {
          min-height: 50px;
          border-color: #ff6200;
          border-bottom-color: #ff6200;
          background: #ff6200;
          color: #fff;
          z-index: 2;
        }

        .packages-task-tab-active:hover {
          background: #e55800;
          color: #fff;
        }

        .packages-task-tab-active b {
          border-color: #fff;
          color: #b54708;
        }

        .packages-task-tabs + .text-center,
        .packages-task-tabs + .alert,
        .packages-task-tabs ~ .packages-table-shell {
          border-top-color: #ff6200;
        }

        @media (max-width: 1199.98px) {
          .packages-task-tabs { overflow-x: auto; overflow-y: hidden; padding-top: 8px; }
          .packages-filter-search,
          .packages-filter-select {
            flex-basis: 220px;
          }

          .packages-filter-compact,
          .packages-filter-date {
            flex-basis: 160px;
          }
        }

        @media (max-width: 767.98px) {
          .packages-mobile-hidden-header { display: none !important; }
          .packages-task-toolbar {
            position: sticky;
            top: 60px;
            z-index: 25;
            min-height: 0;
            align-items: stretch;
            flex-direction: column;
            gap: 0;
            padding: 0;
            border-bottom: 0;
            background: #fffaf7;
          }
          .packages-task-tabs { display: none; }
          .packages-selection-actions {
            display: none;
          }
          .packages-selection-actions > div { width: 100%; justify-content: flex-start !important; overflow-x: auto; }
          .packages-selection-actions .btn { min-height: 40px; flex: 0 0 auto; white-space: nowrap; }
          .packages-selection-count { align-self: center; flex: 0 0 auto; white-space: nowrap; }
          .packages-delivery-actions { width: 100%; flex-wrap: wrap; }
          .packages-delivery-actions {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 6px;
          }
          .packages-delivery-actions button { min-width: 0; min-height: 40px; padding: 7px 4px; font-size: 10px; }
          .packages-step-actions { display: grid !important; grid-template-columns: 1fr; width: 100%; }
          .packages-step-actions > .packages-step-primary { width: 100%; min-height: 42px; justify-content: center; }
          .packages-step-actions > .packages-delivery-actions { width: 100%; overflow: visible; }
          .packages-mobile-search-controls { min-width: 0; }
          .packages-mobile-search-controls input { min-width: 0; }
          .packages-filter-bar {
            gap: 10px;
          }

          .packages-filter-field,
          .packages-filter-search,
          .packages-filter-select,
          .packages-filter-compact,
          .packages-filter-date,
          .packages-filter-active,
          .packages-filter-button {
            flex: 1 1 100%;
            width: 100%;
          }

          .packages-filter-active {
            justify-content: flex-start;
          }

          .packages-table-workspace { display: block; overflow: visible; }
          .packages-table-workspace .packages-table-shell { width: 100%; max-width: 100%; overflow-x: auto; }
          .packages-desktop-table { display: none; }
          .packages-mobile-cards { display: grid; gap: 12px; padding: 12px; background: #f7f8fa; }
          .packages-mobile-card { overflow: hidden; border: 1px solid #e1e5eb; border-radius: 12px; background: #fff; box-shadow: 0 3px 12px rgba(16, 24, 40, .06); }
          .packages-mobile-card.is-selected { border-color: #ff6200; box-shadow: 0 0 0 2px rgba(255, 98, 0, .13); }
          .packages-mobile-card-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; border-bottom: 1px solid #edf0f4; background: #fafbfc; }
          .packages-mobile-card-select { display: inline-flex; align-items: center; gap: 7px; margin: 0; color: #475467; font-size: 12px; font-weight: 700; }
          .packages-mobile-card-select .form-check-input { margin: 0; }
          .packages-mobile-card-status { max-width: 62%; padding: 4px 8px; overflow: hidden; border-radius: 999px; background: #172b4d; color: #fff; font-size: 10px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
          .packages-mobile-card-body { width: 100%; display: grid; gap: 10px; padding: 14px 12px; border: 0; background: #fff; color: #172b4d; text-align: left; }
          .packages-mobile-card-body > strong { color: #ff5b00; font-size: 14px; overflow-wrap: anywhere; }
          .packages-mobile-card-body > span { display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 8px; font-size: 12px; overflow-wrap: anywhere; }
          .packages-mobile-card-body > span small { color: #8a94a6; font-weight: 700; }
          .packages-mobile-card-body > em { color: #ff5b00; font-size: 11px; font-style: normal; font-weight: 800; text-align: right; }
          .packages-mobile-pagination { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 4px 0 70px; }
          .packages-mobile-pagination button { min-height: 38px; padding: 7px 13px; border: 1px solid #ffb17f; border-radius: 8px; background: #fff; color: #d94f00; font-size: 12px; font-weight: 800; }
          .packages-mobile-pagination button:disabled { opacity: .45; }
          .packages-mobile-pagination span { color: #667085; font-size: 11px; font-weight: 700; }
          .packages-detail-panel.is-collapsed,
          .packages-consolidated-panel:not(.is-mobile-open) { display: none; }
          .packages-consolidated-panel.is-mobile-open {
            position: fixed;
            inset: 0;
            display: flex;
            width: 100% !important;
            max-width: none;
            min-height: 100dvh;
            height: 100dvh;
            border: 0;
            box-shadow: none;
            z-index: 1100;
          }
          .packages-consolidated-panel.is-mobile-open .packages-detail-resizer { display: none; }
          .packages-mobile-panel-close { display: inline-flex; }
          .packages-detail-panel.is-open:not(.packages-consolidated-panel) {
            position: fixed;
            inset: 0;
            width: 100% !important;
            max-width: none;
            min-height: 100dvh;
            height: 100dvh;
            border: 0;
            box-shadow: none;
            z-index: 1100;
          }
          .packages-detail-panel.is-open:not(.packages-consolidated-panel) .packages-detail-resizer { display: none; }
          .packages-detail-panel.is-open:not(.packages-consolidated-panel) .packages-detail-header { flex: 0 0 auto; padding: max(16px, env(safe-area-inset-top)) 16px 14px; }
          .packages-detail-panel.is-open:not(.packages-consolidated-panel) .packages-detail-body { padding: 16px; padding-bottom: max(24px, env(safe-area-inset-bottom)); }
          .packages-order-detail-panel:not(.is-mobile-open) { display: none !important; }
          .packages-mobile-selection-fab {
            position: fixed;
            right: 18px;
            bottom: calc(82px + env(safe-area-inset-bottom));
            z-index: 1000;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 9px;
            min-height: 50px;
            padding: 0 18px;
            border: 0;
            border-radius: 999px;
            background: #ff6200;
            color: #fff;
            font-weight: 800;
            box-shadow: 0 10px 28px rgba(181, 71, 8, .35);
          }
        }

        @media (max-width: 1199px) {
          .packages-table-shell {
            border-radius: 6px;
          }
        }
      `}</style>
    </div>
  );
};

export default PackagesList;
