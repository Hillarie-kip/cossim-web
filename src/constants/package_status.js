// Package Status Constants
// Generated from package_status.json

export const PACKAGE_STATUSES = {
  VENDOR_CREATED: {
    orderStatusID: 101,
    statusName: "Order Created",
    phaseCode: "VENDOR",
    isTerminal: false,
    isFailure: false,
    sortOrder: 101,
    description: "Vendor generated package / order."
  },
  READY_FOR_PICKUP_FROM_VENDOR: {
    orderStatusID: 102,
    statusName: "Order Picked by Courier",
    phaseCode: "VENDOR",
    isTerminal: false,
    isFailure: false,
    sortOrder: 102,
    description: "Can be picked by DC rider/agent or third party."
  },
  HANDED_TO_DC_CARRIER: {
    orderStatusID: 103,
    statusName: "Order Received at Sorting Center",
    phaseCode: "INBOUND",
    isTerminal: false,
    isFailure: false,
    sortOrder: 103,
    description: "Order has been scanned and received at the sorting center."
  },
  INBOUND_TO_DC: {
    orderStatusID: 202,
    statusName: "In Transit to DC",
    phaseCode: "INBOUND",
    isTerminal: false,
    isFailure: false,
    sortOrder: 201,
    description: "In transit to destination DC."
  },
  ARRIVED_AT_DC: {
    orderStatusID: 201,
    statusName: "Received at DC",
    phaseCode: "DC",
    isTerminal: false,
    isFailure: false,
    sortOrder: 202,
    description: "Physically received at DC, pending QC."
  },
  HOLD_FOR_DC_DC_DISPATCH: {
    orderStatusID: 202,
    statusName: "In Transit to DC",
    phaseCode: "DC",
    isTerminal: false,
    isFailure: false,
    sortOrder: 206,
    description: "Queued at DC awaiting transfer batch"
  },
  BATCHED_FOR_DC_DC_TRANSFER: {
    orderStatusID: 207,
    statusName: "Batched for DC?DC Transfer",
    phaseCode: "DC",
    isTerminal: false,
    isFailure: false,
    sortOrder: 207,
    description: "Assigned to a transfer batch"
  },
  TRANSFER_DISPATCHED: {
    orderStatusID: 208,
    statusName: "Transfer Dispatched",
    phaseCode: "INBOUND",
    isTerminal: false,
    isFailure: false,
    sortOrder: 208,
    description: "Batch left origin DC"
  },
  TRANSFER_INBOUND_TO_DC: {
    orderStatusID: 209,
    statusName: "Transfer Inbound to DC",
    phaseCode: "INBOUND",
    isTerminal: false,
    isFailure: false,
    sortOrder: 209,
    description: "Batch in transit to destination DC"
  },
  DC_QC_IN_PROGRESS: {
    orderStatusID: 301,
    statusName: "Assigned to Rider",
    phaseCode: "DC",
    isTerminal: false,
    isFailure: false,
    sortOrder: 301,
    description: "Verifying package condition and contents."
  },
  DC_QC_PASSED: {
    orderStatusID: 302,
    statusName: "Out for Delivery",
    phaseCode: "DC",
    isTerminal: false,
    isFailure: false,
    sortOrder: 302,
    description: "Good condition; move to stock or assignment."
  },
  DC_QC_FAILED: {
    orderStatusID: 303,
    statusName: "Delivered",
    phaseCode: "DC",
    isTerminal: false,
    isFailure: false,
    sortOrder: 303,
    description: "Damage/short; triggers return or rework."
  },
  RECEIVED_INTO_DC_STOCK: {
    orderStatusID: 304,
    statusName: "1st Attempt",
    phaseCode: "DC",
    isTerminal: false,
    isFailure: false,
    sortOrder: 304,
    description: "Added to DC inventory."
  },
  TRACKING_NUMBER_ASSIGNED: {
    orderStatusID: 305,
    statusName: "2nd Attempt",
    phaseCode: "DC",
    isTerminal: false,
    isFailure: false,
    sortOrder: 305,
    description: "Internal/external tracking set."
  },
  ASSIGNED_TO_DELIVERY: {
    orderStatusID: 301,
    statusName: "Assigned to Rider",
    phaseCode: "ASSIGN",
    isTerminal: false,
    isFailure: false,
    sortOrder: 401,
    description: "Door-delivery flow."
  },
  REVERSE_RECEIVED_AT_SORTING: {
    orderStatusID: 402,
    statusName: "Reverse Received at Sorting Center",
    phaseCode: "RETURN",
    isTerminal: false,
    isFailure: false,
    sortOrder: 402,
    description: "Returned order has been received at sorting and awaits handover to the vendor."
  },
  REVERSE_AWAITING_VENDOR_ACCEPTANCE: {
    orderStatusID: 403,
    statusName: "Reverse Received at Vendor Waiting",
    phaseCode: "RETURN",
    isTerminal: false,
    isFailure: false,
    sortOrder: 403,
    description: "Returned order has been handed to the vendor and awaits acceptance."
  },
  BATCHED_FOR_DELIVERY: {
    orderStatusID: 410,
    statusName: "Batched for Delivery",
    phaseCode: "ASSIGN",
    isTerminal: false,
    isFailure: false,
    sortOrder: 410,
    description: "In rider manifest, waiting handover"
  },
  OUT_FOR_DELIVERY: {
    orderStatusID: 302,
    statusName: "Out for Delivery",
    phaseCode: "DELIVERY",
    isTerminal: false,
    isFailure: false,
    sortOrder: 501,
    description: "With rider/vehicle."
  },
  DELIVERY_ATTEMPTED: {
    orderStatusID: 304,
    statusName: "1st Attempt",
    phaseCode: "DELIVERY",
    isTerminal: false,
    isFailure: false,
    sortOrder: 502,
    description: "Customer unreachable/refused/address issue."
  },
  DELIVERED_TO_CUSTOMER: {
    orderStatusID: 303,
    statusName: "Delivered",
    phaseCode: "DELIVERY",
    isTerminal: false,
    isFailure: false,
    sortOrder: 503,
    description: "POD captured; start payment settlement if COD."
  },
  DELIVERY_WAITLIST: {
    orderStatusID: 504,
    statusName: "Delivery Waitlist",
    phaseCode: "DELIVERY",
    isTerminal: false,
    isFailure: false,
    sortOrder: 504,
    description: "On hold waiting for customer/time window."
  },
  READY_FOR_PICKUP: {
    orderStatusID: 601,
    statusName: "Ready for Pickup",
    phaseCode: "PICKUP",
    isTerminal: false,
    isFailure: false,
    sortOrder: 601,
    description: "Customer can collect at DC."
  },
  PENDING_CUSTOMER_PICKUP: {
    orderStatusID: 602,
    statusName: "Pending Customer Pickup",
    phaseCode: "PICKUP",
    isTerminal: false,
    isFailure: false,
    sortOrder: 602,
    description: "Waiting for customer to show up."
  },
  PICKED_UP_BY_CUSTOMER: {
    orderStatusID: 303,
    statusName: "Delivered",
    phaseCode: "PICKUP",
    isTerminal: false,
    isFailure: false,
    sortOrder: 603,
    description: "Collected; close or settle payment."
  },
  RETURN_REQUESTED_BY_CUSTOMER: {
    orderStatusID: 400,
    statusName: "Reversed Orders",
    phaseCode: "RETURN",
    isTerminal: false,
    isFailure: false,
    sortOrder: 701,
    description: "Order reversal initiated by the DC."
  },
  RETURN_IN_TRANSIT: {
    orderStatusID: 401,
    statusName: "Reverse In Transit",
    phaseCode: "RETURN",
    isTerminal: false,
    isFailure: false,
    sortOrder: 702,
    description: "Returned order is in transit back to the sorting center."
  },
  RETURNED_TO_VENDOR: {
    orderStatusID: 901,
    statusName: "Returned to Vendor",
    phaseCode: "RETURN",
    isTerminal: true,
    isFailure: false,
    sortOrder: 703,
    description: "Vendor accepted the return and the return lifecycle is complete."
  },
  RETURN_CLOSED: {
    orderStatusID: 704,
    statusName: "Return Closed",
    phaseCode: "RETURN",
    isTerminal: true,
    isFailure: false,
    sortOrder: 704,
    description: "Return reconciled (stock/payment adjusted)."
  },
  PAYMENT_INITIATED: {
    orderStatusID: 801,
    statusName: "Delivered",
    phaseCode: "PAYMENT",
    isTerminal: false,
    isFailure: false,
    sortOrder: 801,
    description: "DC or rider initiated payment process."
  },
  COD_COLLECTED: {
    orderStatusID: 802,
    statusName: "Order Completed",
    phaseCode: "PAYMENT",
    isTerminal: true,
    isFailure: false,
    sortOrder: 802,
    description: "Cash received by rider/DC."
  },
  COD_REMITTED_TO_VENDOR: {
    orderStatusID: 803,
    statusName: "Payment Failed",
    phaseCode: "PAYMENT",
    isTerminal: false,
    isFailure: false,
    sortOrder: 803,
    description: "Cash transferred to vendor."
  },
  PAYMENT_CONFIRMED: {
    orderStatusID: 804,
    statusName: "Payment Waived",
    phaseCode: "PAYMENT",
    isTerminal: false,
    isFailure: false,
    sortOrder: 804,
    description: "Funds settled; ready to close."
  },
  PAYMENT_FAILED: {
    orderStatusID: 805,
    statusName: "Payment Failed",
    phaseCode: "PAYMENT",
    isTerminal: false,
    isFailure: true,
    sortOrder: 805,
    description: "Reversal/timeout/chargeback."
  },
  SERVICE_FEE_REQUIRED: {
    orderStatusID: 801,
    statusName: "Delivered",
    phaseCode: "PAYMENT",
    isTerminal: false,
    isFailure: false,
    sortOrder: 811,
    description: "Order requires service fee before processing."
  },
  SERVICE_FEE_INITIATED: {
    orderStatusID: 812,
    statusName: "Service Fee Initiated",
    phaseCode: "PAYMENT",
    isTerminal: false,
    isFailure: false,
    sortOrder: 812,
    description: "Payment process started for service fee."
  },
  SERVICE_FEE_PAID: {
    orderStatusID: 813,
    statusName: "Service Fee Paid",
    phaseCode: "PAYMENT",
    isTerminal: false,
    isFailure: false,
    sortOrder: 813,
    description: "Service fee successfully paid."
  },
  SERVICE_FEE_FAILED: {
    orderStatusID: 814,
    statusName: "Service Fee Failed",
    phaseCode: "PAYMENT",
    isTerminal: false,
    isFailure: true,
    sortOrder: 814,
    description: "Service fee payment failed."
  },
  SERVICE_FEE_WAIVED: {
    orderStatusID: 815,
    statusName: "Service Fee Waived",
    phaseCode: "PAYMENT",
    isTerminal: false,
    isFailure: false,
    sortOrder: 815,
    description: "Service fee waived by policy/admin override."
  },
  CLOSED_SUCCESS: {
    orderStatusID: 901,
    statusName: "Returned to Vendor",
    phaseCode: "CLOSED",
    isTerminal: true,
    isFailure: false,
    sortOrder: 901,
    description: "Vendor accepted the return and the return lifecycle is complete."
  },
  CLOSED_CANCELLED: {
    orderStatusID: 902,
    statusName: "Returns Declined",
    phaseCode: "CLOSED",
    isTerminal: true,
    isFailure: true,
    sortOrder: 902,
    description: "Vendor return has been declined and is closed."
  },
  CLOSED_FAILED: {
    orderStatusID: 903,
    statusName: "Lost Item",
    phaseCode: "CLOSED",
    isTerminal: true,
    isFailure: true,
    sortOrder: 903,
    description: "Shipment marked as lost; retained in the lost report after payment completion."
  }
};

