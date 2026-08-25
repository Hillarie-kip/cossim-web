"use client"
import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import SSRSelect from "@/components/SSRSelect";
import { useAdmin } from "@/hooks/useAdmin";
import { useShipment } from "@/hooks/useShipment";
import DatePicker, { registerLocale, setDefaultLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { enUS } from 'date-fns/locale/en-US';
import { RoleType } from "@/constants/user-roles";
import { useAuth } from "@/contexts/AuthContext";
import { filterDistributionCentersToAssigned } from "@/services/dcService";

// Register English locale (you can change this to your preferred locale)
registerLocale('en-US', enUS);

// Set default locale for all date pickers
setDefaultLocale('en-US');

const PostManifestModal = ({ show, onHide, onSuccess, riderUserCode, manifestNO, isUpdate = false, dcCode }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    dcCode: dcCode || "",
    riderUserCode: riderUserCode || "",
    plannedDepartAt: "",
    notes: "",
    orderArray: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [newOrder, setNewOrder] = useState({
    orderNO: "",
    stopNo: 0
  });

  // Local state for date picker
  const [plannedDepartureDate, setPlannedDepartureDate] = useState(null);

  // Use admin hook to fetch distribution centers and riders
  const { 
    distributionCenters, 
    fetchDistributionCenters, 
    usersByRole,
    fetchUsersByRole,
    loading: dcLoading 
  } = useAdmin();
  const { shipmentOrders, fetchShipmentOrders, loading: ordersLoading } = useShipment();

  useEffect(() => {
    if (show) {
      fetchDistributionCenters();
      fetchUsersByRole({ RoleTypeCode: RoleType.RIDER });
      if (riderUserCode || dcCode) {
        const params = {};
        if (dcCode) {
          params.fromDCCode = dcCode;
        }
        fetchShipmentOrders(params);
      }
    }
  }, [show, fetchDistributionCenters, fetchUsersByRole, riderUserCode, fetchShipmentOrders, dcCode]);

  // Update riderUserCode when prop changes
  useEffect(() => {
    if (riderUserCode) {
      setForm(prev => ({ ...prev, riderUserCode }));
    }
  }, [riderUserCode]);

  // Update dcCode when prop changes
  useEffect(() => {
    if (dcCode) {
      setForm(prev => ({ ...prev, dcCode }));
    }
  }, [dcCode]);

  // Sync date picker state with form data
  useEffect(() => {
    if (form.plannedDepartAt) {
      setPlannedDepartureDate(new Date(form.plannedDepartAt + (form.plannedDepartAt.includes('T') ? '' : 'T00:00')));
    } else {
      setPlannedDepartureDate(null);
    }
  }, [form.plannedDepartAt]);

  // Reset date picker when modal is hidden
  useEffect(() => {
    if (!show) {
      setPlannedDepartureDate(null);
    }
  }, [show]);

  // Prepare options for the select dropdowns
  const dcOptions = filterDistributionCentersToAssigned(user, distributionCenters).map(dc => ({
    value: dc.DCCode,
    label: `${dc.DCCode} - ${dc.DCName} (${dc.CityName})`
  }));

  const riderOptions = (usersByRole || []).map(rider => ({
    value: rider.UserCode,
    label: `${rider.UserCode} - ${rider.FirstName} ${rider.LastName || ''}`.trim()
  }));

  const orderOptions = (shipmentOrders || []).map(order => ({
    value: order.OrderNO || order.orderNO,
    label: `${order.OrderNO || order.orderNO} - ${order.VendorName || 'Customer'} (${order.CustomerName || 'N/A'})`
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (selectedOption, actionMeta) => {
    if (actionMeta.name === 'dcCode') {
      setForm((prev) => ({ ...prev, dcCode: selectedOption?.value || "" }));
    } else if (actionMeta.name === 'riderUserCode') {
      setForm((prev) => ({ ...prev, riderUserCode: selectedOption?.value || "" }));
    }
  };

  const handleNewOrderChange = (e) => {
    const { name, value } = e.target;
    setNewOrder((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewOrderSelect = (selectedOption) => {
    setNewOrder((prev) => ({ ...prev, orderNO: selectedOption?.value || "" }));
  };

  const addOrder = () => {
    if (!newOrder.orderNO.trim()) {
      alert('Please select an order');
      return;
    }

    // Check if order already exists
    if (form.orderArray.some(order => order.orderNO === newOrder.orderNO)) {
      alert('Order already added to manifest');
      return;
    }

    setForm((prev) => ({
      ...prev,
      orderArray: [...prev.orderArray, { ...newOrder }]
    }));

    // Reset new order form
    setNewOrder({ orderNO: "", stopNo: 0 });
  };

  const removeOrder = (index) => {
    setForm((prev) => ({
      ...prev,
      orderArray: prev.orderArray.filter((_, i) => i !== index)
    }));
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

  // Handle date picker changes
  const handlePlannedDepartureChange = (date) => {
    setPlannedDepartureDate(date);
    const formattedDate = formatLocalDateTime(date);
    setForm((prev) => ({ ...prev, plannedDepartAt: formattedDate }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.dcCode) {
      alert('Please select a distribution center');
      return;
    }

    if (!form.riderUserCode) {
      alert('Rider user code is required');
      return;
    }

    if (form.orderArray.length === 0) {
      alert('Please add at least one order to the manifest');
      return;
    }

    if (!form.plannedDepartAt) {
      alert('Please set a planned departure time');
      return;
    }

    setSubmitting(true);

    try {
      // Format the payload according to the API requirements
      const payload = {
        dcCode: form.dcCode,
        riderUserCode: form.riderUserCode,
        plannedDepartAt: new Date(form.plannedDepartAt).toISOString(),
        notes: form.notes,
        manifestNO: manifestNO || "",
        orderArray: form.orderArray
      };

      await onSuccess(payload);

      // Reset form on success
      setForm({
        dcCode: "",
        riderUserCode: riderUserCode || "",
        plannedDepartAt: "",
        notes: "",
        orderArray: []
      });
      setPlannedDepartureDate(null);
    } catch (error) {
      console.error('Error posting manifest:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,0.3)" }}>
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content" style={{ background: "#ffe5d0", borderRadius: 12 }}>
          <div className="modal-header">
            <h5 className="modal-title">{isUpdate ? 'Update Rider Manifest' : 'Create Rider Manifest'}</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            <p style={{ color: "#a85b2a" }}>{isUpdate ? 'Update the manifest details and orders for rider deliveries.' : 'Create a new manifest for rider deliveries with orders and route information.'}</p>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Left Column - Form Fields */}
                <div className="col-lg-8">
                  {/* Basic Information */}
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Distribution Center *</label>
                      <SSRSelect
                        name="dcCode"
                        value={dcOptions.find(option => option.value === form.dcCode) || null}
                        onChange={handleSelectChange}
                        options={dcOptions}
                        placeholder="Select Distribution Center..."
                        isLoading={dcLoading}
                        isSearchable={true}
                        isClearable={true}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        instanceId="dcCode-select"
                        isDisabled={!!dcCode}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Rider *</label>
                      <SSRSelect
                        name="riderUserCode"
                        value={riderOptions.find(option => option.value === form.riderUserCode) || null}
                        onChange={handleSelectChange}
                        options={riderOptions}
                        placeholder="Select a rider..."
                        isLoading={dcLoading}
                        isSearchable={true}
                        isClearable={true}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        instanceId="riderUserCode-select"
                        isDisabled={!!riderUserCode}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Planned Departure Time *</label>
                      <DatePicker
                        selected={plannedDepartureDate}
                        onChange={handlePlannedDepartureChange}
                        showTimeSelect
                        timeFormat="h:mm aa"
                        timeIntervals={5}
                        timeCaption="Time"
                        dateFormat="yyyy-MM-dd h:mm aa"
                        placeholderText="Select planned departure date and time"
                        className="form-control"
                        wrapperClassName="w-100"
                        locale="en-US"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        minDate={new Date()}
                        isClearable
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Notes</label>
                      <input
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Optional notes for the manifest"
                      />
                    </div>
                  </div>

                  {/* Add Order Form */}
                  <div className="border rounded p-3 bg-light mb-3">
                    <h6 className="mb-3">Add Orders to Manifest</h6>
                    <p className="text-muted small mb-3">Search and select orders to include in this rider's delivery manifest.</p>

                    <div className="row g-3">
                      <div className="col-md-7">
                        <label className="form-label">Select Order</label>
                        <SSRSelect
                          value={orderOptions.find(option => option.value === newOrder.orderNO) || null}
                          onChange={handleNewOrderSelect}
                          options={orderOptions}
                          placeholder="Search and select order..."
                          isLoading={ordersLoading}
                          isSearchable={true}
                          isClearable={true}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          instanceId="order-select"
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Stop Number</label>
                        <input
                          name="stopNo"
                          type="number"
                          value={newOrder.stopNo}
                          onChange={handleNewOrderChange}
                          className="form-control"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      <div className="col-md-2 d-flex align-items-end">
                        <button
                          type="button"
                          className="btn btn-success w-100"
                          onClick={addOrder}
                          disabled={!newOrder.orderNO.trim()}
                        >
                          <i className="fa fa-plus me-1"></i> Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Selected Orders */}
                <div className="col-lg-4">
                  <div className="border rounded p-3 bg-white" style={{ minHeight: "400px" }}>
                    <h6 className="mb-3">
                      <i className="fa fa-shopping-cart me-2"></i>
                      Selected Orders ({form.orderArray.length})
                    </h6>

                    {form.orderArray.length > 0 ? (
                      <div className="orders-list" style={{ maxHeight: "320px", overflowY: "auto" }}>
                        {form.orderArray.map((order, index) => (
                          <div key={index} className="d-flex justify-content-between align-items-center p-2 rounded mb-2 border">
                            <div className="flex-grow-1">
                              <div className="fw-bold text-truncate" title={order.orderNO}>
                                {order.orderNO}
                              </div>
                              <small className="text-muted">Stop: {order.stopNo}</small>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger ms-2"
                              onClick={() => removeOrder(index)}
                              title="Remove order"
                            >
                              <i className="fa fa-trash"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted py-5">
                        <i className="fa fa-shopping-cart fa-3x mb-3 opacity-50"></i>
                        <p className="mb-0">No orders selected</p>
                        <small>Add orders from the left panel</small>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-light" onClick={onHide} disabled={submitting}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: "#e97b3a", border: "none" }}
                  disabled={submitting || form.orderArray.length === 0}
                >
                  <span className="me-2"><i className="fa fa-truck" /></span>
                  {submitting ? (isUpdate ? 'Updating Manifest...' : 'Creating Manifest...') : (isUpdate ? 'Update Manifest' : 'Create Manifest')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

PostManifestModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  riderUserCode: PropTypes.string,
  manifestNO: PropTypes.string,
  isUpdate: PropTypes.bool,
  dcCode: PropTypes.string
};

export default PostManifestModal;
