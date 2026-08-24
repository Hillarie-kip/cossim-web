# CosSim Logistics Platform — Feature Documentation

> **Application:** CosSim Next.js Frontend  
> **Stack:** Next.js (App Router), React, Bootstrap  
> **Currency:** Kenyan Shilling (KES / KSh)

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Smart Dashboard Routing](#2-smart-dashboard-routing)
3. [Admin Portal](#3-admin-portal)
   - [Dashboard](#31-admin-dashboard)
   - [Operations — Packages](#32-operations--packages)
   - [Operations — Batches](#33-operations--batches)
   - [Operations — Distribution Centers](#34-operations--distribution-centers)
   - [Finance — Pricing (Route Rates)](#35-finance--pricing-route-rates)
   - [Finance — Settlements](#36-finance--settlements)
   - [Finance — Reconciliation](#37-finance--reconciliation)
   - [Finance — Finance Summary](#38-finance--finance-summary)
   - [Vendors (Admin)](#39-vendors-admin)
   - [Vendor Payments](#310-vendor-payments)
   - [Vendor Statements](#311-vendor-statements)
   - [COD Payments (Admin)](#312-cod-payments-admin)
   - [People — Riders](#313-people--riders)
   - [People — Agents](#314-people--agents)
   - [People — Sales Managers](#315-people--sales-managers)
   - [People — Users](#316-people--users)
   - [Configuration — Settings](#317-configuration--settings)
   - [Configuration — Policies](#318-configuration--policies)
   - [Configuration — SMS](#319-configuration--sms)
   - [Performance Analytics](#320-performance-analytics)
   - [Cache Management](#321-cache-management)
4. [Vendor Portal](#4-vendor-portal)
   - [Vendor Dashboard (Overview)](#41-vendor-dashboard-overview)
   - [Vendor Packages](#42-vendor-packages)
   - [Create Package](#43-create-package)
   - [Vendor Track](#44-vendor-track)
   - [Vendor Customers](#45-vendor-customers)
   - [Vendor Products](#46-vendor-products)
   - [Vendor Profile](#47-vendor-profile)
   - [Vendor Users](#48-vendor-users)
   - [Service Fee Payment (Vendor)](#49-service-fee-payment-vendor)
5. [Distribution Center (DC) Portal](#5-distribution-center-dc-portal)
   - [DC Overview](#51-dc-overview)
   - [DC Packages](#52-dc-packages)
   - [DC Receiving](#53-dc-receiving)
   - [DC Scanner](#54-dc-scanner)
   - [DC Operations](#55-dc-operations)
   - [DC Manifest](#56-dc-manifest)
   - [DC Couriers](#57-dc-couriers)
   - [DC Notifications](#58-dc-notifications)
   - [Batch Management](#59-batch-management)
   - [DC Profile](#510-dc-profile)
6. [Rider Portal](#6-rider-portal)
   - [Rider Dashboard (Overview)](#61-rider-dashboard-overview)
   - [Rider Packages](#62-rider-packages)
   - [Rider Manifest](#63-rider-manifest)
   - [Rider Earnings](#64-rider-earnings)
   - [Rider COD Payment](#65-rider-cod-payment)
   - [Rider Profile](#66-rider-profile)
7. [Sales Portal](#7-sales-portal)
   - [Sales Agent Dashboard](#71-sales-agent-dashboard)
   - [Sales Manager Dashboard](#72-sales-manager-dashboard)
   - [Sales Agent Overview](#73-sales-agent-overview)
   - [Sales Agent Packages](#74-sales-agent-packages)
   - [Sales Agent Referral](#75-sales-agent-referral)
   - [Sales Agent Vendors](#76-sales-agent-vendors)
   - [Sales Agent Profile](#77-sales-agent-profile)
8. [Public Package Tracking](#8-public-package-tracking)
9. [User Profile](#9-user-profile)
10. [Package Lifecycle & Status Codes](#10-package-lifecycle--status-codes)

---

## 1. Authentication

**Routes:** `/signin`, `/forgot-password`

### Sign In
- Login via **phone number + password**.
- Show/hide password toggle.
- "Remember Me" checkbox.
- "Forgot Password?" link.
- On successful login, the system inspects the user's **assigned roles** and routes automatically to the correct dashboard (see §2).
- Displays inline error messages for failed logins.

### Forgot Password
- Password recovery flow via phone/email.

---

## 2. Smart Dashboard Routing

**Route:** `/` (root)

When a user lands on the root URL after authentication, the platform:

1. Reads the user's `AssignedRoles` from their JWT / session.
2. Uses a `roleMapping` utility to determine **available dashboards** for those roles.
3. If the user has **one** accessible dashboard → redirects immediately.
4. If the user has **multiple** dashboards → checks `localStorage` for a stored preference first; otherwise shows a **Dashboard Selection Modal** allowing the user to pick and optionally save their preference.
5. Falls back to `/admin/dashboard` if roles cannot be determined.

**Roles recognized (non-exhaustive):** Admin, Vendor, DC Manager, Rider, Sales Agent, Sales Manager.

---

## 3. Admin Portal

**Base route:** `/admin`  
**Layout:** Sidebar navigation with role-based menu groups.

---

### 3.1 Admin Dashboard

**Route:** `/admin/dashboard`

Real-time summary widgets (with animated count-up):

| Metric | Description |
|--------|-------------|
| Total COD Amount | Aggregate KSh value of all COD orders |
| Pending COD Payments | Count of unpaid COD orders |
| Total Packages | All shipment orders in the system |
| Distribution Centers | Number of active DCs |
| Vendors | Total registered vendor count |
| Sales Agents | Total sales agent count |
| Active Riders | Currently active riders |
| Packages Created | Packages created in the current period |

**Charts:**
- **Package Deliveries & COD** — stacked bar chart by month comparing packages vs. COD payments (ApexCharts).

**Tables:**
- **Recent Packages** — last 5 shipments showing tracking code, recipient, status badge, COD amount.
- **Pending COD Payments** — last 5 unpaid COD entries with quick action links.

---

### 3.2 Operations — Packages

**Routes:** `/admin/packages`, `/admin/packages/:id`, `/admin/packages/:id/edit`, `/admin/packages/:id/track`

Full shipment order management:

**List View:**
- Paginated, sortable data table (server-side pagination, 50 per page default).
- **Search** by Order NO, Vendor, DC, or Status (debounced, 500ms).
- **Date range filter** (start date / end date pickers).
- **Multi-select rows** for bulk operations.

**Columns:** Order NO · Sender (name + phone) · Receiver (name + phone) · Amount (Service Fee + COD) · Route (origin DC → destination DC + building) · Date Added · Added By · Status badge · Rider · Actions.

**Per-row Actions (dropdown):**
- **View** — full package detail page.
- **Edit** — modify package details.
- **Track** — open tracking view for that order.
- **Print Sticker** — download shipping label (size selection modal).
- **Update Status** — modal to change package status + assign DC / rider.
- **Pay Service Fee** — shown only when status requires service fee payment.
- **Delete** — requires notes/reason; sets status to `CLOSED_CANCELLED`.

**Bulk Actions:**
- **Print Stickers** — generates labels for all selected packages (size selection modal).

**Import:**
- **Import Excel** modal — upload an `.xlsx` file to bulk-create packages, with optional vendor selection.

**Export:**
- PDF and Excel export of the full dataset (fetches all pages before exporting).

---

### 3.3 Operations — Batches

**Routes:** `/admin/batches`, `/admin/batches/new`, `/admin/batches/items`

- Create and manage delivery batches.
- Add packages to a batch; view batch items.

---

### 3.4 Operations — Distribution Centers

**Routes:** `/admin/distribution-centers`, `/admin/distribution-centers/:id`

- List all distribution centers with their details.
- View individual DC detail page.

---

### 3.5 Finance — Pricing (Route Rates)

**Route:** `/admin/pricing`

Manage shipment rate cards (price per route + delivery type):

**Filters:** From DC · To DC · Delivery Type (searchable dropdowns).

**Columns:** Rate No · From DC · To DC · Delivery Type badge · Rate Amount (KSh) · SLA Hours · Effective Period (from/to) · Status (Active/Inactive).

**Delivery Types:** Door Delivery · DC Agent · Customer Pickup · Vendor Delivery · Pickup · Express.

**Actions:**
- **Add Route Pricing** — modal form with fields: From DC, To DC, Delivery Type, SLA Hours, Rate Amount, Effective From/To.
- View / Edit / Delete individual rate entries.

---

### 3.6 Finance — Settlements

**Routes:** `/admin/settlements`, `/admin/settlements/:settlementNO`

COD settlement records between the platform and vendors:

**Filters (collapsible panel):** From Date · To Date · Vendor (searchable) · Status.

**Columns:** Settlement NO (link) · Vendor · Total Amount · Status · Settled At · Date Added · View Details.

**Statuses:** Active · Pending · Processing · Completed · Cancelled.

---

### 3.7 Finance — Reconciliation

**Route:** `/admin/reconciliation`

Reconciliation management for COD and payment records.

---

### 3.8 Finance — Finance Summary

**Route:** `/admin/finance-summary`

High-level financial summary and reporting.

---

### 3.9 Vendors (Admin)

**Routes:** `/admin/vendors`, `/admin/vendors/:vendorCode`, `/admin/vendors/:vendorCode/users`, `/admin/vendors/:vendorCode/products`

**List View:**
- Search vendors by name/code.
- Server-side pagination.

**Columns:** Vendor Code · Vendor Name · Contact Name · Phone/Email · Service Fee mandatory flag · Default DC · Status (Active/Inactive) · Date Added.

**Per-row Actions:**
- **View** — vendor detail page.
- **Edit** — inline modal to update vendor details.
- **Users** — manage users belonging to this vendor.
- **Products** — view vendor product catalog.
- **Deactivate** — with confirmation dialog (only shown for active vendors).

**Add Vendor:**
- Modal form for creating a new vendor account.

---

### 3.10 Vendor Payments

**Routes:** `/admin/vendor-payments`, `/admin/vendor-payments/:id`

- View and manage payments made to vendors.
- Detail view per payment record.

---

### 3.11 Vendor Statements

**Routes:** `/admin/vendor-statements`, `/admin/vendor-statements/:id`

- View vendor financial statements.
- Detail view per statement.

---

### 3.12 COD Payments (Admin)

**Routes:** `/admin/cod-payments`, `/admin/cod-payments/:id`

- View all COD payment records across the platform.
- Detail view per COD payment.

---

### 3.13 People — Riders

**Routes:** `/admin/riders`, `/admin/riders/:id`

- List all registered riders.
- View individual rider detail (performance, packages, etc.).

---

### 3.14 People — Agents

**Routes:** `/admin/agents`, `/admin/agents/:id`

- List all sales agents.
- View individual agent detail.

---

### 3.15 People — Sales Managers

**Route:** `/admin/sales-managers`

- List and manage sales managers.

---

### 3.16 People — Users

**Routes:** `/admin/users`, `/admin/settings/user-roles`

- Platform-wide user management.
- User role assignment.

---

### 3.17 Configuration — Settings

**Route:** `/admin/settings`

Tabbed configuration panel:

| Tab | Settings |
|-----|----------|
| **General** | Company Name, Email, Phone, Address, Timezone, Currency, Language, Date Format |
| **Notifications** | Toggle: Email / SMS / Push notifications; Order Updates, Payment Alerts, System Alerts, Marketing Emails |
| **SMS** | Provider (Africa's Talking / Twilio / Nexmo), API Key, Username, Sender ID, Enable OTP SMS, Enable Notification SMS |
| **Payment** | Toggle M-Pesa / Card Payments / COD; M-Pesa Consumer Key, Consumer Secret, Shortcode, Passkey |

---

### 3.18 Configuration — Policies

**Route:** `/admin/policies`

- Manage platform operational policies (e.g., SLA policies, return policies).

---

### 3.19 Configuration — SMS

**Routes:** `/admin/sms`, `/admin/sms/:id`

- Manage SMS templates and notification rules.
- View/edit individual SMS template.

---

### 3.20 Performance Analytics

**Route:** `/admin/performance`

KPI dashboard for system-wide performance monitoring:

- **Metric Cards:** Total Packages · Delivered Packages · Total Revenue · Active Agents (with trend indicators vs. last month).
- **Area Chart:** Package Delivery Trends (Packages Delivered vs. Packages Created over time).
- **Performance Summary Panel:** Delivery Success Rate (progress bar) · Pending Orders · COD Collections · Average Delivery Time.
- **Status Distribution:** Count breakdown of packages by status (Created, In Transit, Delivered, Cancelled).

---

### 3.21 Cache Management

**Route:** `/admin/cache`

Application cache monitoring and control:

**Stats Panel:** Total Cache Keys · Memory Used · Hit Ratio · Miss Ratio · Average Response Time.

**Cache Entries Table:** Cache Key · Type badge · Size · TTL · Hit Count · Last Accessed · Status · Clear action per entry.

**Bulk Actions:**
- **Refresh Stats** — reload cache statistics.
- **Clear All Cache** — with confirmation dialog.

---

## 4. Vendor Portal

**Base route:** `/vendor`  
**Access:** Users with the Vendor role.

---

### 4.1 Vendor Dashboard (Overview)

**Route:** `/vendor/vendor-overview`

Personalized dashboard for vendor users:

**Welcome Banner:** Displays user's first name, current date, and quick date filters (Last 30 Days / All Time).

**Performance Stats (6 widgets):**
- Total Packages · In Transit · Delivered · Total Revenue (KES) · This Month Revenue · Avg. Delivery Days.

**Track Package Widget:** Inline search form to enter a tracking number and jump to the tracking view.

**Charts:** Delivery trend chart (shipments over time).

**Recent Shipments Panel:** Last 5 shipments with Order NO, customer name, created date/time, status badge, COD amount, and a View link.

**Quick Actions:**
- Create New Package.
- View All Packages.

---

### 4.2 Vendor Packages

**Route:** `/vendor/vendor-packages`

- Paginated list of all packages created by this vendor.
- Search, filter, and export capabilities.
- Per-package actions: View, Track, Print Sticker, Update Status.

---

### 4.3 Create Package

**Route:** `/vendor/vendor-create-package`

- Multi-step or single-page form to create a new shipment order.
- Fields include: recipient details, pickup/delivery addresses, COD amount, delivery type, product details.

---

### 4.4 Vendor Track

**Route:** `/vendor/vendor-track`

- Track a package by order number directly from the vendor portal.

---

### 4.5 Vendor Customers

**Route:** `/vendor/vendor-customers`

- Address book / customer list associated with this vendor.

---

### 4.6 Vendor Products

**Route:** `/vendor/vendor-products`

- Product catalog management for the vendor.

---

### 4.7 Vendor Profile

**Route:** `/vendor/vendor-profile`

- View and update vendor business profile information.

---

### 4.8 Vendor Users

**Route:** `/vendor/vendor-users`

- Manage sub-users (staff accounts) under this vendor account.

---

### 4.9 Service Fee Payment (Vendor)

**Route:** `/vendor/service-fee-payment`

- Pay outstanding service fees for packages where payment is required before dispatch.

---

## 5. Distribution Center (DC) Portal

**Base route:** `/dc`  
**Access:** Users with the DC Manager role.

---

### 5.1 DC Overview

**Route:** `/dc/dc-overview`

Operations dashboard for distribution center managers:

**Summary Widgets (8):**
- Assigned DCs · Total Packages · Efficiency % · Processing · Active Routes · Ready for Dispatch · Completed Today · Pending Pickups.

**Quick Date Filters:** 7 Days / 30 Days / Refresh.

**Charts:** DC throughput and activity chart.

**Recent Pending Pickups Panel:** Lists overdue and pending pickup items with status badges.

**Quick Action Cards:**
- Scan Packages — navigate to scanner.
- Handover — manage rider handovers.
- Reports — detailed distribution reports.

---

### 5.2 DC Packages

**Route:** `/dc/dc-packages`

- Packages currently at or assigned to this DC.
- Filter by status, date, and search.

---

### 5.3 DC Receiving

**Route:** `/dc/dc-receiving`

- Log incoming packages received at the DC.
- Confirm receipt and update package status to `ARRIVED_AT_DC`.

---

### 5.4 DC Scanner

**Route:** `/dc/dc-scanner`

- Barcode/QR scanner interface for fast package status updates.
- Scan a tracking number to quickly look up and update package state.

---

### 5.5 DC Operations

**Route:** `/dc/dc-operations`

- Operational management view: QC checks, stocking, dispatch preparation.

---

### 5.6 DC Manifest

**Route:** `/dc/dc-manifest`

- View and print dispatch manifests for outgoing packages.

---

### 5.7 DC Couriers

**Route:** `/dc/dc-couriers`

- Manage courier/rider assignments at the DC level.

---

### 5.8 DC Notifications

**Route:** `/dc/dc-notifications`

- View system notifications related to DC operations (package arrivals, alerts, etc.).

---

### 5.9 Batch Management

**Route:** `/dc/batch`

- Create and manage delivery batches for rider dispatch.

---

### 5.10 DC Profile

**Route:** `/dc/dc-profile`

- View and update the DC manager's profile information.

---

## 6. Rider Portal

**Base route:** `/rider`  
**Access:** Users with the Rider role.

---

### 6.1 Rider Dashboard (Overview)

**Route:** `/rider/rd-overview`

Real-time delivery management for riders:

**Summary Cards:**
- Today's Deliveries · Total Deliveries · Success Rate · Out for Delivery.

**Today's Deliveries Table:**
- Columns: Order NO (link to track) · Sender · Receiver · Amount (Fee + COD) · Route · Date Added · Added By · Status.
- Actions per row: View · Track · Update Status.

**Performance Metrics Panel:**
- Total COD Amount (with progress bar vs. target).
- Today's COD.
- Pending COD Payments.
- Active Manifests (count + ratio to total manifests).

**Stats Summary Row:** Total Deliveries · Today's Deliveries · Active Manifests · Total COD Amount (all with comparison indicators).

**Current Shipments Section:** Full list of the rider's assigned packages.

**Refresh Dashboard** button with confirmation dialog.

---

### 6.2 Rider Packages

**Route:** `/rider/rd-packages`

- Full list of packages assigned to this rider.
- Filter by status and date.

---

### 6.3 Rider Manifest

**Route:** `/rider/rd-manifest`

- View active and historical delivery manifests.
- Print manifests for offline use.

---

### 6.4 Rider Earnings

**Route:** `/rider/rd-earnings`

- View earnings breakdown (COD collected, commission, etc.).

---

### 6.5 Rider COD Payment

**Route:** `/rider/rd-cod-payment`

- Submit and track COD amounts collected from customers.

---

### 6.6 Rider Profile

**Route:** `/rider/rd-profile`

- View and update rider personal/contact information.

---

## 7. Sales Portal

**Base route:** `/sales`  
**Access:** Users with Sales Agent or Sales Manager roles.

---

### 7.1 Sales Agent Dashboard

**Route:** `/sales/sales-agent-dashboard`

Commission and referral tracking for sales agents:

**Primary Stats (4 widgets):**
- Active Codes · Active Vendors · Total Packages (from referrals) · Commission This Month (KES).

**Secondary Stats (3 widgets):**
- Total Vendors (all time) · New Vendors This Month · All-Time Commission Earnings.

**Referral Tools:**
- **Create New Vendor** button → opens Add Vendor modal pre-filled with agent's referral code.
- **Referral Signup Link** — display and copy unique referral URL; test link button.

**Recent Vendors Table:** Last 5 referred vendors with name, email, status, date created, package count.

**Recent Shipments Table:** Last 5 shipments from agent's vendors with tracking number, vendor, status, date.

**Quick Actions:** Manage Referrals · View Packages · Commission Details.

**Date Range Filter:** Filter dashboard data by start/end date.

---

### 7.2 Sales Manager Dashboard

**Route:** `/sales/sales-manager-dashboard`

- Aggregated view of all agents under a sales manager.
- Team performance metrics, total referrals, commissions.

---

### 7.3 Sales Agent Overview

**Route:** `/sales/sa-overview`

- Summary overview page for the sales agent's activity.

---

### 7.4 Sales Agent Packages

**Route:** `/sales/sa-packages`

- List of all packages from vendors referred by this agent.

---

### 7.5 Sales Agent Referral

**Route:** `/sales/sa-referral`

- Manage referral codes and vendor onboarding pipeline.

---

### 7.6 Sales Agent Vendors

**Routes:** `/sales/sa-vendors`, `/sales/vendors`

- List of all vendors onboarded by this agent.

---

### 7.7 Sales Agent Profile

**Route:** `/sales/sa-profile`

- View and edit the sales agent's personal profile.

---

## 8. Public Package Tracking

**Routes:** `/track`, `/track/:id`

A publicly accessible page — **no login required**.

**Hero Section:** Animated gradient banner with tagline and feature highlights (Real-time Updates · Location Tracking · Secure & Private).

**Tracking Input:** Enter any tracking number (e.g., `ORD-123456789`) to look up a package.

**Results:** Full shipment status history, timeline of status transitions, sender/recipient details, route information.

**Information Cards:** Easy Tracking · Live Updates · Global Coverage.

---

## 9. User Profile

**Route:** `/profile`

- Shared profile page accessible across all portal roles.
- View and update personal details, change password, manage notification preferences.

---

## 10. Package Lifecycle & Status Codes

Packages move through a structured lifecycle with the following status groups and codes:

| Group | Code | Status Name |
|-------|------|-------------|
| **Vendor (100)** | 101 | Vendor Created |
| | 102 | Vendor Ready for Pickup |
| | 103 | Vendor Handed to DC |
| **Inbound / DC Transfer (200)** | 201 | Inbound to DC |
| | 202 | Arrived at DC |
| | 206 | DC Hold for Transfer |
| | 207 | DC Transfer Batched |
| | 208 | DC Transfer Dispatched |
| | 209 | DC Transfer Inbound |
| **DC & QC (300)** | 301 | DC QC Check |
| | 302 | DC QC Passed |
| | 303 | DC QC Failed |
| | 304 | DC Stocked |
| | 305 | DC Tracking Assigned |
| **Assignment (400)** | 401 | Assigned to Delivery |
| | 402 | Assigned for Pickup |
| | 403 | Assigned to Pack Center |
| | 410 | Delivery Batched |
| **Delivery (500)** | 501 | Out for Delivery |
| | 502 | Delivery Attempted |
| | 503 | Delivered |
| | 504 | Delivery Waitlist |
| **Pickup (600)** | 601 | Pickup Ready |
| | 602 | Pickup Pending Customer |
| | 603 | Picked Up |
| **Return (700)** | 701 | Return Requested by Customer |
| | 702 | Return In Transit |
| | 703 | Returned to Vendor |
| | 704 | Return Closed |
| **Payment (800)** | 801 | Payment Initiated |
| | 802 | COD Collected |
| | 803 | COD Remitted to Vendor |
| | 804 | Payment Confirmed |
| | 805 | Payment Failed |
| **Closed (900)** | 901 | Closed — Success |
| | 902 | Closed — Cancelled |
| | 903 | Closed — Failed |

---

*Last updated: May 2026*
