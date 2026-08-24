"use client"
import React, { useState } from "react";
import { Card, Row, Col, Form, Button, Tab, Tabs, Alert, Badge } from "react-bootstrap";
import { Save, Settings, Bell, Lock, Globe, Mail, Database, Smartphone } from "feather-icons-react";
import notify from "@/lib/toast";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    companyName: "CosSim Logistics",
    companyEmail: "admin@cossim.co.ke",
    companyPhone: "+254700000000",
    companyAddress: "Nairobi, Kenya",
    timezone: "Africa/Nairobi",
    currency: "KES",
    language: "en",
    dateFormat: "DD/MM/YYYY",
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    orderUpdates: true,
    paymentAlerts: true,
    systemAlerts: true,
    marketingEmails: false,
  });

  // SMS Settings
  const [smsSettings, setSmsSettings] = useState({
    provider: "africas_talking",
    apiKey: "**********************",
    username: "cossim",
    senderId: "CosSim",
    defaultCountryCode: "+254",
    enableOTP: true,
    enableNotifications: true,
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    mpesaEnabled: true,
    cardPaymentsEnabled: true,
    codEnabled: true,
    mpesaConsumerKey: "**********************",
    mpesaConsumerSecret: "**********************",
    mpesaShortcode: "174379",
    mpesaPasskey: "**********************",
  });

  const handleSaveSettings = (settingsType) => {
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      notify.success(`${settingsType} settings have been updated successfully.`);
    }, 1500);
  };

  const GeneralSettingsTab = () => (
    <Card>
      <Card.Header>
        <h5 className="mb-0 d-flex align-items-center">
          <Settings size={20} className="me-2" />
          General Settings
        </h5>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Company Name</Form.Label>
              <Form.Control
                type="text"
                value={generalSettings.companyName}
                onChange={(e) => setGeneralSettings({...generalSettings, companyName: e.target.value})}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Company Email</Form.Label>
              <Form.Control
                type="email"
                value={generalSettings.companyEmail}
                onChange={(e) => setGeneralSettings({...generalSettings, companyEmail: e.target.value})}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Company Phone</Form.Label>
              <Form.Control
                type="text"
                value={generalSettings.companyPhone}
                onChange={(e) => setGeneralSettings({...generalSettings, companyPhone: e.target.value})}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Company Address</Form.Label>
              <Form.Control
                type="text"
                value={generalSettings.companyAddress}
                onChange={(e) => setGeneralSettings({...generalSettings, companyAddress: e.target.value})}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Timezone</Form.Label>
              <Form.Select
                value={generalSettings.timezone}
                onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
              >
                <option value="Africa/Nairobi">Africa/Nairobi</option>
                <option value="Africa/Lagos">Africa/Lagos</option>
                <option value="UTC">UTC</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Currency</Form.Label>
              <Form.Select
                value={generalSettings.currency}
                onChange={(e) => setGeneralSettings({...generalSettings, currency: e.target.value})}
              >
                <option value="KES">KES - Kenyan Shilling</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        <div className="text-end">
          <Button variant="primary" onClick={() => handleSaveSettings("General")} disabled={saving}>
            <Save size={16} className="me-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );

  const NotificationSettingsTab = () => (
    <Card>
      <Card.Header>
        <h5 className="mb-0 d-flex align-items-center">
          <Bell size={20} className="me-2" />
          Notification Settings
        </h5>
      </Card.Header>
      <Card.Body>
        <Alert variant="info">
          <Bell size={16} className="me-2" />
          Configure how and when you receive notifications about system events.
        </Alert>
        
        <Row>
          <Col md={6}>
            <h6 className="mb-3">Communication Channels</h6>
            {[
              { key: 'emailNotifications', label: 'Email Notifications' },
              { key: 'smsNotifications', label: 'SMS Notifications' },
              { key: 'pushNotifications', label: 'Push Notifications' },
            ].map((setting) => (
              <Form.Check
                key={setting.key}
                type="switch"
                id={setting.key}
                label={setting.label}
                checked={notificationSettings[setting.key]}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  [setting.key]: e.target.checked
                })}
                className="mb-3"
              />
            ))}
          </Col>
          <Col md={6}>
            <h6 className="mb-3">Event Types</h6>
            {[
              { key: 'orderUpdates', label: 'Order Updates' },
              { key: 'paymentAlerts', label: 'Payment Alerts' },
              { key: 'systemAlerts', label: 'System Alerts' },
              { key: 'marketingEmails', label: 'Marketing Emails' },
            ].map((setting) => (
              <Form.Check
                key={setting.key}
                type="switch"
                id={setting.key}
                label={setting.label}
                checked={notificationSettings[setting.key]}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  [setting.key]: e.target.checked
                })}
                className="mb-3"
              />
            ))}
          </Col>
        </Row>
        <div className="text-end">
          <Button variant="primary" onClick={() => handleSaveSettings("Notification")} disabled={saving}>
            <Save size={16} className="me-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );

  const SMSSettingsTab = () => (
    <Card>
      <Card.Header>
        <h5 className="mb-0 d-flex align-items-center">
          <Smartphone size={20} className="me-2" />
          SMS Configuration
        </h5>
      </Card.Header>
      <Card.Body>
        <Alert variant="warning">
          <Smartphone size={16} className="me-2" />
          SMS settings are used for sending OTP codes and delivery notifications. Handle with care.
        </Alert>
        
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>SMS Provider</Form.Label>
              <Form.Select
                value={smsSettings.provider}
                onChange={(e) => setSmsSettings({...smsSettings, provider: e.target.value})}
              >
                <option value="africas_talking">Africa's Talking</option>
                <option value="twilio">Twilio</option>
                <option value="nexmo">Nexmo</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>API Username</Form.Label>
              <Form.Control
                type="text"
                value={smsSettings.username}
                onChange={(e) => setSmsSettings({...smsSettings, username: e.target.value})}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>API Key</Form.Label>
              <Form.Control
                type="password"
                value={smsSettings.apiKey}
                onChange={(e) => setSmsSettings({...smsSettings, apiKey: e.target.value})}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Sender ID</Form.Label>
              <Form.Control
                type="text"
                value={smsSettings.senderId}
                onChange={(e) => setSmsSettings({...smsSettings, senderId: e.target.value})}
              />
            </Form.Group>
          </Col>
        </Row>
        
        <Row>
          <Col md={6}>
            <Form.Check
              type="switch"
              id="enableOTP"
              label="Enable OTP SMS"
              checked={smsSettings.enableOTP}
              onChange={(e) => setSmsSettings({...smsSettings, enableOTP: e.target.checked})}
              className="mb-3"
            />
          </Col>
          <Col md={6}>
            <Form.Check
              type="switch"
              id="enableNotifications"
              label="Enable Notification SMS"
              checked={smsSettings.enableNotifications}
              onChange={(e) => setSmsSettings({...smsSettings, enableNotifications: e.target.checked})}
              className="mb-3"
            />
          </Col>
        </Row>
        
        <div className="text-end">
          <Button variant="primary" onClick={() => handleSaveSettings("SMS")} disabled={saving}>
            <Save size={16} className="me-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );

  const PaymentSettingsTab = () => (
    <Card>
      <Card.Header>
        <h5 className="mb-0 d-flex align-items-center">
          <Database size={20} className="me-2" />
          Payment Settings
        </h5>
      </Card.Header>
      <Card.Body>
        <Alert variant="danger">
          <Lock size={16} className="me-2" />
          Payment credentials are sensitive. Only authorized personnel should modify these settings.
        </Alert>
        
        <h6 className="mb-3">Payment Methods</h6>
        <Row className="mb-4">
          <Col md={4}>
            <Form.Check
              type="switch"
              id="mpesaEnabled"
              label={<span>M-Pesa Payments <Badge bg="success">Active</Badge></span>}
              checked={paymentSettings.mpesaEnabled}
              onChange={(e) => setPaymentSettings({...paymentSettings, mpesaEnabled: e.target.checked})}
              className="mb-3"
            />
          </Col>
          <Col md={4}>
            <Form.Check
              type="switch"
              id="cardPaymentsEnabled"
              label={<span>Card Payments <Badge bg="info">Beta</Badge></span>}
              checked={paymentSettings.cardPaymentsEnabled}
              onChange={(e) => setPaymentSettings({...paymentSettings, cardPaymentsEnabled: e.target.checked})}
              className="mb-3"
            />
          </Col>
          <Col md={4}>
            <Form.Check
              type="switch"
              id="codEnabled"
              label="Cash on Delivery"
              checked={paymentSettings.codEnabled}
              onChange={(e) => setPaymentSettings({...paymentSettings, codEnabled: e.target.checked})}
              className="mb-3"
            />
          </Col>
        </Row>
        
        <h6 className="mb-3">M-Pesa Configuration</h6>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Consumer Key</Form.Label>
              <Form.Control
                type="password"
                value={paymentSettings.mpesaConsumerKey}
                onChange={(e) => setPaymentSettings({...paymentSettings, mpesaConsumerKey: e.target.value})}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Consumer Secret</Form.Label>
              <Form.Control
                type="password"
                value={paymentSettings.mpesaConsumerSecret}
                onChange={(e) => setPaymentSettings({...paymentSettings, mpesaConsumerSecret: e.target.value})}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Shortcode</Form.Label>
              <Form.Control
                type="text"
                value={paymentSettings.mpesaShortcode}
                onChange={(e) => setPaymentSettings({...paymentSettings, mpesaShortcode: e.target.value})}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Passkey</Form.Label>
              <Form.Control
                type="password"
                value={paymentSettings.mpesaPasskey}
                onChange={(e) => setPaymentSettings({...paymentSettings, mpesaPasskey: e.target.value})}
              />
            </Form.Group>
          </Col>
        </Row>
        
        <div className="text-end">
          <Button variant="primary" onClick={() => handleSaveSettings("Payment")} disabled={saving}>
            <Save size={16} className="me-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );

  return (
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>System Settings</h4>
              <h6>Configure system preferences and integrations</h6>
            </div>
          </div>
        </div>

        <Row>
          <Col lg={12}>
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-3"
            >
              <Tab eventKey="general" title={<span><Settings size={16} className="me-1" />General</span>}>
                <GeneralSettingsTab />
              </Tab>
              <Tab eventKey="notifications" title={<span><Bell size={16} className="me-1" />Notifications</span>}>
                <NotificationSettingsTab />
              </Tab>
              <Tab eventKey="sms" title={<span><Smartphone size={16} className="me-1" />SMS</span>}>
                <SMSSettingsTab />
              </Tab>
              <Tab eventKey="payment" title={<span><Database size={16} className="me-1" />Payment</span>}>
                <PaymentSettingsTab />
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </div>
  );
};

export default SettingsPage;
