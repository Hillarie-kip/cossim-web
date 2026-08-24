"use client";
///@ts-check
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Package, User, MapPin, Plus, Trash2 } from "feather-icons-react";
import { Form, Row, Col, Card, Button, Alert, Spinner, Modal, Tabs, Tab } from 'react-bootstrap';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import Link from '@/components/Link';
import { all_routes } from '@/Router/all_routes';
import { useShipment } from '@/hooks/useShipment';
import { useFinance } from '@/hooks/useFinance';
import { useAdmin } from '@/hooks/useAdmin';
import { useVendors } from '@/hooks/useVendors';
import { useVendorProducts } from '@/hooks/useVendorProducts';
import { useVendorStores } from '@/hooks/useVendorStores';
import { useAuth } from '@/contexts/AuthContext';
import PaymentStep from '@/components/PaymentStep';
import '@/style/css/create-package.css';
import notify from '@/lib/toast';
import { getSelectedDC } from '@/services/dcService';

const loadGooglePlaces = () => {
  if (window.google?.maps?.places) return Promise.resolve(true);
  if (window.__cossimGooglePlacesPromise) return window.__cossimGooglePlacesPromise;
  const key = String(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();
  if (!key) return Promise.resolve(false);
  window.__cossimGooglePlacesPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.cossimGoogleMaps = 'true';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Google Places could not be loaded.'));
    document.head.appendChild(script);
  });
  return window.__cossimGooglePlacesPromise;
};

const getPlacePart = (place, type) =>
  place.address_components?.find((part) => part.types.includes(type))?.long_name || '';

