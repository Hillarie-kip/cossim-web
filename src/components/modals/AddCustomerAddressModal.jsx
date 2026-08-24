"use client";
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
import { MapPin, Save, X } from "feather-icons-react";
import SSRSelect from "@/components/SSRSelect";
import { useAdmin } from "@/hooks/useAdmin";

const AddCustomerAddressModal = ({ show, onClose, onSubmit, customer, currentUserId }) => {
  const [formData, setFormData] = useState({
    vendorCustomerCode: '',
    customerAddressDCCode: '',
    addressLine: '',
    landmark: '',
    isDefault: false,
    addedBy: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use admin hook to fetch distribution centers
  const { distributionCenters, fetchDistributionCenters, loading: dcLoading } = useAdmin();

  // Fetch distribution centers when modal opens
  useEffect(() => {
    if (show) {
      fetchDistributionCenters();
    }
  }, [show, fetchDistributionCenters]);

  // Prepare options for the pickup point dropdown
  const pickupPointOptions = distributionCenters.filter(dc => dc.DistributionCenterTypeID === 300).map(dc => ({
    value: dc.DCCode,
    label: `${dc.CityName} ${dc.DCCode} - ${dc.DCName}`
  }));

  // Reset form when modal opens
  useEffect(() => {
    if (show && customer) {
      setFormData({
        vendorCustomerCode: customer.vendorCustomerCode || '',
        customerAddressDCCode: '',
        addressLine: '',
        landmark: '',
        isDefault: false,
        addedBy: currentUserId || ''
      });
      setError(null);
    }
  }, [show, customer, currentUserId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePickupPointChange = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      customerAddressDCCode: selectedOption?.value || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.addressLine.trim()) {
      setError('Address line is required');
      return;
    }

    if (!formData.customerAddressDCCode) {
      setError('Pickup point is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      vendorCustomerCode: '',
      customerAddressDCCode: '',
      addressLine: '',
      landmark: '',
      isDefault: false,
      addedBy: ''
    });
    setError(null);
    onClose();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <MapPin size={20} className="me-2" />
          Add New Address
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Customer Code</Form.Label>
                <Form.Control
                  type="text"
                  name="vendorCustomerCode"
                  value={formData.vendorCustomerCode}
                  readOnly
                  disabled
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Pickup Point *</Form.Label>
                <SSRSelect
                  name="customerAddressDCCode"
                  value={pickupPointOptions.find(option => option.value === formData.customerAddressDCCode) || null}
                  onChange={handlePickupPointChange}
                  options={pickupPointOptions}
                  placeholder="Select pickup point..."
                  isLoading={dcLoading}
                  isSearchable={true}
                  isClearable={true}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  instanceId="customerAddressDCCode-select"
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Address Line *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="addressLine"
              value={formData.addressLine}
              onChange={handleInputChange}
              placeholder="Enter full address"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Landmark</Form.Label>
            <Form.Control
              type="text"
              name="landmark"
              value={formData.landmark}
              onChange={handleInputChange}
              placeholder="Enter landmark (optional)"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleInputChange}
              label="Set as default address"
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          <X size={16} className="me-2" />
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          <Save size={16} className="me-2" />
          {loading ? 'Adding...' : 'Add Address'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddCustomerAddressModal;
