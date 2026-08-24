"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useShipment } from "@/hooks/useShipment";

const NORMAL_FLOW = [
  {
    statusCode: "ORDER_CONFIRMED",
    label: "Order Confirmed",
    phaseCode: "VENDOR",
    icon: "check-circle",
  },
  {
    statusCode: "PICKED_BY_COURIER",
    label: "Picked by Courier",
    phaseCode: "PICKUP",
    icon: "package",
  },
  {
    statusCode: "RECEIVED_AT_DC",
    label: "Received at DC",
    phaseCode: "DC",
    icon: "home",
  },
  {
    statusCode: "IN_TRANSIT_TO_DC",
    label: "In Transit",
    phaseCode: "INBOUND",
    icon: "truck",
  },
  {
    statusCode: "ASSIGNED_TO_RIDER",
    label: "Assigned to Rider",
    phaseCode: "DELIVERY",
    icon: "user-check",
  },
  {
    statusCode: "OUT_FOR_DELIVERY",
    label: "Out for Delivery",
    phaseCode: "DELIVERY",
    icon: "navigation",
  },
  {
    statusCode: "DELIVERED",
    label: "Delivered",
    phaseCode: "DELIVERY",
    icon: "check-circle",
  },
];

const TrackingComponent = ({
  basePath,
  title = "Track Your Shipment",
  placeholder = "Enter tracking number...",
  backButton = null,
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [trackingNumber, setTrackingNumber] = useState("");

  const {
    shipmentTimeline,
    loading,
    error,
    fetchShipmentTimeline,
    clearTimeline,
  } = useShipment();

  useEffect(() => {
    const orderNo = searchParams.get("trackingNumber");

    if (orderNo) {
      const cleanOrderNo = orderNo.trim();

      setTrackingNumber(cleanOrderNo);
      fetchShipmentTimeline({
        orderNo: cleanOrderNo,
      });
    }
  }, [searchParams, fetchShipmentTimeline]);

  const orderedTimeline = useMemo(() => {
    return [...(shipmentTimeline || [])].sort(
      (a, b) =>
        Number(a.SequenceNo || 0) -
          Number(b.SequenceNo || 0) ||
        new Date(a.EventTime || 0) -
          new Date(b.EventTime || 0)
    );
  }, [shipmentTimeline]);

  const historyTimeline = useMemo(() => {
    return [...orderedTimeline].reverse();
  }, [orderedTimeline]);

  const firstEvent = orderedTimeline[0] || null;

  const latestEvent =
    orderedTimeline.length > 0
      ? orderedTimeline[orderedTimeline.length - 1]
      : null;

  const orderNo =
    latestEvent?.OrderNO ||
    firstEvent?.OrderNO ||
    trackingNumber ||
    "";

  const shipmentHeader = useMemo(() => {
    const statusCode = String(
      latestEvent?.StatusCode || ""
    ).toUpperCase();

    const statusMessages = {
      ORDER_CONFIRMED: {
        type: "info",
        icon: "check-circle",
        title: "Order confirmed",
        message:
          "The vendor has confirmed the order and it is awaiting courier collection.",
        nextStep:
          "Next: Courier picks up the shipment.",
      },

      PICKED_BY_COURIER: {
        type: "info",
        icon: "package",
        title: "Shipment collected",
        message:
          "The courier has collected the order from the vendor.",
        nextStep:
          "Next: Shipment will be received at the distribution centre.",
      },

      RECEIVED_AT_DC: {
        type: "info",
        icon: "home",
        title: "Received at distribution centre",
        message:
          "The shipment has been received and checked into the distribution centre.",
        nextStep:
          "Next: Shipment will be processed for onward transport.",
      },

      IN_TRANSIT_TO_DC: {
        type: "primary",
        icon: "truck",
        title: "Shipment progressing normally",
        message:
          "The shipment is currently moving between distribution centres or logistics hubs.",
        nextStep:
          "Next: Shipment will be assigned to a delivery rider.",
      },

      ASSIGNED_TO_RIDER: {
        type: "primary",
        icon: "user-check",
        title: "Assigned to rider",
        message:
          "A rider has been assigned and is preparing for delivery.",
        nextStep:
          "Next: Rider departs for delivery.",
      },

      OUT_FOR_DELIVERY: {
        type: "primary",
        icon: "navigation",
        title: "Out for delivery",
        message:
          "The rider is currently delivering the shipment.",
        nextStep:
          "Please keep your phone available for the rider.",
      },

      DELIVERED: {
        type: "success",
        icon: "check-circle",
        title: "Delivered successfully",
        message:
          "The shipment has been delivered to the customer.",
        nextStep:
          "No further action is required.",
      },

      RESCHEDULED: {
        type: "warning",
        icon: "calendar",
        title: "Delivery rescheduled",
        message:
          "The delivery has been moved to another date or time.",
        nextStep:
          "Wait for the updated delivery schedule.",
      },

      DELIVERY_ATTEMPT_2: {
        type: "warning",
        icon: "rotate-cw",
        title: "Second delivery attempt unsuccessful",
        message:
          "The rider was unable to complete the second delivery attempt.",
        nextStep:
          "Confirm customer availability and delivery details.",
      },

      DELIVERY_ATTEMPT_3: {
        type: "danger",
        icon: "alert-triangle",
        title: "Delivery requires attention",
        message:
          "The third delivery attempt was unsuccessful.",
        nextStep:
          "Contact support to arrange collection, reassignment or return.",
      },

      RE_ASSIGNED: {
        type: "info",
        icon: "repeat",
        title: "Shipment reassigned",
        message:
          "The shipment has been assigned to a different rider.",
        nextStep:
          "Wait for the new rider to begin delivery.",
      },

      RETURN_IN_TRANSIT: {
        type: "warning",
        icon: "corner-up-left",
        title: "Return in progress",
        message:
          "The shipment is being transported back to the distribution centre.",
        nextStep:
          "Next: Shipment will be returned to the vendor.",
      },

      RETURNED_TO_VENDOR: {
        type: "secondary",
        icon: "archive",
        title: "Returned to vendor",
        message:
          "The shipment has been returned to the originating vendor.",
        nextStep:
          "Contact support or the vendor for further assistance.",
      },

      ACCEPTED: {
        type: "success",
        icon: "check-circle",
        title: "Order completed",
        message:
          "The order lifecycle has been successfully completed and closed.",
        nextStep:
          "No further action is required.",
      },

      DECLINED: {
        type: "danger",
        icon: "x-circle",
        title: "Shipment declined",
        message:
          "The shipment has been declined, cancelled or rejected.",
        nextStep:
          "This shipment will not continue to delivery.",
      },

      PAYMENT_PENDING: {
        type: "warning",
        icon: "clock",
        title: "Payment required",
        message:
          "The shipment is paused until the required payment is completed.",
        nextStep:
          "Complete payment to allow shipment processing to continue.",
      },

      PAYMENT_RECEIVED: {
        type: "success",
        icon: "credit-card",
        title: "Payment received",
        message:
          "Payment has been received and verified successfully.",
        nextStep:
          "Shipment processing can now continue.",
      },

      PAYMENT_FAILED: {
        type: "danger",
        icon: "alert-circle",
        title: "Payment failed",
        message:
          "The payment attempt failed or could not be verified.",
        nextStep:
          "Retry payment or contact customer support.",
      },

      PAYMENT_WAIVED: {
        type: "info",
        icon: "slash",
        title: "Payment waived",
        message:
          "The payment requirement has been waived.",
        nextStep:
          "Shipment processing can continue.",
      },
    };

    return (
      statusMessages[statusCode] || {
        type: "secondary",
        icon: "info",
        title:
          latestEvent?.StatusName ||
          "Shipment update",
        message:
          latestEvent?.Description ||
          "The shipment status has been updated.",
        nextStep:
          "Check the shipment history for more information.",
      }
    );
  }, [latestEvent]);

  const progressSteps = useMemo(() => {
    const normalFlowCodes = new Set(
      NORMAL_FLOW.map((step) => step.statusCode)
    );

    const normalFlowEvents = orderedTimeline.filter(
      (event) =>
        normalFlowCodes.has(
          String(
            event.StatusCode || ""
          ).toUpperCase()
        )
    );

    const eventsByCode = new Map(
      normalFlowEvents.map((event) => [
        String(
          event.StatusCode || ""
        ).toUpperCase(),
        event,
      ])
    );

    const reachedCodes = new Set(
      eventsByCode.keys()
    );

    const latestNormalEvent =
      normalFlowEvents.length > 0
        ? normalFlowEvents[
            normalFlowEvents.length - 1
          ]
        : null;

    const latestNormalCode = String(
      latestNormalEvent?.StatusCode || ""
    ).toUpperCase();

    const latestNormalIndex =
      NORMAL_FLOW.findIndex(
        (step) =>
          step.statusCode === latestNormalCode
      );

    return NORMAL_FLOW.map((step, index) => {
      const matchingEvent =
        eventsByCode.get(step.statusCode) || null;

      const isDelivered =
        step.statusCode === "DELIVERED" &&
        reachedCodes.has("DELIVERED");

      const isCurrent =
        latestNormalIndex >= 0 &&
        index === latestNormalIndex &&
        !isDelivered;

      const isCompleted =
        reachedCodes.has(step.statusCode) &&
        (!isCurrent || isDelivered);

      const isUpcoming =
        latestNormalIndex === -1 ||
        index > latestNormalIndex;

      return {
        ...step,
        event: matchingEvent,
        isCurrent,
        isCompleted,
        isUpcoming,
      };
    });
  }, [orderedTimeline]);

    const handleTrack = async (event) => {
    event.preventDefault();

    const cleanOrderNo = trackingNumber.trim();

    if (!cleanOrderNo) return;

    try {
      router.push(
        `${basePath}?trackingNumber=${encodeURIComponent(
          cleanOrderNo
        )}`
      );

      await fetchShipmentTimeline({
        orderNo: cleanOrderNo,
      });
    } catch (fetchError) {
      console.error(
        "Error fetching shipment timeline:",
        fetchError
      );
    }
  };

  const handleClearResults = () => {
    setTrackingNumber("");
    clearTimeline();
    router.push(basePath);
  };

  const formatDateTime = (value) => {
    if (!value) {
      return "Date unavailable";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  };

  const getStatusType = (event) => {
    const statusCode = String(
      event?.StatusCode || ""
    ).toUpperCase();

    const statusTypeMap = {
      ORDER_CONFIRMED: "confirmed",
      PICKED_BY_COURIER: "picked",
      RECEIVED_AT_DC: "received",
      IN_TRANSIT_TO_DC: "transit",
      ASSIGNED_TO_RIDER: "assigned",
      OUT_FOR_DELIVERY: "out-for-delivery",
      DELIVERED: "delivered",
      RESCHEDULED: "rescheduled",
      DELIVERY_ATTEMPT_2: "attempt",
      DELIVERY_ATTEMPT_3: "attempt-danger",
      RE_ASSIGNED: "reassigned",
      RETURN_IN_TRANSIT: "return-transit",
      RETURNED_TO_VENDOR: "returned",
      ACCEPTED: "accepted",
      DECLINED: "declined",
      PAYMENT_PENDING: "payment-pending",
      PAYMENT_RECEIVED: "payment-received",
      PAYMENT_FAILED: "payment-failed",
      PAYMENT_WAIVED: "payment-waived",
      EXPRESS: "service-express",
      NEXT_DAY: "service-next-day",
      SAME_DAY_CONSOLIDATED:
        "service-same-day",
    };

    return (
      statusTypeMap[statusCode] || "secondary"
    );
  };

  const getStatusIcon = (event) => {
    const statusCode = String(
      event?.StatusCode || ""
    ).toUpperCase();

    const statusIconMap = {
      ORDER_CONFIRMED: "check-circle",
      PICKED_BY_COURIER: "package",
      RECEIVED_AT_DC: "home",
      IN_TRANSIT_TO_DC: "truck",
      ASSIGNED_TO_RIDER: "user-check",
      OUT_FOR_DELIVERY: "navigation",
      DELIVERED: "check",
      RESCHEDULED: "calendar",
      DELIVERY_ATTEMPT_2: "rotate-cw",
      DELIVERY_ATTEMPT_3:
        "alert-triangle",
      RE_ASSIGNED: "repeat",
      RETURN_IN_TRANSIT:
        "corner-up-left",
      RETURNED_TO_VENDOR: "archive",
      ACCEPTED: "check-circle",
      DECLINED: "x-circle",
      PAYMENT_PENDING: "clock",
      PAYMENT_RECEIVED: "credit-card",
      PAYMENT_FAILED: "alert-circle",
      PAYMENT_WAIVED: "slash",
      EXPRESS: "zap",
      NEXT_DAY: "sunrise",
      SAME_DAY_CONSOLIDATED: "layers",
    };

    return (
      statusIconMap[statusCode] || "circle"
    );
  };

  return (
    <div className="content shipment-tracking-page">
      {backButton && (
        <div className="mb-3">
          {backButton}
        </div>
      )}

      <section className="tracking-search-card">
        <div className="tracking-search-heading">
          <div>
            <span className="tracking-eyebrow">
              Shipment tracking
            </span>

            <h3>{title}</h3>
          </div>

          {orderedTimeline.length > 0 && (
            <button
              type="button"
              className="btn btn-light btn-sm"
              onClick={handleClearResults}
            >
              <i className="feather-refresh-cw me-1" />
              New search
            </button>
          )}
        </div>

        <form onSubmit={handleTrack}>
          <div className="input-group">
            <span className="input-group-text">
              <i className="feather-package" />
            </span>

            <input
              type="text"
              className="form-control form-control-lg"
              placeholder={placeholder}
              value={trackingNumber}
              onChange={(event) =>
                setTrackingNumber(
                  event.target.value
                )
              }
              required
            />

            <button
              className="btn btn-success btn-lg px-4"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  />

                  Tracking...
                </>
              ) : (
                <>
                  <i className="feather-search me-2" />
                  Track
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div
            className="alert alert-danger mt-3 mb-0"
            role="alert"
          >
            <i className="feather-alert-circle me-2" />
            {error}
          </div>
        )}
      </section>

      {orderedTimeline.length > 0 && (
        <div className="tracking-results">
          <div className="tracking-number-title">
            Tracking No:{" "}
            <strong>{orderNo}</strong>
          </div>

          <section
            className={`shipment-status-header ${shipmentHeader.type}`}
          >
            <div className="status-header-icon">
              <i
                className={`feather-${shipmentHeader.icon}`}
              />
            </div>

            <div className="status-header-content">
              <span className="status-header-label">
                Current shipment status
              </span>

              <h4>{shipmentHeader.title}</h4>

              <p>
                {shipmentHeader.message}
              </p>

              <div className="next-step">
                <i className="feather-arrow-right-circle" />

                <strong>
                  {shipmentHeader.nextStep}
                </strong>
              </div>
            </div>

            <div className="status-header-time">
              <span>Last updated</span>

              <strong>
                {formatDateTime(
                  latestEvent?.DisplayTime ||
                    latestEvent?.EventTime
                )}
              </strong>
            </div>
          </section>

          <section className="shipment-overview-card">
            <div className="shipment-summary-grid">
              <div className="summary-item">
                <span>Current Status</span>

                <strong>
                  {latestEvent?.StatusName ||
                    "Unknown"}
                </strong>
              </div>

              <div className="summary-item">
                <span>Current Phase</span>

                <strong>
                  {latestEvent?.PhaseCode ||
                    "N/A"}
                </strong>
              </div>

              <div className="summary-item">
                <span>Current Location</span>

                <strong>
                  {latestEvent?.DCName || "N/A"}
                </strong>

                {latestEvent?.DCCode && (
                  <small>
                    {latestEvent.DCCode}
                  </small>
                )}
              </div>

             
            </div>

            <div className="flow-scroll">
              <div
                className="shipment-flow"
                style={{
                  "--step-count":
                    NORMAL_FLOW.length,
                }}
              >
                {progressSteps.map(
                  (step, index) => {
                    const stepState =
                      step.isCurrent
                        ? "current"
                        : step.isCompleted
                          ? "completed"
                          : "upcoming";

                    return (
                      <div
                        className={`flow-step ${stepState}`}
                        key={
                          step.statusCode
                        }
                      >
                        {index <
                          progressSteps.length -
                            1 && (
                          <div
                            className={`flow-line ${
                              step.isCompleted
                                ? "completed"
                                : ""
                            }`}
                          />
                        )}

                        <div className="flow-circle">
                          <i
                            className={`feather-${step.icon}`}
                          />
                        </div>

                        <strong>
                          {step.phaseCode}
                        </strong>

                        <span>
                          {step.label}
                        </span>

                        <small>
                          {step.isCompleted
                            ? "Completed"
                            : step.isCurrent
                              ? "Current status"
                              : "Not reached"}
                        </small>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </section>
                    <section className="shipment-history-section">
            <h3>Shipment History</h3>

            <div className="shipment-history">
              {historyTimeline.map((event, index) => {
                const statusType =
                  getStatusType(event);

                return (
                  <article
                    className={`history-row ${statusType}`}
                    key={`${event.EventID}-${event.SequenceNo}`}
                  >
                    <div className="history-marker-column">
                      <span
                        className={`history-marker ${statusType}`}
                      >
                        <i
                          className={`feather-${getStatusIcon(
                            event
                          )}`}
                        />
                      </span>

                      {index <
                        historyTimeline.length - 1 && (
                        <span className="history-connector" />
                      )}
                    </div>

                    <div className="history-content">
                      <div className="history-heading">
                        <div className="history-main">
                          <div className="history-title-row">
                            <h5>
                              {event.StatusName ||
                                "Shipment update"}
                            </h5>

                            <span
                              className={`phase-badge ${statusType}`}
                            >
                              {event.PhaseCode ||
                                "GENERAL"}
                            </span>
                          </div>

                          {event.Description && (
                            <p className="history-description">
                              {event.Description}
                            </p>
                          )}

                          <div className="history-meta">
                            <span>
                              <i className="feather-map-pin" />

                              {event.DCName ||
                                "Location unavailable"}

                              {event.DCCode
                                ? ` (${event.DCCode})`
                                : ""}
                            </span>

                          

                            {event.ActorName && (
                              <span>
                                <i className="feather-user" />
                                {event.ActorName}
                              </span>
                            )}
                          </div>

                          {event.Notes && (
                            <div className="history-notes">
                              <i className="feather-message-circle" />

                              <span>
                                {event.Notes}
                              </span>
                            </div>
                          )}
                        </div>

                        <time>
                          {formatDateTime(
                            event.DisplayTime ||
                              event.EventTime
                          )}
                        </time>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {!loading &&
        orderedTimeline.length === 0 &&
        trackingNumber &&
        !error && (
          <div className="tracking-empty-state">
            <i className="feather-package" />

            <h5>
              No tracking information found
            </h5>

            <p>
              No tracking data was found for{" "}
              <strong>
                {trackingNumber}
              </strong>
              .
            </p>
          </div>
        )}

      <style jsx>{`
        .shipment-tracking-page {
          --tracking-green: #2f8338;
          --tracking-green-dark: #216b2b;
          --tracking-green-soft: #e9f7ec;
          --tracking-yellow: #ffb000;
          --tracking-yellow-soft: #fff5dc;
          --tracking-blue: #2878c8;
          --tracking-blue-soft: #e9f3ff;
          --tracking-cyan: #18a2b8;
          --tracking-cyan-soft: #e3f8fb;
          --tracking-red: #dc3545;
          --tracking-red-soft: #fdebed;
          --tracking-grey: #68717c;
          --tracking-grey-soft: #eff2f5;
          --tracking-border: #e4e7eb;
          --tracking-text: #171b22;
          --tracking-muted: #6e7781;

          max-width: 1160px;
          margin: 0 auto;
          padding-bottom: 60px;
        }

        .tracking-search-card,
        .shipment-overview-card,
        .tracking-empty-state {
          background: #ffffff;
          border: 1px solid
            var(--tracking-border);
          border-radius: 10px;
          box-shadow: 0 10px 30px
            rgba(30, 41, 59, 0.07);
        }

        .tracking-search-card {
          padding: 22px;
          margin-bottom: 28px;
        }

        .tracking-search-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .tracking-eyebrow {
          display: block;
          color: var(--tracking-green);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 3px;
        }

        .tracking-search-heading h3 {
          margin: 0;
          color: var(--tracking-text);
          font-size: 1.35rem;
          font-weight: 700;
        }

        .tracking-search-card
          .input-group-text {
          background: #ffffff;
          border-right: 0;
          color: var(--tracking-muted);
        }

        .tracking-search-card
          .form-control {
          border-left: 0;
          box-shadow: none;
        }

        .tracking-search-card
          .btn-success {
          background: var(--tracking-green);
          border-color:
            var(--tracking-green);
        }

        .tracking-search-card
          .btn-success:hover {
          background:
            var(--tracking-green-dark);
          border-color:
            var(--tracking-green-dark);
        }

        .tracking-results {
          padding: 0 10px;
        }

        .tracking-number-title {
          margin: 0 0 24px;
          color: var(--tracking-text);
          font-size: clamp(
            1.35rem,
            3vw,
            2rem
          );
        }

        .shipment-status-header {
          display: grid;
          grid-template-columns:
            auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 18px;
          margin-bottom: 24px;
          padding: 20px 22px;
          border: 1px solid #dbe4ee;
          border-left: 5px solid #64748b;
          border-radius: 10px;
          background: #f8fafc;
        }

        .shipment-status-header.success {
          border-left-color: #2f8338;
          background: #f0fdf4;
        }

        .shipment-status-header.primary,
        .shipment-status-header.info {
          border-left-color: #2878c8;
          background: #eff6ff;
        }

        .shipment-status-header.warning {
          border-left-color: #f59e0b;
          background: #fffbeb;
        }

        .shipment-status-header.danger {
          border-left-color: #dc2626;
          background: #fef2f2;
        }

        .status-header-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          color: #ffffff;
          background: #64748b;
          font-size: 1.25rem;
        }

        .shipment-status-header.success
          .status-header-icon {
          background: #2f8338;
        }

        .shipment-status-header.primary
          .status-header-icon,
        .shipment-status-header.info
          .status-header-icon {
          background: #2878c8;
        }

        .shipment-status-header.warning
          .status-header-icon {
          background: #f59e0b;
        }

        .shipment-status-header.danger
          .status-header-icon {
          background: #dc2626;
        }

        .status-header-label {
          display: block;
          margin-bottom: 3px;
          color: #697386;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .status-header-content h4 {
          margin: 0 0 5px;
          color: #171b22;
          font-size: 1.15rem;
          font-weight: 700;
        }

        .status-header-content p {
          margin: 0;
          color: #5f6875;
        }

        .next-step {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 10px;
          color: #303944;
          font-size: 0.82rem;
        }

        .status-header-time {
          display: flex;
          flex-direction: column;
          color: #78818c;
          font-size: 0.72rem;
          text-align: right;
        }

        .status-header-time strong {
          margin-top: 3px;
          color: #252b33;
          font-size: 0.78rem;
        }

        .shipment-overview-card {
          padding: 24px 28px 30px;
          margin-bottom: 34px;
        }

        .shipment-summary-grid {
          display: grid;
          grid-template-columns:
            repeat(
              4,
              minmax(150px, 1fr)
            );
          gap: 18px;
          margin-bottom: 30px;
        }

        .summary-item {
          text-align: center;
          min-width: 0;
        }

        .summary-item span {
          display: block;
          color: var(--tracking-muted);
          font-size: 0.8rem;
          margin-bottom: 4px;
        }

        .summary-item strong {
          display: block;
          color: var(--tracking-text);
          font-size: 0.94rem;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .summary-item small {
          display: block;
          color: var(--tracking-muted);
          margin-top: 3px;
        }
                  .flow-scroll {
          overflow-x: auto;
          padding: 4px 5px 10px;
        }

        .shipment-flow {
          display: grid;
          grid-template-columns:
            repeat(
              var(--step-count),
              minmax(180px, 1fr)
            );
          min-width: max-content;
          align-items: start;
        }

        .flow-step {
          position: relative;
          min-width: 180px;
          padding: 0 12px;
          text-align: center;
        }

        .flow-circle {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 58px;
          height: 58px;
          border: 5px solid #ffffff;
          border-radius: 50%;
          color: #ffffff;
          background:
            var(--tracking-grey);
          box-shadow:
            0 0 0 1px
            var(--tracking-grey);
          font-size: 1.35rem;
        }

        .flow-line {
          position: absolute;
          z-index: 1;
          top: 28px;
          left: calc(50% + 28px);
          width: calc(100% - 56px);
          height: 2px;
          background: #cfd5db;
        }

        .flow-step.upcoming {
          opacity: 0.55;
        }

        .flow-step.upcoming
          .flow-circle {
          color: #8b949e;
          background: #e5e7eb;
          box-shadow:
            0 0 0 1px #cbd0d6;
        }

        .flow-step.upcoming strong,
        .flow-step.upcoming span,
        .flow-step.upcoming small {
          color: #8b949e;
        }

        .flow-step.upcoming
          .flow-line {
          background: #d9dde2;
        }

        .flow-step.completed
          .flow-circle {
          color: #ffffff;
          background: #2f8338;
          box-shadow:
            0 0 0 1px #2f8338;
        }

        .flow-step.completed
          .flow-line,
        .flow-line.completed {
          background: #2f8338;
        }

        .flow-step.current {
          opacity: 1;
        }

        .flow-step.current
          .flow-circle {
          color: #ffffff;
          background: #2878c8;
          box-shadow:
            0 0 0 1px #2878c8;
          animation:
            trackingPulse
            1.8s infinite;
        }

        .flow-step.current strong {
          color: #2878c8;
        }

        .flow-step strong {
          display: block;
          margin-top: 10px;
          color: var(--tracking-text);
          font-size: 0.83rem;
          text-transform: uppercase;
        }

        .flow-step > span {
          display: block;
          max-width: 170px;
          margin: 4px auto 0;
          color: var(--tracking-text);
          font-size: 0.8rem;
          line-height: 1.25;
        }

        .flow-step > small {
          display: block;
          margin-top: 4px;
          color: var(--tracking-muted);
          font-size: 0.72rem;
        }

        .shipment-history-section {
          margin: 0 12px;
        }

        .shipment-history-section > h3 {
          margin: 0 0 18px;
          color: var(--tracking-text);
          font-size: 1.65rem;
          font-weight: 700;
        }

        .history-row {
          display: grid;
          grid-template-columns:
            54px minmax(0, 1fr);
          min-height: 105px;
        }

        .history-marker-column {
          position: relative;
          display: flex;
          justify-content: center;
        }

        .history-marker {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          margin-top: 2px;
          border-radius: 50%;
          color: #ffffff;
          background:
            var(--tracking-grey);
          font-size: 0.85rem;
        }

        .history-marker.confirmed {
          background: #5c6bc0;
          box-shadow:
            0 0 0 1px #5c6bc0;
        }

        .history-marker.picked {
          background: #00a6a6;
          box-shadow:
            0 0 0 1px #00a6a6;
        }

        .history-marker.received {
          background: #f59e0b;
          box-shadow:
            0 0 0 1px #f59e0b;
        }

        .history-marker.transit {
          background: #2563eb;
          box-shadow:
            0 0 0 1px #2563eb;
        }

        .history-marker.assigned {
          background: #7c3aed;
          box-shadow:
            0 0 0 1px #7c3aed;
        }

        .history-marker.out-for-delivery {
          background: #0284c7;
          box-shadow:
            0 0 0 1px #0284c7;
        }

        .history-marker.delivered,
        .history-marker.accepted,
        .history-marker.payment-received {
          background: #2f8338;
          box-shadow:
            0 0 0 1px #2f8338;
        }

        .history-marker.rescheduled,
        .history-marker.payment-pending {
          background: #f59e0b;
          box-shadow:
            0 0 0 1px #f59e0b;
        }

        .history-marker.attempt {
          background: #ea580c;
          box-shadow:
            0 0 0 1px #ea580c;
        }

        .history-marker.attempt-danger,
        .history-marker.declined,
        .history-marker.payment-failed {
          background: #dc2626;
          box-shadow:
            0 0 0 1px #dc2626;
        }

        .history-marker.reassigned {
          background: #9333ea;
          box-shadow:
            0 0 0 1px #9333ea;
        }

        .history-marker.return-transit {
          background: #0f766e;
          box-shadow:
            0 0 0 1px #0f766e;
        }

        .history-marker.returned {
          background: #64748b;
          box-shadow:
            0 0 0 1px #64748b;
        }

        .history-marker.payment-waived {
          background: #475569;
          box-shadow:
            0 0 0 1px #475569;
        }

        .history-marker.service-express {
          background: #e11d48;
          box-shadow:
            0 0 0 1px #e11d48;
        }

        .history-marker.service-next-day {
          background: #0891b2;
          box-shadow:
            0 0 0 1px #0891b2;
        }

        .history-marker.service-same-day {
          background: #4f46e5;
          box-shadow:
            0 0 0 1px #4f46e5;
        }

        .history-connector {
          position: absolute;
          top: 30px;
          bottom: -2px;
          width: 2px;
          background: #d7dce1;
        }

        .history-content {
          min-width: 0;
        }

        .history-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
        }

        .history-main {
          min-width: 0;
          flex: 1;
        }

        .history-title-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .history-title-row h5 {
          margin: 0;
          color: var(--tracking-text);
          font-size: 1rem;
          font-weight: 700;
        }

        .phase-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 9px;
          border-radius: 999px;
          color: var(--tracking-grey);
          background:
            var(--tracking-grey-soft);
          font-size: 0.65rem;
          font-weight: 800;
        }

        .phase-badge.confirmed {
          color: #4338ca;
          background: #eef2ff;
        }

        .phase-badge.picked {
          color: #0f766e;
          background: #ccfbf1;
        }

        .phase-badge.received,
        .phase-badge.rescheduled,
        .phase-badge.payment-pending {
          color: #92400e;
          background: #fef3c7;
        }

        .phase-badge.transit,
        .phase-badge.out-for-delivery {
          color: #1d4ed8;
          background: #dbeafe;
        }

        .phase-badge.assigned,
        .phase-badge.reassigned {
          color: #6d28d9;
          background: #ede9fe;
        }

        .phase-badge.delivered,
        .phase-badge.accepted,
        .phase-badge.payment-received {
          color: #166534;
          background: #dcfce7;
        }

        .phase-badge.attempt {
          color: #9a3412;
          background: #ffedd5;
        }

        .phase-badge.attempt-danger,
        .phase-badge.declined,
        .phase-badge.payment-failed {
          color: #991b1b;
          background: #fee2e2;
        }

        .phase-badge.return-transit {
          color: #115e59;
          background: #ccfbf1;
        }

        .phase-badge.returned,
        .phase-badge.payment-waived {
          color: #334155;
          background: #e2e8f0;
        }

        .phase-badge.service-express {
          color: #9f1239;
          background: #ffe4e6;
        }

        .phase-badge.service-next-day {
          color: #155e75;
          background: #cffafe;
        }

        .phase-badge.service-same-day {
          color: #3730a3;
          background: #e0e7ff;
        }
                  .history-row .history-content {
          border-radius: 10px;
          margin-bottom: 12px;
          padding: 16px 18px 18px;
          border: 1px solid transparent;
        }

        .history-row.confirmed
          .history-content {
          background: #f5f3ff;
          border-color: #ddd6fe;
        }

        .history-row.picked
          .history-content {
          background: #f0fdfa;
          border-color: #99f6e4;
        }

        .history-row.received
          .history-content,
        .history-row.rescheduled
          .history-content,
        .history-row.payment-pending
          .history-content {
          background: #fffbeb;
          border-color: #fde68a;
        }

        .history-row.transit
          .history-content,
        .history-row.out-for-delivery
          .history-content {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .history-row.assigned
          .history-content,
        .history-row.reassigned
          .history-content {
          background: #faf5ff;
          border-color: #e9d5ff;
        }

        .history-row.delivered
          .history-content,
        .history-row.accepted
          .history-content,
        .history-row.payment-received
          .history-content {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        .history-row.attempt
          .history-content {
          background: #fff7ed;
          border-color: #fed7aa;
        }

        .history-row.attempt-danger
          .history-content,
        .history-row.declined
          .history-content,
        .history-row.payment-failed
          .history-content {
          background: #fef2f2;
          border-color: #fecaca;
        }

        .history-row.return-transit
          .history-content {
          background: #f0fdfa;
          border-color: #99f6e4;
        }

        .history-row.returned
          .history-content,
        .history-row.payment-waived
          .history-content {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .history-row.service-express
          .history-content {
          background: #fff1f2;
          border-color: #fecdd3;
        }

        .history-row.service-next-day
          .history-content {
          background: #ecfeff;
          border-color: #a5f3fc;
        }

        .history-row.service-same-day
          .history-content {
          background: #eef2ff;
          border-color: #c7d2fe;
        }

        .history-heading time {
          flex: 0 0 auto;
          color: var(--tracking-text);
          font-size: 0.78rem;
          white-space: nowrap;
        }

        .history-description {
          margin: 7px 0 0;
          color: var(--tracking-muted);
          font-size: 0.84rem;
          line-height: 1.5;
        }

        .history-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 18px;
          margin-top: 10px;
          color: var(--tracking-muted);
          font-size: 0.78rem;
        }

        .history-meta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .history-notes {
          display: inline-flex;
          align-items: flex-start;
          gap: 7px;
          margin-top: 10px;
          padding: 8px 11px;
          border-radius: 7px;
          color: #4f5964;
          background: #f7f8fa;
          font-size: 0.78rem;
        }

        .tracking-empty-state {
          padding: 55px 24px;
          text-align: center;
        }

        .tracking-empty-state > i {
          color: #a7afb8;
          font-size: 3rem;
        }

        .tracking-empty-state h5 {
          margin-top: 16px;
          margin-bottom: 6px;
          color: var(--tracking-text);
          font-weight: 700;
        }

        .tracking-empty-state p {
          margin: 0;
          color: var(--tracking-muted);
        }

        @keyframes trackingPulse {
          0% {
            box-shadow:
              0 0 0 1px currentColor,
              0 0 0 0
                rgba(40, 120, 200, 0.3);
          }

          70% {
            box-shadow:
              0 0 0 1px currentColor,
              0 0 0 10px
                rgba(40, 120, 200, 0);
          }

          100% {
            box-shadow:
              0 0 0 1px currentColor,
              0 0 0 0
                rgba(40, 120, 200, 0);
          }
        }

        @media (max-width: 900px) {
          .shipment-summary-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(150px, 1fr)
              );
          }
        }

        @media (max-width: 767px) {
          .shipment-status-header {
            grid-template-columns:
              auto minmax(0, 1fr);
            align-items: flex-start;
          }

          .status-header-time {
            grid-column: 2;
            text-align: left;
          }

          .tracking-search-card
            .input-group {
            display: grid;
            grid-template-columns:
              auto 1fr;
          }

          .tracking-search-card
            .input-group-text {
            border-bottom-left-radius: 0;
          }

          .tracking-search-card
            .form-control {
            border-top-right-radius:
              6px !important;
          }

          .tracking-search-card .btn {
            grid-column: 1 / -1;
            margin-left: 0 !important;
            border-radius:
              0 0 6px 6px !important;
          }

          .shipment-overview-card {
            padding: 20px 16px 24px;
          }

          .history-heading {
            flex-direction: column;
            gap: 7px;
          }

          .history-heading time {
            order: -1;
            color: var(--tracking-muted);
          }
        }

        @media (max-width: 520px) {
          .tracking-search-card {
            padding: 16px;
          }

          .tracking-search-heading {
            align-items: flex-start;
          }

          .tracking-search-heading h3 {
            font-size: 1.1rem;
          }

          .tracking-number-title {
            font-size: 1.2rem;
          }

          .shipment-status-header {
            grid-template-columns: 1fr;
          }

          .status-header-icon {
            width: 44px;
            height: 44px;
          }

          .status-header-time {
            grid-column: 1;
          }

          .shipment-summary-grid {
            grid-template-columns: 1fr;
          }

          .summary-item {
            padding-bottom: 12px;
            border-bottom:
              1px solid
              var(--tracking-border);
          }

          .summary-item:last-child {
            padding-bottom: 0;
            border-bottom: 0;
          }

          .shipment-history-section {
            margin: 0;
          }

          .shipment-history-section > h3 {
            font-size: 1.35rem;
          }

          .history-row {
            grid-template-columns:
              40px minmax(0, 1fr);
          }

          .history-marker {
            width: 24px;
            height: 24px;
            font-size: 0.72rem;
          }

          .history-connector {
            top: 26px;
          }

          .history-row .history-content {
            padding: 14px;
          }
        `}</style>
    </div>
  );
};

export default TrackingComponent;
