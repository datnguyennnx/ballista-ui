"use client";

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
  Tooltip,
} from "recharts";
import { format } from "date-fns";
import { TimeSeriesPoint } from "../types/time-series";
import { Card } from "@/components/ui/card";
import { ClockIcon } from "lucide-react";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";

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
  isFullscreen?: boolean;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-primary)",
  },
} satisfies ChartConfig;

// Memoized tooltip component for better performance
const CustomTooltip = React.memo(
  ({
    active,
    payload,
    dataKey,
    label,
    formatValue,
    thresholds,
  }: TooltipProps<number, string> & {
    dataKey: keyof TimeSeriesPoint;
    label: string;
    formatValue: (value: number) => string;
    thresholds?: MetricsChartProps["thresholds"];
  }) => {
    const status = useMemo(() => {
      if (!active || !payload?.length) return null;

      const dataPoint = payload[0].payload as TimeSeriesPoint;
      const value = Number(dataPoint[dataKey] || 0);

      if (thresholds?.critical !== undefined && value >= thresholds.critical) {
        return { text: "Critical", color: "var(--chart-5)", bgClass: "bg-chart-5/10" };
      }
      if (thresholds?.warning !== undefined && value >= thresholds.warning) {
        return { text: "Warning", color: "var(--chart-4)", bgClass: "bg-chart-4/10" };
      }
      return { text: "Good", color: "var(--chart-3)", bgClass: "bg-chart-3/10" };
    }, [active, payload, dataKey, thresholds]);

    if (!active || !payload?.length || !status) return null;

    const dataPoint = payload[0].payload as TimeSeriesPoint;
    const value = Number(dataPoint[dataKey] || 0);
    const timestamp = dataPoint.timestamp;
    const formattedTime = format(new Date(timestamp), "HH:mm:ss");

    return (
      <Card className="border-border/30 bg-card/95 min-w-[180px] px-3 py-2 shadow-md backdrop-blur-sm">
        <p className="text-card-foreground text-xs font-medium">
          <ClockIcon className="mr-1 inline h-3 w-3" />
          {formattedTime}
        </p>
        <p className="text-card-foreground flex items-center justify-between gap-2 text-xs">
          <span>{label}:</span>
          <span className="font-medium" style={{ color: `var(--chart-${dataKey})` }}>
            {formatValue(value)}
          </span>
        </p>
        <div
          className={`flex items-center justify-between rounded-sm px-1.5 py-0.5 text-xs ${status.bgClass}`}
          style={{ color: status.color }}
        >
          <span className="font-medium">Status:</span>
          <span>{status.text}</span>
        </div>
      </Card>
    );
  },
);

CustomTooltip.displayName = "CustomTooltip";

export function MetricsChart({
  data,
  dataKey,
  label,
  colorIndex = 1,
  formatValue = (value) => `${value}`,
  refreshInterval = 1000,
  showMiniStats = true,
  thresholds,
  isFullscreen = false,
  onFullscreenChange,
}: MetricsChartProps) {
  const [chartData, setChartData] = useState<TimeSeriesPoint[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [stats, setStats] = useState({ min: 0, max: 0, avg: 0 });

  const color = useMemo(() => `var(--chart-${colorIndex})`, [colorIndex]);

  // Update chart data and stats when props data changes
  useEffect(() => {
    if (data?.length > 0) {
      setChartData(data);
      const values = data.map((d) => Number(d[dataKey] || 0));
      setStats({
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
      });
    }
  }, [data, dataKey]);

  // Handle refresh interval
  useEffect(() => {
    const timer = refreshTimerRef.current;
    if (timer) {
      clearInterval(timer);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [refreshInterval, isHovering, chartData.length]);

  const formatTimestamp = useCallback((timestamp: number | string) => {
    return format(new Date(timestamp), "HH:mm:ss");
  }, []);

  const displayData = useMemo(() => {
    return chartData.length > 0
      ? chartData
      : [
          {
            timestamp: Date.now(),
            requests_per_second: 0,
            average_response_time: 0,
            error_rate: 0,
          },
        ];
  }, [chartData]);

  const dynamicDomain = useMemo(() => {
    if (displayData.length === 0) return [0, 10];
    const values = displayData.map((d) => Number(d[dataKey] || 0));
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const padding = Math.max(0.1, (maxVal - minVal) * 0.1);
    return [Math.max(0, minVal - padding), maxVal + padding];
  }, [displayData, dataKey]);

  const handleFullscreenToggle = useCallback(() => {
    onFullscreenChange?.(!isFullscreen);
  }, [isFullscreen, onFullscreenChange]);

  const renderChart = useCallback(
    () => (
      <div
        className="relative flex-1"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        role="img"
        aria-label={`${label} chart`}
      >
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
              tickFormatter={formatValue}
              width={40}
              stroke="var(--border)"
              opacity={0.7}
              padding={{ top: 20, bottom: 20 }}
            />

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
              cursor={false}
              content={(props: TooltipProps<number, string>) => (
                <CustomTooltip
                  {...props}
                  dataKey={dataKey}
                  label={label}
                  formatValue={formatValue}
                  thresholds={thresholds}
                />
              )}
            />

            <Area
              type="monotone"
              dataKey={dataKey as string}
              fill={color}
              fillOpacity={0.3}
              stroke={color}
              animationDuration={0}
              isAnimationActive={false}
              connectNulls={true}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    ),
    [
      chartData,
      color,
      dataKey,
      displayData,
      dynamicDomain,
      formatTimestamp,
      formatValue,
      isHovering,
      label,
      thresholds,
    ],
  );

  return (
    <>
      <div className="flex h-full flex-col rounded-md">
        <div className="mb-1 flex items-baseline justify-between">
          <h3 className="text-lg font-medium">{label}</h3>
        </div>

        {showMiniStats && (
          <div className="mb-3 flex gap-4 text-sm">
            <div>
              <span className="text-neutral-500">Min: </span>
              <span className="font-medium">{formatValue(stats.min)}</span>
            </div>
            <div>
              <span className="text-neutral-500">Avg: </span>
              <span className="font-medium">{formatValue(stats.avg)}</span>
            </div>
            <div>
              <span className="text-neutral-500">Max: </span>
              <span className="font-medium">{formatValue(stats.max)}</span>
            </div>
          </div>
        )}

        {renderChart()}
      </div>

      {isFullscreen && (
        <Dialog open={isFullscreen} onOpenChange={handleFullscreenToggle}>
          <DialogContent className="flex min-h-fit min-w-fit flex-col">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-semibold">{label}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col">
              <div className="mb-4 flex gap-4 text-sm">
                <div>
                  <span className="text-neutral-500">Min: </span>
                  <span className="font-medium">{formatValue(stats.min)}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Avg: </span>
                  <span className="font-medium">{formatValue(stats.avg)}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Max: </span>
                  <span className="font-medium">{formatValue(stats.max)}</span>
                </div>
              </div>
              <div className="min-h-fit w-[80rem] flex-1">{renderChart()}</div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
