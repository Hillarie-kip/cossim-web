export default function ScanLookupQueue({ activeCode, queuedCodes = [] }) {
  if (!activeCode && !queuedCodes.length) return null;

  return (
    <div className="border rounded mb-3 p-2" role="status" aria-live="polite" aria-atomic="true">
      <div className="small fw-semibold mb-2">Scan lookups</div>
      <ul className="list-unstyled mb-0" style={{ maxHeight: 180, overflowY: "auto" }}>
        {activeCode && <li className="d-flex align-items-center gap-2 py-1">
          <span className="spinner-border spinner-border-sm text-primary flex-shrink-0" aria-hidden="true" />
          <span className="small text-break flex-grow-1">{activeCode}</span>
          <span className="small text-primary text-nowrap">Looking up…</span>
        </li>}
        {queuedCodes.map((code, index) => <li key={`${index}-${code}`} className="d-flex align-items-center gap-2 py-1">
          <span className="small text-break flex-grow-1">{code}</span>
          <span className="small text-muted text-nowrap">Waiting</span>
        </li>)}
      </ul>
    </div>
  );
}
