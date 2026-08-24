"use client"
import {
	ChevronUp,
	RotateCcw,
	PlusCircle,
} from "feather-icons-react";
import React, { useState, useEffect } from "react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import notify from "@/lib/toast";
import { OverlayTrigger, Tooltip, Badge } from "react-bootstrap";
import Link from "@/components/Link";
import RowActionsDropdown from "@/components/RowActionsDropdown";
import Datatable from "@/core/pagination/datatable";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import { useVendorStores } from "@/hooks/useVendorStores";
import AddStoreModal from "@/components/modals/AddStoreModal";
import EditStoreModal from "@/components/modals/EditStoreModal";
import { useParams } from "next/navigation";

const StoresList = () => {
	const MySwal = withReactContent(Swal);
	const params = useParams();
	const vendorCode = params.id;

	// State management
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [storeToEdit, setStoreToEdit] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(50);

	// Use vendor stores hook
	const {
		vendorStores,
		totalCount,
		loading,
		error,
		fetchVendorStores,
		createVendorStore,
		updateVendorStore,
		deactivateVendorStore,
	} = useVendorStores({});

	// Fetch stores on component mount and when vendorCode changes
	useEffect(() => {
		if (vendorCode) {
			fetchVendorStores({
				vendorCode,
				pageNo: currentPage,
				pageSize
			});
		}
	}, [vendorCode, currentPage, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

	// Handle search
	const handleSearch = (value) => {
		setSearchTerm(value);
		setCurrentPage(1);
		if (vendorCode) {
			fetchVendorStores({
				vendorCode,
				search: value,
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

	// Handle add store
	const handleAddStore = async (data) => {
		try {
			const storeData = {
				...data,
				vendorCode,
			};

			await createVendorStore(storeData);
			setShowAddModal(false);
			notify.success("Store created successfully.");
			fetchVendorStores({ vendorCode, pageNo: currentPage, pageSize });
		} catch (error) {
			notify.error(error.message || "Failed to create store");
		}
	};

	// Handle edit store
	const handleEditStore = (store) => {
		setStoreToEdit(store);
		setShowEditModal(true);
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
			cancelButtonText: "Cancel"
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					await deactivateVendorStore({ vendorStoreCode: store.VendorStoreCode });

					notify.success("Store has been deactivated.");
					fetchVendorStores({ vendorCode, pageNo: currentPage, pageSize });
				} catch (error) {
					console.error('Deactivation error:', error);
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
	// returns PascalCase JSON keys here (unlike VendorProductDto, which is camelCase).
	const columns = [
		{
			title: "Store Code",
			dataIndex: "VendorStoreCode",
			sorter: (a, b) => a.VendorStoreCode.localeCompare(b.VendorStoreCode),
		},
		{
			title: "Store Name",
			dataIndex: "VendorStoreName",
			sorter: (a, b) => (a.VendorStoreName || "").localeCompare(b.VendorStoreName || ""),
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
			title: "Action",
			dataIndex: "action",
			render: (_, record) => (
				<RowActionsDropdown
					id={`dropdown-${record.VendorStoreCode}`}
					items={[
						{ key: 'edit', label: 'Edit', icon: 'feather-edit', onClick: () => handleEditStore(record) },
						record.StatusID === 1 && { key: 'deactivate', label: 'Deactivate', icon: 'feather-trash-2', onClick: () => handleDeactivateStore(record), danger: true },
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
			<AddStoreModal
				show={showAddModal}
				onClose={() => setShowAddModal(false)}
				onSubmit={handleAddStore}
			/>
			<EditStoreModal
				show={showEditModal}
				onClose={() => {
					setShowEditModal(false);
					setStoreToEdit(null);
				}}
				onSubmit={async (storeData) => {
					try {
						await updateVendorStore(storeData);
						setShowEditModal(false);
						setStoreToEdit(null);
						notify.success("Store updated successfully.");
						fetchVendorStores({ vendorCode, pageNo: currentPage, pageSize });
					} catch (error) {
						notify.error(error.message || "Failed to update store");
					}
				}}
				store={storeToEdit}
			/>
				<div className="content">
					<div className="page-header">
						<div className="add-item d-flex">
							<div className="page-title">
								<h4>Stores for Vendor {vendorCode}</h4>
								<h6>Manage vendor pickup and drop-off stores</h6>
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
										onClick={() => fetchVendorStores({ vendorCode })}
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
								Add New Store
							</button>
						</div>
					</div>

					<div className="card table-list-card">
						<div className="card-body">
							<div className="table-top">
								<div className="search-set">
									<input
										type="text"
										placeholder="Search stores..."
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
										dataSource={vendorStores}
										pagination={{
											current: currentPage,
											pageSize,
											total: totalCount,
											showSizeChanger: true,
											pageSizeOptions: ['50', '100', '200', '500'],
											showQuickJumper: true,
											showTotal: (total, range) =>
												`${range[0]}-${range[1]} of ${total} stores`,
											onChange: handlePageChange,
											onShowSizeChange: handlePageChange,
										}}
										rowKey={'VendorStoreCode'}
									/>
								)}
							</div>
						</div>
					</div>
				</div>
		</React.Fragment>
	);
};

export default StoresList;
