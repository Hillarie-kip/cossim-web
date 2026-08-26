import React from "react";
import * as Icon from "react-feather";

export const SidebarData = [
  {
    label: "Overview",
    submenuOpen: true,
    submenuHdr: "Overview",
    submenuItems: [
      {
        label: "Dashboard",
        icon: <Icon.Home />,
        link: "/admin/dashboard",
        showSubRoute: false,
        submenu: false,
        description: "Overview & Analytics",
      },
    ],
  },
  {
    label: "Operations",
    submenuOpen: true,
    submenuHdr: "Operations",
    submenuItems: [
      {
        label: "Task Management",
        icon: <Icon.Package />,
        link: "/admin/packages",
        showSubRoute: true,
        submenu: true,
        description: "Shipment Task Management",
        submenuItems: [
          {
            label: "Forward Task",
            icon: <Icon.ArrowRightCircle />,
            link: "/admin/packages?task=deliver",
            showSubRoute: false,
            submenu: false,
            description: "Forward shipment tasks",
          },
          {
            label: "Reverse Task",
            icon: <Icon.RotateCcw />,
            link: "/admin/packages?task=reverse-orders",
            showSubRoute: false,
            submenu: false,
            description: "Reversal shipment tasks",
          },
        ],
      },
      {
        label: "Inventory",
        icon: <Icon.Clipboard />,
        link: "/admin/inventory",
        showSubRoute: false,
        submenu: false,
        description: "DC Stock & Products",
      },
    ],
  },
  {
    label: "Reports",
    submenuOpen: true,
    submenuHdr: "Reports",
    submenuItems: [
      {
        label: "Orders",
        icon: <Icon.Package />,
        link: "/admin/reports/delivered-orders",
        showSubRoute: true,
        submenu: true,
        description: "Delivered and completed orders",
        submenuItems: [
          { label: "All Orders", icon: <Icon.Inbox />, link: "/admin/reports/vendor-received-orders", submenu: false },
          { label: "Delivered Orders", icon: <Icon.CheckCircle />, link: "/admin/reports/delivered-orders", submenu: false },
          { label: "Completed Orders", icon: <Icon.CheckSquare />, link: "/admin/reports/completed-orders", submenu: false },
        ],
      },
      {
        label: "Returns",
        icon: <Icon.RotateCcw />,
        link: "/admin/reports/all-returns",
        showSubRoute: true,
        submenu: true,
        description: "Accepted and declined returns",
        submenuItems: [
          { label: "All Returns", icon: <Icon.RotateCcw />, link: "/admin/reports/all-returns", submenu: false },
          { label: "Accepted Returns", icon: <Icon.CheckCircle />, link: "/admin/reports/accepted-returns", submenu: false },
          { label: "Declined Returns", icon: <Icon.XCircle />, link: "/admin/reports/declined-returns", submenu: false },
        ],
      },
      {
        label: "Consolidated Orders",
        icon: <Icon.Layers />,
        link: "/admin/reports/consolidated-orders",
        showSubRoute: false,
        submenu: false,
        description: "Completed handover batches",
      },
    ],
  },
  {
    label: "Finance",
    submenuOpen: true,
    submenuHdr: "Finance",
    submenuItems: [
      {
        label: "Summary",
        icon: <Icon.Home />,
        link: "/admin/finance-summary",
        showSubRoute: false,
        submenu: false,
        description: "Financial Overview",
      },
      {
        label: "Reconciliation",
        icon: <Icon.FileText />,
        link: "/admin/payment-reconciliation",
        showSubRoute: false,
        submenu: false,
        description: "COD Payment Reconciliation",
      },
      {
        label: "Settlements",
        icon: <Icon.DollarSign />,
        link: "/admin/settlements",
        showSubRoute: false,
        submenu: false,
        description: "Settlement Management",
      },
      {
        label: "Shipping Rates",
        icon: <Icon.Tag />,
        link: "/admin/pricing",
        showSubRoute: false,
        submenu: false,
        description: "Comprehensive Pricing",
      },
    ],
  },
  {
    label: "General",
    submenuOpen: true,
    submenuHdr: "General",
    submenuItems: [
      {
        label: "Set up",
        icon: <Icon.Settings />,
        link: "/admin/settings",
        showSubRoute: true,
        submenu: true,
        description: "System setup",
        submenuItems: [
          {
            label: "Vendors",
            icon: <Icon.Users />,
            link: "/admin/vendors",
            submenu: false,
          },
          {
            label: "Location",
            icon: <Icon.MapPin />,
            link: "/admin/distribution-centers",
            submenu: false,
          },
          {
            label: "Users",
            icon: <Icon.User />,
            link: "/admin/users",
            submenu: false,
          },
          {
            label: "Couriers",
            icon: <Icon.Truck />,
            link: "/admin/couriers",
            submenu: false,
          },
        ],
      },
      {
        label: "CRM",
        icon: <Icon.MessageCircle />,
        link: "/admin/sms",
        showSubRoute: true,
        submenu: true,
        description: "Customer communications",
        submenuItems: [
          {
            label: "SMS",
            icon: <Icon.MessageSquare />,
            link: "/admin/sms",
            submenu: false,
          },
          {
            label: "WhatsApp",
            icon: <Icon.Phone />,
            link: "/admin/whatsapp",
            submenu: false,
          },
        ],
      },
    ],
  },
];

