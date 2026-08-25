"use client"
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import SSRSelect from "@/components/SSRSelect";
import { useAdmin } from "@/hooks/useAdmin";
import { useShipment } from "@/hooks/useShipment";
import { RoleType } from "@/constants/user-roles";
import { useAuth } from "@/contexts/AuthContext";
import { filterDistributionCentersToAssigned } from "@/services/dcService";

const generateManifestNO = (riderUserCode) => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  return `MF-${riderUserCode}-${dateStr}`;
};

const BulkUpdateStatusModal = ({ show, onClose, onSubmit, orders = [] }) => {
  const { user } = useAuth();
  const { usersByRole, fetchUsersByRole, distributionCenters, fetchDistributionCenters, loading: ridersLoading } = useAdmin();
  const { handlePostRiderManifestTx } = useShipment();
  const [selectedTransition, setSelectedTransition] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedRider, setSelectedRider] = useState(null);
  const [selectedDC, setSelectedDC] = useState(null);

  // Reset form whenever the modal opens with a new selection
  useEffect(() => {
    if (show) {
      setSelectedTransition(null);
      setNotes("");
      setSelectedRider(null);
      setSelectedDC(null);
    }
  }, [show]);

  // Fetch riders when status 301 (Assigned to Rider) or 102 (Order Picked By Courier) is selected
  useEffect(() => {
    if (selectedTransition?.value === 102 || selectedTransition?.value === 301) {
      fetchUsersByRole({
        RoleTypeCode: RoleType.RIDER,
        PageNO: 1,
        PageSize: 100,
      });
    }
  }, [selectedTransition, fetchUsersByRole]);

  // Fetch distribution centers when status 202 is selected
  useEffect(() => {
    if (selectedTransition?.value === 202) {
      fetchDistributionCenters({ pageNo: 1, pageSize: 100 });
    }
  }, [selectedTransition, fetchDistributionCenters]);

  // A bulk action is safe only when the target is a valid next transition for
  // every selected order. This prevents moving an order backwards in its lifecycle.
  const statusOptions = useMemo(() => {
    if (orders.length === 0) return [];
    const transitionLists = orders.map((order) => order.StatusTransitionArray || []);
    if (transitionLists.some((transitions) => transitions.length === 0)) return [];

    const commonIds = transitionLists.slice(1).reduce(
      (ids, transitions) => {
        const available = new Set(transitions.map((transition) => String(transition.toOrderStatusID)));
        return new Set([...ids].filter((id) => available.has(id)));
      },
      new Set(transitionLists[0].map((transition) => String(transition.toOrderStatusID)))
    );

    return transitionLists[0]
      .filter((transition) => commonIds.has(String(transition.toOrderStatusID)))
      .map((transition) => ({
        value: transition.toOrderStatusID,
        label: transition.actionName,
        transition,
      }));
  }, [orders]);

  // Orders that require COD payment before they can move to the COD/PAYMENT_INITIATED status (801)
  const codOrders = useMemo(
    () => orders.filter((order) => order?.CashOnDeliveryRequired === true),
    [orders]
  );
  const requiresCODPayment = selectedTransition?.value === 801 && codOrders.length > 0;

  const riderOptions = usersByRole?.map(rider => ({
    value: rider.UserCode,
    label: `${rider.FirstName} ${rider.LastName} (${rider.UserCode})`,
    rider,
  })) || [];

  const dcOptions = filterDistributionCentersToAssigned(user, distributionCenters).map(dc => ({
    value: dc.DCCode,
    label: `${dc.DCName} (${dc.DCCode})`,
    dc,
  })) || [];

  const handleSelectChange = (selectedOption) => {
    setSelectedTransition(selectedOption);
    if (selectedOption?.value !== 301 && selectedOption?.value !== 102) {
      setSelectedRider(null);
    }
    if (selectedOption?.value !== 202) {
      setSelectedDC(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTransition || orders.length === 0) return;

    if ((selectedTransition.value === 301 || selectedTransition.value === 102) && !selectedRider) {
      alert("Please select a rider to assign these packages to.");
      return;
    }

    if (selectedTransition.value === 202 && !selectedDC) {
      alert("Please select a distribution center for this status update.");
      return;
    }

    if (selectedTransition.value === 801 && codOrders.length > 0) {
      alert("Some selected packages require COD payment before this status can be applied. Update those individually first.");
      return;
    }

    setSubmitting(true);
    try {
      // Assigning to rider / courier creates a single manifest covering all selected orders
      if ((selectedTransition.value === 301 || selectedTransition.value === 102) && selectedRider) {
        const manifestPayload = {
          dcCode: orders[0].OriginDCCode,
          riderUserCode: selectedRider.rider.UserCode,
          plannedDepartAt: new Date().toISOString(),
          notes: notes,
          manifestNO: generateManifestNO(selectedRider.rider.UserCode),
          orderArray: orders.map((order, index) => ({
            orderNO: order.OrderNO,
            stopNo: index,
          })),
        };

        await handlePostRiderManifestTx(manifestPayload);
        onClose();
        return;
      }

      // For all other status updates, submit a single batch request
      const batchOrders = orders.map((order) => ({
        statusID: selectedTransition.value,
        orderNO: order.OrderNO,
        notes,
        dcCode: selectedTransition.value === 202 && selectedDC
          ? selectedDC.value
          : (order.OriginDCCode || order.DestinationDCCode),
      }));

      await onSubmit(batchOrders);
      onClose();
    } catch (error) {
      console.error('Error updating bulk status:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,0.3)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ background: "#ffe5d0", borderRadius: 12 }}>
          <div className="modal-header">
            <h5 className="modal-title">Update Status for {orders.length} Package{orders.length === 1 ? "" : "s"}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <strong>Selected Orders:</strong>{" "}
              <span className="text-muted">
                {orders.slice(0, 5).map(o => o.OrderNO).join(", ")}
                {orders.length > 5 ? ` +${orders.length - 5} more` : ""}
              </span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Select New Status *</label>
                <SSRSelect
                  name="newStatus"
                  value={selectedTransition}
                  onChange={handleSelectChange}
                  options={statusOptions}
                  placeholder={statusOptions.length === 0 ? "No common next status" : "Choose next status..."}
                  isSearchable={true}
                  isClearable={false}
                  isDisabled={statusOptions.length === 0}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  instanceId="bulk-status-select"
                  required
                />
                {statusOptions.length === 0 && (
                  <small className="text-danger">
                    The selected orders do not share a valid next status. Select orders at the same lifecycle stage and try again.
                  </small>
                )}
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
                    instanceId="bulk-rider-select"
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
                    instanceId="bulk-dc-select"
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
                    <div>
                      {codOrders.length} of the selected packages require Cash on Delivery payment before they can move to this status:{" "}
                      <strong>{codOrders.map(o => o.OrderNO).join(", ")}</strong>.
                    </div>
                    <div><small>Remove them from the selection, or update them individually to collect COD payment first.</small></div>
                  </div>
                </div>
              )}
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-light" onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: "#e97b3a", border: "none" }}
                  disabled={
                    submitting ||
                    !selectedTransition ||
                    statusOptions.length === 0 ||
                    ((selectedTransition.value === 301 || selectedTransition.value === 102) && !selectedRider) ||
                    (selectedTransition.value === 202 && !selectedDC) ||
                    requiresCODPayment
                  }
                >
                  {submitting ? 'Updating...' : `Update ${orders.length} Package${orders.length === 1 ? "" : "s"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUpdateStatusModal;

BulkUpdateStatusModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  orders: PropTypes.arrayOf(
    PropTypes.shape({
      OrderNO: PropTypes.string,
      OriginDCCode: PropTypes.string,
      DestinationDCCode: PropTypes.string,
      CashOnDeliveryRequired: PropTypes.bool,
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
    })
  ),
};
