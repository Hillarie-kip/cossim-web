
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
import Datatable from "@/core/pagination/datatable";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import useVendorCustomer from "@/hooks/useVendorCustomer";
import AddCustomerModal from "@/components/modals/AddCustomerModal";
import ViewCustomerAddressesModal from "@/components/modals/ViewCustomerAddressesModal";
import EditCustomerModal from "@/components/modals/EditCustomerModal";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "next/navigation";



const CustomersList = () => {
	const MySwal = withReactContent(Swal);
	const params = useParams();
	const vendorCode = params.id;
	const { user } = useAuth();
  
	// State management
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showAddressesModal, setShowAddressesModal] = useState(false);
	const [selectedCustomer, setSelectedCustomer] = useState(null);
	const [customerToEdit, setCustomerToEdit] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");

	// Use vendor customer hook
	const {
		customers,
		loading,
		pagination,
		registerCustomer,
		fetchCustomersByVendor,
		searchCustomers,
		loadNextPage,
		loadPreviousPage,
		refreshCustomers,
		updateCustomer,
		deactivateCustomer
	} = useVendorCustomer();

	// Fetch customers on component mount and when vendorCode changes
	useEffect(() => {
		if (vendorCode) {
			fetchCustomersByVendor(vendorCode, {
				pageNo: 1,
				pageSize: 100
			});
		}
	}, [vendorCode, fetchCustomersByVendor]);

	// Handle search
	const handleSearch = (value) => {
		setSearchTerm(value);
		if (vendorCode) {
			searchCustomers(value, {
				vendorCode,
				pageNo: 1,
				pageSize: 100
			});
		}
	};

	// Handle add customer
	const handleAddCustomer = async (data) => {
		try {
			const customerData = {
				...data,
				vendorCode,
				addedBy: user?.UserID || user?.userID || "system"
			};
      
			const result = await registerCustomer(customerData);
			if (result.success) {
				setShowAddModal(false);
				notify.success("Customer registered successfully.");
				refreshCustomers({ vendorCode });
			} else {
				notify.error(result.error || "Failed to register customer");
			}
		} catch (error) {
			notify.error(error.message || "Failed to register customer");
		}
	};

	// Handle edit customer
	const handleEditCustomer = (customer) => {
		setCustomerToEdit(customer);
		setShowEditModal(true);
	};

	// Handle deactivate customer
	const handleDeactivateCustomer = (customer) => {
		MySwal.fire({
			title: "Are you sure?",
			text: `Do you want to deactivate customer "${customer.customerName}"?`,
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
						vendorCustomerCode: customer.vendorCustomerCode,
						vendorCode: vendorCode,
						addedBy: user?.UserID || user?.userID || "system"
					};

					const deactivateResult = await deactivateCustomer(deactivationData);
					if (deactivateResult.success) {
						notify.success("Customer has been deactivated.");
						refreshCustomers({ vendorCode });
					} else {
						notify.error(deactivateResult.error || "Failed to deactivate customer");
					}
				} catch (error) {
					notify.error(error.message || "Failed to deactivate customer");
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
	const columns = [
		{
			title: "Customer Code",
			dataIndex: "vendorCustomerCode",
			sorter: (a, b) => a.vendorCustomerCode.localeCompare(b.vendorCustomerCode),
		},
		{
			title: "Customer Name",
			dataIndex: "customerName",
			sorter: (a, b) => a.customerName.localeCompare(b.customerName),
		},
		{
			title: "Phone Number",
			dataIndex: "phoneNumber",
			render: (phone) => phone || "N/A",
		},
		{
			title: "Email",
			dataIndex: "emailAddress",
			render: (email) => email || "N/A",
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
					id={`dropdown-${record.vendorCustomerCode}`}
					items={[
						{ key: 'view', label: 'View Details', icon: 'feather-eye', href: `/admin/vendors/${vendorCode}/customers/${record.vendorCustomerCode}` },
						{ key: 'edit', label: 'Edit', icon: 'feather-edit', onClick: () => handleEditCustomer(record) },
						{ key: 'deactivate', label: 'Deactivate', icon: 'feather-trash-2', onClick: () => handleDeactivateCustomer(record), danger: true },
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
			<AddCustomerModal 
				show={showAddModal} 
				onClose={() => setShowAddModal(false)} 
				onSubmit={handleAddCustomer}
				currentUserId={user?.UserID || user?.userID}
			/>
			<EditCustomerModal 
				show={showEditModal} 
				onClose={() => {
					setShowEditModal(false);
					setCustomerToEdit(null);
				}} 
				onSubmit={async (customerData) => {
					try {
						const updateData = {
							...customerData,
							vendorCustomerCode: customerToEdit.vendorCustomerCode,
							vendorCode: vendorCode,
							addedBy: user?.UserID || user?.userID || "system"
						};

						const result = await updateCustomer(updateData);
						if (result.success) {
							setShowEditModal(false);
							setCustomerToEdit(null);
							notify.success("Customer updated successfully.");
							refreshCustomers({ vendorCode });
						} else {
							notify.error(result.error || "Failed to update customer");
						}
					} catch (error) {
						notify.error(error.message || "Failed to update customer");
					}
				}}
				customer={customerToEdit}
				currentUserId={user?.UserID || user?.userID}
			/>
			<ViewCustomerAddressesModal 
				show={showAddressesModal} 
				onClose={() => setShowAddressesModal(false)} 
				customer={selectedCustomer}
			/>
				<div className="content">
					<div className="page-header">
						<div className="add-item d-flex">
							<div className="page-title">
								<h4>Customers for Vendor {vendorCode}</h4>
								<h6>Manage customer accounts and information</h6>
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
										onClick={() => refreshCustomers({ vendorCode })}
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
								Add New Customer
							</button>
						</div>
					</div>

					<div className="card table-list-card">
						<div className="card-body">
							<div className="table-top">
								<div className="search-set">
									<input 
										type="text" 
										placeholder="Search customers..." 
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
								) : (
									<Datatable 
										columns={columns} 
										dataSource={customers}
										pagination={{
											current: pagination.currentPage,
											pageSize: pagination.pageSize,
											total: pagination.totalItems,
											showSizeChanger: true,
											pageSizeOptions: ['50', '100', '200', '500'],
											onChange: (page, size) => {
												if (size !== pagination.pageSize) {
													refreshCustomers({ vendorCode, pageNo: page, pageSize: size });
												} else if (page > pagination.currentPage) {
													loadNextPage({ vendorCode, pageSize: size });
												} else if (page < pagination.currentPage) {
													loadPreviousPage({ vendorCode, pageSize: size });
												}
											}
										}}
										rowKey={'vendorCustomerCode'}
									/>
								)}
							</div>
						</div>
					</div>
				</div>
		</React.Fragment>
	);
};

export default CustomersList;
