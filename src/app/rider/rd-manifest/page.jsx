"use client"
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Row, Col, Badge, Button, Alert } from "react-bootstrap";
import { ArrowLeft, FileText, Truck, MapPin, Clock, Package, CheckCircle, XCircle, AlertCircle, RefreshCw, Eye } from "feather-icons-react";
import Link from "@/components/Link";
import Datatable from "@/core/pagination/datatable";
import { useShipment } from "@/hooks/useShipment";

const RiderManifestPage = () => {
  const router = useRouter();

  const {
    riderManifest,
    loading,
    error,
    fetchRiderManifest,
    clearRiderManifest,
    dcCode
  } = useShipment();

  const [manifests, setManifests] = useState([]);
  const [user, setUser] = useState(null);

  // Get user from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('cossim-user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      }
    } catch (err) {
      console.error('Error parsing user data from localStorage:', err);
    }
  }, []);

  // Get rider code from user data
  const riderUserCode = user?.UserCode || user?.RiderCode || '';

  // Fetch manifest list when component mounts
  useEffect(() => {
    if (riderUserCode) {
      const params = {
        riderUserCode: riderUserCode,
        activeOnly: false
      };

      // Add dcCode if available
      if (dcCode) {
        params.dcCode = dcCode;
      }

      fetchRiderManifest(params).then((response) => {
        if (response && response.data) {
          setManifests(response.data);
        }
      });
    }

    return () => {
      clearRiderManifest();
    };
  }, [riderUserCode, dcCode]);

  const refreshManifests = () => {
    if (riderUserCode) {
      const params = {
        riderUserCode: riderUserCode,
        activeOnly: false
      };

      if (dcCode) params.dcCode = dcCode;

      fetchRiderManifest(params).then((response) => {
        if (response && response.data) {
          setManifests(response.data);
        }
      });
    }
  };

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

  // Manifests table columns
  const manifestsColumns = [
    {
      title: "Manifest NO",
      dataIndex: "header.manifestNO",
      render: (value, record) => (
        <Link to={`/rider/rd-manifest/${record.header.manifestNO}`}>
          {record.header.manifestNO}
        </Link>
      ),
      sorter: (a, b) => a.header.manifestNO.localeCompare(b.header.manifestNO),
      width: 180,
      fixed: 'left'
    },
    {
      title: "DC Code",
      dataIndex: "header.dCCode",
      render: (value, record) => record.header.dCCode || 'N/A',
      sorter: (a, b) => (a.header.dCCode || '').localeCompare(b.header.dCCode || ''),
      width: 100,
      responsive: ['md']
    },
    {
      title: "Status",
      dataIndex: "header.statusID",
      render: (value, record) => (
        <Badge bg={getStatusBadge(record.header.statusID).variant}>
          {getStatusBadge(record.header.statusID).text}
        </Badge>
      ),
      sorter: (a, b) => a.header.statusID - b.header.statusID,
      width: 120
    },
    {
      title: "Total Items",
      dataIndex: "header.totalItems",
      render: (value, record) => record.header.totalItems,
      sorter: (a, b) => a.header.totalItems - b.header.totalItems,
      width: 110,
      responsive: ['sm']
    },
    {
      title: "Delivered",
      dataIndex: "header.deliveredItems",
      render: (value, record) => record.header.deliveredItems,
      sorter: (a, b) => a.header.deliveredItems - b.header.deliveredItems,
      width: 100,
      responsive: ['md']
    },
    {
      title: "Pending",
      dataIndex: "header.pendingItems",
      render: (value, record) => record.header.pendingItems,
      sorter: (a, b) => a.header.pendingItems - b.header.pendingItems,
      width: 90,
      responsive: ['lg']
    },
    {
      title: "Planned Departure",
      dataIndex: "header.plannedDepartAt",
      render: (value, record) => formatDateTime(record.header.plannedDepartAt),
      sorter: (a, b) => new Date(a.header.plannedDepartAt) - new Date(b.header.plannedDepartAt),
      width: 160,
      responsive: ['lg']
    },
    {
      title: "Date Added",
      dataIndex: "header.dateAdded",
      render: (value, record) => formatDateTime(record.header.dateAdded),
      sorter: (a, b) => new Date(a.header.dateAdded) - new Date(b.header.dateAdded),
      width: 140,
      responsive: ['md']
    },
    {
      title: "Actions",
      render: (value, record) => (
        <div className="d-flex gap-2">
          <Link
            to={`/rider/rd-manifest/${record.header.manifestNO}`}
            className="btn btn-sm btn-outline-primary"
          >
            <Eye size={14} className="me-1" />
            View
          </Link>
        </div>
      ),
      width: 100,
      fixed: 'right'
    },
  ];

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
          <h4>Error Loading Manifests</h4>
          <p>{error}</p>
          <Button variant="primary" onClick={refreshManifests}>
            <RefreshCw size={16} className="me-2" />
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="page-header">
        <div className="add-item d-flex">
          <div className="page-title">
            <h4>My Manifests</h4>
            <h6>Rider: {riderUserCode}</h6>
          </div>
        </div>
        <div className="page-btn d-flex gap-2">
          <Link to={`/rider/rd-overview`} className="btn btn-outline-secondary">
            <ArrowLeft size={16} className="me-2" />
            Back to Dashboard
          </Link>
          <Button variant="outline-primary" onClick={refreshManifests}>
            <RefreshCw size={16} className="me-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-4">
          <Card className="bg-primary text-white">
            <Card.Body className="text-center">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Total Manifests</h6>
                  <h4 className="mb-0">{manifests.length}</h4>
                </div>
                <FileText size={36} className="opacity-75" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="bg-success text-white">
            <Card.Body className="text-center">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Active Manifests</h6>
                  <h4 className="mb-0">{manifests.filter(m => m.header.statusID === 1).length}</h4>
                </div>
                <CheckCircle size={36} className="opacity-75" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="bg-warning text-white">
            <Card.Body className="text-center">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Total Items</h6>
                  <h4 className="mb-0">{manifests.reduce((sum, m) => sum + m.header.totalItems, 0)}</h4>
                </div>
                <Package size={36} className="opacity-75" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="bg-info text-white">
            <Card.Body className="text-center">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Delivered Items</h6>
                  <h4 className="mb-0">{manifests.reduce((sum, m) => sum + m.header.deliveredItems, 0)}</h4>
                </div>
                <Truck size={36} className="opacity-75" />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style jsx>{`
        @media (max-width: 768px) {
          .card-body {
            padding: 1rem 0.75rem;
          }
          .card-body h6 {
            font-size: 0.875rem;
          }
          .card-body h4 {
            font-size: 1.5rem;
          }
          .table-responsive {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .ant-table-wrapper {
            min-width: 800px;
          }
          .ant-table-thead > tr > th {
            padding: 8px 4px;
            font-size: 12px;
          }
          .ant-table-tbody > tr > td {
            padding: 8px 4px;
            font-size: 12px;
          }
          .btn-sm {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
          }
        }
        @media (max-width: 576px) {
          .card-body {
            padding: 0.75rem 0.5rem;
          }
          .card-body h6 {
            font-size: 0.8rem;
            margin-bottom: 0.25rem;
          }
          .card-body h4 {
            font-size: 1.25rem;
          }
          .ant-table-thead > tr > th:not(.ant-table-cell-fix-left):not(.ant-table-cell-fix-right) {
            display: none;
          }
          .ant-table-thead > tr > th.ant-table-cell-fix-left,
          .ant-table-tbody > tr > td.ant-table-cell-fix-left {
            width: 200px !important;
            min-width: 200px !important;
          }
          .ant-table-thead > tr > th.ant-table-cell-fix-right,
          .ant-table-tbody > tr > td.ant-table-cell-fix-right {
            width: 100px !important;
            min-width: 100px !important;
          }
        }
      `}</style>

      {/* Manifests Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">My Manifests List</h5>
        </Card.Header>
        <Card.Body>
          {manifests && manifests.length > 0 ? (
            <div className="table-responsive">
              <Datatable
                columns={manifestsColumns}
                dataSource={manifests}
                rowKey={(record) => record.header.riderManifestID}
                loading={loading}
              />
            </div>
          ) : (
            <Alert variant="info" className="text-center">
              <FileText size={48} className="mb-3" />
              <h5>No Manifests Found</h5>
              <p>You have no manifests assigned yet.</p>
            </Alert>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default RiderManifestPage;
