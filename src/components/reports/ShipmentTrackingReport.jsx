"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Form } from "react-bootstrap";
import {
  AlertTriangle,
  Clock,
  MapPin,
  Package,
  Users,
  Zap,
} from "feather-icons-react";
import SSRSelect from "@/components/SSRSelect";
import Link from "@/components/Link";
import Chart from "@/components/ClientChart";
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
  formatMinutes,
  formatReportDate,
  formatReportNumber,
  getDefaultReportDates,
  readAnalyticsArray,
  readAnalyticsValue,
  toReportDateTime,
} from "@/utils/analyticsReportUtils";
import "@/style/css/analytics-reports.css";

const createInitialFilters = ({ vendorCode = "", locationCode = "" } = {}) => ({
  vendorCode,
  orderNO: "",
  locationCode,
  userCode: "",
  statusID: "",
  deliveryTypeCode: "",
  stuckHours: 24,
  ...getDefaultReportDates(),
});

const toRequestParams = (filters) => ({
  vendorCode: filters.vendorCode || undefined,
  orderNO: filters.orderNO.trim() || undefined,
  locationCode: filters.locationCode || undefined,
  userCode: filters.userCode || undefined,
  statusID: filters.statusID || undefined,
  deliveryTypeCode: filters.deliveryTypeCode || undefined,
  startDate: toReportDateTime(filters.startDate),
  endDate: toReportDateTime(filters.endDate, true),
  stuckHours: Math.max(Number(filters.stuckHours) || 24, 1),
});

