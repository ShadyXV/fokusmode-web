import { useState } from "react";
import { usePerformance } from "@/hooks/usePerformance";
import { Activity, Cpu, HardDrive, Layout, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DebugMonitor() {
  const metrics = usePerformance();
  const [isVisible, setIsVisible] = useState(false);

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50 rounded-full opacity-20 hover:opacity-100 transition-opacity"
        onClick={() => setIsVisible(true)}
      >
        <Activity className="h-4 w-4" />
      </Button>
    );
  }

  const formatMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1) + " MB";

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-64 glass p-4 shadow-2xl animate-in slide-in-from-right-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Activity className="h-3 w-3" /> System Performance
        </h3>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 rounded-full" 
          onClick={() => setIsVisible(false)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      <div className="space-y-3">
        {/* FPS */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cpu className="h-3.5 w-3.5" />
            <span>Frame Rate</span>
          </div>
          <span className={`text-sm font-mono ${metrics.fps < 30 ? "text-red-500" : metrics.fps < 55 ? "text-yellow-500" : "text-emerald-500"}`}>
            {metrics.fps} FPS
          </span>
        </div>

        {/* Memory */}
        {metrics.memoryUsage && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HardDrive className="h-3.5 w-3.5" />
              <span>JS Heap</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono">
                {formatMB(metrics.memoryUsage.usedJSHeapSize)}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                limit: {formatMB(metrics.memoryUsage.jsHeapSizeLimit)}
              </div>
            </div>
          </div>
        )}

        {/* DOM Nodes */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Layout className="h-3.5 w-3.5" />
            <span>DOM Nodes</span>
          </div>
          <span className="text-sm font-mono">
            {metrics.domNodes.toLocaleString()}
          </span>
        </div>

        {/* Long Tasks */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            <span>Blocking Tasks</span>
          </div>
          <span className={`text-sm font-mono ${metrics.longTasks > 0 ? "text-orange-500 font-bold" : "text-muted-foreground"}`}>
            {metrics.longTasks}
          </span>
        </div>
      </div>

      <div className="mt-4 text-[10px] text-muted-foreground italic leading-tight">
        Metrics are updated every second. Memory tracking is Chromium-only.
      </div>
    </Card>
  );
}
