"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Row, Col, Card, Button, Alert, Spinner, Form } from "react-bootstrap";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
} from "feather-icons-react";
import { FaCcMastercard, FaCcVisa } from "react-icons/fa";
import {
  FaBuildingColumns,
  FaMobileScreenButton,
  FaMoneyBillWave,
  FaWallet,
} from "react-icons/fa6";
import { useAccount } from "@/hooks/useAccount";
import notify from "@/lib/toast";
import { PAYMENT_METHODS } from "@/constants/constants";
import "@/style/css/payment.css";

const PaymentStep = ({
  orderData,
  onPaymentComplete,
  onBack,
  totalAmount = 0,
  isServiceFeeMandatory = false,
  paymentType = "service", // 'service' or 'reconciliation'
  availablePaymentMethods = ["mpesa", "card", "bank", "client_stk"], // Default to all methods, can be filtered
  isCodPayment = false,
  cashPaymentLabel = "Cash",
  secondaryActionLabel = "Back to Order",
}) => {
  const {
    loading,
    error,
    requestSTKPush,
    checkStkPush,
    completeServicePayment,
    confirmPayment,
    postMpesaOrder,
  } = useAccount();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("mpesa");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("idle"); // idle, requesting, pending, checking, completing, completed, failed
  const [checkoutRequestID, setCheckoutRequestID] = useState("");
  const [paymentData, setPaymentData] = useState(null);
  const checkingIntervalRef = useRef(null);
  const paymentSessionRef = useRef(0);

  const isStkInProgress = ["requesting", "pending", "checking"].includes(
    paymentStatus
  );
  const isPaymentBusy = isStkInProgress || paymentStatus === "completing";

  // Manual payment state
  const [paymentReference, setPaymentReference] = useState("");
  const [completingManualPayment, setCompletingManualPayment] = useState(false);

  // Delivery notes state
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // Confirm payment state
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [confirmTransID, setConfirmTransID] = useState("");
  const [confirmAmount, setConfirmAmount] = useState(totalAmount.toString());
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [confirmPaymentFeedback, setConfirmPaymentFeedback] = useState(null);

  // Payment methods configuration
  const mpesaLogo = (
    <Image
      src="/assets/img/payment-methods/m-pesa.svg"
      alt=""
      width={112}
      height={60}
      className="mpesa-brand-logo"
      unoptimized
    />
  );

  const allPaymentMethods = [
    {
      id: "mpesa",
      name: "M-Pesa",
      icon: mpesaLogo,
      description: "Pay securely from your M-Pesa registered phone",
      enabled: true,
      color: "#00d13d",
      type: "digital",
      brand: true,
    },
    {
      id: "card",
      name: "Credit or Debit Card",
      icon: (
        <span className="card-brand-icons" aria-hidden="true">
          <FaCcVisa className="visa-brand-icon" />
          <FaCcMastercard className="mastercard-brand-icon" />
        </span>
      ),
      description: "Use your Visa or Mastercard",
      enabled: false,
      color: "#007bff",
      type: "digital",
      brand: true,
    },
    {
      id: "bank",
      name: "Bank Transfer",
      icon: <FaBuildingColumns className="payment-icon" />,
      description: "Transfer directly from your bank account",
      enabled: false,
      color: "#6c757d",
      type: "digital",
    },
    {
      id: "cash",
      name: cashPaymentLabel,
      icon: <FaMoneyBillWave className="payment-icon" />,
      description: "Cash payment collection",
      enabled: true,
      color: "#28a745",
      type: "manual",
      manual: true,
    },
    {
      id: "vendor_account",
      name: "Vendor Account",
      icon: <FaWallet className="payment-icon" />,
      description: "Charge to vendor account",
      enabled: true,
      color: "#fd7e14",
      type: "manual",
      manual: true,
    },
    {
      id: "client_stk",
      name: "Client STK Push",
      icon: (
        <span className="client-stk-brand">
          {mpesaLogo}
          <FaMobileScreenButton className="client-phone-icon" />
        </span>
      ),
      description: "Send an M-Pesa prompt to the client's phone",
      enabled: true,
      color: "#00d13d",
      type: "digital",
      brand: true,
    },
  ];

  // Filter payment methods based on availablePaymentMethods prop
  const paymentMethods = allPaymentMethods.filter((method) =>
    availablePaymentMethods.includes(method.id)
  );

  // Update confirm amount when totalAmount changes
  useEffect(() => {
    setConfirmAmount(totalAmount.toString());
  }, [totalAmount]);

  useEffect(() => {
    return () => {
      paymentSessionRef.current += 1;
      if (checkingIntervalRef.current) {
        clearInterval(checkingIntervalRef.current);
      }
    };
  }, []);

  // Helper function to get payment method code
  const getPaymentMethodCode = (paymentMethodId) => {
    switch (paymentMethodId) {
      case "mpesa":
        return PAYMENT_METHODS.MPESA.code;
      case "cash":
        return PAYMENT_METHODS.CASH.code;
      case "vendor_account":
        return PAYMENT_METHODS.VENDOR_ACCOUNT.code;
      case "card":
        return PAYMENT_METHODS.CARD.code;
      case "bank":
        return PAYMENT_METHODS.BANK_TRANSFER.code;
      case "client_stk":
        return PAYMENT_METHODS.CLIENT_STK.code;
      default:
        return PAYMENT_METHODS.MPESA.code; // Default to M-Pesa
    }
  };

  const handlePhoneNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-digits

    // Keep phone number as entered (e.g., 0712860997), limit to 10 digits
    if (value.length > 10) {
      value = value.substring(0, 10);
    }

    setPhoneNumber(value);
  };

  const handlePayment = async () => {
    const selectedMethod = paymentMethods.find(
      (method) => method.id === selectedPaymentMethod
    );

    if (!selectedMethod) {
      notify.error("Please select a payment method");
      return;
    }

    // Handle manual payments (Cash, Vendor Account)
    if (selectedMethod.manual) {
      await handleManualPayment();
      return;
    }

    // Handle digital payments (M-Pesa, Card, Bank, Client STK)
    if (selectedPaymentMethod === "client_stk") {
      await handleClientStkPayment();
      return;
    }

    if (selectedPaymentMethod !== "mpesa") {
      notify.warning("Only M-Pesa and Client STK payments are currently available");
      return;
    }

    const paymentSession = ++paymentSessionRef.current;

    try {
      setPaymentStatus("requesting");

      // Request STK Push
      const stkPayload = {
        phoneNumber: phoneNumber,
        orderNO: orderData.OrderNO,
        isCashOnDelivery: orderData.CashOnDeliveryRequired || false,
      };

      const stkResponse = await requestSTKPush(stkPayload);

      if (paymentSession !== paymentSessionRef.current) return;

      // Check if there's an error in the response
      if (stkResponse && stkResponse.Error === true) {
        throw new Error(stkResponse.Message || "STK Push request failed");
      }

      // Handle the nested response structure
      if (stkResponse?.Response?.CheckoutRequestID) {
        const checkoutRequestID = stkResponse.Response.CheckoutRequestID;
        setCheckoutRequestID(checkoutRequestID);
        setPaymentStatus("pending");

        // Use the message from the response or fallback to default
        const message =
          stkResponse.Message ||
          "STK Push sent! Please check your phone and enter your M-Pesa PIN";
        notify.success(message);

        // Start checking payment status
        startPaymentStatusCheck(checkoutRequestID, paymentSession);
      } else {
        // Handle error case
        const errorMessage =
          stkResponse?.Message || "Failed to initiate STK Push";
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      if (paymentSession === paymentSessionRef.current) {
        setPaymentStatus("failed");
        notify.error(error.message || "Failed to initiate payment");
      }
    }
  };

  const startPaymentStatusCheck = (requestID, paymentSession) => {
    let attempts = 0;
    const maxAttempts = 30; // Check for 2.5 minutes (30 * 5 seconds)

    const interval = setInterval(async () => {
      if (paymentSession !== paymentSessionRef.current) {
        clearInterval(interval);
        return;
      }

      attempts++;

      try {
        setPaymentStatus("checking");
        const checkResponse = await checkStkPush({
          checkoutRequestID: requestID,
        });

        if (paymentSession !== paymentSessionRef.current) return;

        // Handle the actual response structure
        if (checkResponse?.Response) {
          const { ResultCode, ResultDesc, TransID, Amount } =
            checkResponse.Response;

          // Check if we have a definitive result
          if (ResultCode !== undefined) {
            clearInterval(interval);
            checkingIntervalRef.current = null;

            if (ResultCode === 0) {
              // Payment successful (ResultCode 0 means success)
              setPaymentStatus("completing");
              await completePayment({
                TransID: TransID,
                Amount: Amount,
                ResultDesc: ResultDesc,
                ...checkResponse.Response,
              });
            } else {
              // Payment failed or cancelled
              setPaymentStatus("failed");
              const errorMessage =
                ResultDesc || "Payment was cancelled or failed";
              notify.error(errorMessage);
            }
          } else if (attempts >= maxAttempts) {
            // Timeout - no definitive result yet
            clearInterval(interval);
            checkingIntervalRef.current = null;
            setPaymentStatus("failed");
            notify.error("Payment verification timeout. Please try again.");
          }
          // If ResultCode is undefined, continue checking (payment still pending)
        } else if (attempts >= maxAttempts) {
          // Timeout
          clearInterval(interval);
          checkingIntervalRef.current = null;
          setPaymentStatus("failed");
          notify.error("Payment verification timeout. Please try again.");
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          checkingIntervalRef.current = null;
          setPaymentStatus("failed");
          notify.error("Failed to verify payment status");
        }
      }
    }, 5000); // Check every 5 seconds

    checkingIntervalRef.current = interval;
  };

  const handleCancelStkPush = () => {
    paymentSessionRef.current += 1;

    if (checkingIntervalRef.current) {
      clearInterval(checkingIntervalRef.current);
      checkingIntervalRef.current = null;
    }

    setCheckoutRequestID("");
    setPaymentStatus("idle");
    notify.warning(
      "STK payment flow cancelled. A prompt already sent to the phone may still remain active."
    );
  };

  const completePayment = async (transactionData) => {
    try {
      const completePayload = {
        transID: transactionData.TransID,
        orderNO: orderData.OrderNO || orderData.orderNO,
        isCodPayment: isCodPayment ? 1 : 0,
        totalOrderAmount: totalAmount,
        notes: deliveryNotes,
        paymentMethodTypeCode: getPaymentMethodCode(selectedPaymentMethod),
      };

      const completeResponse = await completeServicePayment(completePayload);
      if (completeResponse?.Error) {
        throw new Error(completeResponse.Message || "Payment could not be recorded");
      }

      setPaymentStatus("completed");
      setPaymentData(transactionData);
      notify.success(
        `${
          paymentType === "reconciliation" ? "Reconciliation" : "Service fee"
        } payment completed successfully!`
      );

      // Call completion handler
      if (onPaymentComplete) {
        onPaymentComplete({
          orderData,
          paymentData: transactionData,
          completeResponse,
          paymentType,
          deliveryNotes,
        });
      }
    } catch (error) {
      setPaymentStatus("failed");
      notify.error(
        "Payment was received but there was an error completing the order"
      );
    }
  };

  const handleConfirmPayment = async () => {
    if (!confirmTransID.trim()) {
      notify.error("Please enter the Transaction ID");
      return;
    }

    if (!confirmAmount.trim()) {
      notify.error("Please enter the payment amount");
      return;
    }

    try {
      setConfirmingPayment(true);
      setConfirmPaymentFeedback(null);

      const confirmPayload = {
        TransID: confirmTransID.trim(),
        TotalOrderAmount: parseInt(confirmAmount.trim()),
      };

      const confirmResponse = await confirmPayment(confirmPayload);

      // Handle the actual ConfirmPayment response structure
      if (confirmResponse?.Error === true) {
        const errorMessage =
          confirmResponse.Message || "Payment confirmation failed";
        const isPaymentMissing = /NO\s+PAYMENTS?\s+RECEIVED|PAYMENT\s+NOT\s+FOUND/i.test(errorMessage);
        setConfirmPaymentFeedback({ variant: isPaymentMissing ? "warning" : "danger", message: errorMessage });
        if (isPaymentMissing) notify.warning(errorMessage);
        else notify.error(errorMessage);
        return;
      }

      // Check if payment amount indicates it's already been used
      if (confirmResponse?.Amount === -1) {
        const errorMessage = confirmResponse.Message || "This payment has already been processed";
        setConfirmPaymentFeedback({ variant: "warning", message: errorMessage });
        notify.warning(errorMessage);
        return;
      }

      // Payment confirmed successfully
      const transactionData = {
        TransID: confirmResponse.TransID || confirmTransID.trim(),
        Amount: confirmResponse.Amount || parseInt(confirmAmount.trim()),
        CustomerName: confirmResponse.CustomerName,
        ResultDesc: confirmResponse.Message || "Payment confirmed successfully",
        ...confirmResponse,
      };

      // Complete the payment using the confirmed transaction
      await completePayment(transactionData);

      // Hide the confirm form
      setShowConfirmForm(false);
    } catch (error) {
      const errorMessage = error.message || "Failed to confirm payment";
      setConfirmPaymentFeedback({ variant: "danger", message: errorMessage });
      notify.error(errorMessage);
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleManualPayment = async () => {
    if (!paymentReference.trim()) {
      notify.error("Please add notes for this manual payment");
      return;
    }

    try {
      setCompletingManualPayment(true);

      // Create a simulated transaction data for manual payments
      const transactionData = {
        TransID: paymentReference.trim(),
        Amount: totalAmount,
        CustomerName: orderData.CustomerName,
        ResultDesc: `${
          selectedPaymentMethod === "cash" ? "Cash" : "Vendor Account"
        } payment recorded manually`,
        PaymentMethod: selectedPaymentMethod,
        Notes: deliveryNotes,
        ManualPayment: true,
        PaymentDate: new Date().toISOString(),
      };

      // Complete the payment using the manual transaction data
      await completePayment(transactionData);
    } catch (error) {
      console.error("Manual payment completion error:", error);
      notify.error(error.message || "Failed to complete manual payment");
    } finally {
      setCompletingManualPayment(false);
    }
  };

  const handleClientStkPayment = async () => {
    const paymentSession = ++paymentSessionRef.current;

    try {
      setPaymentStatus("requesting");

      // Request Client STK Push - matches PostEmmerceMpesaModel schema
      const clientStkPayload = {
        orderNumber: orderData.OrderNO,
        phoneNumber: phoneNumber,
      };

      const clientStkResponse = await postMpesaOrder(clientStkPayload);

      if (paymentSession !== paymentSessionRef.current) return;

      // Check if there's an error in the response
      if (clientStkResponse && clientStkResponse.Error === true) {
        throw new Error(clientStkResponse.Message || "Client STK Push request failed");
      }

      // Handle the nested response structure
      if (clientStkResponse?.Response?.CheckoutRequestID) {
        const checkoutRequestID = clientStkResponse.Response.CheckoutRequestID;
        setCheckoutRequestID(checkoutRequestID);
        setPaymentStatus("pending");

        // Use the message from the response or fallback to default
        const message =
          clientStkResponse.Message ||
          "Client STK Push sent! The client should check their phone and enter their M-Pesa PIN";
        notify.success(message);

        // Start checking payment status
        startPaymentStatusCheck(checkoutRequestID, paymentSession);
      } else {
        // Handle error case
        const errorMessage =
          clientStkResponse?.Message || "Failed to initiate Client STK Push";
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Client STK payment initiation error:", error);
      if (paymentSession === paymentSessionRef.current) {
        setPaymentStatus("failed");
        notify.error(error.message || "Failed to initiate client STK payment");
      }
    }
  };

  const renderPaymentStatus = () => {
    switch (paymentStatus) {
      case "requesting":
        return (
          <Alert variant="info" className="payment-status-alert" role="status">
            <div className="payment-status-content">
              <span className="payment-status-icon">
                <Spinner className="payment-action-spinner" />
              </span>
              <div>
                <strong>Sending STK push</strong>
                <small>Connecting securely to M-Pesa…</small>
              </div>
            </div>
            <Button variant="outline-danger" size="sm" onClick={handleCancelStkPush}>
              <XCircle size={16} />
              Cancel
            </Button>
          </Alert>
        );

      case "pending":
        return (
          <Alert variant="warning" className="payment-status-alert payment-pending" role="status">
            <div className="payment-status-content">
              <span className="payment-status-icon"><Clock size={20} /></span>
              <div>
                <strong>Waiting for M-Pesa confirmation</strong>
                <small>Check the phone and enter the M-Pesa PIN.</small>
              </div>
            </div>
            <Button variant="outline-danger" size="sm" onClick={handleCancelStkPush}>
              <XCircle size={16} />
              Cancel
            </Button>
          </Alert>
        );

      case "checking":
        return (
          <Alert variant="info" className="payment-status-alert" role="status">
            <div className="payment-status-content">
              <span className="payment-status-icon">
                <Spinner className="payment-action-spinner" />
              </span>
              <div>
                <strong>Verifying payment</strong>
                <small>This usually takes only a few seconds.</small>
              </div>
            </div>
            <Button variant="outline-danger" size="sm" onClick={handleCancelStkPush}>
              <XCircle size={16} />
              Cancel
            </Button>
          </Alert>
        );

      case "completing":
        return (
          <Alert variant="info" className="payment-status-alert" role="status">
            <div className="payment-status-content">
              <span className="payment-status-icon">
                <Spinner className="payment-action-spinner" />
              </span>
              <div>
                <strong>Finalizing your order</strong>
                <small>Payment was received. We’re saving the transaction…</small>
              </div>
            </div>
          </Alert>
        );

      case "completed":
        return (
          <Alert variant="success" className="payment-status-alert" role="status">
            <div className="payment-status-content">
              <span className="payment-status-icon"><CheckCircle size={20} /></span>
              <div>
                <strong>Payment completed</strong>
                <small>The order payment was recorded successfully.</small>
              </div>
            </div>
          </Alert>
        );

      case "failed":
        return (
          <Alert variant="danger" className="payment-status-alert" role="alert">
            <div className="payment-status-content">
              <span className="payment-status-icon"><AlertCircle size={20} /></span>
              <div>
                <strong>Payment not completed</strong>
                <small>Review the details and try again.</small>
              </div>
            </div>
          </Alert>
        );

      default:
        return null;
    }
  };

  return (
    <div className="payment-step">
      <div className="payment-page-header">
        <div>
          <span className="payment-eyebrow">Secure checkout</span>
          <h4>Complete Payment</h4>
          <p>Choose how you would like to settle this order.</p>
        </div>
        <div className="payment-order-reference">
          <span>Order</span>
          <strong>{orderData?.OrderNO}</strong>
        </div>
      </div>

      {/* Order Summary */}
      <Card className="mb-4 order-summary-card payment-surface">
        <Card.Header>
          <h5 className="mb-0">Order Summary</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <p className="summary-item">
                <span>Order number</span>
                <strong>{orderData?.OrderNO}</strong>
              </p>
              <p className="summary-item mb-md-0">
                <span>Service fee mandatory</span>
                <strong>{isServiceFeeMandatory ? "Yes" : "No"}</strong>
              </p>
            </Col>
            <Col md={6}>
              <div className="payment-total">
                <span>Total amount</span>
                <strong>KES {Number(totalAmount || 0).toLocaleString()}</strong>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Payment Methods */}
      <Card className="mb-4 payment-surface payment-methods-section">
        <Card.Header className="payment-methods-header">
          <div>
            <h5 className="mb-1">Select Payment Method</h5>
            <p className="mb-0">Choose the most convenient way to complete this payment.</p>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="payment-method-grid" role="radiogroup" aria-label="Payment method">
            {paymentMethods.map((method) => (
              <Card
                key={method.id}
                data-method={method.id}
                className={`payment-method-card ${
                  selectedPaymentMethod === method.id ? "selected" : ""
                } ${!method.enabled ? "disabled" : ""} ${
                  method.brand ? "payment-brand-card" : ""
                }`}
                style={{ "--method-color": method.color }}
                onClick={() =>
                  method.enabled && setSelectedPaymentMethod(method.id)
                }
                onKeyDown={(event) => {
                  if (
                    method.enabled &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    setSelectedPaymentMethod(method.id);
                  }
                }}
                role="radio"
                aria-checked={selectedPaymentMethod === method.id}
                aria-disabled={!method.enabled}
                tabIndex={method.enabled ? 0 : -1}
              >
                <Card.Body>
                  <div className="payment-method-card-top">
                    <div className="payment-method-icon">
                      {method.icon}
                    </div>
                    {selectedPaymentMethod === method.id && method.enabled ? (
                      <span className="payment-selected-mark">
                        <CheckCircle size={17} />
                        Selected
                      </span>
                    ) : (
                      <span className={`payment-availability ${method.enabled ? "available" : "coming-soon"}`}>
                        {method.enabled ? "Available" : "Coming soon"}
                      </span>
                    )}
                  </div>
                  <div className="payment-method-copy">
                    <h6>
                      {method.name}
                    </h6>
                    <p className="payment-method-description">
                      {method.description}
                    </p>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* M-Pesa Payment Form */}
      {selectedPaymentMethod === "mpesa" && (
        <Card className="mb-4 payment-form-card">
          <Card.Header>
            <h5 className="mb-0">M-Pesa Payment Details</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number *</Form.Label>
                  <div className="phone-input-group">
                    <Form.Control
                      type="tel"
                      placeholder="e.g., 0712345678"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      disabled={isPaymentBusy || confirmingPayment}
                    />
                  </div>
                  <Form.Text className="text-muted">
                    Enter your M-Pesa registered phone number
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <div className="payment-info">
                  <p>
                    <strong>Amount to Pay:</strong> KES {totalAmount}
                  </p>
                  <p>
                    <strong>Payment Method:</strong> M-Pesa STK Push
                  </p>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Client STK Payment Form */}
      {selectedPaymentMethod === "client_stk" && (
        <Card className="mb-4 payment-form-card">
          <Card.Header>
            <h5 className="mb-0">Client STK Push Details</h5>
          </Card.Header>
          <Card.Body>
            <Alert variant="info" className="mb-3">
              <small>
                This will send an M-Pesa STK push to the client's phone number. Ensure the phone number belongs to the customer receiving the order.
              </small>
            </Alert>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Client Phone Number *</Form.Label>
                  <div className="phone-input-group">
                    <Form.Control
                      type="tel"
                      placeholder="e.g., 0712345678"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      disabled={isPaymentBusy || confirmingPayment}
                    />
                  </div>
                  <Form.Text className="text-muted">
                    Enter the client's M-Pesa registered phone number
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <div className="payment-info">
                  <p>
                    <strong>Amount to Pay:</strong> KES {totalAmount}
                  </p>
                  <p>
                    <strong>Payment Method:</strong> Client STK Push
                  </p>
                  <p>
                    <strong>Order:</strong> {orderData?.OrderNO}
                  </p>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Manual Payment Form (Cash / Vendor Account) */}
      {(selectedPaymentMethod === "cash" ||
        selectedPaymentMethod === "vendor_account") && (
        <Card className="mb-4 payment-form-card">
          <Card.Header>
            <h5 className="mb-0">
              {selectedPaymentMethod === "cash"
                ? "Cash Payment"
                : "Vendor Account Payment"}
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Reference *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder={`Add payment reference for this ${
                      selectedPaymentMethod === "cash"
                        ? "cash"
                        : "vendor account"
                    } payment...`}
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    disabled={completingManualPayment}
                  />
                  <Form.Text className="text-muted">
                    Enter payment reference (e.g., receipt number, transaction details)
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <div className="payment-info">
                  <p>
                    <strong>Amount to Collect:</strong> KES {totalAmount}
                  </p>
                  <p>
                    <strong>Payment Method:</strong>{" "}
                    {selectedPaymentMethod === "cash"
                      ? "Cash"
                      : "Vendor Account"}
                  </p>
                  <p>
                    <strong>Order:</strong> {orderData?.OrderNO}
                  </p>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Confirm Payment Section */}
      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Already Paid?</h5>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setShowConfirmForm(!showConfirmForm)}
            >
              {showConfirmForm ? "Hide" : "Confirm Payment"}
            </Button>
          </div>
        </Card.Header>
        {showConfirmForm && (
          <Card.Body>
            <Alert variant="info" className="mb-3">
              <small>
                If you have already made the payment but the system didn't
                register it, or if you navigated away from this page, you can
                manually confirm your payment here.
              </small>
            </Alert>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Transaction ID (TransID) *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., QWERTY123456"
                    value={confirmTransID}
                    onChange={(e) => { setConfirmTransID(e.target.value); setConfirmPaymentFeedback(null); }}
                    disabled={confirmingPayment}
                  />
                  <Form.Text className="text-muted">
                    Enter the Transaction ID from your M-Pesa message
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Amount *</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g., 100"
                    value={confirmAmount}
                    onChange={(e) => { setConfirmAmount(e.target.value); setConfirmPaymentFeedback(null); }}
                    disabled={confirmingPayment}
                  />
                  <Form.Text className="text-muted">
                    Enter the exact amount you paid
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            {confirmPaymentFeedback && <Alert variant={confirmPaymentFeedback.variant} className="mb-3">{confirmPaymentFeedback.message}</Alert>}
            <div className="d-flex justify-content-end">
              <Button
                variant="primary"
                className="payment-primary-button"
                onClick={handleConfirmPayment}
                disabled={
                  confirmingPayment ||
                  !confirmTransID.trim() ||
                  !confirmAmount.trim()
                }
              >
                {confirmingPayment ? (
                  <>
                    <Spinner className="payment-action-spinner" />
                    Confirming...
                  </>
                ) : (
                  "Confirm Payment"
                )}
              </Button>
            </div>
          </Card.Body>
        )}
      </Card>

      {/* Delivery Notes */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Delivery Notes</h5>
        </Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Notes (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Add any delivery instructions or notes..."
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              disabled={
                isPaymentBusy ||
                confirmingPayment ||
                completingManualPayment
              }
            />
            <Form.Text className="text-muted">
              Add any special delivery instructions, landmarks, or additional notes for the delivery team.
            </Form.Text>
          </Form.Group>
        </Card.Body>
      </Card>

      {/* Payment Status */}
      {renderPaymentStatus()}

      {/* Error Display */}
      {error && (
        <Alert variant="danger" className="mb-4 payment-status-alert">
          {error}
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="payment-actions">
        <Button
          variant="outline-secondary"
          className="payment-secondary-button"
          onClick={onBack}
          disabled={
            isPaymentBusy ||
            confirmingPayment ||
            completingManualPayment
          }
        >
          {secondaryActionLabel}
        </Button>

        {paymentStatus !== "completed" && (
          <Button
            variant="primary"
            className="payment-primary-button"
            onClick={handlePayment}
            disabled={
              ((selectedPaymentMethod === "mpesa" || selectedPaymentMethod === "client_stk") && !phoneNumber) ||
              ((selectedPaymentMethod === "cash" ||
                selectedPaymentMethod === "vendor_account") &&
                !paymentReference.trim()) ||
              loading ||
              isPaymentBusy ||
              confirmingPayment ||
              completingManualPayment
            }
          >
            {paymentStatus === "requesting" ? (
              <>
                <Spinner className="payment-action-spinner" />
                Sending STK push…
              </>
            ) : paymentStatus === "pending" || paymentStatus === "checking" ? (
              <>
                <Spinner className="payment-action-spinner" />
                Verifying payment…
              </>
            ) : paymentStatus === "completing" ? (
              <>
                <Spinner className="payment-action-spinner" />
                Finalizing order…
              </>
            ) : completingManualPayment ? (
              <>
                <Spinner className="payment-action-spinner" />
                Completing payment…
              </>
            ) : loading ? (
              <>
                <Spinner className="payment-action-spinner" />
                Processing…
              </>
            ) : (
              `Pay with ${
                paymentMethods.find((m) => m.id === selectedPaymentMethod)
                  ?.name || "Selected Method"
              }`
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default PaymentStep;
