'use client';

import { useReportWebVitals } from 'next/web-vitals';

export default function WebVitals() {
  useReportWebVitals((metric) => {
    // Log poor Web Vitals in development or when explicitly enabled
    const isPoor =
      (metric.name === 'LCP' && metric.value > 2500) ||
      (metric.name === 'INP' && metric.value > 200) ||
      (metric.name === 'CLS' && metric.value > 0.1);

    if (process.env.NODE_ENV !== 'production' || isPoor) {
      const label = `[WebVitals] ${metric.name}: ${Math.round(metric.value * 100) / 100}`;
      if (isPoor) {
        console.warn(`${label} (needs attention)`);
      }
    }
  });

  return null;
}
