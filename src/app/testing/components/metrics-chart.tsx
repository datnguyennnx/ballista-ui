import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  TooltipProps,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
} from "recharts";
import { format } from "date-fns";
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
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
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

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function MetricsChart({
  data,
  dataKey,
  label,
  colorIndex = 1, // Default to first chart color
  formatValue = (value) => `${value}`,
  refreshInterval = 1000,
  showMiniStats = true,
  thresholds,
}: MetricsChartProps) {
  const [chartData, setChartData] = useState<TimeSeriesPoint[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const [latestValue, setLatestValue] = useState<number | null>(null);
  const [min, setMin] = useState<number>(0);
  const [max, setMax] = useState<number>(0);
  const [avg, setAvg] = useState<number>(0);

  // Use CSS variables for chart colors, falling back to --chart-1 if not specified
  const color = `var(--chart-${colorIndex})`;

  // Keep track of first data update
  const isFirstDataRef = useRef(true);

  // Safely calculate current value
  const safeCurrentValue = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Number(chartData[chartData.length - 1][dataKey]) || 0;
  }, [chartData, dataKey]);

  // Update chart data
  useEffect(() => {
    if (data.length === 0) return;

    // On initial update, just set the data
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setChartData(data);

      // Update min, max, avg statistics if we have data
      if (data.length > 0) {
        const values = data.map((d) => Number(d[dataKey]) || 0);
        const newMin = Math.min(...values);
        const newMax = Math.max(...values);
        const newAvg = values.reduce((sum, val) => sum + val, 0) / values.length;

        setMin(newMin);
        setMax(newMax);
        setAvg(newAvg);

        // Update latest value
        const latest = data[data.length - 1][dataKey] as number;
        setLatestValue(latest);
      }

      return;
    }

    // Sort data by timestamp
    const sortedData = [...data].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    setChartData(sortedData);

    // Update min, max, avg statistics if we have data
    if (sortedData.length > 0) {
      const values = sortedData.map((d) => Number(d[dataKey]) || 0);
      const newMin = Math.min(...values);
      const newMax = Math.max(...values);
      const newAvg = values.reduce((sum, val) => sum + val, 0) / values.length;

      // Smooth transitions for statistics
      setMin((prev) => (isFirstDataRef.current ? newMin : prev * 0.7 + newMin * 0.3));
      setMax((prev) => (isFirstDataRef.current ? newMax : prev * 0.7 + newMax * 0.3));
      setAvg((prev) => (isFirstDataRef.current ? newAvg : prev * 0.7 + newAvg * 0.3));

      // Update latest value with smooth transition
      const latest = sortedData[sortedData.length - 1][dataKey] as number;
      setLatestValue(latest);

      isFirstDataRef.current = false;
    }

    setLastUpdateTime(Date.now());
  }, [data, dataKey, safeCurrentValue]);

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
        setLastUpdateTime(Date.now());
      }, refreshInterval);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [refreshInterval, isHovering, chartData.length]);

  // Format the timestamp for display
  const formatTimestamp = (timestamp: number | string) => {
    return format(new Date(timestamp), "HH:mm:ss");
  };

  // Format relative time since last update
  const formatLastUpdateTime = useCallback(() => {
    const seconds = Math.floor((Date.now() - lastUpdateTime) / 1000);
    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  }, [lastUpdateTime]);

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

    const currentValue = latestValue ?? 0;

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

  // Custom tooltip component for better performance
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as TimeSeriesPoint;
      const value = Number(dataPoint[dataKey] || 0);
      const timestamp = dataPoint.timestamp;
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
          <p className="text-card-foreground text-xs font-medium">
            <ClockIcon className="mr-1 inline h-3 w-3" />
            {formattedTime}
          </p>
          <p className="text-card-foreground flex items-center justify-between gap-2 text-xs">
            <span>{label}:</span>
            <span className="font-medium" style={{ color }}>
              {formatValue(value)}
            </span>
          </p>
          <div
            className={`flex items-center justify-between rounded-sm px-1.5 py-0.5 text-xs ${statusBgClass}`}
            style={{ color: statusColor }}
          >
            <span className="font-medium">Status:</span>
            <span>{status}</span>
          </div>
        </Card>
      );
    }
    return null;
  };

  // Dynamic min/max to make chart more responsive
  const dynamicDomain = useMemo(() => {
    if (displayData.length === 0) return [0, 10];
    const values = displayData.map((d) => Number(d[dataKey] || 0));
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const padding = Math.max(0.1, (maxVal - minVal) * 0.1);
    return [Math.max(0, minVal - padding), maxVal + padding];
  }, [displayData, dataKey]);

  return (
    <div className="flex h-full flex-col rounded-md">
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="text-lg font-medium">{label}</h3>
      </div>

      {showMiniStats && (
        <div className="mb-3 flex gap-4 text-sm">
          <div>
            <span className="text-neutral-500">Min: </span>
            <span className="font-medium">{formatValue(min)}</span>
          </div>
          <div>
            <span className="text-neutral-500">Avg: </span>
            <span className="font-medium">{formatValue(avg)}</span>
          </div>
          <div>
            <span className="text-neutral-500">Max: </span>
            <span className="font-medium">{formatValue(max)}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {getConnectivityIndicator()}
            {getStatusIndicator()}
          </div>
        </div>
      )}

      <div
        className="relative flex-1"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {chartData.length > 0 && !isDataStale && (
          <div className="bg-card/80 absolute top-0 right-0 z-10 m-2 flex items-center gap-1 rounded-md px-2 py-1 text-xs shadow-sm backdrop-blur-sm">
            <ActivityIcon className="text-chart-3 h-3 w-3 animate-pulse" />
            <ClockIcon className="text-muted-foreground h-3 w-3" />
            <span className="text-muted-foreground">{formatLastUpdateTime()}</span>
          </div>
        )}

        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={displayData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              minTickGap={15}
              stroke="var(--border)"
              opacity={0.7}
              height={35}
            />
            <YAxis
              domain={dynamicDomain}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickFormatter={(val) => formatValue(val)}
              width={40}
              stroke="var(--border)"
              opacity={0.7}
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

            <ChartTooltip cursor={false} content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey={dataKey as string}
              fill="var(--color-desktop)"
              fillOpacity={0.3}
              stroke="var(--color-desktop)"
              animationDuration={0}
              isAnimationActive={false}
              connectNulls={true}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
}
