"use client"
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import SSRSelect from "@/components/SSRSelect";

const UpdateSettlementModal = ({ show, onClose, onSubmit, settlement }) => {
  const [form, setForm] = useState({
    settlementNO: "",
    notes: "",
    settledAt: "",
    statusID: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Status options
  const statusOptions = [
    { value: "1", label: "Active" },
    { value: "2", label: "Pending" },
    { value: "3", label: "Processing" },
    { value: "4", label: "Completed" },
    { value: "5", label: "Cancelled" },
  ];

  // Update form when settlement changes
  useEffect(() => {
    if (settlement && show) {
      setForm({
        settlementNO: settlement.settlementNO || "",
        notes: settlement.notes || "",
        settledAt: settlement.settledAt ? new Date(settlement.settledAt).toISOString().slice(0, 16) : "",
        statusID: settlement.statusID?.toString() || "",
      });
    }
  }, [settlement, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (selectedOption) => {
    setForm((prev) => ({ ...prev, statusID: selectedOption?.value || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const updateData = {
        settlementNO: form.settlementNO,
        notes: form.notes,
        settledAt: form.settledAt || null,
        statusID: form.statusID ? parseInt(form.statusID) : null,
      };

      await onSubmit(updateData);

      // Reset form
      setForm({
        settlementNO: "",
        notes: "",
        settledAt: "",
        statusID: "",
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
        settlementNO: "",
        notes: "",
        settledAt: "",
        statusID: "",
      });
      onClose();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Update Settlement</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Settlement Number</Form.Label>
                <Form.Control
                  type="text"
                  name="settlementNO"
                  value={form.settlementNO}
                  onChange={handleChange}
                  disabled
                  readOnly
                />
                <Form.Text className="text-muted">
                  Settlement number cannot be changed
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <SSRSelect
                  options={statusOptions}
                  value={statusOptions.find(option => option.value === form.statusID)}
                  onChange={handleSelectChange}
                  placeholder="Select Status"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Settlement Date</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="settledAt"
                  value={form.settledAt}
                  onChange={handleChange}
                />
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
              placeholder="Update notes about this settlement"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? "Updating..." : "Update Settlement"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default UpdateSettlementModal;
