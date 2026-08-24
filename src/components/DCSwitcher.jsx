"use client";

import React, { useState, useEffect } from 'react';
import { Dropdown } from 'react-bootstrap';
import { MapPin, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getSelectedDC,
  setSelectedDC,
  getDefaultDCFromUser,
  getAssignedDCs,
  getDCByCode
} from '@/services/dcService';

export default function DCSwitcher() {
  const { user } = useAuth();
  const [currentDC, setCurrentDC] = useState(null);
  const [assignedDCs, setAssignedDCs] = useState([]);

  // Initialize DC data
  useEffect(() => {
    if (user) {
      const dcs = getAssignedDCs(user);
      setAssignedDCs(dcs);

      if (dcs.length > 0) {
        const defaultDC = getDefaultDCFromUser(user);
        const dcDetails = getDCByCode(user, defaultDC);
        setCurrentDC(dcDetails);
      }
    }
  }, [user]);

  // Handle DC selection
  const handleDCChange = (dcCode) => {
    setSelectedDC(dcCode);
    const dcDetails = getDCByCode(user, dcCode);
    setCurrentDC(dcDetails);

    // Reload the page to apply the new DC selection
    window.location.reload();
  };

  // Don't render if user has only one DC or no DCs
  if (!user || assignedDCs.length <= 1) {
    return null;
  }

  return (
    <Dropdown className="me-3">
      <Dropdown.Toggle
        variant="outline-primary"
        size="sm"
        className="d-flex align-items-center border"
        id="dc-switcher"
      >
        <MapPin size={16} className="me-2" />
        <span className="d-none d-md-inline">
          {currentDC?.DCName || 'Select DC'}
        </span>
        <span className="d-md-none fw-semibold">
          {currentDC?.DCCode || 'DC'}
        </span>
      </Dropdown.Toggle>

      <Dropdown.Menu align="end" className="bg-white border shadow-sm">
        <Dropdown.Header className="text-dark fw-semibold bg-light">
          Switch Distribution Center
        </Dropdown.Header>
        {assignedDCs.map((dc) => (
          <Dropdown.Item
            key={dc.DCCode}
            onClick={() => handleDCChange(dc.DCCode)}
            className="d-flex align-items-center justify-content-between"
            active={currentDC?.DCCode === dc.DCCode}
          >
            <div>
              <div className="fw-semibold text-dark mb-0">{dc.DCName}</div>
              <small className="text-muted fw-normal">{dc.DCCode}</small>
            </div>
            {currentDC?.DCCode === dc.DCCode && (
              <Check size={16} className="text-primary ms-2 flex-shrink-0" />
            )}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
