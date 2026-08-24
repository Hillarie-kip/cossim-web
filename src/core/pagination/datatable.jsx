import React, { useState } from "react";
import { Table, Tooltip } from "antd";

const DEFAULT_TABLE_SCROLL = { x: "100%", y: 560 };
const DEFAULT_MIN_TABLE_WIDTH = 900;
const ESTIMATED_ROW_HEIGHT = 44;

const getColumnTitle = (title) => {
  if (typeof title === "string") return title;
  if (typeof title === "number") return String(title);
  return "";
};

const getColumnWidth = (column) => {
  if (column.width) return column.width;

  const title = getColumnTitle(column.title).toLowerCase();
  const dataIndex = Array.isArray(column.dataIndex)
    ? column.dataIndex.join(" ").toLowerCase()
    : String(column.dataIndex || column.key || "").toLowerCase();
  const value = `${title} ${dataIndex}`;

  if (value.match(/\b(action|actions)\b/)) return 110;
  if (value.match(/\b(status name|name statusname)\b/)) return 220;
  if (value.includes("description")) return 360;
  if (value.includes("status")) return 145;
  if (value.match(/\b(date|time|period|effective)\b/)) return 145;
  if (value.match(/\b(amount|rate|fee|price|total|balance|cod|sla)\b/)) return 130;
  if (value.match(/\b(route|address|description|remarks|notes)\b/)) return 220;
  if (value.match(/\b(contact|email|phone|mobile)\b/)) return 190;
  if (value.match(/\b(role|roles|permission)\b/)) return 220;
  if (value.match(/\b(sender|receiver|recipient|vendor|customer|rider|agent|name)\b/)) return 175;
  if (value.match(/\b(code|number|no|#|id)\b/)) return 135;

  return 160;
};

const getNumericWidth = (width) => {
  if (typeof width === "number") return width;
  if (typeof width === "string" && width.endsWith("px")) {
    return Number(width.replace("px", "")) || 0;
  }

  return 0;
};

const getColumnsScrollWidth = (columns = []) =>
  columns.reduce((total, column) => {
    if (column.children) {
      return total + getColumnsScrollWidth(column.children);
    }

    return total + getNumericWidth(column.width);
  }, 0);

const getColumnAlign = (column) => {
  if (column.align) return column.align;

  const title = getColumnTitle(column.title).toLowerCase();
  const dataIndex = Array.isArray(column.dataIndex)
    ? column.dataIndex.join(" ").toLowerCase()
    : String(column.dataIndex || column.key || "").toLowerCase();
  const value = `${title} ${dataIndex}`;

  if (value.match(/\b(amount|rate|fee|price|total|balance|cod|sla)\b/)) return "right";
  if (value.match(/\b(action|actions)\b/)) return "center";

  return undefined;
};

const isActionColumn = (column) => {
  const title = getColumnTitle(column.title).toLowerCase();
  const dataIndex = Array.isArray(column.dataIndex)
    ? column.dataIndex.join(" ").toLowerCase()
    : String(column.dataIndex || column.key || "").toLowerCase();
  const value = `${title} ${dataIndex}`;

  return value.match(/\b(action|actions)\b/);
};

const isTooltipColumn = (column) => {
  if (column.tooltip === false) return false;
  if (column.tooltip === true) return true;

  return true;
};

const isPrimitiveContent = (content) =>
  typeof content === "string" || typeof content === "number";

const renderWithTooltip = (content) => {
  if (!isPrimitiveContent(content)) return content;

  const displayValue = String(content || "");
  if (!displayValue) return content;

  return (
    <Tooltip title={displayValue} placement="topLeft" mouseEnterDelay={0.35}>
      <span className="datatable-tooltip-cell">{displayValue}</span>
    </Tooltip>
  );
};

const enhanceColumns = (columns = []) =>
  columns.map((column) => {
    const actionColumn = isActionColumn(column);
    const tooltipColumn = !actionColumn && isTooltipColumn(column);
    const originalRender = column.render;
    const enhancedColumn = {
      ...column,
      width: getColumnWidth(column),
      ellipsis: column.ellipsis ?? !actionColumn,
      align: getColumnAlign(column),
      className: `${column.className || ""} ${actionColumn ? "datatable-action-column" : ""}`.trim(),
    };

    if (tooltipColumn) {
      enhancedColumn.render = (value, record, index) => {
        const renderedContent = originalRender
          ? originalRender(value, record, index)
          : value;

        return renderWithTooltip(renderedContent);
      };
    }

    if (column.children) {
      enhancedColumn.children = enhanceColumns(column.children);
    }

    return enhancedColumn;
  });

const Datatable = ({
  props,
  columns,
  dataSource,
  expandable,
  loading,
  rowKey,
  pagination,
  rowSelection: customRowSelection,
  onRow,
  scroll,
  sticky,
  tableLayout,
  className = "",
  enhance = true,
  maxBodyHeight = 560,
  hideScrollOnEmpty = true,
  emptyTitle = "No data available",
  emptyDescription = "Try adjusting your filters or search terms.",
  emptyAction,
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const defaultRowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const rowSelection = customRowSelection !== undefined ? customRowSelection : defaultRowSelection;
  const enhancedColumns = enhance ? enhanceColumns(columns) : columns;
  const isEmpty = !loading && (!dataSource || dataSource.length === 0);
  const inferredScrollWidth = Math.max(
    getColumnsScrollWidth(enhancedColumns) + (rowSelection ? 56 : 0),
    DEFAULT_MIN_TABLE_WIDTH
  );
  const rowCount = dataSource ? dataSource.length : 0;
  const contentFitsWithoutScroll = rowCount * ESTIMATED_ROW_HEIGHT <= maxBodyHeight;
  const tableScroll = isEmpty && hideScrollOnEmpty
    ? undefined
    : scroll || (contentFitsWithoutScroll
      ? { x: inferredScrollWidth }
      : { ...DEFAULT_TABLE_SCROLL, x: inferredScrollWidth, y: maxBodyHeight });
  const tableSticky = isEmpty && hideScrollOnEmpty
    ? false
    : sticky === undefined ? { offsetHeader: 0 } : sticky;
  const emptyState = (
    <div className="datatable-empty-state">
      <div className="datatable-empty-visual" aria-hidden="true">
        <svg viewBox="0 0 64 64" role="img">
          <path d="M18 23.5 24.2 14h15.6L46 23.5" />
          <path d="M14 23.5h36l-2.8 24.2A4 4 0 0 1 43.2 51H20.8a4 4 0 0 1-4-3.3L14 23.5Z" />
          <path d="M24 34h16" />
          <path d="M27 40h10" />
        </svg>
      </div>
      <div className="datatable-empty-copy">
        <div className="datatable-empty-title">{emptyTitle}</div>
        {emptyDescription && (
          <div className="datatable-empty-description">{emptyDescription}</div>
        )}
      </div>
      {emptyAction && <div className="datatable-empty-action">{emptyAction}</div>}
    </div>
  );

  return (
    <div className="datatable-modern-wrapper">
      <Table
        key={props}
        className={`table datanew dataTable no-footer datatable-modern ${className}`.trim()}
        rowSelection={rowSelection}
        onRow={onRow}
        columns={enhancedColumns}
        dataSource={dataSource}
        rowKey={rowKey || ((record) => record.id)}
        expandable={expandable}
        loading={loading}
        pagination={pagination}
        scroll={tableScroll}
        sticky={tableSticky}
        tableLayout={tableLayout || "fixed"}
        locale={{ emptyText: emptyState }}
      />

      <style jsx global>{`
        .datatable-modern-wrapper {
          width: 100%;
          min-width: 0;
        }

        .datatable-modern.ant-table-wrapper {
          width: 100%;
        }

        .table-responsive:has(> .datatable-modern-wrapper) {
          overflow: visible;
        }

        .datatable-modern .ant-table {
          color: #344054;
          font-size: 13px;
          line-height: 1.4;
          background: #fff;
        }

        .datatable-modern .ant-table-container {
          border: 1px solid #edf0f5;
          border-radius: 8px;
        }

        .datatable-modern .ant-table-thead > tr:first-child > th:first-child {
          border-top-left-radius: 8px;
        }

        .datatable-modern .ant-table-thead > tr:first-child > th:last-child {
          border-top-right-radius: 8px;
        }

        .datatable-modern .ant-table-tbody > tr:last-child > td:first-child {
          border-bottom-left-radius: 8px;
        }

        .datatable-modern .ant-table-tbody > tr:last-child > td:last-child {
          border-bottom-right-radius: 8px;
        }

        .datatable-modern .ant-table-empty .ant-table-container,
        .datatable-modern .ant-table-empty .ant-table-content,
        .datatable-modern .ant-table-empty table {
          overflow: hidden !important;
        }

        .datatable-modern .ant-table-container table {
          table-layout: fixed !important;
        }

        .datatable-modern .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #344054;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.01em;
          padding: 12px 10px;
          white-space: nowrap;
          border-bottom: 1px solid #e6eaf0;
        }

        .datatable-modern .ant-table-tbody > tr > td {
          padding: 11px 10px;
          vertical-align: middle;
          border-bottom: 1px solid #eef1f5;
          overflow: hidden;
        }

        /*
         * table-layout is fixed, so each <td> is locked to its column width.
         * Custom "render" functions that return JSX (rather than a plain
         * string) skip the tooltip/ellipsis wrapping below, so a long
         * unbroken token (order codes, emails, etc.) can overflow its cell
         * and visually bleed into the next column. Force any direct cell
         * content to wrap within the cell instead.
         */
        .datatable-modern .ant-table-tbody > tr > td > * {
          max-width: 100%;
          min-width: 0;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .datatable-modern .ant-table-tbody > tr:hover > td,
        .datatable-modern .ant-table-tbody .ant-table-row > .ant-table-cell-row-hover {
          background: #f6f9ff !important;
        }

        .datatable-modern .ant-table-cell-ellipsis {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .datatable-modern .datatable-tooltip-cell {
          display: block;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .datatable-modern .ant-table-cell-ellipsis > div,
        .datatable-modern .ant-table-cell-ellipsis > span,
        .datatable-modern .ant-table-cell-ellipsis > strong,
        .datatable-modern .ant-table-cell-ellipsis > small {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .datatable-modern .ant-table-cell-ellipsis .badge {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          vertical-align: middle;
          white-space: nowrap;
        }

        .datatable-modern .datatable-action-column {
          overflow: visible !important;
        }

        .datatable-modern .datatable-action-column .dropdown,
        .datatable-modern .datatable-action-column .dropup,
        .datatable-modern .datatable-action-column .dropdown-menu {
          overflow: visible;
        }

        .datatable-modern .datatable-action-column .dropdown-menu {
          z-index: 1080;
        }

        .datatable-modern .ant-table-column-sorters {
          gap: 6px;
        }

        .datatable-modern .ant-table-selection-column {
          width: 48px !important;
          min-width: 48px !important;
        }

        .datatable-modern .dropdown-toggle,
        .datatable-modern .btn-sm {
          padding: 4px 8px;
          font-size: 12px;
          line-height: 1.4;
        }

        .datatable-modern .ant-table-pagination.ant-pagination {
          margin: 14px 0 0;
          padding: 0 2px;
        }

        .datatable-modern .ant-table-empty .ant-table-tbody > tr > td {
          border-bottom: 0;
          padding: 0;
        }

        .datatable-modern .ant-table-placeholder:hover > td {
          background: #fff !important;
        }

        .datatable-empty-state {
          display: flex;
          min-height: 300px;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 52px 16px;
          text-align: center;
          background:
            radial-gradient(circle at top, rgba(255, 102, 0, 0.08), transparent 32%),
            linear-gradient(180deg, #fff 0%, #fbfcfe 100%);
        }

        .datatable-empty-visual {
          display: inline-flex;
          width: 76px;
          height: 76px;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          border: 1px solid #edf0f5;
          border-radius: 18px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.96)),
            #fff;
          box-shadow: 0 18px 44px rgba(16, 24, 40, 0.08);
        }

        .datatable-empty-visual svg {
          width: 42px;
          height: 42px;
          fill: none;
          stroke: #ff6600;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-width: 2.2;
        }

        .datatable-empty-copy {
          display: flex;
          align-items: center;
          flex-direction: column;
        }

        .datatable-modern .ant-table-empty .ant-table-body {
          overflow: hidden !important;
        }

        .datatable-empty-title {
          color: #344054;
          font-size: 15px;
          font-weight: 700;
          line-height: 1.35;
        }

        .datatable-empty-description {
          max-width: 360px;
          margin-top: 6px;
          color: #667085;
          font-size: 13px;
          line-height: 1.5;
        }

        .datatable-empty-action {
          margin-top: 16px;
        }

        [data-layout-mode=dark_mode] .datatable-modern .ant-table {
          background: #1d1d42;
          color: #d8dcef;
        }

        [data-layout-mode=dark_mode] .datatable-modern .ant-table-container {
          border-color: #2d2d58;
        }

        [data-layout-mode=dark_mode] .datatable-modern .ant-table-thead > tr > th {
          background: #24244d !important;
          color: #f2f4ff;
          border-bottom-color: #343463;
        }

        [data-layout-mode=dark_mode] .datatable-modern .ant-table-tbody > tr > td {
          border-bottom-color: #2d2d58;
        }

        [data-layout-mode=dark_mode] .datatable-modern .ant-table-tbody > tr:hover > td,
        [data-layout-mode=dark_mode] .datatable-modern .ant-table-tbody .ant-table-row > .ant-table-cell-row-hover {
          background: #24244d !important;
        }

        [data-layout-mode=dark_mode] .datatable-modern .ant-table-placeholder:hover > td {
          background: #1d1d42 !important;
        }

        [data-layout-mode=dark_mode] .datatable-empty-state {
          background:
            radial-gradient(circle at top, rgba(13, 110, 253, 0.12), transparent 34%),
            #1d1d42;
        }

        [data-layout-mode=dark_mode] .datatable-empty-title {
          color: #f2f4ff;
        }

        [data-layout-mode=dark_mode] .datatable-empty-description {
          color: #b8bfdc;
        }

        @media (max-width: 767.98px) {
          .datatable-modern-wrapper {
            max-width: 100%;
            overflow-x: auto;
            overscroll-behavior-inline: contain;
            -webkit-overflow-scrolling: touch;
          }

          .table-responsive:has(> .datatable-modern-wrapper) {
            max-width: 100%;
            overflow-x: auto !important;
          }

          .datatable-modern .ant-table,
          .datatable-modern .ant-table-container {
            max-width: 100%;
          }

          .datatable-modern .ant-table-content,
          .datatable-modern .ant-table-body {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }

          .datatable-modern .ant-table-thead > tr > th,
          .datatable-modern .ant-table-tbody > tr > td {
            padding: 10px 8px;
          }

          .datatable-modern .ant-table-pagination.ant-pagination {
            justify-content: center;
            flex-wrap: wrap;
            gap: 6px;
            padding: 0 8px 8px;
          }

          .datatable-empty-state {
            min-height: 220px;
            padding: 36px 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default Datatable;
