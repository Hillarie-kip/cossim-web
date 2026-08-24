"use client";
import React from "react";
import { Modal, Button, Table, Badge } from "react-bootstrap";

const ViewCustomerAddressesModal = ({ show, onClose, customer }) => {
  if (!customer) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (statusID) => {
    return statusID === 1 ? "success" : "danger";
  };

  return (
    <Modal show={show} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Customer Addresses - {customer.customerName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <h6>Customer Details</h6>
          <p><strong>Customer Code:</strong> {customer.vendorCustomerCode}</p>
          <p><strong>Phone:</strong> {customer.phoneNumber || "N/A"}</p>
          <p><strong>Email:</strong> {customer.emailAddress || "N/A"}</p>
        </div>

        <h6>Addresses</h6>
        {customer.customerAddressArray && customer.customerAddressArray.length > 0 ? (
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Address Code</th>
                  <th>Address Line</th>
                  <th>Landmark</th>
                  <th>DC Code</th>
                  <th>DC Name</th>
                  <th>Default</th>
                  <th>Status</th>
                  <th>Date Added</th>
                </tr>
              </thead>
              <tbody>
                {customer.customerAddressArray.map((address) => (
                  <tr key={address.vendorCustomerAddressID}>
                    <td>{address.vendorCustomerAddressCode}</td>
                    <td>{address.addressLine}</td>
                    <td>{address.landmark || "N/A"}</td>
                    <td>{address.CustomerAddressDCCode}</td>
                    <td>{address.CustomerAddressDCName}</td>
                    <td>
                      {address.isDefault ? (
                        <Badge bg="primary">Default</Badge>
                      ) : (
                        "No"
                      )}
                    </td>
                    <td>
                      <Badge bg={getStatusBadge(address.statusID)}>
                        {address.statusID === 1 ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td>{formatDate(address.dateAdded)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <p>No addresses found for this customer.</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewCustomerAddressesModal;
