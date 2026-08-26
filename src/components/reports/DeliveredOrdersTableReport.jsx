"use client";

import React, { useEffect, useMemo, useState } from "react";
import Datatable from "@/core/pagination/datatable";
import TableExportIcons from "@/components/TableExportIcons";
import OrderExpandedDetails from "@/components/OrderExpandedDetails";
import { getHandoverBatchList, getHandoverReceiptUrl, getShipmentOrders, updateShipmentStatusBatch } from "@/services/shipmentService";
import notify from "@/lib/toast";
import { useGlobalFilters } from "@/contexts/GlobalFiltersContext";
import { useAuth } from "@/contexts/AuthContext";
import { RoleType } from "@/constants/user-roles";
import { RotateCcw } from "feather-icons-react";
import Swal from "sweetalert2";

const money = (value) => Number(value || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const text = (value) => value || "-";
const reportDateParts = (value) => {
  if (!value) return { date: "-", time: "" };
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("en-GB"),
    time: date.toLocaleTimeString("en-GB"),
  };
};

export default function DeliveredOrdersTableReport({
  title = "Delivered Orders",
  description = "Delivered shipment orders",
  taskType = "delivered",
  statusIDs = "303",
  allowPayment = false,
  emptyTitle = "No delivered orders found",
  dateOnly = false,
  allowExport = true,
  returnActions = false,
} = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [returnStatusFilter, setReturnStatusFilter] = useState("pending");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 1000, total: 0 });
  const { filters: navigationFilters } = useGlobalFilters();
  const { user } = useAuth();
  const roleCodes = new Set((user?.AssignedRoles || []).map((role) => role.RoleTypeCode));
  const isAdmin = roleCodes.has(RoleType.ADMIN);
  const isDCUser = roleCodes.has(RoleType.DC_OPERATOR) || roleCodes.has(RoleType.PACKAGE_HANDLER);
  const isVendorOnly = roleCodes.has(RoleType.VENDOR) && !isAdmin;
  const assignedVendorCode = user?.AssignedVendor?.VendorCode || user?.AssignedVendor?.vendorCode || user?.VendorCode || user?.vendorCode || "";
  const isConsolidated = taskType === "consolidated";
  const effectiveStatusIDs = returnActions
    ? ({ pending: "402", accepted: "901", declined: "902", all: "402,901,902" }[returnStatusFilter] || "402")
    : statusIDs;

  const loadReport = async ({
    page = pagination.current,
    pageSize = pagination.pageSize,
    search = searchTerm,
    forceRefresh = false,
  } = {}) => {
    const normalizedSearch = search.trim();
    setLoading(true);
    try {
      const response = isConsolidated
        ? await getHandoverBatchList({
          pageNo: page,
          pageSize,
          search: normalizedSearch || undefined,
          statusIDs: "1,3",
          FromDCCode: navigationFilters.dcCodes || navigationFilters.dcCode || undefined,
          startDate: navigationFilters.startDate || undefined,
          endDate: navigationFilters.endDate || undefined,
          orderBy: "DateAdded",
          sortDir: "DESC",
          forceRefresh,
          backgroundRefresh: false,
        })
        : await getShipmentOrders(dateOnly ? {
          pageNo: page,
          pageSize,
          checkSLA: false,
          searchTerm: normalizedSearch || undefined,
          vendorCode: isVendorOnly ? assignedVendorCode || undefined : navigationFilters.vendorCode || undefined,
          toDCCode: navigationFilters.dcCodes || navigationFilters.dcCode || undefined,
          startDate: navigationFilters.startDate || undefined,
          endDate: navigationFilters.endDate || undefined,
          forceRefresh,
          backgroundRefresh: false,
        } : {
          pageNo: page,
          pageSize,
          taskType,
          statusIDs: effectiveStatusIDs,
          checkSLA: false,
          searchTerm: normalizedSearch || undefined,
          vendorCode: navigationFilters.vendorCode || undefined,
          ...(["delivered", "completed"].includes(taskType)
            ? { toDCCode: navigationFilters.dcCodes || navigationFilters.dcCode || undefined }
            : { fromDCCode: navigationFilters.dcCodes || navigationFilters.dcCode || undefined }),
          startDate: navigationFilters.startDate || undefined,
          endDate: navigationFilters.endDate || undefined,
          orderBy: "DateAdded",
          sortDir: "DESC",
          forceRefresh,
          backgroundRefresh: false,
        });
      const responseRows = Array.isArray(response?.Data) ? response.Data : [];
      setRows(isConsolidated
        ? responseRows.filter((row) => [1, 3].includes(Number(row.StatusID)))
        : responseRows);
      setPagination({ current: Number(response?.PageNO || page), pageSize: Number(response?.PageSize || pageSize), total: Number(response?.TotalCount || 0) });
    } catch (error) {
      setRows([]);
      notify.error(error.message || `Failed to load ${isConsolidated ? "consolidated batches" : "orders"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReport({ page: 1, pageSize: 1000 }); }, [navigationFilters.startDate, navigationFilters.endDate, navigationFilters.vendorCode, navigationFilters.dcCode, navigationFilters.dcCodes, returnStatusFilter]);

  const resolveReturn = async (order, action) => {
    if (action === "decline" && !(isAdmin || isDCUser)) return notify.error("You are not allowed to decline returns.");
    if (action === "accept" && !(isVendorOnly || isAdmin || isDCUser)) return notify.error("You are not allowed to accept returns.");
    const label = action === "accept" ? "Accept" : "Decline";
    const confirmation = await Swal.fire({
      title: `${label} return?`,
      text: `${label} return ${order.OrderNO}?`,
      icon: "warning",
      input: action === "decline" ? "textarea" : undefined,
      inputLabel: action === "decline" ? "Reason for declining" : undefined,
      inputPlaceholder: action === "decline" ? "Enter the reason" : undefined,
      inputAttributes: action === "decline" ? { "aria-label": "Reason for declining return" } : undefined,
      showCancelButton: true,
      confirmButtonText: action === "accept" ? "Yes, accept" : "Yes, decline",
      confirmButtonColor: action === "accept" ? "#198754" : "#dc3545",
      cancelButtonText: "Cancel",
      preConfirm: action === "decline" ? (value) => {
        if (!value?.trim()) return Swal.showValidationMessage("Enter the reason for declining this return");
        return value.trim();
      } : undefined,
    });
    if (!confirmation.isConfirmed) return;
    const reason = action === "decline" ? confirmation.value : "";
    try {
      const response = await updateShipmentStatusBatch({ orders: [{ orderNO: order.OrderNO, statusID: action === "accept" ? 901 : 902, dcCode: order.CurrentDCCode || order.OriginDCCode || "", notes: action === "accept" ? "Return accepted" : `Return declined: ${reason}` }] });
      if (response?.Error) throw new Error(response.Message || `Failed to ${action} return`);
      notify.success(`Return ${action === "accept" ? "accepted" : "declined"}`);
      await loadReport({ page: pagination.current, pageSize: pagination.pageSize, search: searchTerm });
    } catch (error) { notify.error(error.message || `Failed to ${action} return`); }
  };

  const columns = useMemo(() => isConsolidated ? [
    { title: "Handover code", dataIndex: "HandoverCode", width: 220, render: (value) => <strong className="text-primary">{text(value)}</strong> },
    { title: "Batch date", dataIndex: "DateAdded", width: 180, render: (value) => value ? new Date(value).toLocaleString("en-GB") : "-" },
    { title: "Source DC", dataIndex: "FromDCName", width: 210, render: (_, row) => <div><strong>{text(row.FromDCName || row.FromDCCode)}</strong><small className="d-block text-muted">{text(row.FromDCCode)}</small></div> },
    { title: "Destination DC", dataIndex: "ToDCName", width: 210, render: (_, row) => <div><strong>{text(row.ToDCName || row.ToDCCode)}</strong><small className="d-block text-muted">{text(row.ToDCCode)}</small></div> },
    { title: "Courier", dataIndex: "RiderName", width: 190, render: (_, row) => <div><strong>{text(row.RiderName || "Unassigned")}</strong><small className="d-block text-muted">{text(row.RiderUserCode)}</small></div> },
    { title: "Packages", dataIndex: "TotalItems", width: 120, align: "center", render: (value) => `${Number(value || 0)} package${Number(value || 0) === 1 ? "" : "s"}` },
    { title: "Cost", dataIndex: "CourierCost", width: 140, align: "right", render: (value) => value == null ? "-" : `KES ${money(value)}` },
    { title: "Cost per package", dataIndex: "CostPerPackage", width: 170, align: "right", render: (_, row) => row.CourierCost == null || Number(row.TotalItems || 0) <= 0 ? "-" : `KES ${money(Number(row.CourierCost) / Number(row.TotalItems))}` },
    { title: "Uploaded image", dataIndex: "ReceiptImageID", width: 150, align: "center", render: (imageID) => imageID ? <a className="btn btn-sm btn-outline-primary" href={getHandoverReceiptUrl(imageID)} target="_blank" rel="noreferrer">View image</a> : "-" },
    { title: "Status", dataIndex: "StatusID", width: 150, render: (value) => Number(value) === 3 ? "Received" : Number(value) === 1 ? "Pending Receipt" : "-" },
    { title: "Created by", dataIndex: "CreatedByName", width: 190, render: (_, row) => <div><strong>{text(row.CreatedByName || row.CreatedBy || row.ConfirmedBy)}</strong>{row.CreatedByName && <small className="d-block text-muted">{text(row.CreatedBy)}</small>}</div> },
  ] : [
    { title: "Order number", dataIndex: "OrderNO", width: 220, render: (value, row) => <div><strong className="text-primary">{text(value)}</strong><small className="d-block text-muted">{text(row.DeliveryType)}</small></div> },
    { title: "Vendor", dataIndex: "VendorName", width: 210, render: (_, row) => <div><strong>{text(row.VendorName || row.SenderCompanyName)}</strong><small className="d-block text-muted">{text(row.VendorCode)}</small></div> },
    { title: "Receiver", dataIndex: "ReceiverContactName", width: 260, render: (_, row) => <div><strong>{text(row.ReceiverContactName)}</strong><small className="d-block text-muted">{text(row.ReceiverContactPhone)}</small><small className="d-block text-muted">{text(row.ReceiverStreetName)}</small></div> },
    { title: "Origin / Destination", dataIndex: "OriginDCName", width: 230, render: (_, row) => <div><span className="d-block">From: <strong>{text(row.OriginDCName || row.OriginDCCode)}</strong></span><small className="d-block text-muted">To: {text(row.DestinationDCName || row.DestinationDCCode)}</small></div> },
    { title: "Service fee", dataIndex: "ServiceFee", width: 140, align: "right", render: (value) => `KES ${money(value)}` },
    { title: "COD / Paid / Balance", dataIndex: "CODAmount", width: 250, align: "right", render: (_, row) => <div><span className="d-block">COD: <strong>KES {money(row.CODAmount)}</strong></span><small className="d-block text-success">Paid: KES {money(row.PaidAmount)}</small><small className="d-block text-danger">Balance: KES {money(Math.max(0, Number(row.CODAmount || 0) - Number(row.PaidAmount || 0)))}</small><small className="d-block text-muted text-break">Ref: {text(row.PaymentTransactionRefs)}</small></div> },
    { title: "Date / Status", dataIndex: "DateAdded", width: 160, render: (value, row) => { const formatted = reportDateParts(value); return <div><span className="d-block">{formatted.date}</span>{formatted.time && <small className="d-block">{formatted.time}</small>}<small className="d-block text-muted text-wrap">{text(row.StatusName || row.TaskManagementStatus)}</small></div>; } },
    ...(returnActions ? [{ title: "Actions", dataIndex: "ReturnActions", width: 180, fixed: "right", render: (_, row) => Number(row.StatusID) === 402 ? <div className="d-flex gap-1"><button className="btn btn-success btn-sm" onClick={() => resolveReturn(row, "accept")}>Accept</button>{(isAdmin || isDCUser) && <button className="btn btn-outline-danger btn-sm" onClick={() => resolveReturn(row, "decline")}>Decline</button>}</div> : <span className="text-muted">Resolved</span> }] : []),
  ], [allowPayment, isConsolidated]);

  const orderExportColumns = useMemo(() => [
    { title: "Order number", dataIndex: "OrderNO" },
    { title: "Vendor", dataIndex: "VendorName" },
    { title: "Vendor code", dataIndex: "VendorCode" },
    { title: "Receiver", dataIndex: "ReceiverContactName" },
    { title: "Receiver phone", dataIndex: "ReceiverContactPhone" },
    { title: "Customer street", dataIndex: "ReceiverStreetName" },
    { title: "Origin", dataIndex: "OriginDCName" },
    { title: "Origin code", dataIndex: "OriginDCCode" },
    { title: "Destination", dataIndex: "DestinationDCName" },
    { title: "Destination code", dataIndex: "DestinationDCCode" },
    { title: "Delivery type", dataIndex: "DeliveryType" },
    { title: "Service fee", dataIndex: "ServiceFee" },
    { title: "COD", dataIndex: "CODAmount" },
    { title: "Paid amount", dataIndex: "PaidAmount" },
    { title: "Payment transaction refs", dataIndex: "PaymentTransactionRefs" },
    { title: "Date", dataIndex: "DateAdded" },
  ], []);

  const consolidatedExportColumns = useMemo(() => [
    { title: "Handover code", dataIndex: "HandoverCode" },
    { title: "Batch date", dataIndex: "DateAdded" },
    { title: "Source DC", dataIndex: "FromDCName" },
    { title: "Source DC code", dataIndex: "FromDCCode" },
    { title: "Destination DC", dataIndex: "ToDCName" },
    { title: "Destination DC code", dataIndex: "ToDCCode" },
    { title: "Courier", dataIndex: "RiderName" },
    { title: "Packages", dataIndex: "TotalItems" },
    { title: "Cost", dataIndex: "CourierCost" },
    { title: "Cost per package", dataIndex: "CostPerPackage" },
    { title: "Created by", dataIndex: "CreatedByName" },
    { title: "Status", dataIndex: "StatusID", render: (value) => Number(value) === 3 ? "Received" : Number(value) === 1 ? "Pending Receipt" : "-" },
  ], []);

  const exportColumns = isConsolidated ? consolidatedExportColumns : orderExportColumns;

  const pdfColumns = useMemo(() => exportColumns.filter((column) => ![
    "Vendor code", "Receiver phone", "Origin code", "Destination code",
  ].includes(column.title)), [exportColumns]);

  const fetchAllDataForExport = async (onProgress) => {
    const pageSize = 1000;
    let page = 1;
    let allRows = [];
    let total = 0;

    do {
      const response = isConsolidated ? await getHandoverBatchList({
        pageNo: page,
        pageSize,
        search: searchTerm.trim() || undefined,
        statusIDs: "1,3",
        FromDCCode: navigationFilters.dcCodes || navigationFilters.dcCode || undefined,
        startDate: navigationFilters.startDate || undefined,
        endDate: navigationFilters.endDate || undefined,
        orderBy: "DateAdded",
        sortDir: "DESC",
      }) : await getShipmentOrders(dateOnly ? {
        pageNo: page,
        pageSize,
        checkSLA: false,
        searchTerm: searchTerm.trim() || undefined,
        vendorCode: isVendorOnly ? assignedVendorCode || undefined : navigationFilters.vendorCode || undefined,
        toDCCode: navigationFilters.dcCodes || navigationFilters.dcCode || undefined,
        startDate: navigationFilters.startDate || undefined,
        endDate: navigationFilters.endDate || undefined,
        orderBy: "DateAdded",
        sortDir: "DESC",
        forceRefresh: true,
        backgroundRefresh: false,
      } : {
        pageNo: page,
        pageSize,
        taskType,
        statusIDs: effectiveStatusIDs,
        checkSLA: false,
        searchTerm: searchTerm.trim() || undefined,
        vendorCode: isVendorOnly ? assignedVendorCode || undefined : navigationFilters.vendorCode || undefined,
        ...(["delivered", "completed"].includes(taskType)
          ? { toDCCode: navigationFilters.dcCodes || navigationFilters.dcCode || undefined }
          : { fromDCCode: navigationFilters.dcCodes || navigationFilters.dcCode || undefined }),
        startDate: navigationFilters.startDate || undefined,
        endDate: navigationFilters.endDate || undefined,
        orderBy: "DateAdded",
        sortDir: "DESC",
        forceRefresh: true,
        backgroundRefresh: false,
        indexedDBCache: false,
      });
      const pageRows = Array.isArray(response?.Data) ? response.Data : [];
      total = Number(response?.TotalCount || pageRows.length);
      allRows = allRows.concat(pageRows);
      onProgress?.(Math.min(allRows.length, total), total);
      if (!pageRows.length) break;
      page += 1;
    } while (allRows.length < total);

    return allRows;
  };

  return <div className="content">
    <div className="page-header">
      <div className="page-title"><h4>{title}</h4><h6>{description}</h6></div>
      {(allowExport || allowPayment) && (
        <ul className="table-top-head">
          {allowPayment && <li>
          </li>}
          {allowExport &&
          <TableExportIcons
            data={rows}
            columns={exportColumns}
            pdfColumns={pdfColumns}
            excelColumns={exportColumns}
            filename={title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "report"}
            title={title}
            fetchAllData={fetchAllDataForExport}
            pdfOrientation="landscape"
          />}
          <li>
            <button type="button" className="btn btn-link p-0 border-0" title="Refresh" aria-label={`Refresh ${title}`} disabled={loading} onClick={() => loadReport({ page: pagination.current, pageSize: pagination.pageSize, search: searchTerm, forceRefresh: true })}>
              <RotateCcw size={18} className={loading ? "fa-spin" : ""} />
            </button>
          </li>
        </ul>
      )}
    </div>
    <div className="card table-list-card">
      <div className="card-body">
        <div className="row g-2 align-items-end mb-3">
          <div className={returnActions ? "col-lg-7" : "col-lg-9"}><label className="form-label">Search</label><input className="form-control" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") loadReport({ page: 1, search: event.currentTarget.value }); }} placeholder={isConsolidated ? "Handover code, shipment no., source DC, or destination DC" : "Order number, vendor, customer, or DC"} /></div>
          {returnActions && <div className="col-lg-2"><label className="form-label">Status</label><select className="form-select" value={returnStatusFilter} onChange={(event) => setReturnStatusFilter(event.target.value)}><option value="pending">Pending</option><option value="all">All</option><option value="accepted">Accepted</option><option value="declined">Declined</option></select></div>}
          <div className="col-lg-3 d-flex gap-2"><button className="btn btn-primary flex-fill" onClick={() => loadReport({ page: 1, search: searchTerm })}>Search</button><button className="btn btn-outline-secondary" onClick={() => { setSearchTerm(""); loadReport({ page: 1, search: "" }); }}>Reset</button></div>
        </div>
        <Datatable
          className="table"
          columns={columns}
          dataSource={rows}
          rowKey={isConsolidated ? "HandoverCode" : "OrderNO"}
          rowSelection={false}
          expandable={isConsolidated ? {
            rowExpandable: (row) => Number(row.TotalItems || 0) > 0,
            expandedRowRender: (batch) => {
              const packageRows = Array.isArray(batch.Packages) ? batch.Packages : [];
              if (!packageRows.length) return <p className="text-muted m-3">No packages found in this batch.</p>;
              return <div className="table-responsive p-2"><table className="table table-sm align-middle mb-0"><thead><tr><th>Order number</th><th>Vendor</th><th>Customer</th><th>Status</th></tr></thead><tbody>{packageRows.map((item) => <tr key={item.OrderNO}><td><strong className="text-primary">{text(item.OrderNO)}</strong></td><td>{text(item.VendorName || item.VendorCode)}</td><td>{text(item.CustomerName)}</td><td>{text(item.StatusName)}</td></tr>)}</tbody></table></div>;
            },
          } : {
            rowExpandable: (row) => Boolean(row?.OrderNO),
            expandedRowRender: (order) => <OrderExpandedDetails order={order} />,
          }}
          loading={loading}
          scroll={{ x: isConsolidated ? 1950 : 1720 }}
          emptyTitle={emptyTitle}
          emptyDescription={`No ${isConsolidated ? "handover batches" : "orders"} match the selected filters.`}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["100", "500", "1000"],
            showQuickJumper: true,
            showTotal: (total) => `${total} ${isConsolidated ? "batches" : "orders"}`,
            onChange: (page, pageSize) => loadReport({ page, pageSize, search: searchTerm }),
          }}
        />
      </div>
    </div>
  </div>;
}
