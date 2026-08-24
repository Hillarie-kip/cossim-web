import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Button, Form, Modal } from "react-bootstrap";
import Select from "react-select";
import { useAdmin } from "@/hooks/useAdmin";
import notify from "@/lib/toast";

const initialForm = { zoneName: "", description: "", dcCodes: [] };

const AddPriceZoneModal = ({ show, onHide, onSubmit }) => {
  const { distributionCenters, fetchDistributionCenters } = useAdmin();
  const [formData, setFormData] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (show) fetchDistributionCenters();
  }, [show, fetchDistributionCenters]);

  const dcOptions = (Array.isArray(distributionCenters) ? distributionCenters : [])
    .filter((dc) => dc.StatusID === 1)
    .map((dc) => ({
      value: dc.DCCode,
      label: `${dc.DCName} (${dc.DCCode})${dc.CityName ? ` - ${dc.CityName}` : ""}`,
    }));

  const handleClose = () => {
    if (saving) return;
    setFormData(initialForm);
    onHide();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await onSubmit(formData);
      notify.success("Price zone created successfully.");
      setFormData(initialForm);
      onHide();
    } catch (error) {
      notify.error(error.message || "Failed to create price zone.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Add Price Zone</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Zone Name *</Form.Label>
            <Form.Control value={formData.zoneName} onChange={(event) => setFormData((current) => ({ ...current, zoneName: event.target.value }))} placeholder="Enter zone name" required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Distribution Centers *</Form.Label>
            <Select isMulti options={dcOptions} onChange={(items) => setFormData((current) => ({ ...current, dcCodes: (items || []).map((item) => item.value) }))} placeholder="Select distribution centers" />
          </Form.Group>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={3} value={formData.description} onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))} placeholder="Optional description" />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving || !formData.zoneName.trim() || !formData.dcCodes.length}>{saving ? "Saving..." : "Create Price Zone"}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

AddPriceZoneModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default AddPriceZoneModal;
