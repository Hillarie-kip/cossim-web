"use client";
import React from 'react';
import { Row, Col, Card, Button, Badge, ProgressBar, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { 
  Activity, 
  MapPin, 
  Truck, 
  Package, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  RotateCcw,
  ChevronUp,
  Settings,
  Plus,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import DCSwitcher from '@/components/DCSwitcher';
import DashCard from '@/components/cards/DashCard';
import CountUp from "react-countup";
import "./../dc-overview/dc-overview-styles.css";
import Link from "@/components/Link";

export default function DCOperations() {
  const opStats = [
    { title: "Active Routes", value: "112", color: "primary", icon: Activity },
    { title: "On-Time Dispatch", value: "94.2", color: "success", icon: CheckCircle },
    { title: "Peak Efficiency", value: "88", color: "warning", icon: TrendingUp },
    { title: "Network Status", value: "Stable", color: "info", icon: Activity },
  ];

  const stations = [
    { id: "ST-01", name: "Inbound Dock", status: "Operational", load: 65, color: "success" },
    { id: "ST-02", name: "Sorting Area A", status: "High Load", load: 92, color: "warning" },
    { id: "ST-03", name: "Sorting Area B", status: "Operational", load: 45, color: "success" },
    { id: "ST-04", name: "Outbound Dock", status: "Operational", load: 78, color: "success" },
  ];

  return (
      <div className="content">
        <div className="page-header mb-4">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4 className="fw-bold">Operations Hub</h4>
              <h6 className="text-muted">Real-time distribution center performance monitoring</h6>
            </div>
          </div>
          
          <div className="d-flex align-items-center gap-3">
            <DCSwitcher />
            
            <ul className="table-top-head mb-0">
              <li>
                <OverlayTrigger placement="top" overlay={(props) => <Tooltip {...props}>Refresh</Tooltip>}>
                  <Link
                    className="btn-filter rounded-pill shadow-sm"
                    style={{ cursor: 'pointer' }}
                  >
                    <RotateCcw size={18} />
                  </Link>
                </OverlayTrigger>
              </li>
              <li>
                <OverlayTrigger placement="top" overlay={(props) => <Tooltip {...props}>Settings</Tooltip>}>
                  <Link className="btn-filter rounded-pill shadow-sm">
                    <Settings size={18} />
                  </Link>
                </OverlayTrigger>
              </li>
            </ul>

            <div className="page-btn">
              <Button variant="primary" className="btn btn-added rounded-pill shadow-sm py-2 px-4 transition-all">
                <Plus size={18} className="me-2" />
                New Operation Task
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <Row className="g-4 mb-4">
          {opStats.map((stat, idx) => (
            <Col key={idx} xl={3} md={6}>
              <DashCard
                title={stat.title}
                value={
                  isNaN(parseFloat(stat.value)) ? stat.value :
                  <CountUp
                    end={parseFloat(stat.value)}
                    duration={2}
                    decimals={stat.value.includes('.') ? 1 : 0}
                    suffix={stat.value.includes('.') ? '%' : ''}
                  />
                }
                color={stat.color}
                icon={<stat.icon size={24} />}
                textColor={'white'}
                className="hover-translate-y shadow-sm h-100"
              />
            </Col>
          ))}
        </Row>

        <Row className="g-4">
          {/* Station Status */}
          <Col lg={8}>
            <Card className="border-0 shadow-sm rounded-3 overflow-hidden">
              <Card.Header className="bg-transparent border-bottom pt-4 px-4 pb-3">
                <div className="d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Facility Stations</h5>
                  <Badge bg="light" text="dark" className="rounded-pill px-3 py-2 border">
                    All Systems Operational
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <Row className="g-4">
                  {stations.map((station, idx) => (
                    <Col md={6} key={idx}>
                      <div className="p-3 border rounded-3 hover-shadow transition-all bg-light bg-opacity-50">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div className="d-flex align-items-center">
                            <div className={`p-2 rounded-circle bg-${station.color} bg-opacity-10 me-3`}>
                              <MapPin size={18} className={`text-${station.color}`} />
                            </div>
                            <div>
                              <h6 className="fw-bold mb-0">{station.name}</h6>
                              <small className="text-muted">{station.id}</small>
                            </div>
                          </div>
                          <span className={`badge badge-soft-${station.color}`}>
                            {station.status}
                          </span>
                        </div>
                        <div className="mb-1 d-flex justify-content-between small">
                          <span className="text-muted">Load Capacity</span>
                          <span className="fw-bold">{station.load}%</span>
                        </div>
                        <ProgressBar 
                          variant={station.load > 90 ? "danger" : station.load > 70 ? "warning" : "success"} 
                          now={station.load} 
                          className="rounded-pill"
                          style={{ height: '6px' }}
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* Activity Timeline Simplified */}
          <Col lg={4}>
            <Card className="border-0 shadow-sm rounded-3 overflow-hidden h-100">
              <Card.Header className="bg-transparent border-bottom pt-4 px-4 pb-3">
                <h5 className="fw-bold mb-0">Live Diagnostics</h5>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="d-flex flex-column gap-4">
                  <div className="d-flex align-items-start gap-3">
                    <div className="p-2 bg-success bg-opacity-10 rounded-circle flex-shrink-0">
                      <ArrowUpRight size={16} className="text-success" />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold small">Incoming Peak</h6>
                      <p className="text-muted small mb-0">System detected 25% increase in inbound volume from Northern DC Hub.</p>
                      <small className="text-muted">Just now</small>
                    </div>
                  </div>
                  <div className="d-flex align-items-start gap-3">
                    <div className="p-2 bg-primary bg-opacity-10 rounded-circle flex-shrink-0">
                      <Truck size={16} className="text-primary" />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold small">Fleet Optimization</h6>
                      <p className="text-muted small mb-0">12 delivery routes recalibrated for fuel efficiency.</p>
                      <small className="text-muted">18 mins ago</small>
                    </div>
                  </div>
                  <div className="d-flex align-items-start gap-3">
                    <div className="p-2 bg-warning bg-opacity-10 rounded-circle flex-shrink-0">
                      <AlertCircle size={16} className="text-warning" />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold small">Load Warning</h6>
                      <p className="text-muted small mb-0">Station ST-02 reached 90% capacity threshold.</p>
                      <small className="text-muted">1 hour ago</small>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
  );
}
