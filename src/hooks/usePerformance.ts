import { useEffect, useState, useRef } from "react";

export interface PerformanceMetrics {
  fps: number;
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  longTasks: number;
  domNodes: number;
}

export function usePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    longTasks: 0,
    domNodes: 0,
  });

  const framesRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const longTasksRef = useRef(0);

  useEffect(() => {
    // FPS Tracking
    let rafId: number;
    const trackFps = () => {
      framesRef.current++;
      const now = performance.now();
      const delta = now - lastTimeRef.current;

      if (delta >= 1000) {
        const currentFps = Math.round((framesRef.current * 1000) / delta);
        
        // Memory Tracking (Chrome only)
        const memory = (performance as any).memory;
        
        setMetrics(prev => ({
          ...prev,
          fps: currentFps,
          memoryUsage: memory ? {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
          } : undefined,
          domNodes: document.getElementsByTagName("*").length,
          longTasks: longTasksRef.current,
        }));

        framesRef.current = 0;
        lastTimeRef.current = now;
      }
      rafId = requestAnimationFrame(trackFps);
    };

    rafId = requestAnimationFrame(trackFps);

    // Long Tasks Tracking
    const observer = new PerformanceObserver((list) => {
      longTasksRef.current += list.getEntries().length;
    });

    try {
      observer.observe({ entryTypes: ["longtask"] });
    } catch (e) {
      console.warn("PerformanceObserver longtask not supported");
    }

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  return metrics;
}
