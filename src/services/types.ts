/**
 * TypeScript definitions for COSSIM API Services
 * These types are based on the Swagger documentation
 */

// Common types
export interface PaginationParams {
  pageNo?: number;
  pageSize?: number;
  searchTerm?: string;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
}

// Auth Types
export interface LoginCredentials {
  phoneNumber: string;
  password: string;
}

export interface UpdateUserModel {
  userCode: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  userImageID?: string;
}

export interface RequestPasswordModel {
  phoneNumber: string;
}

export interface ResetPasswordModel {
  resetCode: string;
  password: string;
  phoneNumber: string;
}

// Dashboard Types
export interface DashboardParams {
  startDate?: string;
  endDate?: string;
  topShipments?: number;
  topCOD?: number;
  onlyDelivered?: boolean;
}

// Distribution Center Types
export interface PostDCModel {
  dcName?: string;
  city?: string;
  region?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  latitude?: string;
  longitude?: string;
  isPrimary?: boolean;
}

export interface UpdateDCModel {
  dcCode?: string;
  dcName?: string;
  city?: string;
  region?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  latitude?: string;
  longitude?: string;
  statusID?: number;
  isPrimary?: boolean;
}

export interface PostDCAssignmentModel {
  dcCode?: string;
  userCode?: string;
}

export interface DeactivateDCAssignmentModel {
  distributionCenterUserID?: number;
  dcCode?: string;
  userCode?: string;
}

export interface DCAssignedUsersParams extends PaginationParams {
  dcCode?: string;
}

// Vendor Types
export interface PostVendorModel {
  vendorName?: string;
  firstName?: string;
  lastName?: string;
  contactName?: string;
  phoneNumber?: string;
  emailAddress?: string;
  defaultDCCode?: string;
  refferalCode?: string;
}

export interface UpdateVendorModel {
  vendorCode?: string;
  vendorName?: string;
  contactName?: string;
  phoneNumber?: string;
  emailAddress?: string;
  defaultDCCode?: string;
}

export interface DeactivateVendorModel {
  vendorCode?: string;
}

// Service Function Types
export interface AuthService {
  userLogin: (payload: LoginCredentials) => Promise<any>;
  userLogout: () => Promise<void>;
  updateUser: (payload: UpdateUserModel) => Promise<any>;
  requestPasscode: (payload: RequestPasswordModel) => Promise<any>;
  confirmResetPassword: (payload: ResetPasswordModel) => Promise<any>;
  getToken: () => string | null;
  isTokenValid: (token: string) => boolean;
  getUserData: () => any | null;
}

export interface DashboardService {
  getAdminDashboard: (params?: DashboardParams) => Promise<any>;
}

export interface AgentService {
  getVendorAgents: (params?: PaginationParams) => Promise<any>;
}

export interface DistributionCenterService {
  getDistributionCenters: (params?: PaginationParams) => Promise<any>;
  createDistributionCenter: (payload: PostDCModel) => Promise<any>;
  updateDistributionCenter: (payload: UpdateDCModel) => Promise<any>;
  assignUserToDC: (payload: PostDCAssignmentModel) => Promise<any>;
  getDCAssignedUsers: (params?: DCAssignedUsersParams) => Promise<any>;
  deactivateDCAssignedUser: (payload: DeactivateDCAssignmentModel) => Promise<any>;
}

export interface VendorService {
  getVendors: (params?: PaginationParams) => Promise<any>;
  createVendor: (payload: PostVendorModel) => Promise<any>;
  updateVendor: (payload: UpdateVendorModel) => Promise<any>;
  deactivateVendor: (payload: DeactivateVendorModel) => Promise<any>;
}

export interface ShipmentService {
  getDeliveryTypes: () => Promise<any>;
}

export interface WhatsappService {
  getWebhooks: (params?: Record<string, any>) => Promise<any>;
  createWebhook: (payload: any) => Promise<any>;
  getWebhook: (params?: Record<string, any>) => Promise<any>;
}
