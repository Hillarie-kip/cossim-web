"use client";

import React, { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import Link from "@/components/Link";
import { Alert, Button, Card, Spinner } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  BarChart2,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  RotateCcw,
} from "feather-icons-react";

export const AnalyticsReportHeader = ({
  title,
  description,
  eyebrow = "Reports & analytics",
  activeReport,
  onRefresh,
  refreshing,
  reportBasePath = "/admin/reports",
}) => (
  <div className="analytics-report-header">
    <div>
      <span className="analytics-report-eyebrow">
        {eyebrow}
      </span>

      <h4>{title}</h4>

      <p>{description}</p>
    </div>

    <div className="analytics-report-header-actions">
      <nav
        className="analytics-report-switcher"
        aria-label="Analytics reports"
      >
        <Link
          to={`${reportBasePath}/shipment-orders`}
          className={
            activeReport === "orders"
              ? "active"
              : ""
          }
        >
          Order report
        </Link>

        <Link
          to={`${reportBasePath}/shipment-tracking`}
          className={
            activeReport === "tracking"
              ? "active"
              : ""
          }
        >
          Tracking report
        </Link>

        <Link
          to={`${reportBasePath}/shipment-sla`}
          className={
            activeReport === "sla"
              ? "active"
              : ""
          }
        >
          SLA report
        </Link>
      </nav>

      <Button
        variant="outline-secondary"
        className="analytics-icon-button"
        onClick={onRefresh}
        disabled={refreshing}
        aria-label="Refresh report"
      >
        <RefreshCw
          size={17}
          className={
            refreshing
              ? "analytics-spin"
              : ""
          }
        />
      </Button>
    </div>
  </div>
);

export const AnalyticsFilterPanel = ({
  children,
  onApply,
  onReset,
  loading,
}) => (
  <Card className="analytics-filter-panel">
    <Card.Body>
      <div className="analytics-filter-grid">
        {children}
      </div>

      <div className="analytics-filter-actions">
        <Button
          variant="outline-secondary"
          onClick={onReset}
          disabled={loading}
        >
          <RotateCcw size={15} />
          Reset
        </Button>

        <Button
          className="analytics-apply-button"
          variant="primary"
          onClick={onApply}
          disabled={loading}
        >
          {loading ? (
            <Spinner
              size="sm"
              className="analytics-button-spinner"
              aria-hidden="true"
            />
          ) : (
            <BarChart2 size={15} />
          )}

          {loading
            ? "Loading…"
            : "Apply filters"}
        </Button>
      </div>
    </Card.Body>
  </Card>
);

export const AnalyticsField = ({
  label,
  children,
  className = "",
}) => (
  <div
    className={`analytics-filter-field ${className}`.trim()}
  >
    <label>{label}</label>

    {children}
  </div>
);

const parseDatePickerValue = (value) => {
  if (!value) return null;

  const [year, month, day] =
    value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(
    year,
    month - 1,
    day
  );
};

