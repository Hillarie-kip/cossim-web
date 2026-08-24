# Modals Components

This directory contains reusable modal components for the application.

## Available Modals

### AddRoutePricingModal

A modal component for adding new route pricing/shipment rates.

**Props:**
- `show` (boolean, required): Controls modal visibility
- `onHide` (function, required): Function to call when modal should be hidden
- `formData` (object, required): Form data object with the following structure:
  ```javascript
  {
    fromDCCode: string,
    toDCCode: string,
    deliveryTypeCode: string,
    slaHours: string|number,
    rateAmount: string|number,
    effectiveFrom: string,
    effectiveTo: string
  }
  ```
- `onInputChange` (function, required): Function to handle input changes
- `onSubmit` (function, required): Function to handle form submission
- `loading` (boolean, optional): Loading state for the submit button

**Usage:**
```javascript
import { AddRoutePricingModal } from "@/components/modals";

// In your component
<AddRoutePricingModal
  show={showModal}
  onHide={handleCloseModal}
  formData={formData}
  onInputChange={handleInputChange}
  onSubmit={handleSubmit}
  loading={loading}
/>
```

## Adding New Modals

1. Create a new modal component in this directory
2. Export it in the `index.js` file
3. Follow the same prop pattern for consistency
4. Include PropTypes for type checking
5. Update this README with the new modal documentation
