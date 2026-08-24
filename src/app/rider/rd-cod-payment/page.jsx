"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, AlertCircle } from "feather-icons-react";
import { Card, Button, Spinner } from "react-bootstrap";
import { useShipment } from "@/hooks/useShipment";
import { useAuth } from "@/contexts/AuthContext";
import PaymentStep from "@/components/PaymentStep";
import { all_routes } from "@/Router/all_routes";
import notify from "@/lib/toast";

const RiderCODPaymentPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    fetchShipmentOrder,
    loading: shipmentLoading,
    error: shipmentError,
  } = useShipment();

  const orderNO = searchParams.get("orderNO");

  // Fetch order details on component mount
  useEffect(() => {
    const loadOrderData = async () => {
      if (!orderNO) {
        setError("Order number is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetchShipmentOrder({ orderNO });
        setOrderData(response.Data);
      } catch (error) {
        console.error("Failed to fetch order:", error);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    loadOrderData();
  }, [orderNO, fetchShipmentOrder]);

  const handlePaymentComplete = (paymentData) => {
    // Show success message
    notify.success("COD payment collected successfully!");

    // Redirect back to packages list
    router.push(all_routes.riderManifest);
  };

  const handleBack = () => {
    router.push(all_routes.riderManifest);
  };

  // Loading state
  if (loading || shipmentLoading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Loading order details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || shipmentError) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <Card>
              <Card.Body className="text-center">
                <AlertCircle size={48} className="text-danger mb-3" />
                <h5 className="text-danger">Error Loading Order</h5>
                <p className="text-muted">{error || shipmentError}</p>
                <Button variant="primary" onClick={handleBack}>
                  Back to Packages
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
                <h5 className="text-warning">Order Not Found</h5>
                <p className="text-muted">
                  The requested order could not be found.
                </p>
                <Button variant="primary" onClick={handleBack}>
                  Back to Packages
                </Button>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Check if order requires COD payment
  if (!orderData.CashOnDeliveryRequired) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <Card>
              <Card.Body className="text-center">
                <AlertCircle size={48} className="text-warning mb-3" />
                <h5 className="text-warning">COD Payment Not Required</h5>
                <p className="text-muted">
                  This order does not require Cash on Delivery payment.
                </p>
                <Button variant="primary" onClick={handleBack}>
                  Back to Packages
                </Button>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
          <h4 className="mb-1">Collect COD Payment</h4>
          <p className="text-muted mb-0">
            Collect Cash on Delivery for Order: {orderData.OrderNO}
          </p>
        </div>
      </div>

      {/* Order Summary Card */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Order Summary</h5>
        </Card.Header>
        <Card.Body>
          <div className="row">
            <div className="col-md-6">
              <p>
                <strong>Order Number:</strong> {orderData.OrderNO}
              </p>
              <p>
                <strong>Customer:</strong> {orderData.CustomerName}
              </p>
              <p>
                <strong>Vendor:</strong> {orderData.VendorName}
              </p>
            </div>
            <div className="col-md-6">
              <p>
                <strong>Status:</strong>{" "}
                <span className="badge bg-warning text-dark">
                  {orderData.StatusName}
                </span>
              </p>
              <p>
                <strong>Origin DC:</strong> {orderData.OriginDCName}
              </p>
              <p>
                <strong>Destination DC:</strong> {orderData.DestinationDCName}
              </p>
              <p>
                <strong>COD Amount:</strong>{" "}
                <span className="text-success fw-bold">
                  ksh {orderData.CODAmount?.toLocaleString()}
                </span>
              </p>
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
          totalAmount={orderData.CODAmount || 0}
          isServiceFeeMandatory={true}
          availablePaymentMethods={["mpesa", "cash", "vendor_account", "client_stk"]}
          isCodPayment={true}
        />
      </Card>
    </div>
  );
};

export default RiderCODPaymentPage;