const CreatePackageForm = ({ backRoute = '', showBadges = false, showVendorInput = false, embedded = false, onClose, onComplete }) => {
  const route = all_routes;
  const router = useRouter();
  const { user } = useAuth();

  // Step management
  const [currentStep, setCurrentStep] = useState('form'); // 'form' or 'payment'
  const [orderResponse, setOrderResponse] = useState(null);

  const {
    deliveryTypes,
    loading,
    error,
    handleCreateShipmentOrder,
    fetchDeliveryTypes,
  } = useShipment();

  const {
    activeRate,
    loading: rateLoading,
    error: rateError,
    fetchActiveShipmentRate,
  } = useFinance();

  const {
    distributionCenters,
    fetchDistributionCenters
  } = useAdmin();

  const [vendorParams, setVendorParams] = useState({});
  const { vendors, loading: vendorsLoading, error: vendorsError, fetchVendors } = useVendors(vendorParams);

  // Vendor products hook - will be used when vendor is selected
  const [vendorProductsParams, setVendorProductsParams] = useState({});
  const {
    vendorProducts,
    loading: vendorProductsLoading,
    error: vendorProductsError,
    fetchVendorProducts
  } = useVendorProducts(vendorProductsParams);

  // Vendor stores hook - populates the pickup store options for the selected vendor
  const [vendorStoresParams, setVendorStoresParams] = useState({});
  const {
    vendorStores,
    loading: vendorStoresLoading,
    error: vendorStoresError,
    fetchVendorStores,
  } = useVendorStores(vendorStoresParams);

  const [formData, setFormData] = useState({
    // Vendor Selection
    selectedVendor: null,
    vendorStoreCode: '',

    // Sender Information
    senderCompanyName: '',
    senderContactName: '',
    senderContactEmail: '',
    senderContactPhone: '',
    senderApartment: '',
    senderArea: '',
    senderBuilding: '',
    senderCity: '',
    senderCountryIsoCode: 'KE',
    senderLatitude: '',
    senderLongitude: '',
    senderPostalCode: '',
    senderStreetName: '',
    senderPickupStartTime: '',
    senderPickupEndTime: '',

    // Receiver Information
    receiverCompanyName: '',
    receiverContactName: '',
    receiverContactEmail: '',
    receiverContactPhone: '',
    receiverApartment: '',
    receiverArea: '',
    receiverBuilding: '',
    receiverCity: '',
    receiverCountryIsoCode: 'KE',
    receiverLatitude: '',
    receiverLongitude: '',
    receiverPostalCode: '',
    receiverStreetName: '',
    receiverDeliveryStartTime: '',
    receiverDeliveryEndTime: '',

    // Shipment Details
    deliveryTypeCode: '',
    originDCCode: '',
    destinationDCCode: '',
    shipmentSize: '',
    cashOnDelivery: false,
    codAmount: '',
    hasPickUp: true,
    notes: '',
    pickupETA: '',
    deliveryETA: '',

    // Additional Fee
    feeType: 'additional fee', // 'discount' or 'additional fee'
    additionalFeeAmount: '',

    // Terms and Conditions
    agreeToTerms: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [roadDistance, setRoadDistance] = useState(null);
  const [roadDistanceStatus, setRoadDistanceStatus] = useState('idle');
  const receiverStreetRef = useRef(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [shippingRate, setShippingRate] = useState(null);
  const [rateCalculating, setRateCalculating] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  useEffect(() => {
    if (!receiverStreetRef.current) return undefined;
    let active = true;
    let listener;

    loadGooglePlaces().then((placesAvailable) => {
      if (!placesAvailable || !active || !receiverStreetRef.current) return;
      const autocomplete = new window.google.maps.places.Autocomplete(receiverStreetRef.current, {
        componentRestrictions: { country: 'ke' },
        fields: ['address_components', 'formatted_address', 'geometry', 'name'],
        types: ['geocode'],
      });

      listener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return;
        setFormData((current) => ({
          ...current,
          receiverStreetName: place.formatted_address || place.name || current.receiverStreetName,
          receiverCity: getPlacePart(place, 'locality') || getPlacePart(place, 'administrative_area_level_2') || current.receiverCity,
          receiverArea: getPlacePart(place, 'sublocality_level_1') || getPlacePart(place, 'neighborhood') || current.receiverArea,
          receiverPostalCode: getPlacePart(place, 'postal_code') || current.receiverPostalCode,
          receiverLatitude: String(place.geometry.location.lat()),
          receiverLongitude: String(place.geometry.location.lng()),
        }));
        setValidationErrors((current) => ({ ...current, receiverCity: '' }));
      });
    }).catch(() => {});

    return () => {
      active = false;
      if (listener) window.google?.maps?.event?.removeListener(listener);
    };
  }, []);

  useEffect(() => {
    const sortingArea = distributionCenters.find((dc) => dc.DCCode === formData.originDCCode);
    const rawOriginLat = sortingArea?.Latitude ?? sortingArea?.latitude;
    const rawOriginLng = sortingArea?.Longitude ?? sortingArea?.longitude;
    const originLat = rawOriginLat === null || rawOriginLat === undefined || rawOriginLat === '' ? null : Number(rawOriginLat);
    const originLng = rawOriginLng === null || rawOriginLng === undefined || rawOriginLng === '' ? null : Number(rawOriginLng);
    const destinationLat = Number(formData.receiverLatitude);
    const destinationLng = Number(formData.receiverLongitude);

    if (!formData.originDCCode || !formData.receiverLatitude || !formData.receiverLongitude) {
      setRoadDistance(null);
      setRoadDistanceStatus('idle');
      return;
    }

    let active = true;
    setRoadDistance(null);
    setRoadDistanceStatus('loading');

    loadGooglePlaces().then(async (available) => {
      if (!available || !window.google?.maps || !active) throw new Error('Google Maps is unavailable');

      let origin = Number.isFinite(originLat) && Number.isFinite(originLng)
        ? { lat: originLat, lng: originLng }
        : null;

      if (!origin) {
        const address = [sortingArea?.DCName, sortingArea?.AddressLine1, sortingArea?.CityName, sortingArea?.Region, 'Kenya'].filter(Boolean).join(', ');
        origin = await new Promise((resolve, reject) => {
          new window.google.maps.Geocoder().geocode({ address }, (results, status) => {
            const location = results?.[0]?.geometry?.location;
            if (status === 'OK' && location) resolve({ lat: location.lat(), lng: location.lng() });
            else reject(new Error(`Sorting area location could not be resolved (${status})`));
          });
        });
      }

      const result = await new Promise((resolve, reject) => {
        new window.google.maps.DistanceMatrixService().getDistanceMatrix({
          origins: [origin],
          destinations: [{ lat: destinationLat, lng: destinationLng }],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
        }, (response, status) => {
          const element = response?.rows?.[0]?.elements?.[0];
          if (status === 'OK' && element?.status === 'OK' && element.distance) resolve(element);
          else reject(new Error(element?.status || status || 'Distance unavailable'));
        });
      });

      if (!active) return;
      setRoadDistance({ text: result.distance.text, kilometers: Number((result.distance.value / 1000).toFixed(1)) });
      setRoadDistanceStatus('ready');
    }).catch((distanceError) => {
      if (!active) return;
      setRoadDistance(null);
      setRoadDistanceStatus(distanceError.message || 'Distance unavailable');
    });

    return () => { active = false; };
  }, [distributionCenters, formData.originDCCode, formData.receiverLatitude, formData.receiverLongitude]);

  // Product selection state
  const [itemEntryMode, setItemEntryMode] = useState('manual'); // 'manual' or 'select'
  const [selectedProduct, setSelectedProduct] = useState(null);

  // New item form state
  const [newItemData, setNewItemData] = useState({
    productName: '',
    description: '',
    weight: '',
    isFragile: false,
    isPerishable: false,
    productValue: '',
    remarks: '',
    quantity: 1
  });

  const [newItemErrors, setNewItemErrors] = useState({});

  // Create options for Select components
  const dcOptions = distributionCenters.map((dc) => ({
    value: dc.DCCode,
    label: `${dc.DCName} (${dc.DCCode})`
  }));

  // Note: GetVendorStoreModel declares PascalCase C# properties, so the API
  // returns PascalCase JSON keys here (unlike the vendor product DTO, which is camelCase).
  const storeOptions = vendorStores.map((store) => ({
    value: store.VendorStoreCode,
    label: `${store.VendorStoreName} (${store.VendorStoreCode})`,
    store
  }));

  useEffect(() => {
    fetchDeliveryTypes();
    fetchDistributionCenters();
  }, []);

  // Calculate shipping rate when route and delivery type are available
  const calculateShippingRate = async (fromDC, toDC, deliveryType) => {
    if (!fromDC || !toDC || !deliveryType) {
      setShippingRate(null);
      return;
    }

    try {
      setRateCalculating(true);
      const rateParams = {
        fromDCCode: fromDC,
        toDCCode: toDC,
        deliveryTypeCode: deliveryType
      };

      const response = await fetchActiveShipmentRate(rateParams);
      
      if (response?.Data) {
        setShippingRate(response.Data);
        notify.success(`Shipping rate calculated: KES ${response.Data.RateAmount}`);
      } else {
        setShippingRate(null);
        notify.warning('No shipping rate found for this route and delivery type');
      }
    } catch (error) {
      setShippingRate(null);
      notify.error('Failed to calculate shipping rate');
    } finally {
      setRateCalculating(false);
    }
  };

  useEffect(() => {
    // Get vendor DC code (from manually entered, selected vendor, or user's assigned vendor)
    const fromDC = formData.originDCCode || (showVendorInput 
      ? formData.selectedVendor?.vendor?.defaultDCCode 
      : user?.AssignedVendor?.DefaultDCCode);

    // Use manually entered destination DC code
    const toDC = formData.destinationDCCode;
    
    const deliveryType = formData.deliveryTypeCode;

    if (fromDC && toDC && deliveryType) {
      calculateShippingRate(fromDC, toDC, deliveryType);
    } else {
      setShippingRate(null);
    }
  }, [
    formData.originDCCode,
    formData.selectedVendor,
    user?.AssignedVendor?.DefaultDCCode,
    formData.destinationDCCode,
    formData.deliveryTypeCode,
    showVendorInput
  ]);

  // Fetch vendor products when vendor is selected
  useEffect(() => {
    const vendorCode = showVendorInput 
      ? formData.selectedVendor?.vendor?.vendorCode 
      : user?.AssignedVendor?.VendorCode;

    if (vendorCode) {
      setVendorProductsParams({
        vendorCode,
        pageNo: 1,
        pageSize: 100 // Fetch more products for selection
      });
    } else {
      // Clear products when no vendor is selected
      setVendorProductsParams({});
    }
  }, [formData.selectedVendor, user?.AssignedVendor?.VendorCode, showVendorInput]);

  // Fetch products when params change
  useEffect(() => {
    if (vendorProductsParams.vendorCode) {
      fetchVendorProducts(vendorProductsParams);
    }
  }, [JSON.stringify(vendorProductsParams), fetchVendorProducts]);

  // Fetch vendor stores when the vendor changes, and reset any previously
  // selected store since it belonged to a different vendor
  const activeVendorCode = showVendorInput
    ? formData.selectedVendor?.vendor?.vendorCode
    : user?.AssignedVendor?.VendorCode;

  useEffect(() => {
    if (activeVendorCode) {
      setVendorStoresParams({
        vendorCode: activeVendorCode,
        pageNo: 1,
        pageSize: 100
      });
    } else {
      setVendorStoresParams({});
    }
    setFormData(prev => ({ ...prev, vendorStoreCode: '' }));
  }, [activeVendorCode]);

  // Fetch stores when params change
  useEffect(() => {
    if (vendorStoresParams.vendorCode) {
      fetchVendorStores(vendorStoresParams);
    }
  }, [JSON.stringify(vendorStoresParams), fetchVendorStores]);

  // Auto-select the pickup store when the vendor only has one
  useEffect(() => {
    if (vendorStores.length === 1 && !formData.vendorStoreCode) {
      setFormData(prev => ({ ...prev, vendorStoreCode: vendorStores[0].VendorStoreCode }));
    }
  }, [vendorStores]); // eslint-disable-line react-hooks/exhaustive-deps

  // Populate sender information from vendor when vendor is selected or on mount
  useEffect(() => {
    const vendor = showVendorInput 
      ? formData.selectedVendor?.vendor 
      : user?.AssignedVendor;

    console.log('Populating sender info from vendor:', vendor);

    if (vendor) {
      setFormData(prev => ({
        ...prev,
        senderCompanyName: prev.senderCompanyName || vendor.VendorName || vendor.vendorName || '',
        senderContactName: prev.senderContactName || vendor.contactName || vendor.VendorName || '',
        senderContactEmail: prev.senderContactEmail || vendor.emailAddress || vendor.EmailAddress || '',
        senderContactPhone: prev.senderContactPhone || vendor.phoneNumber || vendor.PhoneNumber || '',
        originDCCode: prev.originDCCode || vendor.DefaultDCCode || vendor.defaultDCCode || '',
      }));
    }
  }, [formData.selectedVendor, user?.AssignedVendor, showVendorInput]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle Select changes for DC codes
  const handleOriginDCChange = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      originDCCode: selectedOption ? selectedOption.value : ''
    }));

    // Clear validation error
    if (validationErrors.originDCCode) {
      setValidationErrors(prev => ({
        ...prev,
        originDCCode: ''
      }));
    }
  };

  const handleNewItemChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewItemData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear validation error
    if (newItemErrors[name]) {
      setNewItemErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleProductSelect = (selectedOption) => {
    if (!selectedOption) {
      setSelectedProduct(null);
      setNewItemData((current) => ({ ...current, productName: '' }));
      return;
    }

    const product = vendorProducts.find(p => p.vendorProductCode === selectedOption.value);
    if (product) {
      setSelectedProduct(product);
      
      // Populate form with product data
      setNewItemData({
        productName: product.vendorProductName || '',
        description: product.description || product.vendorProductName || '',
        weight: '', 
        isFragile: product.isFragile || false,
        isPerishable: product.isPerishable || false,
        productValue: product.currentPrice || product.productValue || '',
        remarks: '',
        quantity: 1
      });
    } else {
      setSelectedProduct(null);
      setNewItemData((current) => ({ ...current, productName: selectedOption.label || selectedOption.value || '' }));
    }
    setNewItemErrors((current) => ({ ...current, productName: '' }));
  };

  // Handle switching between manual entry and product selection
  const handleEntryModeChange = (mode) => {
    setItemEntryMode(mode);
    if (mode === 'manual') {
      setSelectedProduct(null);
      // Reset form to empty state
      setNewItemData({
        productName: '',
        description: '',
        weight: '',
        isFragile: false,
        isPerishable: false,
        productValue: '',
        remarks: '',
        quantity: 1
      });
    }
  };

  const validateNewItem = () => {
    const errors = {};

    if (!newItemData.productName.trim()) {
      errors.productName = 'Product name is required';
    }
   
    if (newItemData.weight && (isNaN(newItemData.weight) || parseFloat(newItemData.weight) < 0)) {
      errors.weight = 'Weight must be a valid positive number';
    }
    if (!newItemData.quantity || parseInt(newItemData.quantity) < 1) {
      errors.quantity = 'Quantity must be at least 1';
    }
    if (newItemData.productValue && (isNaN(newItemData.productValue) || parseFloat(newItemData.productValue) < 0)) {
      errors.productValue = 'Product value must be a valid positive number';
    }

    setNewItemErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddItem = () => {
    if (!validateNewItem()) {
      notify.error('Please fix the validation errors');
      return;
    }

    const newItem = {
      itemCode: selectedProduct?.vendorProductCode || '', 
      productName: newItemData.productName,
      description: newItemData.description,
      weight: newItemData.weight ? Number.parseFloat(newItemData.weight) : 0,
      quantity: Number.parseInt(newItemData.quantity) || 1,
      isFragile: newItemData.isFragile,
      isPerishable: newItemData.isPerishable,
      productValue: newItemData.productValue ? Number.parseFloat(newItemData.productValue) : 0,
      remarks: newItemData.remarks,
      vendorProductCode: selectedProduct?.vendorProductCode 
    };

    setOrderItems(prev => [...prev, newItem]);
    
    // Reset form
    setNewItemData({
      productName: '',
      description: '',
      weight: '',
      isFragile: false,
      isPerishable: false,
      productValue: '',
      remarks: '',
      quantity: 1
    });

    setShowAddItemModal(false);
    notify.success('Item added to package');
  };

  const handleRemoveItem = (index) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
    notify.success('Item removed from package');
  };

  const validateForm = () => {
    const errors = {};

    // Receiver contact validation
    if (!formData.receiverContactName.trim()) {
      errors.receiverContactName = 'Receiver contact name is required';
    }
    if (!formData.receiverContactPhone.trim()) {
      errors.receiverContactPhone = 'Receiver phone number is required';
    }

    // Delivery type validation
    if (!formData.deliveryTypeCode) {
      errors.deliveryTypeCode = 'Delivery type is required';
    }

    // DC codes validation
    if (!formData.originDCCode && !showVendorInput && !user?.AssignedVendor?.DefaultDCCode) {
      errors.originDCCode = 'Origin distribution center is required';
    }
    // Terms and conditions
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    // Package/Items validation
    if (orderItems.length === 0) {
      errors.orderItems = 'Please add at least one item to the package';
    }

    if (!formData.receiverStreetName.trim()) {
      errors.receiverStreetName = 'Delivery street is required';
    }

    if (!formData.shipmentSize) {
      errors.shipmentSize = 'Package size is required';
    }

    // Phone number validation
    if (formData.receiverContactPhone && !/^\+?[\d\s\-\(\)]+$/.test(formData.receiverContactPhone)) {
      errors.receiverContactPhone = 'Please enter a valid phone number';
    }

    // Email validation (if provided)
    if (formData.receiverContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.receiverContactEmail)) {
      errors.receiverContactEmail = 'Please enter a valid email address';
    }

    // Sender email validation (if provided)
    if (formData.senderContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.senderContactEmail)) {
      errors.senderContactEmail = 'Please enter a valid email address';
    }

    // COD amount validation
    if (formData.cashOnDelivery && (!formData.codAmount || parseFloat(formData.codAmount) <= 0)) {
      errors.codAmount = 'COD amount is required when Cash on Delivery is enabled';
    }

    // Additional fee amount validation
    if (formData.additionalFeeAmount && (isNaN(formData.additionalFeeAmount) || parseFloat(formData.additionalFeeAmount) < 0)) {
      errors.additionalFeeAmount = 'Additional fee amount must be a valid positive number';
    }

    // Vendor selection validation (if required)
    if (showVendorInput && !formData.selectedVendor) {
      errors.selectedVendor = 'Please select a vendor';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const advanceFormStep = () => {
    const errors = {};

    if (formStep === 0) {
      if (showVendorInput && !formData.selectedVendor) errors.selectedVendor = 'Please select a vendor';
      if (!formData.originDCCode && !user?.AssignedVendor?.DefaultDCCode) errors.originDCCode = 'Sorting area is required';
    } else if (formStep === 1) {
      if (!formData.receiverContactName.trim()) errors.receiverContactName = 'Receiver contact name is required';
      if (!formData.receiverContactPhone.trim()) errors.receiverContactPhone = 'Receiver phone number is required';
      if (!formData.receiverStreetName.trim()) errors.receiverStreetName = 'Delivery street is required';
      if (!formData.deliveryTypeCode) errors.deliveryTypeCode = 'Delivery type is required';
    } else if (formStep === 2) {
      if (!formData.shipmentSize) errors.shipmentSize = 'Package size is required';
      if (!orderItems.length) errors.orderItems = 'Please add at least one item to the package';
    }

    setValidationErrors((current) => ({ ...current, ...errors }));
    if (Object.keys(errors).length) {
      notify.error('Please complete the required fields');
      return;
    }
    setFormStep((step) => Math.min(3, step + 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      notify.error('Please fix the validation errors');
      return;
    }

    if (orderItems.length === 0) {
      notify.error('Please add at least one item to your package');
      return;
    }

    // Warn if no shipping rate is calculated
    if (!shippingRate && formData.deliveryTypeCode && formData.originDCCode && formData.destinationDCCode) {
      const proceed = window.confirm(
        'No shipping rate was found for this route and delivery type. Do you want to proceed anyway?'
      );
      if (!proceed) {
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Prepare order data according to the ShipmentOrderTx schema
      const additionalFeeAmount = Number.parseFloat(formData.additionalFeeAmount) || 0;
      const additionalFee = formData.feeType === 'discount' ? -additionalFeeAmount : additionalFeeAmount;

      // Get origin DC code - prioritize manually entered value
      const originDC = formData.originDCCode || (showVendorInput 
        ? formData.selectedVendor?.vendor?.defaultDCCode 
        : user?.AssignedVendor?.DefaultDCCode);

      const orderData = {
        // Vendor and DC codes
        vendorCode: formData.selectedVendor?.value || user?.AssignedVendor?.VendorCode,
        vendorStoreCode: formData.vendorStoreCode || '',
        deliveryTypeCode: formData.deliveryTypeCode,
        originDCCode: originDC,
        destinationDCCode: getSelectedDC() || '',
        AddedBy:user?.UserCode,
        // Shipping rate and fees
        shipmentRateNO: shippingRate?.ShipmentRateNO || '',
        serviceFee: shippingRate?.RateAmount || 0,
        additionalFee: additionalFee,
        
        // COD settings
        cashOnDeliveryRequired: formData.cashOnDelivery,
        cashOnDeliveryAmount: formData.cashOnDelivery ? Number.parseFloat(formData.codAmount) || 0 : 0,
        
        // Pickup and delivery
        hasPickUp: formData.hasPickUp,
        notes: formData.notes || '',
        pickupETA: formData.pickupETA || '',
        deliveryETA: formData.deliveryETA || '',
        
        // Order items
        orderItemsArray: orderItems,
        
        // Sender information
        senderCompanyName: formData.senderCompanyName || '',
        senderContactName: formData.senderContactName || '',
        senderContactEmail: formData.senderContactEmail || '',
        senderContactPhone: formData.senderContactPhone || '',
        shipmentSize: formData.shipmentSize || '',
        senderApartment: formData.senderApartment || '',
        senderArea: formData.senderArea || '',
        senderBuilding: formData.senderBuilding || '',
        senderCity: formData.senderCity || '',
        senderCountryIsoCode: formData.senderCountryIsoCode || '',
        senderLatitude: formData.senderLatitude || '',
        senderLongitude: formData.senderLongitude || '',
        senderPostalCode: formData.senderPostalCode || '',
        senderStreetName: formData.senderStreetName || '',
        senderPickupStartTime: formData.senderPickupStartTime || '',
        senderPickupEndTime: formData.senderPickupEndTime || '',
        
        // Receiver information
        receiverCompanyName: formData.receiverCompanyName || '',
        receiverContactName: formData.receiverContactName,
        receiverContactEmail: formData.receiverContactEmail || '',
        receiverContactPhone: formData.receiverContactPhone,
        receiverApartment: formData.receiverApartment || '',
        receiverArea: formData.receiverArea || '',
        receiverBuilding: formData.receiverBuilding || '',
        receiverCity: formData.receiverCity,
        receiverCountryIsoCode: formData.receiverCountryIsoCode || '',
        receiverLatitude: formData.receiverLatitude || '',
        receiverLongitude: formData.receiverLongitude || '',
        receiverPostalCode: formData.receiverPostalCode || '',
        receiverStreetName: formData.receiverStreetName || '',
        receiverDeliveryStartTime: formData.receiverDeliveryStartTime || '',
        receiverDeliveryEndTime: formData.receiverDeliveryEndTime || ''
      };

      const response = await handleCreateShipmentOrder(orderData);

      if (response.Error) {
        notify.error(response.Message || 'Failed to create package');
        return;
      }

      // Success - Store order response and move to payment step
      setOrderResponse({
        ...response,
        totalAmount: (shippingRate?.RateAmount || 0) + additionalFee,
        isCashOnDelivery: formData.cashOnDelivery
      });
      setCurrentStep('payment');
      notify.success('Package created successfully! Please proceed with payment.');

    } catch (error) {
      notify.error(error.message || 'Failed to create package');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentComplete = (paymentData) => {
    // Reset form and redirect
    setFormData({
      selectedVendor: null,
      vendorStoreCode: '',
      senderCompanyName: '',
      senderContactName: '',
      senderContactEmail: '',
      senderContactPhone: '',
      senderApartment: '',
      senderArea: '',
      senderBuilding: '',
      senderCity: '',
      senderCountryIsoCode: 'KE',
      senderLatitude: '',
      senderLongitude: '',
      senderPostalCode: '',
      senderStreetName: '',
      senderPickupStartTime: '',
      senderPickupEndTime: '',
      receiverCompanyName: '',
      receiverContactName: '',
      receiverContactEmail: '',
      receiverContactPhone: '',
      receiverApartment: '',
      receiverArea: '',
      receiverBuilding: '',
      receiverCity: '',
      receiverCountryIsoCode: 'KE',
      receiverLatitude: '',
      receiverLongitude: '',
      receiverPostalCode: '',
      receiverStreetName: '',
      receiverDeliveryStartTime: '',
      receiverDeliveryEndTime: '',
      deliveryTypeCode: '',
      originDCCode: '',
      destinationDCCode: '',
      shipmentSize: '',
      cashOnDelivery: false,
      codAmount: '',
      hasPickUp: true,
      notes: '',
      pickupETA: '',
      deliveryETA: '',
      feeType: 'additional fee',
      additionalFeeAmount: '',
    agreeToTerms: true
    });
    setOrderItems([]);
    setOrderResponse(null);
    setCurrentStep('form');

    notify.success('Order completed successfully!');
    if (embedded) {
      onComplete?.(paymentData);
      return;
    }
    router.push(backRoute);
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
  };

  // If we're on the payment step, render PaymentStep component
  if (currentStep === 'payment' && orderResponse) {
    return (
      <PaymentStep
        orderData={orderResponse}
        totalAmount={orderResponse.totalAmount}
        isServiceFeeMandatory={orderResponse.IsServiceFeeMandatory}
        onPaymentComplete={handlePaymentComplete}
        onBack={handleBackToForm}
      />
    );
  }

  return (
    <div className="create-package-wrapper">
      <div className="content create-package-form">
        {/* Page Header */}
        <div className={`page-header ${embedded ? "mb-3" : ""}`}>
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Create New Package</h4>
              <h6>Fill in the details to create a new package for delivery</h6>
            </div>
          </div>
          <div className="page-btn">
            {embedded ? <Button type="button" variant="outline-primary" onClick={onClose}>
              <ArrowLeft className="me-2" size={16} />
              Back to Packages
            </Button> : <Link to={backRoute} className="btn btn-outline-primary">
              <ArrowLeft className="me-2" size={16} />
              Back to Packages
            </Link>}
          </div>
        </div>

        <nav className="package-stepper" aria-label="Package creation progress">
          {[
            ['Vendor & Route', 'Store, sorting area'],
            ['Receiver', 'Contact, address'],
            ['Package', 'Items, size, fees'],
            ['Review', 'Confirm & create'],
          ].map(([label, subtitle], index) => {
            const StepIcon = [User, MapPin, Package, Check][index];
            return (
            <button
              key={label}
              type="button"
              className={index === formStep ? 'active' : index < formStep ? 'complete' : ''}
              onClick={() => index < formStep && setFormStep(index)}
              aria-current={index === formStep ? 'step' : undefined}
            >
              <span><StepIcon size={17} /></span>
              <div><strong>{label}</strong><small>{subtitle}</small></div>
            </button>
            );
          })}
        </nav>

        {/* Main Form */}
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col lg={8}>
              {/* Customer Information */}
              <Card className={`mb-4 create-package-step-card ${formStep <= 1 ? '' : 'd-none'}`}>
                <Card.Header>
                  <div className="d-flex align-items-center">
                    <User className="me-2 text-primary" size={20} />
                    <div><h5 className="mb-0">{formStep === 0 ? 'Vendor & Route' : 'Receiver Information'}</h5><small>{formStep === 0 ? 'Who this package is being shipped for, and where it starts its journey.' : "Who's receiving the package, and where it's headed."}</small></div>
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className={formStep === 0 ? '' : 'd-none'}>
                   {/* Vendor Selection */}
                  {showVendorInput && (
                    <div className="mb-3">
                      <Form.Label>Vendor*</Form.Label>
                      <Select
                        name="selectedVendor"
                        value={formData.selectedVendor}
                        onChange={(selectedOption) => {
                          setFormData(prev => ({ ...prev, selectedVendor: selectedOption }));
                        }}
                        onInputChange={(inputValue) => {
                          if (inputValue) {
                            setVendorParams({ searchTerm: inputValue });
                          } else {
                            setVendorParams({});
                          }
                        }}
                        options={Array.isArray(vendors) ? vendors.map(vendor => ({
                          value: vendor.vendorCode,
                          label: vendor.vendorName,
                          vendor: vendor
                        })) : []}
                        placeholder="Search and select vendor..."
                        isClearable
                        isSearchable
                        isLoading={vendorsLoading}
                        className={validationErrors.selectedVendor ? 'is-invalid' : ''}
                        styles={{
                          control: (base, state) => ({
                            ...base,
                            backgroundColor: '#F5F6F4',
                            borderColor: validationErrors.selectedVendor ? '#dc3545' : base.borderColor,
                            '&:hover': {
                              borderColor: validationErrors.selectedVendor ? '#dc3545' : base.borderColor,
                            }
                          })
                        }}
                      />
                      {validationErrors.selectedVendor && (
                        <div className="invalid-feedback d-block">
                          {validationErrors.selectedVendor}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Store Selection */}
                  <div className="mb-3">
                    <Form.Label>Store</Form.Label>
                    <Select
                      name="vendorStoreCode"
                      value={storeOptions.find(option => option.value === formData.vendorStoreCode) || null}
                      onChange={(selectedOption) => {
                        setFormData(prev => ({
                          ...prev,
                          vendorStoreCode: selectedOption ? selectedOption.value : ''
                        }));
                      }}
                      options={storeOptions}
                      placeholder={
                        !activeVendorCode
                          ? (showVendorInput ? 'Select a vendor first...' : 'Loading store...')
                          : 'Search and select store...'
                      }
                      isClearable
                      isSearchable
                      isLoading={vendorStoresLoading}
                      isDisabled={!activeVendorCode || !storeOptions.length}
                      styles={{
                        control: (base) => ({
                          ...base,
                          backgroundColor: '#F5F6F4',
                        })
                      }}
                    />
                    <Form.Text className="text-muted">
                      {activeVendorCode && !vendorStoresLoading && storeOptions.length === 0
                        ? 'This vendor has no stores set up yet.'
                        : 'The vendor store this package belongs to.'}
                    </Form.Text>
                    {vendorStoresError && (
                      <div className="text-danger small mt-1">
                        Error loading stores: {vendorStoresError}
                      </div>
                    )}
                  </div>

                  {/* Sorting area */}
                  <div className="mb-4">
                    <Row>
                      <Col md={12} className="mb-3">
                        <Form.Label>Sorting Area</Form.Label>
                        <Select
                          name="originDCCode"
                          value={dcOptions.find(option => option.value === formData.originDCCode) || null}
                          onChange={handleOriginDCChange}
                          options={dcOptions}
                          placeholder="Select sorting area..."
                          isClearable
                          isSearchable
                          className={validationErrors.originDCCode ? 'is-invalid' : ''}
                          styles={{
                            control: (provided, state) => ({
                              ...provided,
                              backgroundColor: '#F5F6F4',
                              borderColor: validationErrors.originDCCode ? '#dc3545' : provided.borderColor,
                              '&:hover': {
                                borderColor: validationErrors.originDCCode ? '#dc3545' : provided.borderColor,
                              },
                            }),
                          }}
                        />
                        {validationErrors.originDCCode && (
                          <div className="invalid-feedback d-block">
                            {validationErrors.originDCCode}
                          </div>
                        )}
                        <Form.Text className="text-muted">
                          Sorting area responsible for this package
                        </Form.Text>
                      </Col>
                    </Row>
                  </div>

                  </div>

                  {/* Receiver Information Section */}
                  <div className={formStep === 1 ? 'mb-4' : 'd-none'}>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Label>Receiver Contact Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="receiverContactName"
                          placeholder="Enter receiver name"
                          value={formData.receiverContactName}
                          onChange={handleInputChange}
                          isInvalid={!!validationErrors.receiverContactName}
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.receiverContactName}
                        </Form.Control.Feedback>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Label>Receiver Phone Number *</Form.Label>
                        <Form.Control
                          type="tel"
                          name="receiverContactPhone"
                          placeholder="e.g., +254712345678"
                          value={formData.receiverContactPhone}
                          onChange={handleInputChange}
                          isInvalid={!!validationErrors.receiverContactPhone}
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.receiverContactPhone}
                        </Form.Control.Feedback>
                      </Col>
                    </Row>

                    {/* Receiver Address */}
                    <h6 className="mb-3 mt-2">Delivery Address</h6>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Label>Street *</Form.Label>
                        <Form.Control
                          ref={receiverStreetRef}
                          type="text"
                          name="receiverStreetName"
                          placeholder="Search for a street or place"
                          value={formData.receiverStreetName}
                          onChange={handleInputChange}
                          autoComplete="off"
                          isInvalid={!!validationErrors.receiverStreetName}
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.receiverStreetName}
                        </Form.Control.Feedback>
                        <Form.Text className="place-search-hint">Powered by Google Places. Select a suggestion to calculate the driving distance.</Form.Text>
                        {roadDistanceStatus === 'loading' && <div className="road-distance-chip loading"><Spinner size="sm" /> Calculating road distance...</div>}
                        {roadDistanceStatus === 'ready' && roadDistance && <div className="road-distance-chip"><MapPin size={13} /> {roadDistance.text} by road</div>}
                        {roadDistanceStatus !== 'idle' && roadDistanceStatus !== 'loading' && roadDistanceStatus !== 'ready' && (
                          <div className="road-distance-chip unavailable">Road distance unavailable. Check the sorting area coordinates and Google Distance Matrix access.</div>
                        )}
                      </Col>
                      <Col md={6} className="mb-3">
                       <Form.Label>Package Delivery Type *</Form.Label>
                      <Form.Select
                        name="deliveryTypeCode"
                        value={formData.deliveryTypeCode}
                        onChange={handleInputChange}
                        isInvalid={!!validationErrors.deliveryTypeCode}
                      >
                        <option value="">Select Delivery Type</option>
                        {Array.isArray(deliveryTypes) && deliveryTypes.map((type) => (
                          <option key={type.DeliveryTypeCode} value={type.DeliveryTypeCode}>
                            {type.DeliveryTypeName}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.deliveryTypeCode}
                      </Form.Control.Feedback>
                      </Col>
                    </Row>
                  </div>

                
                </Card.Body>
              </Card>

              {/* Package Details */}
              <Card className={`mb-4 create-package-step-card ${formStep === 2 ? '' : 'd-none'}`}>
                <Card.Header>
                  <div className="d-flex align-items-center">
                    <Package className="me-2 text-primary" size={20} />
                    <div><h5 className="mb-0">Package Details</h5><small>What's inside, how big it is, and any extra charges.</small></div>
                  </div>
                </Card.Header>
                <Card.Body>
                  {/* Multiple Items Management */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Form.Label className="mb-0">Package Items</Form.Label>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => setShowAddItemModal(true)}
                        >
                          <Plus size={14} className="me-1" />
                          Add Item
                        </Button>
                      </div>

                      {validationErrors.orderItems && (
                        <div className="invalid-feedback d-block mb-2">
                          {validationErrors.orderItems}
                        </div>
                      )}

                      {orderItems.length === 0 ? (
                        <div className="text-center py-4 border rounded">
                          <Package size={32} className="text-muted mb-2" />
                          <div className="text-muted">No items added yet</div>
                          <small className="text-muted">Click "Add Item" to add items to your package</small>
                        </div>
                      ) : (
                        <div className="items-list">
                          {orderItems.map((item, index) => (
                            <div key={index} className="item-card border rounded p-3 mb-2">
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                  <div className="d-flex align-items-center mb-1">
                                    <strong>{item.productName}</strong>
                                    {showBadges && (
                                      <div className="ms-2">
                                        {item.isFragile && (
                                          <span className="badge bg-warning me-1">Fragile</span>
                                        )}
                                        {item.isPerishable && (
                                          <span className="badge bg-info me-1">Perishable</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-muted small mb-1">{item.description}</div>
                                  <div className="text-muted small">
                                    <span className="me-3">Weight: {item.weight ? `${item.weight}kg` : 'Not specified'}</span>
                                    {item.productValue > 0 && (
                                      <span className="me-3">Value: KES {item.productValue.toFixed(2)}</span>
                                    )}
                                  </div>
                                  {item.remarks && (
                                    <div className="text-muted small mt-1">
                                      <em>Remarks: {item.remarks}</em>
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleRemoveItem(index)}
                                  title="Remove Item"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </div>
                          ))}
                          
                          <div className="mt-2 text-muted small">
                            Total Items: {orderItems.length} | 
                            Total Weight: {orderItems.reduce((sum, item) => sum + (item.weight || 0), 0).toFixed(2)}kg |
                            Total Value: KES {orderItems.reduce((sum, item) => sum + item.productValue, 0).toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>

                  {/* Package Guidelines */}
                  <div className="mb-3 package-guideline-banners">
                    <div className="d-flex align-items-center text-success mb-1 guideline-ok">
                      <i className="feather-check-circle me-2" style={{ fontSize: '14px' }}></i>
                      <small><strong>Weight Limit:</strong> We handle packages up to 5kg</small>
                    </div>
                    <div className="d-flex align-items-center text-info mb-1 guideline-info">
                      <i className="feather-info me-2" style={{ fontSize: '14px' }}></i>
                      <small><strong>Examples:</strong> Laptop, books, shoes, small electronics, documents</small>
                    </div>
                    <div className="d-flex align-items-center text-danger mb-3 guideline-warn">
                      <i className="feather-x-circle me-2" style={{ fontSize: '14px' }}></i>
                      <small><strong>Not suitable:</strong> Heavy machinery, large furniture, bulk items</small>
                    </div>
                  </div>

                  <div className="mb-4 mt-3">
                    <Form.Label>Package Size *</Form.Label>
                    <div className={`package-size-picker ${validationErrors.shipmentSize ? 'is-invalid' : ''}`}>
                      {Object.entries({ SMALL: 'up to 1kg', MEDIUM: '1-3kg', LARGE: '3-5kg' }).map(([size, meta]) => (
                        <button key={size} type="button" className={formData.shipmentSize === size ? 'active' : ''}
                          onClick={() => setFormData((previous) => ({ ...previous, shipmentSize: size }))}
                          aria-pressed={formData.shipmentSize === size}>
                          <strong>{size.charAt(0) + size.slice(1).toLowerCase()}</strong>
                          <small>{meta}</small>
                        </button>
                      ))}
                    </div>
                    {validationErrors.shipmentSize && <div className="invalid-feedback d-block">{validationErrors.shipmentSize}</div>}
                  </div>


                  {/* Cash on Delivery */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center justify-content-between p-3 border rounded cod-toggle-row">
                      <div>
                        <h6 className="mb-1">Cash on Delivery (COD)</h6>
                        <small className="text-muted">Enable if payment should be collected upon delivery</small>
                      </div>
                      <Form.Check
                        type="switch"
                        id="cash-on-delivery"
                        name="cashOnDelivery"
                        checked={formData.cashOnDelivery}
                        onChange={handleInputChange}
                        className="custom-switch"
                      />
                    </div>

                    {formData.cashOnDelivery && (
                      <div className="mt-3">
                        <Form.Label>COD Amount</Form.Label>
                        <div className="input-group">
                          <span className="input-group-text">KES</span>
                          <Form.Control
                            type="number"
                            placeholder="0.00"
                            name="codAmount"
                            value={formData.codAmount}
                            onChange={handleInputChange}
                            isInvalid={!!validationErrors.codAmount}
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.codAmount}
                        </Form.Control.Feedback>
                      </div>
                    )}
                  </div>

                  {/* Additional Fee */}
                  <div className="mb-3">
                    <div className="p-3 border rounded additional-fee-panel">
                      <h6 className="mb-3">Additional Fee</h6>
                      <Row>
                        <Col md={6}>
                          <Form.Label>Fee Type</Form.Label>
                          <Form.Select
                            name="feeType"
                            value={formData.feeType}
                            onChange={handleInputChange}
                          >
                            <option value="additional fee">Additional Fee</option>
                            <option value="discount">Discount</option>
                          </Form.Select>
                        </Col>
                        <Col md={6}>
                          <Form.Label>Amount</Form.Label>
                          <div className="input-group">
                            <span className="input-group-text">KES</span>
                            <Form.Control
                              type="number"
                              placeholder="0.00"
                              name="additionalFeeAmount"
                              value={formData.additionalFeeAmount}
                              onChange={handleInputChange}
                              isInvalid={!!validationErrors.additionalFeeAmount}
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <Form.Control.Feedback type="invalid">
                            {validationErrors.additionalFeeAmount}
                          </Form.Control.Feedback>
                        </Col>
                      </Row>
                      <small className="text-muted mt-2 d-block">
                        {formData.feeType === 'discount' 
                          ? 'This amount will be deducted from the total cost' 
                          : 'This amount will be added to the total cost'
                        }
                      </small>
                    </div>
                  </div>

                  <div className="mb-3">
                    <Form.Label>Additional Notes (Optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Any special instructions or information about the package..."
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                    />
                  </div>
                </Card.Body>
              </Card>
              
              {/* Terms and Conditions */}
              <Card className={`mb-4 create-package-step-card ${formStep === 3 ? '' : 'd-none'}`}>
                <Card.Header><div><h5 className="mb-0">Review &amp; Confirm</h5><small>Check everything before this package hits the road.</small></div></Card.Header>
                <Card.Body>
                  <div className="review-sections mb-4">
                    <section>
                      <header><h6>Vendor &amp; Route</h6><button type="button" onClick={() => setFormStep(0)}>Edit</button></header>
                      <div className="review-grid">
                        <div><small>Vendor</small><strong>{formData.selectedVendor?.label || user?.AssignedVendor?.VendorName || 'Current vendor'}</strong></div>
                        <div><small>Sorting area</small><strong>{dcOptions.find((option) => option.value === formData.originDCCode)?.label || formData.originDCCode}</strong></div>
                      </div>
                    </section>
                    <section>
                      <header><h6>Receiver</h6><button type="button" onClick={() => setFormStep(1)}>Edit</button></header>
                      <div className="review-grid">
                        <div><small>Recipient</small><strong>{formData.receiverContactName}</strong></div>
                        <div><small>Phone</small><strong>{formData.receiverContactPhone}</strong></div>
                        <div><small>Street</small><strong>{formData.receiverStreetName}</strong></div>
                        <div><small>Delivery type</small><strong>{formData.deliveryTypeCode}</strong></div>
                      </div>
                    </section>
                    <section>
                      <header><h6>Package</h6><button type="button" onClick={() => setFormStep(2)}>Edit</button></header>
                      <div className="review-grid">
                        <div><small>Package size</small><strong>{formData.shipmentSize}</strong></div>
                        <div><small>Items</small><strong>{orderItems.length}</strong></div>
                      </div>
                    </section>
                  </div>
                  <Form.Check
                    type="checkbox"
                    id="terms-conditions"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.agreeToTerms}
                    label={
                      <div>
                        <strong>Terms and Conditions</strong>
                        <div className="mt-1">
                          I agree to the{' '}
                          <Link to="#" className="text-primary">Terms and Conditions</Link>{' '}
                          and{' '}
                          <Link to="#" className="text-primary">Privacy Policy</Link>.
                          I understand that by creating this package, I am agreeing to pay
                          the delivery cost and any applicable fees.
                        </div>
                      </div>
                    }
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.agreeToTerms}
                  </Form.Control.Feedback>
                </Card.Body>
              </Card>

              {/* Submit Button */}
              <div className="d-flex gap-2 justify-content-between">
                {formStep > 0 && (
                  <Button type="button" variant="outline-secondary" size="lg" onClick={() => setFormStep((step) => step - 1)}>
                    <ArrowLeft className="me-2" size={16} />Back
                  </Button>
                )}
                {formStep < 3 && (
                  <Button type="button" size="lg" className="ms-auto" onClick={advanceFormStep}>
                    Continue
                  </Button>
                )}
                {formStep === 3 && (
                <Button
                  type="submit"
                  size="lg"
                  className="ms-auto create-package-submit"
                  disabled={isSubmitting || loading || rateCalculating}
                  style={{
                    backgroundColor: '#E67E22',
                    borderColor: '#E67E22',
                    color: 'white'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Creating Package...
                    </>
                  ) : rateCalculating ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Calculating Rate...
                    </>
                  ) : (
                    <>
                      <Package size={16} className="me-2" />
                      Create Package
                    </>
                  )}
                </Button>
                )}
              </div>
            </Col>

            {/* Sidebar - Package Summary */}
            <Col lg={4}>
              <Card className="sticky-sidebar summary-card" style={{ top: '20px' }}>
                <Card.Header>
                  <h5 className="mb-0">Package Summary</h5>
                </Card.Header>
                <Card.Body>
                  <div className="summary-item">
                    <div className="summary-label">Recipient</div>
                    <div className="summary-value">
                      {formData.receiverContactName || 'Not specified'}
                    </div>
                  </div>

                  <div className="summary-item">
                    <div className="summary-label">Recipient Phone</div>
                    <div className="summary-value">
                      {formData.receiverContactPhone || 'Not specified'}
                    </div>
                  </div>

                  {formData.receiverStreetName && (
                    <div className="summary-item">
                      <div className="summary-label">Delivery Street</div>
                      <div className="summary-value">
                        {formData.receiverStreetName}
                      </div>
                    </div>
                  )}

                  {roadDistance && (
                    <div className="summary-item">
                      <div className="summary-label">Road Distance</div>
                      <div className="summary-value">{roadDistance.text}</div>
                    </div>
                  )}

                  {formData.shipmentSize && (
                    <div className="summary-item">
                      <div className="summary-label">Package Size</div>
                      <div className="summary-value text-capitalize">{formData.shipmentSize.toLowerCase()}</div>
                    </div>
                  )}

                  <div className="summary-item">
                    <div className="summary-label">Route</div>
                    <div className="summary-value">
                      {(() => {
                        // Prioritize manually entered originDCCode
                        const originDC = formData.originDCCode || (showVendorInput 
                          ? formData.selectedVendor?.vendor?.defaultDCCode 
                          : user?.AssignedVendor?.DefaultDCCode);
                        
                        const originDCName = formData.senderCity || (showVendorInput
                          ? formData.selectedVendor?.vendor?.DCName
                          : user?.AssignedVendor?.DCName);

                        if (originDC && formData.receiverCity) {
                          return `${originDCName || originDC} → ${formData.receiverCity}`;
                        } else if (originDC) {
                          return originDCName || originDC;
                        } else {
                          return 'Route will be determined';
                        }
                      })()}
                    </div>
                  </div>

                  <div className="summary-item">
                    <div className="summary-label">Package Value</div>
                    <div className="summary-value">
                      {orderItems.length > 0
                        ? `KES ${orderItems.reduce((sum, item) => sum + item.productValue, 0).toFixed(2)} (${orderItems.length} items)`
                        : 'No items added'
                      }
                    </div>
                  </div>

                  {orderItems.length > 0 && (
                    <div className="summary-item">
                      <div className="summary-label">Total Weight</div>
                      <div className="summary-value">
                        {orderItems.reduce((sum, item) => sum + (item.weight || 0), 0).toFixed(2)} kg
                      </div>
                    </div>
                  )}

                  {formData.cashOnDelivery && (
                    <div className="summary-item">
                      <div className="summary-label">COD Amount</div>
                      <div className="summary-value text-success">
                        KES {formData.codAmount ? parseFloat(formData.codAmount).toFixed(2) : '0.00'}
                      </div>
                    </div>
                  )}

                  {formData.additionalFeeAmount && parseFloat(formData.additionalFeeAmount) > 0 && (
                    <div className="summary-item">
                      <div className="summary-label">
                        {formData.feeType === 'discount' ? 'Discount' : 'Additional Fee'}
                      </div>
                      <div className={`summary-value ${formData.feeType === 'discount' ? 'text-success' : 'text-danger'}`}>
                        {formData.feeType === 'discount' ? '-' : '+'}KES {parseFloat(formData.additionalFeeAmount).toFixed(2)}
                      </div>
                    </div>
                  )}

                  <hr />

                  <div className="d-flex justify-content-between align-items-center">
                    <span>Estimated Delivery Cost</span>
                    <div className="text-end">
                      {rateCalculating ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          <span className="text-muted">Calculating...</span>
                        </>
                      ) : shippingRate ? (
                        <div>
                          <div className="text-success fw-bold">
                            KES {shippingRate.RateAmount.toFixed(2)}
                          </div>
                          <small className="text-muted">
                            SLA: {shippingRate.SLAHours}hrs
                          </small>
                        </div>
                      ) : (
                        <span className="text-muted">
                          Select customer and delivery type
                        </span>
                      )}
                    </div>
                  </div>

                  {shippingRate && (
                    <div className="mt-2">
                      <small className="text-muted">
                        Rate: {shippingRate.ShipmentRateNO} | 
                        From: {shippingRate.FromDCName} | 
                        To: {shippingRate.ToDCName}
                      </small>
                    </div>
                  )}

                  {rateError && (
                    <div className="mt-2">
                      <small className="text-danger">
                        Error calculating rate: {rateError}
                      </small>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Form>

        {/* Add Item Modal */}
        <Modal show={showAddItemModal} onHide={() => {
          setShowAddItemModal(false);
          setItemEntryMode('manual');
          setSelectedProduct(null);
          setNewItemData({
            productName: '',
            description: '',
            weight: '',
            isFragile: false,
            isPerishable: false,
            productValue: '',
            remarks: '',
            quantity: 1
          });
          setNewItemErrors({});
        }} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              {itemEntryMode === 'manual' ? 'Add Package Item' : 'Select Product from Catalog'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Tabs activeKey={itemEntryMode} onSelect={handleEntryModeChange} className="mb-3">
              <Tab eventKey="manual" title="Manual Entry">
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <Form.Label>Product Name *</Form.Label>
                      <CreatableSelect
                        options={vendorProducts.map((product) => ({
                          value: product.vendorProductCode,
                          label: product.vendorProductName,
                        }))}
                        value={newItemData.productName ? {
                          value: selectedProduct?.vendorProductCode || newItemData.productName,
                          label: newItemData.productName,
                        } : null}
                        onChange={handleProductSelect}
                        placeholder="Search products or type a new name..."
                        formatCreateLabel={(value) => `Use “${value}”`}
                        isClearable
                        isSearchable
                        isLoading={vendorProductsLoading}
                        className={newItemErrors.productName ? 'is-invalid' : ''}
                      />
                      <div className="invalid-feedback d-block">
                        {newItemErrors.productName}
                      </div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="mb-3">
                      <Form.Label>Weight (kg)</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="0.0"
                        name="weight"
                        value={newItemData.weight}
                        onChange={handleNewItemChange}
                        isInvalid={!!newItemErrors.weight}
                        min="0"
                        step="0.1"
                      />
                      <Form.Control.Feedback type="invalid">
                        {newItemErrors.weight}
                      </Form.Control.Feedback>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="mb-3">
                      <Form.Label>Quantity *</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="1"
                        name="quantity"
                        value={newItemData.quantity}
                        onChange={handleNewItemChange}
                        isInvalid={!!newItemErrors.quantity}
                        min="1"
                        step="1"
                      />
                      <Form.Control.Feedback type="invalid">
                        {newItemErrors.quantity}
                      </Form.Control.Feedback>
                    </div>
                  </Col>
                </Row>

                <div className="mb-3">
                  <Form.Label>Description </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Describe the item details..."
                    name="description"
                    value={newItemData.description}
                    onChange={handleNewItemChange}
                  
                  />
                  <Form.Control.Feedback type="invalid">
                    {newItemErrors.description}
                  </Form.Control.Feedback>
                </div>

                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <Form.Label>Product Value (Optional)</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">KES</span>
                        <Form.Control
                          type="number"
                          placeholder="0.00"
                          name="productValue"
                          value={newItemData.productValue}
                          onChange={handleNewItemChange}
                          isInvalid={!!newItemErrors.productValue}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <Form.Control.Feedback type="invalid">
                        {newItemErrors.productValue}
                      </Form.Control.Feedback>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <Form.Label>Special Properties</Form.Label>
                      <div>
                        <Form.Check
                          type="checkbox"
                          id="is-fragile"
                          name="isFragile"
                          checked={newItemData.isFragile}
                          onChange={handleNewItemChange}
                          label="Fragile Item"
                          className="mb-2"
                        />
                        <Form.Check
                          type="checkbox"
                          id="is-perishable"
                          name="isPerishable"
                          checked={newItemData.isPerishable}
                          onChange={handleNewItemChange}
                          label="Perishable Item"
                        />
                      </div>
                    </div>
                  </Col>
                </Row>

                <div className="mb-3">
                  <Form.Label>Remarks (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Any additional notes about this item..."
                    name="remarks"
                    value={newItemData.remarks}
                    onChange={handleNewItemChange}
                  />
                </div>
              </Tab>

              <Tab eventKey="select" title="Select from Products" disabled={!vendorProducts.length}>
                <div className="mb-3">
                  <Form.Label>Select Product *</Form.Label>
                  <Select
                    options={vendorProducts.map(product => ({
                      value: product.vendorProductCode,
                      label: `${product.vendorProductName} (${product.vendorProductCode}) - KES ${product.currentPrice || product.productValue || 'N/A'}`
                    }))}
                    value={selectedProduct ? {
                      value: selectedProduct.vendorProductCode,
                      label: `${selectedProduct.vendorProductName} (${selectedProduct.vendorProductCode}) - KES ${selectedProduct.currentPrice || selectedProduct.productValue || 'N/A'}`
                    } : null}
                    onChange={handleProductSelect}
                    placeholder="Search and select a product..."
                    isLoading={vendorProductsLoading}
                    isDisabled={vendorProductsLoading}
                  />
                  {vendorProductsError && (
                    <div className="text-danger mt-1">
                      Error loading products: {vendorProductsError}
                    </div>
                  )}
                  {!vendorProducts.length && !vendorProductsLoading && (
                    <div className="text-muted mt-1">
                      No products available for the selected vendor.
                    </div>
                  )}
                </div>

                {selectedProduct && (
                  <>
                    <div className="mb-3 p-3 rounded">
                      <h6>Product Details:</h6>
                      <Row>
                        <Col md={6}>
                          <strong>Name:</strong> {selectedProduct.vendorProductName}
                        </Col>
                        <Col md={6}>
                          <strong>Code:</strong> {selectedProduct.vendorProductCode}
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <strong>Price:</strong> KES {selectedProduct.currentPrice || selectedProduct.productValue || 'N/A'}
                        </Col>
                        <Col md={6}>
                          <strong>Fragile:</strong> {selectedProduct.isFragile ? 'Yes' : 'No'}
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <strong>Perishable:</strong> {selectedProduct.isPerishable ? 'Yes' : 'No'}
                        </Col>
                      </Row>
                      {selectedProduct.description && (
                        <Row>
                          <Col md={12}>
                            <strong>Description:</strong> {selectedProduct.description}
                          </Col>
                        </Row>
                      )}
                    </div>

                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Form.Label>Weight (kg)</Form.Label>
                          <Form.Control
                            type="number"
                            placeholder="0.0"
                            name="weight"
                            value={newItemData.weight}
                            onChange={handleNewItemChange}
                            isInvalid={!!newItemErrors.weight}
                            min="0"
                            step="0.1"
                          />
                          <Form.Control.Feedback type="invalid">
                            {newItemErrors.weight}
                          </Form.Control.Feedback>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Form.Label>Quantity *</Form.Label>
                          <Form.Control
                            type="number"
                            placeholder="1"
                            name="quantity"
                            value={newItemData.quantity || 1}
                            onChange={handleNewItemChange}
                            min="1"
                            step="1"
                          />
                        </div>
                      </Col>
                    </Row>

                    <div className="mb-3">
                      <Form.Label>Remarks (Optional)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Any additional notes about this item..."
                        name="remarks"
                        value={newItemData.remarks}
                        onChange={handleNewItemChange}
                      />
                    </div>
                  </>
                )}
              </Tab>
            </Tabs>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddItemModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddItem}>
              Add Item
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Error Display */}
        {error && (
          <Alert variant="danger" className="mt-3">
            {error}
          </Alert>
        )}
      </div>
    </div>
  );
};

export default CreatePackageForm;
