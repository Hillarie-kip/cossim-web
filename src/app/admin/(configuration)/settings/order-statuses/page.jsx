"use client"
import {
  ChevronUp,
  RotateCcw,
  Filter,
  List,
  ArrowRight,
  Check,
  X,
} from "feather-icons-react";
import React, { useState, useEffect } from "react";
import { OverlayTrigger, Tooltip, Badge, Button, Form, Row, Col, Card } from "react-bootstrap";
import Link from "@/components/Link";
import Datatable from "@/core/pagination/datatable";
import { useShipment } from "@/hooks/useShipment";
import SSRSelect from "@/components/SSRSelect";
import { PHASE_CODES } from "@/constants/package_status";

const phaseOptions = Object.values(PHASE_CODES).map((code) => ({
  value: code,
  label: code,
}));

const booleanOptions = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

const orderByOptions = [
  { value: "SortOrder", label: "Sort Order" },
  { value: "OrderStatusID", label: "Order Status ID" },
  { value: "StatusName", label: "Status Name" },
  { value: "PhaseCode", label: "Phase" },
];

const sortDirOptions = [
  { value: "ASC", label: "Ascending" },
  { value: "DESC", label: "Descending" },
];

// Bootstrap badge variants for each phase
const phaseVariants = {
  VENDOR: "secondary",
  INBOUND: "info",
  DC: "primary",
  ASSIGN: "warning",
  DELIVERY: "success",
  PICKUP: "info",
  RETURN: "danger",
  PAYMENT: "dark",
  CLOSED: "light",
};

