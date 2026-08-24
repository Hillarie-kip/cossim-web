/**
 * Vendor Chart Component for Dashboard
 */

import React from 'react';
import { Card } from 'react-bootstrap';
import { BarChart3, TrendingUp, DollarSign, Package } from 'lucide-react';

const VendorChart = ({ chartData, loading }) => {
  if (loading) {
    return (
      <Card className="h-100">
        <Card.Header>
          <div className="d-flex align-items-center">
            <BarChart3 size={20} className="me-2 text-primary" />
            <h5 className="mb-0">Monthly Performance</h5>
          </div>
        </Card.Header>
        <Card.Body className="d-flex align-items-center justify-content-center">
          <div className="text-center text-muted">
            <div className="spinner-border spinner-border-sm mb-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div>Loading chart data...</div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="h-100">
        <Card.Header>
          <div className="d-flex align-items-center">
            <BarChart3 size={20} className="me-2 text-primary" />
            <h5 className="mb-0">Monthly Performance</h5>
          </div>
        </Card.Header>
        <Card.Body className="d-flex align-items-center justify-content-center">
          <div className="text-center text-muted">
            <TrendingUp size={48} className="mb-3 opacity-50" />
            <div>No chart data available</div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Process data for chart display
  const processDataForChart = (data) => {
    const groupedData = {};
    
    // Initialize all months to ensure they appear in order even if data is missing
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    monthOrder.forEach(month => {
      groupedData[month] = { month, Packages: 0, Revenue: 0 };
    });

    data.forEach(item => {
      const month = item.TransactionDate;
      if (groupedData[month]) {
        // Map "Packages" and "Revenue" from TransactionName
        if (item.TransactionName === 'Packages') {
          groupedData[month].Packages = Number(item.Value) || 0;
        } else if (item.TransactionName === 'Revenue') {
          groupedData[month].Revenue = Number(item.Value) || 0;
        }
      }
    });
    
    return monthOrder.map(month => groupedData[month]);
  };

  const processedData = processDataForChart(chartData);
  
  // Calculate max values for scaling, ensuring a minimum of 1 to avoid division by zero
  const maxPackages = Math.max(...processedData.map(d => d.Packages), 1);
  const maxRevenue = Math.max(...processedData.map(d => d.Revenue), 1);

  return (
    <Card className="h-100 shadow-sm border-0">
      <Card.Header className="bg-transparent border-0 pt-4 px-4">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <div className="icon-box bg-primary-light rounded-circle p-2 me-3">
              <BarChart3 size={20} className="text-primary" />
            </div>
            <div>
              <h5 className="mb-0 fw-bold">Performance Analytics</h5>
              <small className="text-muted">Monthly Revenue vs Package Volume</small>
            </div>
          </div>
          <div className="d-flex gap-3">
            <div className="d-flex align-items-center">
              <span className="dot bg-primary me-2"></span>
              <small className="fw-medium text-muted">Packages</small>
            </div>
            <div className="d-flex align-items-center">
              <span className="dot bg-warning me-2"></span>
              <small className="fw-medium text-muted">Revenue</small>
            </div>
          </div>
        </div>
      </Card.Header>
      <Card.Body className="p-4">
        <div className="chart-wrapper position-relative" style={{ height: '320px' }}>
          {/* Y-Axis Labels (Visual Guide) */}
          <div className="position-absolute h-100 d-flex flex-column justify-content-between text-muted small pe-2 border-end" style={{ left: 0, fontSize: '10px', width: '35px', zIndex: 1 }}>
            <span>{maxRevenue.toLocaleString()}</span>
            <span>{(maxRevenue / 2).toLocaleString()}</span>
            <span>0</span>
          </div>

          <div className="d-flex align-items-end h-100 ps-5 pb-4 overflow-auto custom-scrollbar">
            {processedData.map((item, index) => {
              const hasData = item.Packages > 0 || item.Revenue > 0;
              return (
                <div key={index} className="flex-fill d-flex flex-column align-items-center px-1" style={{ minWidth: '45px' }}>
                  <div className="d-flex align-items-end justify-content-center w-100 mb-2" style={{ height: '220px', gap: '4px' }}>
                    {/* Revenue Bar */}
                    <div 
                      className={`rounded-top position-relative chart-bar revenue-bar ${hasData ? 'bg-warning' : 'bg-light opacity-25'}`}
                      style={{ 
                        height: `${(item.Revenue / maxRevenue) * 100}%`,
                        minHeight: item.Revenue > 0 ? '4px' : '0px',
                        width: '12px',
                        transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      {item.Revenue > 0 && (
                        <div className="bar-tooltip position-absolute top-0 start-50 translate-middle-x mb-2 shadow-sm rounded px-2 py-1 bg-dark text-white" style={{ fontSize: '10px', marginTop: '-30px', whiteSpace: 'nowrap', zIndex: 10 }}>
                          KES {item.Revenue.toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Packages Bar */}
                    <div 
                      className={`rounded-top position-relative chart-bar package-bar ${hasData ? 'bg-primary' : 'bg-light opacity-25'}`}
                      style={{ 
                        height: `${(item.Packages / maxPackages) * 100}%`,
                        minHeight: item.Packages > 0 ? '4px' : '0px',
                        width: '12px',
                        transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      {item.Packages > 0 && (
                        <div className="bar-tooltip position-absolute top-0 start-50 translate-middle-x mb-2 shadow-sm rounded px-2 py-1 bg-dark text-white" style={{ fontSize: '10px', marginTop: '-30px', whiteSpace: 'nowrap', zIndex: 10 }}>
                          {item.Packages} Pkgs
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Month Label */}
                  <div className={`text-center fw-bold mt-2 ${hasData ? 'text-dark' : 'text-muted opacity-50'}`} style={{ fontSize: '11px' }}>
                    {item.month}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <style jsx>{`
          .chart-bar:hover {
            filter: brightness(1.1);
            z-index: 5;
          }
          .bar-tooltip {
            display: none;
          }
          .chart-bar:hover .bar-tooltip {
            display: block;
          }
          .bg-primary-light {
            background-color: rgba(40, 121, 243, 0.1);
          }
          .dot {
            height: 8px;
            width: 8px;
            border-radius: 50%;
            display: inline-block;
          }
          .custom-scrollbar::-webkit-scrollbar {
            height: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #e0e0e0;
            border-radius: 10px;
          }
        `}</style>
      </Card.Body>
    </Card>
  );
};

export default VendorChart;
