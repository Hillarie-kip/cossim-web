"use client"
import React, { useState } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";

const AddSettlementItemModal = ({ show, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    orderNO: "",
    codAmount: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.orderNO.trim()) {
      newErrors.orderNO = "Order number is required";
    }

    if (!form.codAmount || form.codAmount <= 0) {
      newErrors.codAmount = "COD amount must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const itemData = {
        items: [{
          orderNO: form.orderNO.trim(),
          codAmount: parseFloat(form.codAmount),
          addedBy: 1, // This should come from auth context
        }]
      };

      await onSubmit(itemData);

      // Reset form
      setForm({
        orderNO: "",
        codAmount: "",
      });
      setErrors({});
    } catch (error) {
      console.error('Error in form submission:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setForm({
        orderNO: "",
        codAmount: "",
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Add Settlement Item</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Alert variant="info">
            <strong>Note:</strong> You can add multiple orders to a settlement. Each order will be added as a separate item.
          </Alert>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Order Number <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="orderNO"
                  value={form.orderNO}
                  onChange={handleChange}
                  placeholder="Enter order number"
                  isInvalid={!!errors.orderNO}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.orderNO}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>COD Amount <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="number"
                  name="codAmount"
                  value={form.codAmount}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  isInvalid={!!errors.codAmount}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.codAmount}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Amount to be settled for this order
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? "Adding..." : "Add Item"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddSettlementItemModal;
