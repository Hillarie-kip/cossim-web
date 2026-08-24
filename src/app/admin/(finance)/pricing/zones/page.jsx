"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Badge, Button } from "react-bootstrap";
import { ArrowLeft, PlusCircle, RotateCcw, Search } from "feather-icons-react";
import Link from "@/components/Link";
import { AddPriceZoneModal } from "@/components/modals";
import { useFinance } from "@/hooks/useFinance";

const valueOf = (record, ...keys) => keys.map((key) => record?.[key]).find((value) => value !== undefined && value !== null);

export default function PriceZonesPage() {
  const { loading, error, shipmentRates, priceZones, fetchShipmentRates, fetchPriceZones, handleCreatePriceZone } = useFinance();
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");

  const loadData = async () => Promise.all([fetchPriceZones(), fetchShipmentRates({ pageNo: 1, pageSize: 1000 })]);
  useEffect(() => { loadData(); }, [fetchPriceZones, fetchShipmentRates]);

  const rows = useMemo(() => {
    const rates = Array.isArray(shipmentRates) ? shipmentRates : [];
    const query = search.trim().toLowerCase();
    return (Array.isArray(priceZones) ? priceZones : []).map((zone) => {
      const id = valueOf(zone, "PriceZoneID", "priceZoneID", "priceZoneId");
      const name = valueOf(zone, "PriceZoneName", "ZoneName", "priceZoneName", "zoneName") || `Zone ${id}`;
      const pricing = rates.filter((rate) => {
        const rateID = valueOf(rate, "PriceZoneID", "priceZoneID", "priceZoneId");
        const rateName = valueOf(rate, "PriceZoneName", "ZoneName", "priceZoneName", "zoneName");
        return (id != null && String(rateID) === String(id)) || (rateName && String(rateName).toLowerCase() === String(name).toLowerCase());
      });
      return { zone, id, name, pricing };
    }).filter(({ zone, name, pricing }) => !query || `${name} ${JSON.stringify(zone)} ${pricing.map((rate) => `${rate.VendorName || ""} ${rate.VendorCode || ""}`).join(" ")}`.toLowerCase().includes(query));
  }, [priceZones, shipmentRates, search]);

  const dcNames = (zone) => {
    const centers = valueOf(zone, "DistributionCenters", "distributionCenters", "DCs", "dcs");
    if (Array.isArray(centers)) return centers.map((dc) => dc.DCName || dc.dcName || dc.DCCode || dc.dcCode).filter(Boolean).join(", ");
    const codes = valueOf(zone, "DCCodes", "dcCodes", "DCCode", "dcCode");
    return Array.isArray(codes) ? codes.join(", ") : (codes || "No distribution centers");
  };

  return <div className="content">
    <div className="page-header">
      <div className="page-title"><h4>Price Zones</h4><h6>Manage zones and review their vendor pricing</h6></div>
      <div className="page-btn d-flex flex-wrap gap-2">
        <Link to="/admin/pricing" className="btn btn-secondary d-flex align-items-center text-nowrap"><ArrowLeft className="me-2 iconsize" /> Route Pricing</Link>
        <Button variant="outline-secondary" onClick={loadData} aria-label="Refresh price zones"><RotateCcw size={17} /></Button>
        <Button variant="primary" onClick={() => setShowAddModal(true)} className="btn btn-added text-nowrap"><PlusCircle className="me-2 iconsize" /> Add Price Zone</Button>
      </div>
    </div>

    <div className="card table-list-card"><div className="card-body">
      <div className="input-group mb-4" style={{ maxWidth: 520 }}><span className="input-group-text"><Search size={17} /></span><input className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search zone, DC, vendor, or code" /></div>
      {loading && !rows.length && <div className="text-center py-5"><div className="spinner-border" role="status" /></div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {!loading && !rows.length && <div className="text-center text-muted py-5">No price zones found.</div>}
      <div className="row g-4">{rows.map(({ zone, id, name, pricing }) => <div className="col-12" key={id || name}>
        <section className="border rounded overflow-hidden bg-white">
          <div className="d-flex flex-column flex-md-row justify-content-between gap-2 p-3 bg-light border-bottom">
            <div><h5 className="mb-1">{name}</h5><div className="text-muted small">{dcNames(zone)}</div>{valueOf(zone, "Description", "description") && <div className="small mt-1">{valueOf(zone, "Description", "description")}</div>}</div>
            <div><Badge bg={Number(valueOf(zone, "StatusID", "statusID") ?? 1) === 1 ? "success" : "secondary"}>{Number(valueOf(zone, "StatusID", "statusID") ?? 1) === 1 ? "Active" : "Inactive"}</Badge></div>
          </div>
          <div className="table-responsive"><table className="table table-hover align-middle mb-0">
            <thead><tr><th>Vendor</th><th>Package Size</th><th>Delivery Type</th><th>Price Type</th><th className="text-end">Rate Amount</th><th>Status</th></tr></thead>
            <tbody>{pricing.length ? pricing.map((rate) => <tr key={rate.ShipmentRateID || rate.ShipmentRateNO}>
              <td><strong>{rate.VendorName || "N/A"}</strong><div className="small text-muted">{rate.VendorCode || ""}</div></td><td>{rate.ShipmentRateSize || "N/A"}</td><td>{rate.DeliveryTypeName || rate.DeliveryTypeCode || "N/A"}</td><td>{rate.PriceType || "N/A"}</td><td className="text-end text-nowrap">KSh {Number(rate.RateAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td><Badge bg={Number(rate.StatusID) === 1 ? "success" : "secondary"}>{Number(rate.StatusID) === 1 ? "Active" : "Inactive"}</Badge></td>
            </tr>) : <tr><td colSpan="6" className="text-center text-muted py-4">No pricing has been assigned to this zone.</td></tr>}</tbody>
          </table></div>
        </section>
      </div>)}</div>
    </div></div>
    <AddPriceZoneModal show={showAddModal} onHide={() => setShowAddModal(false)} onSubmit={handleCreatePriceZone} />
  </div>;
}
