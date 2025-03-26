import { TestMetrics } from "@/types/index";
import { MetricCard } from "./metric-card";
import { ResponseTimeVisualizer } from "./response-time-visualizer";
import { StatusCodeIndicator } from "./status-code-indicator";
import { Badge } from "@/components/ui/badge";
import { ActivityIcon, CheckCircleIcon, AlertCircleIcon } from "lucide-react";
import { NumberTicker } from "@/components/magicui/number-ticker";

interface MetricCardsProps {
  metrics: TestMetrics;
  isRunning: boolean;
}

// Helper function to get status color based on thresholds
function getStatusColor(value: number, thresholds: { warning?: number; critical?: number }) {
  if (thresholds.critical !== undefined && value >= thresholds.critical) {
    return "text-chart-1";
  }
  if (thresholds.warning !== undefined && value >= thresholds.warning) {
    return "text-chart-3";
  }
  return "text-chart-2";
}

export function MetricCards({ metrics, isRunning }: MetricCardsProps) {
  // Constants for response time thresholds
  const responseTimeThresholds = { warning: 100, critical: 200 };
  const errorThresholds = { warning: 5, critical: 10 };

  // Calculate completion percentage
  const completionPercentage =
    metrics.total_requests > 0
      ? ((metrics.requests_completed / metrics.total_requests) * 100).toFixed(1)
      : "0.0";

  // Calculate errors from error rate
  const errors = Math.round((metrics.error_rate / 100) * metrics.requests_completed);

  // Get response time status color
  const responseTimeStatusColor =
    metrics.average_response_time !== undefined
      ? getStatusColor(metrics.average_response_time, responseTimeThresholds)
      : undefined;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Requests card */}
      <MetricCard
        title="Requests"
        value={
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-semibold">
              <NumberTicker value={metrics.requests_completed} />
            </span>
            <span className="text-muted-foreground text-sm">
              / <NumberTicker value={metrics.total_requests} />
            </span>
          </div>
        }
        additionalContent={
          <div className="mt-2 space-y-3">
            <p className="text-muted-foreground text-sm">
              <NumberTicker value={parseFloat(completionPercentage)} decimalPlaces={1} />% complete
            </p>
            <div className="bg-muted/20 h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-chart-2 h-full rounded-full transition-all duration-100"
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
                {metrics.total_requests - metrics.requests_completed > 0 ? (
                  <>
                    <NumberTicker value={metrics.total_requests - metrics.requests_completed} />{" "}
                    remaining
                  </>
                ) : (
                  "All requests completed"
                )}
              </span>
            </div>
          </div>
        }
      />

      {/* Response Time card */}
      <MetricCard
        title="Avg. Response Time"
        value={<NumberTicker value={metrics.average_response_time ?? 0} decimalPlaces={2} />}
        statusColor={responseTimeStatusColor}
        description={
          metrics.min_response_time !== undefined && metrics.max_response_time !== undefined ? (
            <>
              Min: <NumberTicker value={metrics.min_response_time} decimalPlaces={1} />
              ms / Max: <NumberTicker value={metrics.max_response_time} decimalPlaces={1} />
              ms
            </>
          ) : (
            "No min/max data available"
          )
        }
        additionalContent={
          <div className="mt-2 space-y-2">
            <ResponseTimeVisualizer
              avgResponseTime={metrics.average_response_time ?? 0}
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
          Object.entries(metrics.status_codes || {}).length > 0 ? (
            <NumberTicker value={Object.entries(metrics.status_codes || {}).length} />
          ) : (
            "None"
          )
        }
        additionalContent={
          <div className="mt-1">
            <StatusCodeIndicator
              statusCodes={metrics.status_codes || {}}
              totalRequests={metrics.requests_completed}
            />
          </div>
        }
      />

      {/* Errors card */}
      <MetricCard
        title="Errors"
        value={<NumberTicker value={errors} />}
        statusColor={getStatusColor(errors || 0, errorThresholds)}
        description={
          metrics.requests_completed > 0 ? (
            <>
              <NumberTicker value={metrics.error_rate} decimalPlaces={2} />% error rate
            </>
          ) : (
            "No requests completed"
          )
        }
        additionalContent={
          <div className="mt-2">
            {metrics.requests_completed > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={errors > 0 ? "destructive" : "outline"}
                    className="flex items-center gap-1 px-2 py-1 text-xs"
                  >
                    {errors > 0 ? (
                      <AlertCircleIcon className="h-3 w-3" />
                    ) : (
                      <CheckCircleIcon className="text-chart-1 h-3 w-3" />
                    )}
                    <span>
                      {errors > 0 ? (
                        <>
                          <NumberTicker value={errors} /> Errors
                        </>
                      ) : (
                        "No Errors"
                      )}
                    </span>
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    <NumberTicker value={metrics.error_rate} decimalPlaces={2} />% rate
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
