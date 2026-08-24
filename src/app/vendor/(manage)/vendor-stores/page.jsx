"use client";
import React, { useState, useEffect } from "react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import notify from "@/lib/toast";
import { Badge } from "react-bootstrap";
import RowActionsDropdown from "@/components/RowActionsDropdown";
import VendorPageHeader from "@/components/vendor/VendorPageHeader";
import { useVendorStoresForVendor } from "@/hooks/useVendorStoresForVendor";
import AddStoreModal from "@/components/modals/AddStoreModal";
import EditStoreModal from "@/components/modals/EditStoreModal";
import Datatable from "@/core/pagination/datatable";

const VendorStores = () => {
  const MySwal = withReactContent(Swal);

  // State management
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [storeToEdit, setStoreToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Use vendor stores hook (derives vendorCode from the authenticated user)
  const {
    vendorStores,
    totalCount,
    loading,
    error,
    vendorCode,
    fetchVendorStores,
    createVendorStore,
    updateVendorStore,
    deactivateVendorStore,
  } = useVendorStoresForVendor({});

  // Fetch stores on component mount and when vendorCode changes
  useEffect(() => {
    if (vendorCode) {
      fetchVendorStores({
        vendorCode,
        pageNo: currentPage,
        pageSize,
      });
    }
  }, [vendorCode, currentPage, pageSize, fetchVendorStores]);

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
    if (vendorCode) {
      fetchVendorStores({
        vendorCode,
        pageNo: 1,
        pageSize,
        search: value || undefined,
      });
    }
  };

  // Handle page change
  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    if (size && size !== pageSize) {
      setPageSize(size);
    }
  };

  // Handle create store
  const handleCreateStore = async (storeData) => {
    try {
      await createVendorStore(storeData);
      notify.success("Store has been created.");
      setShowAddModal(false);

      fetchVendorStores({
        vendorCode,
        pageNo: currentPage,
        pageSize,
        search: searchTerm || undefined,
      });
    } catch (error) {
      notify.error(error.message || "Failed to create store");
    }
  };

  // Handle edit store
  const handleEditStore = (store) => {
    setStoreToEdit(store);
    setShowEditModal(true);
  };

  // Handle update store
  const handleUpdateStore = async (storeData) => {
    try {
      await updateVendorStore(storeData);
      notify.success("Store has been updated.");
      setShowEditModal(false);
      setStoreToEdit(null);

      fetchVendorStores({
        vendorCode,
        pageNo: currentPage,
        pageSize,
        search: searchTerm || undefined,
      });
    } catch (error) {
      notify.error(error.message || "Failed to update store");
    }
  };

  // Handle deactivate store
  const handleDeactivateStore = (store) => {
    MySwal.fire({
      title: "Are you sure?",
      text: `Do you want to deactivate store "${store.VendorStoreName || store.VendorStoreCode}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, deactivate it!",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deactivateVendorStore({ vendorStoreCode: store.VendorStoreCode });
          notify.success("Store has been deactivated.");
          fetchVendorStores({
            vendorCode,
            pageNo: currentPage,
            pageSize,
            search: searchTerm || undefined,
          });
        } catch (error) {
          console.error("Deactivation error:", error);
          notify.error(error.message || "Failed to deactivate store");
        }
      }
    });
  };

  // Get status badge
  const getStatusBadge = (statusID) => {
    return statusID === 1 ? "success" : "danger";
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Table columns configuration
  // Note: GetVendorStoreModel declares PascalCase C# properties, so the API
  // returns PascalCase JSON keys here (unlike the vendor product DTO, which is camelCase).
  const columns = [
    {
      title: "Store",
      dataIndex: "VendorStoreCode",
      sorter: (a, b) => (a.VendorStoreName || "").localeCompare(b.VendorStoreName || ""),
      render: (_, record) => (
        <>
          <div>{record.VendorStoreCode}</div>
          <div><span className="text-muted" style={{ fontSize: "0.9em" }}>{record.VendorStoreName}</span></div>
        </>
      ),
    },
    {
      title: "Phone",
      dataIndex: "VendorStorePhone",
      render: (phone) => phone || "N/A",
    },
    {
      title: "Address",
      dataIndex: "VendorStoreAddress",
      render: (address) => address || "N/A",
    },
    {
      title: "Primary DC",
      dataIndex: "PrimaryDCCode",
      render: (_, record) => (
        <>
          <div>{record.PrimaryDCName || "N/A"}</div>
          <div><span className="text-muted">{record.PrimaryDCCode || "N/A"}</span></div>
        </>
      ),
    },
    {
      title: "Status",
      dataIndex: "StatusID",
      render: (statusID) => (
        <Badge bg={getStatusBadge(statusID)}>
          {statusID === 1 ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      title: "Date Added",
      dataIndex: "DateAdded",
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.DateAdded) - new Date(b.DateAdded),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (text, record) => (
        <RowActionsDropdown
          id={`dropdown-${record.VendorStoreCode}`}
          items={[
            { key: "edit", label: "Edit", icon: "feather-edit", onClick: () => handleEditStore(record) },
            { divider: true },
            record.StatusID === 1 && { key: "deactivate", label: "Deactivate", icon: "feather-ban", onClick: () => handleDeactivateStore(record), danger: true },
          ]}
        />
      ),
    },
  ];

  // Page header actions
  const pageActions = [
    <button
      key="add-store"
      className="btn btn-primary"
      onClick={() => setShowAddModal(true)}
    >
      <i className="fas fa-plus me-2"></i>
      Add Store
    </button>,
  ];

  return (
    <div>
      <VendorPageHeader
        title="My Stores"
        subtitle="Manage your pickup and drop-off stores"
        actions={pageActions}
      />

      <div className="row">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title mb-0">Stores ({totalCount || 0})</h4>
              <div className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search stores..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ width: "250px" }}
                />
              </div>
            </div>

            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <Datatable
                columns={columns}
                dataSource={vendorStores}
                loading={loading}
                rowKey={(record) => record.VendorStoreCode}
                pagination={{
                  current: currentPage,
                  pageSize,
                  total: totalCount || 0,
                  showSizeChanger: true,
                  pageSizeOptions: ["50", "100", "200", "500"],
                  showQuickJumper: false,
                  showTotal: (total, range) =>
                    `Showing ${range[0]} to ${range[1]} of ${total} stores`,
                  onChange: handlePageChange,
                  onShowSizeChange: handlePageChange,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Store Modal */}
      {showAddModal && (
        <AddStoreModal
          show={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreateStore}
        />
      )}

      {/* Edit Store Modal */}
      {showEditModal && storeToEdit && (
        <EditStoreModal
          show={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setStoreToEdit(null);
          }}
          onSubmit={handleUpdateStore}
          store={storeToEdit}
        />
      )}
    </div>
  );
};

export default VendorStores;
