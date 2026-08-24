"use client";
import React from 'react';
import { Row, Col, Card, Button, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { 
  Truck, 
  Package, 
  CheckCircle, 
  Clock, 
  Plus, 
  RotateCcw, 
  ChevronUp, 
  Search,
  Filter,
  MoreVertical,
  Calendar
} from 'lucide-react';
import DCSwitcher from '@/components/DCSwitcher';
import DashCard from '@/components/cards/DashCard';
import CountUp from "react-countup";
import "./../dc-overview/dc-overview-styles.css";
import Link from "@/components/Link";

export default function DCReceiving() {
  const receivingStats = [
    { title: "Pending Receives", value: "14", color: "primary", icon: Truck },
    { title: "Received Today", value: "152", color: "success", icon: CheckCircle },
    { title: "Processing", value: "8", color: "warning", icon: Clock },
  ];

  return (
      <div className="content">
        <div className="page-header mb-4">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4 className="fw-bold">Receiving Management</h4>
              <h6 className="text-muted">Manage incoming packages and shipments</h6>
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
                <OverlayTrigger placement="top" overlay={(props) => <Tooltip {...props}>Collapse</Tooltip>}>
                  <Link id="collapse-header" className="btn-filter rounded-pill shadow-sm">
                    <ChevronUp size={18} />
                  </Link>
                </OverlayTrigger>
              </li>
            </ul>

            <div className="page-btn">
              <Button variant="primary" className="btn btn-added rounded-pill shadow-sm py-2 px-4 transition-all">
                <Plus size={18} className="me-2" />
                New Receiving
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <Row className="g-4 mb-4">
          {receivingStats.map((stat, idx) => (
            <Col key={idx} lg={4} md={6}>
              <DashCard
                title={stat.title}
                value={<CountUp end={parseInt(stat.value)} duration={2} />}
                color={stat.color}
                icon={<stat.icon size={24} />}
                textColor="white"
                className="hover-translate-y shadow-sm h-100"
              />
            </Col>
          ))}
        </Row>
        
        <Row className="g-4">
          <Col lg={12}>
            <Card className="border-0 shadow-sm rounded-3 overflow-hidden">
              <Card.Header className="bg-transparent border-bottom pt-4 px-4 pb-0">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
                  <h5 className="fw-bold mb-0">Receiving Queue</h5>
                  <div className="d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" className="rounded-pill">
                      <Filter size={14} className="me-1" /> Filter
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light text-muted">
                      <tr>
                        <th className="fw-semibold">Shipment ID</th>
                        <th className="fw-semibold">Sender</th>
                        <th className="fw-semibold">Expected Date</th>
                        <th className="fw-semibold text-center">Package Count</th>
                        <th className="fw-semibold">Status</th>
                        <th className="fw-semibold text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan="6" className="text-center py-5">
                          <div className="d-flex flex-column align-items-center opacity-50">
                            <Truck size={48} className="mb-3" />
                            <h6 className="fw-normal">No incoming shipments found</h6>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
  );
}
