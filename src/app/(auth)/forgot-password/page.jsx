"use client";

import Link from "@/components/Link";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import { all_routes } from "@/Router/all_routes";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { requestPasscode, confirmResetPassword } from "@/services/authService";

const ForgotPasswordPage = () => {
  const route = all_routes;
  const router = useRouter();

  // State management
  const [step, setStep] = useState(1); // 1: Request passcode, 2: Reset password
  const [phoneNumber, setPhoneNumber] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Handle request passcode
  const handleRequestPasscode = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const payload = {
        phoneNumber: phoneNumber,
      };
      
      await requestPasscode(payload);
      setSuccess("Passcode sent to your phone number successfully!");
      setStep(2);
    } catch (err) {
      setError(err?.message || "Failed to send passcode. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validate password confirmation
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    
    setLoading(true);
    
    try {
      const payload = {
        resetCode: resetCode,
        password: password,
        phoneNumber: phoneNumber,
      };
      
      await confirmResetPassword(payload);
      setSuccess("Password reset successfully! Redirecting to login...");
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push(route.signin);
      }, 2000);
    } catch (err) {
      setError(err?.message || "Failed to reset password. Please check your passcode.");
    } finally {
      setLoading(false);
    }
  };

  // Handle going back to step 1
  const handleBackToStep1 = () => {
    setStep(1);
    setResetCode("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="login-content user-login">
      <div className="login-logo">
        <ImageWithBasePath src="assets/logo/logo.png" alt="img" />
        <Link to={route.dashboard} className="login-logo logo-white">
          <ImageWithBasePath src="assets/logo/logo.png" alt />
        </Link>
      </div>
      
      {step === 1 ? (
        // Step 1: Request Passcode
        <form onSubmit={handleRequestPasscode}>
          <div className="login-userset">
            <div className="login-userheading">
              <h3>Forgot Password</h3>
              <h4>
                Enter your phone number to receive a passcode
              </h4>
            </div>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success" role="alert">
                {success}
              </div>
            )}
            <div className="form-login">
              <label className="form-label">Phone Number</label>
              <div className="form-addons">
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Enter your phone number (e.g., 0720968729)"
                  pattern="[0-9]{10}"
                  title="Please enter a valid 10-digit phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-login">
              <button type="submit" className="btn btn-login" disabled={loading}>
                {loading ? "Sending Passcode..." : "Send Passcode"}
              </button>
            </div>
            <div className="signinform">
              <h4>
                Remember your password?
                <Link to={route.signin} className="hover-a">
                  {" "}
                  Back to Sign In
                </Link>
              </h4>
            </div>
          </div>
        </form>
      ) : (
        // Step 2: Reset Password
        <form onSubmit={handleResetPassword}>
          <div className="login-userset">
            <div className="login-userheading">
              <h3>Reset Password</h3>
              <h4>
                Enter the passcode sent to {phoneNumber} and your new password
              </h4>
            </div>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success" role="alert">
                {success}
              </div>
            )}
            <div className="form-login">
              <label className="form-label">Passcode</label>
              <div className="form-addons">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter the passcode sent to your phone"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-login">
              <label>New Password</label>
              <div className="pass-group">
                <input
                  type="password"
                  className="pass-input"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength="6"
                  required
                />
                <span className="fas toggle-password fa-eye-slash" />
              </div>
            </div>
            <div className="form-login">
              <label>Confirm New Password</label>
              <div className="pass-group">
                <input
                  type="password"
                  className="pass-input"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength="6"
                  required
                />
                <span className="fas toggle-password fa-eye-slash" />
              </div>
            </div>
            <div className="form-login">
              <button type="submit" className="btn btn-login" disabled={loading}>
                {loading ? "Resetting Password..." : "Reset Password"}
              </button>
            </div>
            <div className="signinform">
              <h4>
                <button 
                  type="button" 
                  onClick={handleBackToStep1}
                  className="btn-link hover-a"
                  style={{ border: 'none', background: 'none', color: 'inherit', textDecoration: 'underline' }}
                >
                  Back to Phone Number
                </button>
                {" | "}
                <Link to={route.signin} className="hover-a">
                  Back to Sign In
                </Link>
              </h4>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
