"use client"
import {
  ChevronUp,
  RotateCcw,
  Download,
  PlusCircle,
} from "feather-icons-react";
import React from "react";
import { OverlayTrigger, Tooltip, Badge } from "react-bootstrap";
import Link from "@/components/Link";
import { smsAuditLogsMock } from "@/core/data/sms_audit_logs.mock";
import { all_routes } from "@/Router/all_routes";
import Datatable from "@/core/pagination/datatable";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import notify from "@/lib/toast";

const SMSAuditLogsList = () => {
  const route = all_routes;

  const showMessageContent = (content) => {
    notify.info(content);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      sent: "success",
      pending: "warning",
      failed: "danger",
      delivered: "info"
    };
    return statusMap[status] || "secondary";
  };

  const getMessageTypeBadge = (type) => {
    const typeMap = {
      otp: "primary",
      notification: "info",
      reminder: "warning",
      promotional: "secondary"
    };
    return typeMap[type] || "secondary";
  };

  const columns = [
    {
      title: "Reference",
      dataIndex: "internal_reference",
      sorter: (a, b) => a.internal_reference.localeCompare(b.internal_reference),
    },
    {
      title: "Recipient",
      dataIndex: "recipient_phone",
      sorter: (a, b) => a.recipient_phone.localeCompare(b.recipient_phone),
    },
    {
      title: "Recipient Name",
      dataIndex: "recipient_name",
      render: (name) => name || "N/A",
    },
    {
      title: "Message Type",
      dataIndex: "message_type",
      render: (type) => (
        <Badge bg={getMessageTypeBadge(type)}>
          {type?.toUpperCase()}
        </Badge>
      ),
    },
    {
      title: "Provider",
      dataIndex: "provider",
      render: (provider) => provider?.replace('_', ' ').toUpperCase() || "N/A",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <Badge bg={getStatusBadge(status)}>
          {status?.charAt(0).toUpperCase() + status?.slice(1)}
        </Badge>
      ),
    },
    {
      title: "Cost",
      dataIndex: "cost",
      render: (cost, record) => `${cost} ${record.currency}`,
      sorter: (a, b) => a.cost - b.cost,
    },
    {
      title: "Sent At",
      dataIndex: "sent_at",
      render: (date) => date ? new Date(date).toLocaleString() : "N/A",
    },
    {
      title: "Delivered At",
      dataIndex: "delivered_at",
      render: (date) => date ? new Date(date).toLocaleString() : "Pending",
    },
    {
      title: "Failed At",
      dataIndex: "failed_at",
      render: (date) => date ? new Date(date).toLocaleString() : "-",
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => (
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip
              id={`tooltip-cta-${record.id}`}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <Link className="mb-2 text-light" to={`/admin/sms/${record.id}`}>
                  View Details
                </Link>
                <Link 
                  className="mb-2 text-light" 
                  to="#" 
                  onClick={() => showMessageContent(record.message_content)}
                >
                  View Message
                </Link>
                {record.status === "failed" && (
                  <Link className="text-light" to={`/admin/sms/retry/${record.id}`}>
                    Retry
                  </Link>
                )}
              </div>
            </Tooltip>
          }
          trigger={['click']}
          rootClose
        >
          <button className="btn btn-sm btn-light" type="button">
            ...
          </button>
        </OverlayTrigger>
      ),
    },
  ];

  const renderTooltip = (props) => (
    <Tooltip id="pdf-tooltip" {...props}>
      Pdf
    </Tooltip>
  );
  const renderExcelTooltip = (props) => (
    <Tooltip id="excel-tooltip" {...props}>
      Excel
    </Tooltip>
  );
  const renderRefreshTooltip = (props) => (
    <Tooltip id="refresh-tooltip" {...props}>
      Refresh
    </Tooltip>
  );
  const renderCollapseTooltip = (props) => (
    <Tooltip id="refresh-tooltip" {...props}>
      Collapse
    </Tooltip>
  );

  return (
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>SMS Audit Logs</h4>
              <h6>Track SMS message delivery and status</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <li>
              <OverlayTrigger placement="top" overlay={renderTooltip}>
                <Link>
                  <ImageWithBasePath src="assets/img/icons/pdf.svg" alt="img" />
                </Link>
              </OverlayTrigger>
            </li>
            <li>
              <OverlayTrigger placement="top" overlay={renderExcelTooltip}>
                <Link data-bs-toggle="tooltip" data-bs-placement="top">
                  <ImageWithBasePath
                    src="assets/img/icons/excel.svg"
                    alt="img"
                  />
                </Link>
              </OverlayTrigger>
            </li>
            <li>
              <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
                <Link data-bs-toggle="tooltip" data-bs-placement="top">
                  <RotateCcw />
                </Link>
              </OverlayTrigger>
            </li>
            <li>
              <OverlayTrigger placement="top" overlay={renderCollapseTooltip}>
                <Link
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  id="collapse-header"
                >
                  <ChevronUp />
                </Link>
              </OverlayTrigger>
            </li>
          </ul>
          <div className="page-btn">
            <Link to="/admin/sms/send" className="btn btn-added">
              <PlusCircle className="me-2 iconsize" />
              Send SMS
            </Link>
          </div>
          <div className="page-btn import">
            <Link
              to="#"
              className="btn btn-added color"
              data-bs-toggle="modal"
              data-bs-target="#view-notes"
            >
              <Download className="me-2" />
              Export Logs
            </Link>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-top">
              <div className="search-set">
                <input type="text" placeholder="Search" className="form-control form-control-sm" />
              </div>
            </div>
            <div className="table-responsive">
              <Datatable columns={columns} dataSource={smsAuditLogsMock} />
            </div>
          </div>
        </div>
      </div>
  );
};

export default SMSAuditLogsList;
