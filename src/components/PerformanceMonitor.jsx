'use client'

import { useEffect } from 'react'

const PerformanceMonitor = () => {
  useEffect(() => {
    // Monitor navigation performance
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navigationEntry = entry;
          console.log('Navigation Performance:', {
            domContentLoaded: navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart,
            loadComplete: navigationEntry.loadEventEnd - navigationEntry.loadEventStart,
            totalTime: navigationEntry.loadEventEnd - navigationEntry.fetchStart
          });
        }
      });
    });
    
    observer.observe({ entryTypes: ['navigation'] });

    // Monitor largest contentful paint
    const lcpObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        console.log('Largest Contentful Paint:', entry.startTime);
      });
    });
    
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    return () => {
      observer.disconnect();
      lcpObserver.disconnect();
    };
  }, []);

  return null;
};

export default PerformanceMonitor;
