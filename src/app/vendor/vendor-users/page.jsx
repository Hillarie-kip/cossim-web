"use client";
import {
    ChevronUp,
    RotateCcw,
    PlusCircle,
    Download,
    Search,
    User,
} from "feather-icons-react";
import React, { useState, useEffect } from "react";
import { OverlayTrigger, Tooltip, Badge, Dropdown, Button, InputGroup, Form } from "react-bootstrap";
import Link from "@/components/Link";
import { all_routes } from "@/Router/all_routes";
import Datatable from "@/core/pagination/datatable";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { AddUserModal } from "@/components/modals";
import notify from "@/lib/toast";

const VendorUsersList = () => {
    const route = all_routes;
    const { user } = useAuth();
    const vendorCode = user?.AssignedVendor?.VendorCode;

    // State management
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(100);

    // Use admin hook for fetching users by vendor
    const {
        usersByVendor,
        loading,
        error,
        pagination,
        fetchUsersByVendor,
        handleRegisterUser,
        clearError,
    } = useAdmin();

    // Fetch users on component mount and when parameters change
    useEffect(() => {
        if (vendorCode) {
            fetchUsersByVendor({
                VendorCode: vendorCode,
                PageNO: currentPage,
                PageSize: pageSize,
                SearchTerm: searchTerm,
            }).then((response) => {
                console.log("Users data:", response?.Data);
            }).catch((error) => {
                console.error("Error fetching users:", error);
            });
        }
    }, [vendorCode, currentPage, pageSize, searchTerm, fetchUsersByVendor]);

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1); // Reset to first page when searching
        fetchUsersByVendor({
            VendorCode: vendorCode,
            PageNO: 1,
            PageSize: pageSize,
            SearchTerm: searchTerm,
        });
    };

    // Handle page change
    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        if (size && size !== pageSize) {
            setPageSize(size);
        }
    };

    // Handle page size change
    const handlePageSizeChange = (newPageSize) => {
        setPageSize(newPageSize);
        setCurrentPage(1);
    };

    // Handle refresh
    const handleRefresh = () => {
        if (vendorCode) {
            fetchUsersByVendor({
                VendorCode: vendorCode,
                PageNO: currentPage,
                PageSize: pageSize,
                SearchTerm: searchTerm,
            });
        }
    };

    // Clear search
    const handleClearSearch = () => {
        setSearchTerm("");
        setCurrentPage(1);
    };

    // Handle add user for vendor
    const handleAddUser = async (userData) => {
        if (!vendorCode) {
            notify.error("Vendor code is missing. Please sign in again.");
            return;
        }

        try {
            const payload = {
                ...userData,
                vendorCode,
                userRoleArray: [{ roleTypeCode: "R-008" }],
            };

            const response = await handleRegisterUser(payload);

            if (!response?.Error) {
                setShowAddModal(false);
                notify.success("Vendor user created successfully.");

                await fetchUsersByVendor({
                    VendorCode: vendorCode,
                    PageNO: currentPage,
                    PageSize: pageSize,
                    SearchTerm: searchTerm,
                });
            } else {
                notify.error(response.message || "Failed to create vendor user");
            }
        } catch (error) {
            notify.error(error.message || "Failed to create vendor user");
        }
    };

    const handleOpenAddUserModal = () => {
        if (!vendorCode) {
            notify.error("Vendor code is missing. Please sign in again.");
            return;
        }

        setShowAddModal(true);
    };

    // Table columns configuration
    const columns = [
        {
            title: "User Code",
            dataIndex: "UserCode",
            render: (text, record) => {
                const userCode = record?.UserCode || "N/A";
                return (
                    <div className="d-flex align-items-center">
                        <div className="ms-2">
                            <h6 className="fw-medium fs-14">{userCode}</h6>
                        </div>
                    </div>
                );
            },
            sorter: (a, b) => (a?.UserCode || "").localeCompare(b?.UserCode || ""),
        },
        {
            title: "Full Name",
            dataIndex: "FirstName",
            render: (text, record) => {
                const firstName = record?.FirstName || "";
                const lastName = record?.LastName || "";
                const fullName = `${firstName} ${lastName}`.trim() || "N/A";
                return (
                    <div className="d-flex align-items-center">
                        <div className="ms-2">
                            <h6 className="fw-medium fs-14">{fullName}</h6>
                        </div>
                    </div>
                );
            },
            sorter: (a, b) => {
                const nameA = `${a?.FirstName || ""} ${a?.LastName || ""}`.trim();
                const nameB = `${b?.FirstName || ""} ${b?.LastName || ""}`.trim();
                return nameA.localeCompare(nameB);
            },
        },
        {
            title: "Email",
            dataIndex: "EmailAddress",
            render: (text, record) => {
                const email = record?.EmailAddress || "N/A";
                return (
                    <div className="d-flex align-items-center">
                        <div className="ms-2">
                            <p className="fs-14 text-muted mb-0">{email}</p>
                        </div>
                    </div>
                );
            },
            sorter: (a, b) => (a?.EmailAddress || "").localeCompare(b?.EmailAddress || ""),
        },
        {
            title: "Phone Number",
            dataIndex: "PhoneNumber",
            render: (text, record) => {
                const phone = record?.PhoneNumber || "N/A";
                return (
                    <div className="d-flex align-items-center">
                        <div className="ms-2">
                            <p className="fs-14 text-muted mb-0">{phone}</p>
                        </div>
                    </div>
                );
            },
            sorter: (a, b) => (a?.PhoneNumber || "").localeCompare(b?.PhoneNumber || ""),
        },
        {
            title: "Status",
            dataIndex: "StatusID",
            render: (text, record) => {
                const statusID = text || record?.StatusID || 0;
                return (
                    <div className="d-flex align-items-center">
                        <Badge bg={statusID === 1 ? "success" : "danger"} className="ms-2">
                            {statusID === 1 ? "Active" : "Inactive"}
                        </Badge>
                    </div>
                );
            },
            sorter: (a, b) => (a?.StatusID || 0) - (b?.StatusID || 0),
        },
        {
            title: "Vendor",
            dataIndex: "AssignedVendor",
            render: (text, record) => {
                const vendorName = text?.VendorName || "N/A";
                return (
                    <div className="d-flex align-items-center">
                        <div className="ms-2">
                            <p className="fs-14 text-muted mb-0">{vendorName}</p>
                        </div>
                    </div>
                );
            },
            sorter: (a, b) => {
                const vendorA = a?.AssignedVendor?.VendorName || "";
                const vendorB = b?.AssignedVendor?.VendorName || "";
                return vendorA.localeCompare(vendorB);
            },
        },
    ];

    return (
        <div className="content">
            <AddUserModal
                show={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleAddUser}
                lockedRole={{ roleTypeCode: "R-008", roleTypeName: "Vendor Admin" }}
            />
            <div className="page-header">
                <div className="add-item d-flex">
                    <div className="page-title">
                        <h4>
                            <User className="me-2" />
                            Vendor Users
                        </h4>
                        <h6>Manage users associated with your vendor account</h6>
                    </div>
                </div>
                <ul className="table-top-head">
                    <li>
                        <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip id="refresh-tooltip">Refresh</Tooltip>}
                        >
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={loading}
                            >
                                <RotateCcw size={14} />
                            </Button>
                        </OverlayTrigger>
                    </li>
                </ul>
                <div className="page-btn">
                    <button
                        className="btn btn-added"
                        type="button"
                        onClick={handleOpenAddUserModal}
                    >
                        <PlusCircle className="me-2 iconsize" />
                        Add New User
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="card">
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6">
                            <Form onSubmit={handleSearch}>
                                <InputGroup>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search users by name, email, or phone..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        disabled={loading}
                                    />
                                    <Button
                                        variant="outline-secondary"
                                        type="submit"
                                        disabled={loading}
                                    >
                                        <Search size={14} />
                                    </Button>
                                    {searchTerm && (
                                        <Button
                                            variant="outline-danger"
                                            onClick={handleClearSearch}
                                            disabled={loading}
                                        >
                                            Clear
                                        </Button>
                                    )}
                                </InputGroup>
                            </Form>
                        </div>
                        <div className="col-md-6 text-end">
                            <div className="d-flex align-items-center justify-content-end gap-2">
                                <span className="text-muted">
                                    Total: {pagination.totalItems || 0} users
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="card">
                <div className="card-body">
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                            <button
                                type="button"
                                className="btn-close"
                                onClick={clearError}
                            ></button>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading users...</p>
                        </div>
                    ) : (
                        <Datatable
                            columns={columns}
                            dataSource={Array.isArray(usersByVendor) ? usersByVendor : []}
                            rowKey="UserCode"
                            rowSelection={false}
                            pagination={{
                                current: pagination.currentPage || 1,
                                pageSize: pagination.pageSize || pageSize,
                                total: pagination.totalItems || 0,
                                showSizeChanger: true,
                                pageSizeOptions: ['50', '100', '200', '500'],
                                onChange: handlePageChange,
                                onShowSizeChange: handlePageChange,
                            }}
                            loading={loading}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default VendorUsersList;

