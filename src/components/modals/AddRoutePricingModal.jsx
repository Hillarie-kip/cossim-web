import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Row, Col } from "react-bootstrap";
import Select from "react-select";
import DatePicker, { registerLocale, setDefaultLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { enUS } from 'date-fns/locale/en-US';
import PropTypes from "prop-types";
import { useShipment } from "@/hooks/useShipment";
import { useVendors } from "@/hooks/useVendors";

// Register English locale (you can change this to your preferred locale)
registerLocale('en-US', enUS);

// Set default locale for all date pickers
setDefaultLocale('en-US');

const AddRoutePricingModal = ({
  show,
  onHide,
  formData,
  onInputChange,
  onSubmit,
  loading = false,
  priceZones = [],
}) => {
  // Hooks for fetching data
  const { deliveryTypes, fetchDeliveryTypes } = useShipment();
  const { vendors } = useVendors({ pageNo: 1, pageSize: 500 });

  // Local state for select values
  const [selectedDeliveryType, setSelectedDeliveryType] = useState(null);

  // Local state for date pickers
  const [effectiveFromDate, setEffectiveFromDate] = useState(null);
  const [effectiveToDate, setEffectiveToDate] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    if (show) {
      fetchDeliveryTypes();
    }
  }, [show, fetchDeliveryTypes]);

  // Update local state when formData changes
  useEffect(() => {
    // Ensure arrays are available before using find
    if (!Array.isArray(deliveryTypes)) {
      return;
    }

    const deliveryType = deliveryTypes.find(dt => dt.DeliveryTypeCode === formData.deliveryTypeCode);

    setSelectedDeliveryType(deliveryType ? { value: deliveryType.DeliveryTypeCode, label: deliveryType.DeliveryTypeName } : null);

    // Sync date picker state with formData
    setEffectiveFromDate(formData.effectiveFrom ? new Date(formData.effectiveFrom + (formData.effectiveFrom.includes('T') ? '' : 'T00:00')) : null);
    setEffectiveToDate(formData.effectiveTo ? new Date(formData.effectiveTo + (formData.effectiveTo.includes('T') ? '' : 'T00:00')) : null);
  }, [formData, deliveryTypes]);

  // Transform delivery types for select options
  const deliveryTypeOptions = Array.isArray(deliveryTypes)
    ? deliveryTypes
        .filter(dt => dt.StatusID === 1) // Only active delivery types
        .map(dt => ({
          value: dt.DeliveryTypeCode,
          label: dt.DeliveryTypeName,
          deliveryTypeData: dt
        }))
    : [];
  const vendorOptions = (Array.isArray(vendors) ? vendors : [])
    .map((vendor) => {
      const value = vendor.vendorCode ?? vendor.VendorCode;
      const name = vendor.vendorName ?? vendor.VendorName;

      return value ? { value, label: `${name || value} (${value})` } : null;
    })
    .filter(Boolean);
  const priceZoneOptions = (Array.isArray(priceZones) ? priceZones : [])
    .map((zone) => {
      const value = zone.priceZoneID ?? zone.PriceZoneID ?? zone.priceZoneId;
      const name = zone.zoneName ?? zone.ZoneName;
      const dcCodes = zone.dcCodes ?? zone.DCCodes ?? [];

      return value == null
        ? null
        : { value, label: `${name || `Zone ${value}`} (${dcCodes.length} DCs)` };
    })
    .filter(Boolean);
  const sizeOptions = ['SMALL','MEDIUM','LARGE','EXTRA_LARGE'].map(value => ({ value, label: value.replace('_',' ') }));
  const priceTypeOptions = [
    { value: 'NEGOTIATED', label: 'Negotiated' }, { value: 'FIXED', label: 'Fixed' },
    { value: 'PER_KM', label: 'Per KM' }, { value: 'ZONING', label: 'Zoning' }
  ];
  const updateField = (name, value) => onInputChange({ target: { name, value } });

  const handleDeliveryTypeChange = (selectedOption) => {
    setSelectedDeliveryType(selectedOption);
    onInputChange({
      target: {
        name: 'deliveryTypeCode',
        value: selectedOption ? selectedOption.value : ''
      }
    });
  };

  // Handle date picker changes
  const handleEffectiveFromChange = (date) => {
    setEffectiveFromDate(date);
    onInputChange({
      target: {
        name: 'effectiveFrom',
        value: date ? formatLocalDateTime(date) : ''
      }
    });
  };

  const handleEffectiveToChange = (date) => {
    setEffectiveToDate(date);
    onInputChange({
      target: {
        name: 'effectiveTo',
        value: date ? formatLocalDateTime(date) : ''
      }
    });
  };

  // Helper function to format date in local timezone
  const formatLocalDateTime = (date) => {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Reset selections when modal is hidden
  useEffect(() => {
    if (!show) {
      setSelectedDeliveryType(null);
      setEffectiveFromDate(null);
      setEffectiveToDate(null);
    }
  }, [show]);
  // Custom styles for react-select to match Bootstrap theme
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? '#80bdff' : '#ced4da',
      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0,123,255,.25)' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#80bdff' : '#adb5bd'
      }
    }),
    option: (base, state) => {
      let backgroundColor = 'white';
      if (state.isSelected) {
        backgroundColor = '#007bff';
      } else if (state.isFocused) {
        backgroundColor = '#f8f9fa';
      }

      return {
        ...base,
        backgroundColor,
        color: state.isSelected ? 'white' : '#495057',
        '&:hover': {
          backgroundColor: state.isSelected ? '#007bff' : '#f8f9fa'
        }
      };
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Add New Route Pricing</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={onSubmit}>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Vendor *</Form.Label>
                <Select
                  options={vendorOptions}
                  value={vendorOptions.find(o => o.value === formData.vendorCode) || null}
                  onChange={o => updateField('vendorCode', o?.value || '')}
                  placeholder="Select vendor"
                  isClearable
                  isSearchable
                  className="react-select"
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Package Size *</Form.Label>
                <Select
                  options={sizeOptions}
                  value={sizeOptions.find(o => o.value === formData.shipmentRateSize) || null}
                  onChange={o => updateField('shipmentRateSize', o?.value || '')}
                  placeholder="Select package size"
                  isClearable
                  isSearchable
                  className="react-select"
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row><Col md={12}><Form.Group className="mb-3"><Form.Label>Price Type *</Form.Label><Select options={priceTypeOptions} value={priceTypeOptions.find(o=>o.value===formData.priceType)} onChange={o=>{updateField('priceType',o?.value||'FIXED'); if(o?.value!=='ZONING') updateField('priceZoneID','');}} styles={selectStyles} /></Form.Group></Col></Row>

          {formData.priceType === 'ZONING' && <div className="border rounded p-3 mb-3">
            <Form.Label>Price Zone *</Form.Label>
            <Select options={priceZoneOptions} value={priceZoneOptions.find(o=>String(o.value)===String(formData.priceZoneID))||null} onChange={o=>updateField('priceZoneID',o?.value||'')} styles={selectStyles} placeholder="Select a price zone" />
          </div>}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Delivery Type Code *</Form.Label>
                <Select
                  options={deliveryTypeOptions}
                  value={selectedDeliveryType}
                  onChange={handleDeliveryTypeChange}
                  placeholder="Select delivery type"
                  isClearable
                  isSearchable
                  className="react-select"
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>SLA Hours</Form.Label>
                <Form.Control
                  type="number"
                  name="slaHours"
                  value={formData.slaHours}
                  onChange={onInputChange}
                  placeholder="Enter SLA hours"
                  min="0"
                  step="0.01"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>{formData.priceType === 'PER_KM' ? 'Rate per KM *' : 'Rate Amount *'}</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="rateAmount"
                  value={formData.rateAmount}
                  onChange={onInputChange}
                  placeholder="Enter rate amount"
                  required
                  min="0"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Effective From</Form.Label>
                <DatePicker
                  selected={effectiveFromDate}
                  onChange={handleEffectiveFromChange}
                  showTimeSelect
                  timeFormat="h:mm aa"
                  timeIntervals={5}
                  timeCaption="Time"
                  dateFormat="yyyy-MM-dd h:mm aa"
                  placeholderText="Select effective from date and time"
                  className="form-control"
                  wrapperClassName="w-100"
                  locale="en-US"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  minDate={new Date()}
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Effective To</Form.Label>
                <DatePicker
                  selected={effectiveToDate}
                  onChange={handleEffectiveToChange}
                  showTimeSelect
                  timeFormat="h:mm aa"
                  timeIntervals={5}
                  timeCaption="Time"
                  dateFormat="yyyy-MM-dd h:mm aa"
                  placeholderText="Select effective to date and time"
                  className="form-control"
                  wrapperClassName="w-100"
                  locale="en-US"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  minDate={effectiveFromDate || new Date()}
                  isClearable
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={onSubmit}
          disabled={loading || !formData.rateAmount || !formData.vendorCode || !formData.shipmentRateSize || !formData.deliveryTypeCode || (formData.priceType === 'ZONING' && !formData.priceZoneID)}
        >
          {loading ? 'Creating...' : 'Create Route Pricing'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

AddRoutePricingModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  formData: PropTypes.shape({
    fromDCCode: PropTypes.string,
    toDCCode: PropTypes.string,
    deliveryTypeCode: PropTypes.string,
    slaHours: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    rateAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    effectiveFrom: PropTypes.string,
    effectiveTo: PropTypes.string,
  }).isRequired,
  onInputChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  priceZones: PropTypes.array,
};

export default AddRoutePricingModal;
