"use client"
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/navigation";
import SSRSelect from "@/components/SSRSelect";
import { useAdmin } from "@/hooks/useAdmin";
import { useShipment } from "@/hooks/useShipment";
import { RoleType } from "@/constants/user-roles";

const UpdateStatusModal = ({ show, onClose, onSubmit, onSuccess, order, userRole = 'admin' }) => {
  const router = useRouter();
  const { usersByRole, fetchUsersByRole, distributionCenters, fetchDistributionCenters, loading: ridersLoading } = useAdmin();
  const { handlePostRiderManifestTx } = useShipment();
  const [selectedTransition, setSelectedTransition] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedRider, setSelectedRider] = useState(null);
  const [selectedDC, setSelectedDC] = useState(null);

  const finishSuccessfulUpdate = async (orderNO) => {
    onClose();
    try {
      await onSuccess?.(orderNO);
    } catch (error) {
      console.error("Failed to filter the updated package:", error);
    }
  };

  // Helper function to generate manifest NO
  const generateManifestNO = (riderUserCode) => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month 01-12
    const day = now.getDate().toString().padStart(2, '0'); // Day 01-31
    const dateStr = `${year}${month}${day}`;
    return `MF-${riderUserCode}-${dateStr}`;
  };

  // Reset form when modal opens/closes or order changes
  useEffect(() => {
    if (show && order) {
      setSelectedTransition(null);
      setNotes("");
      setSelectedRider(null);
      setSelectedDC(null);
    }
  }, [show, order]);

  // Fetch riders when status 301 (Assigned to Rider) or 102 (Order Picked By Courier) is selected
  useEffect(() => {
    if (selectedTransition?.value === 102 || selectedTransition?.value === 301) {
      fetchUsersByRole({
        RoleTypeCode: RoleType.RIDER,
        PageNO: 1,
        PageSize: 100, // Get more riders for selection
      });
    }
  }, [selectedTransition, fetchUsersByRole]);

  // Fetch distribution centers when status 202 is selected
  useEffect(() => {
    if (selectedTransition?.value === 202) {
      fetchDistributionCenters({ pageNo: 1, pageSize: 100 });
    }
  }, [selectedTransition, fetchDistributionCenters]);
  
  const statusOptions = order?.StatusTransitionArray?.map(transition => ({
    value: transition.toOrderStatusID,
    label: transition.actionName,
    transition: transition
  })) || [];

  // Rider options for assignment
  const riderOptions = usersByRole?.map(rider => ({
    value: rider.UserCode,
    label: `${rider.FirstName} ${rider.LastName} (${rider.UserCode})`,
    rider: rider
  })) || [];

  // Distribution center options for reassignment
  const dcOptions = distributionCenters?.map(dc => ({
    value: dc.DCCode,
    label: `${dc.DCName} (${dc.DCCode})`,
    dc: dc
  })) || [];

  // Check if COD payment is required for DELIVERED_TO_CUSTOMER status
  const requiresCODPayment = (selectedTransition?.value === 801 && order?.CashOnDeliveryRequired === true);

  const handleSelectChange = (selectedOption) => {
    setSelectedTransition(selectedOption);
    // Reset rider selection if status changes away from 401
    if (selectedOption?.value !== 401) {
      setSelectedRider(null);
    }
    // Reset DC selection if status changes away from 202
    if (selectedOption?.value !== 202) {
      setSelectedDC(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTransition || !order) return;

    // If status is 401 (Assigned to Rider), rider selection is required
    if (selectedTransition.value === 401 && !selectedRider) {
      alert("Please select a rider to assign this order to.");
      return;
    }

    // If status is 202, distribution center selection is required
    if (selectedTransition.value === 202 && !selectedDC) {
      alert("Please select a distribution center for this status update.");
      return;
    }

    setSubmitting(true);
    try {
      // If assigning to rider (status 301) or 102 Order Picked By Courier, create rider manifest transaction
      // This handles both the manifest creation and status update in the backend
      if ((selectedTransition.value === 301 || selectedTransition.value === 102) && selectedRider) {
        const manifestPayload = {
          dcCode: order.OriginDCCode,
          riderUserCode: selectedRider.rider.UserCode,
          plannedDepartAt: new Date().toISOString(),
          notes: "",
          manifestNO: generateManifestNO(selectedRider.rider.UserCode),
          orderArray: [
            {
              orderNO: order.OrderNO,
              stopNo: 0
            }
          ]
        };

        const manifestResponse = await handlePostRiderManifestTx(manifestPayload);
        if (manifestResponse?.Error) {
          throw new Error(
            manifestResponse.Message || "Failed to update shipment status"
          );
        }
        await finishSuccessfulUpdate(order.OrderNO);
        return; 
      }

      // For all other status updates, proceed with normal flow
      const payload = {
        statusID: selectedTransition.value,
        orderNO: order.OrderNO,
        notes: notes,
        dcCode: selectedTransition.value === 202 && selectedDC
          ? selectedDC.value
          : (order.OriginDCCode || order.DestinationDCCode),
      };

      await onSubmit(payload);
      await finishSuccessfulUpdate(payload.orderNO);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProceedToCODPayment = () => {
    onClose(); // Close the modal
    
    // Route based on user role
    const codPaymentRoute = userRole === 'rider' 
      ? `/rider/rd-cod-payment?orderNO=${order.OrderNO}`
      : `/admin/cod-payment?orderNO=${order.OrderNO}`;
      
    router.push(codPaymentRoute);
  };

  if (!show || !order) return null;

  return (
    <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,0.3)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ background: "#ffe5d0", borderRadius: 12 }}>
          <div className="modal-header">
            <h5 className="modal-title">Update Package Status</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <strong>Order NO:</strong> {order.OrderNO}
            </div>
            <div className="mb-3">
              <strong>Current Status:</strong>{" "}
              <span className="badge bg-primary">{order.StatusName}</span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Select New Status *</label>
                <SSRSelect
                  name="newStatus"
                  value={selectedTransition}
                  onChange={handleSelectChange}
                  options={statusOptions}
                  placeholder="Choose next status..."
                  isSearchable={true}
                  isClearable={false}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  instanceId="status-select"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Notes (Optional)</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Add any notes about this status update..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              {(selectedTransition?.value === 301 || selectedTransition?.value === 102) && (
                <div className="mb-3">
                  <label className="form-label">Assign to Rider *</label>
                  <SSRSelect
                    name="assignedRider"
                    value={selectedRider}
                    onChange={setSelectedRider}
                    options={riderOptions}
                    placeholder={ridersLoading ? "Loading riders..." : "Select a rider..."}
                    isSearchable={true}
                    isClearable={false}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    instanceId="rider-select"
                    isLoading={ridersLoading}
                    required
                  />
                  {riderOptions.length === 0 && !ridersLoading && (
                    <small className="text-muted">No riders available</small>
                  )}
                </div>
              )}
              {selectedTransition?.value === 202 && (
                <div className="mb-3">
                  <label className="form-label">Select Distribution Center *</label>
                  <SSRSelect
                    name="assignedDC"
                    value={selectedDC}
                    onChange={setSelectedDC}
                    options={dcOptions}
                    placeholder={ridersLoading ? "Loading distribution centers..." : "Select a distribution center..."}
                    isSearchable={true}
                    isClearable={false}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    instanceId="dc-select"
                    isLoading={ridersLoading}
                    required
                  />
                  {dcOptions.length === 0 && !ridersLoading && (
                    <small className="text-muted">No distribution centers available</small>
                  )}
                </div>
              )}
              {selectedTransition && (
                <div className="mb-3">
                  <div className="alert alert-info">
                    <strong>Action:</strong> {selectedTransition.transition.actionName}
                    {selectedTransition.transition.requiresDeliveryFlow && (
                      <div><small>• Requires delivery flow</small></div>
                    )}
                    {selectedTransition.transition.requiresPickupFlow && (
                      <div><small>• Requires pickup flow</small></div>
                    )}
                    {selectedTransition.transition.requiresCOD && (
                      <div><small>• Requires COD</small></div>
                    )}
                    {selectedTransition.transition.requiresPOD && (
                      <div><small>• Requires POD</small></div>
                    )}
                  </div>
                </div>
              )}
              {requiresCODPayment && (
                <div className="mb-3">
                  <div className="alert alert-warning">
                    <strong>COD Payment Required</strong>
                    <div>This order requires Cash on Delivery payment of <strong>₦{order.CODAmount?.toLocaleString()}</strong> before marking as delivered.</div>
                    <div><small>Click "Proceed to Pay COD" to complete the payment process.</small></div>
                  </div>
                </div>
              )}
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-light" onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
                {requiresCODPayment ? (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleProceedToCODPayment}
                    style={{ background: "#28a745", border: "none" }}
                  >
                    Proceed to Pay COD
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ background: "#e97b3a", border: "none" }}
                    disabled={submitting || !selectedTransition || (selectedTransition.value === 401 && !selectedRider) || (selectedTransition.value === 202 && !selectedDC)}
                  >
                    {submitting ? 'Updating...' : 'Update Status'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateStatusModal;

UpdateStatusModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  order: PropTypes.shape({
    OrderNO: PropTypes.string,
    StatusName: PropTypes.string,
    OriginDCCode: PropTypes.string,
    DestinationDCCode: PropTypes.string,
    CashOnDeliveryRequired: PropTypes.bool,
    CODAmount: PropTypes.number,
    StatusTransitionArray: PropTypes.arrayOf(
      PropTypes.shape({
        toOrderStatusID: PropTypes.number,
        actionName: PropTypes.string,
        requiresDeliveryFlow: PropTypes.bool,
        requiresPickupFlow: PropTypes.bool,
        requiresCOD: PropTypes.bool,
        requiresPOD: PropTypes.bool,
      })
    ),
  }),
  userRole: PropTypes.string,
};
