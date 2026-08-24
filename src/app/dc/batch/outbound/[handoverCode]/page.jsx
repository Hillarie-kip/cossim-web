"use client";
import { ArrowLeft, RotateCcw, Eye, Package, CheckCircle, XCircle, ArrowUp, Truck } from "feather-icons-react";
import React, { useState, useEffect } from "react";
import {
  Button,
  Spinner,
  Card,
  Alert,
  Badge,
} from "react-bootstrap";
import { useParams, useRouter } from "next/navigation";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import notify from "@/lib/toast";
import Datatable from "@/core/pagination/datatable";
import Link from "@/components/Link";
import { useShipment } from "@/hooks/useShipment";
import DCSwitcher from "@/components/DCSwitcher";

const OutboundBatchDetail = () => {
  const params = useParams();
  const router = useRouter();
  const handoverCode = params.handoverCode;
  const MySwal = withReactContent(Swal);

  // Use shipment hook
  const {
    handoverItems,
    fetchHandoverItems,
    loading,
    error,
    clearHandoverData,
    dcCode,
    handleUpdateShipmentStatus,
  } = useShipment();

  // Local state
  const [batchInfo, setBatchInfo] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Fetch handover items for this batch
  const fetchBatchItems = async () => {
    if (!handoverCode || !dcCode) {
      console.warn("Handover code or DC code not available");
      return;
    }

    try {
      const queryParams = {
        handoverCode: handoverCode,
        FromDCCode: dcCode, // For outbound, we're the source DC
      };

      const response = await fetchHandoverItems(queryParams);

      // Extract batch info from the first item (assuming all items in batch have same batch info)
      if (response && response.length > 0) {
        setBatchInfo({
          handoverCode: response[0].HandoverCode,
          fromDC: response[0].FromDCCode,
          toDC: response[0].ToDCCode,
          rider: response[0].RiderUserCode,
          createdDate: response[0].CreatedDate,
          totalItems: response.length,
        });
      }
    } catch (error) {
      console.error("Error fetching batch items:", error);
      notify.error(error.message || "Failed to fetch batch items");
    }
  };

  useEffect(() => {
    if (handoverCode && dcCode) {
      fetchBatchItems();
    }
  }, [handoverCode, dcCode]);

  // Handle refresh
  const handleRefresh = () => {
    clearHandoverData();
    fetchBatchItems();
  };

  // Handle back navigation
  const handleBack = () => {
    router.push("/dc/batch/outbound");
  };

  // Handle row selection change
  const handleRowSelectionChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  // Handle dispatch selected items
  const handleDispatchItems = async () => {
    if (selectedRowKeys.length === 0) {
      notify.error("Please select items to dispatch");
      return;
    }

    const result = await MySwal.fire({
      title: "Dispatch Items",
      text: `Are you sure you want to dispatch ${selectedRowKeys.length} item(s)?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Dispatch",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        // Update status for each selected item
        for (const orderNo of selectedRowKeys) {
          await handleUpdateShipmentStatus({
            orderNo: orderNo,
            status: "Dispatched", // Adjust status based on API requirements
            notes: `Dispatched from ${dcCode} DC`,
          });
        }

        notify.success(`${selectedRowKeys.length} item(s) dispatched successfully`);
        setSelectedRowKeys([]);
        handleRefresh();
      } catch (error) {
        console.error("Error dispatching items:", error);
        notify.error(error.message || "Failed to dispatch items");
      }
    }
  };

  // Handle cancel dispatch for selected items
  const handleCancelDispatch = async () => {
    if (selectedRowKeys.length === 0) {
      notify.error("Please select items to cancel dispatch");
      return;
    }

    const result = await MySwal.fire({
      title: "Cancel Dispatch",
      text: `Are you sure you want to cancel dispatch for ${selectedRowKeys.length} item(s)?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Cancel",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        // Update status for each selected item
        for (const orderNo of selectedRowKeys) {
          await handleUpdateShipmentStatus({
            orderNo: orderNo,
            status: "Cancelled", // Adjust status based on API requirements
            notes: `Dispatch cancelled for ${dcCode} DC`,
          });
        }

        notify.success(`Dispatch cancelled for ${selectedRowKeys.length} item(s)`);
        setSelectedRowKeys([]);
        handleRefresh();
      } catch (error) {
        console.error("Error cancelling dispatch:", error);
        notify.error(error.message || "Failed to cancel dispatch");
      }
    }
  };

  // Table columns for handover items
  const columns = [
    {
      title: "Order No",
      dataIndex: "OrderNO",
      key: "OrderNO",
      render: (text) => <span className="fw-bold">{text}</span>,
    },
    {
      title: "Customer Name",
      dataIndex: "CustomerName",
      key: "CustomerName",
      render: (text) => text || "N/A",
    },
    {
      title: "Customer Phone",
      dataIndex: "CustomerPhone",
      key: "CustomerPhone",
      render: (text) => text || "N/A",
    },
    {
      title: "Vendor",
      dataIndex: "VendorName",
      key: "VendorName",
      render: (text) => text || "N/A",
    },
    {
      title: "Origin DC",
      dataIndex: "OriginDCCode",
      key: "OriginDCCode",
      render: (text) => <span className="badge bg-info">{text}</span>,
    },
    {
      title: "Destination DC",
      dataIndex: "DestinationDCCode",
      key: "DestinationDCCode",
      render: (text) => <span className="badge bg-success">{text}</span>,
    },
    {
      title: "Status",
      dataIndex: "StatusName",
      key: "StatusName",
      render: (text) => {
        const statusColors = {
          "Pending": "warning",
          "Dispatched": "success",
          "In Transit": "info",
          "Cancelled": "danger",
        };
        return (
          <span className={`badge bg-${statusColors[text] || "secondary"}`}>
            {text || "Unknown"}
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (record) => (
        <Button
          className="btn btn-sm btn-outline-primary"
          onClick={() => {
            // TODO: Implement view item details
            notify.info(`Details for order ${record.OrderNO}`);
          }}
        >
          <Eye size={14} className="me-1" />
          View
        </Button>
      ),
    },
  ];

  if (loading && !batchInfo) {
    return (
      <div className="content">
        <div className="text-center p-5">
          <Spinner animation="border" />
          <p className="mt-2">Loading batch details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Batch</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={handleRefresh}>
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="content">
      {/* Header */}
      <div className="page-header">
        <div className="add-item d-flex">
          <div className="page-title">
            <div className="d-flex align-items-center">
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-3"
                onClick={handleBack}
              >
                <ArrowLeft size={16} />
              </Button>
              <ArrowUp size={20} className="me-2 text-warning" />
              <div>
                <h4>Outbound Batch: {handoverCode}</h4>
                <h6>View and manage items in this outbound batch</h6>
              </div>
            </div>
          </div>
        </div>
        <DCSwitcher />
        <div className="page-btn">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="me-2"
          >
            <RotateCcw size={14} className="me-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Batch Info Card */}
      {batchInfo && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Batch Information</h5>
          </Card.Header>
          <Card.Body>
            <div className="row">
              <div className="col-md-3">
                <div className="mb-3">
                  <label className="form-label fw-bold">Handover Code:</label>
                  <p className="mb-0">{batchInfo.handoverCode}</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-3">
                  <label className="form-label fw-bold">From DC:</label>
                  <p className="mb-0">
                    <Badge bg="info">{batchInfo.fromDC}</Badge>
                  </p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-3">
                  <label className="form-label fw-bold">To DC:</label>
                  <p className="mb-0">
                    <Badge bg="success">{batchInfo.toDC}</Badge>
                  </p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-3">
                  <label className="form-label fw-bold">Rider:</label>
                  <p className="mb-0">{batchInfo.rider || "N/A"}</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-3">
                  <label className="form-label fw-bold">Total Items:</label>
                  <p className="mb-0">{batchInfo.totalItems}</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-3">
                  <label className="form-label fw-bold">Created Date:</label>
                  <p className="mb-0">
                    {batchInfo.createdDate
                      ? new Date(batchInfo.createdDate).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Items Table */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Batch Items</h5>
          {selectedRowKeys.length > 0 && (
            <div>
              <Button
                variant="primary"
                size="sm"
                className="me-2"
                onClick={handleDispatchItems}
              >
                <Truck size={14} className="me-1" />
                Dispatch ({selectedRowKeys.length})
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={handleCancelDispatch}
              >
                <XCircle size={14} className="me-1" />
                Cancel ({selectedRowKeys.length})
              </Button>
            </div>
          )}
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center p-3">
              <Spinner animation="border" />
              <p className="mt-2">Loading items...</p>
            </div>
          ) : handoverItems && handoverItems.length > 0 ? (
            <Datatable
              columns={columns}
              dataSource={handoverItems}
              loading={loading}
              rowKey="OrderNO"
              rowSelection={{
                selectedRowKeys,
                onChange: handleRowSelectionChange,
              }}
            />
          ) : (
            <div className="text-center p-4">
              <Package size={48} className="text-muted mb-3" />
              <h5>No items found</h5>
              <p className="text-muted">This batch doesn't contain any items yet.</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default OutboundBatchDetail;
