'use client';

import dynamic from 'next/dynamic';

// Dynamically import react-apexcharts with SSR disabled
const Chart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => <div className="chart-loading">Loading chart...</div>
});

export default Chart;