const formatDatePickerValue = (date) => {
  if (!date) return "";

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const AnalyticsDatePicker = ({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder,
}) => (
  <DatePicker
    selected={
      parseDatePickerValue(value)
    }
    onChange={(date) =>
      onChange(
        formatDatePickerValue(date)
      )
    }
    minDate={
      parseDatePickerValue(minDate)
    }
    maxDate={
      parseDatePickerValue(maxDate)
    }
    dateFormat="dd-MM-yyyy"
    placeholderText={placeholder}
    className="form-control analytics-date-input"
    calendarClassName="analytics-datepicker-calendar"
    popperClassName="analytics-datepicker-popper"
    isClearable
    showMonthDropdown
    showYearDropdown
    dropdownMode="select"
  />
);

export const AnalyticsMetricCard = ({
  label,
  value,
  helper,
  icon: Icon,
  tone = "orange",
  to,
}) => {
  const card = (
    <Card
      className={`analytics-metric-card tone-${tone}`}
    >
      <Card.Body>
        <div className="analytics-metric-icon">
          <Icon size={20} />
        </div>

        <div className="analytics-metric-copy">
          <span>{label}</span>

          <strong>{value}</strong>

          {helper && (
            <small>
              {helper}
            </small>
          )}
        </div>

        {to && (
          <ArrowUpRight
            className="analytics-metric-link-icon"
            size={14}
            aria-hidden="true"
          />
        )}
      </Card.Body>
    </Card>
  );

  return to ? (
    <NextLink
      href={to}
      className="analytics-metric-link"
      aria-label={`${label}: view details`}
    >
      {card}
    </NextLink>
  ) : (
    card
  );
};

export const AnalyticsSection = ({
  title,
  description,
  action,
  children,
  className = "",
  id,
}) => (
  <Card
    id={id}
    className={`analytics-section ${className}`.trim()}
  >
    <Card.Header>
      <div>
        <h5>{title}</h5>

        {description && (
          <p>
            {description}
          </p>
        )}
      </div>

      {action}
    </Card.Header>

    <Card.Body>
      {children}
    </Card.Body>
  </Card>
);

export const AnalyticsCsvButton = ({
  onClick,
  disabled,
}) => (
  <Button
    variant="outline-secondary"
    size="sm"
    className="analytics-export-button"
    onClick={onClick}
    disabled={disabled}
  >
    <Download size={14} />

    Export CSV
  </Button>
);

export const AnalyticsTable = ({
  columns,
  rows,
  rowKey,
  emptyText,
  paginated = true,
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
}) => {
  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    pageSize,
    setPageSize,
  ] = useState(
    initialPageSize
  );

  const totalRows =
    rows.length;

  const totalPages =
    Math.max(
      Math.ceil(
        totalRows / pageSize
      ),
      1
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [rows]);

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const visibleRows =
    useMemo(() => {
      if (!paginated) {
        return rows;
      }

      const start =
        (currentPage - 1) *
        pageSize;

      return rows.slice(
        start,
        start + pageSize
      );
    }, [
      currentPage,
      pageSize,
      paginated,
      rows,
    ]);

  const firstVisibleRow =
    totalRows
      ? (currentPage - 1) *
          pageSize +
        1
      : 0;

  const lastVisibleRow =
    Math.min(
      currentPage * pageSize,
      totalRows
    );

  return (
    <div className="analytics-table-container">
      <div className="analytics-table-wrap">
        <table className="analytics-table">
          <thead>
            <tr>
              {columns.map(
                (column) => (
                  <th
                    key={
                      column.key
                    }
                    className={
                      column.align
                        ? `text-${column.align}`
                        : ""
                    }
                  >
                    {
                      column.label
                    }
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {visibleRows.length ? (
              visibleRows.map(
                (
                  row,
                  index
                ) => {
                  const absoluteIndex =
                    (currentPage -
                      1) *
                      pageSize +
                    index;

                  return (
                    <tr
                      key={
                        rowKey
                          ? rowKey(
                              row,
                              absoluteIndex
                            )
                          : absoluteIndex
                      }
                    >
                      {columns.map(
                        (
                          column
                        ) => (
                          <td
                            key={
                              column.key
                            }
                            className={
                              column.align
                                ? `text-${column.align}`
                                : ""
                            }
                          >
                            {column.render(
                              row,
                              absoluteIndex
                            )}
                          </td>
                        )
                      )}
                    </tr>
                  );
                }
              )
            ) : (
              <tr>
                <td
                  colSpan={
                    columns.length
                  }
                  className="analytics-table-empty"
                >
                  {emptyText ||
                    "No data is available for the selected filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {paginated &&
        totalRows > 0 && (
          <div className="analytics-table-pagination">
            <div className="analytics-pagination-summary">
              Showing{" "}
              <strong>
                {
                  firstVisibleRow
                }
                –
                {
                  lastVisibleRow
                }
              </strong>{" "}
              of{" "}
              <strong>
                {totalRows}
              </strong>
            </div>

            <div className="analytics-pagination-controls">
              <label>
                Rows

                <select
                  value={
                    pageSize
                  }
                  onChange={(
                    event
                  ) => {
                    setPageSize(
                      Number(
                        event
                          .target
                          .value
                      )
                    );

                    setCurrentPage(
                      1
                    );
                  }}
                  aria-label="Rows per page"
                >
                  {pageSizeOptions.map(
                    (
                      option
                    ) => (
                      <option
                        key={
                          option
                        }
                        value={
                          option
                        }
                      >
                        {
                          option
                        }
                      </option>
                    )
                  )}
                </select>
              </label>

              <span className="analytics-page-count">
                Page{" "}
                {currentPage}{" "}
                of{" "}
                {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage(
                    (
                      page
                    ) =>
                      Math.max(
                        page -
                          1,
                        1
                      )
                  )
                }
                disabled={
                  currentPage ===
                  1
                }
                aria-label="Previous page"
              >
                <ChevronLeft
                  size={16}
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage(
                    (
                      page
                    ) =>
                      Math.min(
                        page +
                          1,
                        totalPages
                      )
                  )
                }
                disabled={
                  currentPage ===
                  totalPages
                }
                aria-label="Next page"
              >
                <ChevronRight
                  size={16}
                />
              </button>
            </div>
          </div>
        )}
    </div>
  );
};

export const AnalyticsLoadingState =
  () => (
    <div
      className="analytics-state-card"
      role="status"
    >
      <Spinner className="analytics-page-spinner" />

      <strong>
        Preparing your report
      </strong>

      <span>
        Aggregating the latest operational data…
      </span>
    </div>
  );

export const AnalyticsErrorState = ({
  message,
  onRetry,
}) => (
  <Alert
    variant="danger"
    className="analytics-error-state"
  >
    <div>
      <strong>
        We couldn’t load this report
      </strong>

      <span>
        {message}
      </span>
    </div>

    <Button
      variant="outline-danger"
      size="sm"
      onClick={onRetry}
    >
      Try again
    </Button>
  </Alert>
);

export const AnalyticsChartEmpty = ({
  message,
}) => (
  <div className="analytics-chart-empty">
    {message ||
      "No chart data available."}
  </div>
);