"use client";
import React, { useState } from 'react';
import { Users, Copy, ExternalLink, Plus, Share2, Gift, TrendingUp } from 'react-feather';

export default function SalesAgentReferral() {
  const [referralLink] = useState("https://app.cossim.co.ke/signup?vendor&ref=HILL-385");
  const [referralCodes] = useState([
    { code: "HILL-825", status: "Active", uses: 0, created: "2024-01-15" },
    // Add more referral codes as needed
  ]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Add toast notification
  };

  return (
    <div className="content">
      <div className="page-header">
        <div className="add-item d-flex">
          <div className="page-title">
            <h4>Referral Management</h4>
            <h6>Manage your referral codes and track performance</h6>
          </div>
        </div>
      </div>

      {/* Referral Stats */}
      <div className="row">
        <div className="col-lg-3 col-sm-6 col-12">
          <div className="dash-widget">
            <div className="dash-widgetimg">
              <span><Users size={40} /></span>
            </div>
            <div className="dash-widgetcontent">
              <h5>1</h5>
              <h6>Active Codes</h6>
              <p className="dash-widget-desc">Currently active</p>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-sm-6 col-12">
          <div className="dash-widget">
            <div className="dash-widgetimg">
              <span><Users size={40} className="text-success" /></span>
            </div>
            <div className="dash-widgetcontent">
              <h5>0</h5>
              <h6>Total Referrals</h6>
              <p className="dash-widget-desc">All time</p>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-sm-6 col-12">
          <div className="dash-widget">
            <div className="dash-widgetimg">
              <span><TrendingUp size={40} className="text-info" /></span>
            </div>
            <div className="dash-widgetcontent">
              <h5>0%</h5>
              <h6>Conversion Rate</h6>
              <p className="dash-widget-desc">Signup to active</p>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-sm-6 col-12">
          <div className="dash-widget">
            <div className="dash-widgetimg">
              <span><Gift size={40} className="text-warning" /></span>
            </div>
            <div className="dash-widgetcontent">
              <h5>KES 0</h5>
              <h6>Referral Earnings</h6>
              <p className="dash-widget-desc">Total earned</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Quick Share Links */}
        <div className="col-lg-8 col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">
                <Share2 size={20} className="me-2" />
                Quick Share
              </h5>
              <p className="card-desc">Share your referral link and codes easily</p>
            </div>
            <div className="card-body">
              {/* Referral Link */}
              <div className="mb-4">
                <div className="form-label fw-bold">Referral Signup Link</div>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={referralLink}
                    readOnly
                    aria-label="Referral signup link"
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => copyToClipboard(referralLink)}
                  >
                    <Copy size={16} className="me-1" />
                    Copy
                  </button>
                </div>
                <small className="text-muted">
                  Vendors signing up with this link get your referral code automatically
                </small>
              </div>

              {/* Referral Codes */}
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="form-label fw-bold mb-0">My Referral Codes</div>
                  <button className="btn btn-outline-primary btn-sm">
                    <Plus size={16} className="me-1" />
                    Request New Code
                  </button>
                </div>
                
                {referralCodes.map((referral) => (
                  <div key={referral.code} className="referral-code-item d-flex justify-content-between align-items-center p-3 border rounded mb-3">
                    <div>
                      <div className="d-flex align-items-center">
                        <span className="badge bg-primary me-2">{referral.code}</span>
                        <span className={`badge ${referral.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                          {referral.status}
                        </span>
                      </div>
                      <small className="text-muted">
                        {referral.uses} uses • Created {new Date(referral.created).toLocaleDateString()}
                      </small>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => copyToClipboard(referral.code)}
                      >
                        <Copy size={14} className="me-1" />
                        Copy Code
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => copyToClipboard(`${referralLink}&code=${referral.code}`)}
                      >
                        <ExternalLink size={14} className="me-1" />
                        Copy Link
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Referral Tips */}
        <div className="col-lg-4 col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">
                💡 Referral Tips
              </h5>
              <p className="card-desc">Maximize your referral success</p>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <h6 className="text-primary">🎯 Target the Right Audience</h6>
                <p className="small text-muted">
                  Focus on small businesses and entrepreneurs who need logistics solutions.
                </p>
              </div>
              <div className="mb-3">
                <h6 className="text-success">📱 Use Social Media</h6>
                <p className="small text-muted">
                  Share your referral link on WhatsApp, Facebook, and LinkedIn business groups.
                </p>
              </div>
              <div className="mb-3">
                <h6 className="text-info">🤝 Personal Touch</h6>
                <p className="small text-muted">
                  Personally explain the benefits and offer to help with setup.
                </p>
              </div>
              <div>
                <h6 className="text-warning">📊 Track Performance</h6>
                <p className="small text-muted">
                  Monitor which channels work best and focus your efforts there.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referral History */}
      <div className="card">
        <div className="card-header">
          <h5 className="card-title">
            <Users size={20} className="me-2" />
            Referral History
          </h5>
          <p className="card-desc">Track all your successful referrals</p>
        </div>
        <div className="card-body">
          <div className="text-center py-5">
            <Users size={64} className="text-muted mb-3" />
            <h5 className="text-muted">No referrals yet</h5>
            <p className="text-muted">Start sharing your referral codes to see referrals here</p>
            <button className="btn btn-primary">
              <Share2 size={16} className="me-2" />
              Share Now
            </button>
          </div>
        </div>
      </div>

      {/* Performance Analytics */}
      <div className="card">
        <div className="card-header">
          <h5 className="card-title">
            📈 Performance Analytics
          </h5>
          <p className="card-desc">Track your referral performance over time</p>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-lg-6 col-12">
              <div className="text-center py-4">
                <TrendingUp size={48} className="text-muted mb-3" />
                <h6 className="text-muted">Referral Trends</h6>
                <p className="text-muted">Analytics will appear once you have referrals</p>
              </div>
            </div>
            <div className="col-lg-6 col-12">
              <div className="text-center py-4">
                <Gift size={48} className="text-muted mb-3" />
                <h6 className="text-muted">Earnings Overview</h6>
                <p className="text-muted">Commission tracking will show here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
