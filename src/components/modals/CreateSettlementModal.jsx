"use client"
import React, { useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import SSRSelect from "@/components/SSRSelect";

const CreateSettlementModal = ({ show, onClose, onSubmit, vendors }) => {
  const [form, setForm] = useState({
    vendorCode: "",
    notes: "",
    settledAt: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Prepare vendor options
  const vendorOptions = vendors.map(vendor => ({
    value: vendor.vendorCode,
    label: `${vendor.vendorCode} - ${vendor.vendorName}`
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (selectedOption) => {
    setForm((prev) => ({ ...prev, vendorCode: selectedOption?.value || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const settlementData = {
        ...form,
        settledAt: form.settledAt || new Date().toISOString(),
        addedBy: 1, // This should come from auth context
      };

      await onSubmit(settlementData);

      // Reset form
      setForm({
        vendorCode: "",
        notes: "",
        settledAt: "",
      });
    } catch (error) {
      console.error('Error in form submission:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setForm({
        vendorCode: "",
        notes: "",
        settledAt: "",
      });
      onClose();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Create New Settlement</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Vendor <span className="text-danger">*</span></Form.Label>
                <SSRSelect
                  options={vendorOptions}
                  value={vendorOptions.find(option => option.value === form.vendorCode)}
                  onChange={handleSelectChange}
                  placeholder="Select Vendor"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Settlement Date</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="settledAt"
                  value={form.settledAt}
                  onChange={handleChange}
                />
                <Form.Text className="text-muted">
                  Leave empty to use current date/time
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Optional notes about this settlement"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting || !form.vendorCode}>
            {submitting ? "Creating..." : "Create Settlement"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateSettlementModal;