export const ShipmentTrackingReport = ({
  scope = "admin",
  scopeCode = "",
  reportBasePath = "/admin/reports",
  packageListPath = "/admin/packages",
}) => {
  const scopeDefaults = useMemo(() => ({
    vendorCode: scope === "vendor" ? scopeCode : "",
    locationCode: scope === "dc" ? scopeCode : "",
  }), [scope, scopeCode]);
  const [filters, setFilters] = useState(() => createInitialFilters(scopeDefaults));
  const {
    shipmentTrackingAnalytics,
    trackingLoading,
    trackingError,
    fetchShipmentTrackingAnalytics,
  } = useAnalytics();
  const {
    vendorOptions,
    dcOptions,
    deliveryTypeOptions,
    statusOptions,
    userOptions,
  } = useAnalyticsFilterOptions({ includeUsers: true });

  const loadReport = useCallback(
    async (nextFilters) => {
      try {
        await fetchShipmentTrackingAnalytics(toRequestParams(nextFilters));
      } catch {
        // The hook exposes the report error to the page state.
      }
    },
    [fetchShipmentTrackingAnalytics]
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

  const summary = readAnalyticsValue(shipmentTrackingAnalytics, "Summary", {});
  const dailyTrend = readAnalyticsArray(shipmentTrackingAnalytics, "DailyTrend");
  const statusDurations = readAnalyticsArray(shipmentTrackingAnalytics, "StatusDurations");
  const statusTransitions = readAnalyticsArray(shipmentTrackingAnalytics, "StatusTransitions");
  const stuckOrders = readAnalyticsArray(shipmentTrackingAnalytics, "StuckOrders");
  const selectedStatusName = statusOptions.find(
    (option) => Number(option.value) === Number(filters.statusID)
  )?.label || "";
  const packageDrilldownUrl = (overrides = {}) => buildAdminPackagesUrl(
    { ...filters, statusName: selectedStatusName },
    overrides,
    packageListPath
  );
  const locationsDrilldown = scope === "admin"
    ? "/admin/distribution-centers"
    : scope === "dc" ? "#daily-tracking-activity" : undefined;
  const usersDrilldown = scope === "admin"
    ? "/admin/users"
    : scope === "vendor" ? "/vendor/vendor-users" : "/dc/dc-couriers";
  const latestEvents = readAnalyticsArray(shipmentTrackingAnalytics, "LatestOrderEvents");
  const userActivity = readAnalyticsArray(shipmentTrackingAnalytics, "UserActivity");
  const orderJourney = readAnalyticsArray(shipmentTrackingAnalytics, "OrderJourney");

  const sortedDurations = useMemo(
    () =>
      [...statusDurations]
        .sort(
          (a, b) =>
            Number(readAnalyticsValue(b, "AverageMinutesAtStatus", 0)) -
            Number(readAnalyticsValue(a, "AverageMinutesAtStatus", 0))
        )
        .slice(0, 10),
    [statusDurations]
  );

  const trendChart = useMemo(
    () => ({
      series: [
        {
          name: "Tracking events",
          data: dailyTrend.map((item) => Number(readAnalyticsValue(item, "TotalEvents", 0))),
        },
        {
          name: "Unique orders",
          data: dailyTrend.map((item) => Number(readAnalyticsValue(item, "UniqueOrders", 0))),
        },
        {
          name: "Failure events",
          data: dailyTrend.map((item) => Number(readAnalyticsValue(item, "FailureEvents", 0))),
        },
      ],
      options: {
        chart: { toolbar: { show: false }, zoom: { enabled: false } },
        colors: ["#f26a26", "#175cd3", "#f04438"],
        dataLabels: { enabled: false },
        stroke: { curve: "smooth", width: 2.5 },
        fill: {
          type: "gradient",
          gradient: { opacityFrom: 0.28, opacityTo: 0.03, stops: [0, 95] },
        },
        grid: { borderColor: "#eef1f5", strokeDashArray: 4 },
        xaxis: {
          categories: dailyTrend.map((item) =>
            formatReportDate(readAnalyticsValue(item, "EventDate"))
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

  const durationChart = useMemo(
    () => ({
      series: [
        {
          name: "Average hours",
          data: sortedDurations.map(
            (item) => Number(readAnalyticsValue(item, "AverageMinutesAtStatus", 0)) / 60
          ),
        },
      ],
      options: {
        chart: { toolbar: { show: false } },
        colors: ["#f26a26"],
        dataLabels: { enabled: false },
        grid: { borderColor: "#eef1f5", strokeDashArray: 4 },
        plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "55%" } },
        xaxis: {
          categories: sortedDurations.map((item) =>
            readAnalyticsValue(item, "StatusName", "Unknown")
          ),
          labels: { formatter: (value) => `${formatReportNumber(value, 1)}h` },
        },
        yaxis: { labels: { maxWidth: 140, style: { colors: "#667085", fontSize: "11px" } } },
        tooltip: { y: { formatter: (value) => `${formatReportNumber(value, 1)} hours` } },
      },
    }),
    [sortedDurations]
  );

  const stuckColumns = [
    {
      key: "order",
      label: "Order",
      render: (row) => (
        <div className="analytics-status-cell">
          <strong><Link className="analytics-table-link" to={packageDrilldownUrl({ searchTerm: readAnalyticsValue(row, "OrderNO", ""), statusName: "" })}>{readAnalyticsValue(row, "OrderNO", "—")}</Link></strong>
          <small>{readAnalyticsValue(row, "VendorCode", "—")}</small>
        </div>
      ),
    },
    { key: "status", label: "Current status", render: (row) => readAnalyticsValue(row, "StatusName", "Unknown") },
    { key: "location", label: "Location", render: (row) => readAnalyticsValue(row, "LocationCode", "—") || "—" },
    { key: "last", label: "Last movement", render: (row) => formatReportDate(readAnalyticsValue(row, "LatestEventDate"), true) },
    { key: "hours", label: "Without movement", align: "right", render: (row) => <span className="analytics-warning-badge">{formatReportNumber(readAnalyticsValue(row, "HoursWithoutMovement", 0))} hr</span> },
    { key: "eta", label: "Delivery ETA", render: (row) => formatReportDate(readAnalyticsValue(row, "DeliveryETA"), true) },
    { key: "overdue", label: "ETA state", render: (row) => readAnalyticsValue(row, "IsDeliveryOverdue", false) ? <span className="analytics-danger-badge">Overdue</span> : <span className="analytics-neutral-badge">Within ETA</span> },
  ];

  const transitionColumns = [
    { key: "from", label: "From status", render: (row) => readAnalyticsValue(row, "FromStatusName", "Unknown") },
    { key: "to", label: "To status", render: (row) => readAnalyticsValue(row, "ToStatusName", "Unknown") },
    { key: "count", label: "Transitions", align: "right", render: (row) => formatReportNumber(readAnalyticsValue(row, "TransitionCount", 0)) },
    { key: "orders", label: "Unique orders", align: "right", render: (row) => formatReportNumber(readAnalyticsValue(row, "UniqueOrderCount", 0)) },
    { key: "average", label: "Average time", align: "right", render: (row) => formatMinutes(readAnalyticsValue(row, "AverageTransitionMinutes", 0)) },
    { key: "maximum", label: "Maximum time", align: "right", render: (row) => formatMinutes(Number(readAnalyticsValue(row, "MaximumTransitionSeconds", 0)) / 60) },
  ];

  const latestEventColumns = [
    { key: "order", label: "Order", render: (row) => <strong><Link className="analytics-table-link" to={packageDrilldownUrl({ searchTerm: readAnalyticsValue(row, "OrderNO", ""), statusName: "" })}>{readAnalyticsValue(row, "OrderNO", "—")}</Link></strong> },
    { key: "status", label: "Latest status", render: (row) => readAnalyticsValue(row, "StatusName", "Unknown") },
    { key: "location", label: "Location", render: (row) => readAnalyticsValue(row, "LocationCode", "—") || "—" },
    { key: "user", label: "Updated by", render: (row) => readAnalyticsValue(row, "UserCode", "—") || "—" },
    { key: "date", label: "Latest event", render: (row) => formatReportDate(readAnalyticsValue(row, "LatestEventDate"), true) },
    { key: "elapsed", label: "Time since event", align: "right", render: (row) => formatMinutes(readAnalyticsValue(row, "MinutesSinceLatestEvent", 0)) },
  ];

  const activityColumns = [
    { key: "user", label: "User", render: (row) => <strong>{readAnalyticsValue(row, "UserCode", "—")}</strong> },
    { key: "events", label: "Events", align: "right", render: (row) => formatReportNumber(readAnalyticsValue(row, "TotalEvents", 0)) },
    { key: "orders", label: "Orders handled", align: "right", render: (row) => formatReportNumber(readAnalyticsValue(row, "UniqueOrdersHandled", 0)) },
    { key: "statuses", label: "Statuses", align: "right", render: (row) => formatReportNumber(readAnalyticsValue(row, "StatusesProcessed", 0)) },
    { key: "locations", label: "Locations", align: "right", render: (row) => formatReportNumber(readAnalyticsValue(row, "LocationsWorked", 0)) },
    { key: "latest", label: "Latest activity", render: (row) => formatReportDate(readAnalyticsValue(row, "LatestActivityDate"), true) },
  ];

  const journeyColumns = [
    { key: "date", label: "Event date", render: (row) => formatReportDate(readAnalyticsValue(row, "EventDate"), true) },
    { key: "status", label: "Status", render: (row) => readAnalyticsValue(row, "StatusName", "Unknown") },
    { key: "location", label: "Location", render: (row) => readAnalyticsValue(row, "LocationCode", "—") || "—" },
    { key: "user", label: "User", render: (row) => readAnalyticsValue(row, "UserCode", "—") || "—" },
    { key: "elapsed", label: "Since previous", align: "right", render: (row) => formatMinutes(Number(readAnalyticsValue(row, "SecondsSincePreviousEvent", 0)) / 60) },
    { key: "remarks", label: "Remarks", render: (row) => readAnalyticsValue(row, "Remarks", "—") || "—" },
  ];

  const exportStuckCsv = () =>
    downloadReportCsv(
      `stuck-shipment-report-${filters.startDate}-${filters.endDate}.csv`,
      [
        { label: "Order NO", value: (row) => readAnalyticsValue(row, "OrderNO", "") },
        { label: "Vendor", value: (row) => readAnalyticsValue(row, "VendorCode", "") },
        { label: "Status", value: (row) => readAnalyticsValue(row, "StatusName", "") },
        { label: "Location", value: (row) => readAnalyticsValue(row, "LocationCode", "") },
        { label: "Hours Without Movement", value: (row) => readAnalyticsValue(row, "HoursWithoutMovement", 0) },
        { label: "Delivery Overdue", value: (row) => readAnalyticsValue(row, "IsDeliveryOverdue", false) ? "Yes" : "No" },
      ],
      stuckOrders
    );

  return (
    <div className={`${scope === "vendor" ? "" : "content"} analytics-report-page`.trim()}>
      <AnalyticsReportHeader
        title={scope === "admin" ? "Shipment Tracking Report" : `${scopeCode} Tracking Report`}
        description={scope === "admin" ? "Find stalled shipments, slow transitions, movement gaps, and the people handling each event." : `Tracking performance scoped to ${scope === "vendor" ? "vendor" : "distribution center"} ${scopeCode}.`}
        activeReport="tracking"
        onRefresh={() => loadReport(filters)}
        refreshing={trackingLoading}
        reportBasePath={reportBasePath}
      />

      <AnalyticsFilterPanel onApply={() => loadReport(filters)} onReset={handleReset} loading={trackingLoading}>
        {scope !== "vendor" && (
          <AnalyticsField label="Vendor">
            <SSRSelect instanceId={`${scope}-tracking-report-vendor`} classNamePrefix="analytics-select" options={vendorOptions} value={vendorOptions.find((option) => option.value === filters.vendorCode) || null} onChange={(option) => updateFilter("vendorCode", option?.value || "")} placeholder="All vendors" isClearable />
          </AnalyticsField>
        )}
        <AnalyticsField label="Order number">
          <Form.Control value={filters.orderNO} onChange={(event) => updateFilter("orderNO", event.target.value)} placeholder="e.g. PCK-..." />
        </AnalyticsField>
        {scope !== "dc" && (
          <AnalyticsField label="Location">
            <SSRSelect instanceId={`${scope}-tracking-report-location`} classNamePrefix="analytics-select" options={dcOptions} value={dcOptions.find((option) => option.value === filters.locationCode) || null} onChange={(option) => updateFilter("locationCode", option?.value || "")} placeholder="All locations" isClearable />
          </AnalyticsField>
        )}
        <AnalyticsField label="User">
          <SSRSelect instanceId="tracking-report-user" classNamePrefix="analytics-select" options={userOptions} value={userOptions.find((option) => option.value === filters.userCode) || null} onChange={(option) => updateFilter("userCode", option?.value || "")} placeholder="All users" isClearable />
        </AnalyticsField>
        <AnalyticsField label="Status">
          <SSRSelect instanceId="tracking-report-status" classNamePrefix="analytics-select" options={statusOptions} value={statusOptions.find((option) => option.value === filters.statusID) || null} onChange={(option) => updateFilter("statusID", option?.value || "")} placeholder="All statuses" isClearable />
        </AnalyticsField>
        <AnalyticsField label="Delivery type">
          <SSRSelect instanceId="tracking-report-delivery" classNamePrefix="analytics-select" options={deliveryTypeOptions} value={deliveryTypeOptions.find((option) => option.value === filters.deliveryTypeCode) || null} onChange={(option) => updateFilter("deliveryTypeCode", option?.value || "")} placeholder="All types" isClearable />
        </AnalyticsField>
        <AnalyticsField label="Start date">
          <AnalyticsDatePicker value={filters.startDate} maxDate={filters.endDate} placeholder="Select start date" onChange={(value) => updateFilter("startDate", value)} />
        </AnalyticsField>
        <AnalyticsField label="End date">
          <AnalyticsDatePicker value={filters.endDate} minDate={filters.startDate} placeholder="Select end date" onChange={(value) => updateFilter("endDate", value)} />
        </AnalyticsField>
        <AnalyticsField label="Stuck threshold (hours)">
          <Form.Control type="number" min="1" max="720" value={filters.stuckHours} onChange={(event) => updateFilter("stuckHours", event.target.value)} />
        </AnalyticsField>
      </AnalyticsFilterPanel>

      {trackingLoading && !shipmentTrackingAnalytics ? (
        <AnalyticsLoadingState />
      ) : trackingError ? (
        <AnalyticsErrorState message={trackingError} onRetry={() => loadReport(filters)} />
      ) : (
        <>
          <div className="analytics-metric-grid">
            <AnalyticsMetricCard label="Tracking events" value={formatReportNumber(readAnalyticsValue(summary, "TotalTrackingEvents", 0))} helper={`${formatReportNumber(readAnalyticsValue(summary, "AverageEventsPerOrder", 0), 1)} events per order`} icon={Zap} tone="orange" to="#daily-tracking-activity" />
            <AnalyticsMetricCard label="Tracked orders" value={formatReportNumber(readAnalyticsValue(summary, "TotalTrackedOrders", 0))} helper={`${formatReportNumber(readAnalyticsValue(summary, "TotalStatusesPassed", 0))} statuses represented`} icon={Package} tone="blue" to={packageDrilldownUrl()} />
            <AnalyticsMetricCard label="Locations visited" value={formatReportNumber(readAnalyticsValue(summary, "TotalLocationsVisited", 0))} helper={`${formatReportNumber(readAnalyticsValue(summary, "EventsWithoutLocation", 0))} events missing location`} icon={MapPin} tone="purple" to={locationsDrilldown} />
            <AnalyticsMetricCard label="Users involved" value={formatReportNumber(readAnalyticsValue(summary, "TotalUsersInvolved", 0))} helper={`${formatReportNumber(readAnalyticsValue(summary, "EventsWithoutUser", 0))} events missing user`} icon={Users} tone="slate" to={usersDrilldown} />
            <AnalyticsMetricCard label="Failure events" value={formatReportNumber(readAnalyticsValue(summary, "FailureEvents", 0))} helper={`${formatReportNumber(readAnalyticsValue(summary, "TerminalEvents", 0))} terminal events`} icon={AlertTriangle} tone="red" to="#status-transition-performance" />
            <AnalyticsMetricCard label="Stuck orders" value={formatReportNumber(stuckOrders.length)} helper={`No movement for ${Math.max(Number(filters.stuckHours) || 24, 1)}+ hours`} icon={Clock} tone="orange" to="#stuck-shipments" />
          </div>

          <div className="analytics-report-grid">
            <AnalyticsSection id="daily-tracking-activity" title="Daily tracking activity" description="Event volume, unique orders, and failure activity over time.">
              {dailyTrend.length ? <Chart options={trendChart.options} series={trendChart.series} type="area" height={310} /> : <AnalyticsChartEmpty />}
            </AnalyticsSection>
            <AnalyticsSection title="Slowest statuses" description="Average time orders spend at each status.">
              {sortedDurations.length ? <Chart options={durationChart.options} series={durationChart.series} type="bar" height={310} /> : <AnalyticsChartEmpty />}
            </AnalyticsSection>
          </div>

          <AnalyticsSection id="stuck-shipments" title="Stuck shipments" description={`Orders without a tracking movement for at least ${Math.max(Number(filters.stuckHours) || 24, 1)} hours.`} action={<AnalyticsCsvButton onClick={exportStuckCsv} disabled={!stuckOrders.length} />}>
            <AnalyticsTable columns={stuckColumns} rows={stuckOrders} rowKey={(row) => readAnalyticsValue(row, "OrderNO")} emptyText="No stuck orders were found for this threshold and filter set." />
          </AnalyticsSection>

          {filters.orderNO.trim() && (
            <AnalyticsSection title={`Journey for ${filters.orderNO.trim()}`} description="The complete chronological tracking history returned for this order.">
              <AnalyticsTable columns={journeyColumns} rows={orderJourney} rowKey={(row) => readAnalyticsValue(row, "ShipmentTrackingEventID")} emptyText="No journey events were returned for this order." />
            </AnalyticsSection>
          )}

          <AnalyticsSection id="status-transition-performance" title="Status transition performance" description="How often transitions occur and how long they take.">
            <AnalyticsTable columns={transitionColumns} rows={[...statusTransitions].sort((a, b) => Number(readAnalyticsValue(b, "TransitionCount", 0)) - Number(readAnalyticsValue(a, "TransitionCount", 0)))} rowKey={(row) => `${readAnalyticsValue(row, "FromStatusID")}-${readAnalyticsValue(row, "ToStatusID")}`} />
          </AnalyticsSection>

          <div className="analytics-report-grid equal">
            <AnalyticsSection title="Latest order events" description="Most recent known state for tracked orders.">
              <AnalyticsTable columns={latestEventColumns} rows={latestEvents} rowKey={(row) => readAnalyticsValue(row, "OrderNO")} />
            </AnalyticsSection>
            <AnalyticsSection title="User activity" description="Users producing the most tracking updates.">
              <AnalyticsTable columns={activityColumns} rows={[...userActivity].sort((a, b) => Number(readAnalyticsValue(b, "TotalEvents", 0)) - Number(readAnalyticsValue(a, "TotalEvents", 0)))} rowKey={(row) => readAnalyticsValue(row, "UserCode")} />
            </AnalyticsSection>
          </div>
        </>
      )}
    </div>
  );
};

export default ShipmentTrackingReport;
