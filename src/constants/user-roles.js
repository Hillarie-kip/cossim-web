export const RoleType = {
  ADMIN: "R-001",
  FINANCE: "R-002",
  SALES_MANAGER: "R-003",
  SALES_AGENT: "R-004",
  DC_OPERATOR: "R-005",
  RIDER: "R-006",
  PACKAGE_HANDLER: "R-007",
  VENDOR: "R-008"
};

// Role display names for UI
export const RoleDisplayNames = {
  [RoleType.ADMIN]: "Administrator",
  [RoleType.FINANCE]: "Finance Manager", 
  [RoleType.SALES_MANAGER]: "Sales Manager",
  [RoleType.SALES_AGENT]: "Sales Agent",
  [RoleType.DC_OPERATOR]: "Distribution Center Manager",
  [RoleType.RIDER]: "Rider",
  [RoleType.PACKAGE_HANDLER]: "Package Handler",
  [RoleType.VENDOR]: "Vendor"
};
