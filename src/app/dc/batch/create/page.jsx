"use client";
import {
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
} from "feather-icons-react";
import React, { useState, useEffect, useMemo } from "react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { Badge, Button, Card } from "react-bootstrap";
import notify from "@/lib/toast";
import Select from "react-select";
import Link from "@/components/Link";
import { useShipment } from "@/hooks/useShipment";
import { postShipmentHandoverBatch } from "@/services/shipmentService";
import { useAdmin } from "@/hooks/useAdmin";
import { useRouter } from "next/navigation";
import DCSwitcher from "@/components/DCSwitcher";
import BatchScanStep from "@/components/batches/BatchScanStep";
import { useAuth } from "@/contexts/AuthContext";
import { filterDistributionCentersToAssigned } from "@/services/dcService";

const STEPS = [
  { num: 1, label: "Configure Batch" },
  { num: 2, label: "Scan Orders" },
  { num: 3, label: "Review & Create" },
];

const CreateDCBatch = () => {
  const { user } = useAuth();
  const router = useRouter();
  const MySwal = withReactContent(Swal);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fromDCCode: null,
    toDCCode: null,
    courierCode: null,
    notes: "",
  });
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const { dcCode } = useShipment();

  const {
    distributionCenters,
    fetchDistributionCenters,
    couriers,
    fetchCouriers,
  } = useAdmin();
  const assignedDistributionCenters = useMemo(() => filterDistributionCentersToAssigned(user, distributionCenters), [user, distributionCenters]);

  // Auto-set fromDCCode to the manager's DC
  useEffect(() => {
    if (dcCode && distributionCenters.length > 0) {
      const defaultDC = distributionCenters.find((dc) => dc.DCCode === dcCode);
      if (defaultDC) {
        setForm((prev) => ({
          ...prev,
          fromDCCode: {
            value: defaultDC.DCCode,
            label: `${defaultDC.DCCode} - ${defaultDC.DCName} (${defaultDC.CityName})`,
          },
        }));
      }
    }
  }, [dcCode, distributionCenters]);

  useEffect(() => {
    fetchDistributionCenters();
    fetchCouriers();
  }, [fetchDistributionCenters, fetchCouriers]);

  const handleStep1Next = () => {
    if (!form.fromDCCode || !form.toDCCode || !form.courierCode) {
      notify.error("Please fill in all required fields");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (selectedOrders.length === 0 || !form.fromDCCode || !form.toDCCode || !form.courierCode) {
      notify.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const batchData = {
        fromDCCode: form.fromDCCode.value,
        toDCCode: form.toDCCode.value,
        courierCode: form.courierCode.value,
        riderUserCode: "", // Assuming no rider for DC handover
        notes: form.notes,
        isRiderBatch: 0,
        shipmentOrderArray: selectedOrders.map((o) => ({ orderNO: o.OrderNO })),
      };

      const response = await postShipmentHandoverBatch(batchData);

      if (response.Error) {
        notify.error(response.Message || "Failed to create handover batch");
      } else {
        MySwal.fire({
          title: "Success!",
          text: "Handover batch created successfully!",
          icon: "success",
          confirmButtonText: "View Outbound Batches",
          showCancelButton: true,
          cancelButtonText: "Create Another",
        }).then((result) => {
          if (result.isConfirmed) {
            router.push("/dc/batch/outbound");
          } else {
            setStep(1);
            setForm({
              fromDCCode: form.fromDCCode, // keep auto-set DC
              toDCCode: null,
              courierCode: null,
              notes: "",
            });
            setSelectedOrders([]);
          }
        });
      }
    } catch (error) {
      notify.error(error.message || "Failed to create handover batch");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewOrder = (order) => {
    MySwal.fire({
      title: `Order Details - ${order.OrderNO}`,
      html: `
        <div class="text-start">
          <div class="row mb-3">
            <div class="col-md-6">
              <strong>Customer:</strong> ${order.CustomerName || "N/A"}<br>
              <strong>Phone:</strong> ${order.CustomerPhone || "N/A"}<br>
              <strong>Address:</strong> ${order.CustomerAddress || "N/A"}
            </div>
            <div class="col-md-6">
              <strong>Vendor:</strong> ${order.VendorName || "N/A"}<br>
              <strong>Destination DC:</strong> ${order.DestinationDCName || "N/A"}<br>
              <strong>Delivery Type:</strong> ${order.DeliveryType || "N/A"}
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <strong>COD Amount:</strong> KSh ${order.CODAmount?.toLocaleString() || "0"}<br>
              <strong>Service Fee:</strong> KSh ${order.ServiceFee?.toLocaleString() || "0"}
            </div>
            <div class="col-md-6">
              <strong>Status:</strong> ${order.StatusName || "N/A"}<br>
              <strong>Items:</strong> ${order.ShipmentOrderItems?.length || 0}
            </div>
          </div>
          ${order.Notes ? `<div class="row"><div class="col-12"><strong>Notes:</strong> ${order.Notes}</div></div>` : ""}
        </div>
      `,
      width: "600px",
      confirmButtonText: "Close",
      confirmButtonColor: "#007bff",
    });
  };

  // --- Step 1 helpers ---

  const toDcOptions = distributionCenters
    .filter((dc) => dc.DCCode !== form.fromDCCode?.value)
    .map((dc) => ({
      value: dc.DCCode,
      label: `${dc.DCCode} - ${dc.DCName} (${dc.CityName})`,
    }));

  const handleSelectChange = (selectedOption, actionMeta) => {
    setForm((prev) => ({ ...prev, [actionMeta.name]: selectedOption }));
  };

  const courierOptions = useMemo(() => {
    if (!Array.isArray(couriers)) return [];
    return couriers
      .filter((c) => c.IsActive && !c.IsDeleted)
      .map((c) => ({
        value: c.CourierCode,
        label: `${c.CourierName} - ${c.CourierCode}`,
      }));
  }, [couriers]);

  const statusBadgeColor = (order) => {
    const code = order.StatusCode || "";
    if (code.includes("SERVICE_FEE")) return "warning";
    if (code.includes("READY") || code.includes("PICKED")) return "success";
    if (code.includes("PENDING") || code.includes("PROCESSING")) return "info";
    if (code.includes("FAILED") || code.includes("CANCELLED")) return "danger";
    return "secondary";
  };

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <Link href="/dc/batch/outbound" className="btn btn-outline-primary me-3 mb-2">
            <ArrowLeft size={16} className="me-2" />
            Back to Outbound
          </Link>
          <div className="ms-3">
            <h4>Create Handover Batch</h4>
            <h6>Configure batch details, scan orders, and review before creating</h6>
          </div>
        </div>
        <div className="d-flex justify-content-end">
          <DCSwitcher />
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <Card>
            <Card.Body>
              {/* ── Progress Stepper ── */}
              <div className="d-flex align-items-center justify-content-center mb-5">
                {STEPS.map((s, idx) => (
                  <React.Fragment key={s.num}>
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${
                          step >= s.num ? "bg-primary text-white" : "bg-light text-muted"
                        }`}
                        style={{ width: 36, height: 36, fontSize: 14, flexShrink: 0 }}
                      >
                        {step > s.num ? <CheckCircle size={16} /> : s.num}
                      </div>
                      <span
                        className={`fw-semibold ${step >= s.num ? "text-primary" : "text-muted"}`}
                        style={{ whiteSpace: "nowrap", fontSize: 14 }}
                      >
                        {s.label}
                      </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div
                        className={`mx-3 ${step > s.num ? "bg-primary" : "bg-light"}`}
                        style={{ height: 2, width: 64, flexShrink: 0 }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* ══ Step 1: Configure Batch ══ */}
              {step === 1 && (
                <div>
                  <h5 className="mb-4">Configure Batch Details</h5>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-bold">
                          From DC <span className="text-danger">*</span>
                        </label>
                        <Select
                          name="fromDCCode"
                          value={form.fromDCCode}
                          onChange={handleSelectChange}
                          options={assignedDistributionCenters.map((dc) => ({
                            value: dc.DCCode,
                            label: `${dc.DCCode} - ${dc.DCName} (${dc.CityName})`,
                          }))}
                          placeholder="Select source DC"
                          isDisabled
                          className="react-select-container"
                          classNamePrefix="react-select"
                        />
                        <small className="text-muted">Auto-set to your assigned DC</small>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-bold">
                          To DC <span className="text-danger">*</span>
                        </label>
                        <Select
                          name="toDCCode"
                          value={form.toDCCode}
                          onChange={handleSelectChange}
                          options={toDcOptions}
                          placeholder="Select destination DC"
                          className="react-select-container"
                          classNamePrefix="react-select"
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-bold">
                          Courier <span className="text-danger">*</span>
                        </label>
                        <Select
                          name="courierCode"
                          value={form.courierCode}
                          onChange={handleSelectChange}
                          options={courierOptions}
                          placeholder="Select courier for delivery"
                          className="react-select-container"
                          classNamePrefix="react-select"
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-bold">Notes</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={form.notes}
                          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                          placeholder="Optional notes for the batch"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mt-2">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleStep1Next}
                      disabled={!form.fromDCCode || !form.toDCCode || !form.courierCode}
                      className="d-flex align-items-center gap-2"
                    >
                      Next: Scan Orders
                      <ChevronRight size={18} />
                    </Button>
                  </div>
                </div>
              )}

              {/* ══ Step 2: Scan Orders — shared component ══ */}
              {step === 2 && (
                <BatchScanStep
                  form={form}
                  initialOrders={selectedOrders}
                  onNext={(orders) => {
                    setSelectedOrders(orders);
                    setStep(3);
                  }}
                  onBack={() => setStep(1)}
                />
              )}

              {/* ══ Step 3: Review & Create ══ */}
              {step === 3 && (
                <div>
                  <h5 className="mb-4">Review & Create Batch</h5>

                  <div className="row">
                    {/* Left: order list */}
                    <div className="col-md-8">
                      <Card className="mb-4">
                        <Card.Header>
                          <h6 className="mb-0">Batch Details</h6>
                        </Card.Header>
                        <Card.Body>
                          <div className="row">
                            <div className="col-md-6">
                              <div className="mb-3">
                                <label className="form-label fw-bold">From DC:</label>
                                <p className="mb-0">{form.fromDCCode?.label}</p>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="mb-3">
                                <label className="form-label fw-bold">To DC:</label>
                                <p className="mb-0">{form.toDCCode?.label}</p>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="mb-3">
                                <label className="form-label fw-bold">Courier:</label>
                                <p className="mb-0">{form.courierCode?.label}</p>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="mb-3">
                                <label className="form-label fw-bold">Orders Count:</label>
                                <p className="mb-0">{selectedOrders.length}</p>
                              </div>
                            </div>
                            {form.notes && (
                              <div className="col-12">
                                <div className="mb-3">
                                  <label className="form-label fw-bold">Notes:</label>
                                  <p className="mb-0">{form.notes}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </Card.Body>
                      </Card>

                      <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">Selected Orders ({selectedOrders.length})</h6>
                          {selectedOrders.length > 0 && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() =>
                                MySwal.fire({
                                  title: "Clear All Orders",
                                  text: "Are you sure you want to remove all selected orders?",
                                  icon: "warning",
                                  showCancelButton: true,
                                  confirmButtonColor: "#dc3545",
                                  cancelButtonColor: "#6c757d",
                                  confirmButtonText: "Yes, Clear All",
                                  cancelButtonText: "Cancel",
                                }).then((result) => {
                                  if (result.isConfirmed) setSelectedOrders([]);
                                })
                              }
                            >
                              <Trash2 size={14} className="me-1" />
                              Clear All
                            </Button>
                          )}
                        </Card.Header>

                        <Card.Body className="p-0">
                          {selectedOrders.length === 0 ? (
                            <div className="text-center p-4 text-muted">
                              <h6>No orders selected</h6>
                              <p className="mb-0">Go back to Step 2 to scan orders</p>
                            </div>
                          ) : (
                            <div className="list-group list-group-flush">
                              {selectedOrders.map((order) => (
                                <div key={order.OrderNO} className="list-group-item px-3 py-3">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div className="flex-grow-1">
                                      <div className="d-flex align-items-center mb-2">
                                        <h6 className="mb-0 text-primary me-3">{order.OrderNO}</h6>
                                        <Badge bg={statusBadgeColor(order)}>
                                          {order.StatusName || "Unknown"}
                                        </Badge>
                                      </div>

                                      <div className="row g-2">
                                        <div className="col-md-6">
                                          <div className="fw-semibold small">{order.CustomerName || "N/A"}</div>
                                          <div className="text-muted small">{order.CustomerPhone || ""}</div>
                                        </div>
                                        <div className="col-md-6">
                                          <div className="fw-semibold small">{order.VendorName || "N/A"}</div>
                                          <div className="text-muted small">{order.DestinationDCName || ""}</div>
                                        </div>
                                        <div className="col-md-6">
                                          <small className="text-muted">{order.DeliveryType || "Standard"}</small>
                                        </div>
                                        <div className="col-md-6">
                                          {order.CODAmount > 0 ? (
                                            <small className="text-success fw-semibold">
                                              COD: KSh {order.CODAmount.toLocaleString()}
                                            </small>
                                          ) : (
                                            <small className="text-muted">No COD</small>
                                          )}
                                        </div>
                                      </div>

                                      {order.ShipmentOrderItems?.length > 0 && (
                                        <div className="mt-2">
                                          <small className="text-muted">
                                            {order.ShipmentOrderItems.length} item
                                            {order.ShipmentOrderItems.length !== 1 ? "s" : ""}:{" "}
                                            {order.ShipmentOrderItems.slice(0, 2)
                                              .map((i) => i.productName || "Item")
                                              .join(", ")}
                                            {order.ShipmentOrderItems.length > 2
                                              ? ` +${order.ShipmentOrderItems.length - 2} more`
                                              : ""}
                                          </small>
                                        </div>
                                      )}
                                    </div>

                                    <div className="ms-3 d-flex gap-2">
                                      <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => handleViewOrder(order)}
                                        title="View details"
                                      >
                                        <Eye size={14} />
                                      </Button>
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() =>
                                          MySwal.fire({
                                            title: "Remove Order",
                                            text: `Remove ${order.OrderNO} from the batch?`,
                                            icon: "warning",
                                            showCancelButton: true,
                                            confirmButtonColor: "#dc3545",
                                            cancelButtonColor: "#6c757d",
                                            confirmButtonText: "Remove",
                                          }).then((result) => {
                                            if (result.isConfirmed)
                                              setSelectedOrders((prev) =>
                                                prev.filter((o) => o.OrderNO !== order.OrderNO)
                                              );
                                          })
                                        }
                                        title="Remove from batch"
                                      >
                                        <Trash2 size={14} />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </div>

                    {/* Right: summary + submit */}
                    <div className="col-md-4">
                      <Card className="sticky-top" style={{ top: 20 }}>
                        <Card.Header>
                          <h6 className="mb-0">Batch Summary</h6>
                        </Card.Header>
                        <Card.Body>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Total Orders:</span>
                            <strong>{selectedOrders.length}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span>From:</span>
                            <strong>{form.fromDCCode?.value}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span>To:</span>
                            <strong>{form.toDCCode?.value}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Courier:</span>
                            <strong>{form.courierCode?.value}</strong>
                          </div>
                          <hr />
                          <Button
                            variant="success"
                            size="lg"
                            onClick={handleSubmit}
                            disabled={submitting || selectedOrders.length === 0}
                            className="w-100 d-flex align-items-center justify-content-center gap-2"
                          >
                            {submitting ? (
                              <>
                                <span className="spinner-border spinner-border-sm" role="status" />
                                Creating Batch…
                              </>
                            ) : (
                              <>
                                <CheckCircle size={18} />
                                Create Batch
                              </>
                            )}
                          </Button>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button
                      variant="outline-secondary"
                      onClick={() => setStep(2)}
                      className="d-flex align-items-center gap-2"
                    >
                      <ChevronLeft size={18} />
                      Back to Scan Orders
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateDCBatch;
