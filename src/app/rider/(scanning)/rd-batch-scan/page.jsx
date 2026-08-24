"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Badge,
  Button,
  Form,
  Alert,
  InputGroup,
  Modal,
} from "react-bootstrap";

import {
  Grid,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  User,
  RotateCcw,
  PlayCircle,
  StopCircle,
  Trash2,
} from "feather-icons-react";

import SSRSelect from "@/components/SSRSelect";
import { useAdmin } from "@/hooks/useAdmin";
import { useUser } from "@/hooks/useUser";
import { useShipment } from "@/hooks/useShipment";
import { postShipmentHandoverBatch } from "@/services/shipmentService";

export default function RiderBatchScan() {
  const inputRef = useRef(null);
  const autoSubmitTimeoutRef = useRef(null);
  const submitLockRef = useRef(false);

  const { user } = useUser();

  const { fetchShipmentOrder, dcCode } = useShipment();
  const {
    distributionCenters,
    fetchDistributionCenters,
    loading: distributionCentersLoading,
  } = useAdmin();

  const [phase, setPhase] = useState("setup");
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedDC, setSelectedDC] = useState(null);
  const [sessionNotes, setSessionNotes] = useState("");

  const [scanInput, setScanInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [batchError, setBatchError] = useState("");

  const [results, setResults] = useState([]);
  const [scannedOrderNOs, setScannedOrderNOs] = useState(new Set());

  const [showSummary, setShowSummary] = useState(false);

  const riderCode = user?.UserCode || "";

  useEffect(() => {
    if (selectedStatus?.value === 202) {
      fetchDistributionCenters({ pageNo: 1, pageSize: 100 });
    }
  }, [selectedStatus, fetchDistributionCenters]);

  const dcOptions =
    distributionCenters?.map((dc) => ({
      value: dc.DCCode,
      label: `${dc.DCName} (${dc.DCCode})`,
    })) || [];

  const cleanScannedValue = (value) => {
    if (!value) return "";

    let cleaned = value.trim();

    cleaned = cleaned.replace("https://collect.cossim.co.ke", "");

    cleaned = cleaned.replace("/track?trackingNumber=", "");

    cleaned = cleaned.split("&")[0];
    cleaned = cleaned.split("/")[0];

    return cleaned.trim();
  };

  const handleStartSession = () => {
    if (!selectedStatus || (selectedStatus.value === 202 && !selectedDC)) return;

    setPhase("scanning");
    setBatchError("");
    setResults([]);
    setScannedOrderNOs(new Set());

    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleEndSession = async () => {
    const validOrders = results
      .filter((entry) => entry.result === "success" && entry.order)
      .map((entry) => entry.order);

    if (validOrders.length === 0 || processing) return;

    const firstOrder = validOrders[0];
    const batchData = {
      fromDCCode: dcCode || firstOrder.OriginDCCode,
      toDCCode:
        selectedStatus.value === 202
          ? selectedDC.value
          : firstOrder.DestinationDCCode || firstOrder.OriginDCCode || dcCode,
      riderUserCode: riderCode,
      notes: sessionNotes,
      statusID: selectedStatus.value,
      isRiderBatch: 1,
      shipmentOrderArray: validOrders.map((order) => ({
        orderNO: order.OrderNO,
      })),
    };

    setProcessing(true);
    setBatchError("");

    try {
      const response = await postShipmentHandoverBatch(batchData);
      if (response?.Error) {
        throw new Error(response.Message || "Failed to create handover batch");
      }

      setPhase("done");
      setShowSummary(true);
    } catch (error) {
      setBatchError(error.message || "Failed to create handover batch");
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setPhase("setup");
    setSelectedStatus(null);
    setSelectedDC(null);
    setSessionNotes("");
    setScanInput("");
    setBatchError("");
    setResults([]);
    setScannedOrderNOs(new Set());
    setShowSummary(false);
  };

  const handleClearResults = () => {
    setResults([]);
    setScannedOrderNOs(new Set());
    setBatchError("");
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

      // Duplicate check
      if (scannedOrderNOs.has(orderNO)) {
        setResults((prev) => [
          {
            id: Date.now(),
            orderNO,
            recipient: "—",
            result: "duplicate",
            message: "Already scanned in this session",
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);

        submitLockRef.current = false;

        setTimeout(() => inputRef.current?.focus(), 50);

        return;
      }

      setProcessing(true);

      try {
        const response = await fetchShipmentOrder({ orderNO });

        const order = response?.Data || response?.data || response;

        if (!order || response?.Error) {
          setResults((prev) => [
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

        // Rider assignment validation
        if (
          riderCode &&
          order.RiderUserCode &&
          order.RiderUserCode !== riderCode
        ) {
          setResults((prev) => [
            {
              id: Date.now(),
              orderNO,
              recipient: order.ReceiverContactName || "Customer",
              result: "error",
              message: "Not assigned to you",
              time: new Date().toLocaleTimeString(),
            },
            ...prev,
          ]);

          return;
        }

        setScannedOrderNOs((prev) => new Set([...prev, orderNO]));

        setResults((prev) => [
          {
            id: Date.now(),
            orderNO: order.OrderNO,
            recipient: order.ReceiverContactName || "Customer",
            result: "success",
            message: "",
            time: new Date().toLocaleTimeString(),
            order,
          },
          ...prev,
        ]);
      } catch (err) {
        setResults((prev) => [
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
    [
      scanInput,
      scannedOrderNOs,
      fetchShipmentOrder,
      riderCode,
    ]
  );

  const handleScanInputChange = (e) => {
    const cleanedValue = cleanScannedValue(e.target.value);

    setScanInput(cleanedValue);

    // Auto submit at 20 chars
    if (cleanedValue.length >= 20 && !processing) {
      if (autoSubmitTimeoutRef.current) {
        clearTimeout(autoSubmitTimeoutRef.current);
      }

      autoSubmitTimeoutRef.current = setTimeout(() => {
        autoSubmitTimeoutRef.current = null;
        processBarcode(cleanedValue);
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

  const successCount = results.filter(
    (r) => r.result === "success"
  ).length;

  const failCount = results.filter(
    (r) => r.result === "error"
  ).length;

  const dupCount = results.filter(
    (r) => r.result === "duplicate"
  ).length;

  const resultColor = (r) =>
    r === "success"
      ? "#198754"
      : r === "duplicate"
      ? "#fd7e14"
      : "#dc3545";

  const resultBg = (r) =>
    r === "success"
      ? "bg-success bg-opacity-10"
      : r === "duplicate"
      ? "bg-warning bg-opacity-10"
      : "bg-danger bg-opacity-10";

  const resultBadge = (r) =>
    r === "success"
      ? "success"
      : r === "duplicate"
      ? "warning"
      : "danger";

  const resultLabel = (r) =>
    r === "success"
      ? "Ready"
      : r === "duplicate"
      ? "Duplicate"
      : "Failed";

  return (
    <div className="content">
      <div className="page-header mb-4">
        <div className="add-item d-flex">
          <div className="page-title">
            <h4 className="fw-bold d-flex align-items-center gap-2">
              <Grid size={20} className="text-primary" />
              Batch Scan
            </h4>

            <h6 className="text-muted">
              Scan multiple packages and apply the same status update
            </h6>
          </div>
        </div>

        {phase !== "setup" && (
          <Button
            variant="outline-secondary"
            size="sm"
            className="rounded-pill"
            onClick={handleReset}
          >
            <RotateCcw size={13} className="me-1" />
            New Session
          </Button>
        )}
      </div>

      <Row className="g-4">
        <Col lg={5}>
          {/* Setup */}
          <Card
            className={`border-0 shadow-sm rounded-3 mb-4 ${
              phase !== "setup" ? "opacity-75" : ""
            }`}
          >
            <Card.Header className="bg-transparent border-bottom px-4 pt-4 pb-3">
              <div className="d-flex align-items-center gap-2">
                <span
                  className="badge bg-primary rounded-circle"
                  style={{
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                  }}
                >
                  1
                </span>

                <h6 className="fw-semibold mb-0">Select Scan Type</h6>

                {phase !== "setup" && (
                  <Badge bg="success" pill>
                    Set
                  </Badge>
                )}
              </div>
            </Card.Header>

            <Card.Body className="p-4">
              <Form.Group className="mb-3">
                <Form.Check
                  type="radio"
                  id="batch-scan-express"
                  name="batchScanType"
                  label="Express"
                  checked={selectedStatus?.value === 302}
                  onChange={() => {
                    setSelectedStatus({ value: 302, label: "Express" });
                    setSelectedDC(null);
                  }}
                  disabled={phase !== "setup"}
                  inline
                />
                <Form.Check
                  type="radio"
                  id="batch-scan-in-transit"
                  name="batchScanType"
                  label="In Transit to DC"
                  checked={selectedStatus?.value === 202}
                  onChange={() =>
                    setSelectedStatus({ value: 202, label: "In Transit to DC" })
                  }
                  disabled={phase !== "setup"}
                  inline
                />
              </Form.Group>

              {selectedStatus?.value === 202 && (
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    Distribution Center <span className="text-danger">*</span>
                  </Form.Label>
                  <SSRSelect
                    name="batchDistributionCenter"
                    value={selectedDC}
                    onChange={setSelectedDC}
                    options={dcOptions}
                    placeholder={
                      distributionCentersLoading
                        ? "Loading distribution centers..."
                        : "Select a distribution center..."
                    }
                    isSearchable={true}
                    isClearable={false}
                    isDisabled={phase !== "setup"}
                    isLoading={distributionCentersLoading}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    instanceId="rd-batch-dc"
                  />
                </Form.Group>
              )}

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">
                  Session Notes{" "}
                  <span className="text-muted fw-normal">
                    (optional, applied to all)
                  </span>
                </Form.Label>

                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="e.g. Morning delivery run, bad weather conditions…"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  disabled={phase !== "setup"}
                />
              </Form.Group>

              {phase === "setup" && (
                <Button
                  variant="success"
                  className="w-100"
                  onClick={handleStartSession}
                  disabled={
                    !selectedStatus ||
                    (selectedStatus.value === 202 && !selectedDC)
                  }
                >
                  <PlayCircle size={15} className="me-2" />
                  Start Scanning Session
                </Button>
              )}

              {phase === "scanning" && (
                <Alert
                  variant="success"
                  className="mb-0 py-2 small text-center"
                >
                  <CheckCircle size={13} className="me-1" />
                  Session active — scanning {selectedStatus?.label}
                </Alert>
              )}

              {batchError && (
                <Alert variant="danger" className="mt-3 mb-0 py-2 small">
                  {batchError}
                </Alert>
              )}
            </Card.Body>
          </Card>

          {/* Scan */}
          {phase === "scanning" && (
            <Card className="border-0 shadow-sm rounded-3 mb-4">
              <Card.Header className="bg-transparent border-bottom px-4 pt-4 pb-3">
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="badge bg-success rounded-circle"
                    style={{
                      width: 24,
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                    }}
                  >
                    2
                  </span>

                  <h6 className="fw-semibold mb-0">Scan Packages</h6>
                </div>
              </Card.Header>

              <Card.Body className="p-4">
                <InputGroup>
                  <Form.Control
                    ref={inputRef}
                    type="text"
                    placeholder="Aim scanner or type order number…"
                    value={scanInput}
                    onChange={handleScanInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={processing}
                    autoComplete="off"
                    className="py-2"
                  />

                  <Button
                    variant="primary"
                    onClick={() => processBarcode()}
                    disabled={!scanInput.trim() || processing}
                  >
                    {processing ? (
                      <span className="spinner-border spinner-border-sm" />
                    ) : (
                      "Scan"
                    )}
                  </Button>
                </InputGroup>

                <small className="text-muted mt-2 d-block">
                  Auto-submits when code reaches 20 characters or scanner sends Enter.
                </small>

                {/* Stats */}
                <div className="d-flex gap-3 mt-3 pt-3 border-top text-center">
                  <div className="flex-fill">
                    <div className="fw-bold fs-5">{results.length}</div>
                    <div className="small text-muted">Scanned</div>
                  </div>

                  <div className="flex-fill">
                    <div className="fw-bold fs-5 text-success">
                      {successCount}
                    </div>
                    <div className="small text-muted">Ready</div>
                  </div>

                  <div className="flex-fill">
                    <div className="fw-bold fs-5 text-danger">
                      {failCount}
                    </div>
                    <div className="small text-muted">Failed</div>
                  </div>

                  <div className="flex-fill">
                    <div className="fw-bold fs-5 text-warning">
                      {dupCount}
                    </div>
                    <div className="small text-muted">Duplicate</div>
                  </div>
                </div>

                <Button
                  variant="danger"
                  className="w-100 mt-3"
                  onClick={handleEndSession}
                  disabled={successCount === 0 || processing}
                >
                  <StopCircle size={15} className="me-2" />
                  {processing ? "Creating Batch..." : "Create Batch & End Session"}
                </Button>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Results */}
        <Col lg={7}>
          <Card className="border-0 shadow-sm rounded-3 h-100">
            <Card.Header className="bg-transparent border-bottom px-4 pt-4 pb-3">
              <div className="d-flex align-items-center justify-content-between">
                <h6 className="fw-semibold mb-0 d-flex align-items-center gap-2">
                  <Clock size={15} className="text-muted" />
                  Real-Time Results
                </h6>

                <div className="d-flex align-items-center gap-2">
                  <Badge bg="secondary" pill>
                    {results.length} scanned
                  </Badge>

                  {results.length > 0 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-muted p-0"
                      onClick={handleClearResults}
                      title="Clear results"
                    >
                      <Trash2 size={13} />
                    </Button>
                  )}
                </div>
              </div>
            </Card.Header>

            <Card.Body
              className="p-3"
              style={{ maxHeight: 540, overflowY: "auto" }}
            >
              {results.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <Grid size={36} className="mb-3 opacity-25" />
                  <p className="small mb-0">
                    Results will appear here as you scan
                  </p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {results.map((entry) => (
                    <div
                      key={entry.id}
                      className={`rounded-3 p-3 ${resultBg(entry.result)}`}
                      style={{
                        borderLeft: `4px solid ${resultColor(entry.result)}`,
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="fw-semibold small text-dark">
                          {entry.orderNO}
                        </span>

                        <Badge
                          bg={resultBadge(entry.result)}
                          className="small"
                        >
                          {resultLabel(entry.result)}
                        </Badge>
                      </div>

                      <div className="small text-muted">
                        <User size={11} className="me-1" />
                        {entry.recipient}
                      </div>

                      {entry.result === "success" && (
                        <div className="small text-success mt-1">
                          <CheckCircle size={11} className="me-1" />
                          Ready for <strong>{selectedStatus?.label}</strong>
                        </div>
                      )}

                      {entry.message && (
                        <div
                          className={`small mt-1 ${
                            entry.result === "duplicate"
                              ? "text-warning"
                              : "text-danger"
                          }`}
                        >
                          {entry.message}
                        </div>
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
          </Card>
        </Col>
      </Row>

      {/* Summary Modal */}
      <Modal
        show={showSummary}
        onHide={() => setShowSummary(false)}
        centered
        size="sm"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold fs-6">
            Session Summary
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="text-center px-4 pb-4">
          <div className="mb-3">
            <Package size={40} className="text-primary mb-2" />

            <h5 className="fw-bold">
              {results.length} Packages Processed
            </h5>

            <p className="text-muted small mb-0">
              Status applied: <strong>{selectedStatus?.label}</strong>
            </p>
          </div>

          <Row className="g-2 mb-4">
            <Col xs={4}>
              <div className="rounded-3 p-3 bg-success bg-opacity-10">
                <div className="fw-bold fs-4 text-success">
                  {successCount}
                </div>

                <div className="small text-muted">Updated</div>
              </div>
            </Col>

            <Col xs={4}>
              <div className="rounded-3 p-3 bg-danger bg-opacity-10">
                <div className="fw-bold fs-4 text-danger">
                  {failCount}
                </div>

                <div className="small text-muted">Failed</div>
              </div>
            </Col>

            <Col xs={4}>
              <div className="rounded-3 p-3 bg-warning bg-opacity-10">
                <div className="fw-bold fs-4 text-warning">
                  {dupCount}
                </div>

                <div className="small text-muted">Dupes</div>
              </div>
            </Col>
          </Row>

          <Button
            variant="primary"
            className="w-100 mb-2"
            onClick={handleReset}
          >
            <RotateCcw size={14} className="me-2" />
            Start New Session
          </Button>

          <Button
            variant="outline-secondary"
            className="w-100"
            onClick={() => setShowSummary(false)}
          >
            View Results
          </Button>
        </Modal.Body>
      </Modal>
    </div>
  );
}
