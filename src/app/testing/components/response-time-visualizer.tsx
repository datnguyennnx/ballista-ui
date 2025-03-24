import { cn } from "@/lib/utils";

interface ResponseTimeVisualizerProps {
  avgResponseTime: number;
  thresholds: {
    warning: number;
    critical: number;
  };
  className?: string;
}

export function ResponseTimeVisualizer({
  avgResponseTime,
  thresholds,
  className,
}: ResponseTimeVisualizerProps) {
  // Calculate marker positions
  const warningPosition = Math.min(100, (thresholds.warning / thresholds.critical) * 100);
  const criticalPosition = 100;

  // Calculate current value position as percentage of critical threshold
  const valuePosition = Math.min(100, (avgResponseTime / thresholds.critical) * 100);

  // Determine which zone the current value falls into
  const isGood = avgResponseTime < thresholds.warning;
  const isWarning = avgResponseTime >= thresholds.warning && avgResponseTime < thresholds.critical;
  const isCritical = avgResponseTime >= thresholds.critical;

  return (
    <div className={cn("relative", className)}>
      {/* Base track */}
      <div className="bg-muted relative h-full w-full overflow-hidden rounded-full">
        {/* Color gradient track */}
        <div className="absolute top-0 left-0 h-full w-full rounded-full">
          <div
            className="bg-chart-2 absolute top-0 left-0 h-full"
            style={{ width: `${warningPosition}%` }}
          />
          <div
            className="bg-chart-1 absolute top-0 h-full"
            style={{
              left: `${warningPosition}%`,
              width: `${criticalPosition - warningPosition}%`,
            }}
          />
          {isCritical && (
            <div
              className="bg-chart-1 absolute top-0 right-0 h-full"
              style={{ width: `${Math.min(100 - criticalPosition, 100)}%` }}
            />
          )}
        </div>

        {/* Current value marker */}
        <div
          className={cn(
            "border-background absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-sm transition-all duration-300",
            isGood ? "bg-chart-2" : isWarning ? "bg-chart-1" : "bg-chart-5",
          )}
          style={{ left: `${valuePosition}%` }}
        />

        {/* Threshold markers */}
        <div
          className="bg-background/80 absolute top-1/2 h-3 w-0.5 -translate-y-1/2"
          style={{ left: `${warningPosition}%` }}
        />
        <div
          className="bg-background/80 absolute top-1/2 h-3 w-0.5 -translate-y-1/2"
          style={{ left: `${criticalPosition}%` }}
        />
      </div>
    </div>
  );
}
