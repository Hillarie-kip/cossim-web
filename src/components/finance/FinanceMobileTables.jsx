"use client";

import React, { useEffect, useRef } from "react";

const textFromHeader = (cell, index) => {
  const text = cell?.textContent?.replace(/\s+/g, " ").trim();
  return text || (index === 0 ? "Item" : "Action");
};

export default function FinanceMobileTables({ children }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const labelTableCells = () => {
      root.querySelectorAll("table").forEach((table) => {
        const headers = Array.from(table.querySelectorAll(":scope > thead > tr:last-child > th"));
        if (!headers.length) return;
        const labels = headers.map(textFromHeader);
        table.classList.add("finance-mobile-card-table");
        table.querySelectorAll(":scope > tbody > tr").forEach((row) => {
          const cells = Array.from(row.children).filter((cell) => cell.tagName === "TD");
          if (cells.length === 1 && Number(cells[0].colSpan) > 1) {
            row.classList.add("finance-mobile-empty-row");
            return;
          }
          cells.forEach((cell, index) => {
            cell.dataset.label = labels[index] || `Field ${index + 1}`;
          });
        });
      });
    };

    labelTableCells();
    const observer = new MutationObserver(labelTableCells);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return <div ref={rootRef} className="finance-mobile-tables">
    {children}
    <style jsx global>{`
      @media (max-width: 767.98px) {
        .finance-mobile-tables .table-responsive,
        .finance-mobile-tables .ant-table-content,
        .finance-mobile-tables .ant-table-body { overflow: visible !important; }
        .finance-mobile-tables table.finance-mobile-card-table,
        .finance-mobile-tables table.finance-mobile-card-table > tbody { display: block; width: 100% !important; min-width: 0 !important; }
        .finance-mobile-tables table.finance-mobile-card-table > thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
        .finance-mobile-tables table.finance-mobile-card-table > tbody { display: grid; gap: 12px; background: transparent; }
        .finance-mobile-tables table.finance-mobile-card-table > tbody > tr:not(.ant-table-measure-row) {
          display: grid;
          width: 100%;
          overflow: hidden;
          border: 1px solid #e4e7ec;
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 3px 12px rgba(16, 24, 40, .07);
        }
        .finance-mobile-tables table.finance-mobile-card-table > tbody > tr.ant-table-measure-row { display: none; }
        .finance-mobile-tables table.finance-mobile-card-table > tbody > tr > td {
          display: grid !important;
          grid-template-columns: minmax(105px, 38%) minmax(0, 1fr);
          gap: 12px;
          width: 100% !important;
          max-width: none !important;
          padding: 11px 13px !important;
          border: 0 !important;
          border-bottom: 1px solid #f0f2f5 !important;
          background: #fff !important;
          text-align: left !important;
          white-space: normal !important;
          overflow-wrap: anywhere;
        }
        .finance-mobile-tables table.finance-mobile-card-table > tbody > tr > td:last-child { border-bottom: 0 !important; }
        .finance-mobile-tables table.finance-mobile-card-table > tbody > tr > td::before {
          content: attr(data-label);
          color: #667085;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .02em;
          text-transform: uppercase;
        }
        .finance-mobile-tables table.finance-mobile-card-table > tbody > tr > td:first-child {
          border-top: 3px solid #ff6200 !important;
        }
        .finance-mobile-tables table.finance-mobile-card-table > tbody > tr.finance-mobile-empty-row > td,
        .finance-mobile-tables table.finance-mobile-card-table > tbody > tr.ant-table-placeholder > td {
          display: block !important;
          padding: 28px 16px !important;
          text-align: center !important;
        }
        .finance-mobile-tables table.finance-mobile-card-table > tbody > tr.finance-mobile-empty-row > td::before,
        .finance-mobile-tables table.finance-mobile-card-table > tbody > tr.ant-table-placeholder > td::before { content: none; }
        .finance-mobile-tables .ant-table-cell-fix-left,
        .finance-mobile-tables .ant-table-cell-fix-right { position: static !important; }
        .finance-mobile-tables .ant-table-pagination { margin: 16px 0 0 !important; justify-content: center; }
      }
    `}</style>
  </div>;
}
