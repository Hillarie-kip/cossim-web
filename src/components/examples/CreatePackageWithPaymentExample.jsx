"use client";
import React from 'react';
import CreatePackageForm from '@/components/CreatePackageForm';
import { Container } from 'react-bootstrap';

/**
 * Example usage of the improved CreatePackageForm with payment integration
 */
const CreatePackageWithPaymentExample = () => {
  return (
    <Container fluid className="p-0">
      <CreatePackageForm 
        backRoute="/packages" 
        showBadges={true}
        showVendorInput={false} // Set to true for admin users who can select vendors
      />
    </Container>
  );
};

export default CreatePackageWithPaymentExample;
