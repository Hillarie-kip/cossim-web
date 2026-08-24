"use client";
import React, { useState, useEffect, useMemo } from "react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { Badge } from "react-bootstrap";
import Link from "@/components/Link";
import RowActionsDropdown from "@/components/RowActionsDropdown";
import VendorPageHeader from "@/components/vendor/VendorPageHeader";
import { useVendorProductsForVendor } from "@/hooks/useVendorProductsForVendor";
import AddProductModal from "@/components/modals/AddProductModal";
import EditProductModal from "@/components/modals/EditProductModal";
import Datatable from "@/core/pagination/datatable";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import { useAuth } from "@/contexts/AuthContext";
import notify from "@/lib/toast";

const VendorProducts = () => {
  const MySwal = withReactContent(Swal);
  const { user } = useAuth();

  // State management
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToEdit, setProductToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Use vendor products hook
  const {
    vendorProducts,
    totalCount,
    loading,
    error,
    vendorCode,
    fetchVendorProducts,
    createVendorProduct,
    updateVendorProduct,
    deactivateVendorProduct,
  } = useVendorProductsForVendor({});

  // Fetch products on component mount and when vendorCode changes
  useEffect(() => {
    if (vendorCode) {
      fetchVendorProducts({
        vendorCode,
        pageNo: currentPage,
        pageSize
      });
    }
  }, [vendorCode, currentPage, pageSize, fetchVendorProducts]);

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
    if (vendorCode) {
      fetchVendorProducts({
        vendorCode,
        pageNo: 1,
        pageSize,
        searchTerm: value || undefined
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

  // Handle create product
  const handleCreateProduct = async (productData) => {
    try {
      await createVendorProduct(productData);
      notify.success("Product has been created.");
      setShowAddModal(false);

      // Refresh the list
      fetchVendorProducts({ 
        vendorCode,
        pageNo: currentPage,
        pageSize,
        searchTerm: searchTerm || undefined
      });
    } catch (error) {
      notify.error(error.message || "Failed to create product");
    }
  };

  // Handle edit product
  const handleEditProduct = (product) => {
    setProductToEdit(product);
    setShowEditModal(true);
  };

  // Handle update product
  const handleUpdateProduct = async (productData, productId) => {
    try {
      await updateVendorProduct(productData, productId);
      notify.success("Product has been updated.");
      setShowEditModal(false);
      setProductToEdit(null);

      // Refresh the list
      fetchVendorProducts({ 
        vendorCode,
        pageNo: currentPage,
        pageSize,
        searchTerm: searchTerm || undefined
      });
    } catch (error) {
      notify.error(error.message || "Failed to update product");
    }
  };

  // Handle deactivate product
  const handleDeactivateProduct = (product) => {
    MySwal.fire({
      title: "Are you sure?",
      text: `Do you want to deactivate product "${product.vendorProductName || product.vendorProductCode}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, deactivate it!",
      cancelButtonText: "Cancel"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const deactivationData = {
            vendorProductCode: product.vendorProductCode
          };

          await deactivateVendorProduct(deactivationData);

          notify.success("Product has been deactivated.");
          fetchVendorProducts({
            vendorCode,
            pageNo: currentPage,
            pageSize,
            searchTerm: searchTerm || undefined
          });
        } catch (error) {
          console.error('Deactivation error:', error);
          notify.error(error.message || "Failed to deactivate product");
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

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  // Table columns configuration
  const columns = [
    {
      title: "Product",
      dataIndex: "vendorProductCode",
      sorter: (a, b) => a.vendorProductName.localeCompare(b.vendorProductName),
      render: (_, record) => (
        <>
            <div>{record.vendorProductCode}</div>
            <div><span className="text-muted" style={{ fontSize: '0.9em' }}>{record.vendorProductName}</span></div>
        </>
      )
    },
    {
      title: "Current Price",
      dataIndex: "currentPrice",
      render: (currentPrice) => formatCurrency(currentPrice),
      sorter: (a, b) => (a.currentPrice || 0) - (b.currentPrice || 0),
    },
    {
      title: "Product Value",
      dataIndex: "productValue",
      render: (productValue) => formatCurrency(productValue),
      sorter: (a, b) => (a.productValue || 0) - (b.productValue || 0),
    },
    {
      title: "Fragile",
      dataIndex: "isFragile",
      render: (isFragile) => isFragile ? "Yes" : "No",
    },
    {
      title: "Perishable",
      dataIndex: "isPerishable",
      render: (isPerishable) => isPerishable ? "Yes" : "No",
    },
    {
      title: "Status",
      dataIndex: "statusID",
      render: (statusID) => (
        <Badge bg={getStatusBadge(statusID)}>
          {statusID === 1 ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      title: "Date Added",
      dataIndex: "dateAdded",
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.dateAdded) - new Date(b.dateAdded),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (text, record) => (
        <RowActionsDropdown
          id={`dropdown-${record.vendorProductCode}`}
          items={[
            { key: 'edit', label: 'Edit', icon: 'feather-edit', onClick: () => handleEditProduct(record) },
            { divider: true },
            { key: 'deactivate', label: 'Deactivate', icon: 'feather-ban', onClick: () => handleDeactivateProduct(record), danger: true },
          ]}
        />
      ),
    },
  ];

  // Page header actions
  const pageActions = [
    <button
      key="add-product"
      className="btn btn-primary"
      onClick={() => setShowAddModal(true)}
    >
      <i className="fas fa-plus me-2"></i>
      Add Product
    </button>
  ];

  return (
    <div>
      <VendorPageHeader
        title="My Products"
        subtitle="Manage your product catalog"
        actions={pageActions}
      />

      <div className="row">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title mb-0">Products ({totalCount || 0})</h4>
              <div className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search products..."
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
                dataSource={vendorProducts}
                loading={loading}
                rowKey={(record) => record.vendorProductCode || record.id}
                pagination={{
                  current: currentPage,
                  pageSize,
                  total: totalCount || 0,
                  showSizeChanger: true,
                  pageSizeOptions: ['50', '100', '200', '500'],
                  showQuickJumper: false,
                  showTotal: (total, range) =>
                    `Showing ${range[0]} to ${range[1]} of ${total} products`,
                  onChange: handlePageChange,
                  onShowSizeChange: handlePageChange,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal
          show={showAddModal}
          onHide={() => setShowAddModal(false)}
          onSubmit={handleCreateProduct}
        />
      )}

      {/* Edit Product Modal */}
      {showEditModal && productToEdit && (
        <EditProductModal
          show={showEditModal}
          onHide={() => {
            setShowEditModal(false);
            setProductToEdit(null);
          }}
          onSubmit={handleUpdateProduct}
          product={productToEdit}
        />
      )}
    </div>
  );
};

export default VendorProducts;