const OrderStatusesPage = () => {
  const { orderStatuses, loading, error, fetchShipmentOrderStatus } = useShipment();

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [phaseCode, setPhaseCode] = useState("");
  const [isTerminal, setIsTerminal] = useState("");
  const [isFailure, setIsFailure] = useState("");
  const [orderBy, setOrderBy] = useState("SortOrder");
  const [sortDir, setSortDir] = useState("ASC");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [totalCount, setTotalCount] = useState(0);

  const buildParams = (overrides = {}) => ({
    pageNo: currentPage,
    pageSize,
    search: searchTerm || undefined,
    phaseCode: phaseCode || undefined,
    isTerminal: isTerminal === "" ? undefined : isTerminal === "true",
    isFailure: isFailure === "" ? undefined : isFailure === "true",
    orderBy,
    sortDir,
    ...overrides,
  });

  const loadOrderStatuses = async (overrides = {}) => {
    try {
      const response = await fetchShipmentOrderStatus(buildParams(overrides));
      const data = response?.Data || response?.data || {};
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error("Error fetching order statuses:", err);
    }
  };

  useEffect(() => {
    loadOrderStatuses();
  }, [currentPage, pageSize]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
    loadOrderStatuses({ pageNo: 1 });
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setPhaseCode("");
    setIsTerminal("");
    setIsFailure("");
    setOrderBy("SortOrder");
    setSortDir("ASC");
    setCurrentPage(1);
    loadOrderStatuses({
      pageNo: 1,
      search: undefined,
      phaseCode: undefined,
      isTerminal: undefined,
      isFailure: undefined,
      orderBy: "SortOrder",
      sortDir: "ASC",
    });
  };

  const handleRefresh = () => {
    loadOrderStatuses();
  };

  const flagIcon = (val) =>
    val ? (
      <Check size={14} className="text-success" />
    ) : (
      <X size={14} className="text-muted" />
    );

  const expandable = {
    rowExpandable: (record) => record.StatusTransitionArray?.length > 0,
    expandedRowRender: (record) => (
      <div className="p-2">
        <h6 className="mb-2 text-primary">
          <ArrowRight size={14} className="me-1" />
          Available Transitions from &quot;{record.statusName}&quot;
        </h6>
        <table className="table table-sm table-bordered table-striped mb-0 bg-white w-100">
          <thead className="table-light">
            <tr>
              <th>Action</th>
              <th className="text-center">To Status</th>
              <th className="text-center">Delivery Flow</th>
              <th className="text-center">Pickup Flow</th>
              <th className="text-center">COD</th>
              <th className="text-center">POD</th>
              <th className="text-center">Batch Action</th>
              <th className="text-center">Sort Order</th>
            </tr>
          </thead>
          <tbody>
            {record.StatusTransitionArray.map((t) => (
              <tr key={`${t.fromOrderStatusID}-${t.toOrderStatusID}-${t.actionCode}`}>
                <td>
                  <div className="fw-medium">{t.actionName}</div>
                  <small className="text-muted">{t.actionCode}</small>
                </td>
                <td className="text-center">
                  <Badge bg="primary">{t.toOrderStatusID}</Badge>
                </td>
                <td className="text-center">{flagIcon(t.requiresDeliveryFlow)}</td>
                <td className="text-center">{flagIcon(t.requiresPickupFlow)}</td>
                <td className="text-center">{flagIcon(t.requiresCOD)}</td>
                <td className="text-center">{flagIcon(t.requiresPOD)}</td>
                <td className="text-center">
                  {t.isBatchAction ? (
                    <Badge bg="info">{t.batchTypeCode || "Batch"}</Badge>
                  ) : (
                    <X size={14} className="text-muted" />
                  )}
                </td>
                <td className="text-center">{t.sortOrder}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  };

  const columns = [
    {
      title: "Status ID",
      dataIndex: "orderStatusID",
      render: (id) => <strong>{id}</strong>,
      sorter: (a, b) => a.orderStatusID - b.orderStatusID,
    },
    {
      title: "Status Name",
      dataIndex: "statusName",
      sorter: (a, b) => (a.statusName || "").localeCompare(b.statusName || ""),
    },
    {
      title: "Phase",
      dataIndex: "phaseCode",
      render: (phase) => (
        <Badge bg={phaseVariants[phase] || "secondary"}>{phase}</Badge>
      ),
      sorter: (a, b) => (a.phaseCode || "").localeCompare(b.phaseCode || ""),
    },
    {
      title: "Sort Order",
      dataIndex: "sortOrder",
      sorter: (a, b) => a.sortOrder - b.sortOrder,
    },
    {
      title: "Terminal",
      dataIndex: "isTerminal",
      render: (val) => (
        <Badge bg={val ? "success" : "secondary"}>{val ? "Yes" : "No"}</Badge>
      ),
      sorter: (a, b) => Number(a.isTerminal) - Number(b.isTerminal),
    },
    {
      title: "Failure",
      dataIndex: "isFailure",
      render: (val) => (
        <Badge bg={val ? "danger" : "secondary"}>{val ? "Yes" : "No"}</Badge>
      ),
      sorter: (a, b) => Number(a.isFailure) - Number(b.isFailure),
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (desc) => desc || <span className="text-muted">—</span>,
    },
    {
      title: "Transitions",
      dataIndex: "StatusTransitionArray",
      render: (transitions = []) => (
        <Badge bg={transitions.length > 0 ? "info" : "secondary"}>
          <List size={12} className="me-1" />
          {transitions.length}
        </Badge>
      ),
    },
  ];

  const renderRefreshTooltip = (props) => (
    <Tooltip id="refresh-tooltip" {...props}>
      Refresh
    </Tooltip>
  );
  const renderFilterTooltip = (props) => (
    <Tooltip id="filter-tooltip" {...props}>
      Toggle Filters
    </Tooltip>
  );
  const renderCollapseTooltip = (props) => (
    <Tooltip id="collapse-tooltip" {...props}>
      Collapse
    </Tooltip>
  );

  return (
    <div className="content">
      <div className="page-header">
        <div className="add-item d-flex">
          <div className="page-title">
            <h4>Order Statuses</h4>
            <h6>View shipment order statuses, phases, and allowed transitions</h6>
          </div>
        </div>
        <ul className="table-top-head">
          <li>
            <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
              <Link onClick={handleRefresh}>
                <RotateCcw className={loading ? "rotate" : ""} />
              </Link>
            </OverlayTrigger>
          </li>
          <li>
            <OverlayTrigger placement="top" overlay={renderFilterTooltip}>
              <Link
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "active" : ""}
              >
                <Filter />
              </Link>
            </OverlayTrigger>
          </li>
          <li>
            <OverlayTrigger placement="top" overlay={renderCollapseTooltip}>
              <Link data-bs-toggle="tooltip" data-bs-placement="top" id="collapse-header">
                <ChevronUp />
              </Link>
            </OverlayTrigger>
          </li>
        </ul>
      </div>

      {showFilters && (
        <Card className="mb-3">
          <Card.Body>
            <Form>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Search</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search by status name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phase</Form.Label>
                    <SSRSelect
                      instanceId="phase-code-select"
                      options={phaseOptions}
                      value={phaseOptions.find((option) => option.value === phaseCode) || null}
                      onChange={(selected) => setPhaseCode(selected?.value || "")}
                      placeholder="All phases"
                      isClearable
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Terminal Status</Form.Label>
                    <SSRSelect
                      instanceId="is-terminal-select"
                      options={booleanOptions}
                      value={booleanOptions.find((option) => option.value === isTerminal) || null}
                      onChange={(selected) => setIsTerminal(selected?.value || "")}
                      placeholder="All"
                      isClearable
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Failure Status</Form.Label>
                    <SSRSelect
                      instanceId="is-failure-select"
                      options={booleanOptions}
                      value={booleanOptions.find((option) => option.value === isFailure) || null}
                      onChange={(selected) => setIsFailure(selected?.value || "")}
                      placeholder="All"
                      isClearable
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Order By</Form.Label>
                    <SSRSelect
                      instanceId="order-by-select"
                      options={orderByOptions}
                      value={orderByOptions.find((option) => option.value === orderBy) || null}
                      onChange={(selected) => setOrderBy(selected?.value || "SortOrder")}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Sort Direction</Form.Label>
                    <SSRSelect
                      instanceId="sort-dir-select"
                      options={sortDirOptions}
                      value={sortDirOptions.find((option) => option.value === sortDir) || null}
                      onChange={(selected) => setSortDir(selected?.value || "ASC")}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <div className="d-flex gap-2">
                <Button variant="primary" onClick={handleApplyFilters} disabled={loading}>
                  Apply Filters
                </Button>
                <Button variant="outline-secondary" onClick={handleResetFilters} disabled={loading}>
                  Reset
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="card table-list-card">
        <div className="card-body">
          <div className="table-responsive">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading order statuses...</p>
              </div>
            ) : (
              <Datatable
                columns={columns}
                dataSource={orderStatuses}
                rowKey="orderStatusID"
                expandable={expandable}
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: totalCount,
                  showSizeChanger: true,
                  pageSizeOptions: ['50', '100', '200', '500'],
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} order statuses`,
                  onChange: (page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                  },
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusesPage;
