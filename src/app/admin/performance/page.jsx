"use client"
import React, { useState, useEffect } from "react";
import { Card, Row, Col, Badge, ProgressBar } from "react-bootstrap";
import { TrendingUp, TrendingDown, Package, Users, DollarSign, Clock } from "feather-icons-react";
import Chart from "@/components/ClientChart";
import CountUp from "react-countup";
import { packages } from "@/core/data/packages.mock";
import { users } from "@/core/data/users.mock";
import { cod_payments } from "@/core/data/cod_payments.mock";
import { sales_agents } from "@/core/data/sales_agents.mock";

const PerformancePage = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    totalPackages: 0,
    deliveredPackages: 0,
    pendingPackages: 0,
    totalRevenue: 0,
    codPayments: 0,
    activeAgents: 0,
    deliveryRate: 0,
  });

  const [chartData, setChartData] = useState({
    series: [
      {
        name: "Packages Delivered",
        data: [31, 40, 28, 51, 42, 82, 56],
      },
      {
        name: "Packages Created",
        data: [11, 32, 45, 32, 34, 52, 41],
      },
    ],
    options: {
      chart: {
        type: "area",
        height: 350,
        toolbar: {
          show: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "smooth",
      },
      xaxis: {
        type: "datetime",
        categories: [
          "2024-09-19T00:00:00.000Z",
          "2024-09-19T01:30:00.000Z",
          "2024-09-19T02:30:00.000Z",
          "2024-09-19T03:30:00.000Z",
          "2024-09-19T04:30:00.000Z",
          "2024-09-19T05:30:00.000Z",
          "2024-09-19T06:30:00.000Z",
        ],
      },
      tooltip: {
        x: {
          format: "dd/MM/yy HH:mm",
        },
      },
      colors: ["#28a745", "#007bff"],
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.3,
          opacityTo: 0.9,
          stops: [0, 90, 100],
        },
      },
    },
  });

  useEffect(() => {
    // Calculate performance metrics from mock data
    const totalPackages = packages.length;
    const deliveredPackages = packages.filter(pkg => pkg.status === "Delivered").length;
    const pendingPackages = packages.filter(pkg => pkg.status === "Created" || pkg.status === "In Transit").length;
    const totalRevenue = packages.reduce((sum, pkg) => sum + pkg.delivery_cost, 0);
    const codPayments = cod_payments.reduce((sum, payment) => sum + payment.cod_amount, 0);
    const activeAgents = sales_agents.length;
    const deliveryRate = totalPackages > 0 ? (deliveredPackages / totalPackages) * 100 : 0;

    setPerformanceMetrics({
      totalPackages,
      deliveredPackages,
      pendingPackages,
      totalRevenue,
      codPayments,
      activeAgents,
      deliveryRate,
    });
  }, []);

  const MetricCard = ({ title, value, icon: Icon, trend, trendValue, color = "primary" }) => (
    <Card className="h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h6 className="text-muted mb-1">{title}</h6>
            <h3 className="mb-0">
              <CountUp end={value} duration={2} separator="," />
            </h3>
            {trend && (
              <div className={`d-flex align-items-center mt-2 text-${trend === 'up' ? 'success' : 'danger'}`}>
                {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span className="ms-1 small">{trendValue}% vs last month</span>
              </div>
            )}
          </div>
          <div className={`bg-${color} bg-opacity-10 p-3 rounded`}>
            <Icon className={`text-${color}`} size={24} />
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Performance Analytics</h4>
              <h6>Monitor system performance and key metrics</h6>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <MetricCard
              title="Total Packages"
              value={performanceMetrics.totalPackages}
              icon={Package}
              trend="up"
              trendValue={12.5}
              color="primary"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <MetricCard
              title="Delivered Packages"
              value={performanceMetrics.deliveredPackages}
              icon={Package}
              trend="up"
              trendValue={8.2}
              color="success"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <MetricCard
              title="Total Revenue"
              value={performanceMetrics.totalRevenue}
              icon={DollarSign}
              trend="up"
              trendValue={15.3}
              color="info"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <MetricCard
              title="Active Agents"
              value={performanceMetrics.activeAgents}
              icon={Users}
              trend="down"
              trendValue={2.1}
              color="warning"
            />
          </Col>
        </Row>

        {/* Charts and Additional Metrics */}
        <Row>
          <Col lg={8} className="mb-4">
            <Card>
              <Card.Header>
                <h5 className="mb-0">Package Delivery Trends</h5>
              </Card.Header>
              <Card.Body>
                <Chart
                  options={chartData.options}
                  series={chartData.series}
                  type="area"
                  height={350}
                />
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4} className="mb-4">
            <Card className="h-100">
              <Card.Header>
                <h5 className="mb-0">Performance Summary</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>Delivery Success Rate</span>
                    <Badge bg="success">{performanceMetrics.deliveryRate.toFixed(1)}%</Badge>
                  </div>
                  <ProgressBar 
                    now={performanceMetrics.deliveryRate} 
                    variant="success" 
                    className="mb-3"
                  />
                </div>
                
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>Pending Orders</span>
                    <Badge bg="warning">{performanceMetrics.pendingPackages}</Badge>
                  </div>
                  <ProgressBar 
                    now={(performanceMetrics.pendingPackages / performanceMetrics.totalPackages) * 100} 
                    variant="warning" 
                    className="mb-3"
                  />
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>COD Collections</span>
                    <Badge bg="info">KSh {performanceMetrics.codPayments.toLocaleString()}</Badge>
                  </div>
                </div>

                <hr />
                
                <div className="text-center">
                  <h6 className="text-muted">Average Delivery Time</h6>
                  <h4 className="text-primary d-flex align-items-center justify-content-center">
                    <Clock size={20} className="me-2" />
                    2.3 Days
                  </h4>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Status Distribution */}
        <Row>
          <Col lg={12}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Package Status Distribution</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {[
                    { status: "Created", count: packages.filter(p => p.status === "Created").length, color: "info" },
                    { status: "In Transit", count: packages.filter(p => p.status === "In Transit").length, color: "warning" },
                    { status: "Delivered", count: packages.filter(p => p.status === "Delivered").length, color: "success" },
                    { status: "Cancelled", count: packages.filter(p => p.status === "Cancelled").length, color: "danger" },
                  ].map((item, index) => (
                    <Col md={3} key={index} className="text-center mb-3">
                      <div className={`bg-${item.color} bg-opacity-10 p-4 rounded`}>
                        <h3 className={`text-${item.color} mb-2`}>
                          <CountUp end={item.count} duration={2} />
                        </h3>
                        <p className="mb-0 text-muted">{item.status}</p>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default PerformancePage;
