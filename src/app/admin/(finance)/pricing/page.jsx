"use client"
import {
  ChevronUp,
  RotateCcw,
  PlusCircle,
} from "feather-icons-react";
import React, { useState, useEffect } from "react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { OverlayTrigger, Tooltip, Badge, Button } from "react-bootstrap";
import Link from "@/components/Link";
import Datatable from "@/core/pagination/datatable";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import { useFinance } from "@/hooks/useFinance";
import { useAdmin } from "@/hooks/useAdmin";
import { useShipment } from "@/hooks/useShipment";
import Select from "react-select";
import { AddRoutePricingModal } from "@/components/modals";
import notify from "@/lib/toast";

// Delivery types constants - keeping as fallback
const DELIVERY_TYPES_FALLBACK = [
  { code: 'DOOR', name: 'Door Delivery' },
  { code: 'DC_AGENT', name: 'DC Agent' },
  { code: 'CUSTOMER', name: 'Customer Pickup' },
  { code: 'VENDOR', name: 'Vendor Delivery' },
  { code: 'PICKUP', name: 'Pickup' },
  { code: 'EXPRESS', name: 'Express' }
];

const RoutePricingList = () => {
  const {
    loading,
    error,
    shipmentRates,
    fetchShipmentRates,
    handleCreateShipmentRate, priceZones, fetchPriceZones
  } = useFinance();

  const {
    distributionCenters,
    fetchDistributionCenters
  } = useAdmin();

  const {
    deliveryTypes,
    fetchDeliveryTypes
  } = useShipment();

  // Filter state
  const [fromDCCode, setFromDCCode] = useState("");
  const [toDCCode, setToDCCode] = useState("");
  const [deliveryTypeCode, setDeliveryTypeCode] = useState("");
  const [selectedFromDC, setSelectedFromDC] = useState(null);
  const [selectedToDC, setSelectedToDC] = useState(null);
  const [selectedDeliveryType, setSelectedDeliveryType] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    vendorCode: '', shipmentRateSize: '', priceType: 'FIXED', priceZoneID: '',
    fromDCCode: '',
    toDCCode: '',
    deliveryTypeCode: '',
    slaHours: '',
    rateAmount: '',
    effectiveFrom: '',
    effectiveTo: ''
  });

  // Fetch shipment rates and distribution centers on component mount
  useEffect(() => {
    fetchShipmentRates({
      fromDCCode: fromDCCode || undefined,
      toDCCode: toDCCode || undefined,
      deliveryTypeCode: deliveryTypeCode || undefined,
    });
  }, [fetchShipmentRates, fromDCCode, toDCCode, deliveryTypeCode]);

  useEffect(() => {
    fetchDistributionCenters();
  }, [fetchDistributionCenters]);

  useEffect(() => {
    fetchDeliveryTypes();
  }, [fetchDeliveryTypes]);
  useEffect(() => { fetchPriceZones(); }, [fetchPriceZones]);

  // Create options for Select components
  const dcOptions = distributionCenters.map((dc) => ({
    value: dc.DCCode,
    label: `${dc.DCName} (${dc.DCCode})`
  }));

  const deliveryTypeOptions = (deliveryTypes || DELIVERY_TYPES_FALLBACK).map((type) => ({
    value: type.DeliveryTypeCode || type.code,
    label: type.DeliveryTypeName || type.name
  }));

  // Handle Select changes
  const handleFromDCChange = (selectedOption) => {
    setSelectedFromDC(selectedOption);
    setFromDCCode(selectedOption ? selectedOption.value : "");
  };

  const handleToDCChange = (selectedOption) => {
    setSelectedToDC(selectedOption);
    setToDCCode(selectedOption ? selectedOption.value : "");
  };

  const handleDeliveryTypeChange = (selectedOption) => {
    setSelectedDeliveryType(selectedOption);
    setDeliveryTypeCode(selectedOption ? selectedOption.value : "");
  };

  const MySwal = withReactContent(Swal);
  const showConfirmationAlert = () => {
    MySwal.fire({
      title: "Are you sure?",
      text: "This will remove the route pricing!",
      showCancelButton: true,
      confirmButtonColor: "#00ff00",
      confirmButtonText: "Yes, delete it!",
      cancelButtonColor: "#ff0000",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        notify.success("Route pricing removed.");
      }
    });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert form data to match API requirements
      const submitData = {
        ...formData,
        slaHours: formData.slaHours ? parseFloat(formData.slaHours) : null,
        rateAmount: parseFloat(formData.rateAmount),
        priceZoneID: formData.priceZoneID ? Number(formData.priceZoneID) : null,
        effectiveFrom: formData.effectiveFrom || null,
        effectiveTo: formData.effectiveTo || null
      };

      const response = await handleCreateShipmentRate(submitData);

      if (response.Error) {
        throw new Error(response.Message || 'Failed to create shipment rate');
      }

      setShowModal(false);
      setFormData({
        vendorCode: '', shipmentRateSize: '', priceType: 'FIXED', priceZoneID: '',
        fromDCCode: '',
        toDCCode: '',
        deliveryTypeCode: '',
        slaHours: '',
        rateAmount: '',
        effectiveFrom: '',
        effectiveTo: ''
      });
    } catch (error) {
      // Error is already handled in the hook
      console.error('Failed to create shipment rate:', error);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      vendorCode: '', shipmentRateSize: '', priceType: 'FIXED', priceZoneID: '',
      fromDCCode: '',
      toDCCode: '',
      deliveryTypeCode: '',
      slaHours: '',
      rateAmount: '',
      effectiveFrom: '',
      effectiveTo: ''
    });
  };

  const getTypeBadge = (type) => {
    const typeMap = {
      "DOOR": "success",
      "DC_AGENT": "primary",
      "CUSTOMER": "info",
      "VENDOR": "warning",
      "PICKUP": "secondary",
      "EXPRESS": "danger"
    };
    return typeMap[type] || "secondary";
  };

  const formatType = (type) => {
    return type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || "N/A";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Invalid Date";
    }
  };

  const columns = [
    {
      title: "Rate No",
      dataIndex: "ShipmentRateNO",
      sorter: (a, b) => (a.ShipmentRateNO || '').localeCompare(b.ShipmentRateNO || ''),
      render: (rateNo) => rateNo || "N/A",
    },
    {
      title: "Vendor",
      dataIndex: "VendorName",
      sorter: (a, b) => (a.VendorName || '').localeCompare(b.VendorName || ''),
      render: (name, record) => (
        <div>
          <div className="fw-bold">{name || "N/A"}</div>
          <small className="text-muted">{record.VendorCode || ""}</small>
        </div>
      ),
    },
    {
      title: "Package Size",
      dataIndex: "ShipmentRateSize",
      sorter: (a, b) => (a.ShipmentRateSize || '').localeCompare(b.ShipmentRateSize || ''),
      render: (name, record) => (
        <div>
          <div className="fw-bold">{name || "N/A"}</div>
          <small className="text-muted">{record.PriceZoneName || ""}</small>
        </div>
      ),
    },
    {
      title: "Delivery Type",
      dataIndex: "DeliveryTypeCode",
      render: (type) => (
        <Badge bg={getTypeBadge(type)}>
          {formatType(type)}
        </Badge>
      ),
    },
    {
      title: "Rate Amount",
      dataIndex: "RateAmount",
      render: (amount) => `KSh ${amount ? amount.toFixed(2) : '0.00'}`,
      sorter: (a, b) => (a.RateAmount || 0) - (b.RateAmount || 0),
    },
    {
      title: "Price Type",
      dataIndex: "PriceType",
      render: (type) => formatType(type),
    },
    {
      title: "Effective Period",
      dataIndex: "EffectiveFrom",
      render: (_, record) => (
        <div>
          <div><strong>From:</strong> {formatDate(record.EffectiveFrom)}</div>
          <div><strong>To:</strong> {formatDate(record.EffectiveTo)}</div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "StatusID",
      render: (statusId) => (
        <Badge bg={statusId === 1 ? "success" : "danger"}>
          {statusId === 1 ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => (
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip
              id={`tooltip-cta-${record.ShipmentRateID || record.ShipmentRateNO}`}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <Link className="mb-2 text-light" to={`/admin/pricing/${record.ShipmentRateID}`}>
                  View
                </Link>
                <Link className="mb-2 text-light" to={`/admin/pricing/edit/${record.ShipmentRateID}`}>
                  Edit
                </Link>
                <Link className="text-light" to="#" onClick={showConfirmationAlert}>
                  Delete
                </Link>
              </div>
            </Tooltip>
          }
          trigger={['click']}
          rootClose
        >
          <button className="btn btn-sm btn-light" type="button">
            ...
          </button>
        </OverlayTrigger>
      ),
    },
  ];

  const renderTooltip = (props) => (
    <Tooltip id="pdf-tooltip" {...props}>
      Pdf
    </Tooltip>
  );
  const renderExcelTooltip = (props) => (
    <Tooltip id="excel-tooltip" {...props}>
      Excel
    </Tooltip>
  );
  const renderRefreshTooltip = (props) => (
    <Tooltip id="refresh-tooltip" {...props}>
      Refresh
    </Tooltip>
  );
  const renderCollapseTooltip = (props) => (
    <Tooltip id="refresh-tooltip" {...props}>
      Collapse
    </Tooltip>
  );

  return (
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Route Pricing</h4>
              <h6>Manage delivery route pricing</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <li>
              <OverlayTrigger placement="top" overlay={renderTooltip}>
                <Link>
                  <ImageWithBasePath src="assets/img/icons/pdf.svg" alt="img" />
                </Link>
              </OverlayTrigger>
            </li>
            <li>
              <OverlayTrigger placement="top" overlay={renderExcelTooltip}>
                <Link data-bs-toggle="tooltip" data-bs-placement="top">
                  <ImageWithBasePath
                    src="assets/img/icons/excel.svg"
                    alt="img"
                  />
                </Link>
              </OverlayTrigger>
            </li>
            <li>
              <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
                <Link
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  onClick={(e) => {
                    e.preventDefault();
                    fetchShipmentRates({
                      fromDCCode: fromDCCode || undefined,
                      toDCCode: toDCCode || undefined,
                      deliveryTypeCode: deliveryTypeCode || undefined,
                    });
                  }}
                >
                  <RotateCcw />
                </Link>
              </OverlayTrigger>
            </li>
            <li>
              <OverlayTrigger placement="top" overlay={renderCollapseTooltip}>
                <Link
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  id="collapse-header"
                >
                  <ChevronUp />
                </Link>
              </OverlayTrigger>
            </li>
          </ul>
          <div className="page-btn d-flex align-items-center gap-2">
            <Link
              to="/admin/pricing/zones"
              className="btn btn-secondary d-flex align-items-center text-nowrap"
            >
              <PlusCircle className="me-2 iconsize" />
              Price Zones
            </Link>
            <Button
              variant="primary"
              className="btn btn-added"
              onClick={() => setShowModal(true)}
            >
              <PlusCircle className="me-2 iconsize" />
              Add Route Pricing
            </Button>
          </div>

        </div>

        <div className="card table-list-card">
          <div className="card-body">
            <div className="row mb-4 p-3">
              <div className="col-md-3">
                <label className="form-label fw-bold">From DC</label>
                <Select
                  options={dcOptions}
                  value={selectedFromDC}
                  onChange={handleFromDCChange}
                  placeholder="All From DCs"
                  isClearable
                  isSearchable
                  className="react-select"
                  classNamePrefix="select"
                  styles={{
                    control: (provided, state) => ({
                      ...provided,
                      minHeight: '38px',
                      borderColor: state.isFocused ? '#80bdff' : '#ced4da',
                      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 123, 255, 0.25)' : null,
                      '&:hover': {
                        borderColor: '#adb5bd'
                      }
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      color: 'black',
                      backgroundColor: state.isSelected ? '#e97b3a' : state.isFocused ? '#f8f9fa' : 'white',
                      ':active': {
                        backgroundColor: state.isSelected ? '#e97b3a' : '#f8f9fa',
                      },
                    }),
                    singleValue: (provided) => ({
                      ...provided,
                      color: 'black',
                    }),
                    placeholder: (provided) => ({
                      ...provided,
                      color: '#6c757d',
                    }),
                    input: (provided) => ({
                      ...provided,
                      color: 'black',
                    }),
                  }}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-bold">To DC</label>
                <Select
                  options={dcOptions}
                  value={selectedToDC}
                  onChange={handleToDCChange}
                  placeholder="All To DCs"
                  isClearable
                  isSearchable
                  className="react-select"
                  classNamePrefix="select"
                  styles={{
                    control: (provided, state) => ({
                      ...provided,
                      minHeight: '38px',
                      borderColor: state.isFocused ? '#80bdff' : '#ced4da',
                      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 123, 255, 0.25)' : null,
                      '&:hover': {
                        borderColor: '#adb5bd'
                      }
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      color: 'black',
                      backgroundColor: state.isSelected ? '#e97b3a' : state.isFocused ? '#f8f9fa' : 'white',
                      ':active': {
                        backgroundColor: state.isSelected ? '#e97b3a' : '#f8f9fa',
                      },
                    }),
                    singleValue: (provided) => ({
                      ...provided,
                      color: 'black',
                    }),
                    placeholder: (provided) => ({
                      ...provided,
                      color: '#6c757d',
                    }),
                    input: (provided) => ({
                      ...provided,
                      color: 'black',
                    }),
                  }}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-bold">Delivery Type</label>
                <Select
                  options={deliveryTypeOptions}
                  value={selectedDeliveryType}
                  onChange={handleDeliveryTypeChange}
                  placeholder="All Delivery Types"
                  isClearable
                  isSearchable
                  className="react-select"
                  classNamePrefix="select"
                  styles={{
                    control: (provided, state) => ({
                      ...provided,
                      minHeight: '38px',
                      borderColor: state.isFocused ? '#80bdff' : '#ced4da',
                      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 123, 255, 0.25)' : null,
                      '&:hover': {
                        borderColor: '#adb5bd'
                      }
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      color: 'black',
                      backgroundColor: state.isSelected ? '#e97b3a' : state.isFocused ? '#f8f9fa' : 'white',
                      ':active': {
                        backgroundColor: state.isSelected ? '#e97b3a' : '#f8f9fa',
                      },
                    }),
                    singleValue: (provided) => ({
                      ...provided,
                      color: 'black',
                    }),
                    placeholder: (provided) => ({
                      ...provided,
                      color: '#6c757d',
                    }),
                    input: (provided) => ({
                      ...provided,
                      color: 'black',
                    }),
                  }}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-bold">&nbsp;</label>
                <button
                  className="btn btn-sm btn-secondary w-100"
                  onClick={() => fetchShipmentRates({
                    fromDCCode: fromDCCode || undefined,
                    toDCCode: toDCCode || undefined,
                    deliveryTypeCode: deliveryTypeCode || undefined,
                  })}
                >
                  Apply Filters
                </button>
              </div>
            </div>
            {(() => {
              if (loading) {
                return (
                  <div className="text-center py-4">
                    <div className="spinner-border" role="status" aria-label="Loading">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                );
              }

              if (error) {
                return (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                );
              }

              return (
                <div className="table-responsive">
                  <Datatable
                    columns={columns}
                    dataSource={shipmentRates || []}
                    rowKey={(record) => record.ShipmentRateID}
                  />
                </div>
              );
            })()}
          </div>
        </div>

        {/* Add Route Pricing Modal */}
        <AddRoutePricingModal
          show={showModal}
          onHide={handleCloseModal}
          formData={formData}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          loading={loading}
          priceZones={priceZones}
        />
      </div>
  );
};

export default RoutePricingList;