export const distribution_center_manager_sidebar_data = [
  {
    label: "OVERVIEW",
    submenuItems: [
      {
        label: "Overview",
        icon: <Icon.Home />,
        link: "/dc/dc-overview",
        showSubRoute: false,
        submenu: false,
        description: "Overview & Analytics",
      },
    ],
  },
  {
    label: "LOGISTICS",
    submenuItems: [
      {
        label: "Batch",
        icon: <Icon.Package />,
        showSubRoute: true,
        submenu: true,
        description: "Batch Management",
        submenuItems: [
          {
            label: "Create Batch",
            icon: <Icon.Plus />,
            link: "/dc/batch/create",
            showSubRoute: false,
            submenu: false,
            description: "Create New Batch",
          },
          {
            label: "Inbound",
            icon: <Icon.ArrowDown />,
            link: "/dc/batch/inbound",
            showSubRoute: false,
            submenu: false,
            description: "Inbound Shipments",
          },
          {
            label: "Outbound",
            icon: <Icon.ArrowUp />,
            link: "/dc/batch/outbound",
            showSubRoute: false,
            submenu: false,
            description: "Outbound Shipments",
          },
        ],
      },
      {
        label: "Packages",
        icon: <Icon.Package />,
        link: "/dc/dc-packages",
        showSubRoute: false,
        submenu: false,
        description: "Package Management",
      },
      {
        label: "Manifest",
        icon: <Icon.FileText />,
        link: "/dc/dc-manifest",
        showSubRoute: false,
        submenu: false,
        description: "Manifest Management",
      },
    ],
  },
  {
    label: "TEAM",
    submenuItems: [
      {
        label: "Riders",
        icon: <Icon.Truck />,
        link: "/dc/dc-couriers",
        showSubRoute: false,
        submenu: false,
        description: "Courier Management",
      },
    ],
  },
  {
    label: "REPORTS",
    submenuItems: [
      {
        label: "All Returns",
        icon: <Icon.RotateCcw />,
        link: "/dc/reports/all-returns",
        showSubRoute: false,
        submenu: false,
        description: "Accept or decline returned orders",
      },
      {
        label: "Tracking Analytics",
        icon: <Icon.Activity />,
        link: "/dc/reports/shipment-tracking",
        showSubRoute: false,
        submenu: false,
        description: "DC Movement & Delays",
      },
    ],
  },
    {
    label: "QUICK ACTIONS",
    submenuItems: [
      {
        label: "Single Scan",
        icon: <Icon.Maximize />,
        link: "/dc/dc-single-scan",
        showSubRoute: false,
        submenu: false,
        description: "Single Package Scan",
      },
      {
        label: "Batch Scan",
        icon: <Icon.Grid />,
        link: "/dc/dc-batch-scan",
        showSubRoute: false,
        submenu: false,
        description: "Batch Package Scan",
      },
    ],
  },
  {
    label: "ACCOUNT",
    submenuItems: [
      {
        label: "Profile",
        icon: <Icon.User />,
        link: "/dc/dc-profile",
        showSubRoute: false,
        submenu: false,
        description: "User Profile",
      },
      {
        label: "Logout",
        icon: <Icon.LogOut />,
        isLogout: true,
        showSubRoute: false,
        submenu: false,
        description: "Sign Out",
      },
    ],
  },
];

export const sales_agent_dashboard_sidebar_data = [
  {
    label: "OVERVIEW",
    submenuItems: [
      {
        label: "Dashboard",
        icon: <Icon.Home />,
        link: "/sales/sales-agent-dashboard",
        showSubRoute: false,
        submenu: false,
        description: "Overview & Analytics",
      },
    ],
  },
  {
    label: "OPERATIONS",
    submenuItems: [
      {
        label: "Packages",
        icon: <Icon.Package />,
        link: "/sales/sa-packages",
        showSubRoute: false,
        submenu: false,
        description: "Package Management",
      },
      {
        label: "Vendors",
        icon: <Icon.Users />,
        link: "/sales/vendors",
        showSubRoute: false,
        submenu: false,
        description: "Vendor Management",
      },
    ],
  },
  {
    label: "GROWTH",
    submenuItems: [
      {
        label: "Referrals",
        icon: <Icon.Share2 />,
        link: "/sales/sa-referral",
        showSubRoute: false,
        submenu: false,
        description: "Referral Management",
      },
    ],
  },
  {
    label: "ACCOUNT",
    submenuItems: [
      {
        label: "Profile",
        icon: <Icon.User />,
        link: "/sales/sa-profile",
        showSubRoute: false,
        submenu: false,
        description: "User Profile",
      },
      {
        label: "Logout",
        icon: <Icon.LogOut />,
        isLogout: true,
        showSubRoute: false,
        submenu: false,
        description: "Sign Out",
      },
    ],
  },
];

