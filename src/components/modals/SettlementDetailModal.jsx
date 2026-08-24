"use client"
import React, { useState } from "react";
import { Modal, Button, Table, Badge, Alert } from "react-bootstrap";
import { Trash2, DollarSign, Package } from "feather-icons-react";

const SettlementDetailModal = ({ show, onClose, settlementDetail, onRemoveItem, selectedSettlement }) => {
  const [removingItem, setRemovingItem] = useState(null);

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

  // Handle remove item
  const handleRemoveItem = async (codSettlementItemID, orderNO) => {
    setRemovingItem(codSettlementItemID);
    try {
      await onRemoveItem(selectedSettlement, codSettlementItemID, orderNO);
    } finally {
      setRemovingItem(null);
    }
  };

  if (!settlementDetail) {
    return (
      <Modal show={show} onHide={onClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Settlement Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center p-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading settlement details...</p>
          </div>
        </Modal.Body>
      </Modal>
    );
  }

  const { settlement, items } = settlementDetail;

  return (
    <Modal show={show} onHide={onClose} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>
          <Package className="me-2" size={20} />
          Settlement Details - {settlement?.settlementNO}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Settlement Summary */}
        <div className="row mb-4">
          <div className="col-md-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Settlement Summary</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-3">
                    <strong>Settlement NO:</strong> {settlement?.settlementNO}
                  </div>
                  <div className="col-md-3">
                    <strong>Vendor:</strong> {settlement?.vendorCode}
                  </div>
                  <div className="col-md-3">
                    <strong>Total Amount:</strong>{" "}
                    <span className="text-success fw-bold">
                      {formatCurrency(settlement?.totalAmount)}
                    </span>
                  </div>
                  <div className="col-md-3">
                    <strong>Status:</strong>{" "}
                    <Badge bg={settlement?.statusID === 4 ? "success" : "warning"}>
                      {settlement?.statusID === 4 ? "Completed" : "Pending"}
                    </Badge>
                  </div>
                </div>
                <div className="row mt-2">
                  <div className="col-md-6">
                    <strong>Settled At:</strong> {formatDate(settlement?.settledAt)}
                  </div>
                  <div className="col-md-6">
                    <strong>Date Added:</strong> {formatDate(settlement?.dateAdded)}
                  </div>
                </div>
                {settlement?.notes && (
                  <div className="row mt-2">
                    <div className="col-md-12">
                      <strong>Notes:</strong> {settlement.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Settlement Items */}
        <div className="row">
          <div className="col-md-12">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Settlement Items</h5>
                <div className="d-flex align-items-center">
                  <DollarSign className="me-2" size={16} />
                  <span className="fw-bold">
                    Total Items: {items?.length || 0}
                  </span>
                </div>
              </div>
              <div className="card-body">
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
                                disabled={removingItem === item.codSettlementItemID || settlement?.statusID === 4}
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
                    <p>This settlement has no items yet. You can add items using the "Add Item" button.</p>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SettlementDetailModal;