// Helper constants for common status groups
export const TERMINAL_STATUSES = [303, 802, 901, 902, 903];
export const FAILURE_STATUSES = [306, 803, 902];
export const SUCCESS_STATUSES = [303, 802, 901];

// Phase codes
export const PHASE_CODES = {
  VENDOR: "VENDOR",
  INBOUND: "INBOUND",
  DC: "DC",
  ASSIGN: "ASSIGN",
  DELIVERY: "DELIVERY",
  PICKUP: "PICKUP",
  RETURN: "RETURN",
  PAYMENT: "PAYMENT",
  CLOSED: "CLOSED"
};

// Helper function to get status by ID
export const getPackageStatus = (statusId) => {
  return Object.values(PACKAGE_STATUSES).find((status) => status.orderStatusID === Number(statusId)) || null;
};

// Helper function to get status name by ID
export const getPackageStatusName = (statusId) => {
  const status = getPackageStatus(statusId);
  return status ? status.statusName : "Unknown Status";
};

// Helper function to check if status is terminal
export const isTerminalStatus = (statusId) => {
  const status = getPackageStatus(statusId);
  return status ? status.isTerminal : false;
};

// Helper function to check if status is failure
export const isFailureStatus = (statusId) => {
  const status = getPackageStatus(statusId);
  return status ? status.isFailure : false;
};

// Helper function to get status by constant name
export const getPackageStatusByName = (statusName) => {
  return PACKAGE_STATUSES[statusName] || null;
};

// Helper function to get status ID by constant name
export const getPackageStatusId = (statusName) => {
  const status = PACKAGE_STATUSES[statusName];
  return status ? status.orderStatusID : null;
};
