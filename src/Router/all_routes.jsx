export const all_routes = {
  // Auth routes
  signin: "/signin",
  signup: "/signup", 
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  
  // Dashboard routes
  dashboard: "/admin/dashboard",
  
  // Rider Dashboard Routes
  riderDashboard: "/",
  riderPackages: "/rider/rd-packages", 
  riderEarnings: "/rider/rd-earnings",
  riderProfile: "/rider/rd-profile",
  packageDetails: "/rider/rd-packages",
  riderManifest: "/rider/rd-manifest",

  // Vendor Dashboard Routes
  vendorDashboard: "/vendor/vendor-dashboard",
  vendorPackages: "/vendor/vendor-packages",
  vendorTrack: "/vendor/vendor-track",
  vendorOverview: "/vendor/vendor-overview",
  vendorOrderReport: "/vendor/reports/shipment-orders",
  vendorTrackingReport: "/vendor/reports/shipment-tracking",
  
  // Sales Agent Dashboard Routes
  salesAgentDashboard: "/sales/sales-agent-dashboard",
  salesManagerDashboard: "/sales/sales-manager-dashboard",
  salesAgentReferral: "/sales/sa-referral",

  // Distribution Center Manager Dashboard Routes
  distributionCenterManagerDashboard: "/distribution-center-manager-dashboard",
  dcOrderReport: "/dc/reports/shipment-orders",
  dcTrackingReport: "/dc/reports/shipment-tracking",
  
  // Main Dashboard sub-routes
  users: "/admin/users",
  settings: "/admin/settings", 
  performance: "/admin/performance",
  pricing: "/admin/pricing",
  policies: "/admin/policies",
  couriers: "/admin/couriers",
  agents: "/admin/agents",
  distributionCenters: "/admin/distribution-centers",
  codPayments: "/admin/cod-payments",
  cache: "/admin/cache",
  batches: "/admin/batches",
  batchesNew: "/admin/batches/new",
  packages: "/admin/packages",
  createPackage: "/admin/packages/create",
  adminRiderPackages: "/admin/riders/packages",
  adminRiders: "/admin/riders",
  vendors: "/admin/vendors",
  salesAgents: "/admin/sales-agents",
  reports: "/admin/reports/shipment-orders",
  shipmentOrderReport: "/admin/reports/shipment-orders",
  deliveredOrdersReport: "/admin/reports/delivered-orders",
  vendorReceivedOrdersReport: "/admin/reports/vendor-received-orders",
  returnedOrdersReport: "/admin/reports/returned-orders",
  acceptedReturnsReport: "/admin/reports/accepted-returns",
  allReturnsReport: "/admin/reports/all-returns",
  declinedReturnsReport: "/admin/reports/declined-returns",
  completedOrdersReport: "/admin/reports/completed-orders",
  consolidatedOrdersReport: "/admin/reports/consolidated-orders",
  shipmentSLAReport: "/admin/reports/shipment-sla",
  shipmentTrackingReport: "/admin/reports/shipment-tracking",
  reconciliation: "/admin/payment-reconciliation",
  reconciliationPayment: "/admin/reconciliation-payment",
};
