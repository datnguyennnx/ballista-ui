import { useEffect, useState, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
} from "recharts";
import { TimeSeriesPoint } from "../types/time-series";
import { Card } from "@/components/ui/card";
import {
  ActivityIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  WifiIcon,
  WifiOffIcon,
  ClockIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MetricsChartProps {
  data: TimeSeriesPoint[];
  dataKey: keyof TimeSeriesPoint;
  label: string;
  colorIndex?: 1 | 2 | 3 | 4 | 5; // Allow selection of theme colors
  height?: number;
  formatValue?: (value: number) => string;
  refreshInterval?: number;
  showMiniStats?: boolean;
  thresholds?: {
    warning?: number;
    critical?: number;
  };
}

export function MetricsChart({
  data,
  dataKey,
  label,
  colorIndex = 1, // Default to first chart color
  height = 300,
  formatValue = (value) => `${value}`,
  refreshInterval = 1000,
  showMiniStats = true,
  thresholds,
}: MetricsChartProps) {
  const [chartData, setChartData] = useState<TimeSeriesPoint[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  // Use CSS variables for chart colors, falling back to --chart-1 if not specified
  const color = `var(--chart-${colorIndex})`;

  // Safely calculate current value
  const safeCurrentValue = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Number(chartData[chartData.length - 1][dataKey]) || 0;
  }, [chartData, dataKey]);

  // Calculate stats from data
  const stats = useMemo(() => {
    if (chartData.length === 0) return { current: 0, min: 0, max: 0, avg: 0, trend: 0 };

    const values = chartData.map((item) => Number(item[dataKey]) || 0);
    const sum = values.reduce((acc, val) => acc + val, 0);

    const current = values[values.length - 1];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = sum / values.length;
    const trend = previousValue !== null ? current - previousValue : 0;

    return {
      current,
      min,
      max,
      avg: avg.toFixed(2),
      trend,
    };
  }, [chartData, dataKey, previousValue]);

  // Update chart data
  useEffect(() => {
    if (data.length === 0) return;

    // On initial update, just set the data
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setChartData(data);
      return;
    }

    // Store previous value for trend calculation
    setPreviousValue(safeCurrentValue);
    setChartData(data);
    setLastUpdateTime(Date.now());
  }, [data, safeCurrentValue]);

  // Handle refresh interval
  useEffect(() => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    // Only set a timer if we have data and are not hovering
    if (refreshInterval && refreshInterval > 0 && !isHovering && chartData.length > 0) {
      refreshTimerRef.current = setInterval(() => {
        // Trigger a re-render without changing the state
        // This is safe and won't cause an infinite loop
        const currentData = [...chartData];
        setChartData(currentData);
      }, refreshInterval);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [refreshInterval, isHovering, chartData.length, chartData]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Format relative time since last update
  const formatLastUpdateTime = () => {
    const seconds = Math.floor((Date.now() - lastUpdateTime) / 1000);
    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  // Create empty data if no data is provided to ensure chart and legend always show
  const displayData = useMemo(() => {
    return chartData.length > 0
      ? chartData
      : [
          {
            timestamp: Date.now(),
            responseTime: 0,
            requestsPerSecond: 0,
            errorRate: 0,
          },
        ];
  }, [chartData]);

  // Get status indicator
  const getStatusIndicator = () => {
    if (!thresholds || chartData.length === 0) {
      return (
        <Badge variant="outline" className="badge-disconnected flex items-center gap-1.5">
          <WifiOffIcon className="h-3 w-3" />
          <span>No data</span>
        </Badge>
      );
    }

    const currentValue = stats.current;

    if (thresholds.critical !== undefined && currentValue >= thresholds.critical) {
      return (
        <Badge className="badge-critical flex items-center gap-1.5">
          <AlertCircleIcon className="h-3 w-3" />
          <span>Critical</span>
        </Badge>
      );
    }

    if (thresholds.warning !== undefined && currentValue >= thresholds.warning) {
      return (
        <Badge className="badge-warning flex items-center gap-1.5">
          <AlertCircleIcon className="h-3 w-3" />
          <span>Warning</span>
        </Badge>
      );
    }

    return (
      <Badge className="badge-good flex items-center gap-1.5">
        <CheckCircleIcon className="h-3 w-3" />
        <span>Good</span>
      </Badge>
    );
  };

  // Check if data is stale (no updates in the last 10 seconds)
  const isDataStale = Date.now() - lastUpdateTime > 10000;

  // Get connectivity indicator
  const getConnectivityIndicator = () => {
    if (chartData.length === 0) {
      return (
        <Badge className="badge-disconnected flex items-center gap-1.5">
          <WifiOffIcon className="h-3 w-3" />
          <span>Disconnected</span>
        </Badge>
      );
    }

    if (isDataStale) {
      return (
        <Badge className="badge-stale flex items-center gap-1.5">
          <WifiOffIcon className="h-3 w-3" />
          <span>Stale ({formatLastUpdateTime()})</span>
        </Badge>
      );
    }

    return (
      <Badge className="badge-live flex items-center gap-1.5">
        <div className="relative">
          <WifiIcon className="h-3 w-3" />
          <span className="bg-chart-3 absolute -top-1 -right-1 h-1.5 w-1.5 animate-ping rounded-full"></span>
        </div>
        <span>Live</span>
      </Badge>
    );
  };

  // Container style
  const containerStyle = { height: `${height}px` };

  return (
    <div className="w-full rounded-md" style={containerStyle}>
      {showMiniStats && (
        <div className="flex h-8 items-center justify-between">
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div>
                <span className="text-muted-foreground">Min: </span>
                <span className="font-medium">{formatValue(stats.min)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Avg: </span>
                <span className="font-medium">{formatValue(Number(stats.avg))}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Max: </span>
                <span className="font-medium">{formatValue(stats.max)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getConnectivityIndicator()}
            {getStatusIndicator()}
          </div>
        </div>
      )}

      <div
        className="relative h-[calc(100%-32px)] w-full"
        style={{ height: showMiniStats ? `calc(100% - 32px)` : "100%" }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        tabIndex={0}
      >
        {chartData.length > 0 && !isDataStale && (
          <div className="bg-card/80 absolute top-0 right-0 z-10 m-2 flex items-center gap-1 rounded-md px-2 py-1 text-xs shadow-sm backdrop-blur-sm">
            <ActivityIcon className="text-chart-3 h-3 w-3 animate-pulse" />
            <ClockIcon className="text-muted-foreground h-3 w-3" />
            <span className="text-muted-foreground">{formatLastUpdateTime()}</span>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickMargin={10}
              stroke="var(--border)"
              opacity={0.7}
              height={35}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickMargin={10}
              stroke="var(--border)"
              opacity={0.7}
              width={45}
              padding={{ top: 20, bottom: 20 }}
            />

            {/* Add threshold areas */}
            {thresholds?.warning && thresholds?.critical && (
              <ReferenceArea
                y1={thresholds.warning}
                y2={thresholds.critical}
                fill="var(--chart-4)"
                fillOpacity={0.1}
              />
            )}

            {thresholds?.critical && (
              <ReferenceArea
                y1={thresholds.critical}
                y2={Infinity}
                fill="var(--chart-5)"
                fillOpacity={0.1}
              />
            )}

            {/* Add threshold lines */}
            {thresholds?.warning && (
              <ReferenceLine
                y={thresholds.warning}
                stroke="var(--chart-4)"
                strokeDasharray="3 3"
                strokeOpacity={0.8}
                label={{
                  value: "Warning",
                  position: "insideBottomRight",
                  fill: "var(--chart-4)",
                  fontSize: 10,
                }}
              />
            )}

            {thresholds?.critical && (
              <ReferenceLine
                y={thresholds.critical}
                stroke="var(--chart-5)"
                strokeDasharray="3 3"
                strokeOpacity={0.8}
                label={{
                  value: "Critical",
                  position: "insideBottomRight",
                  fill: "var(--chart-5)",
                  fontSize: 10,
                }}
              />
            )}

            {/* Add latest data point marker */}
            {chartData.length > 0 && !isHovering && (
              <ReferenceDot
                x={chartData[chartData.length - 1].timestamp}
                y={Number(chartData[chartData.length - 1][dataKey])}
                r={4}
                fill={color}
                stroke="var(--background)"
                strokeWidth={2}
                isFront={true}
              />
            )}

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const value = Number(payload[0].value || 0);
                  const timestamp = payload[0].payload.timestamp;
                  const formattedTime = formatTimestamp(timestamp);

                  // Determine status for this specific data point
                  let status = "Good";
                  let statusColor = "var(--chart-3)"; // Green color
                  let statusBgClass = "bg-chart-3/10";

                  if (thresholds?.critical !== undefined && value >= thresholds.critical) {
                    status = "Critical";
                    statusColor = "var(--chart-5)"; // Red color
                    statusBgClass = "bg-chart-5/10";
                  } else if (thresholds?.warning !== undefined && value >= thresholds.warning) {
                    status = "Warning";
                    statusColor = "var(--chart-4)"; // Yellow/Orange color
                    statusBgClass = "bg-chart-4/10";
                  }

                  return (
                    <Card className="border-border/30 bg-card/95 min-w-[180px] px-3 py-2 shadow-md backdrop-blur-sm">
                      <p className="text-card-foreground mb-2 text-xs font-medium">
                        <ClockIcon className="mr-1 mb-0.5 inline h-3 w-3" />
                        {formattedTime}
                      </p>
                      <p className="text-card-foreground flex items-center justify-between gap-2 text-xs">
                        <span>{label}:</span>
                        <span className="font-medium" style={{ color }}>
                          {typeof value === "number" ? formatValue(value) : value}
                        </span>
                      </p>
                      <div
                        className={`mt-1 flex items-center justify-between rounded-sm px-1.5 py-0.5 text-xs ${statusBgClass}`}
                        style={{ color: statusColor }}
                      >
                        <span className="font-medium">Status:</span>
                        <span>{status}</span>
                      </div>
                    </Card>
                  );
                }
                return null;
              }}
            />

            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--background)" }}
              isAnimationActive={true}
              animationDuration={200}
              name={label}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
