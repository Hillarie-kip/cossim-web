"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Datatable from "@/core/pagination/datatable";
import TableExportIcons from "@/components/TableExportIcons";
import OrderExpandedDetails from "@/components/OrderExpandedDetails";
import { getHandoverBatchList, getHandoverReceiptUrl, getShipmentOrders } from "@/services/shipmentService";
import notify from "@/lib/toast";
import { useGlobalFilters } from "@/contexts/GlobalFiltersContext";

const money = (value) => Number(value || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const text = (value) => value || "-";

export default function DeliveredOrdersTableReport({
  title = "Delivered Orders",
  description = "Delivered shipment orders",
  taskType = "delivered",
  statusIDs = "303",
  allowPayment = false,
  emptyTitle = "No delivered orders found",
  dateOnly = false,
  allowExport = false,
} = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 1000, total: 0 });
  const { filters: navigationFilters } = useGlobalFilters();
  const isConsolidated = taskType === "consolidated";

  const loadReport = async ({
    page = pagination.current,
    pageSize = pagination.pageSize,
    search = searchTerm,
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
        })
        : await getShipmentOrders(dateOnly ? {
          pageNo: page,
          pageSize,
          checkSLA: false,
          vendorCode: navigationFilters.vendorCode || undefined,
          toDCCode: navigationFilters.dcCodes || navigationFilters.dcCode || undefined,
          startDate: navigationFilters.startDate || undefined,
          endDate: navigationFilters.endDate || undefined,
        } : {
          pageNo: page,
          pageSize,
          taskType,
          statusIDs,
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

  useEffect(() => { loadReport({ page: 1, pageSize: 1000 }); }, [navigationFilters.startDate, navigationFilters.endDate, navigationFilters.vendorCode, navigationFilters.dcCode, navigationFilters.dcCodes]);

  const columns = useMemo(() => isConsolidated ? [
    { title: "Handover code", dataIndex: "HandoverCode", width: 220, render: (value) => <strong className="text-primary">{text(value)}</strong> },
    { title: "Source DC", dataIndex: "FromDCName", width: 210, render: (_, row) => <div><strong>{text(row.FromDCName || row.FromDCCode)}</strong><small className="d-block text-muted">{text(row.FromDCCode)}</small></div> },
    { title: "Destination DC", dataIndex: "ToDCName", width: 210, render: (_, row) => <div><strong>{text(row.ToDCName || row.ToDCCode)}</strong><small className="d-block text-muted">{text(row.ToDCCode)}</small></div> },
    { title: "Courier", dataIndex: "RiderName", width: 190, render: (_, row) => <div><strong>{text(row.RiderName || "Unassigned")}</strong><small className="d-block text-muted">{text(row.RiderUserCode)}</small></div> },
    { title: "Packages", dataIndex: "TotalItems", width: 120, align: "center", render: (value) => `${Number(value || 0)} package${Number(value || 0) === 1 ? "" : "s"}` },
    { title: "Cost", dataIndex: "CourierCost", width: 140, align: "right", render: (value) => value == null ? "-" : `KES ${money(value)}` },
    { title: "Uploaded image", dataIndex: "ReceiptImageID", width: 150, align: "center", render: (imageID) => imageID ? <a className="btn btn-sm btn-outline-primary" href={getHandoverReceiptUrl(imageID)} target="_blank" rel="noreferrer">View image</a> : "-" },
    { title: "Status", dataIndex: "StatusID", width: 150, render: (value) => Number(value) === 3 ? "Received" : Number(value) === 1 ? "Pending Receipt" : "-" },
    { title: "Created by", dataIndex: "CreatedByName", width: 190, render: (_, row) => <div><strong>{text(row.CreatedByName || row.CreatedBy || row.ConfirmedBy)}</strong>{row.CreatedByName && <small className="d-block text-muted">{text(row.CreatedBy)}</small>}</div> },
    { title: "Date created", dataIndex: "DateAdded", width: 180, render: (value) => value ? new Date(value).toLocaleString("en-GB") : "-" },
  ] : [
    { title: "Order number", dataIndex: "OrderNO", width: 210, render: (value) => <strong className="text-primary">{text(value)}</strong> },
    { title: "Vendor", dataIndex: "VendorName", width: 210, render: (_, row) => <div><strong>{text(row.VendorName || row.SenderCompanyName)}</strong><small className="d-block text-muted">{text(row.VendorCode)}</small></div> },
    { title: "Receiver", dataIndex: "ReceiverContactName", width: 210, render: (_, row) => <div><strong>{text(row.ReceiverContactName)}</strong><small className="d-block text-muted">{text(row.ReceiverContactPhone)}</small></div> },
    { title: "Origin", dataIndex: "OriginDCName", width: 180, render: (_, row) => text(row.OriginDCName || row.OriginDCCode) },
    { title: "Destination", dataIndex: "DestinationDCName", width: 180, render: (_, row) => text(row.DestinationDCName || row.DestinationDCCode) },
    { title: "Delivery type", dataIndex: "DeliveryType", width: 150, render: text },
    { title: "Service fee", dataIndex: "ServiceFee", width: 140, align: "right", render: (value) => `KES ${money(value)}` },
    { title: "COD", dataIndex: "CODAmount", width: 140, align: "right", render: (value) => `KES ${money(value)}` },
    { title: "Date", dataIndex: "DateAdded", width: 180, render: (value) => value ? new Date(value).toLocaleString("en-GB") : "-" },
  ], [allowPayment, isConsolidated]);

  const exportColumns = useMemo(() => [
    { title: "Order number", dataIndex: "OrderNO" },
    { title: "Vendor", dataIndex: "VendorName" },
    { title: "Vendor code", dataIndex: "VendorCode" },
    { title: "Receiver", dataIndex: "ReceiverContactName" },
    { title: "Receiver phone", dataIndex: "ReceiverContactPhone" },
    { title: "Origin", dataIndex: "OriginDCName" },
    { title: "Origin code", dataIndex: "OriginDCCode" },
    { title: "Destination", dataIndex: "DestinationDCName" },
    { title: "Destination code", dataIndex: "DestinationDCCode" },
    { title: "Delivery type", dataIndex: "DeliveryType" },
    { title: "Service fee", dataIndex: "ServiceFee" },
    { title: "COD", dataIndex: "CODAmount" },
    { title: "Date", dataIndex: "DateAdded" },
  ], []);

  const pdfColumns = useMemo(() => exportColumns.filter((column) => ![
    "Vendor code", "Receiver phone", "Origin code", "Destination code",
  ].includes(column.title)), [exportColumns]);

  const fetchAllDataForExport = async (onProgress) => {
    const pageSize = 1000;
    let page = 1;
    let allRows = [];
    let total = 0;

    do {
      const response = await getShipmentOrders({
        pageNo: page,
        pageSize,
        checkSLA: false,
        vendorCode: navigationFilters.vendorCode || undefined,
        toDCCode: navigationFilters.dcCodes || navigationFilters.dcCode || undefined,
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
            <Link className="btn btn-primary btn-sm text-nowrap" href="/admin/payment-reconciliation">Reconcile Payments</Link>
          </li>}
          {allowExport &&
          <TableExportIcons
            data={rows}
            columns={exportColumns}
            pdfColumns={pdfColumns}
            excelColumns={exportColumns}
            filename="received-orders"
            title="Received Orders"
            fetchAllData={fetchAllDataForExport}
            pdfOrientation="landscape"
          />}
        </ul>
      )}
    </div>
    <div className="card table-list-card">
      <div className="card-body">
        {!dateOnly && <div className="row g-2 align-items-end mb-3">
          <div className="col-lg-9"><label className="form-label">Search</label><input className="form-control" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") loadReport({ page: 1, search: event.currentTarget.value }); }} placeholder={isConsolidated ? "Handover code, shipment no., source DC, or destination DC" : "Order number, vendor, customer, or DC"} /></div>
          <div className="col-lg-3 d-flex gap-2"><button className="btn btn-primary flex-fill" onClick={() => loadReport({ page: 1, search: searchTerm })}>Search</button><button className="btn btn-outline-secondary" onClick={() => { setSearchTerm(""); loadReport({ page: 1, search: "" }); }}>Reset</button></div>
        </div>}
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
          scroll={{ x: isConsolidated ? 1780 : 1750 }}
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
