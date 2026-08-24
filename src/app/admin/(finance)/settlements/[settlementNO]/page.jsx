"use client"
import {
  ChevronUp,
  RotateCcw,
  PlusCircle,
  Edit,
  CheckCircle,
  XCircle,
  DollarSign,
  Package,
  Calendar,
  User,
  FileText,
  Trash2,
  ArrowLeft,
} from "feather-icons-react";
import React, { useState, useEffect } from "react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { OverlayTrigger, Tooltip, Badge, Button, Form, Row, Col, Card, Table, Alert, Spinner } from "react-bootstrap";
import Link from "@/components/Link";
import { all_routes } from "@/Router/all_routes";
import { useFinance } from "@/hooks/useFinance";
import { useAdmin } from "@/hooks/useAdmin";
import { useParams } from "next/navigation";
import {
  AddSettlementItemModal,
  UpdateSettlementModal,
} from "@/components/modals";
import notify from "@/lib/toast";

const SettlementDetailPage = () => {
  const route = all_routes;
  const MySwal = withReactContent(Swal);
  const params = useParams();
  const settlementNO = params.settlementNO;

  // State management
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [removingItem, setRemovingItem] = useState(null);

  // Use hooks
  const {
    settlementDetail,
    loading,
    error,
    fetchSettlementDetail,
    handleUpdateSettlement,
    handleUpdateSettlementStatus,
    handleFinalizeSettlement,
    handleAddSettlementItem,
    handleRemoveSettlementItem,
  } = useFinance();

  const { vendors } = useAdmin();

  // Fetch settlement detail on component mount
  useEffect(() => {
    if (settlementNO) {
      fetchSettlementDetail(settlementNO);
    }
  }, [settlementNO]);

  // Handle update settlement
  const handleUpdateSettlementClick = async (updateData) => {
    try {
      await handleUpdateSettlement(updateData);
      setShowUpdateModal(false);
      fetchSettlementDetail(settlementNO);
    } catch (error) {
      console.error('Error updating settlement:', error);
    }
  };

  // Handle finalize settlement
  const handleFinalizeSettlementClick = async () => {
    try {
      const result = await MySwal.fire({
        title: "Are you sure?",
        text: "This will finalize the settlement and it cannot be undone!",
        showCancelButton: true,
        confirmButtonColor: "#28a745",
        confirmButtonText: "Yes, finalize it!",
        cancelButtonColor: "#6c757d",
        cancelButtonText: "Cancel",
      });

      if (result.isConfirmed) {
        await handleFinalizeSettlement(settlementNO, {
          settledAt: new Date().toISOString(),
          settledByUserID: 1, // This should come from auth context
          statusID: 4
        });
        fetchSettlementDetail(settlementNO);
        notify.success("Settlement has been finalized successfully.");
      }
    } catch (error) {
      console.error('Error finalizing settlement:', error);
      notify.error(error.message || "Failed to finalize settlement");
    }
  };

  // Handle update settlement status
  const handleUpdateStatus = async (newStatusID) => {
    try {
      const statusText = newStatusID === 1 ? "activate" : newStatusID === 5 ? "cancel" : "update";
      const result = await MySwal.fire({
        title: "Are you sure?",
        text: `This will ${statusText} the settlement!`,
        showCancelButton: true,
        confirmButtonColor: newStatusID === 1 ? "#28a745" : newStatusID === 5 ? "#dc3545" : "#ffc107",
        confirmButtonText: `Yes, ${statusText} it!`,
        cancelButtonColor: "#6c757d",
        cancelButtonText: "Cancel",
      });

      if (result.isConfirmed) {
        await handleUpdateSettlementStatus(settlementNO, newStatusID);
        fetchSettlementDetail(settlementNO);
        notify.success(`Settlement has been ${statusText}d successfully.`);
      }
    } catch (error) {
      console.error('Error updating settlement status:', error);
      notify.error(error.message || "Failed to update settlement status");
    }
  };

  // Handle add settlement item
  const handleAddItem = async (itemData) => {
    try {
      const finalData = {
        settlementNO: settlementNO,
        ...itemData
      };
      await handleAddSettlementItem(settlementNO, finalData);
      setShowAddItemModal(false);
      // No need to call fetchSettlementDetail here as it's handled in the hook
    } catch (error) {
      console.error('Error adding settlement item:', error);
    }
  };

  // Handle remove settlement item
  const handleRemoveItem = async (codSettlementItemID, orderNO) => {
    setRemovingItem(codSettlementItemID);
    try {
      const result = await MySwal.fire({
        title: "Are you sure?",
        text: "This will remove the item from the settlement!",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        confirmButtonText: "Yes, remove it!",
        cancelButtonColor: "#6c757d",
        cancelButtonText: "Cancel",
      });

      if (result.isConfirmed) {
        const removeData = {
          settlementNO: settlementNO,
          codSettlementItemID: codSettlementItemID,
          orderNO: orderNO
        };
        await handleRemoveSettlementItem(removeData);
        fetchSettlementDetail(settlementNO);
        notify.success("Settlement item has been removed.");
      }
    } catch (error) {
      console.error('Error removing settlement item:', error);
      notify.error(error.message || "Failed to remove settlement item");
    } finally {
      setRemovingItem(null);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (statusID) => {
    const statusMap = {
      1: { variant: "success", text: "Active" },
      2: { variant: "warning", text: "Pending" },
      3: { variant: "info", text: "Processing" },
      4: { variant: "primary", text: "Completed" },
      5: { variant: "danger", text: "Cancelled" },
    };
    const status = statusMap[statusID] || { variant: "secondary", text: "Unknown" };
    return <Badge bg={status.variant}>{status.text}</Badge>;
  };

  // Get vendor name
  const getVendorName = (vendorCode) => {
    const vendor = vendors?.find(v => v.vendorCode === vendorCode);
    return vendor ? `${vendor.vendorCode} - ${vendor.vendorName}` : vendorCode;
  };

  // Tooltip render functions
  const renderTooltip = (props) => (
    <Tooltip id="refresh-tooltip" {...props}>
      Refresh
    </Tooltip>
  );

  if (loading && !settlementDetail) {
    return (
      <div className="content">
        <div className="text-center p-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading settlement details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Settlement</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => fetchSettlementDetail(settlementNO)}>
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  if (!settlementDetail) {
    return (
      <div className="content">
        <Alert variant="warning">
          <Alert.Heading>Settlement Not Found</Alert.Heading>
          <p>The settlement you're looking for could not be found.</p>
          <Link href={route.settlements}>
            <Button variant="outline-primary">Back to Settlements</Button>
          </Link>
        </Alert>
      </div>
    );
  }

  const settlementData = settlementDetail;
  const items = settlementData?.itemsArray || [];

  return (
    <React.Fragment>
      {/* Add Settlement Item Modal */}
      <AddSettlementItemModal
        show={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        onSubmit={handleAddItem}
      />

      {/* Update Settlement Modal */}
      <UpdateSettlementModal
        show={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onSubmit={handleUpdateSettlementClick}
        settlement={settlementData}
      />

      <div className="content">
        {/* Page Header */}
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <Link href={route.settlements} className="me-3">
                <ArrowLeft size={20} />
              </Link>
              <h4>Settlement Details</h4>
              <h6>{settlementData?.settlementNO}</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <li>
              <OverlayTrigger placement="top" overlay={renderTooltip}>
                <Link
                  onClick={() => fetchSettlementDetail(settlementNO)}
                >
                  <RotateCcw />
                </Link>
              </OverlayTrigger>
            </li>
          </ul>
          <div className="page-btn">
            {settlementData?.statusID !== 4 && (
              <>
                <Button
                  variant="success"
                  className="me-2"
                  onClick={() => setShowAddItemModal(true)}
                >
                  <PlusCircle className="me-2" size={16} />
                  Add Item
                </Button>
                <Button
                  variant="primary"
                  className="me-2"
                  onClick={() => setShowUpdateModal(true)}
                >
                  <Edit className="me-2" size={16} />
                  Update
                </Button>
                <Button
                  variant="info"
                  className="me-2"
                  onClick={handleFinalizeSettlementClick}
                >
                  <CheckCircle className="me-2" size={16} />
                  Finalize
                </Button>
                {settlementData?.statusID === 1 ? (
                  <Button
                    variant="danger"
                    onClick={() => handleUpdateStatus(5)}
                  >
                    <XCircle className="me-2" size={16} />
                    Cancel
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    onClick={() => handleUpdateStatus(1)}
                  >
                    <CheckCircle className="me-2" size={16} />
                    Activate
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Settlement Summary Cards */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <Package size={24} className="text-primary mb-2" />
                <h6 className="card-title">Settlement NO</h6>
                <h4 className="text-primary">{settlementData?.settlementNO}</h4>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <User size={24} className="text-info mb-2" />
                <h6 className="card-title">Vendor</h6>
                <p className="mb-0">{getVendorName(settlementData?.vendorCode)}</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <DollarSign size={24} className="text-success mb-2" />
                <h6 className="card-title">Total Amount</h6>
                <h4 className="text-success">{formatCurrency(settlementData?.totalAmount)}</h4>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <FileText size={24} className="text-warning mb-2" />
                <h6 className="card-title">Status</h6>
                {getStatusBadge(settlementData?.statusID)}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Settlement Details */}
        <Row className="mb-4">
          <Col md={12}>
            <Card>
              <Card.Header>
                <h5 className="card-title mb-0">Settlement Information</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Settlement Date:</strong> {formatDate(settlementData?.settledAt)}
                    </div>
                    <div className="mb-3">
                      <strong>Date Added:</strong> {formatDate(settlementData?.dateAdded)}
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Settled By:</strong> {settlementData?.settledByUserID || "N/A"}
                    </div>
                    <div className="mb-3">
                      <strong>Added By:</strong> {settlementData?.addedBy || "N/A"}
                    </div>
                  </Col>
                </Row>
                {settlementData?.notes && (
                  <Row>
                    <Col md={12}>
                      <div className="mb-3">
                        <strong>Notes:</strong>
                        <p className="mt-2">{settlementData.notes}</p>
                      </div>
                    </Col>
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Settlement Items */}
        <Row>
          <Col md={12}>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Settlement Items</h5>
                <div className="d-flex align-items-center">
                  <DollarSign className="me-2" size={16} />
                  <span className="fw-bold">
                    Total Items: {items?.length || 0}
                  </span>
                </div>
              </Card.Header>
              <Card.Body>
                {items && items.length > 0 ? (
                  <div className="table-responsive">
                    <Table striped hover>
                      <thead>
                        <tr>
                          <th>Order NO</th>
                          <th>COD Amount</th>
                          <th>Date Added</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.codSettlementItemID}>
                            <td>
                              <span className="text-primary fw-bold">
                                {item.orderNO}
                              </span>
                            </td>
                            <td className="text-end">
                              {formatCurrency(item.codAmount)}
                            </td>
                            <td>{formatDate(item.dateAdded)}</td>
                            <td>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleRemoveItem(item.codSettlementItemID, item.orderNO)}
                                disabled={removingItem === item.codSettlementItemID || settlementData?.statusID === 4}
                              >
                                <Trash2 size={14} className="me-1" />
                                {removingItem === item.codSettlementItemID ? "Removing..." : "Remove"}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="table-dark">
                          <td colSpan="1" className="text-end fw-bold">Total:</td>
                          <td className="text-end fw-bold">
                            {formatCurrency(
                              items.reduce((sum, item) => sum + (item.codAmount || 0), 0)
                            )}
                          </td>
                          <td colSpan="2"></td>
                        </tr>
                      </tfoot>
                    </Table>
                  </div>
                ) : (
                  <Alert variant="info">
                    <Alert.Heading>No Items Found</Alert.Heading>
                    <p>This settlement has no items yet. Click "Add Item" to add orders to this settlement.</p>
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </React.Fragment>
  );
};

export default SettlementDetailPage;
