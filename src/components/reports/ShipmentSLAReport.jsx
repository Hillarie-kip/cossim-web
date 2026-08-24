"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Clock,
  RotateCcw,
  Target,
  Truck,
} from "feather-icons-react";

import SSRSelect from "@/components/SSRSelect";
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
  formatReportDate,
  formatReportNumber,
  formatReportPercent,
  getDefaultReportDates,
  readAnalyticsArray,
  readAnalyticsValue,
  toReportDateTime,
} from "@/utils/analyticsReportUtils";

import "@/style/css/analytics-reports.css";

const createInitialFilters = ({
  vendorCode = "",
  dcCode = "",
  dcDirection = "outbound",
} = {}) => ({
  vendorCode,

  originDCCode:
    dcCode && dcDirection === "outbound"
      ? dcCode
      : "",

  destinationDCCode:
    dcCode && dcDirection === "inbound"
      ? dcCode
      : "",

  dcDirection,
  deliveryTypeCode: "",
  statusID: "",

  ...getDefaultReportDates(),
});

const toRequestParams = (filters) => ({
  vendorCode:
    filters.vendorCode || undefined,

  originDCCode:
    filters.originDCCode || undefined,

  destinationDCCode:
    filters.destinationDCCode || undefined,

  deliveryTypeCode:
    filters.deliveryTypeCode || undefined,

  statusID:
    filters.statusID || undefined,

  startDate:
    toReportDateTime(
      filters.startDate
    ),

  endDate:
    toReportDateTime(
      filters.endDate,
      true
    ),
});

const formatHours = (
  value,
  digits = 1
) =>
  `${formatReportNumber(
    Number(value || 0),
    digits
  )} hr`;

