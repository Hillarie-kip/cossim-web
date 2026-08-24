"use client"
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Row, Col, Badge, Button, Alert, Modal, Tab, Tabs } from "react-bootstrap";
import { 
  ArrowLeft, 
  FileText, 
  Truck, 
  MapPin, 
  Clock, 
  Package, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  User,
  Calendar,
  Activity
} from "lucide-react";
import Link from "@/components/Link";
import Datatable from "@/core/pagination/datatable";
import { useShipment } from "@/hooks/useShipment";
import DCSwitcher from '@/components/DCSwitcher';

const DCManifestDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const manifestNO = params.manifestId;

  const {
    riderManifest,
    loading,
    error,
    fetchRiderManifest,
    clearRiderManifest,
    dcCode
  } = useShipment();

  const [activeTab, setActiveTab] = useState('overview');
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsPageSize, setItemsPageSize] = useState(100);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsPageSize, setEventsPageSize] = useState(100);

  // Fetch manifest data when core parameters change
  useEffect(() => {
    if (manifestNO && dcCode) {
      const params = {
        manifestNO: manifestNO,
        dcCode: dcCode,
        activeOnly: false,
        itemsPage: 1,
        itemsPageSize: 100,
        eventsPage: 1,
        eventsPageSize: 100
      };

      fetchRiderManifest(params);
    }

    return () => {
      clearRiderManifest();
    };
  }, [manifestNO, dcCode]);

  // Handle pagination changes for items
  const handleItemsPageChange = (page, size) => {
    setItemsPage(page);
    setItemsPageSize(size);
    
    const params = {
      manifestNO: manifestNO,
      dcCode: dcCode,
      activeOnly: false,
      itemsPage: page,
      itemsPageSize: size,
      eventsPage: eventsPage,
      eventsPageSize: eventsPageSize
    };

    fetchRiderManifest(params);
  };

  // Handle pagination changes for events
  const handleEventsPageChange = (page, size) => {
    setEventsPage(page);
    setEventsPageSize(size);
    
    const params = {
      manifestNO: manifestNO,
      dcCode: dcCode,
      activeOnly: false,
      itemsPage: itemsPage,
      itemsPageSize: itemsPageSize,
      eventsPage: page,
      eventsPageSize: size
    };

    fetchRiderManifest(params);
  };

  const handleRefresh = () => {
    if (manifestNO && dcCode) {
      const params = {
        manifestNO: manifestNO,
        dcCode: dcCode,
        activeOnly: false,
        itemsPage: itemsPage,
        itemsPageSize: itemsPageSize,
        eventsPage: eventsPage,
        eventsPageSize: eventsPageSize
      };

      fetchRiderManifest(params);
    }
  };

  const getStatusBadge = (statusID) => {
    const statusMap = {
      0: { variant: 'secondary', text: 'Pending' },
      1: { variant: 'primary', text: 'Open' },
      2: { variant: 'info', text: 'In Progress' },
      3: { variant: 'success', text: 'Completed' },
      4: { variant: 'danger', text: 'Failed' },
      5: { variant: 'warning', text: 'Cancelled' }
    };
    return statusMap[statusID] || { variant: 'secondary', text: 'Unknown' };
  };

  const formatDateTime = (dateString) => {
    if (!dateString || dateString === '0001-01-01T00:00:00') return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const manifestHeader = riderManifest?.header;
  const manifestItems = riderManifest?.items || [];
  const manifestEvents = riderManifest?.events || [];

  // Items table columns
  const itemsColumns = [
    {
      title: "Order NO",
      dataIndex: "orderNO",
      render: (value) => (
        <span className="text-primary fw-medium">{value}</span>
      ),
      sorter: (a, b) => a.orderNO.localeCompare(b.orderNO),
    },
    {
      title: "Vendor",
      dataIndex: "vendorName",
      render: (value, record) => (
        <div>
          <div className="fw-medium">{value || 'N/A'}</div>
          <small className="text-muted">{record.vendorCode}</small>
        </div>
      ),
      sorter: (a, b) => (a.vendorName || '').localeCompare(b.vendorName || ''),
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      render: (value, record) => (
        <div>
          <div className="fw-medium">{value || 'N/A'}</div>
          <small className="text-muted">{record.customerPhone}</small>
        </div>
      ),
      sorter: (a, b) => (a.customerName || '').localeCompare(b.customerName || ''),
    },
    {
      title: "Destination",
      dataIndex: "destinationAddress",
      render: (value) => (
        <div className="d-flex align-items-center">
          <MapPin size={14} className="me-2 text-muted" />
          <span className="text-truncate" style={{ maxWidth: '200px' }}>
            {value || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "statusCode",
      render: (statusCode) => {
        const statusMap = {
          'PENDING': { variant: 'secondary', text: 'Pending' },
          'IN_TRANSIT': { variant: 'primary', text: 'In Transit' },
          'OUT_FOR_DELIVERY': { variant: 'info', text: 'Out for Delivery' },
          'DELIVERED': { variant: 'success', text: 'Delivered' },
          'FAILED': { variant: 'danger', text: 'Failed' },
          'RETURNED': { variant: 'warning', text: 'Returned' }
        };
        const status = statusMap[statusCode] || { variant: 'secondary', text: statusCode };
        return <Badge bg={status.variant}>{status.text}</Badge>;
      },
      sorter: (a, b) => a.statusCode.localeCompare(b.statusCode),
    },
    {
      title: "COD Amount",
      dataIndex: "codAmount",
      render: (value) => value ? `KES ${value.toLocaleString()}` : 'N/A',
      sorter: (a, b) => (a.codAmount || 0) - (b.codAmount || 0),
    }
  ];

  // Events table columns
  const eventsColumns = [
    {
      title: "Event",
      dataIndex: "eventType",
      render: (value) => (
        <div className="d-flex align-items-center">
          <Activity size={14} className="me-2 text-muted" />
          <span className="fw-medium">{value}</span>
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (value) => value || 'N/A',
    },
    {
      title: "Location",
      dataIndex: "location",
      render: (value) => (
        <div className="d-flex align-items-center">
          <MapPin size={14} className="me-2 text-muted" />
          {value || 'N/A'}
        </div>
      ),
    },
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      render: (value) => formatDateTime(value),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
    },
    {
      title: "User",
      dataIndex: "userCode",
      render: (value) => (
        <div className="d-flex align-items-center">
          <User size={14} className="me-2 text-muted" />
          {value || 'N/A'}
        </div>
      ),
    }
  ];

  return (
    <div className="page-header">
      <div className="page-title">
        <Row>
          <Col xs={12}>
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="d-flex align-items-center">
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  className="me-3"
                  onClick={() => router.back()}
                >
                  <ArrowLeft size={16} />
                </Button>
                <div>
                  <h4 className="mb-1">Manifest Details</h4>
                  <p className="mb-0 text-muted">
                    {manifestHeader?.manifestNO ? `Manifest #${manifestHeader.manifestNO}` : 'Loading...'}
                  </p>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <DCSwitcher />
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw size={16} className={loading ? 'spin' : ''} />
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <AlertCircle size={16} className="me-2" />
          {error}
        </Alert>
      )}

      {/* Manifest Header Info */}
      {manifestHeader && (
        <Row className="mb-4">
          <Col lg={8}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Manifest Information</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <small className="text-muted d-block">Manifest Number</small>
                      <strong>{manifestHeader.manifestNO}</strong>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted d-block">Rider</small>
                      <div>
                        <strong>{manifestHeader.riderName || 'N/A'}</strong>
                        <br />
                        <small className="text-muted">{manifestHeader.riderUserCode}</small>
                      </div>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted d-block">Distribution Center</small>
                      <strong>{manifestHeader.dcName || manifestHeader.dcCode}</strong>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <small className="text-muted d-block">Status</small>
                      <Badge bg={getStatusBadge(manifestHeader.statusID).variant} className="fs-6">
                        {getStatusBadge(manifestHeader.statusID).text}
                      </Badge>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted d-block">Created</small>
                      <strong>{formatDateTime(manifestHeader.createdAt)}</strong>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted d-block">Last Updated</small>
                      <strong>{formatDateTime(manifestHeader.updatedAt)}</strong>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Statistics</h5>
              </Card.Header>
              <Card.Body>
                <div className="text-center">
                  <div className="mb-3">
                    <Package size={32} className="text-primary mb-2" />
                    <h3 className="mb-1">{manifestItems.length}</h3>
                    <small className="text-muted">Total Items</small>
                  </div>
                  <div className="mb-3">
                    <Activity size={32} className="text-info mb-2" />
                    <h3 className="mb-1">{manifestEvents.length}</h3>
                    <small className="text-muted">Events Logged</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabs for Items and Events */}
      <Card>
        <Card.Header className="border-0 pb-0">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
          >
            <Tab 
              eventKey="overview" 
              title={
                <span>
                  <Package size={16} className="me-2" />
                  Items ({manifestItems.length})
                </span>
              } 
            />
            <Tab 
              eventKey="events" 
              title={
                <span>
                  <Activity size={16} className="me-2" />
                  Events ({manifestEvents.length})
                </span>
              } 
            />
          </Tabs>
        </Card.Header>

        <Card.Body>
          {activeTab === 'overview' && (
            <Datatable
              columns={itemsColumns}
              dataSource={manifestItems}
              loading={loading}
              pagination={{
                current: itemsPage,
                pageSize: itemsPageSize,
                showSizeChanger: true,
                pageSizeOptions: ['50', '100', '200', '500'],
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} items`,
                onChange: handleItemsPageChange,
                onShowSizeChange: handleItemsPageChange
              }}
              scroll={{ x: 1000 }}
              rowKey={(record) => record.orderNO}
            />
          )}

          {activeTab === 'events' && (
            <Datatable
              columns={eventsColumns}
              dataSource={manifestEvents}
              loading={loading}
              pagination={{
                current: eventsPage,
                pageSize: eventsPageSize,
                showSizeChanger: true,
                pageSizeOptions: ['50', '100', '200', '500'],
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} events`,
                onChange: handleEventsPageChange,
                onShowSizeChange: handleEventsPageChange
              }}
              scroll={{ x: 800 }}
              rowKey={(record, index) => `${record.timestamp}-${index}`}
            />
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default DCManifestDetailPage;
