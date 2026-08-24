"use client";

import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Trash2,
  Package,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Zap,
  Grid,
  FileText,
  ArrowRight,
} from "feather-icons-react";
import notify from "@/lib/toast";
import { Badge, Button, InputGroup, Form } from "react-bootstrap";
import { useShipment } from "@/hooks/useShipment";
import styles from "./BatchScanStep.module.scss";

/**
 * BatchScanStep — Step 2 of the handover batch creation wizard.
 *
 * Props:
 *   form          { fromDCCode, toDCCode, courierCode, notes }
 *   initialOrders Order[]   — pre-populate when returning from step 3
 *   onNext(orders)          — called with final order list when user proceeds
 *   onBack()                — called when user returns to step 1
 */
export default function BatchScanStep({ form, initialOrders = [], onNext, onBack, singlePage = false, onOrdersChange, allowedOrderNumbers = [] }) {
  const inputRef = useRef(null);
  const autoSubmitTimeoutRef = useRef(null);
  const submitLockRef = useRef(false);
  const { fetchShipmentOrder } = useShipment();

  const [selectedOrders, setSelectedOrders] = useState(initialOrders);
  const [scannedOrderNOs, setScannedOrderNOs] = useState(
    () => new Set(initialOrders.map((o) => o.OrderNO))
  );
  // Seed results from initialOrders so returning from step 3 shows prior scans
  const [scanResults, setScanResults] = useState(() =>
    initialOrders.map((o, i) => ({
      id: i,
      orderNO: o.OrderNO,
      recipient: o.ReceiverContactName || o.VendorName || "—",
      result: "success",
      time: "—",
    }))
  );
  const [scanInput, setScanInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const allowedOrders = useMemo(() => new Set(allowedOrderNumbers), [allowedOrderNumbers]);

  useEffect(() => {
    onOrdersChange?.(selectedOrders);
  }, [selectedOrders, onOrdersChange]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // --- Navigation ---

  const handleProceed = () => {
    if (selectedOrders.length === 0) {
      notify.error("Please scan at least one order for the batch");
      return;
    }
    onNext(selectedOrders);
  };

  // --- Scanning logic ---

  const cleanScannedValue = (value) => {
    if (!value) return "";
    let cleaned = value.trim();
    cleaned = cleaned.replace("https://collect.cossim.co.ke", "");
    cleaned = cleaned.replace("/track?trackingNumber=", "");
    cleaned = cleaned.split("&")[0];
    cleaned = cleaned.split("/")[0];
    return cleaned.trim();
  };

  const processBarcode = useCallback(
    async (manualValue = null) => {
      const orderNO = cleanScannedValue(manualValue || scanInput);

      // Synchronous lock — React state (processing) updates are batched/async,
      // so two near-simultaneous triggers (auto-submit timeout + scanner's Enter
      // keypress) can both read stale state and slip past a state-only guard.
      if (!orderNO || submitLockRef.current) return;
      submitLockRef.current = true;

      if (autoSubmitTimeoutRef.current) {
        clearTimeout(autoSubmitTimeoutRef.current);
        autoSubmitTimeoutRef.current = null;
      }

      setScanInput("");

      if (scannedOrderNOs.has(orderNO)) {
        setScanResults((prev) => [
          {
            id: Date.now(),
            orderNO,
            recipient: "—",
            result: "duplicate",
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
        submitLockRef.current = false;
        setTimeout(() => inputRef.current?.focus(), 50);
        return;
      }

      if (allowedOrders.size > 0 && !allowedOrders.has(orderNO)) {
        setScanResults((prev) => [{
          id: Date.now(),
          orderNO,
          recipient: "—",
          result: "error",
          message: "This order was not selected for consolidation",
          time: new Date().toLocaleTimeString(),
        }, ...prev]);
        submitLockRef.current = false;
        setTimeout(() => inputRef.current?.focus(), 50);
        return;
      }

      setProcessing(true);
      try {
        const response = await fetchShipmentOrder({ orderNO });
        const order = response?.Data || response?.data || response;

        if (!order || response?.Error) {
          setScanResults((prev) => [
            {
              id: Date.now(),
              orderNO,
              recipient: "—",
              result: "error",
              message: response?.Message || "Package not found",
              time: new Date().toLocaleTimeString(),
            },
            ...prev,
          ]);
          return;
        }

        setScannedOrderNOs((prev) => new Set([...prev, order.OrderNO]));
        setSelectedOrders((prev) => [...prev, order]);
        setScanResults((prev) => [
          {
            id: Date.now(),
            orderNO: order.OrderNO,
            recipient: order.ReceiverContactName || order.VendorName || "—",
            result: "success",
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
      } catch (err) {
        setScanResults((prev) => [
          {
            id: Date.now(),
            orderNO,
            recipient: "—",
            result: "error",
            message: err?.message || "An error occurred",
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
      } finally {
        setProcessing(false);
        submitLockRef.current = false;
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [scanInput, scannedOrderNOs, fetchShipmentOrder, allowedOrders]
  );

  const handleRemoveScanned = useCallback((orderNO) => {
    setSelectedOrders((prev) => prev.filter((o) => o.OrderNO !== orderNO));
    setScannedOrderNOs((prev) => {
      const next = new Set(prev);
      next.delete(orderNO);
      return next;
    });
    setScanResults((prev) =>
      prev.filter((r) => !(r.orderNO === orderNO && r.result === "success"))
    );
  }, []);

  const handleUndoLast = () => {
    const last = scanResults.find((r) => r.result === "success");
    if (last) handleRemoveScanned(last.orderNO);
  };

  const handleClearAll = () => {
    setScanResults([]);
    setSelectedOrders([]);
    setScannedOrderNOs(new Set());
  };

  const handleScanInputChange = (e) => {
    const v = cleanScannedValue(e.target.value);
    setScanInput(v);
    if (v.length >= 20 && !processing) {
      if (autoSubmitTimeoutRef.current) clearTimeout(autoSubmitTimeoutRef.current);
      autoSubmitTimeoutRef.current = setTimeout(() => {
        autoSubmitTimeoutRef.current = null;
        processBarcode(v);
      }, 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Scanner's Enter keystroke arrives right after the last character —
      // cancel any pending length-based auto-submit so the scan isn't processed twice.
      if (autoSubmitTimeoutRef.current) {
        clearTimeout(autoSubmitTimeoutRef.current);
        autoSubmitTimeoutRef.current = null;
      }
      processBarcode();
    }
  };

  // --- Derived state ---

  const failCount = scanResults.filter((r) => r.result === "error").length;
  const dupCount = scanResults.filter((r) => r.result === "duplicate").length;
  const lastSuccessfulScan = scanResults.find((r) => r.result === "success") || null;

  const filteredResults = useMemo(() => {
    switch (activeFilter) {
      case "added":
        return scanResults.filter((r) => r.result === "success");
      case "failed":
        return scanResults.filter((r) => r.result === "error");
      case "duplicate":
        return scanResults.filter((r) => r.result === "duplicate");
      default:
        return scanResults;
    }
  }, [scanResults, activeFilter]);

  const resultBadge = (r) =>
    r === "success" ? "success" : r === "duplicate" ? "warning" : "danger";

  const resultLabel = (r) =>
    r === "success" ? "Added" : r === "duplicate" ? "Duplicate" : "Failed";

  // Strip DC code prefix: "DC001 - Main DC (Nairobi)" → "Main DC (Nairobi)"
  const fromDCDisplayName =
    form.fromDCCode?.label?.split(" - ").slice(1).join(" - ") || "—";
  const toDCDisplayName =
    form.toDCCode?.label?.split(" - ").slice(1).join(" - ") || "—";
  const courierDisplayName = form.courierCode?.label?.split(" - ")[0] || "—";

  return (
    <div className={styles.scanStep}>
      <section className={styles.contextBar} aria-label="Batch summary">
        <div className={styles.contextDetails}>
          <div className={styles.contextItem}>
            <span className={`${styles.iconBox} ${styles.iconOrange}`}>
              <FileText size={17} />
            </span>
            <div>
              <div className={styles.contextLabel}>Batch type</div>
              <div className={styles.contextValue}>Handover batch</div>
            </div>
          </div>

          <div className={`${styles.contextItem} ${styles.routeItem}`}>
            <span className={`${styles.iconBox} ${styles.iconBlue}`}>
              <Grid size={17} />
            </span>
            <div className={styles.contextContent}>
              <div className={styles.contextLabel}>Handover route</div>
              <div className={`${styles.contextValue} ${styles.routeValue}`}>
                <span>{fromDCDisplayName}</span>
                <ArrowRight size={14} className={styles.routeArrow} />
                <span>{toDCDisplayName}</span>
              </div>
            </div>
          </div>

          <div className={styles.contextItem}>
            <span className={`${styles.iconBox} ${styles.iconGreen}`}>
              <User size={17} />
            </span>
            <div>
              <div className={styles.contextLabel}>Assigned courier</div>
              <div className={styles.contextValue}>{courierDisplayName}</div>
            </div>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={`${styles.statValue} text-success`}>
              {selectedOrders.length}
            </div>
            <div className={styles.statLabel}>Added</div>
          </div>
          <div className={styles.stat}>
            <div className={`${styles.statValue} text-danger`}>{failCount}</div>
            <div className={styles.statLabel}>Failed</div>
          </div>
          <div className={styles.stat}>
            <div className={`${styles.statValue} text-warning`}>{dupCount}</div>
            <div className={styles.statLabel}>Duplicates</div>
          </div>
        </div>
      </section>

      <div className={styles.workspace}>
        <section className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <h6 className={styles.panelTitle}>Scan an order</h6>
              <p className={styles.panelSubtitle}>Barcode scanner or manual entry</p>
            </div>
            <Zap size={18} className="text-primary" />
          </header>

          <div className={styles.scannerBody}>
            <InputGroup className={styles.scanInput}>
              <Form.Control
                ref={inputRef}
                type="text"
                placeholder="Scan or enter order number"
                value={scanInput}
                onChange={handleScanInputChange}
                onKeyDown={handleKeyDown}
                disabled={processing}
                autoComplete="off"
                aria-label="Order number"
              />
              {scanInput && (
                <Button
                  variant="outline-secondary"
                  onClick={() => setScanInput("")}
                  tabIndex={-1}
                  aria-label="Clear order number"
                >
                  ×
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => processBarcode()}
                disabled={!scanInput.trim() || processing}
              >
                {processing ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  <>
                    <Zap size={14} className="me-1" />
                    Scan
                  </>
                )}
              </Button>
            </InputGroup>

            <div className={styles.scanHint}>
              <Zap size={11} />
              Auto-scans at 20 characters or when you press Enter
            </div>

            <div className={styles.scannerStatus}>
              <span
                className={`${styles.statusDot} ${
                  processing ? styles.statusDotBusy : ""
                }`}
              />
              <div>
                <div className={styles.statusTitle}>Scanner ready</div>
                <div className={styles.statusText}>
                  {processing ? "Checking this order…" : "Waiting for the next barcode"}
                </div>
              </div>
            </div>

            {lastSuccessfulScan && (
              <div className={styles.lastScan}>
                <div className={styles.lastScanMeta}>
                  <span>Last order added</span>
                  <span>{lastSuccessfulScan.time}</span>
                </div>
                <div className={styles.lastScanOrder}>{lastSuccessfulScan.orderNO}</div>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 d-flex align-items-center gap-1 text-decoration-none"
                  onClick={handleUndoLast}
                >
                  <RotateCcw size={12} />
                  Undo last scan
                </Button>
              </div>
            )}

            <div className={styles.tips}>
              <Package size={16} className="flex-shrink-0 mt-1" />
              <div>
                <strong className="d-block mb-1">Keep the scanner focused</strong>
                Scan labels continuously. Valid orders are added immediately and
                duplicates are flagged without interrupting the session.
              </div>
            </div>
          </div>
        </section>

        <section className={styles.panel}>
          <header className={`${styles.panelHeader} ${styles.resultsHeader}`}>
            <div>
              <h6 className={styles.panelTitle}>Scanned orders</h6>
              <p className={styles.panelSubtitle}>
                Review everything captured in this session
              </p>
            </div>
            {scanResults.length > 0 && (
              <Button
                variant="link"
                size="sm"
                className="text-danger p-0 d-flex align-items-center gap-1 text-decoration-none"
                onClick={handleClearAll}
              >
                <Trash2 size={13} />
                Clear all
              </Button>
            )}
          </header>

          <div className={styles.filters} role="tablist" aria-label="Scan result filters">
            {[
              { key: "all", label: "All", count: scanResults.length },
              { key: "added", label: "Added", count: selectedOrders.length },
              { key: "failed", label: "Failed", count: failCount },
              { key: "duplicate", label: "Duplicates", count: dupCount },
            ].map((tab) => (
              <Button
                key={tab.key}
                size="sm"
                className={`${styles.filterButton} ${
                  activeFilter === tab.key ? styles.filterButtonActive : ""
                }`}
                onClick={() => setActiveFilter(tab.key)}
                role="tab"
                aria-selected={activeFilter === tab.key}
              >
                {tab.label}
                <span className={styles.filterCount}>{tab.count}</span>
              </Button>
            ))}
          </div>

          <div className={styles.resultsTable}>
            {filteredResults.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Package size={30} />
                </div>
                <div className={styles.emptyTitle}>
                  {scanResults.length === 0 ? "No orders scanned yet" : "Nothing to show"}
                </div>
                <p className={styles.emptyText}>
                  {scanResults.length === 0
                    ? "Scan the first order to start building this handover batch."
                    : `There are no ${activeFilter} scan results in this session.`}
                </p>
              </div>
            ) : (
              <>
                <div className={styles.tableHeader} aria-hidden="true">
                  <span />
                  <span>Order number</span>
                  <span>Customer / Vendor</span>
                  <span>Status</span>
                  <span>Time</span>
                  <span />
                </div>

                {filteredResults.map((entry) => (
                  <div key={entry.id} className={styles.resultRow}>
                    <span className={styles.resultIcon}>
                      {entry.result === "success" ? (
                        <CheckCircle size={16} color="#198754" />
                      ) : entry.result === "duplicate" ? (
                        <Clock size={16} color="#fd7e14" />
                      ) : (
                        <XCircle size={16} color="#dc3545" />
                      )}
                    </span>
                    <span className={styles.orderNumber}>{entry.orderNO}</span>
                    <span className={styles.recipient} title={entry.recipient}>
                      {entry.recipient}
                    </span>
                    <span>
                      <Badge bg={resultBadge(entry.result)} className="rounded-pill">
                        {resultLabel(entry.result)}
                      </Badge>
                    </span>
                    <span className={styles.time}>{entry.time}</span>
                    <span>
                      {entry.result === "success" && (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 text-danger"
                          title="Remove from batch"
                          aria-label={`Remove ${entry.orderNO} from batch`}
                          onClick={() => handleRemoveScanned(entry.orderNO)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </span>
                    {entry.message && (
                      <span className={styles.resultMessage}>{entry.message}</span>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </section>
      </div>

      {!singlePage && <footer className={styles.footer}>
        <Button
          variant="outline-secondary"
          onClick={onBack}
          className="d-flex align-items-center gap-2"
        >
          <ChevronLeft size={17} />
          Back to configuration
        </Button>

        <div className={styles.footerHint}>
          {selectedOrders.length === 0
            ? "Add at least one order to continue"
            : `${selectedOrders.length} order${
                selectedOrders.length === 1 ? "" : "s"
              } ready for review`}
        </div>

        <Button
          variant="primary"
          onClick={handleProceed}
          disabled={selectedOrders.length === 0}
          className="d-flex align-items-center gap-2 px-4"
        >
          Review batch
          {selectedOrders.length > 0 && (
            <Badge bg="light" text="dark" pill>
              {selectedOrders.length}
            </Badge>
          )}
          <ChevronRight size={17} />
        </Button>
      </footer>}
    </div>
  );
}