export const ShipmentSLAReport = ({
  scope = "admin",
  scopeCode = "",
  reportBasePath = "/admin/reports",
  pageTitle,
  pageEyebrow,
}) => {

  const scopeDefaults =
    useMemo(
      () => ({
        vendorCode:
          scope === "vendor"
            ? scopeCode
            : "",

        dcCode:
          scope === "dc"
            ? scopeCode
            : "",
      }),
      [
        scope,
        scopeCode,
      ]
    );

  const [
    filters,
    setFilters,
  ] = useState(() =>
    createInitialFilters(
      scopeDefaults
    )
  );

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
  } =
    useAnalyticsFilterOptions();

  /*
   * -------------------------------------------------------
   * LOAD REPORT
   * -------------------------------------------------------
   */

  const loadReport =
    useCallback(
      async (
        nextFilters
      ) => {
        try {
          await fetchShipmentOrderAnalytics(
            toRequestParams(
              nextFilters
            )
          );
        } catch {
          // Error exposed by useAnalytics()
        }
      },
      [
        fetchShipmentOrderAnalytics,
      ]
    );

  useEffect(() => {
    loadReport(
      createInitialFilters(
        scopeDefaults
      )
    );
  }, [
    loadReport,
    scopeDefaults,
  ]);

  /*
   * -------------------------------------------------------
   * FILTER HELPERS
   * -------------------------------------------------------
   */

  const updateFilter = (
    key,
    value
  ) => {
    setFilters(
      (current) => ({
        ...current,
        [key]: value,
      })
    );
  };

  const handleReset =
    () => {
      const resetFilters =
        createInitialFilters(
          scopeDefaults
        );

      setFilters(
        resetFilters
      );

      loadReport(
        resetFilters
      );
    };

  const updateDCDirection =
    (direction) => {

      setFilters(
        (current) => ({
          ...current,

          dcDirection:
            direction,

          originDCCode:
            direction ===
            "outbound"
              ? scopeCode
              : "",

          destinationDCCode:
            direction ===
            "inbound"
              ? scopeCode
              : "",
        })
      );
    };

  /*
   * -------------------------------------------------------
   * SLA RESULT SETS
   * -------------------------------------------------------
   */

  const slaSummary =
    readAnalyticsValue(
      shipmentOrderAnalytics,
      "SLASummary",
      {}
    );

  const slaByStatus =
    readAnalyticsArray(
      shipmentOrderAnalytics,
      "SLAByStatus"
    );

  const slaBreachedOrders =
    readAnalyticsArray(
      shipmentOrderAnalytics,
      "SLABreachedOrders"
    );

  const slaByPhase =
    readAnalyticsArray(
      shipmentOrderAnalytics,
      "SLAByPhase"
    );

  const currentSLARisk =
    readAnalyticsArray(
      shipmentOrderAnalytics,
      "CurrentSLARisk"
    );

  const slaByVendor =
    readAnalyticsArray(
      shipmentOrderAnalytics,
      "SLAByVendor"
    );

  const slaDailyTrend =
    readAnalyticsArray(
      shipmentOrderAnalytics,
      "SLADailyTrend"
    );

  /*
   * -------------------------------------------------------
   * CURRENT RISK COUNTER
   * -------------------------------------------------------
   */

  const atRiskCount =
    useMemo(
      () =>
        currentSLARisk.filter(
          (item) => {

            const status =
              String(
                readAnalyticsValue(
                  item,
                  "SLAStatus",
                  ""
                )
              ).toUpperCase();

            return (
              status === "AT_RISK" ||
              status === "BREACHED"
            );
          }
        ).length,
      [
        currentSLARisk,
      ]
    );

  /*
   * -------------------------------------------------------
   * SORT SLA STATUS
   *
   * Lowest compliance first.
   * -------------------------------------------------------
   */

  const sortedSLAStatus =
    useMemo(
      () =>
        [
          ...slaByStatus,
        ].sort(
          (
            a,
            b
          ) =>
            Number(
              readAnalyticsValue(
                a,
                "SLACompliancePercentage",
                0
              )
            ) -
            Number(
              readAnalyticsValue(
                b,
                "SLACompliancePercentage",
                0
              )
            )
        ),
      [
        slaByStatus,
      ]
    );

  /*
   * -------------------------------------------------------
   * SORT CURRENT SLA RISK
   *
   * Highest percentage used first.
   * -------------------------------------------------------
   */

  const sortedSLARisk =
    useMemo(
      () =>
        [
          ...currentSLARisk,
        ].sort(
          (
            a,
            b
          ) =>
            Number(
              readAnalyticsValue(
                b,
                "SLAPercentageUsed",
                0
              )
            ) -
            Number(
              readAnalyticsValue(
                a,
                "SLAPercentageUsed",
                0
              )
            )
        ),
      [
        currentSLARisk,
      ]
    );

  /*
   * -------------------------------------------------------
   * DAILY SLA TREND CHART
   * -------------------------------------------------------
   */

  const trendChart =
    useMemo(
      () => ({
        series: [
          {
            name:
              "SLA compliance",

            data:
              slaDailyTrend.map(
                (
                  item
                ) =>
                  Number(
                    readAnalyticsValue(
                      item,
                      "SLACompliancePercentage",
                      0
                    )
                  )
              ),
          },
        ],

        options: {

          chart: {
            toolbar: {
              show: false,
            },

            zoom: {
              enabled: false,
            },
          },

          colors: [
            "#12b76a",
          ],

          dataLabels: {
            enabled: false,
          },

          stroke: {
            curve:
              "smooth",

            width:
              2.5,
          },

          fill: {
            type:
              "gradient",

            gradient: {
              opacityFrom:
                0.3,

              opacityTo:
                0.03,

              stops: [
                0,
                95,
              ],
            },
          },

          grid: {
            borderColor:
              "#eef1f5",

            strokeDashArray:
              4,
          },

          xaxis: {

            categories:
              slaDailyTrend.map(
                (
                  item
                ) =>
                  formatReportDate(
                    readAnalyticsValue(
                      item,
                      "EventDate"
                    )
                  )
              ),

            labels: {
              rotate:
                -35,

              style: {
                colors:
                  "#667085",

                fontSize:
                  "11px",
              },
            },
          },

          yaxis: {
            min:
              0,

            max:
              100,

            labels: {
              formatter:
                (
                  value
                ) =>
                  `${formatReportNumber(
                    value,
                    0
                  )}%`,
            },
          },

          tooltip: {
            y: {
              formatter:
                (
                  value
                ) =>
                  formatReportPercent(
                    value
                  ),
            },
          },
        },
      }),
      [
        slaDailyTrend,
      ]
    );

      /*
   * -------------------------------------------------------
   * SLA STATUS COMPLIANCE CHART
   * -------------------------------------------------------
   */

  const statusChart =
    useMemo(
      () => {
        const rows =
          sortedSLAStatus.slice(
            0,
            10
          );

        return {
          series: [
            {
              name:
                "Compliance %",

              data:
                rows.map(
                  (
                    item
                  ) =>
                    Number(
                      readAnalyticsValue(
                        item,
                        "SLACompliancePercentage",
                        0
                      )
                    )
                ),
            },
          ],

          options: {
            chart: {
              toolbar: {
                show: false,
              },
            },

            colors: [
              "#175cd3",
            ],

            dataLabels: {
              enabled: false,
            },

            plotOptions: {
              bar: {
                horizontal:
                  true,

                borderRadius:
                  5,
              },
            },

            grid: {
              borderColor:
                "#eef1f5",

              strokeDashArray:
                4,
            },

            xaxis: {
              min:
                0,

              max:
                100,

              categories:
                rows.map(
                  (
                    item
                  ) =>
                    readAnalyticsValue(
                      item,
                      "StatusName",
                      "Unknown"
                    )
                ),

              labels: {
                formatter:
                  (
                    value
                  ) =>
                    `${formatReportNumber(
                      value,
                      0
                    )}%`,
              },
            },

            tooltip: {
              y: {
                formatter:
                  (
                    value
                  ) =>
                    formatReportPercent(
                      value
                    ),
              },
            },
          },
        };
      },
      [
        sortedSLAStatus,
      ]
    );

  /*
   * -------------------------------------------------------
   * SLA BY PHASE CHART
   * -------------------------------------------------------
   */

  const phaseChart =
    useMemo(
      () => ({
        series: [
          {
            name:
              "Compliance %",

            data:
              slaByPhase.map(
                (
                  item
                ) =>
                  Number(
                    readAnalyticsValue(
                      item,
                      "SLACompliancePercentage",
                      0
                    )
                  )
              ),
          },
        ],

        options: {
          chart: {
            toolbar: {
              show: false,
            },
          },

          colors: [
            "#f26a26",
          ],

          dataLabels: {
            enabled: false,
          },

          plotOptions: {
            bar: {
              borderRadius:
                5,

              columnWidth:
                "50%",
            },
          },

          grid: {
            borderColor:
              "#eef1f5",

            strokeDashArray:
              4,
          },

          xaxis: {
            categories:
              slaByPhase.map(
                (
                  item
                ) =>
                  readAnalyticsValue(
                    item,
                    "PhaseCode",
                    "Unknown"
                  )
              ),

            labels: {
              rotate:
                -25,

              style: {
                colors:
                  "#667085",

                fontSize:
                  "11px",
              },
            },
          },

          yaxis: {
            min:
              0,

            max:
              100,

            labels: {
              formatter:
                (
                  value
                ) =>
                  `${formatReportNumber(
                    value,
                    0
                  )}%`,
            },
          },

          tooltip: {
            y: {
              formatter:
                (
                  value
                ) =>
                  formatReportPercent(
                    value
                  ),
            },
          },
        },
      }),
      [
        slaByPhase,
      ]
    );

  /*
   * -------------------------------------------------------
   * SLA BY STATUS TABLE
   * -------------------------------------------------------
   */

  const statusColumns = [
    {
      key:
        "status",

      label:
        "Status",

      render:
        (row) => (
          <div className="analytics-status-cell">
            <strong>
              {readAnalyticsValue(
                row,
                "StatusName",
                "Unknown"
              )}
            </strong>

            <small>
              {readAnalyticsValue(
                row,
                "PhaseCode",
                "—"
              )}
            </small>
          </div>
        ),
    },

    {
      key:
        "sla",

      label:
        "SLA",

      align:
        "right",

      render:
        (row) =>
          formatHours(
            readAnalyticsValue(
              row,
              "SLAHours",
              0
            )
          ),
    },

    {
      key:
        "average",

      label:
        "Avg actual",

      align:
        "right",

      render:
        (row) =>
          formatHours(
            readAnalyticsValue(
              row,
              "AverageActualHours",
              0
            )
          ),
    },

    {
      key:
        "minimum",

      label:
        "Min",

      align:
        "right",

      render:
        (row) =>
          formatHours(
            readAnalyticsValue(
              row,
              "MinimumActualHours",
              0
            )
          ),
    },

    {
      key:
        "maximum",

      label:
        "Max",

      align:
        "right",

      render:
        (row) =>
          formatHours(
            readAnalyticsValue(
              row,
              "MaximumActualHours",
              0
            )
          ),
    },

    {
      key:
        "events",

      label:
        "Events",

      align:
        "right",

      render:
        (row) =>
          formatReportNumber(
            readAnalyticsValue(
              row,
              "TotalEvents",
              0
            )
          ),
    },

    {
      key:
        "within",

      label:
        "Within SLA",

      align:
        "right",

      render:
        (row) =>
          formatReportNumber(
            readAnalyticsValue(
              row,
              "WithinSLA",
              0
            )
          ),
    },

    {
      key:
        "breached",

      label:
        "Breached",

      align:
        "right",

      render:
        (row) => (
          <span className="analytics-warning-badge">
            {formatReportNumber(
              readAnalyticsValue(
                row,
                "BreachedSLA",
                0
              )
            )}
          </span>
        ),
    },

    {
      key:
        "compliance",

      label:
        "Compliance",

      align:
        "right",

      render:
        (row) =>
          formatReportPercent(
            readAnalyticsValue(
              row,
              "SLACompliancePercentage",
              0
            )
          ),
    },

    {
      key:
        "over",

      label:
        "Avg over SLA",

      align:
        "right",

      render:
        (row) =>
          formatHours(
            readAnalyticsValue(
              row,
              "AverageHoursOverSLA",
              0
            )
          ),
    },
  ];

  /*
   * -------------------------------------------------------
   * CURRENT SLA RISK TABLE
   * -------------------------------------------------------
   */

  const riskColumns = [
    {
      key:
        "order",

      label:
        "Order",

      render:
        (row) => (
          <strong>
            {readAnalyticsValue(
              row,
              "OrderNO",
              "—"
            )}
          </strong>
        ),
    },

    {
      key:
        "status",

      label:
        "Current status",

      render:
        (row) =>
          readAnalyticsValue(
            row,
            "StatusName",
            "Unknown"
          ),
    },

    {
      key:
        "phase",

      label:
        "Phase",

      render:
        (row) =>
          readAnalyticsValue(
            row,
            "PhaseCode",
            "—"
          ),
    },

    {
      key:
        "slaStatus",

      label:
        "SLA status",

      render:
        (row) => {
          const status =
            String(
              readAnalyticsValue(
                row,
                "SLAStatus",
                "ON_TRACK"
              )
            ).toUpperCase();

          let color =
            "#027a48";

          if (
            status ===
            "BREACHED"
          ) {
            color =
              "#b42318";
          } else if (
            status ===
              "AT_RISK" ||
            status ===
              "WARNING"
          ) {
            color =
              "#b54708";
          }

          return (
            <strong
              style={{
                color,
              }}
            >
              {status}
            </strong>
          );
        },
    },

    {
      key:
        "elapsed",

      label:
        "Elapsed",

      align:
        "right",

      render:
        (row) =>
          formatHours(
            readAnalyticsValue(
              row,
              "ActualHours",
              0
            )
          ),
    },

    {
      key:
        "sla",

      label:
        "SLA",

      align:
        "right",

      render:
        (row) =>
          formatHours(
            readAnalyticsValue(
              row,
              "SLAHours",
              0
            )
          ),
    },

    {
      key:
        "remaining",

      label:
        "Remaining",

      align:
        "right",

      render:
        (row) => {
          const hours =
            Number(
              readAnalyticsValue(
                row,
                "HoursRemaining",
                0
              )
            );

          return (
            <strong
              style={{
                color:
                  hours < 0
                    ? "#b42318"
                    : undefined,
              }}
            >
              {formatHours(
                hours
              )}
            </strong>
          );
        },
    },

    {
      key:
        "used",

      label:
        "SLA used",

      align:
        "right",

      render:
        (row) =>
          formatReportPercent(
            readAnalyticsValue(
              row,
              "SLAPercentageUsed",
              0
            )
          ),
    },

    {
      key:
        "vendor",

      label:
        "Vendor",

      render:
        (row) =>
          readAnalyticsValue(
            row,
            "VendorCode",
            "—"
          ),
    },

    {
      key:
        "rider",

      label:
        "Rider",

      render:
        (row) =>
          readAnalyticsValue(
            row,
            "RiderUserCode",
            "—"
          ),
    },
  ];

    /*
   * -------------------------------------------------------
   * SLA BREACHED ORDERS TABLE
   * -------------------------------------------------------
   */

  const breachedColumns = [
    {
      key: "order",
      label: "Order",
      render: (row) => (
        <strong>
          {readAnalyticsValue(
            row,
            "OrderNO",
            "—"
          )}
        </strong>
      ),
    },

    {
      key: "status",
      label: "Status",
      render: (row) =>
        readAnalyticsValue(
          row,
          "StatusName",
          "Unknown"
        ),
    },

    {
      key: "phase",
      label: "Phase",
      render: (row) =>
        readAnalyticsValue(
          row,
          "PhaseCode",
          "—"
        ),
    },

    {
      key: "vendor",
      label: "Vendor",
      render: (row) =>
        readAnalyticsValue(
          row,
          "VendorCode",
          "—"
        ),
    },

    {
      key: "actual",
      label: "Actual",
      align: "right",
      render: (row) =>
        formatHours(
          readAnalyticsValue(
            row,
            "ActualHours",
            0
          )
        ),
    },

    {
      key: "sla",
      label: "SLA",
      align: "right",
      render: (row) =>
        formatHours(
          readAnalyticsValue(
            row,
            "SLAHours",
            0
          )
        ),
    },

    {
      key: "over",
      label: "Over SLA",
      align: "right",
      render: (row) => (
        <span className="analytics-warning-badge">
          {formatHours(
            readAnalyticsValue(
              row,
              "HoursOverSLA",
              0
            )
          )}
        </span>
      ),
    },

    {
      key: "current",
      label: "Current",
      render: (row) =>
        readAnalyticsValue(
          row,
          "IsCurrentStatus",
          false
        )
          ? "Yes"
          : "No",
    },

    {
      key: "rider",
      label: "Rider",
      render: (row) =>
        readAnalyticsValue(
          row,
          "RiderUserCode",
          "—"
        ),
    },
  ];

  /*
   * -------------------------------------------------------
   * VENDOR SLA TABLE
   * -------------------------------------------------------
   */

  const vendorColumns = [
    {
      key: "vendor",
      label: "Vendor",
      render: (row) => (
        <strong>
          {readAnalyticsValue(
            row,
            "VendorCode",
            "—"
          )}
        </strong>
      ),
    },

    {
      key: "events",
      label: "Events",
      align: "right",
      render: (row) =>
        formatReportNumber(
          readAnalyticsValue(
            row,
            "TotalSLAEvents",
            0
          )
        ),
    },

    {
      key: "within",
      label: "Within SLA",
      align: "right",
      render: (row) =>
        formatReportNumber(
          readAnalyticsValue(
            row,
            "WithinSLA",
            0
          )
        ),
    },

    {
      key: "breached",
      label: "Breached",
      align: "right",
      render: (row) =>
        formatReportNumber(
          readAnalyticsValue(
            row,
            "BreachedSLA",
            0
          )
        ),
    },

    {
      key: "compliance",
      label: "Compliance",
      align: "right",
      render: (row) =>
        formatReportPercent(
          readAnalyticsValue(
            row,
            "SLACompliancePercentage",
            0
          )
        ),
    },

    {
      key: "average",
      label: "Avg actual",
      align: "right",
      render: (row) =>
        formatHours(
          readAnalyticsValue(
            row,
            "AverageActualHours",
            0
          )
        ),
    },
  ];

  /*
   * -------------------------------------------------------
   * CSV EXPORT
   * -------------------------------------------------------
   */

  const exportStatusCsv = () =>
    downloadReportCsv(
      `shipment-sla-status-${filters.startDate}-${filters.endDate}.csv`,
      [
        {
          label: "Status",
          value: (row) =>
            readAnalyticsValue(
              row,
              "StatusName",
              ""
            ),
        },

        {
          label: "Phase",
          value: (row) =>
            readAnalyticsValue(
              row,
              "PhaseCode",
              ""
            ),
        },

        {
          label: "SLA Hours",
          value: (row) =>
            readAnalyticsValue(
              row,
              "SLAHours",
              0
            ),
        },

        {
          label: "Average Actual Hours",
          value: (row) =>
            readAnalyticsValue(
              row,
              "AverageActualHours",
              0
            ),
        },

        {
          label: "Minimum Actual Hours",
          value: (row) =>
            readAnalyticsValue(
              row,
              "MinimumActualHours",
              0
            ),
        },

        {
          label: "Maximum Actual Hours",
          value: (row) =>
            readAnalyticsValue(
              row,
              "MaximumActualHours",
              0
            ),
        },

        {
          label: "Events",
          value: (row) =>
            readAnalyticsValue(
              row,
              "TotalEvents",
              0
            ),
        },

        {
          label: "Within SLA",
          value: (row) =>
            readAnalyticsValue(
              row,
              "WithinSLA",
              0
            ),
        },

        {
          label: "Breached SLA",
          value: (row) =>
            readAnalyticsValue(
              row,
              "BreachedSLA",
              0
            ),
        },

        {
          label: "Compliance %",
          value: (row) =>
            readAnalyticsValue(
              row,
              "SLACompliancePercentage",
              0
            ),
        },

        {
          label: "Average Hours Over SLA",
          value: (row) =>
            readAnalyticsValue(
              row,
              "AverageHoursOverSLA",
              0
            ),
        },
      ],
      sortedSLAStatus
    );

  /*
   * -------------------------------------------------------
   * UI
   * -------------------------------------------------------
   */

  return (
    <div
      className={`${
        scope === "vendor"
          ? ""
          : "content"
      } analytics-report-page`.trim()}
    >
      <AnalyticsReportHeader
        title={
          pageTitle ||
          (
            scope === "admin"
              ? "Shipment SLA Report"
              : `${scopeCode} SLA Report`
          )
        }
        eyebrow={pageEyebrow}
        description={
          scope === "admin"
            ? "Monitor shipment SLA compliance, breached orders, current risk, and processing time by workflow status."
            : `SLA performance scoped to ${
                scope === "vendor"
                  ? "vendor"
                  : "distribution center"
              } ${scopeCode}.`
        }
        activeReport="sla"
        onRefresh={() =>
          loadReport(
            filters
          )
        }
        refreshing={
          orderLoading
        }
        reportBasePath={
          reportBasePath
        }
      />

      <AnalyticsFilterPanel
        onApply={() =>
          loadReport(
            filters
          )
        }
        onReset={
          handleReset
        }
        loading={
          orderLoading
        }
      >
        {scope !== "vendor" && (
          <AnalyticsField label="Vendor">
            <SSRSelect
              instanceId={`${scope}-sla-report-vendor`}
              classNamePrefix="analytics-select"
              options={
                vendorOptions
              }
              value={
                vendorOptions.find(
                  (option) =>
                    option.value ===
                    filters.vendorCode
                ) || null
              }
              onChange={(option) =>
                updateFilter(
                  "vendorCode",
                  option?.value || ""
                )
              }
              placeholder="All vendors"
              isClearable
            />
          </AnalyticsField>
        )}

        {scope === "dc" ? (
          <AnalyticsField label="DC order direction">
            <SSRSelect
              instanceId="dc-sla-report-direction"
              classNamePrefix="analytics-select"
              options={[
                {
                  value: "outbound",
                  label: "Outbound from this DC",
                },
                {
                  value: "inbound",
                  label: "Inbound to this DC",
                },
              ]}
              value={{
                value:
                  filters.dcDirection,

                label:
                  filters.dcDirection ===
                  "inbound"
                    ? "Inbound to this DC"
                    : "Outbound from this DC",
              }}
              onChange={(option) =>
                updateDCDirection(
                  option?.value ||
                  "outbound"
                )
              }
              isClearable={false}
            />
          </AnalyticsField>
        ) : (
          <>
            <AnalyticsField label="Origin DC">
              <SSRSelect
                instanceId={`${scope}-sla-origin`}
                classNamePrefix="analytics-select"
                options={
                  dcOptions
                }
                value={
                  dcOptions.find(
                    (option) =>
                      option.value ===
                      filters.originDCCode
                  ) || null
                }
                onChange={(option) =>
                  updateFilter(
                    "originDCCode",
                    option?.value || ""
                  )
                }
                placeholder="All origins"
                isClearable
              />
            </AnalyticsField>

            <AnalyticsField label="Destination DC">
              <SSRSelect
                instanceId={`${scope}-sla-destination`}
                classNamePrefix="analytics-select"
                options={
                  dcOptions
                }
                value={
                  dcOptions.find(
                    (option) =>
                      option.value ===
                      filters.destinationDCCode
                  ) || null
                }
                onChange={(option) =>
                  updateFilter(
                    "destinationDCCode",
                    option?.value || ""
                  )
                }
                placeholder="All destinations"
                isClearable
              />
            </AnalyticsField>
          </>
        )}

        <AnalyticsField label="Delivery type">
          <SSRSelect
            instanceId="sla-report-delivery"
            classNamePrefix="analytics-select"
            options={
              deliveryTypeOptions
            }
            value={
              deliveryTypeOptions.find(
                (option) =>
                  option.value ===
                  filters.deliveryTypeCode
              ) || null
            }
            onChange={(option) =>
              updateFilter(
                "deliveryTypeCode",
                option?.value || ""
              )
            }
            placeholder="All types"
            isClearable
          />
        </AnalyticsField>

        <AnalyticsField label="Status">
          <SSRSelect
            instanceId="sla-report-status"
            classNamePrefix="analytics-select"
            options={
              statusOptions
            }
            value={
              statusOptions.find(
                (option) =>
                  option.value ===
                  filters.statusID
              ) || null
            }
            onChange={(option) =>
              updateFilter(
                "statusID",
                option?.value || ""
              )
            }
            placeholder="All statuses"
            isClearable
          />
        </AnalyticsField>

        <AnalyticsField label="Start date">
          <AnalyticsDatePicker
            value={
              filters.startDate
            }
            maxDate={
              filters.endDate
            }
            placeholder="Select start date"
            onChange={(value) =>
              updateFilter(
                "startDate",
                value
              )
            }
          />
        </AnalyticsField>

        <AnalyticsField label="End date">
          <AnalyticsDatePicker
            value={
              filters.endDate
            }
            minDate={
              filters.startDate
            }
            placeholder="Select end date"
            onChange={(value) =>
              updateFilter(
                "endDate",
                value
              )
            }
          />
        </AnalyticsField>
      </AnalyticsFilterPanel>

            {orderLoading &&
      !shipmentOrderAnalytics ? (
        <AnalyticsLoadingState />
      ) : orderError ? (
        <AnalyticsErrorState
          message={orderError}
          onRetry={() =>
            loadReport(
              filters
            )
          }
        />
      ) : (
        <>
          <div className="analytics-metric-grid">
            <AnalyticsMetricCard
              label="SLA compliance"
              value={
                formatReportPercent(
                  readAnalyticsValue(
                    slaSummary,
                    "SLACompliancePercentage",
                    0
                  )
                )
              }
              helper={`${formatReportNumber(
                readAnalyticsValue(
                  slaSummary,
                  "WithinSLAEvents",
                  0
                )
              )} events within SLA`}
              icon={Target}
              tone="green"
            />

            <AnalyticsMetricCard
              label="SLA breaches"
              value={
                formatReportNumber(
                  readAnalyticsValue(
                    slaSummary,
                    "BreachedSLAEvents",
                    0
                  )
                )
              }
              helper={`${formatReportNumber(
                readAnalyticsValue(
                  slaSummary,
                  "TotalSLAEvents",
                  0
                )
              )} measured events`}
              icon={AlertTriangle}
              tone="red"
            />

            <AnalyticsMetricCard
              label="Average time"
              value={
                formatHours(
                  readAnalyticsValue(
                    slaSummary,
                    "AverageActualHours",
                    0
                  )
                )
              }
              helper="Average status handling time"
              icon={Clock}
              tone="blue"
            />

            <AnalyticsMetricCard
              label="Maximum time"
              value={
                formatHours(
                  readAnalyticsValue(
                    slaSummary,
                    "MaximumActualHours",
                    0
                  )
                )
              }
              helper="Longest status duration"
              icon={Activity}
              tone="purple"
            />

            <AnalyticsMetricCard
              label="Hours over SLA"
              value={
                formatHours(
                  readAnalyticsValue(
                    slaSummary,
                    "TotalHoursOverSLA",
                    0
                  )
                )
              }
              helper="Cumulative breached time"
              icon={RotateCcw}
              tone="orange"
            />

            <AnalyticsMetricCard
              label="Current SLA risk"
              value={
                formatReportNumber(
                  atRiskCount
                )
              }
              helper="At risk or breached now"
              icon={Truck}
              tone="slate"
            />
          </div>

          <div className="analytics-report-grid">
            <AnalyticsSection
              title="SLA compliance trend"
              description="Daily SLA compliance across the selected period."
            >
              {slaDailyTrend.length ? (
                <Chart
                  options={
                    trendChart.options
                  }
                  series={
                    trendChart.series
                  }
                  type="area"
                  height={310}
                />
              ) : (
                <AnalyticsChartEmpty />
              )}
            </AnalyticsSection>

            <AnalyticsSection
              title="Lowest compliance statuses"
              description="Statuses with the weakest SLA compliance in the selected period."
            >
              {statusChart.series?.[0]?.data?.length ? (
                <Chart
                  options={
                    statusChart.options
                  }
                  series={
                    statusChart.series
                  }
                  type="bar"
                  height={310}
                />
              ) : (
                <AnalyticsChartEmpty />
              )}
            </AnalyticsSection>
          </div>

          <AnalyticsSection
            title="SLA by status"
            description="Configured SLA compared with actual processing time by shipment status."
            action={
              <AnalyticsCsvButton
                onClick={
                  exportStatusCsv
                }
                disabled={
                  !sortedSLAStatus.length
                }
              />
            }
          >
            <AnalyticsTable
              columns={
                statusColumns
              }
              rows={
                sortedSLAStatus
              }
              rowKey={(row) =>
                readAnalyticsValue(
                  row,
                  "OrderStatusID"
                )
              }
            />
          </AnalyticsSection>

          <div className="analytics-report-grid equal analytics-equal-height-grid">
            <AnalyticsSection
              title="SLA by phase"
              description="Service-level compliance across operational phases."
            >
              {slaByPhase.length ? (
                <div className="analytics-fill-chart">
                  <Chart
                    options={
                      phaseChart.options
                    }
                    series={
                      phaseChart.series
                    }
                    type="bar"
                    height="100%"
                  />
                </div>
              ) : (
                <AnalyticsChartEmpty />
              )}
            </AnalyticsSection>

            <AnalyticsSection
              title="Current SLA risk"
              description="Active orders approaching or exceeding the configured SLA for their current status."
            >
              <AnalyticsTable
                columns={
                  riskColumns
                }
                rows={
                  sortedSLARisk
                }
                rowKey={(
                  row,
                  index
                ) =>
                  `${readAnalyticsValue(
                    row,
                    "OrderNO",
                    ""
                  )}-${readAnalyticsValue(
                    row,
                    "OrderStatusID",
                    ""
                  )}-${index}`
                }
                initialPageSize={10}
              />
            </AnalyticsSection>
          </div>

          <AnalyticsSection
            title="SLA breached orders"
            description="Orders that exceeded their configured SLA while passing through a shipment status."
          >
            <AnalyticsTable
              columns={
                breachedColumns
              }
              rows={
                slaBreachedOrders
              }
              rowKey={(
                row,
                index
              ) =>
                `${readAnalyticsValue(
                  row,
                  "OrderNO",
                  ""
                )}-${readAnalyticsValue(
                  row,
                  "OrderStatusID",
                  ""
                )}-${index}`
              }
            />
          </AnalyticsSection>

          {scope ===
            "admin" && (
            <AnalyticsSection
              title="Vendor SLA performance"
              description="SLA compliance and average handling time by vendor."
            >
              <AnalyticsTable
                columns={
                  vendorColumns
                }
                rows={[
                  ...slaByVendor,
                ].sort(
                  (
                    a,
                    b
                  ) =>
                    Number(
                      readAnalyticsValue(
                        a,
                        "SLACompliancePercentage",
                        0
                      )
                    ) -
                    Number(
                      readAnalyticsValue(
                        b,
                        "SLACompliancePercentage",
                        0
                      )
                    )
                )}
                rowKey={(row) =>
                  readAnalyticsValue(
                    row,
                    "VendorCode"
                  )
                }
              />
            </AnalyticsSection>
          )}
        </>
      )}
    </div>
  );
};

export default ShipmentSLAReport;