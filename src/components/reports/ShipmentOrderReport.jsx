"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  RotateCcw,
  Target,
  Truck,
} from "feather-icons-react";
import SSRSelect from "@/components/SSRSelect";
import Link from "@/components/Link";
import Chart from "@/components/ClientChart";
import { PACKAGE_STATUSES } from "@/constants/package_status";
import {
  AnalyticsChartEmpty,
  AnalyticsCsvButton,
  AnalyticsDatePicker,
  AnalyticsErrorState,
  AnalyticsField,
  AnalyticsFilterPanel,
  AnalyticsLoadingState,
  AnalyticsMetricCard,
  AnalyticsReportHeader,
  AnalyticsSection,
  AnalyticsTable,
} from "@/components/reports/AnalyticsReportUI";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAnalyticsFilterOptions } from "@/hooks/useAnalyticsFilterOptions";
import {
  downloadReportCsv,
  buildAdminPackagesUrl,
  formatReportCurrency,
  formatReportDate,
  formatReportNumber,
  formatReportPercent,
  getDefaultReportDates,
  readAnalyticsArray,
  readAnalyticsValue,
  toReportDateTime,
} from "@/utils/analyticsReportUtils";
import "@/style/css/analytics-reports.css";

const createInitialFilters = ({ vendorCode = "", dcCode = "", dcDirection = "outbound", statusID = "" } = {}) => ({
  vendorCode,
  originDCCode: dcCode && dcDirection === "outbound" ? dcCode : "",
  destinationDCCode: dcCode && dcDirection === "inbound" ? dcCode : "",
  dcDirection,
  deliveryTypeCode: "",
  statusID,
  ...getDefaultReportDates(),
});

const toRequestParams = (filters) => ({
  vendorCode: filters.vendorCode || undefined,
  originDCCode: filters.originDCCode || undefined,
  destinationDCCode: filters.destinationDCCode || undefined,
  deliveryTypeCode: filters.deliveryTypeCode || undefined,
  statusID: filters.statusID || undefined,
  startDate: toReportDateTime(filters.startDate),
  endDate: toReportDateTime(filters.endDate, true),
});

