"use client"
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Row, Col, Badge, Button, Spinner, Alert, Table } from "react-bootstrap";
import { ArrowLeft, Edit, MapPin, Phone, Mail, Calendar, User, Plus } from "feather-icons-react";
import Link from "@/components/Link";
import RowActionsDropdown from "@/components/RowActionsDropdown";
import Datatable from "@/core/pagination/datatable";
import useVendorCustomer from "@/hooks/useVendorCustomer";
import { useAuth } from "@/contexts/AuthContext";
import { AddCustomerAddressModal, EditCustomerAddressModal } from "@/components/modals";
import notify from "@/lib/toast";

const CustomerDetailPage = () => {
	const params = useParams();
	const router = useRouter();
	const vendorCode = params.id;
	const vendorCustomerCode = params.vendorCustomerCode;
	const { user } = useAuth();

	const [customer, setCustomer] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Address management state
	const [showAddAddressModal, setShowAddAddressModal] = useState(false);
	const [showEditAddressModal, setShowEditAddressModal] = useState(false);
	const [selectedAddress, setSelectedAddress] = useState(null);

	const {
		fetchCustomers,
		customers,
		loading: hookLoading,
		error: hookError,
		updateCustomerAddress,
		deactivateCustomerAddress,
		addCustomerAddress
	} = useVendorCustomer();

	// Fetch customer details on component mount
	useEffect(() => {
		const fetchCustomerDetails = async () => {
			if (vendorCode && vendorCustomerCode) {
				try {
					setLoading(true);
					setError(null);

					// Use the updated fetchCustomers with VendorCustomerCode parameter
					await fetchCustomers({
						vendorCode,
						vendorCustomerCode,
						pageNo: 1,
						pageSize: 1
					});

				} catch (err) {
					setError(err.message || 'Failed to fetch customer details');
				} finally {
					setLoading(false);
				}
			}
		};

		fetchCustomerDetails();
	}, [vendorCode, vendorCustomerCode, fetchCustomers]);

	// Set customer data when customers array is updated
	useEffect(() => {
		if (customers && customers.length > 0) {
			setCustomer(customers[0]);
		} else if (!hookLoading && !loading) {
			setError('Customer not found');
		}
	}, [customers, hookLoading, loading]);

	// Handle loading and error states
	if (loading || hookLoading) {
		return (
			<div className="container-fluid">
				<div className="row">
					<div className="col-12">
						<div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
							<Spinner animation="border" role="status">
								<span className="visually-hidden">Loading...</span>
							</Spinner>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (error || hookError) {
		return (
			<div className="container-fluid">
				<div className="row">
					<div className="col-12">
						<Alert variant="danger">
							<Alert.Heading>Error</Alert.Heading>
							<p>{error || hookError}</p>
							<Button
								variant="outline-primary"
								onClick={() => router.back()}
							>
								<ArrowLeft size={16} className="me-2" />
								Go Back
							</Button>
						</Alert>
					</div>
				</div>
			</div>
		);
	}

	if (!customer) {
		return (
			<div className="container-fluid">
				<div className="row">
					<div className="col-12">
						<Alert variant="warning">
							<Alert.Heading>Customer Not Found</Alert.Heading>
							<p>The requested customer could not be found.</p>
							<Button
								variant="outline-primary"
								onClick={() => router.back()}
							>
								<ArrowLeft size={16} className="me-2" />
								Go Back
							</Button>
						</Alert>
					</div>
				</div>
			</div>
		);
	}

	// Get status badge
	const getStatusBadge = (statusID) => {
		return statusID === 1 ? "success" : "danger";
	};

	// Format date
	const formatDate = (dateString) => {
		if (!dateString) return "N/A";
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};

	// Handle address actions
	const handleAddAddress = () => {
		setShowAddAddressModal(true);
	};

	const handleEditAddress = (address) => {
		setSelectedAddress(address);
		setShowEditAddressModal(true);
	};

	const handleDeactivateAddress = async (address) => {
		try {
			const result = await deactivateCustomerAddress({
				vendorCustomerAddressCode: address.vendorCustomerAddressCode,
				vendorCustomerCode: address.vendorCustomerCode,
				addedBy: user?.UserID || user?.userID || "system"
			});

			if (result.success) {
				// Refresh customer data after deactivating address
				await fetchCustomers({
					vendorCode,
					vendorCustomerCode,
					pageNo: 1,
					pageSize: 1
				});
			} else {
				notify.error(result.error || 'Failed to deactivate address');
			}
		} catch (error) {
			notify.error(error.message || 'Error deactivating address');
		}
	};

	// Address table columns configuration
	const addressColumns = [
		{
			title: "Address Code",
			dataIndex: "vendorCustomerAddressCode",
			sorter: (a, b) => a.vendorCustomerAddressCode.localeCompare(b.vendorCustomerAddressCode),
		},
		{
			title: "Address Line",
			dataIndex: "addressLine",
			render: (text) => text || "N/A",
		},
		{
			title: "Landmark",
			dataIndex: "landmark",
			render: (text) => text || "N/A",
		},
		{
			title: "DC Code",
			dataIndex: "CustomerAddressDCCode",
			render: (text) => text || "N/A",
		},
		{
			title: "DC Name",
			dataIndex: "CustomerAddressDCName",
			render: (text) => text || "N/A",
		},
		{
			title: "Default",
			dataIndex: "isDefault",
			render: (isDefault) => (
				isDefault ? (
					<Badge bg="primary">Default</Badge>
				) : (
					"No"
				)
			),
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
					id={`dropdown-${record.vendorCustomerAddressID}`}
					variant="outline-secondary"
					items={[
						{ key: 'edit', label: 'Edit', icon: 'feather-edit', onClick: () => handleEditAddress(record) },
						{ key: 'deactivate', label: 'Deactivate', icon: 'feather-trash-2', onClick: () => handleDeactivateAddress(record), danger: true },
					]}
				/>
			),
		},
	];

	return (
		<div className="container-fluid">
			{/* Header */}
			<div className="row mb-4">
				<div className="col-12">
					<div className="d-flex justify-content-between align-items-center">
						<div>
							<Button
								variant="outline-secondary"
								onClick={() => router.back()}
								className="me-3"
							>
								<ArrowLeft size={16} className="me-2" />
								Back to Customers
							</Button>
							<h4 className="mb-0">Customer Details</h4>
						</div>
						<div>
							<Button
								variant="outline-primary"
								as={Link}
								to={`/admin/vendors/${vendorCode}/customers/${vendorCustomerCode}/edit`}
							>
								<Edit size={16} className="me-2" />
								Edit Customer
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Customer Information */}
			<Row>
				<Col lg={8}>
					<Card>
						<Card.Header>
							<div className="d-flex justify-content-between align-items-center">
								<h5 className="mb-0">
									<User size={20} className="me-2" />
									Customer Information
								</h5>
								<Badge bg={getStatusBadge(customer.statusID)}>
									{customer.statusID === 1 ? "Active" : "Inactive"}
								</Badge>
							</div>
						</Card.Header>
						<Card.Body>
							<Row>
								<Col md={6}>
									<div className="mb-3">
										<label className="form-label fw-bold">Customer Code</label>
										<p className="mb-0">{customer.vendorCustomerCode}</p>
									</div>
								</Col>
								<Col md={6}>
									<div className="mb-3">
										<label className="form-label fw-bold">Customer Name</label>
										<p className="mb-0">{customer.customerName}</p>
									</div>
								</Col>
							</Row>
							<Row>
								<Col md={6}>
									<div className="mb-3">
										<label className="form-label fw-bold">
											<Phone size={16} className="me-2" />
											Phone Number
										</label>
										<p className="mb-0">{customer.phoneNumber || "N/A"}</p>
									</div>
								</Col>
								<Col md={6}>
									<div className="mb-3">
										<label className="form-label fw-bold">
											<Mail size={16} className="me-2" />
											Email Address
										</label>
										<p className="mb-0">{customer.emailAddress || "N/A"}</p>
									</div>
								</Col>
							</Row>
							<Row>
								<Col md={6}>
									<div className="mb-3">
										<label className="form-label fw-bold">Preferred DC Code</label>
										<p className="mb-0">{customer.preferredDCCode || "N/A"}</p>
									</div>
								</Col>
								<Col md={6}>
									<div className="mb-3">
										<label className="form-label fw-bold">
											<Calendar size={16} className="me-2" />
											Date Added
										</label>
										<p className="mb-0">{formatDate(customer.dateAdded)}</p>
									</div>
								</Col>
							</Row>
						</Card.Body>
					</Card>

					{/* Customer Addresses */}
					<Card className="mt-4">
						<Card.Header>
							<div className="d-flex justify-content-between align-items-center">
								<h5 className="mb-0">
									<MapPin size={20} className="me-2" />
									Customer Addresses
								</h5>
								<Button
									variant="primary"
									size="sm"
									onClick={handleAddAddress}
								>
									<Plus size={16} className="me-2" />
									Add New Address
								</Button>
							</div>
						</Card.Header>
						<Card.Body>
							{customer.customerAddressArray && customer.customerAddressArray.length > 0 ? (
								<Datatable
									columns={addressColumns}
									dataSource={customer.customerAddressArray}
									rowKey="vendorCustomerAddressID"
									loading={false}
									pagination={false}
								/>
							) : (
								<div className="text-center py-4">
									<MapPin size={48} className="text-muted mb-3" />
									<h6 className="text-muted">No addresses found</h6>
									<p className="text-muted mb-3">This customer doesn't have any registered addresses yet.</p>
									<Button
										variant="primary"
										onClick={handleAddAddress}
									>
										<Plus size={16} className="me-2" />
										Add First Address
									</Button>
								</div>
							)}
						</Card.Body>
					</Card>
				</Col>

				<Col lg={4}>
					

					{/* Additional Information */}
					<Card>
						<Card.Header>
							<h6 className="mb-0">Additional Information</h6>
						</Card.Header>
						<Card.Body>
							<div className="mb-2">
								<small className="text-muted">Vendor Code:</small>
								<p className="mb-1">{vendorCode}</p>
							</div>
							<div className="mb-2">
								<small className="text-muted">Last Updated:</small>
								<p className="mb-1">{formatDate(customer.dateModified || customer.dateAdded)}</p>
							</div>
							<div className="mb-0">
								<small className="text-muted">Added By:</small>
								<p className="mb-0">{customer.addedBy || "System"}</p>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>

			{/* Address Management Modals */}
			<AddCustomerAddressModal
				show={showAddAddressModal}
				onClose={() => setShowAddAddressModal(false)}
				onSubmit={async (addressData) => {
					try {
						const result = await addCustomerAddress({
							...addressData,
							vendorCustomerCode: customer.vendorCustomerCode,
							addedBy: user?.UserID || user?.userID || "system"
						});

						if (result.success) {
							setShowAddAddressModal(false);
							// Refresh customer data after adding address
							await fetchCustomers({
								vendorCode,
								vendorCustomerCode,
								pageNo: 1,
								pageSize: 1
							});
						} else {
							notify.error(result.Message || 'Failed to add address');
						}
					} catch (error) {
						notify.error(error.message || 'Error adding address');
					}
				}}
				customer={customer}
				currentUserId={user?.UserID || user?.userID}
			/>

			<EditCustomerAddressModal
				show={showEditAddressModal}
				onClose={() => {
					setShowEditAddressModal(false);
					setSelectedAddress(null);
				}}
				onSubmit={async (addressData) => {
					try {
						const result = await updateCustomerAddress(addressData);
						if (result.success) {
							// Refresh customer data after updating address
							await fetchCustomers({
								vendorCode,
								vendorCustomerCode,
								pageNo: 1,
								pageSize: 1
							});
						} else {
							notify.error(result.Message || 'Failed to update address');
						}
					} catch (error) {
						notify.error(error.Message || 'Error updating address');
					}
				}}
				address={selectedAddress}
				currentUserId={user?.UserID || user?.userID}
			/>
		</div>
	);
};

export default CustomerDetailPage;
