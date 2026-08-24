"use client"
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Row, Col, Badge, Button, Alert, Modal } from "react-bootstrap";
import { ArrowLeft, FileText, Truck, MapPin, Clock, Package, CheckCircle, XCircle, AlertCircle, RefreshCw, Eye } from "feather-icons-react";
import Link from "@/components/Link";
import Datatable from "@/core/pagination/datatable";
import { useShipment } from "@/hooks/useShipment";
import { PostManifestModal } from "@/components/modals";

const RiderManifestListPage = () => {
  const params = useParams();
  const router = useRouter();
  const riderUserCode = params.id;

  const {
    riderManifest,
    loading,
    error,
    fetchRiderManifest,
    handlePostRiderManifestTx,
    clearRiderManifest,
    dcCode
  } = useShipment();

  const [showPostManifestModal, setShowPostManifestModal] = useState(false);
  const [manifests, setManifests] = useState([]);

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

  const handlePostManifestSuccess = async (payload) => {
    try {
      // Call the API to post the manifest
      await handlePostRiderManifestTx(payload);
      
      // Close modal and refresh data on success
      setShowPostManifestModal(false);
      
      // Refresh manifest list after successful creation
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
    } catch (error) {
      console.error('Error posting manifest:', error);
      // Keep modal open on error so user can try again
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
        <Link to={`/admin/riders/${riderUserCode}/manifest/${record.header.manifestNO}`}>
          {record.header.manifestNO}
        </Link>
      ),
      sorter: (a, b) => a.header.manifestNO.localeCompare(b.header.manifestNO),
    },
    {
      title: "DC Code",
      dataIndex: "header.dCCode",
      render: (value, record) => record.header.dCCode || 'N/A',
      sorter: (a, b) => (a.header.dCCode || '').localeCompare(b.header.dCCode || ''),
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
    },
    {
      title: "Total Items",
      dataIndex: "header.totalItems",
      render: (value, record) => record.header.totalItems,
      sorter: (a, b) => a.header.totalItems - b.header.totalItems,
    },
    {
      title: "Delivered",
      dataIndex: "header.deliveredItems",
      render: (value, record) => record.header.deliveredItems,
      sorter: (a, b) => a.header.deliveredItems - b.header.deliveredItems,
    },
    {
      title: "Pending",
      dataIndex: "header.pendingItems",
      render: (value, record) => record.header.pendingItems,
      sorter: (a, b) => a.header.pendingItems - b.header.pendingItems,
    },
    {
      title: "Planned Departure",
      dataIndex: "header.plannedDepartAt",
      render: (value, record) => formatDateTime(record.header.plannedDepartAt),
      sorter: (a, b) => new Date(a.header.plannedDepartAt) - new Date(b.header.plannedDepartAt),
    },
    {
      title: "Date Added",
      dataIndex: "header.dateAdded",
      render: (value, record) => formatDateTime(record.header.dateAdded),
      sorter: (a, b) => new Date(a.header.dateAdded) - new Date(b.header.dateAdded),
    },
    {
      title: "Actions",
      render: (value, record) => (
        <div className="d-flex gap-2">
          <Link
            to={`/admin/riders/${riderUserCode}/manifest/${record.header.manifestNO}`}
            className="btn btn-sm btn-outline-primary"
          >
            <Eye size={14} className="me-1" />
            View
          </Link>
        </div>
      ),
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
            <Button variant="primary" onClick={() => {
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
            }}>
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
              <h4>Rider Manifests</h4>
              <h6>Rider: {riderUserCode}</h6>
            </div>
          </div>
          <div className="page-btn d-flex gap-2">
            <Link to={`/admin/riders`} className="btn btn-outline-secondary">
              <ArrowLeft size={16} className="me-2" />
              Back to Rider
            </Link>
            <Button variant="primary" onClick={() => setShowPostManifestModal(true)}>
              <FileText size={16} className="me-2" />
              Create New Manifest
            </Button>
            <Button variant="outline-primary" onClick={() => {
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
            }}>
              <RefreshCw size={16} className="me-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-4">
            <Card className="bg-primary text-white">
              <Card.Body>
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
              <Card.Body>
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
              <Card.Body>
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
              <Card.Body>
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

        {/* Manifests Table */}
        <Card>
          <Card.Header>
            <h5 className="mb-0">Manifests List</h5>
          </Card.Header>
          <Card.Body>
            {manifests && manifests.length > 0 ? (
              <Datatable
                columns={manifestsColumns}
                dataSource={manifests}
                rowKey={(record) => record.header.riderManifestID}
                loading={loading}
              />
            ) : (
              <Alert variant="info" className="text-center">
                <FileText size={48} className="mb-3" />
                <h5>No Manifests Found</h5>
                <p>This rider has no manifests.</p>
              </Alert>
            )}
          </Card.Body>
        </Card>

        {/* Post Manifest Modal */}
        <PostManifestModal
          show={showPostManifestModal}
          onHide={() => setShowPostManifestModal(false)}
          onSuccess={handlePostManifestSuccess}
          riderUserCode={riderUserCode}
        />
      </div>
  );
};

export default RiderManifestListPage;
