"use client"
import React, { useState, useEffect } from "react";
import { Card, Row, Col, Badge, Button, Alert, Tab, Tabs } from "react-bootstrap";
import { FileText, Truck, MapPin, Clock, Package, CheckCircle, XCircle, AlertCircle, RefreshCw } from "feather-icons-react";
import Datatable from "@/core/pagination/datatable";

const RiderManifestDisplay = ({
  riderManifest,
  loading,
  error,
  onRefresh,
  onPostManifest,
  showPostManifestButton = true,
  riderUserCode,
  dcCode,
  manifestNO,
  onManifestNOSearch,
  onClearFilters,
  title = "My Manifest"
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsPageSize, setItemsPageSize] = useState(100);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsPageSize, setEventsPageSize] = useState(100);

  const getStatusBadge = (statusID) => {
    const statusMap = {
      0: { variant: 'secondary', text: 'Pending' },
      1: { variant: 'primary', text: 'Open' },
      2: { variant: 'success', text: 'In Progress' },
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

  // Items table columns
  const itemsColumns = [
    {
      title: "Item NO",
      dataIndex: "manifestItemNO",
      sorter: (a, b) => a.manifestItemNO.localeCompare(b.manifestItemNO),
    },
    {
      title: "Order NO",
      dataIndex: "orderNO",
      sorter: (a, b) => a.orderNO.localeCompare(b.orderNO),
    },
    {
      title: "Stop No",
      dataIndex: "stopNo",
      sorter: (a, b) => a.stopNo - b.stopNo,
    },
    {
      title: "Status",
      dataIndex: "statusID",
      render: (statusID) => (
        <Badge bg={statusID === 0 ? 'warning' : statusID === 1 ? 'success' : 'secondary'}>
          {statusID === 0 ? 'Pending' : statusID === 1 ? 'Delivered' : 'Unknown'}
        </Badge>
      ),
      sorter: (a, b) => a.statusID - b.statusID,
    },
    {
      title: "Date Added",
      dataIndex: "dateAdded",
      render: (date) => formatDateTime(date),
      sorter: (a, b) => new Date(a.dateAdded) - new Date(b.dateAdded),
    },
  ];

  // Events table columns
  const eventsColumns = [
    {
      title: "Event ID",
      dataIndex: "riderManifestEventID",
      sorter: (a, b) => a.riderManifestEventID - b.riderManifestEventID,
    },
    {
      title: "Status",
      dataIndex: "statusID",
      render: (statusID, record) => (
        <Badge bg={getStatusBadge(statusID).variant}>
          {record.statusName || getStatusBadge(statusID).text}
        </Badge>
      ),
      sorter: (a, b) => a.statusID - b.statusID,
    },
    {
      title: "Actor",
      dataIndex: "actorUserCode",
      render: (actor) => actor || 'System',
      sorter: (a, b) => (a.actorUserCode || '').localeCompare(b.actorUserCode || ''),
    },
    {
      title: "DC Code",
      dataIndex: "dCCode",
      sorter: (a, b) => a.dCCode.localeCompare(b.dCCode),
    },
    {
      title: "Notes",
      dataIndex: "notes",
      render: (notes) => notes || 'N/A',
    },
    {
      title: "Event Time",
      dataIndex: "eventTime",
      render: (date) => formatDateTime(date),
      sorter: (a, b) => new Date(a.eventTime) - new Date(b.eventTime),
    },
  ];

  const handleItemsPageChange = (page, size) => {
    setItemsPage(page);
    setItemsPageSize(size);
    onRefresh({
      riderUserCode,
      activeOnly: false,
      itemsPage: page,
      itemsPageSize: size,
      eventsPage,
      eventsPageSize,
      dcCode,
      manifestNO
    });
  };

  const handleEventsPageChange = (page, size) => {
    setEventsPage(page);
    setEventsPageSize(size);
    onRefresh({
      riderUserCode,
      activeOnly: true,
      itemsPage,
      itemsPageSize,
      eventsPage: page,
      eventsPageSize: size,
      dcCode,
      manifestNO
    });
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content">
        <Alert variant="danger" className="text-center">
          <AlertCircle size={48} className="mb-3" />
          <h4>Error Loading Manifest</h4>
          <p>{error}</p>
          <Button variant="primary" onClick={() => onRefresh({
            riderUserCode,
            activeOnly: false,
            itemsPage,
            itemsPageSize,
            eventsPage,
            eventsPageSize,
            dcCode,
            manifestNO
          })}>
            <RefreshCw size={16} className="me-2" />
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  if (!riderManifest) {
    return (
      <div className="content">
        <Alert variant="info" className="text-center">
          <FileText size={48} className="mb-3" />
          <h4>No Active Manifest</h4>
          <p>This rider doesn't have an active manifest.</p>
        </Alert>
      </div>
    );
  }

  const { header, items, events } = riderManifest;

  return (
    <div className="content">
      <div className="page-header">
        <div className="add-item d-flex">
          <div className="page-title">
            <h4>{title}</h4>
            <h6>{header.manifestNO}</h6>
          </div>
        </div>
        <div className="page-btn d-flex gap-2">
          {showPostManifestButton && (
            <Button variant="primary" onClick={onPostManifest}>
              <FileText size={16} className="me-2" />
              Create New Manifest
            </Button>
          )}
          <Button variant="outline-primary" onClick={() => onRefresh({
            riderUserCode,
            activeOnly: false,
            itemsPage,
            itemsPageSize,
            eventsPage,
            eventsPageSize,
            dcCode,
            manifestNO
          })}>
            <RefreshCw size={16} className="me-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Row className="mb-4">
        {/* Manifest Status Cards */}
        <Col lg={3} md={6} className="mb-4">
          <Card className="bg-primary text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Total Items</h6>
                  <h4 className="mb-0">{header.totalItems}</h4>
                </div>
                <Package size={36} className="opacity-75" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="bg-success text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Delivered</h6>
                  <h4 className="mb-0">{header.deliveredItems}</h4>
                </div>
                <CheckCircle size={36} className="opacity-75" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="bg-warning text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Pending</h6>
                  <h4 className="mb-0">{header.pendingItems}</h4>
                </div>
                <Clock size={36} className="opacity-75" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="bg-info text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Status</h6>
                  <h4 className="mb-0">
                    <Badge bg={getStatusBadge(header.statusID).variant}>
                      {getStatusBadge(header.statusID).text}
                    </Badge>
                  </h4>
                </div>
                <FileText size={36} className="opacity-75" />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Manifest Details */}
      <Row className="mb-4">
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Manifest Information</h5>
            </Card.Header>
            <Card.Body>
              <div className="row">
                <div className="col-sm-6">
                  <p className="mb-2"><strong>Manifest NO:</strong></p>
                  <p className="text-muted">{header.manifestNO}</p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-2"><strong>DC Code:</strong></p>
                  <p className="text-muted">{header.dCCode || dcCode || 'N/A'}</p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-2"><strong>Rider Code:</strong></p>
                  <p className="text-muted">{header.riderUserCode}</p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-2"><strong>Route Code:</strong></p>
                  <p className="text-muted">{header.routeCode || 'N/A'}</p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-2"><strong>Planned Departure:</strong></p>
                  <p className="text-muted">{formatDateTime(header.plannedDepartAt)}</p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-2"><strong>Actual Departure:</strong></p>
                  <p className="text-muted">{formatDateTime(header.departedAt)}</p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-2"><strong>Closed At:</strong></p>
                  <p className="text-muted">{formatDateTime(header.closedAt)}</p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-2"><strong>Notes:</strong></p>
                  <p className="text-muted">{header.notes || 'N/A'}</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Manifest Statistics</h5>
            </Card.Header>
            <Card.Body>
              <div className="row text-center">
                <div className="col-4">
                  <h4 className="text-primary">{riderManifest.totalItemsCount}</h4>
                  <p className="text-muted mb-0">Total Items</p>
                </div>
                <div className="col-4">
                  <h4 className="text-success">{header.deliveredItems}</h4>
                  <p className="text-muted mb-0">Delivered</p>
                </div>
                <div className="col-4">
                  <h4 className="text-warning">{header.pendingItems}</h4>
                  <p className="text-muted mb-0">Pending</p>
                </div>
              </div>
              <hr />
              <div className="row text-center">
                <div className="col-6">
                  <h6 className="text-info">{riderManifest.totalEventsCount}</h6>
                  <p className="text-muted mb-0">Total Events</p>
                </div>
                <div className="col-6">
                  <h6 className="text-secondary">{header.statusID}</h6>
                  <p className="text-muted mb-0">Status ID</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs for Items and Events */}
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Manifest Details</h5>
            <div className="d-flex gap-2">
              <input
                type="text"
                placeholder="Search by Manifest NO..."
                className="form-control form-control-sm"
                style={{ width: '200px' }}
                value={manifestNO}
                onChange={(e) => onManifestNOSearch(e.target.value)}
              />
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  // Reset pagination when searching
                  setItemsPage(1);
                  setEventsPage(1);
                  onRefresh({
                    riderUserCode,
                    activeOnly: false,
                    itemsPage: 1,
                    itemsPageSize,
                    eventsPage: 1,
                    eventsPageSize,
                    dcCode,
                    manifestNO
                  });
                }}
              >
                Search
              </button>
              {(manifestNO || dcCode) && (
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    onClearFilters();
                    setItemsPage(1);
                    setEventsPage(1);
                    onRefresh({
                      riderUserCode,
                      activeOnly: false,
                      itemsPage: 1,
                      itemsPageSize,
                      eventsPage: 1,
                      eventsPageSize
                    });
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          {(manifestNO || dcCode) && (
            <div className="mb-3">
              <small className="text-muted">
                <strong>Filters:</strong>
                {riderUserCode && ` Rider: ${riderUserCode}`}
                {dcCode && ` | DC: ${dcCode}`}
                {manifestNO && ` | Manifest: ${manifestNO}`}
              </small>
            </div>
          )}
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-0">
            <Tab eventKey="overview" title="Items Overview">
              <Card.Body>
                {items && items.length > 0 ? (
                  <Datatable
                    columns={itemsColumns}
                    dataSource={items}
                    rowKey="manifestItemNO"
                    pagination={{
                      current: riderManifest.itemsPage || 1,
                      pageSize: riderManifest.itemsPageSize || itemsPageSize,
                      total: riderManifest.totalItemsCount || 0,
                      showSizeChanger: true,
                      pageSizeOptions: ['50', '100', '200', '500'],
                      onChange: handleItemsPageChange,
                      onShowSizeChange: handleItemsPageChange,
                    }}
                    loading={loading}
                  />
                ) : (
                  <Alert variant="info" className="text-center">
                    <Package size={48} className="mb-3" />
                    <h5>No Items Found</h5>
                    <p>This manifest has no items assigned.</p>
                  </Alert>
                )}
              </Card.Body>
            </Tab>

            <Tab eventKey="events" title="Events History">
              <Card.Body>
                {events && events.length > 0 ? (
                  <Datatable
                    columns={eventsColumns}
                    dataSource={events}
                    rowKey="riderManifestEventID"
                    pagination={{
                      current: riderManifest.eventsPage || 1,
                      pageSize: riderManifest.eventsPageSize || eventsPageSize,
                      total: riderManifest.totalEventsCount || 0,
                      showSizeChanger: true,
                      pageSizeOptions: ['50', '100', '200', '500'],
                      onChange: handleEventsPageChange,
                      onShowSizeChange: handleEventsPageChange,
                    }}
                    loading={loading}
                  />
                ) : (
                  <Alert variant="info" className="text-center">
                    <Clock size={48} className="mb-3" />
                    <h5>No Events Found</h5>
                    <p>This manifest has no events recorded.</p>
                  </Alert>
                )}
              </Card.Body>
            </Tab>
          </Tabs>
        </Card.Header>
      </Card>
    </div>
  );
};

export default RiderManifestDisplay;
