export default function PageLoading() {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center gap-3 p-5" role="status" aria-live="polite" style={{ minHeight: "40vh", color: "#c94d00" }}>
      <span className="spinner-border" aria-hidden="true" />
      <span>Loading page...</span>
    </div>
  );
}
