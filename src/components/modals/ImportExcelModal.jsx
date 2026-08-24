import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import Select from 'react-select';
import { DownloadCloud, UploadCloud, FileText } from 'feather-icons-react';
import { useVendors } from '@/hooks/useVendors';
import { useShipment } from '@/hooks/useShipment';
import { useAdmin } from '@/hooks/useAdmin';
import notify from '@/lib/toast';
import { useAuth } from '@/contexts/AuthContext';

export const ImportExcelModal = ({ show, onClose, onUploadSuccess, showVendorInput = false }) => {
  const { user } = useAuth();
  
  const [vendorParams, setVendorParams] = useState({});
  const { vendors, loading: vendorsLoading } = useVendors(vendorParams);
  
  const { deliveryTypes, handleDownloadExcelTemplate, handleUploadExcel, loading: shipmentLoading } = useShipment();
  const { distributionCenters, fetchDistributionCenters } = useAdmin();
  
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedDeliveryType, setSelectedDeliveryType] = useState(null);
  const [selectedSortingCentre, setSelectedSortingCentre] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (show) {
      setSelectedVendor(null);
      setSelectedDeliveryType(null);
      setSelectedSortingCentre(null);
      setSelectedFile(null);
      setVendorParams({});
      setIsUploading(false);
      setValidationError('');
    }
  }, [show]);

  useEffect(() => {
    if (show) fetchDistributionCenters();
  }, [show, fetchDistributionCenters]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const downloadTemplate = async () => {
    await handleDownloadExcelTemplate();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (showVendorInput && !selectedVendor) {
      setValidationError('Please select a vendor');
      notify.error('Please select a vendor');
      return;
    }
    
    if (!selectedFile) {
      notify.error('Please select an Excel file to upload');
      return;
    }

    if (!selectedDeliveryType) {
      notify.error('Please select a delivery type');
      return;
    }

    if (!selectedSortingCentre) {
      notify.error('Please select a sorting centre');
      return;
    }
    
    const vendorCode = showVendorInput ? selectedVendor.value : user?.AssignedVendor?.VendorCode;
    
    const formData = new FormData();
    formData.append('VendorCode', vendorCode);
    formData.append('DeliveryTypeCode', selectedDeliveryType.value);
    formData.append('DestinationDCCode', selectedSortingCentre.value);
    formData.append('file', selectedFile);
    
    try {
      setIsUploading(true);
      await handleUploadExcel(formData);
      onUploadSuccess();
      onClose();
    } catch (error) {
      console.error('Upload excel error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Import Packages from Excel</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4 text-center">
          <p className="text-muted mb-2">First time here? Download our template to ensure your data is formatted correctly.</p>
          <Button 
            variant="outline-primary" 
            onClick={downloadTemplate} 
            disabled={shipmentLoading}
            className="d-inline-flex align-items-center"
          >
            <DownloadCloud size={18} className="me-2" />
            Download Excel Template
          </Button>
        </div>

        <hr className="my-4" />

        <Form onSubmit={handleSubmit}>
          {showVendorInput && (
            <Form.Group className="mb-3">
              <Form.Label>Vendor <span className="text-danger">*</span></Form.Label>
              <Select
                name="selectedVendor"
                value={selectedVendor}
                onChange={(option) => {
                  setSelectedVendor(option);
                  if (validationError) setValidationError('');
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
                className={validationError ? 'is-invalid' : ''}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    backgroundColor: '#F5E6D8',
                    borderColor: validationError ? '#dc3545' : base.borderColor,
                    '&:hover': {
                      borderColor: validationError ? '#dc3545' : base.borderColor,
                    }
                  })
                }}
              />
              {validationError && (
                <div className="invalid-feedback d-block">
                  {validationError}
                </div>
              )}
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Delivery Type <span className="text-danger">*</span></Form.Label>
            <Select
              name="selectedDeliveryType"
              value={selectedDeliveryType}
              onChange={setSelectedDeliveryType}
              options={Array.isArray(deliveryTypes) ? deliveryTypes.map((type) => ({
                value: type.DeliveryTypeCode,
                label: type.DeliveryTypeName,
              })) : []}
              placeholder="Select delivery type..."
              isClearable
              isSearchable
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Sorting Centre <span className="text-danger">*</span></Form.Label>
            <Select
              name="selectedSortingCentre"
              value={selectedSortingCentre}
              onChange={setSelectedSortingCentre}
              options={Array.isArray(distributionCenters) ? distributionCenters.map((dc) => ({
                value: dc.DCCode,
                label: `${dc.DCName} (${dc.DCCode})`,
              })) : []}
              placeholder="Select destination sorting centre..."
              isClearable
              isSearchable
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Upload Filled Template <span className="text-danger">*</span></Form.Label>
            <div className="custom-file-upload border rounded p-4 text-center bg-light">
              <input
                type="file"
                id="excelFile"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="d-none"
              />
              <label htmlFor="excelFile" className="cursor-pointer mb-0 w-100">
                <FileText size={32} className="text-primary mb-2" />
                <h6 className="mb-1">Click to select file</h6>
                <p className="text-muted small mb-0">
                  {selectedFile ? selectedFile.name : 'Only .xlsx or .xls files are supported'}
                </p>
              </label>
            </div>
          </Form.Group>

          <div className="d-flex justify-content-end mt-4">
            <Button variant="secondary" onClick={onClose} className="me-2">
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={isUploading || !selectedFile || !selectedDeliveryType || !selectedSortingCentre || (showVendorInput && !selectedVendor)}
              className="d-inline-flex align-items-center justify-content-center"
              style={{ minWidth: '170px' }}
            >
              {isUploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud size={18} className="me-2" />
                  Import Packages
                </>
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ImportExcelModal;
