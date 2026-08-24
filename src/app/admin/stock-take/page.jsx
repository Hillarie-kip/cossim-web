"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, Building2, PackageSearch, RefreshCw, Search } from "lucide-react";
import Datatable from "@/core/pagination/datatable";
import { useGlobalFilters } from "@/contexts/GlobalFiltersContext";
import { getInventory } from "@/services/inventoryService";
import notify from "@/lib/toast";
import styles from "./stock-take.module.scss";
import StockTakeWorkflow from "@/components/inventory/StockTakeWorkflow";

const number = (value) => Number(value || 0).toLocaleString("en-KE");
const money = (value) => `KES ${Number(value || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateTime = (value) => value ? new Date(value).toLocaleString("en-GB") : "-";
const productRowKey = (row) => JSON.stringify([
  row.ProductCode,
  row.ProductName,
  row.VendorCode,
  row.DCCode,
]);

function InventoryOverview() {
  const { filters } = useGlobalFilters();
  const [view, setView] = useState("dc");
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 100, total: 0 });

  const applyResponse = useCallback((response, page, pageSize) => {
    setRows(Array.isArray(response?.Data) ? response.Data : []);
    setPagination({ current: Number(response?.PageNO || page), pageSize: Number(response?.PageSize || pageSize), total: Number(response?.TotalCount || 0) });
  }, []);

  const loadInventory = useCallback(async ({ nextView = view, page = 1, pageSize = pagination.pageSize, searchTerm = appliedSearch, silent = false } = {}) => {
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      const params = { view: nextView, pageNo: page, pageSize, searchTerm, dcCode: filters.dcCodes || filters.dcCode || undefined, vendorCode: filters.vendorCode || undefined };
      const response = await getInventory({ ...params, onBackgroundRefresh: (fresh) => applyResponse(fresh, page, pageSize) });
      applyResponse(response, page, pageSize);
    } catch (error) {
      notify.error(error.message || "Failed to load inventory.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [view, pagination.pageSize, appliedSearch, filters.dcCode, filters.dcCodes, filters.vendorCode, applyResponse]);

  useEffect(() => { loadInventory({ page: 1 }); }, [view, filters.dcCode, filters.dcCodes, filters.vendorCode]);

  const switchView = (nextView) => {
    if (nextView === view) return;
    setView(nextView);
    setRows([]);
    setPagination((current) => ({ ...current, current: 1, total: 0 }));
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const nextSearch = search.trim();
    setAppliedSearch(nextSearch);
    loadInventory({ page: 1, searchTerm: nextSearch });
  };

  const dcColumns = useMemo(() => [
    { title: "Distribution centre", dataIndex: "DCName", width: 250, render: (value) => <strong>{value || "Unassigned distribution centre"}</strong> },
    { title: "Opening stock", dataIndex: "OpeningStock", width: 125, align: "right", render: (value) => <strong>{number(value)}</strong> },
    { title: "Orders", dataIndex: "TotalOrders", width: 100, align: "right", render: number },
    { title: "Items", dataIndex: "TotalItems", width: 100, align: "right", render: (value) => <strong>{number(value)}</strong> },
    { title: "Products", dataIndex: "UniqueProducts", width: 110, align: "right", render: number },
    { title: "Received", dataIndex: "ReceivedItems", width: 110, align: "right", render: number },
    { title: "Assigned", dataIndex: "AssignedItems", width: 110, align: "right", render: number },
    { title: "Attempted", dataIndex: "AttemptedItems", width: 110, align: "right", render: number },
    { title: "Payment pending", dataIndex: "PaymentPendingItems", width: 145, align: "right", render: number },
    { title: "Stock value", dataIndex: "StockValue", width: 150, align: "right", render: money },
    { title: "Last movement", dataIndex: "LastMovementDate", width: 180, render: dateTime },
  ], []);

  const productColumns = useMemo(() => [
    { title: "Product", dataIndex: "ProductName", width: 250, render: (_, row) => <div><strong>{row.ProductName || "-"}</strong><small className="d-block text-muted">{row.ProductCode}</small></div> },
    { title: "Vendor", dataIndex: "VendorName", width: 200, render: (_, row) => <div>{row.VendorName || "-"}<small className="d-block text-muted">{row.VendorCode}</small></div> },
    { title: "Distribution centre", dataIndex: "DCName", width: 210, render: (value) => value || "Unassigned distribution centre" },
    { title: "Quantity", dataIndex: "Quantity", width: 110, align: "right", render: (value) => <strong>{number(value)}</strong> },
    { title: "Unit value", dataIndex: "UnitValue", width: 140, align: "right", render: money },
    { title: "Stock value", dataIndex: "StockValue", width: 150, align: "right", render: money },
    { title: "Handling", dataIndex: "IsFragile", width: 145, render: (_, row) => <div className={styles.tags}>{row.IsFragile && <span>Fragile</span>}{row.IsPerishable && <span>Perishable</span>}{!row.IsFragile && !row.IsPerishable && "Standard"}</div> },
    { title: "Last received", dataIndex: "LastReceivedDate", width: 180, render: dateTime },
  ], []);

  const visibleItems = rows.reduce((sum, row) => sum + Number(view === "dc" ? row.TotalItems : row.Quantity || 0), 0);
  const visibleValue = rows.reduce((sum, row) => sum + Number(row.StockValue || 0), 0);

  return <main className={styles.page}><section className={styles.panel}>
    <header className={styles.header}><div><small>OPERATIONS</small><h1>Inventory</h1><p>Current shipment stock held across distribution centres.</p></div><div className={styles.headerActions}><Link href="/admin/stock-take" className={styles.stockTakeButton}><PackageSearch size={15} />Do Stock Take</Link><button className={styles.refresh} onClick={() => loadInventory({ page: pagination.current, silent: true })} disabled={refreshing}><RefreshCw size={15} className={refreshing ? styles.spinning : ""} />Refresh</button></div></header>
    <div className={styles.toolbar}><div className={styles.viewSwitch} role="tablist" aria-label="Inventory view"><button className={view === "dc" ? styles.active : ""} onClick={() => switchView("dc")}><Building2 size={16} />DC Summary</button><button className={view === "product" ? styles.active : ""} onClick={() => switchView("product")}><Boxes size={16} />Product View</button></div><form className={styles.search} onSubmit={submitSearch}><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={view === "dc" ? "Search DC name or code" : "Search product, vendor, or DC"} /><button type="submit">Search</button></form></div>
    <div className={styles.metrics}><div><PackageSearch /><span><small>{view === "dc" ? "Distribution centres" : "Product locations"}</small><strong>{number(pagination.total)}</strong></span></div><div><Boxes /><span><small>Items on this page</small><strong>{number(visibleItems)}</strong></span></div><div><span className={styles.currency}>KES</span><span><small>Value on this page</small><strong>{money(visibleValue)}</strong></span></div></div>
    <Datatable className="table" columns={view === "dc" ? dcColumns : productColumns} dataSource={rows} rowKey={(row) => view === "dc" ? row.DCCode : productRowKey(row)} loading={loading} scroll={{ x: view === "dc" ? 1450 : 1400, y: 590 }} emptyTitle={view === "dc" ? "No distribution centre inventory found" : "No product inventory found"} emptyDescription="No current stock matches the selected filters." pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true, pageSizeOptions: ["50", "100", "500", "1000"], showQuickJumper: true, showTotal: (total) => `${number(total)} records`, onChange: (page, pageSize) => loadInventory({ page, pageSize }) }} />
  </section></main>;
}

export default function InventoryRoute() {
  const pathname = usePathname();
  return pathname === "/admin/stock-take" ? <StockTakeWorkflow /> : <InventoryOverview />;
}
