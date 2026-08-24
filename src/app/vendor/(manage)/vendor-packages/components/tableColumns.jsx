import React from 'react';
import { Send, Target } from 'feather-icons-react';

/**
 * Export-specific columns for the vendor packages table
 * These columns are flattened for better Excel export compatibility
 */
export const exportColumns = [
  {
    title: "Order NO",
    dataIndex: "OrderNO",
  },
  {
    title: "Receiver Name",
    dataIndex: "ReceiverContactName",
  },
  {
    title: "Receiver Phone",
    dataIndex: "ReceiverContactPhone",
  },
  {
    title: "Receiver Address",
    dataIndex: "ReceiverStreetName",
  },
  {
    title: "Receiver Building",
    dataIndex: "ReceiverBuilding",
  },
  {
    title: "Service Fee",
    dataIndex: "ServiceFee",
  },
  {
    title: "COD Amount",
    dataIndex: "CODAmount",
  },
  {
    title: "Origin DC",
    dataIndex: "OriginDCName",
  },
  {
    title: "Destination DC",
    dataIndex: "DestinationDCName",
  },
  {
    title: "Date Added",
    dataIndex: "DateAdded",
  },
  {
    title: "Status",
    dataIndex: "StatusName",
  },
  {
    title: "Rider Name",
    dataIndex: "RiderName",
  },
  {
    title: "Delivery Type",
    dataIndex: "DeliveryType",
  },
  {
    title: "Shipment Size",
    dataIndex: "ShipmentSize",
  },
  {
    title: "Sales Agent",
    dataIndex: "SalesAgent",
  },
];

/**
 * PDF-specific columns for the vendor packages table
 * These columns combine related data for better PDF presentation
 */
export const pdfColumns = [
  {
    title: "Order NO",
    dataIndex: "OrderNO",
    sorter: (a, b) => a.OrderNO.localeCompare(b.OrderNO),
  },
  {
    title: "Receiver",
    dataIndex: "ReceiverContactName",
    sorter: (a, b) => (a.ReceiverContactName || "").localeCompare(b.ReceiverContactName || ""),
    render: (text, record) => {
      if (!record.ReceiverContactName && !record.ReceiverContactPhone) {
        return <span>-</span>;
      }
      return (
        <div style={{ maxWidth: '200px' }} className="text-truncate" title={`${record.ReceiverContactName || "-"} (${record.ReceiverStreetName || "-"}) - ${record.ReceiverContactPhone || "-"}`}>
          <div>{record.ReceiverContactName || "-"}</div>
          <small className="text-muted">{record.ReceiverContactPhone || "-"}</small>
        </div>
      );
    },
  },
  {
    title: "Amount",
    dataIndex: "ServiceFee",
    render: (text, record) => {
      const serviceFee = record.ServiceFee ? parseFloat(record.ServiceFee).toFixed(2) : "0.00";
      const codAmount = record.CODAmount ? parseFloat(record.CODAmount).toFixed(2) : "0.00";
      return (
        <div>
          <div>Fee: {serviceFee}</div>
          <div>COD: {codAmount}</div>
        </div>
      );
    }
  },
  {
    title: "Route",
    dataIndex: "OriginDCName",
    sorter: (a, b) => (a.OriginDCName || "").localeCompare(b.OriginDCName || ""),
    render: (text, record) => (
      <div>
        <div className="d-flex align-items-center mb-1">
          <Send size={14} className="text-primary me-1" />
          <span className="ms-1 fw-medium">{record.OriginDCName}</span>
        </div>
        <div className="d-flex align-items-center">
          <Target size={14} className="text-success me-1" />
          <span className="ms-1 fw-medium">{record.DestinationDCName} <span>{record.ReceiverBuilding && (<>({record.ReceiverBuilding})</>)}</span></span>
        </div>
      </div>
    ),
  },
  {
    title: "Date Added",
    dataIndex: "DateAdded",
    sorter: (a, b) => new Date(a.DateAdded).getTime() - new Date(b.DateAdded).getTime(),
    render: (text) => {
      if (!text) return "-";
      const utcDate = new Date(text + "Z");
      return (
        <div>
          <div>{utcDate.toLocaleDateString()}</div>
          <small className="text-muted">{utcDate.toLocaleTimeString()}</small>
        </div>
      );
    },
  },
  {
    title: "Status",
    dataIndex: "StatusCode",
    sorter: (a, b) => (a.StatusName || "").localeCompare(b.StatusName || ""),
    render: (text, record) => <span>{record.StatusName || text}</span>,
  },
  {
    title: "Rider",
    dataIndex: "RiderName",
    sorter: (a, b) => (a.RiderName || "").localeCompare(b.RiderName || ""),
    render: (text) => text || "-",
  },
  {
    title: "Sales Agent",
    dataIndex: "SalesAgent",
    sorter: (a, b) => (a.SalesAgent || "").localeCompare(b.SalesAgent || ""),
    render: (text) => text || "-",
  },
];
