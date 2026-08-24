"use client";
import {
  CheckCircle,
  MoreHorizontal,
  PauseCircle,
  RotateCcw,
  Search,
  Truck,
  X,
  PlusCircle,
} from "feather-icons-react";
import React, { useEffect, useMemo, useState } from "react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import Datatable from "@/core/pagination/datatable";
import RowActionsDropdown from "@/components/RowActionsDropdown";
import { useAdmin } from "@/hooks/useAdmin";
import { AddCourierModal } from "@/components/modals";
import styles from "./page.module.scss";

const dateFormatter = new Intl.DateTimeFormat("en-KE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const CouriersPage = () => {
  const MySwal = withReactContent(Swal);

  const {
    couriers,
    loading,
    error,
    fetchCouriers,
    handleAddCourier,
    handleDeactivateCourier,
  } = useAdmin();

  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCouriers();
  }, [fetchCouriers]);

  const handleRefresh = () => {
    fetchCouriers();
  };

  const handleAddSubmit = async (data) => {
    setIsSaving(true);
    try {
      await handleAddCourier(data);
      setShowAddModal(false);
    } catch {
      // Error toast already handled in useAdmin
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = (record) => {
    const activating = !record.IsActive;
    MySwal.fire({
      title: activating ? "Activate Courier" : "Deactivate Courier",
      text: activating
        ? `Reactivate ${record.CourierName} (${record.CourierCode})?`
        : `Deactivate ${record.CourierName} (${record.CourierCode})? It will no longer be assignable to batches.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: activating ? "#28a745" : "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: activating ? "Yes, activate" : "Yes, deactivate",
    }).then((result) => {
      if (result.isConfirmed) {
        handleDeactivateCourier({
          courierCode: record.CourierCode,
          isActive: activating,
        });
      }
    });
  };

  const filteredCouriers = useMemo(() => {
    if (!Array.isArray(couriers)) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return couriers;
    return couriers.filter(
      (c) =>
        c.CourierCode?.toLowerCase().includes(term) ||
        c.CourierName?.toLowerCase().includes(term)
    );
  }, [couriers, searchTerm]);

  const courierStats = useMemo(() => {
    const list = Array.isArray(couriers) ? couriers : [];
    const active = list.filter((courier) => courier.IsActive).length;

    return {
      total: list.length,
      active,
      inactive: list.length - active,
    };
  }, [couriers]);

  const columns = [
    {
      title: "Courier Code",
      dataIndex: "CourierCode",
      width: 180,
      render: (code) => (
        <span className={styles.codeCell}>
          <strong>{code || "—"}</strong>
        </span>
      ),
      sorter: (a, b) => (a.CourierCode || "").localeCompare(b.CourierCode || ""),
    },
    {
      title: "Courier Name",
      dataIndex: "CourierName",
      width: 240,
      render: (name) => <span className={styles.nameCell}>{name || "—"}</span>,
      sorter: (a, b) => (a.CourierName || "").localeCompare(b.CourierName || ""),
    },
    {
      title: "Status",
      dataIndex: "IsActive",
      width: 140,
      render: (isActive) => (
        <span
          className={`${styles.statusBadge} ${
            isActive ? styles.statusActive : styles.statusInactive
          }`}
        >
          <span className={styles.statusDot} aria-hidden="true" />
          {isActive ? "Active" : "Inactive"}
        </span>
      ),
      sorter: (a, b) => Number(a.IsActive) - Number(b.IsActive),
    },
    {
      title: "Date Added",
      dataIndex: "DateCreated",
      width: 170,
      render: (date) => {
        if (!date) return <span className={styles.mutedCell}>—</span>;
        const parsedDate = new Date(date);
        return (
          <span className={styles.dateCell}>
            {Number.isNaN(parsedDate.getTime()) ? "—" : dateFormatter.format(parsedDate)}
          </span>
        );
      },
      sorter: (a, b) => new Date(a.DateCreated) - new Date(b.DateCreated),
    },
    {
      title: "",
      dataIndex: "action",
      key: "actions",
      width: 88,
      render: (_, record) => (
        <RowActionsDropdown
          id={`dropdown-basic-${record.CourierCode}`}
          label={<MoreHorizontal size={18} aria-label="Courier actions" />}
          variant="light"
          items={[
            {
              key: "toggle-active",
              label: record.IsActive ? "Deactivate" : "Activate",
              icon: record.IsActive ? "feather-x-circle" : "feather-check-circle",
              danger: record.IsActive,
              onClick: () => handleToggleActive(record),
            },
          ]}
        />
      ),
    },
  ];

  const renderRefreshTooltip = (props) => (
    <Tooltip id="refresh-tooltip" {...props}>
      Refresh
    </Tooltip>
  );
  return (
    <React.Fragment>
      <AddCourierModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddSubmit}
        isLoading={isSaving}
      />

      <div className={`content ${styles.couriersPage}`}>
        <div className={`page-header ${styles.pageHeader}`}>
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Couriers</h4>
              <h6>Manage courier partners used for handover batches</h6>
            </div>
          </div>
          <div className={styles.headerActions}>
            <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={handleRefresh}
                disabled={loading}
                aria-label="Refresh couriers"
              >
                <RotateCcw size={18} className={loading ? "rotate" : ""} />
              </button>
            </OverlayTrigger>
            <button
              className={`btn btn-added ${styles.addButton}`}
              type="button"
              onClick={() => setShowAddModal(true)}
              disabled={loading}
            >
              <PlusCircle size={18} />
              Add Courier
            </button>
          </div>
        </div>

        <div className={styles.summaryGrid} aria-label="Courier summary">
          <div className={styles.summaryCard}>
            <span className={`${styles.summaryIcon} ${styles.summaryIconTotal}`}>
              <Truck size={18} />
            </span>
            <span>
              <span className={styles.summaryLabel}>Total couriers</span>
              <strong>{courierStats.total}</strong>
            </span>
          </div>
          <div className={styles.summaryCard}>
            <span className={`${styles.summaryIcon} ${styles.summaryIconActive}`}>
              <CheckCircle size={18} />
            </span>
            <span>
              <span className={styles.summaryLabel}>Active</span>
              <strong>{courierStats.active}</strong>
            </span>
          </div>
          <div className={styles.summaryCard}>
            <span className={`${styles.summaryIcon} ${styles.summaryIconInactive}`}>
              <PauseCircle size={18} />
            </span>
            <span>
              <span className={styles.summaryLabel}>Inactive</span>
              <strong>{courierStats.inactive}</strong>
            </span>
          </div>
        </div>

        <div className={`card table-list-card ${styles.tableCard}`}>
          <div className={`card-body ${styles.cardBody}`}>
            <div className={styles.tableToolbar}>
              <div>
                <h5>Courier directory</h5>
                <p>
                  {searchTerm
                    ? `${filteredCouriers.length} matching courier${
                        filteredCouriers.length === 1 ? "" : "s"
                      }`
                    : `${courierStats.total} registered courier${
                        courierStats.total === 1 ? "" : "s"
                      }`}
                </p>
              </div>
              <div className={styles.searchBox}>
                <Search size={17} aria-hidden="true" />
                <input
                  id="courier-search"
                  type="text"
                  placeholder="Search by name or code"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search couriers by name or code"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear courier search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                <strong>Error:</strong> {error}
              </div>
            )}

            <div className="table-responsive">
              <Datatable
                className={styles.couriersTable}
                columns={columns}
                dataSource={filteredCouriers}
                loading={loading}
                rowKey="CourierCode"
                rowSelection={null}
                maxBodyHeight={600}
                emptyTitle={searchTerm ? "No matching couriers" : "No couriers yet"}
                emptyDescription={
                  searchTerm
                    ? `No courier matches “${searchTerm}”. Try another name or code.`
                    : "Add your first courier partner to start assigning handover batches."
                }
                emptyAction={
                  searchTerm ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setSearchTerm("")}
                    >
                      Clear search
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => setShowAddModal(true)}
                    >
                      Add courier
                    </button>
                  )
                }
                pagination={{
                  defaultPageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "25", "50"],
                  showQuickJumper: false,
                  hideOnSinglePage: filteredCouriers.length <= 10,
                  showTotal: (total, range) =>
                    `${range[0]}–${range[1]} of ${total} couriers`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default CouriersPage;
