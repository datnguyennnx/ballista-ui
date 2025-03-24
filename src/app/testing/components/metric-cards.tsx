import { TestMetrics } from "@/types/index";
import { MetricCard } from "./metric-card";
import { ResponseTimeVisualizer } from "./response-time-visualizer";
import { StatusCodeIndicator } from "./status-code-indicator";
import { Badge } from "@/components/ui/badge";
import { ActivityIcon, CheckCircleIcon, AlertCircleIcon } from "lucide-react";

interface MetricCardsProps {
  metrics: TestMetrics;
  isRunning: boolean;
}

// Helper function to get status color based on thresholds
function getStatusColor(value: number, thresholds: { warning?: number; critical?: number }) {
  if (thresholds.critical !== undefined && value >= thresholds.critical) {
    return "text-chart-2";
  }
  if (thresholds.warning !== undefined && value >= thresholds.warning) {
    return "text-chart-3";
  }
  return "text-chart-1";
}

export function MetricCards({ metrics, isRunning }: MetricCardsProps) {
  // Constants for response time thresholds
  const responseTimeThresholds = { warning: 100, critical: 200 };
  const errorThresholds = { warning: 5, critical: 10 };

  // Calculate completion percentage
  const completionPercentage = (
    (metrics.requests_completed / metrics.total_requests) *
    100
  ).toFixed(1);

  // Response time min/max text
  const responseTimeMinMax =
    metrics.min_response_time !== undefined && metrics.max_response_time !== undefined
      ? `Min: ${metrics.min_response_time.toFixed(1)}ms / Max: ${metrics.max_response_time.toFixed(1)}ms`
      : "No min/max data available";

  // Error rate text
  const errorRate =
    metrics.requests_completed > 0
      ? `${((metrics.errors / metrics.requests_completed) * 100).toFixed(2)}% error rate`
      : "No requests completed";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Requests card */}
      <MetricCard
        title="Requests"
        value={
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-semibold">{metrics.requests_completed}</span>
            <span className="text-muted-foreground text-sm">/ {metrics.total_requests}</span>
          </div>
        }
        additionalContent={
          <div className="mt-2 space-y-3">
            <p className="text-muted-foreground text-sm">{completionPercentage}% complete</p>
            <div className="bg-muted/20 h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-chart-2 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              {isRunning ? (
                <div className="flex items-center gap-1.5">
                  <ActivityIcon className="text-chart-2 h-3.5 w-3.5" />
                  <span className="text-chart-2 text-sm font-medium">Running</span>
                </div>
              ) : (
                <div className="bg-chart-2/10 text-chart-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs">
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  <span>Completed</span>
                </div>
              )}
              <span className="text-muted-foreground text-sm">
                {metrics.total_requests - metrics.requests_completed > 0
                  ? `${metrics.total_requests - metrics.requests_completed} remaining`
                  : "All requests completed"}
              </span>
            </div>
          </div>
        }
      />

      {/* Response Time card */}
      <MetricCard
        title="Avg. Response Time"
        value={`${metrics.avg_response_time.toFixed(2)}ms`}
        statusColor={getStatusColor(metrics.avg_response_time, responseTimeThresholds)}
        description={responseTimeMinMax}
        additionalContent={
          <div className="mt-2 space-y-2">
            <ResponseTimeVisualizer
              avgResponseTime={metrics.avg_response_time}
              thresholds={responseTimeThresholds}
              className="h-2"
            />
            <div className="flex items-center justify-between text-xs">
              <p className="text-chart-2 font-extrabold">Fast</p>
              <p className="font-extrabold">Medium</p>
              <p className="text-chart-1 font-extrabold">Slow</p>
            </div>
          </div>
        }
      />

      {/* Status Codes card */}
      <MetricCard
        title="Status Codes"
        value={
          Object.entries(metrics.status_codes).length > 0
            ? `${Object.entries(metrics.status_codes).length} types`
            : "None"
        }
        additionalContent={
          <div className="mt-1">
            <StatusCodeIndicator
              statusCodes={metrics.status_codes}
              totalRequests={metrics.requests_completed}
            />
          </div>
        }
      />

      {/* Errors card */}
      <MetricCard
        title="Errors"
        value={metrics.errors}
        statusColor={getStatusColor(metrics.errors, errorThresholds)}
        description={errorRate}
        additionalContent={
          <div className="mt-2">
            {metrics.requests_completed > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={metrics.errors > 0 ? "destructive" : "outline"}
                    className="flex items-center gap-1 px-2 py-1 text-xs"
                  >
                    {metrics.errors > 0 ? (
                      <AlertCircleIcon className="h-3 w-3" />
                    ) : (
                      <CheckCircleIcon className="text-chart-1 h-3 w-3" />
                    )}
                    <span>{metrics.errors > 0 ? `${metrics.errors} Errors` : "No Errors"}</span>
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {((metrics.errors / metrics.requests_completed) * 100).toFixed(2)}% rate
                  </span>
                </div>
              </div>
            )}
          </div>
        }
      />
    </div>
  );
}
