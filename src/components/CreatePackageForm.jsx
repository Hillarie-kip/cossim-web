"use client";
///@ts-check
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { filterDistributionCentersToAssigned, getSelectedDC } from '@/services/dcService';
import { getShipmentFieldSuggestions, getShipmentProductNames } from '@/services/shipmentService';

const WALK_IN_VENDOR = { value: '__WALK_IN__', label: 'Walk-in / Default pricing', isWalkIn: true };

const loadGooglePlaces = () => {
  if (window.google?.maps?.places) return Promise.resolve(true);
  if (window.__cossimGooglePlacesPromise) return window.__cossimGooglePlacesPromise;
  window.__cossimGooglePlacesPromise = new Promise(async (resolve, reject) => {
    let key = String(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();
    if (!key) {
      const configResponse = await fetch('/api/google-maps-config', { cache: 'no-store' });
      if (!configResponse.ok) throw new Error('Google Maps is not configured in this environment.');
      key = String((await configResponse.json()).apiKey || '').trim();
    }
    if (!key) throw new Error('Google Maps API key is missing.');
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
  const [currentStep, setCurrentStep] = useState('form');
  const [createdOrder, setCreatedOrder] = useState(null);

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
    shipmentRates,
    fetchShipmentRates,
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
    shipmentSize: 'SMALL',
    cashOnDelivery: false,
    codAmount: '',
    hasPickUp: true,
    notes: '',
    pickupETA: '',
    deliveryETA: '',

    // Terms and Conditions
    agreeToTerms: true
  });
  const isWalkIn = Boolean(formData.selectedVendor?.isWalkIn);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [roadDistance, setRoadDistance] = useState(null);
  const [roadDistanceStatus, setRoadDistanceStatus] = useState('idle');
  const [placesStatus, setPlacesStatus] = useState('loading');
  const [selectedPriceZoneID, setSelectedPriceZoneID] = useState('');
  const senderStreetRef = useRef(null);
  const receiverStreetRef = useRef(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [shippingRate, setShippingRate] = useState(null);
  const [rateCalculating, setRateCalculating] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [historicalProductNames, setHistoricalProductNames] = useState([]);
  const [historicalProductsLoading, setHistoricalProductsLoading] = useState(false);
  const [fieldSuggestions, setFieldSuggestions] = useState({});
  const [fieldSuggestionLoading, setFieldSuggestionLoading] = useState({});
  const productSearchTimerRef = useRef(null);
  const fieldSearchTimersRef = useRef({});

  const itemValueTotal = useMemo(() => orderItems.reduce(
    (total, item) => total + (Number(item.quantity || 1) * Number(item.productValue || 0)), 0),
  [orderItems]);

  const loadFieldSuggestions = (field, searchTerm = '') => {
    clearTimeout(fieldSearchTimersRef.current[field]);
    fieldSearchTimersRef.current[field] = setTimeout(async () => {
      setFieldSuggestionLoading((current) => ({ ...current, [field]: true }));
      try {
        const response = await getShipmentFieldSuggestions(field, searchTerm, 50);
        const values = response?.Data ?? response?.data;
        setFieldSuggestions((current) => ({ ...current, [field]: Array.isArray(values) ? values : [] }));
      } catch {
        setFieldSuggestions((current) => ({ ...current, [field]: [] }));
      } finally {
        setFieldSuggestionLoading((current) => ({ ...current, [field]: false }));
      }
    }, 250);
    return searchTerm;
  };

  const renderSuggestionInput = (field, formKey, placeholder) => (
    <CreatableSelect
      value={formData[formKey] ? { value: formData[formKey], label: formData[formKey] } : null}
      options={(fieldSuggestions[field] || []).map((value) => ({ value, label: value }))}
      onFocus={() => loadFieldSuggestions(field, '')}
      onInputChange={(value, action) => action.action === 'input-change' ? loadFieldSuggestions(field, value) : value}
      onChange={(option) => {
        setFormData((current) => ({ ...current, [formKey]: option?.value || '' }));
        setValidationErrors((current) => ({ ...current, [formKey]: '' }));
      }}
      placeholder={placeholder}
      isClearable
      isSearchable
      isLoading={Boolean(fieldSuggestionLoading[field])}
      formatCreateLabel={(value) => `Use new value: ${value}`}
      className={validationErrors[formKey] ? 'is-invalid' : ''}
    />
  );

  const productOptions = useMemo(() => {
    const options = vendorProducts.map((product) => ({
      value: product.vendorProductCode,
      label: product.vendorProductName,
    }));
    const knownNames = new Set(options.map((option) => option.label?.trim().toLowerCase()).filter(Boolean));
    historicalProductNames.forEach((name) => {
      if (!knownNames.has(name.trim().toLowerCase())) options.push({ value: `history:${name}`, label: name });
    });
    return options;
  }, [vendorProducts, historicalProductNames]);

  const searchHistoricalProducts = (inputValue) => {
    clearTimeout(productSearchTimerRef.current);
    productSearchTimerRef.current = setTimeout(async () => {
      setHistoricalProductsLoading(true);
      try {
        const response = await getShipmentProductNames(inputValue, 100);
        const values = response?.Data ?? response?.data;
        setHistoricalProductNames(Array.isArray(values) ? values : []);
      } catch {
        setHistoricalProductNames([]);
      } finally {
        setHistoricalProductsLoading(false);
      }
    }, 250);
    return inputValue;
  };

  useEffect(() => {
    setHistoricalProductsLoading(true);
    getShipmentProductNames('', 100)
      .then((response) => {
        const values = response?.Data ?? response?.data;
        setHistoricalProductNames(Array.isArray(values) ? values : []);
      })
      .catch(() => setHistoricalProductNames([]))
      .finally(() => setHistoricalProductsLoading(false));
    return () => {
      clearTimeout(productSearchTimerRef.current);
      Object.values(fieldSearchTimersRef.current).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!receiverStreetRef.current) return undefined;
    let active = true;
    let listener;

    loadGooglePlaces().then((placesAvailable) => {
      if (!placesAvailable || !active || !receiverStreetRef.current) return;
      setPlacesStatus('ready');
      const autocomplete = new window.google.maps.places.Autocomplete(receiverStreetRef.current, {
        componentRestrictions: { country: 'ke' },
        fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id', 'types'],
        strictBounds: false,
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
    }).catch((placesError) => {
      if (active) setPlacesStatus(placesError.message || 'Google Places suggestions are unavailable.');
    });

    return () => {
      active = false;
      if (listener) window.google?.maps?.event?.removeListener(listener);
    };
  }, []);

  useEffect(() => {
    if (!isWalkIn || !senderStreetRef.current) return undefined;
    let active = true;
    let listener;
    setPlacesStatus('loading');

    loadGooglePlaces().then((placesAvailable) => {
      if (!placesAvailable || !active || !senderStreetRef.current) return;
      setPlacesStatus('ready');
      const autocomplete = new window.google.maps.places.Autocomplete(senderStreetRef.current, {
        componentRestrictions: { country: 'ke' },
        fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id', 'types'],
        strictBounds: false,
      });
      listener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return;
        const street = place.name && place.formatted_address && !place.formatted_address.startsWith(place.name)
          ? `${place.name}, ${place.formatted_address}`
          : (place.formatted_address || place.name || '');
        setFormData((current) => ({
          ...current,
          senderStreetName: street || current.senderStreetName,
          senderCity: getPlacePart(place, 'locality') || getPlacePart(place, 'administrative_area_level_2') || current.senderCity,
          senderArea: getPlacePart(place, 'sublocality_level_1') || getPlacePart(place, 'neighborhood') || current.senderArea,
          senderPostalCode: getPlacePart(place, 'postal_code') || current.senderPostalCode,
          senderLatitude: String(place.geometry.location.lat()),
          senderLongitude: String(place.geometry.location.lng()),
        }));
        setValidationErrors((current) => ({ ...current, senderStreetName: '' }));
      });
    }).catch((placesError) => {
      if (active) setPlacesStatus(placesError.message || 'Google Places suggestions are unavailable.');
    });

    return () => {
      active = false;
      if (listener) window.google?.maps?.event?.removeListener(listener);
    };
  }, [isWalkIn]);

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
  const assignedDistributionCenters = useMemo(() => filterDistributionCentersToAssigned(user, distributionCenters), [user, distributionCenters]);
  const dcOptions = assignedDistributionCenters.map((dc) => ({
    value: dc.DCCode,
    label: `${dc.DCCode === 'DC-UB' ? 'KCS House' : dc.DCName} (${dc.DCCode})`
  }));

  const activeVendorCode = isWalkIn ? '' : (formData.selectedVendor?.value || formData.selectedVendor?.vendor?.vendorCode || user?.AssignedVendor?.VendorCode || '');
  const matchingPricingRates = useMemo(() => {
    const activeRates = (Array.isArray(shipmentRates) ? shipmentRates : []).filter((rate) =>
      Number(rate.StatusID ?? rate.statusID ?? 1) === 1 &&
      String(rate.ShipmentRateSize ?? rate.shipmentRateSize ?? '').toUpperCase() === String(formData.shipmentSize || '').toUpperCase() &&
      String(rate.DeliveryTypeCode ?? rate.deliveryTypeCode ?? '').toUpperCase() === String(formData.deliveryTypeCode || '').toUpperCase());
    const vendorRates = activeRates.filter((rate) => String(rate.VendorCode ?? rate.vendorCode ?? '') === activeVendorCode);
    return vendorRates.length ? vendorRates : activeRates.filter((rate) => !String(rate.VendorCode ?? rate.vendorCode ?? '').trim());
  }, [shipmentRates, activeVendorCode, formData.shipmentSize, formData.deliveryTypeCode]);
  const zonePricingOptions = useMemo(() => matchingPricingRates.filter((rate) => String(rate.PriceType ?? rate.priceType).toUpperCase() === 'ZONING').map((rate) => ({
    value: String(rate.PriceZoneID ?? rate.priceZoneID),
    label: `${rate.PriceZoneName ?? rate.priceZoneName ?? 'Price zone'} - KES ${Number(rate.RateAmount ?? rate.rateAmount ?? 0).toFixed(2)}`,
  })).filter((option, index, options) => option.value && options.findIndex((candidate) => candidate.value === option.value) === index), [matchingPricingRates]);

  useEffect(() => { setSelectedPriceZoneID(''); }, [activeVendorCode, formData.shipmentSize, formData.deliveryTypeCode]);

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
    fetchShipmentRates();
  }, []);

  useEffect(() => {
    if (formData.originDCCode || !assignedDistributionCenters.length) return;
    const kcsHouse = assignedDistributionCenters.find((dc) =>
      String(dc.DCName ?? dc.dcName ?? '').trim().toLowerCase().includes('kcs house'))
      || assignedDistributionCenters.find((dc) => (dc.DCCode ?? dc.dcCode) === 'DC-UB')
      || assignedDistributionCenters.find((dc) =>
        String(dc.DCName ?? dc.dcName ?? '').trim().toLowerCase().includes('kcs sorting center'));
    const assignedDefault = kcsHouse || assignedDistributionCenters[0];
    if (assignedDefault) setFormData((current) => ({ ...current, originDCCode: assignedDefault.DCCode ?? assignedDefault.dcCode }));
  }, [assignedDistributionCenters, formData.originDCCode]);

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      cashOnDelivery: current.cashOnDelivery && itemValueTotal > 0,
      codAmount: current.cashOnDelivery && itemValueTotal > 0 ? String(itemValueTotal) : '',
    }));
    if (itemValueTotal > 0) setValidationErrors((current) => ({ ...current, codAmount: '' }));
  }, [itemValueTotal, formData.cashOnDelivery]);

  // Calculate shipping rate when route and delivery type are available
  const calculateShippingRate = async (fromDC, toDC, deliveryType, shipmentRateSize, vendorCode, roadKM, priceZoneID) => {
    if (!fromDC || !toDC || !deliveryType || !shipmentRateSize) {
      setShippingRate(null);
      return;
    }

    try {
      setRateCalculating(true);
      const rateParams = {
        fromDCCode: fromDC,
        toDCCode: toDC,
        deliveryTypeCode: deliveryType,
        shipmentRateSize,
        vendorCode: vendorCode || undefined,
        roadKM: roadKM ?? undefined,
        priceZoneID: priceZoneID || undefined,
      };

      const response = await fetchActiveShipmentRate(rateParams);
      
      const rateData = response?.Data ?? response?.data;
      if (rateData) {
        const amount = rateData.CalculatedAmount ?? rateData.calculatedAmount ?? rateData.RateAmount ?? rateData.rateAmount ?? 0;
        const resolvedRate = { ...rateData, RateAmount: Number(amount) };
        setShippingRate(resolvedRate);
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
    const toDC = formData.destinationDCCode || formData.originDCCode || getSelectedDC();
    
    const deliveryType = formData.deliveryTypeCode;
    const vendorCode = isWalkIn ? '' : (formData.selectedVendor?.value || user?.AssignedVendor?.VendorCode || '');

    if (fromDC && toDC && deliveryType && formData.shipmentSize) {
      if (!zonePricingOptions.length || selectedPriceZoneID) {
        calculateShippingRate(fromDC, toDC, deliveryType, formData.shipmentSize, vendorCode, roadDistance?.kilometers, selectedPriceZoneID);
      } else {
        setShippingRate(null);
      }
    } else {
      setShippingRate(null);
    }
  }, [
    formData.originDCCode,
    formData.selectedVendor,
    user?.AssignedVendor?.DefaultDCCode,
    formData.destinationDCCode,
    formData.deliveryTypeCode,
    formData.shipmentSize,
    roadDistance?.kilometers,
    selectedPriceZoneID,
    zonePricingOptions.length,
    showVendorInput,
    isWalkIn
  ]);

  // Fetch vendor products when vendor is selected
  useEffect(() => {
    const vendorCode = showVendorInput && !isWalkIn
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
  }, [formData.selectedVendor, user?.AssignedVendor?.VendorCode, showVendorInput, isWalkIn]);

  // Fetch products when params change
  useEffect(() => {
    if (vendorProductsParams.vendorCode) {
      fetchVendorProducts(vendorProductsParams);
    }
  }, [JSON.stringify(vendorProductsParams), fetchVendorProducts]);

  // Fetch vendor stores when the vendor changes, and reset any previously
  // selected store since it belonged to a different vendor
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
    const vendor = showVendorInput && !isWalkIn
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
  }, [formData.selectedVendor, user?.AssignedVendor, showVendorInput, isWalkIn]);

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

  const handleCodChange = (event) => {
    const checked = event.target.checked;
    if (checked && itemValueTotal <= 0) {
      setFormData((current) => ({ ...current, cashOnDelivery: false, codAmount: '' }));
      setValidationErrors((current) => ({ ...current, codAmount: 'Add item values greater than zero before enabling COD' }));
      notify.error('COD requires the total item value to be greater than zero');
      return;
    }
    setFormData((current) => ({
      ...current,
      cashOnDelivery: checked,
      codAmount: checked ? String(itemValueTotal) : '',
    }));
    setValidationErrors((current) => ({ ...current, codAmount: '' }));
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
  };

  const handleAddInlineItem = () => {
    setOrderItems((current) => [...current, {
      itemCode: '', productName: '', description: '', weight: 0, quantity: 1,
      isFragile: false, isPerishable: false, productValue: 0, remarks: '', vendorProductCode: null,
      entryMode: 'manual',
    }]);
    setValidationErrors((current) => ({ ...current, orderItems: '' }));
  };

  const updateInlineItem = (index, changes) => {
    setOrderItems((current) => current.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...changes } : item));
  };

  const handleInlineProductChange = (index, option) => {
    if (!option) {
      updateInlineItem(index, { itemCode: '', productName: '', vendorProductCode: null });
      return;
    }

    const product = vendorProducts.find((item) => item.vendorProductCode === option.value);
    if (product) {
      updateInlineItem(index, {
        itemCode: product.vendorProductCode,
        vendorProductCode: product.vendorProductCode,
        productName: product.vendorProductName || option.label,
        description: product.description || '',
        productValue: Number(product.currentPrice || product.productValue || 0),
        isFragile: Boolean(product.isFragile),
        isPerishable: Boolean(product.isPerishable),
      });
      return;
    }

    updateInlineItem(index, {
      itemCode: '', vendorProductCode: null, productName: option.label || option.value || '',
    });
  };

  const handleInlineProductTextChange = (index, value) => {
    const product = vendorProducts.find((item) =>
      item.vendorProductName?.trim().toLowerCase() === value.trim().toLowerCase());

    if (product) {
      updateInlineItem(index, {
        itemCode: product.vendorProductCode,
        vendorProductCode: product.vendorProductCode,
        productName: product.vendorProductName,
        description: product.description || '',
        productValue: Number(product.currentPrice || product.productValue || 0),
        isFragile: Boolean(product.isFragile),
        isPerishable: Boolean(product.isPerishable),
      });
    } else {
      updateInlineItem(index, { itemCode: '', vendorProductCode: null, productName: value });
    }
    searchHistoricalProducts(value);
  };

  const validateForm = () => {
    const errors = {};

    if (showVendorInput && !formData.selectedVendor) errors.selectedVendor = 'Vendor or Walk-in is required';
    if (isWalkIn) {
      if (!formData.senderCompanyName.trim()) errors.senderCompanyName = 'Sender company is required';
      if (!formData.senderContactPhone.trim()) errors.senderContactPhone = 'Sender phone is required';
      if (!formData.senderStreetName.trim()) errors.senderStreetName = 'Sender street is required';
    }

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
    } else if (orderItems.some((item) => !item.productName?.trim())) {
      errors.orderItems = 'Enter a product name for every package item';
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
    if (formData.cashOnDelivery && itemValueTotal <= 0) {
      errors.codAmount = 'COD requires the total item value to be greater than zero';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const advanceFormStep = () => {
    const errors = {};

    if (formStep === 0) {
      if (showVendorInput && !formData.selectedVendor) errors.selectedVendor = 'Vendor or Walk-in is required';
      if (isWalkIn && !formData.senderCompanyName.trim()) errors.senderCompanyName = 'Sender company is required';
      if (isWalkIn && !formData.senderContactPhone.trim()) errors.senderContactPhone = 'Sender phone is required';
      if (isWalkIn && !formData.senderStreetName.trim()) errors.senderStreetName = 'Sender street is required';
      if (!formData.originDCCode && !user?.AssignedVendor?.DefaultDCCode) errors.originDCCode = 'Consolidation centre is required';
    } else if (formStep === 1) {
      if (!formData.receiverContactName.trim()) errors.receiverContactName = 'Receiver contact name is required';
      if (!formData.receiverContactPhone.trim()) errors.receiverContactPhone = 'Receiver phone number is required';
      if (!formData.receiverStreetName.trim()) errors.receiverStreetName = 'Delivery street is required';
      if (!formData.deliveryTypeCode) errors.deliveryTypeCode = 'Delivery type is required';
    } else if (formStep === 2) {
      if (!formData.shipmentSize) errors.shipmentSize = 'Package size is required';
      if (zonePricingOptions.length && !selectedPriceZoneID) errors.priceZoneID = 'Price zone is required';
      if (!orderItems.length) errors.orderItems = 'Please add at least one item to the package';
      if (formData.cashOnDelivery && itemValueTotal <= 0) errors.codAmount = 'COD requires the total item value to be greater than zero';
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
      // Get origin DC code - prioritize manually entered value
      const originDC = formData.originDCCode || (showVendorInput 
        ? formData.selectedVendor?.vendor?.defaultDCCode 
        : user?.AssignedVendor?.DefaultDCCode);

      const orderData = {
        // Vendor and DC codes
        vendorCode: isWalkIn ? '' : (formData.selectedVendor?.value || user?.AssignedVendor?.VendorCode),
        vendorStoreCode: formData.vendorStoreCode || '',
        deliveryTypeCode: formData.deliveryTypeCode,
        originDCCode: originDC,
        destinationDCCode: formData.destinationDCCode || originDC || getSelectedDC() || '',
        AddedBy:user?.UserCode,
        // Shipping rate and fees
        shipmentRateNO: shippingRate?.ShipmentRateNO || '',
        priceZoneID: selectedPriceZoneID ? Number(selectedPriceZoneID) : null,
        serviceFee: shippingRate?.RateAmount || 0,
        additionalFee: 0,
        
        // COD settings
        cashOnDeliveryRequired: formData.cashOnDelivery,
        cashOnDeliveryAmount: formData.cashOnDelivery ? itemValueTotal : 0,
        
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
        roadKM: roadDistance?.kilometers ?? null,
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

      setCreatedOrder({
        ...response,
        ...(response?.Response || {}),
        CashOnDeliveryRequired: formData.cashOnDelivery,
      });
      setCurrentStep('payment');

    } catch (error) {
      notify.error(error.message || 'Failed to create package');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOrderCreated = (createdOrder) => {
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
      shipmentSize: 'SMALL',
      cashOnDelivery: false,
      codAmount: '',
      hasPickUp: true,
      notes: '',
      pickupETA: '',
      deliveryETA: '',
    agreeToTerms: true
    });
    setOrderItems([]);
    setCreatedOrder(null);
    setCurrentStep('form');
    notify.success('Package created successfully!');
    if (embedded) {
      onComplete?.(createdOrder);
      return;
    }
    router.push(backRoute);
  };

  if (currentStep === 'payment' && createdOrder) {
    return (
      <div className="create-package-wrapper">
        <div className="content create-package-form">
          <PaymentStep
            orderData={createdOrder}
            totalAmount={Number(shippingRate?.RateAmount || createdOrder?.ServiceFee || 0)}
            isServiceFeeMandatory={Boolean(createdOrder?.IsServiceFeeMandatory)}
            paymentType="service"
            availablePaymentMethods={["mpesa", "cash"]}
            isCodPayment={Boolean(createdOrder?.CashOnDeliveryRequired)}
            cashPaymentLabel="Cash on Delivery / Transaction Reference"
            secondaryActionLabel="Skip Payment & Finish"
            onPaymentComplete={(paymentData) => handleOrderCreated(paymentData?.orderData || createdOrder)}
            onBack={() => handleOrderCreated(createdOrder)}
          />
        </div>
      </div>
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
            ['Vendor & Route', 'Vendor, consolidation centre'],
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
                      <Form.Label>Vendor *</Form.Label>
                      <Select
                        name="selectedVendor"
                        value={formData.selectedVendor}
                        onChange={(selectedOption) => {
                          setFormData(prev => ({
                            ...prev,
                            selectedVendor: selectedOption,
                            vendorStoreCode: '',
                            ...(selectedOption?.isWalkIn ? {
                              senderCompanyName: '', senderContactPhone: '', senderStreetName: '', senderArea: '', senderCity: ''
                            } : {})
                          }));
                          setValidationErrors((current) => ({ ...current, selectedVendor: '' }));
                        }}
                        onInputChange={(inputValue) => {
                          if (inputValue) {
                            setVendorParams({ searchTerm: inputValue });
                          } else {
                            setVendorParams({});
                          }
                        }}
                        options={[WALK_IN_VENDOR, ...(Array.isArray(vendors) ? vendors.map(vendor => ({
                          value: vendor.vendorCode,
                          label: vendor.vendorName,
                          vendor: vendor
                        })) : [])]}
                        placeholder="Select vendor or Walk-in..."
                        isClearable={false}
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
                  {!isWalkIn && <div className="mb-3">
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
                  </div>}

                  {showVendorInput && isWalkIn && (
                    <div className="mb-3 p-3 border rounded">
                      <h6 className="mb-3">Walk-in sender details</h6>
                      <Row>
                        <Col md={6} className="mb-3">
                          <Form.Label>Sender Company *</Form.Label>
                          {renderSuggestionInput('SenderCompanyName', 'senderCompanyName', 'Type or select company...')}
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Label>Sender Phone *</Form.Label>
                          {renderSuggestionInput('SenderContactPhone', 'senderContactPhone', 'Type or select phone...')}
                        </Col>
                        <Col md={12}>
                          <Form.Label>Sender Street / Building *</Form.Label>
                          <div className="position-relative">
                            <Form.Control
                              ref={senderStreetRef}
                              type="text"
                              name="senderStreetName"
                              value={formData.senderStreetName}
                              onChange={handleInputChange}
                              placeholder="Search building, business, landmark or street..."
                              autoComplete="off"
                              isInvalid={!!validationErrors.senderStreetName}
                            />
                            {placesStatus === 'loading' && <Spinner size="sm" className="position-absolute top-50 end-0 translate-middle-y me-3" />}
                          </div>
                          <Form.Control.Feedback type="invalid">{validationErrors.senderStreetName}</Form.Control.Feedback>
                          <Form.Text>Searches Google Places across buildings, businesses, landmarks and addresses.</Form.Text>
                        </Col>
                      </Row>
                    </div>
                  )}

                  {/* Sorting area */}
                  <div className="mb-4">
                    <Row>
                      <Col md={12} className="mb-3">
                        <Form.Label>Consolidation Centre</Form.Label>
                        <Select
                          name="originDCCode"
                          value={dcOptions.find(option => option.value === formData.originDCCode) || null}
                          onChange={handleOriginDCChange}
                          options={dcOptions}
                          placeholder="Select consolidation centre..."
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
                          Consolidation centre responsible for this package
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
                        {renderSuggestionInput('ReceiverContactName', 'receiverContactName', 'Type or select receiver name...')}
                        {validationErrors.receiverContactName && <div className="invalid-feedback d-block">{validationErrors.receiverContactName}</div>}
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Label>Receiver Phone Number *</Form.Label>
                        {renderSuggestionInput('ReceiverContactPhone', 'receiverContactPhone', 'Type or select phone...')}
                        {validationErrors.receiverContactPhone && <div className="invalid-feedback d-block">{validationErrors.receiverContactPhone}</div>}
                      </Col>
                    </Row>

                    {/* Receiver Address */}
                    <h6 className="mb-3 mt-2">Delivery Address</h6>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Label>Street *</Form.Label>
                        <div className="position-relative">
                          <Form.Control
                            ref={receiverStreetRef}
                            type="text"
                            name="receiverStreetName"
                            value={formData.receiverStreetName}
                            onChange={handleInputChange}
                            placeholder="Search building, business, landmark or street..."
                            autoComplete="off"
                            isInvalid={!!validationErrors.receiverStreetName}
                          />
                          {placesStatus === 'loading' && <Spinner size="sm" className="position-absolute top-50 end-0 translate-middle-y me-3" />}
                        </div>
                        <Form.Control.Feedback type="invalid">{validationErrors.receiverStreetName}</Form.Control.Feedback>
                        <Form.Text className="place-search-hint">
                          {placesStatus === 'ready' ? 'Google Places includes buildings, businesses, landmarks and street addresses.' : placesStatus === 'loading' ? 'Loading Google Places...' : placesStatus}
                        </Form.Text>
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
                          onClick={handleAddInlineItem}
                          className="inline-add-item-button"
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
                        <div className="inline-items-box empty">
                          <Package size={32} className="text-muted mb-2" />
                          <div className="text-muted">No items added yet</div>
                          <small className="text-muted">Click "Add Item" to add items to your package</small>
                        </div>
                      ) : (
                        <div className="inline-items-box">
                          {orderItems.map((item, index) => (
                            <div key={index} className="inline-item-row">
                              <div className="inline-item-product">
                                <Form.Label>Product</Form.Label>
                                  <CreatableSelect
                                    options={productOptions}
                                    value={item.productName ? { value: item.vendorProductCode || item.productName, label: item.productName } : null}
                                    onChange={(option) => handleInlineProductChange(index, option)}
                                    onInputChange={searchHistoricalProducts}
                                    placeholder="Type or select a product..."
                                    isClearable
                                    isSearchable
                                    isLoading={vendorProductsLoading || historicalProductsLoading}
                                    formatCreateLabel={(value) => `Use new product: ${value}`}
                                    classNamePrefix="inline-product-select"
                                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                                  />
                              </div>
                              <div>
                                <Form.Label>Qty</Form.Label>
                                <Form.Control type="number" min="1" step="1" value={item.quantity || 1}
                                  onChange={(event) => updateInlineItem(index, { quantity: Math.max(1, Number.parseInt(event.target.value) || 1) })} />
                              </div>
                              <div>
                                <Form.Label>Unit Price</Form.Label>
                                <Form.Control type="number" min="0" step="0.01" value={item.productValue || ''} placeholder="0"
                                  onChange={(event) => updateInlineItem(index, { productValue: Math.max(0, Number.parseFloat(event.target.value) || 0) })} />
                              </div>
                              <div className="inline-item-total">
                                <Form.Label>&nbsp;</Form.Label>
                                <strong>KES {(Number(item.quantity || 1) * Number(item.productValue || 0)).toLocaleString()}</strong>
                              </div>
                              <button type="button" className="inline-remove-item" onClick={() => handleRemoveItem(index)} title="Remove item" aria-label={`Remove ${item.productName || 'item'}`}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
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

                  {zonePricingOptions.length > 0 && (
                    <div className="mb-4">
                      <Form.Label>Price Zone *</Form.Label>
                      <Select
                        options={zonePricingOptions}
                        value={zonePricingOptions.find((option) => option.value === selectedPriceZoneID) || null}
                        onChange={(option) => setSelectedPriceZoneID(option?.value || '')}
                        placeholder="Select the applicable price zone"
                        isClearable
                        isSearchable
                      />
                      <Form.Text>Select the zone band that applies to this receiver.</Form.Text>
                      {validationErrors.priceZoneID && <div className="invalid-feedback d-block">{validationErrors.priceZoneID}</div>}
                    </div>
                  )}


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
                        onChange={handleCodChange}
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
                            name="codAmount"
                            value={itemValueTotal.toFixed(2)}
                            readOnly
                          />
                        </div>
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.codAmount}
                        </Form.Control.Feedback>
                      </div>
                    )}
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
                        <div><small>Consolidation centre</small><strong>{dcOptions.find((option) => option.value === formData.originDCCode)?.label || formData.originDCCode}</strong></div>
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
                          {!formData.shipmentSize
                            ? 'Select a package size to calculate'
                            : 'No matching active price found'}
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
