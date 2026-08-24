# Services Documentation

This directory contains all the service modules for the COSSIM application. Each service handles API calls for specific functionality areas.

## Available Services

### 1. Auth Service (`authService.js`)
Handles user authentication and user management.

**Functions:**
- `userLogin(payload)` - Login user
- `userLogout()` - Logout user and clear session
- `updateUser(payload)` - Update user profile
- `requestPasscode(payload)` - Request password reset code
- `confirmResetPassword(payload)` - Confirm password reset
- `getToken()` - Get current auth token
- `isTokenValid(token)` - Check if token is valid
- `getUserData()` - Get current user data

**Usage:**
```javascript
import { userLogin, updateUser } from '@/services/authService';

// Login
const loginData = await userLogin({ phoneNumber: "123456789", password: "password" });

// Update user
const updatedUser = await updateUser({ firstName: "John", lastName: "Doe" });
```

### 2. Dashboard Service (`dashboardService.js`)
Handles dashboard-related API calls.

**Functions:**
- `getAdminDashboard(params)` - Get admin dashboard data

**Usage:**
```javascript
import { getAdminDashboard } from '@/services/dashboardService';

const dashboardData = await getAdminDashboard({
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    topShipments: 10,
    topCOD: 5,
    onlyDelivered: true
});
```

### 3. Agent Service (`agentService.js`)
Handles agent-related operations.

**Functions:**
- `getVendorAgents(params)` - Get vendor agents with pagination

**Usage:**
```javascript
import { getVendorAgents } from '@/services/agentService';

const agents = await getVendorAgents({
    pageNo: 1,
    pageSize: 10,
    searchTerm: "john"
});
```

### 4. Distribution Center Service (`distributionCenterService.js`)
Handles distribution center operations.

**Functions:**
- `getDistributionCenters(params)` - Get distribution centers
- `createDistributionCenter(payload)` - Create new distribution center
- `updateDistributionCenter(payload)` - Update distribution center
- `assignUserToDC(payload)` - Assign user to distribution center
- `getDCAssignedUsers(params)` - Get users assigned to distribution center
- `deactivateDCAssignedUser(payload)` - Deactivate assigned user

**Usage:**
```javascript
import { 
    getDistributionCenters, 
    createDistributionCenter,
    assignUserToDC 
} from '@/services/distributionCenterService';

// Get DCs
const dcs = await getDistributionCenters({ pageNo: 1, pageSize: 10 });

// Create DC
const newDC = await createDistributionCenter({
    dcName: "Central DC",
    city: "Nairobi",
    region: "Central",
    isPrimary: true
});

// Assign user
await assignUserToDC({ dcCode: "DC001", userCode: "USER001" });
```

### 5. Vendor Service (`vendorService.js`)
Handles vendor operations.

**Functions:**
- `getVendors(params)` - Get vendors with pagination
- `createVendor(payload)` - Create new vendor
- `updateVendor(payload)` - Update vendor
- `deactivateVendor(payload)` - Deactivate vendor

**Usage:**
```javascript
import { getVendors, createVendor } from '@/services/vendorService';

// Get vendors
const vendors = await getVendors({ pageNo: 1, pageSize: 10 });

// Create vendor
const newVendor = await createVendor({
    vendorName: "ABC Shop",
    firstName: "John",
    lastName: "Doe",
    phoneNumber: "123456789",
    emailAddress: "john@abc.com",
    defaultDCCode: "DC001"
});
```

### 6. Shipment Service (`shipmentService.js`)
Handles shipment-related operations.

**Functions:**
- `getDeliveryTypes()` - Get available delivery types

**Usage:**
```javascript
import { getDeliveryTypes } from '@/services/shipmentService';

const deliveryTypes = await getDeliveryTypes();
```

### 7. WhatsApp Service (`whatsappService.js`)
Handles WhatsApp webhook operations.

**Functions:**
- `getWebhooks(params)` - Get webhooks
- `createWebhook(payload)` - Create webhook
- `getWebhook(params)` - Get specific webhook

**Usage:**
```javascript
import { getWebhooks, createWebhook } from '@/services/whatsappService';

// Get webhooks
const webhooks = await getWebhooks();

// Create webhook
const webhook = await createWebhook({ /* webhook data */ });
```

## Error Handling

All services include proper error handling. Errors are thrown with descriptive messages that can be caught and handled in your components:

```javascript
try {
    const data = await getVendors();
    // Handle success
} catch (error) {
    console.error('Error:', error.message);
    // Handle error - show toast, etc.
}
```

## Import Options

You can import individual functions:
```javascript
import { userLogin, getVendors } from '@/services';
```

Or import entire service modules:
```javascript
import authService from '@/services/authService';
import vendorService from '@/services/vendorService';
```

## Authentication

Most services automatically include authentication headers via the `apiClient`. The auth token is retrieved from `localStorage` and included in requests.

## Pagination

Services that support pagination accept these common parameters:
- `pageNo` - Page number (usually starts from 1)
- `pageSize` - Number of items per page
- `searchTerm` - Search/filter term
