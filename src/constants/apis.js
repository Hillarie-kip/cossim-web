// API base URL
const API_BASE = "https://click.cossim.co.ke";

const apiRoutes = {
  account: {
    confirmPayment: `${API_BASE}/api/Account/ConfirmPayment`,
    completeServicePayment: `${API_BASE}/api/Account/CompleteServicePayment`,
    requestSTKPush: `${API_BASE}/api/Account/RequestSTKPush`,
    STKResults: `${API_BASE}/api/Account/STKResults`,
    checkStkPush: `${API_BASE}/api/Account/CheckStkPush`,
    postMpesaOrder: `${API_BASE}/api/Emmerce/PostMpesaOrder`,
  },
  auth: {
    login: `${API_BASE}/api/Users/UserLogin`,
    updateUser: `${API_BASE}/api/Users/UpdateUser`,
    requestPasscode: `${API_BASE}/api/Users/RequestPasscode`,
    confirmResetPassword: `${API_BASE}/api/Users/ConfirmResetPassword`,
  },

  admin: {
    getCity: `${API_BASE}/api/Admin/GetCity`,
    getRegions: `${API_BASE}/api/Admin/GetRegions`,
    getDistributionCenter: `${API_BASE}/api/Admin/GetDistributionCenter`,
    createDistributionCenter: `${API_BASE}/api/Admin/PostDistributionCenter`,
    updateDistributionCenter: `${API_BASE}/api/Admin/UpdateDistributionCenter`,
    deactivateDistributionCenter: `${API_BASE}/api/Admin/DeactivateDistributionCenter`,
    assignDCUser: `${API_BASE}/api/Admin/PostDCUserAssignment`,
    getDCAssignedUsers: `${API_BASE}/api/Admin/GetDCAssignedUsers`,
    deactivateDCAssignedUser: `${API_BASE}/api/Admin/DeactivateDCAssignedUser`,
    getSystemRole: `${API_BASE}/api/Admin/GetSystemRole`,
    getUsers: `${API_BASE}/api/Admin/GetUsers`,
    getUsersByRole: `${API_BASE}/api/Admin/GetUsersByRole`,
    getUsersByVendor: `${API_BASE}/api/Admin/GetUsersByVendor`,
    registerUser: `${API_BASE}/api/Admin/RegisterUser`,
    addUserRole: `${API_BASE}/api/Admin/AddUserRole`,
    removeUserRoleType: `${API_BASE}/api/Admin/RemoveUserRoleType`,
    updateUserInfo: `${API_BASE}/api/Admin/UpdateUserInfo`,
    getDistributionCenterType: `${API_BASE}/api/Admin/GetDistributionCenterType`,
    getCouriers: `${API_BASE}/api/Admin/GetCouriers`,
    addCourier: `${API_BASE}/api/Admin/AddCourier`,
    deactivateCourier: `${API_BASE}/api/Admin/DeactivateCourier`,
  },

  agent: {
    getVendorAgent: `${API_BASE}/api/Agent/GetVendorAgent`,
  },

  dashboard: {
    admin: `${API_BASE}/api/DashBoard/GetAdminDashboard`,
    dcManager: `${API_BASE}/api/DashBoard/GetDCDashboard`,
    vendor: `${API_BASE}/api/DashBoard/GetVendorDashboard`,
    agent: `${API_BASE}/api/DashBoard/GetAgentDashboard`,
    rider: `${API_BASE}/api/DashBoard/GetRiderDashboard`,
  },

  analytics: {
    shipmentOrders: `${API_BASE}/api/Analytics/GetShipmentOrderAnalytics`,
    shipmentTracking: `${API_BASE}/api/Analytics/GetShipmentTrackingAnalytics`,
  },

  inventory: {
    get: `${API_BASE}/api/Inventory/GetInventory`,
    startStockTake: `${API_BASE}/api/Inventory/StartStockTake`,
    getStockTake: `${API_BASE}/api/Inventory/GetStockTake`,
    scanStockTakeItem: `${API_BASE}/api/Inventory/ScanStockTakeItem`,
    completeStockTake: `${API_BASE}/api/Inventory/CompleteStockTake`,
  },

  distributionCenters: {
    list: `${API_BASE}/api/DC/GetDistributionCenter`,
    create: `${API_BASE}/api/DC/PostDistributionCenter`,
    update: `${API_BASE}/api/DC/UpdateDistributionCenter`,
    assignUser: `${API_BASE}/api/DC/PostDCUserAssignment`,
    assignedUsers: `${API_BASE}/api/DC/GetDCAssignedUsers`,
    deactivateAssignedUser: `${API_BASE}/api/DC/DeactivateDCAssignedUser`,
    handoverBatch: `${API_BASE}/api/DC/PostHandoverBatchTx`,
    getRiderDashboard: `${API_BASE}/api/DashBoard/GetRiderDashboard`
  },

  finance: {
    getActiveShipmentRate: `${API_BASE}/api/Finance/GetActiveShipmentRate`,
    getShipmentRates: `${API_BASE}/api/Finance/GetShipmentRates`,
    createShipmentRate: `${API_BASE}/api/Finance/PostShipmentRate`,
    getPriceZones: `${API_BASE}/api/Finance/GetPriceZones`,
    createPriceZone: `${API_BASE}/api/Finance/PostPriceZone`,
    getSummaryDashboard: `${API_BASE}/api/Finance/GetSummaryDashboard`,
    getOrderReconciliation: `${API_BASE}/api/Finance/GetOrderReconciliation`,
    getPaymentReviewQueue: `${API_BASE}/api/Finance/GetPaymentReviewQueue`,
    resolvePaymentReviews: `${API_BASE}/api/Finance/ResolvePaymentReviews`,
    getReconciliationWorkspace: `${API_BASE}/api/Finance/GetReconciliationWorkspace`,
    getReconciliationBatches: `${API_BASE}/api/Finance/GetReconciliationBatches`,
    getReconciliationTransactions: `${API_BASE}/api/Finance/GetReconciliationTransactions`,
    searchPaybillReceipts: `${API_BASE}/api/Finance/SearchPaybillReceipts`,
    matchOrderReceipts: `${API_BASE}/api/Finance/MatchOrderReceipts`,
    rejectReconciliationOrder: `${API_BASE}/api/Finance/RejectReconciliationOrder`,
    getSettlements: `${API_BASE}/api/Finance/GetSettlements`,
    getSettlementDetail: `${API_BASE}/api/Finance/GetSettlementDetail`,
    createSettlementRequest: `${API_BASE}/api/Finance/PostSettlementRequest`,
    addSettlementItem: `${API_BASE}/api/Finance/AddSettlementItem`,
    removeSettlementItem: `${API_BASE}/api/Finance/RemoveSettlementItem`,
    finalizeSettlement: `${API_BASE}/api/Finance/FinalizeSettlement`,
    updateSettlement: `${API_BASE}/api/Finance/UpdateSettlement`,
    updateSettlementStatus: `${API_BASE}/api/Finance/UpdateSettlementStatus`,
  },

  vendors: {
    list: `${API_BASE}/api/Vendor/GetVendor`,
    create: `${API_BASE}/api/Vendor/PostVendor`,
    update: `${API_BASE}/api/Vendor/UpdateVendor`,
    deactivate: `${API_BASE}/api/Vendor/DeactivateVendor`,
    getSummary: `${API_BASE}/api/Vendor/GetVendorSummary`,
    getStatement: `${API_BASE}/api/Vendor/GetVendorStatement`,
    getPayments: `${API_BASE}/api/Vendor/GetVendorPaymentsAll`,
    products: {
      list: `${API_BASE}/api/Vendor/GetVendorProduct`,
      create: `${API_BASE}/api/Vendor/PostVendorProduct`,
      update: `${API_BASE}/api/Vendor/UpdateVendorProduct`,
      deactivate: `${API_BASE}/api/Vendor/DeactivateVendorProduct`,
    },
    stores: {
      list: `${API_BASE}/api/Vendor/GetVendorStore`,
      create: `${API_BASE}/api/Vendor/CreateVendorStore`,
      update: `${API_BASE}/api/Vendor/UpdateVendorStore`,
      deactivate: `${API_BASE}/api/Vendor/DeactivateVendorStore`,
    },
    getCategories: `${API_BASE}/api/Vendor/GetVendorCategory`,
  },

  shipment: {
    getShipmentFieldSuggestions: `${API_BASE}/api/Shipment/GetShipmentFieldSuggestions`,
    deliveryType: `${API_BASE}/api/Shipment/GetDeliveryType`,
    createOrder: `${API_BASE}/api/Shipment/PostShipmentOrderTx`,
    getOrdersByVendor: `${API_BASE}/api/Shipment/GetShipmentOrdersByVendor`,
    getOrders: `${API_BASE}/api/Shipment/GetShipmentOrders`,
    getOrdersByDC: `${API_BASE}/api/Shipment/GetShipmentOrdersByDC`,
    getOrdersByRider: `${API_BASE}/api/Shipment/GetShipmentOrdersByRider`,
    getShipmentOrderStatus: `${API_BASE}/api/Shipment/GetShipmentOrderStatus`,
    getShipmentTimeline: `${API_BASE}/api/Shipment/GetShipmentTimeline`,
    postShipmentHandoverBatch: `${API_BASE}/api/Shipment/PostShipmentHandoverBatchTx`,
    completeHandoverBatch: `${API_BASE}/api/Shipment/CompleteHandoverBatchTx`,
    uploadHandoverReceipt: `${API_BASE}/api/Shipment/UploadHandoverReceipt`,
    getHandoverReceipt: `${API_BASE}/api/Shipment/GetHandoverReceipt`,
    editHandoverBatch: `${API_BASE}/api/Shipment/EditHandoverBatchTx`,
    getHandoverBatchList: `${API_BASE}/api/Shipment/GetHandoverBatchList`,
    getHandoverItems: `${API_BASE}/api/Shipment/GetHandoverItems`,
    updateShipmentStatus: `${API_BASE}/api/Shipment/UpdateShipmentStatus`,
    updateShipmentStatusBatch: `${API_BASE}/api/Shipment/UpdateShipmentStatusBatch`,
    receiveInboundShipmentBatch: `${API_BASE}/api/Shipment/ReceiveInboundShipmentBatch`,
    getRiderManifest: `${API_BASE}/api/Shipment/GetRiderManifests`,
    postRiderManifest: `${API_BASE}/api/Shipment/PostRiderManifestTx`,
    getShipmentOrder: `${API_BASE}/api/Shipment/GetShipmentOrder`,
    getShipmentOrderItems: `${API_BASE}/api/Shipment/GetShipmentOrderItems`,
    getShipmentProductNames: `${API_BASE}/api/Shipment/GetShipmentProductNames`,
    getShipmentOrderPayment: `${API_BASE}/api/Shipment/GetShipmentOrderPayment`,
    saveShipmentOrderPayment: `${API_BASE}/api/Shipment/SaveShipmentOrderPayment`,
    confirmShipmentOrderPayment: `${API_BASE}/api/Shipment/ConfirmShipmentOrderPayment`,
    deleteShipmentOrderPayment: `${API_BASE}/api/Shipment/DeleteShipmentOrderPayment`,
    importDeliveredOrderPayments: `${API_BASE}/api/Shipment/ImportDeliveredOrderPayments`,
    removeManifestOrder: `${API_BASE}/api/Shipment/RemoveManifestOrder`,
    downloadExcelTemplate: `${API_BASE}/api/Shipment/DownloadShipmentExcelTemplate`,
    uploadExcel: `${API_BASE}/api/Shipment/UploadShipmentExcel`,
  },

  otonglo: {
    register: `${API_BASE}/api/Otonglo/OtongloUrlRegistration`,
    validate: `${API_BASE}/api/Otonglo/Validation`,
    confirmation: `${API_BASE}/api/Otonglo/Confirmation`,
    pullCallBack: `${API_BASE}/api/Otonglo/PullCallBack`,
    STKResults: `${API_BASE}/api/Otonglo/STKResults`,
    STKResults2: `${API_BASE}/api/Otonglo/STKResults2`
  },

  vendorCustomer: {
    register: `${API_BASE}/api/VendorCustomer/PostVendorCustomerRegistration`,
    list: `${API_BASE}/api/VendorCustomer/GetVendorCustomer`,
    updateCustomer: `${API_BASE}/api/VendorCustomer/UpdateVendorCustomer`,
    deactivateCustomer: `${API_BASE}/api/VendorCustomer/DeactivateVendorCustomer`,
    updateCustomerAddress: `${API_BASE}/api/VendorCustomer/UpdateVendorCustomerAddress`,
    deactivateCustomerAddress: `${API_BASE}/api/VendorCustomer/DeactivateVendorCustomerAddress`,
    postCustomerAddress: `${API_BASE}/api/VendorCustomer/PostVendorCustomerAddress`,
  },

  whatsapp: {
    webhooks: `${API_BASE}/api/Whatsapp/Webhooks`,
    webhook: `${API_BASE}/api/Whatsapp/Webhook`,
  },

};

export default apiRoutes;
