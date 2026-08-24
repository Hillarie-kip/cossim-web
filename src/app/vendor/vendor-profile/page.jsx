"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Link from '@/components/Link';
import VendorPageHeader from '@/components/vendor/VendorPageHeader';
import useUser from '@/hooks/useUser';

const VendorProfile = () => {
  const { user, isAuthenticated } = useUser();

  // Local editable profile state with safe defaults
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    businessName: '',
    businessType: 'Other',
    address: '',
    city: '',
    country: ''
  });

  const [isEditing, setIsEditing] = useState(false);

  // Derive initials safely
  const initials = useMemo(() => {
    const f = (profileData.firstName || '').trim();
    const l = (profileData.lastName || '').trim();
    return `${f.charAt(0) || ''}${l.charAt(0) || ''}`.toUpperCase();
  }, [profileData.firstName, profileData.lastName]);

  // Hydrate profile form from user in localStorage via useUser()
  useEffect(() => {
    if (!user) return;
    setProfileData((prev) => ({
      ...prev,
      firstName: user.FirstName || user.firstName || '',
      lastName: user.LastName || user.lastName || '',
      email: user.EmailAddress || user.email || '',
      phone: user.PhoneNumber || user.phone || '',
      businessName: user?.AssignedVendor?.VendorName || prev.businessName || '',
      // Business type, address, city, country aren't in auth payload; keep existing/defaults
      businessType: prev.businessType || 'Other',
      address: prev.address || '',
      city: prev.city || '',
      country: prev.country || '',
    }));
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    // Persist only fields we own back into localStorage user for now
    try {
      const raw = localStorage.getItem('cossim-user');
      if (raw) {
        const current = JSON.parse(raw);
        const updated = {
          ...current,
          FirstName: profileData.firstName,
          LastName: profileData.lastName,
          EmailAddress: profileData.email,
          PhoneNumber: profileData.phone,
          AssignedVendor: {
            ...current.AssignedVendor,
            VendorName: profileData.businessName,
          },
        };
        localStorage.setItem('cossim-user', JSON.stringify(updated));
      }
    } catch (err) {
      // no-op; best-effort local save
      console.error('Failed to save profile locally:', err);
    }
    console.log('Profile updated:', profileData);
    setIsEditing(false);
  };

  return (
    <div className="content">
      <VendorPageHeader
        title="My Profile"
        subtitle="Manage your account information"
        actions={(
          <Link to="/vendor/vendor-overview" className="btn btn-outline-primary">
            <i className="feather-arrow-left me-1"></i>
            Back to Dashboard
          </Link>
        )}
      />

      <div className="row">
        <div className="col-lg-4">
          {/* Profile Card */}
          <div className="card">
            <div className="card-body text-center">
              <div className="avatar avatar-xxl bg-primary text-white rounded-circle mx-auto mb-3">
                <span className="fs-2 fw-bold">{initials}</span>
              </div>
              <h4 className="mb-1">{profileData.firstName} {profileData.lastName}</h4>
              <p className="text-muted mb-3">{profileData.businessName}</p>
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-primary"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <i className="feather-edit me-1"></i>
                  {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                </button>
                <button className="btn btn-outline-secondary">
                  <i className="feather-key me-1"></i>
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Account Statistics</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span>Total Packages</span>
                  <strong>0</strong>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span>Delivered</span>
                  <strong className="text-success">0</strong>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span>In Transit</span>
                  <strong className="text-info">0</strong>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span>Total Revenue</span>
                  <strong className="text-primary">KES 0</strong>
                </div>
              </div>
              <div>
                <div className="d-flex justify-content-between">
                  <span>Member Since</span>
                  <strong>Aug 2025</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          {/* Profile Form */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Profile Information</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSave}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={profileData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Business Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="businessName"
                        value={profileData.businessName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Business Type</label>
                      <select
                        className="form-control"
                        name="businessType"
                        value={profileData.businessType}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      >
                        <option value="Electronics">Electronics</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Books">Books</option>
                        <option value="Food">Food</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    name="address"
                    value={profileData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        className="form-control"
                        name="city"
                        value={profileData.city}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Country</label>
                      <input
                        type="text"
                        className="form-control"
                        name="country"
                        value={profileData.country}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="d-flex justify-content-end gap-2">
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <i className="feather-save me-1"></i>
                      Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Security Settings */}
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">Security Settings</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h6 className="mb-1">Two-Factor Authentication</h6>
                      <small className="text-muted">Add an extra layer of security</small>
                    </div>
                    <button className="btn btn-sm btn-outline-primary">
                      Enable
                    </button>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h6 className="mb-1">Email Notifications</h6>
                      <small className="text-muted">Receive package updates via email</small>
                    </div>
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;
