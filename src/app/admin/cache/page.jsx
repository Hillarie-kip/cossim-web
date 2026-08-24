"use client"
import React, { useState } from "react";
import { Card, Row, Col, Badge, Button, Alert, Form } from "react-bootstrap";
import { RefreshCw, Database, Clock, Trash2, Info } from "feather-icons-react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import notify from "@/lib/toast";

const CachePage = () => {
  const MySwal = withReactContent(Swal);
  const [loading, setLoading] = useState({});
  
  // Mock cache data
  const [cacheStats] = useState({
    totalKeys: 1245,
    memoryUsed: "2.4 GB",
    hitRatio: 98.2,
    missRatio: 1.8,
    avgResponseTime: "12ms"
  });

  const [cacheItems] = useState([
    {
      key: "packages:list:page:1",
      type: "Query Result",
      size: "45 KB",
      ttl: "2h 15m",
      hitCount: 1542,
      lastAccessed: "2 minutes ago",
      status: "active"
    },
    {
      key: "user:session:ab30995f-637b-46fb",
      type: "Session Data",
      size: "12 KB",
      ttl: "24h 0m",
      hitCount: 89,
      lastAccessed: "5 minutes ago",
      status: "active"
    },
    {
      key: "route:pricing:nairobi:eldoret",
      type: "Pricing Data",
      size: "8 KB",
      ttl: "6h 30m",
      hitCount: 234,
      lastAccessed: "1 hour ago",
      status: "active"
    },
    {
      key: "distribution:centers:active",
      type: "Configuration",
      size: "15 KB",
      ttl: "12h 45m",
      hitCount: 678,
      lastAccessed: "30 minutes ago",
      status: "active"
    },
    {
      key: "sms:templates:notification",
      type: "Template Data",
      size: "3 KB",
      ttl: "expired",
      hitCount: 156,
      lastAccessed: "3 hours ago",
      status: "expired"
    }
  ]);

  const handleClearCache = (key = null) => {
    const title = key ? `Clear Cache Key: ${key}` : "Clear All Cache";
    const text = key 
      ? "This will remove this specific cache entry." 
      : "This will clear all cache entries. This action cannot be undone.";
    
    MySwal.fire({
      title: title,
      text: text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Yes, clear it!",
      cancelButtonColor: "#6c757d",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setLoading(prev => ({ ...prev, [key || 'all']: true }));
        
        // Simulate API call
        setTimeout(() => {
          setLoading(prev => ({ ...prev, [key || 'all']: false }));
          notify.success(key ? "Cache key has been cleared." : "All cache has been cleared.");
        }, 1500);
      }
    });
  };

  const handleRefreshCache = () => {
    setLoading(prev => ({ ...prev, refresh: true }));
    
    // Simulate cache refresh
    setTimeout(() => {
      setLoading(prev => ({ ...prev, refresh: false }));
      notify.success("Cache statistics have been refreshed.");
    }, 1000);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: "success",
      expired: "danger",
      expiring: "warning"
    };
    return statusMap[status] || "secondary";
  };

  const getTypeColor = (type) => {
    const typeMap = {
      "Query Result": "primary",
      "Session Data": "info",
      "Pricing Data": "success", 
      "Configuration": "warning",
      "Template Data": "secondary"
    };
    return typeMap[type] || "secondary";
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Cache Management</h4>
              <h6>Monitor and manage application cache</h6>
            </div>
          </div>
          <div className="page-btn">
            <Button 
              variant="outline-primary" 
              onClick={handleRefreshCache}
              disabled={loading.refresh}
              className="me-2"
            >
              <RefreshCw size={16} className="me-2" />
              {loading.refresh ? "Refreshing..." : "Refresh Stats"}
            </Button>
            <Button 
              variant="danger" 
              onClick={() => handleClearCache()}
              disabled={loading.all}
            >
              <Trash2 size={16} className="me-2" />
              {loading.all ? "Clearing..." : "Clear All Cache"}
            </Button>
          </div>
        </div>

        {/* Cache Statistics */}
        <Row className="mb-4">
          <Col lg={12}>
            <Alert variant="info" className="mb-4">
              <Info size={16} className="me-2" />
              Cache helps improve application performance by storing frequently accessed data in memory.
              Monitor cache hit ratios and memory usage to optimize performance.
            </Alert>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col lg={2} md={4} sm={6} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <Database size={32} className="text-primary mb-2" />
                <h4 className="mb-1">{cacheStats.totalKeys.toLocaleString()}</h4>
                <p className="text-muted mb-0 small">Total Keys</p>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={2} md={4} sm={6} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <Database size={32} className="text-success mb-2" />
                <h4 className="mb-1">{cacheStats.memoryUsed}</h4>
                <p className="text-muted mb-0 small">Memory Used</p>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={2} md={4} sm={6} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <RefreshCw size={32} className="text-info mb-2" />
                <h4 className="mb-1">{cacheStats.hitRatio}%</h4>
                <p className="text-muted mb-0 small">Hit Ratio</p>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={2} md={4} sm={6} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <RefreshCw size={32} className="text-warning mb-2" />
                <h4 className="mb-1">{cacheStats.missRatio}%</h4>
                <p className="text-muted mb-0 small">Miss Ratio</p>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={2} md={4} sm={6} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <Clock size={32} className="text-secondary mb-2" />
                <h4 className="mb-1">{cacheStats.avgResponseTime}</h4>
                <p className="text-muted mb-0 small">Avg Response</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Cache Items */}
        <Row>
          <Col lg={12}>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Cache Entries</h5>
                <Form.Control
                  type="search"
                  placeholder="Search cache keys..."
                  style={{ width: "300px" }}
                />
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <table className="table table-striped mb-0">
                    <thead>
                      <tr>
                        <th>Cache Key</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th>TTL</th>
                        <th>Hit Count</th>
                        <th>Last Accessed</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cacheItems.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <code className="small">{item.key}</code>
                          </td>
                          <td>
                            <Badge bg={getTypeColor(item.type)} className="small">
                              {item.type}
                            </Badge>
                          </td>
                          <td className="small">{item.size}</td>
                          <td className="small">{item.ttl}</td>
                          <td className="small">{item.hitCount.toLocaleString()}</td>
                          <td className="small text-muted">{item.lastAccessed}</td>
                          <td>
                            <Badge bg={getStatusBadge(item.status)} className="small">
                              {item.status}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleClearCache(item.key)}
                              disabled={loading[item.key]}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default CachePage;
