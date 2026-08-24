"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'feather-icons-react';
import { Card, Button, Spinner } from 'react-bootstrap';
import { useFinance } from '@/hooks/useFinance';
import { useAuth } from '@/contexts/AuthContext';
import PaymentStep from '@/components/PaymentStep';
import { all_routes } from '@/Router/all_routes';
import notify from '@/lib/toast';

const ReconciliationPaymentPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    fetchOrderReconciliation,
    loading: reconciliationLoading,
    error: reconciliationError
  } = useFinance();

  const orderNO = searchParams.get('orderNO');

  // Fetch order reconciliation details on component mount
  useEffect(() => {
    const loadOrderData = async () => {
      if (!orderNO) {
        setError('Order number is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch reconciliation data
        const response = await fetchOrderReconciliation({
          pageNo: 1,
          pageSize: 1,
          search: orderNO
        });

        if (response && response.Data && response.Data.length > 0) {
          const order = response.Data.find(item => item.orderNO === orderNO);
          if (order) {
            setOrderData(order);
          } else {
            setError('Order not found in reconciliation data');
          }
        } else {
          setError('Failed to load reconciliation data');
        }
      } catch (error) {
        console.error('Failed to fetch reconciliation data:', error);
        setError('Failed to load order reconciliation details');
      } finally {
        setLoading(false);
      }
    };

    loadOrderData();
  }, [orderNO, fetchOrderReconciliation]);

  const handlePaymentComplete = (paymentData) => {
    // Show success message
    notify.success('Reconciliation payment completed successfully!');

    // Redirect back to reconciliation list
    router.push('/admin/reconciliation');
  };

  const handleBack = () => {
    router.push(all_routes.reconciliation);
  };

  // Loading state
  if (loading || reconciliationLoading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Loading reconciliation details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || reconciliationError) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <Card>
              <Card.Body className="text-center">
                <AlertCircle size={48} className="text-danger mb-3" />
                <h5 className="text-danger">Error Loading Reconciliation</h5>
                <p className="text-muted">{error || reconciliationError}</p>
                <Button variant="primary" onClick={handleBack}>
                  Back to Reconciliation
                </Button>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // No order data
  if (!orderData) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <Card>
              <Card.Body className="text-center">
                <AlertCircle size={48} className="text-warning mb-3" />
                <h5 className="text-warning">Reconciliation Not Found</h5>
                <p className="text-muted">The requested reconciliation could not be found.</p>
                <Button variant="primary" onClick={handleBack}>
                  Back to Reconciliation
                </Button>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Check if there's outstanding amount to pay
  const outstandingAmount = orderData.feesOutstanding || 0;
  if (outstandingAmount <= 0) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <Card>
              <Card.Body className="text-center">
                <AlertCircle size={48} className="text-success mb-3" />
                <h5 className="text-success">Payment Not Required</h5>
                <p className="text-muted">
                  This reconciliation has no outstanding fees. Outstanding amount: {formatCurrency(outstandingAmount)}
                </p>
                <Button variant="primary" onClick={handleBack}>
                  Back to Reconciliation
                </Button>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Format currency helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount || 0);
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex align-items-center mb-4">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={handleBack}
          className="me-3"
        >
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h4 className="mb-1">Pay Reconciliation Fees</h4>
          <p className="text-muted mb-0">Complete payment for Order: {orderData.orderNO}</p>
        </div>
      </div>

      {/* Reconciliation Summary Card */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Reconciliation Summary</h5>
        </Card.Header>
        <Card.Body>
          <div className="row">
            <div className="col-md-6">
              <p><strong>Order Number:</strong> {orderData.orderNO}</p>
              <p><strong>Vendor:</strong> {orderData.vendorName}</p>
              <p><strong>Origin DC:</strong> {orderData.originDCCode}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Destination DC:</strong> {orderData.destinationDCCode}</p>
              <p><strong>Order Date:</strong> {new Date(orderData.orderDate).toLocaleDateString('en-KE')}</p>
              <p><strong>Outstanding Amount:</strong> <span className="text-warning fw-bold">{formatCurrency(outstandingAmount)}</span></p>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="mt-3">
            <h6>Fee Breakdown:</h6>
            <div className="row">
              <div className="col-md-4">
                <p className="mb-1"><strong>Billed:</strong> {formatCurrency(orderData.feesBilled)}</p>
              </div>
              <div className="col-md-4">
                <p className="mb-1"><strong>Collected:</strong> {formatCurrency(orderData.feesCollectedAmt)}</p>
              </div>
              <div className="col-md-4">
                <p className="mb-1"><strong>Outstanding:</strong> <span className="text-warning">{formatCurrency(outstandingAmount)}</span></p>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Payment Step */}
      <Card>
        <PaymentStep
          orderData={orderData}
          onPaymentComplete={handlePaymentComplete}
          onBack={handleBack}
          totalAmount={outstandingAmount}
          isServiceFeeMandatory={true}
          paymentType="reconciliation"
        />
      </Card>
    </div>
  );
};

export default ReconciliationPaymentPage;
