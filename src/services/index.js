/**
 * Services Index
 * Central export point for all service modules
 */

// accountService.js
export * from './accountService';
export { default as accountService } from './accountService';

// Auth Services
export * from './authService';
export { default as authService } from './authService';

// Admin Services
export * from './adminService';
export { default as adminService } from './adminService';

// Dashboard Services
export * from './dashboardService';
export { default as dashboardService } from './dashboardService';

// Agent Services
export * from './agentService';
export { default as agentService } from './agentService';

// Distribution Center Services
export * from './distributionCenterService';
export { default as distributionCenterService } from './distributionCenterService';

// Finance Services
export * from './financeService';
export { default as financeService } from './financeService';

// Vendor Services
export * from './vendorService';
export { default as vendorService } from './vendorService';

// Shipment Services
export * from './shipmentService';
export { default as shipmentService } from './shipmentService';

// WhatsApp Services
export * from './whatsappService';
export { default as whatsappService } from './whatsappService';

// Vendor Customer Services
export * from './vendorCustomerService';
export { default as vendorCustomerService } from './vendorCustomerService';

// Export all services as a single object for convenience
export const services = {
    auth: () => import('./authService'),
    admin: () => import('./adminService'),
    dashboard: () => import('./dashboardService'),
    agent: () => import('./agentService'),
    distributionCenter: () => import('./distributionCenterService'),
    finance: () => import('./financeService'),
    vendor: () => import('./vendorService'),
    vendorCustomer: () => import('./vendorCustomerService'),
    shipment: () => import('./shipmentService'),
    whatsapp: () => import('./whatsappService'),
};
