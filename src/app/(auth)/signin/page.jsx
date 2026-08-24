"use client";

import Link from "@/components/Link";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import { all_routes } from "@/Router/all_routes";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { userLogin } from "@/services/authService";
import useDashboardRedirection from "@/hooks/useDashboardRedirection";
import DashboardSelectionModal from "@/components/modals/DashboardSelectionModal";

const SignInPage = () => {
  const route = all_routes;
  const router = useRouter();
  const { login } = useAuth();
  
  // Dashboard redirection hook
  const {
    showDashboardModal,
    availableDashboards,
    redirecting,
    handleLoginRedirection,
    handleDashboardSelection,
    closeDashboardModal,
  } = useDashboardRedirection();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      // adjust payload keys if your API expects different names
      const payload = {
        phoneNumber: phoneNumber,
        password: password,
      };
      
      const data = await userLogin(payload);
      
      // Use the AuthContext login method to update auth state
      login(data);
      
      // Handle dashboard redirection based on user roles
      await handleLoginRedirection(data);
      
    } catch (err) {
      setError(err?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="login-content user-login">
        <div className="login-logo">
          <ImageWithBasePath src="assets/logo/logo.png" alt="img" />
          <Link to={route.dashboard} className="login-logo logo-white">
            <ImageWithBasePath src="assets/logo/logo.png" alt />
          </Link>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="login-userset">
            <div className="login-userheading">
              <h3>Sign In</h3>
              <h4>
                Access the Cassim platform with your account
              </h4>
            </div>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
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
              <label>Password</label>
              <div className="pass-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className="pass-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span 
                  className={`fas toggle-password ${showPassword ? "fa-eye" : "fa-eye-slash"}`}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: "pointer" }}
                />
              </div>
            </div>
            <div className="form-login authentication-check">
              <div className="row">
                <div className="col-6">
                  <div className="custom-control custom-checkbox">
                    <label className="checkboxs ps-4 mb-0 pb-0 line-height-1">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                      />
                      <span className="checkmarks" />
                      Remember me
                    </label>
                  </div>
                </div>
                <div className="col-6 text-end">
                  <Link
                    className="forgot-link"
                    to={route.forgotPassword}
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>
            </div>
            <div className="form-login">
              <button type="submit" className="btn btn-login" disabled={loading || redirecting}>
                {loading ? "Signing in..." : redirecting ? "Redirecting..." : "Sign In"}
              </button>
            </div>
            
          </div>
        </form>
      </div>

      {/* Dashboard Selection Modal */}
      <DashboardSelectionModal
        show={showDashboardModal}
        onHide={closeDashboardModal}
        dashboards={availableDashboards}
        onSelectDashboard={handleDashboardSelection}
        loading={redirecting}
      />
    </>
  );
};

export default SignInPage;