export const rider_dashboard_sidebar_data = [
  {
    label: "DELIVERY",
    submenuItems: [
      {
        label: "Dashboard",
        icon: <Icon.Home />,
        link: "/rider/rd-overview",
        showSubRoute: false,
        submenu: false,
        description: "Overview & Analytics",
      },
      {
        label: "My Packages",
        icon: <Icon.Package />,
        link: "/rider/rd-packages",
        showSubRoute: false,
        submenu: false,
        description: "Package Management",
      },
      {
        label: "Manifest",
        icon: <Icon.FileText />,
        link: "/rider/rd-manifest",
        showSubRoute: false,
        submenu: false,
        description: "Manifest Management",
      },
    ],
  },
  {
    label: "FINANCE",
    submenuItems: [
      {
        label: "Earnings",
        icon: <Icon.DollarSign />,
        link: "/rider/rd-earnings",
        showSubRoute: false,
        submenu: false,
        description: "Earnings Overview",
      },
    ],
  },
    {
    label: "SCANNING",
    submenuItems: [
      {
        label: "Single Scan",
        icon: <Icon.Maximize />,
        link: "/rider/rd-single-scan",
        showSubRoute: false,
        submenu: false,
        description: "Single Package Scan",
      },
      {
        label: "Batch Scan",
        icon: <Icon.Grid />,
        link: "/rider/rd-batch-scan",
        showSubRoute: false,
        submenu: false,
        description: "Batch Package Scan",
      },
    ],
  },
  {
    label: "ACCOUNT",
    submenuItems: [
      {
        label: "Profile",
        icon: <Icon.User />,
        link: "/rider/rd-profile",
        showSubRoute: false,
        submenu: false,
        description: "User Profile",
      },
      {
        label: "Logout",
        icon: <Icon.LogOut />,
        isLogout: true,
        showSubRoute: false,
        submenu: false,
        description: "Sign Out",
      },
    ],
  },
];

export const vendor_dashboard_sidebar_data = [
  {
    label: "OVERVIEW",
    submenuItems: [
      {
        label: "Dashboard",
        icon: <Icon.Home />,
        link: "/vendor/vendor-overview",
        showSubRoute: false,
        submenu: false,
        description: "Overview & Analytics",
      },
    ],
  },
  {
    label: "MANAGE",
    submenuItems: [
      {
        label: "Create Package",
        icon: <Icon.Plus />,
        link: "/vendor/vendor-create-package",
        showSubRoute: false,
        submenu: false,
        description: "Create New Package",
      },
      {
        label: "My Packages",
        icon: <Icon.Package />,
        link: "/vendor/vendor-packages",
        showSubRoute: false,
        submenu: false,
        description: "Package Management",
      },
      {
        label: "Products",
        icon: <Icon.Box />,
        link: "/vendor/vendor-products",
        showSubRoute: false,
        submenu: false,
        description: "Product Management",
      },
      {
        label: "Stores",
        icon: <Icon.Home />,
        link: "/vendor/vendor-stores",
        showSubRoute: false,
        submenu: false,
        description: "Pickup & Drop-off Stores",
      },
    ],
  },
  {
    label: "CUSTOMERS",
    submenuItems: [
      {
        label: "Users",
        icon: <Icon.UserCheck />,
        link: "/vendor/vendor-users",
        showSubRoute: false,
        submenu: false,
        description: "Manage Users",
      },
      {
        label: "Track Package",
        icon: <Icon.Search />,
        link: "/vendor/vendor-track",
        showSubRoute: false,
        submenu: false,
        description: "Track Packages",
      },
    ],
  },
  {
    label: "REPORTS",
    submenuItems: [
      {
        label: "All Returns",
        icon: <Icon.RotateCcw />,
        link: "/vendor/reports/all-returns",
        showSubRoute: false,
        submenu: false,
        description: "Accept returned orders",
      },
      {
        label: "Tracking Analytics",
        icon: <Icon.Activity />,
        link: "/vendor/reports/shipment-tracking",
        showSubRoute: false,
        submenu: false,
        description: "My Shipment Movement",
      },
    ],
  },
  {
    label: "ACCOUNT",
    submenuItems: [
      {
        label: "Profile",
        icon: <Icon.User />,
        link: "/vendor/vendor-profile",
        showSubRoute: false,
        submenu: false,
        description: "User Profile",
      },
      {
        label: "Logout",
        icon: <Icon.LogOut />,
        isLogout: true,
        showSubRoute: false,
        submenu: false,
        description: "Sign Out",
      },
    ],
  },
];
