import React, { useEffect } from "react";
import { Modal, Form, Button, Row, Col, Table } from "react-bootstrap";
import Select from "react-select";
import PropTypes from "prop-types";
import { useShipment } from "@/hooks/useShipment";
import { useVendors } from "@/hooks/useVendors";

const valueOf = (item, ...keys) => keys.map((key) => item?.[key]).find((value) => value !== undefined && value !== null);

const AddRoutePricingModal = ({ show, onHide, formData, onInputChange, onSubmit, loading = false, priceZones = [] }) => {
  const { deliveryTypes, fetchDeliveryTypes } = useShipment();
  const { vendors } = useVendors({ pageNo: 1, pageSize: 500 });
  const updateField = (name, value) => onInputChange({ target: { name, value } });
  useEffect(() => { if (show) fetchDeliveryTypes(); }, [show, fetchDeliveryTypes]);

  const vendorOptions = [{ value: "", label: "Walk-in / Default pricing" }, ...(Array.isArray(vendors) ? vendors : []).map((vendor) => {
    const value = valueOf(vendor, "vendorCode", "VendorCode");
    const name = valueOf(vendor, "vendorName", "VendorName");
    return value ? { value, label: `${name || value} (${value})` } : null;
  }).filter(Boolean)];
  const sizeOptions = ["SMALL", "MEDIUM", "LARGE"].map((value) => ({ value, label: value.charAt(0) + value.slice(1).toLowerCase() }));
  const deliveryOptions = (Array.isArray(deliveryTypes) ? deliveryTypes : []).filter((item) => Number(valueOf(item, "StatusID", "statusID") ?? 1) === 1).map((item) => ({ value: valueOf(item, "DeliveryTypeCode", "deliveryTypeCode"), label: valueOf(item, "DeliveryTypeName", "deliveryTypeName") }));
  const priceTypes = [{ value: "FIXED", label: "Fixed" }, { value: "ZONING", label: "Zone bands" }, { value: "PER_KM", label: "Per KM" }];
  const zones = (Array.isArray(priceZones) ? priceZones : []).map((zone) => ({ id: Number(valueOf(zone, "PriceZoneID", "priceZoneID", "priceZoneId")), name: valueOf(zone, "ZoneName", "zoneName") || "Unnamed zone", dcCodes: valueOf(zone, "DCCodes", "dcCodes") || [] }));
  const zonePrices = formData.zonePrices || {};
  const canSubmit = formData.shipmentRateSize && formData.deliveryTypeCode && ((formData.priceType === "FIXED" && formData.rateAmount !== "") || (formData.priceType === "PER_KM" && formData.basePrice !== "" && formData.baseKM !== "" && formData.pricePerKM !== "") || (formData.priceType === "ZONING" && Object.values(zonePrices).some((value) => value !== "" && value !== null)));

  return <Modal show={show} onHide={onHide} size="lg" centered>
    <Modal.Header closeButton><Modal.Title>Configure Pricing</Modal.Title></Modal.Header>
    <Modal.Body>
      <p className="text-muted mb-4">Vendor pricing overrides walk-in pricing for the same package size and delivery type.</p>
      <Form onSubmit={onSubmit}>
        <Row>
          <Col md={6}><Form.Group className="mb-3"><Form.Label>Vendor</Form.Label><Select options={vendorOptions} value={vendorOptions.find((option) => option.value === (formData.vendorCode || "")) || vendorOptions[0]} onChange={(option) => updateField("vendorCode", option?.value || "")} /></Form.Group></Col>
          <Col md={6}><Form.Group className="mb-3"><Form.Label>Package Size *</Form.Label><Select options={sizeOptions} value={sizeOptions.find((option) => option.value === formData.shipmentRateSize) || null} onChange={(option) => updateField("shipmentRateSize", option?.value || "")} /></Form.Group></Col>
        </Row>
        <Row>
          <Col md={6}><Form.Group className="mb-3"><Form.Label>Delivery Type *</Form.Label><Select options={deliveryOptions} value={deliveryOptions.find((option) => option.value === formData.deliveryTypeCode) || null} onChange={(option) => updateField("deliveryTypeCode", option?.value || "")} /></Form.Group></Col>
          <Col md={6}><Form.Group className="mb-3"><Form.Label>Pricing Type *</Form.Label><Select options={priceTypes} value={priceTypes.find((option) => option.value === formData.priceType)} onChange={(option) => updateField("priceType", option?.value || "FIXED")} /></Form.Group></Col>
        </Row>
        {formData.priceType === "FIXED" && <Form.Group className="mb-3"><Form.Label>Fixed Amount (KES) *</Form.Label><Form.Control type="number" min="0" step="0.01" name="rateAmount" value={formData.rateAmount} onChange={onInputChange} placeholder="Amount applied to every matching package" /></Form.Group>}
        {formData.priceType === "PER_KM" && <Row>
          <Col md={4}><Form.Group className="mb-3"><Form.Label>Base Price (KES) *</Form.Label><Form.Control type="number" min="0" step="0.01" name="basePrice" value={formData.basePrice} onChange={onInputChange} /></Form.Group></Col>
          <Col md={4}><Form.Group className="mb-3"><Form.Label>Base KM Included *</Form.Label><Form.Control type="number" min="0" step="0.1" name="baseKM" value={formData.baseKM} onChange={onInputChange} /></Form.Group></Col>
          <Col md={4}><Form.Group className="mb-3"><Form.Label>Price per Extra KM *</Form.Label><Form.Control type="number" min="0" step="0.01" name="pricePerKM" value={formData.pricePerKM} onChange={onInputChange} /></Form.Group></Col>
          <Col xs={12}><div className="alert alert-light border small">
            <strong>Practical example:</strong>{' '}
            For a 12 KM delivery, KES {Number(formData.basePrice || 0).toFixed(2)} + ({Math.max(0, 12 - Number(formData.baseKM || 0)).toFixed(1)} extra KM x KES {Number(formData.pricePerKM || 0).toFixed(2)}) = <strong>KES {(Number(formData.basePrice || 0) + Math.max(0, 12 - Number(formData.baseKM || 0)) * Number(formData.pricePerKM || 0)).toFixed(2)}</strong>.
          </div></Col>
        </Row>}
        {formData.priceType === "ZONING" && <div className="border rounded overflow-hidden mb-3"><Table responsive className="mb-0 align-middle">
          <thead><tr><th>Price zone band</th><th>Sorting areas</th><th style={{ width: 210 }}>Price (KES)</th></tr></thead>
          <tbody>{zones.map((zone) => <tr key={zone.id}><td className="fw-semibold">{zone.name}</td><td className="small text-muted">{zone.dcCodes.join(", ") || "No sorting areas assigned"}</td><td><Form.Control type="number" min="0" step="0.01" value={zonePrices[zone.id] ?? ""} onChange={(event) => updateField("zonePrices", { ...zonePrices, [zone.id]: event.target.value })} placeholder="0.00" /></td></tr>)}</tbody>
        </Table>{!zones.length && <div className="p-3 text-muted">Create price zones before configuring zone-band pricing.</div>}</div>}
      </Form>
    </Modal.Body>
    <Modal.Footer><Button variant="outline-secondary" onClick={onHide}>Cancel</Button><Button variant="primary" onClick={onSubmit} disabled={loading || !canSubmit}>{loading ? "Saving..." : "Save Pricing"}</Button></Modal.Footer>
  </Modal>;
};

AddRoutePricingModal.propTypes = { show: PropTypes.bool.isRequired, onHide: PropTypes.func.isRequired, formData: PropTypes.object.isRequired, onInputChange: PropTypes.func.isRequired, onSubmit: PropTypes.func.isRequired, loading: PropTypes.bool, priceZones: PropTypes.array };
export default AddRoutePricingModal;
