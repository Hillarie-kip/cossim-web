"use client";
import {
  ChevronUp,
  RotateCcw,
  PlusCircle,
} from "feather-icons-react";
import React, { useState, useEffect, useMemo } from "react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import notify from "@/lib/toast";
import { OverlayTrigger, Tooltip, Badge } from "react-bootstrap";
import Link from "@/components/Link";
import { all_routes } from "@/Router/all_routes";
import Datatable from "@/core/pagination/datatable";
import RowActionsDropdown from "@/components/RowActionsDropdown";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import {
  getDistributionCenters,
  createDistributionCenter,
  updateDistributionCenter,
  deactivateDistributionCenter,
} from "@/services/adminService";
import { AddDistributionCenterModal } from "@/components/modals";

const DistributionCentersList = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [distributionCenters, setDistributionCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    pageNo: 1,
    pageSize: 100,
    totalCount: 0,
    totalPages: 0,
  });

  // Fetch distribution centers
  const fetchDistributionCenters = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = {
        pageNo: params.pageNo || pagination.pageNo,
        pageSize: params.pageSize || 1000,
        searchTerm: "",
      };

      // Use admin service for fetching distribution centers
      const response = await getDistributionCenters(queryParams);

      if (response && !response.Error) {
        setDistributionCenters(response.Data || []);
        setPagination({
          pageNo: response.PageNO || 1,
          pageSize: pagination.pageSize,
          totalCount: (response.Data || []).length,
          totalPages: response.TotalPages || 0,
        });
      } else {
        throw new Error(
          response?.Message || "Failed to fetch distribution centers"
        );
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching distribution centers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDistributionCenters();
  }, []);

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    setPagination((current) => ({ ...current, pageNo: 1 }));
  };

  const filteredDistributionCenters = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return distributionCenters;

    return distributionCenters.filter((center) => {
      const status = Number(center.StatusID) === 1 ? "active" : "inactive";
      return [
        center.DCCode,
        center.DCName,
        center.AddressLine1,
        center.AddressLine2,
        center.Landmark,
        center.City,
        center.Region,
        status,
        center.IsPrimary ? "primary" : "",
      ].some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [distributionCenters, searchTerm]);

  // Handle refresh
  const handleRefresh = () => {
    fetchDistributionCenters();
  };

  const handleAddCenter = async (data) => {
    try {
      setIsCreating(true);
      // Use admin service for creating distribution center
      const response = await createDistributionCenter(data);

      if (response && !response.Error) {
        setShowAddModal(false);
        notify.success("Distribution center created successfully.");
        // Refresh the list
        fetchDistributionCenters();
      } else {
        throw new Error(
          response?.Message || "Failed to create distribution center"
        );
      }
    } catch (err) {
      console.error("Error creating distribution center:", err);
      notify.error(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditCenter = async (data, dcCode) => {
    try {
      setIsCreating(true);
      const updateData = { ...data, DCCode: dcCode }; // Include DCCode in the data
      const response = await updateDistributionCenter(updateData);
      if (response && !response.Error) {
        setShowEditModal(false);
        setSelectedCenter(null);
        notify.success("Distribution center updated successfully.");
        fetchDistributionCenters();
      } else {
        throw new Error(
          response?.Message || "Failed to update distribution center"
        );
      }
    } catch (err) {
      console.error("Error updating distribution center:", err);
      notify.error(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditClick = (record) => {
    setSelectedCenter(record);
    setShowEditModal(true);
  };

  const MySwal = withReactContent(Swal);
 const showConfirmationAlert = async (dcCode) => {
  const result = await MySwal.fire({
    title: "Deactivate Distribution Center?",
    text: `Are you sure you want to deactivate ${dcCode}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, deactivate",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  try {
    const response = await deactivateDistributionCenter({
      DCCode: dcCode,
    });

    if (response && !response.Error) {
      notify.success(response.Message || "Distribution center deactivated successfully.");

      fetchDistributionCenters();
    } else {
      throw new Error(
        response?.Message || "Failed to deactivate distribution center."
      );
    }
  } catch (err) {
    console.error(err);

    notify.error(err.message);
  }
};

  const columns = [
    {
      title: "DC Code",
      dataIndex: "DCCode",
      render: (code) => <strong>{code}</strong>,
      sorter: (a, b) => a.DCCode.localeCompare(b.DCCode),
    },
    {
      title: "Name",
      dataIndex: "DCName",
      render: (_, record) => (
        <div>
          <div>
            <strong>{record.DCName}</strong>
          </div>
          <div className="text-muted">
            {record.City}, {record.Region}
          </div>
        </div>
      ),
      sorter: (a, b) => a.DCName.localeCompare(b.DCName),
    },
    {
      title: "Address",
      dataIndex: "AddressLine1",
      render: (_, record) => (
        <div>
          <div>{record.AddressLine1}</div>
          {record.AddressLine2 && (
            <div className="text-muted">{record.AddressLine2}</div>
          )}
          {record.Landmark && (
            <div className="text-muted">Near: {record.Landmark}</div>
          )}
        </div>
      ),
    },
    {
      title: "Location",
      dataIndex: "Latitude",
      render: (_, record) => (
        <div>
          {record.Latitude && record.Longitude ? (
            <div>
              <div>Lat: {record.Latitude.toFixed(6)}</div>
              <div>Lng: {record.Longitude.toFixed(6)}</div>
            </div>
          ) : (
            <span className="text-muted">No coordinates</span>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "StatusID",
      render: (statusId, record) => (
        <div>
          <Badge bg={statusId === 1 ? "success" : "danger"} className="me-1">
            {statusId === 1 ? "Active" : "Inactive"}
          </Badge>
          {record.IsPrimary ? (
            <Badge bg="primary">Primary</Badge>
          ) : null}
        </div>
      ),
    },
    {
      title: "Date Added",
      dataIndex: "DateAdded",
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.DateAdded) - new Date(b.DateAdded),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => (
        <RowActionsDropdown
          id={`dropdown-basic-${record.DCCode}`}
          items={[
            {
              key: 'view',
              label: 'View',
              icon: 'feather-eye',
              href: `/admin/distribution-centers/${record.DCCode}`,
            },
            {
              key: 'edit',
              label: 'Edit',
              icon: 'feather-edit',
              onClick: () => handleEditClick(record),
            },
            {
              key: 'delete',
              label: 'Delete',
              icon: 'feather-trash-2',
              onClick: () => showConfirmationAlert(record.DCCode),
            },
            {
              key: 'dc-users',
              label: 'DC Users',
              icon: 'feather-user',
              href: `/admin/distribution-centers/${record.DCCode}/users`,
            },
          ]}
        />
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
    <React.Fragment>
      <AddDistributionCenterModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddCenter}
        isLoading={isCreating}
      />
      <AddDistributionCenterModal
        show={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCenter(null);
        }}
        onSubmit={handleEditCenter}
        isLoading={isCreating}
        isEdit={true}
        initialData={selectedCenter}
      />
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Distribution Centers</h4>
                <h6>Manage your distribution centers</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <li>
                <OverlayTrigger placement="top" overlay={renderTooltip}>
                  <Link>
                    <ImageWithBasePath
                      src="assets/img/icons/pdf.svg"
                      alt="img"
                    />
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
                    onClick={handleRefresh}
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
                disabled={loading}
              >
                <PlusCircle className="me-2 iconsize" />
                Add Location
              </button>
            </div>
          </div>

          <div className="card table-list-card">
            <div className="card-body">
              <div className="table-top">
                <div className="search-set">
                  <input
                    type="text"
                    placeholder="Search distribution centers..."
                    className="form-control form-control-sm"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <strong>Error:</strong> {error}
                  <button
                    className="btn btn-sm btn-outline-danger ms-2"
                    onClick={handleRefresh}
                  >
                    Retry
                  </button>
                </div>
              )}

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading distribution centers...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Datatable
                    columns={columns}
                    dataSource={filteredDistributionCenters}
                    pagination={{
                      current: pagination.pageNo,
                      pageSize: pagination.pageSize,
                      total: filteredDistributionCenters.length,
                      showSizeChanger: true,
                      pageSizeOptions: ['50', '100', '200', '500'],
                      showQuickJumper: true,
                      showTotal: (total, range) =>
                        `${range[0]}-${range[1]} of ${total} distribution centers`,
                      onChange: (page, pageSize) => {
                        setPagination((current) => ({
                          ...current,
                          pageNo: page,
                          pageSize,
                          totalCount: filteredDistributionCenters.length,
                          totalPages: Math.ceil(filteredDistributionCenters.length / pageSize),
                        }));
                      },
                    }}
                    rowKey={'DCCode'}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
    </React.Fragment>
  );
};

export default DistributionCentersList;
