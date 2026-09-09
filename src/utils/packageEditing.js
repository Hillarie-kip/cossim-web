// Matches the pending-delivery group in Task Management.
export const PENDING_DELIVERY_STATUS_IDS = [201, 301, 302, 304, 305, 306, 307, 801, 803];

export const canEditPackage = (order) => PENDING_DELIVERY_STATUS_IDS.includes(Number(order?.StatusID));
