// Preserve API order and the first full record, including items and payments.
export const uniqueShipmentOrders = (rows = []) => {
  const seen = new Set();
  return rows.filter((row) => {
    const key = String(row.OrderNO ?? '').trim().toUpperCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
