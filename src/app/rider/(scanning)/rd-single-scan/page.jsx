"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, Row, Col, Badge, Button, Form, Alert, InputGroup } from "react-bootstrap";
import {
  Maximize,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MapPin,
  RotateCcw,
  AlertCircle,
  ArrowRight,
  Trash2,
} from "feather-icons-react";

import SSRSelect from "@/components/SSRSelect";
import { useUser } from "@/hooks/useUser";
import { useShipment } from "@/hooks/useShipment";
import CameraScanInput from "@/components/CameraScanInput";

export default function RiderSingleScan() {
  const inputRef = useRef(null);
  const autoSubmitTimeoutRef = useRef(null);
  const submitLockRef = useRef(false);
  const { user } = useUser();
  const { fetchShipmentOrder, handleUpdateShipmentStatus, fetchShipmentOrderStatus, orderStatuses } = useShipment();

  const [scanInput, setScanInput] = useState("");
  const [resolving, setResolving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resolvedOrder, setResolvedOrder] = useState(null);
  const [resolveError, setResolveError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [notes, setNotes] = useState("");
  const [sessionLog, setSessionLog] = useState([]);

  const riderCode = user?.UserCode || "";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    fetchShipmentOrderStatus();
  }, [fetchShipmentOrderStatus]);

 const cleanScannedValue = (value) => {
  if (!value) return "";

  let cleaned = value.trim();

  cleaned = cleaned.replace("https://collect.cossim.co.ke", "");

  cleaned = cleaned.replace("/track?trackingNumber=", "");

  cleaned = cleaned.split("&")[0];
  cleaned = cleaned.split("/")[0];

  return cleaned.trim();
};

  const transitionOptions =
    resolvedOrder?.StatusTransitionArray?.map((t) => ({
      value: t.toOrderStatusID,
      label: t.actionName,
      transition: t,
    })) || [];

  const globalStatusOptions =
    orderStatuses?.map((s) => ({
      value: s.orderStatusID,
      label: s.statusName,
      isGlobal: true,
    })) || [];

  const statusOptions =
    transitionOptions.length > 0 ? transitionOptions : globalStatusOptions;

  const resetForm = useCallback(() => {
    setScanInput("");
    setResolvedOrder(null);
    setResolveError(null);
    setSelectedStatus(null);
    setNotes("");

    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleScan = useCallback(
    async (manualValue = null) => {
      const orderNO = cleanScannedValue(manualValue || scanInput);

      // Synchronous lock — React state (resolving) updates are batched/async,
      // so two near-simultaneous triggers (auto-submit timeout + scanner's Enter
      // keypress) can both read stale state and slip past a state-only guard.
      if (!orderNO || submitLockRef.current) return;
      submitLockRef.current = true;

      if (autoSubmitTimeoutRef.current) {
        clearTimeout(autoSubmitTimeoutRef.current);
        autoSubmitTimeoutRef.current = null;
      }

      setScanInput(orderNO);
      setResolving(true);
      setResolvedOrder(null);
      setResolveError(null);
      setSelectedStatus(null);
      setNotes("");

      try {
        const response = await fetchShipmentOrder({ orderNO });
        const order = response?.Data || response?.data || response;

        if (!order || response?.Error) {
          setResolveError(
            response?.Message || "Package not found. Check the barcode and try again."
          );
          return;
        }

        if (riderCode && order.RiderUserCode && order.RiderUserCode !== riderCode) {
          setResolveError("This package is not assigned to you.");
          return;
        }

        setResolvedOrder(order);
      } catch (err) {
        setResolveError(err?.message || "Failed to resolve package. Try again.");
      } finally {
        setResolving(false);
        submitLockRef.current = false;
      }
    },
    [scanInput, fetchShipmentOrder, riderCode]
  );

  const handleScanInputChange = (e) => {
    const cleanedValue = cleanScannedValue(e.target.value);

    setScanInput(cleanedValue);

    if (cleanedValue.length >= 20 && !resolving && !resolvedOrder) {
      if (autoSubmitTimeoutRef.current) {
        clearTimeout(autoSubmitTimeoutRef.current);
      }

      autoSubmitTimeoutRef.current = setTimeout(() => {
        autoSubmitTimeoutRef.current = null;
        handleScan(cleanedValue);
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

      handleScan();
    }
  };

  const handleUpdateStatus = useCallback(
    async (e) => {
      e.preventDefault();

      if (!resolvedOrder || !selectedStatus) return;

      setSubmitting(true);

      try {
        const payload = {
          statusID: selectedStatus.value,
          orderNO: resolvedOrder.OrderNO,
          notes,
          riderCode,
          dcCode: resolvedOrder.OriginDCCode || resolvedOrder.DestinationDCCode,
        };

        const response = await handleUpdateShipmentStatus(payload);
        const failed = !!response?.Error;

        setSessionLog((prev) => [
          {
            id: Date.now(),
            orderNO: resolvedOrder.OrderNO,
            recipient: resolvedOrder.ReceiverContactName || "Customer",
            statusLabel: selectedStatus.label,
            result: failed ? "error" : "success",
            message: failed ? response?.Message || "Update failed" : "",
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);

        if (!failed) resetForm();
      } catch (err) {
        setSessionLog((prev) => [
          {
            id: Date.now(),
            orderNO: resolvedOrder.OrderNO,
            recipient: resolvedOrder.ReceiverContactName || "Customer",
            statusLabel: selectedStatus.label,
            result: "error",
            message: err?.message || "Status update failed",
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
      } finally {
        setSubmitting(false);
      }
    },
    [resolvedOrder, selectedStatus, notes, riderCode, handleUpdateShipmentStatus, resetForm]
  );

  const successCount = sessionLog.filter((e) => e.result === "success").length;
  const failCount = sessionLog.filter((e) => e.result === "error").length;

  return (
    <div className="content">
      <div className="page-header mb-4">
        <div className="add-item d-flex">
          <div className="page-title">
            <h4 className="fw-bold d-flex align-items-center gap-2">
              <Maximize size={20} className="text-primary" /> Single Scan
            </h4>
            <h6 className="text-muted">Scan a package and update its delivery status</h6>
          </div>
        </div>

        <Button variant="outline-secondary" size="sm" className="rounded-pill" onClick={resetForm}>
          <RotateCcw size={13} className="me-1" /> Reset
        </Button>
      </div>

      <Row className="g-4">
        <Col lg={7}>
          <Card className="border-0 shadow-sm rounded-3 mb-4">
            <Card.Header className="bg-transparent border-bottom px-4 pt-4 pb-3">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary rounded-circle" style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                  1
                </span>
                <h6 className="fw-semibold mb-0">Scan Package</h6>
              </div>
            </Card.Header>

            <Card.Body className="p-4">
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">
                  <Maximize size={16} className="text-primary" />
                </InputGroup.Text>

                <CameraScanInput onScan={setScanInput}>{({ onFocus }) => <Form.Control
                  ref={inputRef}
                  type="text"
                  placeholder="Scan barcode or type order number, then press Enter…"
                  value={scanInput}
                  onChange={handleScanInputChange}
                  onFocus={onFocus}
                  onKeyDown={handleKeyDown}
                  disabled={resolving || !!resolvedOrder}
                  className="border-start-0 py-2"
                  autoComplete="off"
                />}</CameraScanInput>

                <Button
                  variant="primary"
                  onClick={() => handleScan()}
                  disabled={!scanInput.trim() || resolving || !!resolvedOrder}
                  style={{ minWidth: 110 }}
                >
                  {resolving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Resolving…
                    </>
                  ) : (
                    <>
                      Resolve <ArrowRight size={13} className="ms-1" />
                    </>
                  )}
                </Button>
              </InputGroup>

              <small className="text-muted mt-2 d-block">
                Auto-resolves when code reaches 20 characters or scanner sends Enter.
              </small>

              {resolveError && (
                <Alert variant="danger" className="mt-3 mb-0 py-2 d-flex align-items-center gap-2">
                  <XCircle size={15} className="flex-shrink-0" /> {resolveError}
                </Alert>
              )}
            </Card.Body>
          </Card>

          {resolvedOrder && (
            <Card className="border-0 shadow-sm rounded-3 mb-4" style={{ borderLeft: "4px solid #198754" }}>
              <Card.Header className="bg-transparent border-bottom px-4 pt-4 pb-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-success rounded-circle" style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                      2
                    </span>
                    <h6 className="fw-semibold mb-0">Confirm &amp; Update Status</h6>
                  </div>

                  <Button variant="link" size="sm" className="text-muted p-0" onClick={resetForm}>
                    <RotateCcw size={13} className="me-1" /> Scan different package
                  </Button>
                </div>
              </Card.Header>

              <Card.Body className="p-4">
                <div className="rounded-3 p-3 mb-4 bg-light">
                  <Row className="g-2 align-items-center">
                    <Col xs="auto">
                      <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                        <Package size={18} className="text-primary" />
                      </div>
                    </Col>

                    <Col>
                      <div className="fw-bold">{resolvedOrder.OrderNO}</div>

                      <div className="small text-muted">
                        <User size={11} className="me-1" />
                        {resolvedOrder.ReceiverContactName || "—"}
                        {resolvedOrder.ReceiverContactPhone && <> · {resolvedOrder.ReceiverContactPhone}</>}
                      </div>

                      {resolvedOrder.ReceiverCity && (
                        <div className="small text-muted">
                          <MapPin size={11} className="me-1" />
                          {[resolvedOrder.ReceiverStreetName, resolvedOrder.ReceiverArea, resolvedOrder.ReceiverCity].filter(Boolean).join(", ")}
                        </div>
                      )}
                    </Col>

                    <Col xs="auto">
                      <Badge bg="primary" className="px-3 py-2 rounded-pill">
                        {resolvedOrder.StatusName || "Unknown"}
                      </Badge>
                    </Col>
                  </Row>
                </div>

                <Form onSubmit={handleUpdateStatus}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Select New Status <span className="text-danger">*</span>
                    </Form.Label>

                    {statusOptions.length > 0 ? (
                      <SSRSelect
                        name="newStatus"
                        value={selectedStatus}
                        onChange={setSelectedStatus}
                        options={statusOptions}
                        placeholder="Choose next status…"
                        isSearchable={true}
                        isClearable={false}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        instanceId="rd-single-scan-status"
                      />
                    ) : (
                      <Alert variant="warning" className="py-2 mb-0 small">
                        <AlertCircle size={13} className="me-1" />
                        No status transitions available for this package.
                      </Alert>
                    )}
                  </Form.Group>

                  {selectedStatus?.transition && (
                    <Alert variant="info" className="py-2 mb-3 small">
                      <strong>Action:</strong> {selectedStatus.transition.actionName}
                      {selectedStatus.transition.requiresDeliveryFlow && <div>• Requires delivery flow</div>}
                      {selectedStatus.transition.requiresCOD && <div>• Requires COD collection</div>}
                      {selectedStatus.transition.requiresPOD && <div>• Requires proof of delivery</div>}
                    </Alert>
                  )}

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">
                      Notes <span className="text-muted fw-normal">(optional)</span>
                    </Form.Label>

                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="e.g. Left at door, customer not available…"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </Form.Group>

                  <div className="d-flex gap-2 justify-content-end">
                    <Button variant="light" onClick={resetForm} disabled={submitting}>
                      Cancel
                    </Button>

                    <Button type="submit" variant="primary" disabled={submitting || !selectedStatus} style={{ minWidth: 140 }}>
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Updating…
                        </>
                      ) : (
                        <>
                          <CheckCircle size={14} className="me-2" />
                          Update Status
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col lg={5}>
          <Card className="border-0 shadow-sm rounded-3 h-100">
            <Card.Header className="bg-transparent border-bottom px-4 pt-4 pb-3">
              <div className="d-flex align-items-center justify-content-between">
                <h6 className="fw-semibold mb-0 d-flex align-items-center gap-2">
                  <Clock size={15} className="text-muted" /> Session Log
                </h6>

                <div className="d-flex align-items-center gap-2">
                  <Badge bg="secondary" pill>{sessionLog.length}</Badge>

                  {sessionLog.length > 0 && (
                    <Button variant="link" size="sm" className="text-muted p-0" onClick={() => setSessionLog([])} title="Clear log">
                      <Trash2 size={13} />
                    </Button>
                  )}
                </div>
              </div>
            </Card.Header>

            <Card.Body className="p-3" style={{ maxHeight: 480, overflowY: "auto" }}>
              {sessionLog.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <Package size={32} className="mb-3 opacity-25" />
                  <p className="small mb-0">Scanned packages will appear here</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {sessionLog.map((entry) => (
                    <div
                      key={entry.id}
                      className={`rounded-3 p-3 ${entry.result === "success" ? "bg-success bg-opacity-10" : "bg-danger bg-opacity-10"}`}
                      style={{ borderLeft: `4px solid ${entry.result === "success" ? "#198754" : "#dc3545"}` }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="fw-semibold small">{entry.orderNO}</span>

                        <Badge bg={entry.result === "success" ? "success" : "danger"} className="small">
                          {entry.result === "success" ? "Updated" : "Failed"}
                        </Badge>
                      </div>

                      <div className="small text-muted">
                        <User size={11} className="me-1" />
                        {entry.recipient}
                      </div>

                      <div className="small text-muted">→ {entry.statusLabel}</div>

                      {entry.result === "error" && (
                        <div className="small text-danger mt-1">{entry.message}</div>
                      )}

                      <div className="small text-muted mt-1">
                        <Clock size={11} className="me-1" />
                        {entry.time}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>

            {sessionLog.length > 0 && (
              <Card.Footer className="bg-transparent border-top px-4 py-3">
                <Row className="text-center g-0">
                  <Col>
                    <div className="fw-bold">{sessionLog.length}</div>
                    <div className="small text-muted">Total</div>
                  </Col>

                  <Col>
                    <div className="fw-bold text-success">{successCount}</div>
                    <div className="small text-muted">Success</div>
                  </Col>

                  <Col>
                    <div className="fw-bold text-danger">{failCount}</div>
                    <div className="small text-muted">Failed</div>
                  </Col>
                </Row>
              </Card.Footer>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
