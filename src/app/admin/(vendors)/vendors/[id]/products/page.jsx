"use client"
import {
	ChevronUp,
	RotateCcw,
	PlusCircle,
} from "feather-icons-react";
import React, { useState, useEffect } from "react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { OverlayTrigger, Tooltip, Badge } from "react-bootstrap";
import notify from "@/lib/toast";
import Link from "@/components/Link";
import RowActionsDropdown from "@/components/RowActionsDropdown";
import { all_routes } from "@/Router/all_routes";
import Datatable from "@/core/pagination/datatable";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import { useVendorProducts } from "@/hooks/useVendorProducts";
import AddProductModal from "@/components/modals/AddProductModal";
import EditProductModal from "@/components/modals/EditProductModal";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "next/navigation";

const ProductsList = () => {
	const MySwal = withReactContent(Swal);
	const params = useParams();
	const vendorCode = params.id;
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
		fetchVendorProducts,
		createVendorProduct,
		updateVendorProduct,
		deactivateVendorProduct,
	} = useVendorProducts({});

	// Fetch products on component mount and when vendorCode changes
	useEffect(() => {
		if (vendorCode) {
			fetchVendorProducts({
				vendorCode,
				pageNo: currentPage,
				pageSize
			});
		}
	}, [vendorCode, currentPage, pageSize]); // Remove fetchVendorProducts from dependencies

	// Handle search
	const handleSearch = (value) => {
		setSearchTerm(value);
		setCurrentPage(1);
		if (vendorCode) {
			fetchVendorProducts({
				vendorCode,
				searchTerm: value,
				pageNo: 1,
				pageSize
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

	// Handle add product
	const handleAddProduct = async (data) => {
		try {
			const productData = {
				...data,
				vendorCode,
				addedBy: user?.UserID || user?.userID || "system"
			};

			await createVendorProduct(productData);
			setShowAddModal(false);
			notify.success("Product created successfully.");
			fetchVendorProducts({ vendorCode, pageNo: currentPage, pageSize });
		} catch (error) {
			notify.error(error.message || "Failed to create product");
		}
	};

	// Handle edit product
	const handleEditProduct = (product) => {
		setProductToEdit(product);
		setShowEditModal(true);
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

					const response = await deactivateVendorProduct(deactivationData);

					notify.success("Product has been deactivated.");
					fetchVendorProducts({ vendorCode, pageNo: currentPage, pageSize });
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
			title: "Product Code",
			dataIndex: "vendorProductCode",
			sorter: (a, b) => a.vendorProductCode.localeCompare(b.vendorProductCode),
		},
		{
			title: "Product Name",
			dataIndex: "vendorProductName",
			sorter: (a, b) => (a.vendorProductName || "").localeCompare(b.vendorProductName || ""),
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
			title: "Action",
			dataIndex: "action",
			render: (_, record) => (
				<RowActionsDropdown
					id={`dropdown-${record.vendorProductCode}`}
					items={[
						{ key: 'edit', label: 'Edit', icon: 'feather-edit', onClick: () => handleEditProduct(record) },
						{ key: 'deactivate', label: 'Deactivate', icon: 'feather-trash-2', onClick: () => handleDeactivateProduct(record), danger: true },
					]}
				/>
			),
		},
	];

	// Tooltip render functions
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
		<React.Fragment>
			<AddProductModal
				show={showAddModal}
				onClose={() => setShowAddModal(false)}
				onSubmit={handleAddProduct}
				currentUserId={user?.UserID || user?.userID}
			/>
			<EditProductModal
				show={showEditModal}
				onClose={() => {
					setShowEditModal(false);
					setProductToEdit(null);
				}}
				onSubmit={async (productData) => {
					try {
						const updateData = {
							...productData,
							vendorProductCode: productToEdit.vendorProductCode,
							vendorCode: vendorCode,
							addedBy: user?.UserID || user?.userID || "system"
						};

						await updateVendorProduct(updateData, productToEdit.vendorProductCode);
						setShowEditModal(false);
						setProductToEdit(null);
						notify.success("Product updated successfully.");
						fetchVendorProducts({ vendorCode, pageNo: currentPage, pageSize });
					} catch (error) {
						notify.error(error.message || "Failed to update product");
					}
				}}
				product={productToEdit}
				currentUserId={user?.UserID || user?.userID}
			/>
				<div className="content">
					<div className="page-header">
						<div className="add-item d-flex">
							<div className="page-title">
								<h4>Products for Vendor {vendorCode}</h4>
								<h6>Manage vendor products and pricing</h6>
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
									<Link
										data-bs-toggle="tooltip"
										data-bs-placement="top"
										onClick={() => fetchVendorProducts({ vendorCode })}
									>
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
							<button
								className="btn btn-added"
								type="button"
								onClick={() => setShowAddModal(true)}
							>
								<PlusCircle className="me-2 iconsize" />
								Add New Product
							</button>
						</div>
					</div>

					<div className="card table-list-card">
						<div className="card-body">
							<div className="table-top">
								<div className="search-set">
									<input
										type="text"
										placeholder="Search products..."
										className="form-control form-control-sm"
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										onKeyPress={(e) => {
											if (e.key === 'Enter') {
												handleSearch(e.target.value);
											}
										}}
									/>
									<button
										className="btn btn-sm btn-primary ms-2"
										onClick={() => handleSearch(searchTerm)}
									>
										Search
									</button>
								</div>
							</div>
							<div className="table-responsive">
								{loading ? (
									<div className="text-center p-3">
										<div className="spinner-border" role="status">
											<span className="visually-hidden">Loading...</span>
										</div>
									</div>
								) : error ? (
									<div className="text-center p-3">
										<div className="text-danger">Error: {error}</div>
									</div>
								) : (
									<Datatable
										columns={columns}
										dataSource={vendorProducts}
										pagination={{
											current: currentPage,
											pageSize,
											total: totalCount,
											showSizeChanger: true,
											pageSizeOptions: ['50', '100', '200', '500'],
											showQuickJumper: true,
											showTotal: (total, range) =>
												`${range[0]}-${range[1]} of ${total} products`,
											onChange: handlePageChange,
											onShowSizeChange: handlePageChange,
										}}
										rowKey={'vendorProductCode'}
									/>
								)}
							</div>
						</div>
					</div>
				</div>
		</React.Fragment>
	);
};

export default ProductsList;
