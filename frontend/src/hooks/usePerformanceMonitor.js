import { useEffect, useRef } from 'react';

export const usePerformanceMonitor = componentName => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current++;
    const currentTime = performance.now();
    const renderDuration = currentTime - lastRenderTime.current;

    console.log(
      `${componentName} rendered in ${renderDuration.toFixed(2)}ms (render #${renderCount.current})`
    );

    lastRenderTime.current = currentTime;
  });

  // Monitor WebSocket performance
  useEffect(() => {
    const measureWebSocketLatency = () => {
      const start = performance.now();
      // Measure WebSocket round-trip time
      return () => {
        const latency = performance.now() - start;
        if (latency > 1000) {
          console.warn(`High WebSocket latency: ${latency.toFixed(2)}ms`);
        }
      };
    };
  }, []);
};
