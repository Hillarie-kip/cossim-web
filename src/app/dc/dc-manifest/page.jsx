"use client"
import React, { useState, useEffect } from "react";
import { Card, Row, Col, Badge, Button, Alert, Modal, Tab, Tabs } from "react-bootstrap";
import { 
  FileText, 
  Truck, 
  MapPin, 
  Clock, 
  Package, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Eye,
   RotateCcw, ChevronUp, Plus
} from "lucide-react";
import Link from "@/components/Link";
import Datatable from "@/core/pagination/datatable";
import { useShipment } from "@/hooks/useShipment";
import DCSwitcher from '@/components/DCSwitcher';
import { PostManifestModal } from "@/components/modals";
import DashCard from '@/components/cards/DashCard';
import "./../dc-overview/dc-overview-styles.css";
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

const DCManifestPage = () => {
  const {
    riderManifest,
    loading,
    error,
    fetchRiderManifest,
    clearRiderManifest,
    dcCode,
    handlePostRiderManifestTx
  } = useShipment();

  const [manifests, setManifests] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showPostManifestModal, setShowPostManifestModal] = useState(false);

  // Fetch manifests when component mounts or dcCode changes
  useEffect(() => {
    if (dcCode) {
      const params = {
        dcCode: dcCode,
        activeOnly: false
      };

      fetchRiderManifest(params).then((response) => {
        if (response && (response.Data || response.data)) {
          setManifests(response.Data || response.data);
        }
      });
    }

    return () => {
      clearRiderManifest();
    };
  }, [dcCode, fetchRiderManifest, clearRiderManifest]);

  const handleRefresh = () => {
    if (dcCode) {
      const params = {
        dcCode: dcCode,
        activeOnly: false
      };

      fetchRiderManifest(params).then((response) => {
        if (response && (response.Data || response.data)) {
          setManifests(response.Data || response.data);
        }
      });
    }
  };

  const handlePostManifestSuccess = async (payload) => {
    try {
      // Call the API to post the manifest
      await handlePostRiderManifestTx(payload);
      
      // Close modal and refresh data on success
      setShowPostManifestModal(false);
      
      // Refresh manifest list after successful creation
      handleRefresh();
    } catch (error) {
      console.error('Error posting manifest:', error);
      // Keep modal open on error so user can try again
    }
  };

  const getStatusBadge = (statusID) => {
    const statusMap = {
      0: { variant: 'badge-soft-secondary', text: 'Pending' },
      1: { variant: 'badge-soft-primary', text: 'Open' },
      2: { variant: 'badge-soft-info', text: 'In Progress' },
      3: { variant: 'badge-soft-success', text: 'Completed' },
      4: { variant: 'badge-soft-danger', text: 'Failed' },
      5: { variant: 'badge-soft-warning', text: 'Cancelled' }
    };
    return statusMap[statusID] || { variant: 'badge-soft-secondary', text: 'Unknown' };
  };

  const formatDateTime = (dateString) => {
    if (!dateString || dateString === '0001-01-01T00:00:00') return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Calculate manifest statistics
  const manifestStats = React.useMemo(() => {
    const total = manifests.length;
    const pending = manifests.filter(m => m.header?.statusID === 0).length;
    const inProgress = manifests.filter(m => m.header?.statusID === 2).length;
    const completed = manifests.filter(m => m.header?.statusID === 3).length;
    const failed = manifests.filter(m => m.header?.statusID === 4).length;

    return {
      total,
      pending,
      inProgress,
      completed,
      failed
    };
  }, [manifests]);

  // Filter manifests based on search and status
  const filteredManifests = React.useMemo(() => {
    let filtered = manifests;

    if (searchTerm) {
      filtered = filtered.filter(manifest =>
        manifest.header?.manifestNO?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manifest.header?.riderUserCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manifest.header?.riderName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(manifest => manifest.header?.statusID?.toString() === statusFilter);
    }

    if (activeTab !== 'all') {
      const statusMap = {
        'pending': 0,
        'inprogress': 2,
        'completed': 3,
        'failed': 4
      };
      if (statusMap[activeTab] !== undefined) {
        filtered = filtered.filter(manifest => manifest.header?.statusID === statusMap[activeTab]);
      }
    }

    return filtered;
  }, [manifests, searchTerm, statusFilter, activeTab]);

  // Manifests table columns
  const manifestsColumns = [
    {
      title: "Manifest NO",
      dataIndex: "header.manifestNO",
      render: (value, record) => (
        <Link to={`/dc/dc-manifest/${record.header.manifestNO}`} className="text-primary fw-medium">
          {record.header.manifestNO}
        </Link>
      ),
      sorter: (a, b) => a.header.manifestNO.localeCompare(b.header.manifestNO),
    },
    {
      title: "Rider",
      dataIndex: "header.riderName",
      render: (value, record) => (
        <div>
          <div className="fw-medium">{record.header.riderName || 'N/A'}</div>
          <small className="text-muted">{record.header.riderUserCode}</small>
        </div>
      ),
      sorter: (a, b) => (a.header.riderName || '').localeCompare(b.header.riderName || ''),
    },
    {
      title: "Status",
      dataIndex: "header.statusID",
      render: (statusID) => {
        const status = getStatusBadge(statusID);
        return <span className={`badge ${status.variant}`}>{status.text}</span>;
      },
      sorter: (a, b) => a.header.statusID - b.header.statusID,
    },
    {
      title: "Items Count",
      dataIndex: "items",
      render: (items) => (
        <div className="d-flex align-items-center">
          <Package size={16} className="me-2 text-muted" />
          {items?.length || 0}
        </div>
      ),
      sorter: (a, b) => (a.items?.length || 0) - (b.items?.length || 0),
    },
    {
      title: "Created",
      dataIndex: "header.createdAt",
      render: (value) => formatDateTime(value),
      sorter: (a, b) => new Date(a.header.createdAt) - new Date(b.header.createdAt),
    },
    {
      title: "Updated",
      dataIndex: "header.updatedAt",
      render: (value) => formatDateTime(value),
      sorter: (a, b) => new Date(a.header.updatedAt) - new Date(b.header.updatedAt),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_, record) => (
        <div className="d-flex gap-2">
          <Link 
            to={`/dc/dc-manifest/${record.header.manifestNO}`}
            className="btn btn-sm btn-outline-primary"
          >
            <Eye size={14} className="me-1" />
            View
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="content">
      <div className="page-header mb-4">
        <div className="add-item d-flex">
          <div className="page-title">
            <h4 className="fw-bold">Distribution Center Manifests</h4>
            <h6 className="text-muted">DC: {dcCode || 'Not Selected'}</h6>
          </div>
        </div>
        
        <div className="d-flex align-items-center gap-3">
          <DCSwitcher />
          
          <ul className="table-top-head mb-0">
            <li>
              <OverlayTrigger placement="top" overlay={(props) => <Tooltip {...props}>Refresh</Tooltip>}>
                <Link
                  onClick={handleRefresh}
                  className="btn-filter rounded-pill shadow-sm"
                  style={{ cursor: 'pointer' }}
                >
                  <RotateCcw size={18} className={loading ? "spin" : ""} />
                </Link>
              </OverlayTrigger>
            </li>
            <li>
              <OverlayTrigger placement="top" overlay={(props) => <Tooltip {...props}>Collapse</Tooltip>}>
                <Link id="collapse-header" className="btn-filter rounded-pill shadow-sm">
                  <ChevronUp size={18} />
                </Link>
              </OverlayTrigger>
            </li>
          </ul>

          <div className="page-btn">
            <Button variant="primary" onClick={() => setShowPostManifestModal(true)} className="btn btn-added rounded-pill shadow-sm py-2 px-4 transition-all">
              <Plus size={18} className="me-2" />
              Create New Manifest
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <Row className="g-4 mb-4">
        <DashCard
          title="Total Manifests"
          value={manifestStats.total}
          className="bg-primary"
          icon={<FileText size={24} />}
          textColor="white"
        />

        <DashCard
          title="Active Today"
          value={manifestStats.inProgress}
          className="bg-success"
          icon={<CheckCircle size={24} />}
          textColor="white"
        />

        <DashCard
          title="Pending"
          value={manifestStats.pending}
          className="bg-warning"
          icon={<Clock size={24} />}
          textColor="white"
        />

        <DashCard
          title="Completed"
          value={manifestStats.completed}
          className="bg-info"
          icon={<Truck size={24} />}
          textColor="white"
        />
      </Row>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <AlertCircle size={16} className="me-2" />
          {error}
        </Alert>
      )}

      {/* Manifests Table */}
      <Card className="border-0 shadow-sm rounded-3 overflow-hidden">
        <Card.Header className="bg-transparent border-bottom pt-4 px-4 pb-0">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
            <h5 className="fw-bold mb-0">Manifests History</h5>
            <span className="badge badge-soft-primary rounded-pill px-3 py-2">{filteredManifests.length} total manifest records</span>
          </div>
        </Card.Header>
        <Card.Body className="p-4">
          {filteredManifests && filteredManifests.length > 0 ? (
            <Datatable
              columns={manifestsColumns}
              dataSource={filteredManifests}
              loading={loading}
              pagination={{
                pageSize: 100,
                showSizeChanger: true,
                pageSizeOptions: ['50', '100', '200', '500'],
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} manifests`
              }}
              scroll={{ x: 1200 }}
              rowKey={(record) => record.header.manifestNO}
            />
          ) : (
            <div className="text-center py-5 bg-light rounded-3">
              <FileText size={48} className="mb-3 opacity-20" />
              <h5 className="text-muted">No Manifests Found</h5>
              <p className="text-muted small">Try adjusting your filters or creating a new manifest.</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Post Manifest Modal */}
      <PostManifestModal
        show={showPostManifestModal}
        onHide={() => setShowPostManifestModal(false)}
        onSuccess={handlePostManifestSuccess}
        dcCode={dcCode}
      />
    </div>
  );
};

export default DCManifestPage;