export const ShipmentOrderReport = ({
  scope = "admin",
  scopeCode = "",
  reportBasePath = "/admin/reports",
  packageListPath = "/admin/packages",
  pageTitle,
  pageEyebrow,
  defaultStatusName = "",
  defaultStatusID = "",
}) => {
  const scopeDefaults = useMemo(() => ({
    vendorCode: scope === "vendor" ? scopeCode : "",
    dcCode: scope === "dc" ? scopeCode : "",
    statusID: defaultStatusID || "",
  }), [defaultStatusID, scope, scopeCode]);
  const [filters, setFilters] = useState(() => createInitialFilters(scopeDefaults));
  const {
    shipmentOrderAnalytics,
    orderLoading,
    orderError,
    fetchShipmentOrderAnalytics,
  } = useAnalytics();
  const {
    vendorOptions,
    dcOptions,
    deliveryTypeOptions,
    statusOptions,
  } = useAnalyticsFilterOptions();

  useEffect(() => {
    if ((!defaultStatusName && !defaultStatusID) || !statusOptions.length) return;
    const matchingStatus = defaultStatusID
      ? statusOptions.find((option) => Number(option.value) === Number(defaultStatusID))
      : statusOptions.find((option) => option.label?.toLowerCase().includes(defaultStatusName.toLowerCase()));
    if (!matchingStatus) return;
    setFilters((current) => current.statusID ? current : ({ ...current, statusID: matchingStatus.value }));
  }, [defaultStatusID, defaultStatusName, statusOptions]);

  const loadReport = useCallback(
    async (nextFilters) => {
      try {
        await fetchShipmentOrderAnalytics(toRequestParams(nextFilters));
      } catch {
        // The hook exposes the report error to the page state.
      }
    },
    [fetchShipmentOrderAnalytics]
  );

  useEffect(() => {
    loadReport(createInitialFilters(scopeDefaults));
  }, [loadReport, scopeDefaults]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleReset = () => {
    const resetFilters = createInitialFilters(scopeDefaults);
    setFilters(resetFilters);
    loadReport(resetFilters);
  };

  const summary = readAnalyticsValue(shipmentOrderAnalytics, "Summary", {});
  const dailyTrend = readAnalyticsArray(shipmentOrderAnalytics, "DailyTrend");
  const statusAnalytics = readAnalyticsArray(shipmentOrderAnalytics, "StatusAnalytics");
  const vendorAnalytics = readAnalyticsArray(shipmentOrderAnalytics, "VendorAnalytics");
  const agingAnalytics = readAnalyticsArray(shipmentOrderAnalytics, "AgingAnalytics");
  const overdueAnalytics = readAnalyticsArray(shipmentOrderAnalytics, "OverdueAnalytics");
  const slaSummary = readAnalyticsValue(shipmentOrderAnalytics, "SLASummary", {});
  const slaByStatus = readAnalyticsArray(shipmentOrderAnalytics, "SLAByStatus");
  const slaBreachedOrders = readAnalyticsArray(shipmentOrderAnalytics, "SLABreachedOrders");
  const currentSLARisk = readAnalyticsArray(shipmentOrderAnalytics, "CurrentSLARisk");
  const slaByVendor = readAnalyticsArray(shipmentOrderAnalytics, "SLAByVendor");
  const slaDailyTrend = readAnalyticsArray(shipmentOrderAnalytics, "SLADailyTrend");

  const formatHours = (value, digits = 1) =>
    `${formatReportNumber(Number(value || 0), digits)} hr`;

  const selectedStatusName = statusOptions.find(
    (option) => Number(option.value) === Number(filters.statusID)
  )?.label || "";
  const packageDrilldownUrl = (overrides = {}) => buildAdminPackagesUrl(
    { ...filters, statusName: selectedStatusName },
    overrides,
    packageListPath
  );

  const updateDCDirection = (direction) => {
    setFilters((current) => ({
      ...current,
      dcDirection: direction,
      originDCCode: direction === "outbound" ? scopeCode : "",
      destinationDCCode: direction === "inbound" ? scopeCode : "",
    }));
  };

  const sortedStatuses = useMemo(
    () =>
      [...statusAnalytics].sort(
        (a, b) =>
          Number(readAnalyticsValue(b, "OrderCount", 0)) -
          Number(readAnalyticsValue(a, "OrderCount", 0))
      ),
    [statusAnalytics]
  );

  const trendChart = useMemo(
    () => ({
      series: [
        {
          name: "Total orders",
          data: dailyTrend.map((item) => Number(readAnalyticsValue(item, "TotalOrders", 0))),
        },
        {
          name: "Delivered",
          data: dailyTrend.map((item) => Number(readAnalyticsValue(item, "DeliveredOrders", 0))),
        },
        {
          name: "Failed",
          data: dailyTrend.map((item) => Number(readAnalyticsValue(item, "FailedOrders", 0))),
        },
      ],
      options: {
        chart: { toolbar: { show: false }, zoom: { enabled: false } },
        colors: ["#f26a26", "#12b76a", "#f04438"],
        dataLabels: { enabled: false },
        stroke: { curve: "smooth", width: 2.5 },
        fill: {
          type: "gradient",
          gradient: { opacityFrom: 0.3, opacityTo: 0.03, stops: [0, 95] },
        },
        grid: { borderColor: "#eef1f5", strokeDashArray: 4 },
        xaxis: {
          categories: dailyTrend.map((item) =>
            formatReportDate(readAnalyticsValue(item, "OrderDate"))
          ),
          labels: { rotate: -35, style: { colors: "#667085", fontSize: "11px" } },
        },
        yaxis: { labels: { formatter: (value) => formatReportNumber(value) } },
        legend: { position: "top", horizontalAlign: "right" },
        tooltip: { shared: true, intersect: false },
      },
    }),
    [dailyTrend]
  );

  const statusChart = useMemo(() => {
    const chartRows = sortedStatuses.slice(0, 8);
    return {
      series: chartRows.map((item) => Number(readAnalyticsValue(item, "OrderCount", 0))),
      options: {
        chart: { toolbar: { show: false } },
        labels: chartRows.map((item) => readAnalyticsValue(item, "StatusName", "Unknown")),
        colors: ["#f26a26", "#175cd3", "#12b76a", "#f79009", "#6938ef", "#667085", "#f04438", "#0ba5ec"],
        dataLabels: { enabled: false },
        legend: { position: "bottom", fontSize: "11px" },
        plotOptions: { pie: { donut: { size: "67%" } } },
        tooltip: { y: { formatter: (value) => `${formatReportNumber(value)} orders` } },
      },
    };
  }, [sortedStatuses]);

  const agingChart = useMemo(
    () => ({
      series: [{
        name: "Orders",
        data: agingAnalytics.map((item) => Number(readAnalyticsValue(item, "OrderCount", 0))),
      }],
      options: {
        chart: { toolbar: { show: false } },
        colors: ["#f26a26"],
        dataLabels: { enabled: false },
        grid: { borderColor: "#eef1f5", strokeDashArray: 4 },
        plotOptions: { bar: { borderRadius: 5, columnWidth: "52%" } },
        xaxis: {
          categories: agingAnalytics.map((item) => readAnalyticsValue(item, "AgingBucket", "Unknown")),
          labels: {
            rotate: -35,
            rotateAlways: true,
            hideOverlappingLabels: false,
            trim: false,
            maxHeight: 90,
            style: { colors: "#667085", fontSize: "11px" },
          },
        },
        yaxis: { labels: { formatter: (value) => formatReportNumber(value) } },
      },
    }),
    [agingAnalytics]
  );

  const statusColumns = [
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <div className="analytics-status-cell">
          <strong>
            <Link className="analytics-table-link" to={packageDrilldownUrl({ statusName: readAnalyticsValue(row, "StatusName", "") })}>
              {readAnalyticsValue(row, "StatusName", "Unknown")}
            </Link>
          </strong>
          <small>{readAnalyticsValue(row, "PhaseCode", "—")}</small>
        </div>
      ),
    },
    { key: "orders", label: "Orders", align: "right", render: (row) => formatReportNumber(readAnalyticsValue(row, "OrderCount", 0)) },
    { key: "share", label: "Share", align: "right", render: (row) => formatReportPercent(readAnalyticsValue(row, "PercentageOfOrders", 0)) },
    { key: "cod", label: "COD amount", align: "right", render: (row) => formatReportCurrency(readAnalyticsValue(row, "CashOnDeliveryAmount", 0)) },
    { key: "fees", label: "Shipment fees", align: "right", render: (row) => formatReportCurrency(readAnalyticsValue(row, "TotalShipmentFees", 0)) },
    { key: "latest", label: "Latest order", render: (row) => formatReportDate(readAnalyticsValue(row, "LatestOrderDate")) },
  ];

  const vendorColumns = [
    { key: "vendor", label: "Vendor", render: (row) => <strong><Link className="analytics-table-link" to={packageDrilldownUrl({ vendorCode: readAnalyticsValue(row, "VendorCode", "") })}>{readAnalyticsValue(row, "VendorCode", "—")}</Link></strong> },
    { key: "orders", label: "Orders", align: "right", render: (row) => formatReportNumber(readAnalyticsValue(row, "TotalOrders", 0)) },
    { key: "delivered", label: "Delivered", align: "right", render: (row) => formatReportNumber(readAnalyticsValue(row, "DeliveredOrders", 0)) },
    { key: "rate", label: "Delivery rate", align: "right", render: (row) => formatReportPercent(readAnalyticsValue(row, "DeliveryRatePercentage", 0)) },
    { key: "fees", label: "Fees", align: "right", render: (row) => formatReportCurrency(readAnalyticsValue(row, "TotalShipmentFees", 0)) },
  ];

  const overdueColumns = [
    { key: "status", label: "Status", render: (row) => <Link className="analytics-table-link" to={packageDrilldownUrl({ statusName: readAnalyticsValue(row, "StatusName", "") })}>{readAnalyticsValue(row, "StatusName", "Unknown")}</Link> },
    { key: "orders", label: "Overdue", align: "right", render: (row) => <span className="analytics-warning-badge">{formatReportNumber(readAnalyticsValue(row, "OverdueOrders", 0))}</span> },
    { key: "average", label: "Average overdue", align: "right", render: (row) => `${formatReportNumber(Number(readAnalyticsValue(row, "AverageMinutesOverdue", 0)) / 60, 1)} hr` },
    { key: "maximum", label: "Maximum overdue", align: "right", render: (row) => `${formatReportNumber(Number(readAnalyticsValue(row, "MaximumMinutesOverdue", 0)) / 60, 1)} hr` },
  ];


  const slaStatusColumns = [
    {
      key: "status", label: "Status",
      render: (row) => (
        <div className="analytics-status-cell">
          <strong>{readAnalyticsValue(row, "StatusName", "Unknown")}</strong>
          <small>{readAnalyticsValue(row, "PhaseCode", "—")}</small>
        </div>
      ),
    },
    { key: "sla", label: "SLA", align: "right", render: (row) => formatHours(readAnalyticsValue(row, "SLAHours", 0)) },
    { key: "average", label: "Avg actual", align: "right", render: (row) => formatHours(readAnalyticsValue(row, "AverageActualHours", 0)) },
    { key: "events", label: "Events", align: "right", render: (row) => formatReportNumber(readAnalyticsValue(row, "TotalEvents", 0)) },
    { key: "within", label: "Within SLA", align: "right", render: (row) => formatReportNumber(readAnalyticsValue(row, "WithinSLA", 0)) },
    { key: "breached", label: "Breached", align: "right", render: (row) => <span className="analytics-warning-badge">{formatReportNumber(readAnalyticsValue(row, "BreachedSLA", 0))}</span> },
    { key: "compliance", label: "Compliance", align: "right", render: (row) => formatReportPercent(readAnalyticsValue(row, "SLACompliancePercentage", 0)) },
    { key: "over", label: "Avg over SLA", align: "right", render: (row) => formatHours(readAnalyticsValue(row, "AverageHoursOverSLA", 0)) },
  ];

  const slaRiskColumns = [
    { key: "order", label: "Order", render: (row) => <strong>{readAnalyticsValue(row, "OrderNO", "—")}</strong> },
    { key: "status", label: "Current status", render: (row) => readAnalyticsValue(row, "StatusName", "Unknown") },
    {
      key: "slaStatus", label: "SLA status",
      render: (row) => {
        const status = String(readAnalyticsValue(row, "SLAStatus", "ON_TRACK")).toUpperCase();
        const color = status === "BREACHED" ? "#b42318" : (status === "AT_RISK" || status === "WARNING") ? "#b54708" : "#027a48";
        return <strong style={{ color }}>{status}</strong>;
      },
    },
    { key: "elapsed", label: "Elapsed", align: "right", render: (row) => formatHours(readAnalyticsValue(row, "ActualHours", 0)) },
    { key: "sla", label: "SLA", align: "right", render: (row) => formatHours(readAnalyticsValue(row, "SLAHours", 0)) },
    {
      key: "remaining", label: "Remaining", align: "right",
      render: (row) => {
        const hours = Number(readAnalyticsValue(row, "HoursRemaining", 0));
        return <strong style={{ color: hours < 0 ? "#b42318" : undefined }}>{formatHours(hours)}</strong>;
      },
    },
    { key: "used", label: "SLA used", align: "right", render: (row) => formatReportPercent(readAnalyticsValue(row, "SLAPercentageUsed", 0)) },
    { key: "rider", label: "Rider", render: (row) => readAnalyticsValue(row, "RiderUserCode", "—") },
  ];

  const slaBreachedColumns = [
    { key: "order", label: "Order", render: (row) => <strong>{readAnalyticsValue(row, "OrderNO", "—")}</strong> },
    { key: "status", label: "Status", render: (row) => readAnalyticsValue(row, "StatusName", "Unknown") },
    { key: "vendor", label: "Vendor", render: (row) => readAnalyticsValue(row, "VendorCode", "—") },
    { key: "actual", label: "Actual", align: "right", render: (row) => formatHours(readAnalyticsValue(row, "ActualHours", 0)) },
    { key: "sla", label: "SLA", align: "right", render: (row) => formatHours(readAnalyticsValue(row, "SLAHours", 0)) },
    { key: "over", label: "Over SLA", align: "right", render: (row) => <span className="analytics-warning-badge">{formatHours(readAnalyticsValue(row, "HoursOverSLA", 0))}</span> },
    { key: "rider", label: "Rider", render: (row) => readAnalyticsValue(row, "RiderUserCode", "—") },
  ];

  const slaVendorColumns = [
    { key: "vendor", label: "Vendor", render: (row) => <strong>{readAnalyticsValue(row, "VendorCode", "—")}</strong> },
    { key: "events", label: "SLA events", align: "right", render: (row) => formatReportNumber(readAnalyticsValue(row, "TotalSLAEvents", 0)) },
    { key: "within", label: "Within", align: "right", render: (row) => formatReportNumber(readAnalyticsValue(row, "WithinSLA", 0)) },
    { key: "breached", label: "Breached", align: "right", render: (row) => formatReportNumber(readAnalyticsValue(row, "BreachedSLA", 0)) },
    { key: "compliance", label: "Compliance", align: "right", render: (row) => formatReportPercent(readAnalyticsValue(row, "SLACompliancePercentage", 0)) },
    { key: "average", label: "Avg actual", align: "right", render: (row) => formatHours(readAnalyticsValue(row, "AverageActualHours", 0)) },
  ];

  const exportStatusCsv = () =>
    downloadReportCsv(
      `shipment-order-status-report-${filters.startDate}-${filters.endDate}.csv`,
      [
        { label: "Status", value: (row) => readAnalyticsValue(row, "StatusName", "") },
        { label: "Phase", value: (row) => readAnalyticsValue(row, "PhaseCode", "") },
        { label: "Orders", value: (row) => readAnalyticsValue(row, "OrderCount", 0) },
        { label: "Percentage", value: (row) => readAnalyticsValue(row, "PercentageOfOrders", 0) },
        { label: "COD Amount", value: (row) => readAnalyticsValue(row, "CashOnDeliveryAmount", 0) },
        { label: "Shipment Fees", value: (row) => readAnalyticsValue(row, "TotalShipmentFees", 0) },
      ],
      sortedStatuses
    );

  return (
    <div className={`${scope === "vendor" ? "" : "content"} analytics-report-page`.trim()}>
      <AnalyticsReportHeader
        title={pageTitle || (scope === "admin" ? "Shipment Order Report" : `${scopeCode} Order Report`)}
        eyebrow={pageEyebrow}
        description={scope === "admin" ? "Understand order volume, delivery outcomes, financial exposure, and operational backlog." : `Order performance scoped to ${scope === "vendor" ? "vendor" : "distribution center"} ${scopeCode}.`}
        activeReport="orders"
        onRefresh={() => loadReport(filters)}
        refreshing={orderLoading}
        reportBasePath={reportBasePath}
      />

      <AnalyticsFilterPanel
        onApply={() => loadReport(filters)}
        onReset={handleReset}
        loading={orderLoading}
      >
        {scope !== "vendor" && (
          <AnalyticsField label="Vendor">
            <SSRSelect instanceId={`${scope}-order-report-vendor`} classNamePrefix="analytics-select" options={vendorOptions} value={vendorOptions.find((option) => option.value === filters.vendorCode) || null} onChange={(option) => updateFilter("vendorCode", option?.value || "")} placeholder="All vendors" isClearable />
          </AnalyticsField>
        )}
        {scope === "dc" ? (
          <AnalyticsField label="DC order direction">
            <SSRSelect instanceId="dc-order-report-direction" classNamePrefix="analytics-select" options={[{ value: "outbound", label: "Outbound from this DC" }, { value: "inbound", label: "Inbound to this DC" }]} value={{ value: filters.dcDirection, label: filters.dcDirection === "inbound" ? "Inbound to this DC" : "Outbound from this DC" }} onChange={(option) => updateDCDirection(option?.value || "outbound")} isClearable={false} />
          </AnalyticsField>
        ) : (
          <>
            <AnalyticsField label="Origin DC">
              <SSRSelect instanceId={`${scope}-order-report-origin`} classNamePrefix="analytics-select" options={dcOptions} value={dcOptions.find((option) => option.value === filters.originDCCode) || null} onChange={(option) => updateFilter("originDCCode", option?.value || "")} placeholder="All origins" isClearable />
            </AnalyticsField>
            <AnalyticsField label="Destination DC">
              <SSRSelect instanceId={`${scope}-order-report-destination`} classNamePrefix="analytics-select" options={dcOptions} value={dcOptions.find((option) => option.value === filters.destinationDCCode) || null} onChange={(option) => updateFilter("destinationDCCode", option?.value || "")} placeholder="All destinations" isClearable />
            </AnalyticsField>
          </>
        )}
        <AnalyticsField label="Delivery type">
          <SSRSelect instanceId="order-report-delivery" classNamePrefix="analytics-select" options={deliveryTypeOptions} value={deliveryTypeOptions.find((option) => option.value === filters.deliveryTypeCode) || null} onChange={(option) => updateFilter("deliveryTypeCode", option?.value || "")} placeholder="All types" isClearable />
        </AnalyticsField>
        <AnalyticsField label="Status">
          <SSRSelect instanceId="order-report-status" classNamePrefix="analytics-select" options={statusOptions} value={statusOptions.find((option) => option.value === filters.statusID) || null} onChange={(option) => updateFilter("statusID", option?.value || "")} placeholder="All statuses" isClearable />
        </AnalyticsField>
        <AnalyticsField label="Start date">
          <AnalyticsDatePicker value={filters.startDate} maxDate={filters.endDate} placeholder="Select start date" onChange={(value) => updateFilter("startDate", value)} />
        </AnalyticsField>
        <AnalyticsField label="End date">
          <AnalyticsDatePicker value={filters.endDate} minDate={filters.startDate} placeholder="Select end date" onChange={(value) => updateFilter("endDate", value)} />
        </AnalyticsField>
      </AnalyticsFilterPanel>

      {orderLoading && !shipmentOrderAnalytics ? (
        <AnalyticsLoadingState />
      ) : orderError ? (
        <AnalyticsErrorState message={orderError} onRetry={() => loadReport(filters)} />
      ) : (
        <>
          <div className="analytics-metric-grid">
            <AnalyticsMetricCard label="Total orders" value={formatReportNumber(readAnalyticsValue(summary, "TotalOrders", 0))} helper={`${formatReportNumber(readAnalyticsValue(summary, "ActiveOrders", 0))} currently active`} icon={Package} tone="orange" to={packageDrilldownUrl()} />
            <AnalyticsMetricCard label="Delivered" value={formatReportNumber(readAnalyticsValue(summary, "DeliveredOrders", 0))} helper={`${formatReportPercent(readAnalyticsValue(summary, "DeliveryRatePercentage", 0))} delivery rate`} icon={CheckCircle} tone="green" to={packageDrilldownUrl({ statusName: PACKAGE_STATUSES.DELIVERED_TO_CUSTOMER.statusName, searchTerm: "" })} />
            <AnalyticsMetricCard label="Out for delivery" value={formatReportNumber(readAnalyticsValue(summary, "OutForDeliveryOrders", 0))} helper="Orders with riders" icon={Truck} tone="blue" to={packageDrilldownUrl({ statusName: PACKAGE_STATUSES.OUT_FOR_DELIVERY.statusName, searchTerm: "" })} />
            <AnalyticsMetricCard label="Failed orders" value={formatReportNumber(readAnalyticsValue(summary, "FailedOrders", 0))} helper={`${formatReportPercent(readAnalyticsValue(summary, "FailureRatePercentage", 0))} failure rate`} icon={RotateCcw} tone="red" to={packageDrilldownUrl({ statusName: "", searchTerm: "Failed" })} />
            <AnalyticsMetricCard label="Shipment fees" value={formatReportCurrency(readAnalyticsValue(summary, "TotalShipmentFees", 0))} helper="Gross shipment fees" icon={DollarSign} tone="purple" to={packageDrilldownUrl()} />
            <AnalyticsMetricCard label="COD exposure" value={formatReportCurrency(readAnalyticsValue(summary, "CashOnDeliveryAmount", 0))} helper={`${formatReportNumber(readAnalyticsValue(summary, "CashOnDeliveryOrders", 0))} COD orders`} icon={Activity} tone="slate" />
          </div>

          <AnalyticsSection
            title="SLA performance"
            description="Service-level performance calculated from shipment tracking event timestamps."
          >
            <div className="analytics-metric-grid">
              <AnalyticsMetricCard
                label="SLA compliance"
                value={formatReportPercent(readAnalyticsValue(slaSummary, "SLACompliancePercentage", 0))}
                helper={`${formatReportNumber(readAnalyticsValue(slaSummary, "WithinSLAEvents", 0))} events within SLA`}
                icon={Target}
                tone="green"
              />
              <AnalyticsMetricCard
                label="SLA breaches"
                value={formatReportNumber(readAnalyticsValue(slaSummary, "BreachedSLAEvents", 0))}
                helper={`${formatReportNumber(readAnalyticsValue(slaSummary, "TotalSLAEvents", 0))} measured events`}
                icon={AlertTriangle}
                tone="red"
              />
              <AnalyticsMetricCard
                label="Average time"
                value={formatHours(readAnalyticsValue(slaSummary, "AverageActualHours", 0))}
                helper="Average status handling time"
                icon={Clock}
                tone="blue"
              />
              <AnalyticsMetricCard
                label="Maximum time"
                value={formatHours(readAnalyticsValue(slaSummary, "MaximumActualHours", 0))}
                helper="Longest status duration"
                icon={Activity}
                tone="purple"
              />
              <AnalyticsMetricCard
                label="Time over SLA"
                value={formatHours(readAnalyticsValue(slaSummary, "TotalHoursOverSLA", 0))}
                helper="Cumulative breached time"
                icon={RotateCcw}
                tone="orange"
              />
              <AnalyticsMetricCard
                label="Current SLA risk"
                value={formatReportNumber(
                  currentSLARisk.filter((item) => {
                    const status = String(readAnalyticsValue(item, "SLAStatus", "")).toUpperCase();
                    return status === "AT_RISK" || status === "BREACHED";
                  }).length
                )}
                helper="At risk or breached now"
                icon={Truck}
                tone="slate"
              />
            </div>
          </AnalyticsSection>

          <div className="analytics-report-grid">
            <AnalyticsSection title="Daily order trend" description="Created, delivered, and failed orders across the selected period.">
              {dailyTrend.length ? <Chart options={trendChart.options} series={trendChart.series} type="area" height={310} /> : <AnalyticsChartEmpty />}
            </AnalyticsSection>
            <AnalyticsSection title="Status distribution" description="The eight statuses carrying the most orders.">
              {statusChart.series.length ? <Chart options={statusChart.options} series={statusChart.series} type="donut" height={310} /> : <AnalyticsChartEmpty />}
            </AnalyticsSection>
          </div>

          <AnalyticsSection title="Order status detail" description="Volume, financial value, and recency for every reported status." action={<AnalyticsCsvButton onClick={exportStatusCsv} disabled={!sortedStatuses.length} />}>
            <AnalyticsTable columns={statusColumns} rows={sortedStatuses} rowKey={(row) => readAnalyticsValue(row, "StatusID")} />
          </AnalyticsSection>

          <div className="analytics-report-grid equal analytics-equal-height-grid">
            <AnalyticsSection title="Order aging" description="How long open orders have remained in the network.">
              {agingAnalytics.length ? (
                <div className="analytics-fill-chart">
                  <Chart options={agingChart.options} series={agingChart.series} type="bar" height="100%" />
                </div>
              ) : <AnalyticsChartEmpty />}
            </AnalyticsSection>
            <AnalyticsSection title="Overdue workload" description="Statuses with orders beyond their delivery ETA.">
              <AnalyticsTable columns={overdueColumns} rows={overdueAnalytics} rowKey={(row) => readAnalyticsValue(row, "StatusID")} />
            </AnalyticsSection>
          </div>


          <AnalyticsSection
            title="SLA by status"
            description="Configured SLA compared with actual time spent in each shipment status."
          >
            <AnalyticsTable
              columns={slaStatusColumns}
              rows={slaByStatus}
              rowKey={(row) => readAnalyticsValue(row, "OrderStatusID")}
            />
          </AnalyticsSection>

          <AnalyticsSection
            title="Current SLA risk"
            description="Active orders approaching or exceeding the configured SLA."
          >
            <AnalyticsTable
              columns={slaRiskColumns}
              rows={[...currentSLARisk].sort(
                (a, b) =>
                  Number(readAnalyticsValue(b, "SLAPercentageUsed", 0)) -
                  Number(readAnalyticsValue(a, "SLAPercentageUsed", 0))
              )}
              rowKey={(row) =>
                `${readAnalyticsValue(row, "OrderNO", "")}-${readAnalyticsValue(row, "OrderStatusID", "")}`
              }
            />
          </AnalyticsSection>

          <AnalyticsSection
            title="SLA breached orders"
            description="Orders that exceeded the configured SLA while passing through a shipment status."
          >
            <AnalyticsTable
              columns={slaBreachedColumns}
              rows={slaBreachedOrders}
              rowKey={(row, index) =>
                `${readAnalyticsValue(row, "OrderNO", "")}-${readAnalyticsValue(row, "OrderStatusID", "")}-${index}`
              }
            />
          </AnalyticsSection>

          {scope === "admin" && (
            <AnalyticsSection
              title="Vendor SLA performance"
              description="SLA compliance and average handling time by vendor."
            >
              <AnalyticsTable
                columns={slaVendorColumns}
                rows={[...slaByVendor].sort(
                  (a, b) =>
                    Number(readAnalyticsValue(a, "SLACompliancePercentage", 0)) -
                    Number(readAnalyticsValue(b, "SLACompliancePercentage", 0))
                )}
                rowKey={(row) => readAnalyticsValue(row, "VendorCode")}
              />
            </AnalyticsSection>
          )}

          <AnalyticsSection title="Vendor performance" description="Highest-volume vendors in the selected report scope.">
            <AnalyticsTable columns={vendorColumns} rows={[...vendorAnalytics].sort((a, b) => Number(readAnalyticsValue(b, "TotalOrders", 0)) - Number(readAnalyticsValue(a, "TotalOrders", 0)))} rowKey={(row) => readAnalyticsValue(row, "VendorCode")} />
          </AnalyticsSection>
        </>
      )}
    </div>
  );
};

export default ShipmentOrderReport;
