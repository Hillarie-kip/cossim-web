"use client";

import { getCities, getDistributionCenterType, getRegions } from "@/services/adminService";
import { useEffect, useRef, useState } from "react";

const blank = { DCName: "", CityCode: "", Region: "", ContactPhone: "", ContactEmail: "", AddressLine1: "", Latitude: null, Longitude: null, IsPrimary: false, DistributionCenterTypeID: "" };

const loadGooglePlaces = () => {
  if (window.google?.maps?.places) return Promise.resolve(true);
  if (window.__cossimGooglePlacesPromise) return window.__cossimGooglePlacesPromise;
  const key = String(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "").trim();
  if (!key) return Promise.resolve(false);
  window.__cossimGooglePlacesPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.cossimGoogleMaps = "true";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Google Places could not be loaded."));
    document.head.appendChild(script);
  });
  return window.__cossimGooglePlacesPromise;
};

const placePart = (place, type) => place.address_components?.find((part) => part.types.includes(type))?.long_name || "";
const ErrorText = ({ children }) => children ? <div className="invalid-feedback">{children}</div> : null;

const AddCenterModal = ({ show, onClose, onSubmit, isLoading, isEdit = false, initialData = null }) => {
  const [form, setForm] = useState(blank);
  const [cities, setCities] = useState([]);
  const [types, setTypes] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [placesError, setPlacesError] = useState("");
  const addressRef = useRef(null);

  useEffect(() => {
    if (!show) return;
    setForm(isEdit ? {
      ...blank,
      ...initialData,
      ContactPhone: initialData?.ContactPhone || "",
      ContactEmail: initialData?.ContactEmail || "",
      Latitude: initialData?.Latitude ?? null,
      Longitude: initialData?.Longitude ?? null,
    } : blank);
    setErrors({});
    setPlacesError("");
  }, [show, isEdit, initialData]);

  useEffect(() => {
    if (!show) return;
    let active = true;
    setLoadingOptions(true);
    Promise.allSettled([getCities(), getDistributionCenterType(), getRegions()])
      .then(([cityRequest, typeRequest, regionRequest]) => {
        if (!active) return;
        const cityResult = cityRequest.status === "fulfilled" ? cityRequest.value : null;
        const typeResult = typeRequest.status === "fulfilled" ? typeRequest.value : null;
        const regionResult = regionRequest.status === "fulfilled" ? regionRequest.value : null;
        setCities(cityResult?.Error ? [] : cityResult?.Data || []);
        setTypes(typeResult?.Error ? [] : typeResult?.Data || []);
        setRegions(regionResult?.Error ? [] : regionResult?.Data || []);
      })
      .finally(() => active && setLoadingOptions(false));
    return () => { active = false; };
  }, [show]);

  useEffect(() => {
    if (!show || !addressRef.current) return;
    let active = true;
    let listener;
    loadGooglePlaces().then((placesAvailable) => {
      if (!placesAvailable || !active || !addressRef.current) return;
      const autocomplete = new window.google.maps.places.Autocomplete(addressRef.current, {
        componentRestrictions: { country: "ke" },
        fields: ["address_components", "formatted_address", "geometry", "name"],
        types: ["geocode"],
      });
      listener = autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return setPlacesError("Choose an address from the Google suggestions.");
        const county = placePart(place, "administrative_area_level_1");
        const region = placePart(place, "locality") || placePart(place, "administrative_area_level_2") || county;
        const city = cities.find((item) => String(item.CityName || item).toLowerCase() === county.toLowerCase());
        setForm((value) => ({ ...value, AddressLine1: place.formatted_address || place.name, Latitude: place.geometry.location.lat(), Longitude: place.geometry.location.lng(), CityCode: city?.CityCode || value.CityCode, Region: value.Region || region }));
        setPlacesError("");
        setErrors((value) => ({ ...value, AddressLine1: "" }));
      });
    }).catch(() => active && setPlacesError(""));
    return () => {
      active = false;
      if (listener) window.google?.maps?.event?.removeListener(listener);
    };
  }, [show, cities]);

  const change = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.DCName.trim()) next.DCName = "Location name is required";
    if (!form.CityCode) next.CityCode = "County is required";
    if (!form.Region.trim()) next.Region = "Mapped region is required";
    if (!form.ContactPhone.trim()) next.ContactPhone = "Phone number is required";
    if (!/^\S+@\S+\.\S+$/.test(form.ContactEmail)) next.ContactEmail = "Enter a valid email address";
    if (!form.DistributionCenterTypeID) next.DistributionCenterTypeID = "Select a location type";
    setErrors(next);
    return !Object.keys(next).length;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        DistributionCenterTypeID: Number(form.DistributionCenterTypeID),
        Latitude: form.Latitude === null || form.Latitude === "" ? null : Number(form.Latitude),
        Longitude: form.Longitude === null || form.Longitude === "" ? null : Number(form.Longitude),
      }, isEdit ? initialData?.DCCode : null);
    } finally { setSubmitting(false); }
  };

  if (!show) return null;
  const disabled = submitting || isLoading;
  const field = (label, name, placeholder, type = "text") => (
    <div className="mb-3">
      <label className="form-label">{label} *</label>
      <input name={name} type={type} value={form[name]} onChange={change} className={`form-control ${errors[name] ? "is-invalid" : ""}`} placeholder={placeholder} disabled={disabled} />
      <ErrorText>{errors[name]}</ErrorText>
    </div>
  );

  return (
    <div className="modal show" role="dialog" aria-modal="true" style={{ display: "block", background: "rgba(0,0,0,.3)" }}>
      <div className="modal-dialog modal-dialog-centered modal-lg"><div className="modal-content" style={{ background: "#ffe5d0", borderRadius: 12 }}>
        <div className="modal-header"><h5 className="modal-title">{isEdit ? "Edit Location" : "Add Location"}</h5><button type="button" className="btn-close" onClick={onClose} disabled={disabled} aria-label="Close" /></div>
        <form onSubmit={submit}><div className="modal-body">
          <p style={{ color: "#a85b2a" }}>Add the location, contact, mapped region and Google address details.</p>
          <div className="row"><div className="col-md-6">{field("Location Name", "DCName", "Location name")}</div><div className="col-md-6 mb-3">
            <label className="form-label">County *</label>
            <select name="CityCode" value={form.CityCode} onChange={change} className={`form-select ${errors.CityCode ? "is-invalid" : ""}`} disabled={disabled || loadingOptions}>
              <option value="">{loadingOptions ? "Loading counties..." : "Select county"}</option>
              {cities.map((city, index) => <option key={city.CityCode || index} value={city.CityCode || city}>{city.CityName || city}</option>)}
            </select><ErrorText>{errors.CityCode}</ErrorText>
          </div></div>
          <div className="mb-3"><label className="form-label">Mapped Region *</label>
            <select name="Region" value={form.Region} onChange={change} className={`form-select ${errors.Region ? "is-invalid" : ""}`} disabled={disabled || loadingOptions}>
              <option value="">{loadingOptions ? "Loading regions..." : "Select mapped region"}</option>
              {regions.map((region) => <option key={region.RegionID} value={region.RegionName}>{region.RegionName}</option>)}
            </select><ErrorText>{errors.Region}</ErrorText>
          </div>
          <div className="row"><div className="col-md-6">{field("Contact Phone", "ContactPhone", "+254 700 000 000", "tel")}</div><div className="col-md-6">{field("Contact Email", "ContactEmail", "location@example.com", "email")}</div></div>
          <div className="mb-3"><label className="form-label">Google Address <span className="text-muted">(Optional)</span></label>
            <input ref={addressRef} name="AddressLine1" value={form.AddressLine1} onChange={change} className="form-control" placeholder="Enter an address manually or select a Google suggestion" autoComplete="off" disabled={disabled} />
            <ErrorText>{errors.AddressLine1}</ErrorText>{placesError && <small className="text-danger d-block mt-1">{placesError}</small>}
            {form.Latitude !== null && form.Longitude !== null && <small className="text-muted">Coordinates: {Number(form.Latitude).toFixed(6)}, {Number(form.Longitude).toFixed(6)}</small>}
          </div>
          <div className="mb-2"><label className="form-label d-block">Location Type *</label>
            <div className="d-flex flex-wrap gap-4">
              {[...types].sort((a, b) => Number(a.DistributionCenterTypeID) - Number(b.DistributionCenterTypeID)).map((type, index) => {
                const id = String(type.DistributionCenterTypeID || type);
                return <div className="form-check" key={id || index}>
                  <input className="form-check-input" type="checkbox" id={`location-type-${id}`} checked={String(form.DistributionCenterTypeID) === id} onChange={() => { setForm((current) => ({ ...current, DistributionCenterTypeID: String(current.DistributionCenterTypeID) === id ? "" : id })); setErrors((current) => ({ ...current, DistributionCenterTypeID: "" })); }} disabled={disabled} />
                  <label className="form-check-label" htmlFor={`location-type-${id}`}>{type.DistributionCenterTypeName || type}</label>
                </div>;
              })}
            </div>{errors.DistributionCenterTypeID && <div className="text-danger small mt-1">{errors.DistributionCenterTypeID}</div>}
          </div>
        </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose} disabled={disabled}>Cancel</button><button type="submit" className="btn btn-primary flex-fill" style={{ background: "#e97b3a", border: 0 }} disabled={disabled}>{disabled ? "Saving..." : isEdit ? "Update Location" : "Add Location"}</button></div></form>
      </div></div>
    </div>
  );
};

export default AddCenterModal;
