/**
 * Enhanced Chart Component for DC Dashboard using ApexCharts
 */

import React from 'react';
import { Card } from 'react-bootstrap';
import { BarChart3, TrendingUp } from 'lucide-react';
import Chart from "../ClientChart";

const DCChart = ({ chartData, loading }) => {
  if (loading) {
    return (
      <Card className="h-100 shadow-sm border-0">
        <Card.Header className="bg-white border-0 pt-4 px-4">
          <div className="d-flex align-items-center">
            <BarChart3 size={20} className="me-2 text-primary" />
            <h5 className="mb-0 fw-bold">Package Processing Trends</h5>
          </div>
        </Card.Header>
        <Card.Body className="d-flex align-items-center justify-content-center" style={{ height: '350px' }}>
          <div className="text-center text-muted">
            <div className="spinner-border text-primary mb-2" role="status">
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
      <Card className="h-100 shadow-sm border-0">
        <Card.Header className="bg-white border-0 pt-4 px-4">
          <div className="d-flex align-items-center">
            <BarChart3 size={20} className="me-2 text-primary" />
            <h5 className="mb-0 fw-bold">Package Processing Trends</h5>
          </div>
        </Card.Header>
        <Card.Body className="d-flex align-items-center justify-content-center" style={{ height: '350px' }}>
          <div className="text-center text-muted">
            <TrendingUp size={48} className="mb-3 opacity-25" />
            <div className="fw-medium">No chart data available</div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Process data for ApexCharts
  const processDataForChart = (data) => {
    const groupedData = {};
    
    // Sort by date first to ensure chronological order
    const sortedData = [...data].sort((a, b) => new Date(a.TransactionDate) - new Date(b.TransactionDate));
    
    sortedData.forEach(item => {
      const date = new Date(item.TransactionDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      if (!groupedData[date]) {
        groupedData[date] = { date, Completed: 0, Processing: 0 };
      }
      if (item.TransactionName === 'Completed') {
        groupedData[date].Completed = item.Value;
      } else if (item.TransactionName === 'Processing') {
        groupedData[date].Processing = item.Value;
      }
    });
    
    const finalData = Object.values(groupedData).slice(-10); // Last 10 days
    return {
      categories: finalData.map(d => d.date),
      completed: finalData.map(d => d.Completed),
      processing: finalData.map(d => d.Processing)
    };
  };

  const { categories, completed, processing } = processDataForChart(chartData);

  const options = {
    chart: {
      type: 'bar',
      height: 350,
      stacked: false,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    colors: ['#28C76F', '#FF9F43'], // Green for Completed, Orange for Processing
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4,
        borderRadiusApplication: 'end',
      },
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: categories,
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      title: {
        text: 'Packages',
        style: {
          color: '#6e6b7b',
          fontWeight: 500
        }
      },
      labels: {
        formatter: function (val) {
          return val.toFixed(0);
        }
      }
    },
    fill: {
      opacity: 1
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " packages"
        }
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      offsetY: -10
    },
    grid: {
      borderColor: '#f1f1f1',
    }
  };

  const series = [
    {
      name: 'Completed',
      data: completed
    },
    {
      name: 'Processing',
      data: processing
    }
  ];

  return (
    <Card className="h-100 shadow-sm border-0">
      <Card.Header className="bg-white border-0 pt-4 px-4 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <BarChart3 size={20} className="me-2 text-primary" />
          <h5 className="mb-0 fw-bold">Package Processing Trends</h5>
        </div>
        <small className="text-muted fw-medium">Last 10 days</small>
      </Card.Header>
      <Card.Body className="p-0 px-2 pb-2">
        <Chart
          options={options}
          series={series}
          type="bar"
          height={350}
        />
      </Card.Body>
    </Card>
  );
};

export default DCChart;
