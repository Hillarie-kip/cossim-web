"use client";

/**
 * EXAMPLE: Simple table with client-side data export
 * 
 * This example shows how to use TableExportIcons with client-side data
 * (no server-side pagination)
 */

import React from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import Link from "@/components/Link";
import Datatable from "@/core/pagination/datatable";
import TableExportIcons from "@/components/TableExportIcons";
import { ChevronUp, RotateCcw } from "feather-icons-react";

const SimpleTableWithExport = () => {
  // Sample data - in real app, this could come from useState, props, or a hook
  const data = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "Admin",
      status: "Active",
      joinDate: "2024-01-15"
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      role: "User",
      status: "Active",
      joinDate: "2024-02-20"
    },
    {
      id: 3,
      name: "Bob Johnson",
      email: "bob@example.com",
      role: "Moderator",
      status: "Inactive",
      joinDate: "2024-03-10"
    },
  ];

  // Define columns
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Name",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Role",
      dataIndex: "role",
      render: (text) => (
        <span className={`badge ${
          text === 'Admin' ? 'bg-danger' : 
          text === 'Moderator' ? 'bg-warning' : 
          'bg-info'
        }`}>
          {text}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text) => (
        <span className={`badge ${text === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
          {text}
        </span>
      ),
    },
    {
      title: "Join Date",
      dataIndex: "joinDate",
      sorter: (a, b) => new Date(a.joinDate) - new Date(b.joinDate),
    },
    {
      title: "Action",
      dataIndex: "action",
      // This column will be automatically excluded from export
      render: (_, record) => (
        <div>
          <button className="btn btn-sm btn-primary me-1">Edit</button>
          <button className="btn btn-sm btn-danger">Delete</button>
        </div>
      ),
    },
  ];

  const renderRefreshTooltip = (props) => (
    <Tooltip id="refresh-tooltip" {...props}>
      Refresh
    </Tooltip>
  );

  const renderCollapseTooltip = (props) => (
    <Tooltip id="collapse-tooltip" {...props}>
      Collapse
    </Tooltip>
  );

  return (
    <div className="content">
      <div className="page-header">
        <div className="add-item d-flex">
          <div className="page-title">
            <h4>Users</h4>
            <h6>Manage system users</h6>
          </div>
        </div>
        
        <ul className="table-top-head">
          {/* 
            Simple usage: Just pass data and columns
            No fetchAllData needed since this is client-side data
          */}
          <TableExportIcons
            data={data}
            columns={columns}
            filename="users-list"
            title="Users Report"
          />
          
          <li>
            <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
              <Link style={{ cursor: 'pointer' }}>
                <RotateCcw />
              </Link>
            </OverlayTrigger>
          </li>
          <li>
            <OverlayTrigger placement="top" overlay={renderCollapseTooltip}>
              <Link id="collapse-header">
                <ChevronUp />
              </Link>
            </OverlayTrigger>
          </li>
        </ul>
      </div>

      <div className="card table-list-card">
        <div className="card-body">
          <div className="table-responsive">
            <Datatable 
              columns={columns} 
              dataSource={data} 
              rowKey="id"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTableWithExport;
