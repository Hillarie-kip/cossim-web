"use client";

import { ArrowLeft, CheckCircle, Layers } from "feather-icons-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { Badge, Button, Card } from "react-bootstrap";
import Select from "react-select";
import { useRouter, useSearchParams } from "next/navigation";
import notify from "@/lib/toast";
import Link from "@/components/Link";
import { all_routes } from "@/Router/all_routes";
import { postShipmentHandoverBatch } from "@/services/shipmentService";
import { useAdmin } from "@/hooks/useAdmin";
import BatchScanStep from "@/components/batches/BatchScanStep";
import { useAuth } from "@/contexts/AuthContext";
import { filterDistributionCentersToAssigned } from "@/services/dcService";

const readConsolidationOrders = () => {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(sessionStorage.getItem("cossim-consolidation-orders") || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

export default function CreateHandoverBatch() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromTasks = searchParams.get("source") === "tasks";
  const reversedMode = searchParams.get("mode") === "reversed";
  const MySwal = withReactContent(Swal);
  const [sourceOrders] = useState(readConsolidationOrders);
  const [confirmedOrders, setConfirmedOrders] = useState([]);
  const [form, setForm] = useState({ fromDCCode: null, toDCCode: null, courierCode: null, notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const { distributionCenters, fetchDistributionCenters, couriers, fetchCouriers } = useAdmin();

  useEffect(() => {
    fetchDistributionCenters();
    fetchCouriers();
  }, [fetchDistributionCenters, fetchCouriers]);

  const dcOptions = useMemo(() => distributionCenters.map((dc) => ({
    value: dc.DCCode,
    label: `${dc.DCCode} - ${dc.DCName}${dc.CityName ? ` (${dc.CityName})` : ""}`,
  })), [distributionCenters]);
  const assignedDCOptions = useMemo(() => filterDistributionCentersToAssigned(user, distributionCenters).map((dc) => ({
    value: dc.DCCode,
    label: `${dc.DCCode} - ${dc.DCName}${dc.CityName ? ` (${dc.CityName})` : ""}`,
  })), [user, distributionCenters]);
  const courierOptions = useMemo(() => (Array.isArray(couriers) ? couriers : [])
    .filter((courier) => courier.IsActive && !courier.IsDeleted)
    .map((courier) => ({ value: courier.CourierCode, label: `${courier.CourierName} - ${courier.CourierCode}` })), [couriers]);

  useEffect(() => {
    if (form.fromDCCode || sourceOrders.length === 0 || dcOptions.length === 0) return;
    const origin = assignedDCOptions.find((option) => option.value === sourceOrders[0]?.OriginDCCode);
    if (origin) setForm((previous) => ({ ...previous, fromDCCode: origin }));
  }, [assignedDCOptions, form.fromDCCode, sourceOrders]);

  useEffect(() => {
    if (!reversedMode || form.toDCCode || dcOptions.length === 0) return;
    const hq = dcOptions.find((option) => /(^|\b)HQ(\b|$)|HEAD\s*OFFICE/i.test(option.label));
    if (hq) setForm((previous) => ({ ...previous, toDCCode: hq }));
  }, [reversedMode, dcOptions, form.toDCCode]);

  const allowedOrderNumbers = useMemo(() => sourceOrders.map((order) => order.OrderNO).filter(Boolean), [sourceOrders]);
  const handleOrdersChange = useCallback((orders) => setConfirmedOrders(orders), []);
  const configurationComplete = form.fromDCCode && form.toDCCode && form.courierCode;

  const handleSubmit = async () => {
    if (!configurationComplete) return notify.error("Select the origin, destination, and courier.");
    if (confirmedOrders.length === 0) return notify.error("Scan at least one selected order to confirm it.");
    if (fromTasks && confirmedOrders.length !== sourceOrders.length) return notify.error(`Confirm all ${sourceOrders.length} selected orders before finishing.`);

    setSubmitting(true);
    try {
      if (sourceOrders.length > 0 && sourceOrders.every((order) => order.IsTaskSample)) {
        sessionStorage.removeItem("cossim-consolidation-orders");
        await MySwal.fire({ title: "Test batch created", text: `${confirmedOrders.length} sample orders completed the dispatch flow locally.`, icon: "success", confirmButtonText: "Back to Task Management" });
        router.push(`${all_routes.packages}?task=dispatch`);
        return;
      }
      const response = await postShipmentHandoverBatch({
        fromDCCode: form.fromDCCode.value,
        toDCCode: form.toDCCode.value,
        courierCode: form.courierCode.value,
        riderUserCode: "",
        notes: form.notes,
        shipmentOrderArray: confirmedOrders.map((order) => ({ orderNO: order.OrderNO })),
      });
      if (response?.Error) throw new Error(response.Message || "Failed to create handover batch");
      sessionStorage.removeItem("cossim-consolidation-orders");
      await MySwal.fire({ title: "Batch created", text: `${confirmedOrders.length} orders were consolidated successfully.`, icon: "success", confirmButtonText: "View Batches" });
      router.push(all_routes.batches);
    } catch (error) {
      notify.error(error.message || "Failed to create handover batch");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="content">
      <div className="page-header">
        <div className="add-item d-flex align-items-center gap-3">
          <Link to={fromTasks ? all_routes.packages : all_routes.batches} className="btn btn-outline-primary">
            <ArrowLeft size={16} className="me-2" />
            {fromTasks ? "Back to Task Management" : "Back to Batches"}
          </Link>
          <div className="page-title"><h4>{reversedMode ? "Scan Reversed Orders to Courier" : "Consolidate Orders"}</h4><h6>{reversedMode ? "Destination defaults to HQ; select a courier and scan every package" : "Configure, scan to confirm, and finish on one page"}</h6></div>
        </div>
      </div>

      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0"><Layers size={18} className="me-2" />Batch Configuration</h5>
          {fromTasks && <Badge bg="primary">{sourceOrders.length} selected</Badge>}
        </Card.Header>
        <Card.Body>
          <div className="row">
            <div className="col-lg-4 mb-3">
              <label className="form-label fw-bold">From Distribution Center *</label>
              <Select value={form.fromDCCode} options={assignedDCOptions} onChange={(value) => setForm((old) => ({ ...old, fromDCCode: value }))} isDisabled={fromTasks && Boolean(form.fromDCCode)} isSearchable placeholder="Select source DC" />
            </div>
            <div className="col-lg-4 mb-3">
              <label className="form-label fw-bold">Destination {reversedMode && <small className="text-muted">(HQ by default)</small>} *</label>
              <Select value={form.toDCCode} options={dcOptions.filter((option) => option.value !== form.fromDCCode?.value)} onChange={(value) => setForm((old) => ({ ...old, toDCCode: value }))} isSearchable placeholder="Select destination DC" />
            </div>
            <div className="col-lg-4 mb-3">
              <label className="form-label fw-bold">Courier *</label>
              <Select value={form.courierCode} options={courierOptions} onChange={(value) => setForm((old) => ({ ...old, courierCode: value }))} isSearchable placeholder="Select courier" />
            </div>
            <div className="col-12">
              <label className="form-label fw-bold">Notes</label>
              <textarea className="form-control" rows="2" value={form.notes} onChange={(event) => setForm((old) => ({ ...old, notes: event.target.value }))} placeholder="Optional handover notes" />
            </div>
          </div>
          {fromTasks && sourceOrders.length > 0 && <div className="mt-3"><small className="text-muted d-block mb-2">Orders awaiting scan confirmation</small>{sourceOrders.map((order) => <Badge key={order.OrderNO} bg="light" text="dark" className="me-1 mb-1">{order.OrderNO}</Badge>)}</div>}
        </Card.Body>
      </Card>

      {configurationComplete ? (
        <Card><Card.Body>
          <BatchScanStep form={form} initialOrders={[]} allowedOrderNumbers={fromTasks ? allowedOrderNumbers : []} singlePage onOrdersChange={handleOrdersChange} />
          <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-3">
            <span className="text-muted">{confirmedOrders.length} of {fromTasks ? sourceOrders.length : confirmedOrders.length} orders confirmed</span>
            <Button variant="success" size="lg" onClick={handleSubmit} disabled={submitting || confirmedOrders.length === 0 || (fromTasks && confirmedOrders.length !== sourceOrders.length)}>
              {submitting ? <span className="spinner-border spinner-border-sm me-2" /> : <CheckCircle size={18} className="me-2" />}
              {reversedMode ? "Assign to Courier" : "Finish Consolidation"}
            </Button>
          </div>
        </Card.Body></Card>
      ) : <div className="alert alert-info">Select the destination and courier to begin scanning.</div>}
    </div>
  );
}
