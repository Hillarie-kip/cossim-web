import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const ink = [20, 36, 60], orange = [238, 102, 30], muted = [103, 115, 133], green = [20, 115, 88];
const amount = (value) => value == null ? "Not recorded" : Number(value).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not recorded";
const sum = (items, key) => items.some((item) => item[key] == null) ? null : items.reduce((total, item) => total + Number(item[key]), 0);

export function buildSettlementPdf(settlement, vendorName) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const items = (settlement.itemsArray || []).filter((item) => Number(item.statusID) !== 0);
  const gross = Number(settlement.totalAmount || 0) + Number(settlement.transferFee || 0);
  const totals = Object.fromEntries(["orderAmount", "paidAmount", "serviceFee", "returnCost"].map((key) => [key, sum(items, key)]));
  const serviceDeducted = totals.orderAmount == null || totals.returnCost == null ? null : totals.orderAmount - totals.returnCost - gross;
  const state = { 1: "ACTIVE", 2: "PENDING", 3: "PROCESSING", 4: "COMPLETED", 5: "CANCELLED" }[Number(settlement.statusID)] || "RECORDED";
  const text = (value, x, y, size = 10, color = ink, bold = false, options = {}) => {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size); doc.setTextColor(...color);
    doc.text(Array.isArray(value) ? value : String(value), x, y, options);
  };
  const wrapped = (value, width, size) => { doc.setFontSize(size); return doc.splitTextToSize(String(value || "Not recorded"), width); };
  const pageHeader = () => {
    doc.setFillColor(...orange); doc.rect(0, 27, 210, 1.5, "F");
    text("COSSIM", 14, 16, 20, ink, true);
    text("VENDOR REMITTANCE STATEMENT", 196, 12, 9, ink, true, { align: "right" });
    text(settlement.settlementNO || "Settlement", 196, 20, 10, muted, false, { align: "right" });
  };
  text("Remittance statement", 14, 42, 22, ink, true);
  text(`${state}  /  ${date(settlement.settledAt || settlement.dateAdded)}`, 14, 50, 9, muted);
  text("PREPARED FOR", 14, 62, 8, muted, true);
  const vendorLines = wrapped(vendorName || settlement.vendorCode, 100, 13);
  text(vendorLines, 14, 69, 13, ink, true);
  const vendorBottom = 69 + (vendorLines.length - 1) * 5;
  text(settlement.vendorCode || "", 14, vendorBottom + 6, 9, muted);
  text("PAYMENT REFERENCE", 130, 62, 8, muted, true);
  const refLines = wrapped(settlement.settlementReferenceNO, 66, 10);
  text(refLines, 130, 69, 10, ink, true);
  let y = Math.max(vendorBottom + 14, 69 + refLines.length * 4.5 + 8);
  doc.setFillColor(236, 247, 242); doc.roundedRect(14, y, 182, 26, 3, 3, "F");
  text("NET AMOUNT REMITTED", 20, y + 9, 8, green, true);
  text(`KES ${amount(settlement.totalAmount || 0)}`, 20, y + 20, 23, green, true);
  text(`${items.length} settlement item${items.length === 1 ? "" : "s"}`, 190, y + 10, 9, green, false, { align: "right" });
  text("After fees and transaction cost", 190, y + 19, 8, green, false, { align: "right" });
  y += 30;
  text("01  PAYMENT RECONCILIATION", 14, y, 10, ink, true);
  autoTable(doc, {
    startY: y + 5, margin: { left: 14, right: 14, top: 36, bottom: 18 }, theme: "plain",
    body: [
      ["Order amount", amount(totals.orderAmount), "Verified payments", amount(totals.paidAmount)],
      ["Service fees", amount(totals.serviceFee), "Service fees deducted", amount(serviceDeducted)],
      ["Return fees deducted", amount(totals.returnCost), "Before transaction cost", amount(gross)],
      ["Transaction cost", amount(settlement.transferFee || 0), "Net remittance", amount(settlement.totalAmount || 0)],
    ],
    styles: { font: "helvetica", fontSize: 8, cellPadding: 3, textColor: ink, overflow: "linebreak" },
    columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 38, halign: "right", fontStyle: "bold" }, 2: { cellWidth: 56 }, 3: { cellWidth: 38, halign: "right", fontStyle: "bold" } },
    alternateRowStyles: { fillColor: [246, 248, 251] },
  });
  y = doc.lastAutoTable.finalY + 10;
  text("02  ORDER & RETURN BREAKDOWN", 14, y, 10, ink, true);
  text("All amounts in KES. Item net amounts are before the transaction cost.", 14, y + 6, 8, muted);
  autoTable(doc, {
    startY: y + 11, margin: { left: 14, right: 14, top: 36, bottom: 32 },
    head: [["Order / receiver", "Order\namount", "Paid\namount", "Service\nfee", "Return\nfee", "Net before\ntransaction"]],
    body: items.map((item) => [item.orderNO + (item.receiverName ? "\n" + item.receiverName : ""), amount(item.orderAmount), amount(item.paidAmount), amount(item.serviceFee), amount(item.returnCost), amount(item.codAmount)]),
    foot: [
      ["TOTAL BEFORE COST", amount(totals.orderAmount), amount(totals.paidAmount), amount(totals.serviceFee), amount(totals.returnCost), amount(items.reduce((total, item) => total + Number(item.codAmount || 0), 0))],
      [{ content: "Less transaction cost", colSpan: 5 }, amount(-Number(settlement.transferFee || 0))],
      [{ content: "NET AMOUNT REMITTED", colSpan: 5, styles: { textColor: green } }, { content: amount(settlement.totalAmount || 0), styles: { textColor: green } }],
    ],
    showFoot: "lastPage", theme: "grid", rowPageBreak: "avoid",
    styles: { font: "helvetica", fontSize: 8, cellPadding: 2, lineColor: [228, 233, 239], lineWidth: 0.15, textColor: ink, overflow: "linebreak" },
    headStyles: { fillColor: ink, textColor: [255, 255, 255], fontSize: 8 },
    footStyles: { fillColor: [235, 240, 246], textColor: ink, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 57 }, 1: { cellWidth: 25, halign: "right" }, 2: { cellWidth: 25, halign: "right" }, 3: { cellWidth: 23, halign: "right" }, 4: { cellWidth: 23, halign: "right" }, 5: { cellWidth: 29, halign: "right", fontStyle: "bold" } },
  });
  const note = "Service fees are deducted only where included in order COD. Accepted-return fees are deducted from the vendor balance. The transaction cost is charged once per remittance. Fee amounts are recorded when the remittance is posted.";
  // Keep explanatory notes with the summary instead of creating a notes-only page.
  doc.setPage(1);
  text(wrapped(note, 182, 7), 14, 271, 7, muted);
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); pageHeader(); doc.setDrawColor(222, 228, 236); doc.line(14, 280, 196, 280);
    text("COSSIM  |  Vendor remittance statement  |  KES", 14, 286, 8, muted);
    text(`Page ${page} of ${pages}`, 196, 286, 8, muted, false, { align: "right" });
  }
  doc.setProperties({ title: `Remittance ${settlement.settlementNO}`, subject: "Vendor fees and payment reconciliation", author: "COSSIM" });
  return doc;
}
