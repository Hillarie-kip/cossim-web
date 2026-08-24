"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Form, Row, Col, Button, ListGroup, Spinner, Alert, Badge } from 'react-bootstrap';
import { Search, Plus, User, Phone, Mail, MapPin, Trash2 } from 'feather-icons-react';
import Select from 'react-select';
import useVendorCustomer from '@/hooks/useVendorCustomer';
import { useAuth } from '@/contexts/AuthContext';
import notify from '@/lib/toast';
import AddCustomerModal from '@/components/modals/AddCustomerModal';

const CustomerSelector = ({ 
  selectedCustomer, 
  onCustomerSelect, 
  onCustomerChange,
  formData,
  validationErrors,
  selectedVendor = null
}) => {
  const { user } = useAuth();
  const {
    customers,
    loading,
    error,
    registerCustomer,
    searchCustomers,
    fetchCustomersByVendor,
    clearError
  } = useVendorCustomer();

  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [selectedAddressValue, setSelectedAddressValue] = useState('');

  useEffect(() => {
    const vendorCode = selectedVendor?.value || user?.AssignedVendor?.vendorCode || user?.userCode;
    if (vendorCode) {
      fetchCustomersByVendor(vendorCode, { pageSize: 20 });
    }
  }, [selectedVendor?.value, user?.AssignedVendor?.vendorCode, user?.userCode]);

  // Handle search with debouncing
  const handleSearch = useCallback(async (term) => {
    if (!term.trim()) {
      setShowResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const vendorCode = selectedVendor?.value || user?.vendorCode || user?.userCode;
      await searchCustomers(term, { 
        vendorCode: vendorCode,
        pageSize: 10 
      });
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  }, [searchCustomers, selectedVendor?.value, user?.vendorCode, user?.userCode]);

  // Debounced search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      handleSearch(searchTerm);
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, handleSearch]);

  const handleCustomerSelect = (customer) => {
    onCustomerSelect(customer);
    setSearchTerm(customer.customerName || '');
    setShowResults(false);
    setIsNewCustomer(false);
    
    // Reset selected address when selecting a new customer
    setSelectedAddressValue('');
    
    // Auto-fill form data
    onCustomerChange({
      recipientName: customer.customerName || '',
      phoneNumber: customer.phoneNumber || '',
      email: customer.emailAddress || '',
      selectedCustomerCode: customer.vendorCustomerCode || '',
      selectedCustomerAddressCode: '', 
      selectedCustomerAddressDCCode: '' 
    });
  };

  const handleAddressSelect = (addressOption) => {
    setSelectedAddressValue(addressOption?.value || '');
    
    // Update form data with selected address code and DC code
    onCustomerChange({
      selectedCustomerAddressCode: addressOption?.value || '',
      selectedCustomerAddressDCCode: addressOption?.dcCode || addressOption?.address?.CustomerAddressDCCode || ''
    });
  };

  const handleAddNewCustomer = async (customerData) => {
    try {
  // Vendor code from selected vendor or user assignment; align casing with API expectations
  const vendorCode = selectedVendor?.value || user?.AssignedVendor?.VendorCode || user?.vendorCode || user?.userCode;
      const payload = {
        ...customerData,
        vendorCode: vendorCode,
        addedBy: user?.userCode || user?.userEmail || user?.UserID || user?.userID || '',
      };

  const result = await registerCustomer(payload);
      
  if (result.success) {
        // Close modal
        setShowAddModal(false);
        
        // Create customer object for selection using response data if available
        const newCustomer = {
          customerName: customerData.customerName,
          phoneNumber: customerData.phoneNumber,
          emailAddress: customerData.emailAddress,
          vendorCustomerCode: result.data?.Data?.vendorCustomerCode || "", // Use backend generated code if available
          customerAddressArray: customerData.locationarray.map((addr, index) => ({
            ...addr,
            vendorCustomerAddressCode: result.data?.Data?.locationarray?.[index]?.vendorCustomerAddressCode || "",
            vendorCustomerCode: result.data?.Data?.vendorCustomerCode || "",
    // Normalize DC code property casing to match consumers
    CustomerAddressDCCode: addr.customerAddressDCCode || addr.CustomerAddressDCCode || ""
          }))
        };
        
        handleCustomerSelect(newCustomer);
        
        // Refresh customer list
        if (vendorCode) {
          fetchCustomersByVendor(vendorCode, { pageSize: 20 });
        }
        
        notify.success('Customer added successfully');
        return result;
      } else {
        notify.error(result.error || 'Failed to add customer');
        return result;
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      notify.error('Failed to add customer');
      return { success: false, error: error?.message || 'Failed to add customer' };
    }
  };

  const handleUseAsNewCustomer = () => {
    setIsNewCustomer(true);
    setShowResults(false);
    setSelectedAddressValue('');
    onCustomerSelect(null);
  };

  // Create address options for existing customer
  const createAddressOptions = (customer) => {
    if (!customer?.customerAddressArray || !Array.isArray(customer.customerAddressArray)) {
      return [];
    }

    return customer.customerAddressArray.map(address => ({
      value: address.vendorCustomerAddressCode || address.addressCode,
      label: `${address.town || address.addressLine} - ${address.addressLine}${address.landmark ? ` (${address.landmark})` : ''}`,
      address: address,
      dcCode: address.CustomerAddressDCCode // Include DC code for easy access
    }));
  };

  return (
    <>
      {/* Search Input */}
      <div className="mb-3">
        <Form.Label>Search Existing Customer</Form.Label>
        <div className="position-relative">
          <div className="input-group">
            <span className="input-group-text">
              <Search size={16} />
            </span>
            <Form.Control
              type="text"
              placeholder="Search by name or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ backgroundColor: '#F5E6D8' }}
            />
            <Button 
              variant="outline-secondary" 
              onClick={() => setShowAddModal(true)}
              title="Add New Customer"
            >
              <Plus size={16} />
            </Button>
          </div>
          
          {searchLoading && (
            <div className="position-absolute end-0 top-50 translate-middle-y me-5">
              <Spinner size="sm" />
            </div>
          )}

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="customer-search-dropdown">
              <ListGroup variant="flush">
                {customers.length > 0 ? (
                  customers.map((customer, index) => (
                    <ListGroup.Item 
                      key={index}
                      action
                      onClick={() => handleCustomerSelect(customer)}
                      className="customer-info"
                    >
                      <User size={16} className="me-2 text-muted" />
                      <div className="customer-details">
                        <div className="customer-name">{customer.customerName}</div>
                        <div className="customer-contact">
                          <Phone size={12} className="me-1" />
                          {customer.phoneNumber}
                          {customer.emailAddress && (
                            <>
                              <span className="mx-2">•</span>
                              <Mail size={12} className="me-1" />
                              {customer.emailAddress}
                            </>
                          )}
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))
                ) : (
                  <ListGroup.Item className="text-center py-3">
                    <div className="text-muted">
                      No customers found for "{searchTerm}"
                    </div>
                    <Button 
                      variant="link" 
                      size="sm"
                      onClick={handleUseAsNewCustomer}
                      className="p-0 mt-1"
                    >
                      Use as new customer
                    </Button>
                  </ListGroup.Item>
                )}
              </ListGroup>
            </div>
          )}
        </div>
      </div>

      {/* Customer Details Form */}
      <Row>
        <Col md={4}>
          <div className="mb-3">
            <Form.Label>Recipient Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter recipient name"
              name="recipientName"
              value={formData.recipientName}
              onChange={onCustomerChange}
              isInvalid={!!validationErrors.recipientName}
              style={{ backgroundColor: '#F5E6D8' }}
              disabled={selectedCustomer && !isNewCustomer}
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.recipientName}
            </Form.Control.Feedback>
          </div>
        </Col>
        <Col md={4}>
          <div className="mb-3">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              type="text"
              placeholder="+254 XXX XXX XXX"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={onCustomerChange}
              isInvalid={!!validationErrors.phoneNumber}
              style={{ backgroundColor: '#F5E6D8' }}
              disabled={selectedCustomer && !isNewCustomer}
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.phoneNumber}
            </Form.Control.Feedback>
          </div>
        </Col>
        <Col md={4}>
          <div className="mb-3">
            <Form.Label>Email (Optional)</Form.Label>
            <Form.Control
              type="email"
              placeholder="customer@example.com"
              name="email"
              value={formData.email}
              onChange={onCustomerChange}
              isInvalid={!!validationErrors.email}
              style={{ backgroundColor: '#F5E6D8' }}
              disabled={selectedCustomer && !isNewCustomer}
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.email}
            </Form.Control.Feedback>
          </div>
        </Col>
      </Row>

      {/* Selected Customer Info */}
      {selectedCustomer && !isNewCustomer && (
        <div className="mb-3">
          <div className="customer-selected-info d-flex align-items-center mb-3">
            <User size={16} className="me-2" />
            <div className="flex-grow-1">
              <div className="selected-customer-name">{selectedCustomer.customerName}</div>
              <div className="selected-customer-contact">
                <Phone size={12} className="me-1" />
                {selectedCustomer.phoneNumber}
                {selectedCustomer.emailAddress && (
                  <>
                    <span className="mx-2">•</span>
                    <Mail size={12} className="me-1" />
                    {selectedCustomer.emailAddress}
                  </>
                )}
              </div>
            </div>
            <Button 
              variant="outline-success" 
              size="sm"
              onClick={handleUseAsNewCustomer}
            >
              Edit Details
            </Button>
          </div>

          {/* Address Selection for Existing Customer */}
          <div className="mb-3">
            <Form.Label>
              <MapPin size={16} className="me-1" />
              Select Delivery Address *
            </Form.Label>
            <Select
              value={createAddressOptions(selectedCustomer).find(option => option.value === selectedAddressValue) || null}
              onChange={handleAddressSelect}
              options={createAddressOptions(selectedCustomer)}
              placeholder={
                createAddressOptions(selectedCustomer).length === 0
                  ? "No addresses available - customer needs to add an address"
                  : "Select delivery address..."
              }
              isClearable
              isSearchable
              isDisabled={createAddressOptions(selectedCustomer).length === 0}
              className={validationErrors.selectedCustomerAddressCode ? 'is-invalid' : ''}
              styles={{
                control: (base, state) => ({
                  ...base,
                  backgroundColor: '#F5E6D8',
                  borderColor: validationErrors.selectedCustomerAddressCode ? '#dc3545' : base.borderColor,
                  '&:hover': {
                    borderColor: validationErrors.selectedCustomerAddressCode ? '#dc3545' : base.borderColor,
                  }
                })
              }}
            />
            {validationErrors.selectedCustomerAddressCode && (
              <div className="invalid-feedback d-block">
                {validationErrors.selectedCustomerAddressCode}
              </div>
            )}
            {createAddressOptions(selectedCustomer).length === 0 && (
              <Form.Text className="text-warning">
                <i className="feather-alert-triangle me-1"></i>
                This customer has no saved addresses. Please contact the customer to add delivery addresses.
              </Form.Text>
            )}
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      <AddCustomerModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddNewCustomer}
        currentUserId={user?.UserID || user?.userID || user?.userCode}
      />
    </>
  );
};

export default CustomerSelector;
