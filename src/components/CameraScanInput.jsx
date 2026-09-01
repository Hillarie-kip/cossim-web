"use client";

import { BrowserMultiFormatReader } from "@zxing/browser";
import { Camera, X } from "feather-icons-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

const CameraScanInput = ({ children, onScan, label = "Scan with camera" }) => {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [permissionError, setPermissionError] = useState("");
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const readerRef = useRef(null);
  const handledRef = useRef(false);

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop?.();
    controlsRef.current = null;
    readerRef.current?.reset?.();
    readerRef.current = null;
    const stream = videoRef.current?.srcObject;
    stream?.getTracks?.().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const closeCamera = useCallback(() => {
    stopCamera();
    setOpen(false);
  }, [stopCamera]);

  useEffect(() => {
    if (!open || !videoRef.current) return undefined;
    let cancelled = false;
    handledRef.current = false;
    setError("");
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    reader.decodeFromConstraints(
      { audio: false, video: { facingMode: { ideal: "environment" } } },
      videoRef.current,
      (result) => {
        if (!result || handledRef.current || cancelled) return;
        handledRef.current = true;
        onScan?.(result.getText());
        closeCamera();
      }
    ).then((controls) => {
      if (cancelled) controls.stop();
      else controlsRef.current = controls;
    }).catch((cameraError) => {
      if (cancelled) return;
      const permissionDenied = cameraError?.name === "NotAllowedError";
      setError(permissionDenied
        ? "Camera permission was denied. Allow camera access and try again."
        : "The camera could not be started on this device.");
    });
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, onScan, closeCamera, stopCamera]);

  const handleFocus = useCallback(() => {
    if (enabled) setOpen(true);
  }, [enabled]);

  const handleEnabledChange = useCallback(async (event) => {
    const shouldEnable = event.target.checked;
    if (!shouldEnable) {
      setEnabled(false);
      setPermissionError("");
      closeCamera();
      return;
    }
    setPermissionError("");
    setEnabled(true);
    if (!navigator.mediaDevices?.getUserMedia) {
      setEnabled(false);
      setPermissionError("Camera access is unavailable. Use HTTPS or open the app on localhost.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } },
      });
      stream.getTracks().forEach((track) => track.stop());
      setOpen(true);
    } catch (cameraError) {
      setEnabled(false);
      setPermissionError(cameraError?.name === "NotAllowedError"
        ? "Camera permission was denied. Allow camera access in your browser settings and try again."
        : "Camera access could not be started on this device.");
    }
  }, [closeCamera]);

  return <>
    <div className="camera-scan-input">
      {children({ onFocus: handleFocus })}
      <label className="camera-scan-toggle">
        <input type="checkbox" checked={enabled} onChange={handleEnabledChange} />
        <Camera size={15} />
        <span>{label}</span>
      </label>
      {permissionError && <small className="camera-scan-permission-error" role="alert">{permissionError}</small>}
    </div>
    {open && <div className="camera-scan-backdrop" role="dialog" aria-modal="true" aria-label="Barcode camera scanner">
      <div className="camera-scan-dialog">
        <header><strong>Scan barcode</strong><button type="button" onClick={closeCamera} aria-label="Close camera"><X size={21} /></button></header>
        <div className="camera-scan-viewport"><video ref={videoRef} muted playsInline /><span className="camera-scan-guide" /></div>
        {error && <p className="camera-scan-error">{error}</p>}
        <p className="camera-scan-help">Place the barcode inside the frame. It will be entered automatically.</p>
      </div>
    </div>}
    <style jsx global>{`
      .camera-scan-input { min-width: 0; flex: 1 1 auto; }
      .camera-scan-toggle { display: inline-flex; align-items: center; gap: 6px; margin-top: 7px; color: #475467; font-size: 12px; font-weight: 700; cursor: pointer; }
      .camera-scan-toggle input { margin: 0; accent-color: #ff6200; }
      .camera-scan-permission-error { display: block; margin-top: 5px; color: #b42318; font-size: 11px; line-height: 1.35; }
      .camera-scan-backdrop { position: fixed; inset: 0; z-index: 2000; display: grid; place-items: center; padding: 16px; background: rgba(16, 24, 40, .82); }
      .camera-scan-dialog { width: min(100%, 520px); overflow: hidden; border-radius: 14px; background: #fff; box-shadow: 0 24px 70px rgba(0,0,0,.4); }
      .camera-scan-dialog header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; }
      .camera-scan-dialog header button { display: grid; place-items: center; width: 36px; height: 36px; border: 0; border-radius: 50%; background: #f2f4f7; }
      .camera-scan-viewport { position: relative; aspect-ratio: 4 / 3; overflow: hidden; background: #101828; }
      .camera-scan-viewport video { width: 100%; height: 100%; object-fit: cover; }
      .camera-scan-guide { position: absolute; inset: 28% 8%; border: 2px solid #ff6200; border-radius: 10px; box-shadow: 0 0 0 999px rgba(0,0,0,.28); pointer-events: none; }
      .camera-scan-error { margin: 12px 16px 0; color: #b42318; font-size: 13px; }
      .camera-scan-help { margin: 0; padding: 14px 16px 16px; color: #667085; font-size: 13px; text-align: center; }
    `}</style>
  </>;
};

export default CameraScanInput;
