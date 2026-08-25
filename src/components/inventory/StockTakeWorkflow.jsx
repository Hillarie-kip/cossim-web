"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, ScanLine } from "lucide-react";
import Swal from "sweetalert2";
import { getDistributionCenters } from "@/services/adminService";
import { completeStockTake, scanStockTakeItem, startStockTake } from "@/services/inventoryService";
import notify from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { filterDistributionCentersToAssigned } from "@/services/dcService";

const number = (value) => Number(value || 0).toLocaleString("en-KE");

export default function StockTakeWorkflow() {
  const { user } = useAuth();
  const [centres, setCentres] = useState([]);
  const [dcCode, setDcCode] = useState("");
  const [session, setSession] = useState(null);
  const [scanCode, setScanCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const scanRef = useRef(null);

  useEffect(() => {
    getDistributionCenters({ pageNo: 1, pageSize: 1000 })
      .then((response) => setCentres(filterDistributionCentersToAssigned(user, Array.isArray(response?.Data) ? response.Data : [])))
      .catch((error) => notify.error(error.message || "Failed to load distribution centres."));
  }, [user]);

  const begin = async () => {
    if (!dcCode) return notify.warning("Select a distribution centre.");
    setBusy(true);
    try {
      const response = await startStockTake(dcCode);
      setSession(response.Data);
      setTimeout(() => scanRef.current?.focus(), 0);
    } catch (error) { notify.error(error.message); }
    finally { setBusy(false); }
  };

  const scan = async (event) => {
    event.preventDefault();
    const code = scanCode.trim();
    if (!code || !session) return;
    setBusy(true);
    try {
      const response = await scanStockTakeItem(session.StockTakeNO, code);
      setSession(response.Data);
      setRecentScans((current) => [{ code, time: new Date() }, ...current].slice(0, 8));
      setScanCode("");
      notify.success(`${code} counted.`);
    } catch (error) { notify.error(error.message); }
    finally { setBusy(false); setTimeout(() => scanRef.current?.focus(), 0); }
  };

  const complete = async () => {
    const confirmation = await Swal.fire({
      title: "Complete stock take?",
      html: `Counted <strong>${number(session.CountedStock)}</strong> of <strong>${number(session.ExpectedStock)}</strong> expected items.<br/>Variance: <strong>${number(session.Variance)}</strong>.`,
      icon: session.Variance === 0 ? "success" : "warning",
      showCancelButton: true,
      confirmButtonText: "Complete Stock Take",
      confirmButtonColor: "#ff6200",
    });
    if (!confirmation.isConfirmed) return;
    setBusy(true);
    try {
      const response = await completeStockTake(session.StockTakeNO);
      setSession(response.Data);
      notify.success("Stock take completed.");
    } catch (error) { notify.error(error.message); }
    finally { setBusy(false); }
  };

  const progress = session?.ExpectedStock ? Math.min(100, (session.CountedStock / session.ExpectedStock) * 100) : 0;
  return <main className="content"><div className="page-header"><div className="page-title"><h4>Stock Take</h4><h6>Scan and reconcile physical inventory at a distribution centre.</h6></div><Link href="/admin/inventory" className="btn btn-outline-secondary"><ArrowLeft size={15} className="me-1" />Inventory</Link></div>
    <div className="card"><div className="card-body">
      {!session ? <div className="mx-auto py-4" style={{ maxWidth: 620 }}><label className="form-label fw-semibold">Distribution centre</label><select className="form-select" value={dcCode} onChange={(event) => setDcCode(event.target.value)}><option value="">Select distribution centre</option>{centres.map((dc) => <option key={dc.DCCode} value={dc.DCCode}>{dc.DCName} ({dc.DCCode})</option>)}</select><button className="btn btn-primary w-100 mt-3" disabled={busy || !dcCode} onClick={begin}>{busy ? "Preparing opening stock…" : "Start Stock Take"}</button></div> : <>
        <div className="row g-3 mb-4"><div className="col-md-3"><div className="border rounded p-3"><small className="text-muted">Opening stock</small><h4 className="mb-0">{number(session.OpeningStock)}</h4></div></div><div className="col-md-3"><div className="border rounded p-3"><small className="text-muted">Expected stock</small><h4 className="mb-0">{number(session.ExpectedStock)}</h4></div></div><div className="col-md-3"><div className="border rounded p-3"><small className="text-muted">Counted</small><h4 className="mb-0 text-success">{number(session.CountedStock)}</h4></div></div><div className="col-md-3"><div className="border rounded p-3"><small className="text-muted">Variance</small><h4 className={`mb-0 ${session.Variance === 0 ? "text-success" : "text-danger"}`}>{number(session.Variance)}</h4></div></div></div>
        <div className="mb-4"><div className="d-flex justify-content-between small mb-1"><span>{session.DCName} · {session.StockTakeNO}</span><span>{Math.round(progress)}%</span></div><div className="progress" style={{ height: 8 }}><div className="progress-bar bg-success" style={{ width: `${progress}%` }} /></div></div>
        {session.StatusCode === "OPEN" ? <><form onSubmit={scan} className="p-4 border rounded bg-light"><label className="form-label fw-semibold"><ScanLine size={17} className="me-2" />Scan package or item code</label><div className="input-group"><input ref={scanRef} className="form-control form-control-lg" value={scanCode} onChange={(event) => setScanCode(event.target.value)} placeholder="Scan barcode or enter code" autoComplete="off" disabled={busy} /><button className="btn btn-primary px-4" disabled={busy || !scanCode.trim()}>Scan</button></div><small className="text-muted">Repeated product codes count the next unscanned matching item. Package order numbers are also accepted.</small></form><div className="d-flex justify-content-end mt-3"><button className="btn btn-primary" onClick={complete} disabled={busy}>Complete Stock Take</button></div></> : <div className="alert alert-success d-flex align-items-center gap-2"><CheckCircle size={20} />This stock take is completed.</div>}
        {recentScans.length > 0 && <div className="mt-4"><h6>Recent scans</h6><div className="list-group">{recentScans.map((item, index) => <div className="list-group-item d-flex justify-content-between" key={`${item.code}-${index}`}><strong>{item.code}</strong><small className="text-muted">{item.time.toLocaleTimeString()}</small></div>)}</div></div>}
      </>}
    </div></div>
  </main>;
}
