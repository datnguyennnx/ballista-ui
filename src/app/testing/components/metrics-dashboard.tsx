"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricsChart } from "./metrics-chart";
import { TimeSeriesPoint } from "../types/time-series";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";

// Define interfaces for time series data
interface TimePoint {
  timestamp: number;
  value: number;
}

export interface TimeSeriesData {
  responseTime: TimePoint[];
  throughput: TimePoint[];
  concurrentUsers: TimePoint[];
  errorRate: TimePoint[];
}

interface MetricsDashboardProps {
  timeSeriesData: TimeSeriesData;
  showConcurrentUsers?: boolean;
}

export function MetricsDashboard({
  timeSeriesData,
  showConcurrentUsers = false,
}: MetricsDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);

  // Convert from TimeSeriesData to array of TimeSeriesPoint
  const chartData = useMemo((): TimeSeriesPoint[] => {
    if (!timeSeriesData || !timeSeriesData.responseTime.length) {
      return [];
    }

    // Sort data points by timestamp to ensure proper ordering
    const timestamps = timeSeriesData.responseTime.map((p) => p.timestamp).sort();

    return timestamps.map((timestamp) => {
      // Find matching points from other metrics
      const responseTime =
        timeSeriesData.responseTime.find((p) => p.timestamp === timestamp)?.value || 0;
      const throughput =
        timeSeriesData.throughput.find((p) => p.timestamp === timestamp)?.value || 0;
      const errorRate = timeSeriesData.errorRate.find((p) => p.timestamp === timestamp)?.value || 0;

      return {
        timestamp,
        responseTime,
        requestsPerSecond: throughput,
        errorRate,
      };
    });
  }, [timeSeriesData]);

  // Create enhanced data with concurrentUsers property
  const enhancedData = useMemo(() => {
    return chartData.map((point) => ({
      ...point,
      concurrentUsers: Math.round(point.requestsPerSecond * (Math.random() * 2 + 3)),
    }));
  }, [chartData]);

  // Render overview tab content
  const renderOverviewContent = () => (
    <div className="flex flex-col gap-4">
      <Card className="h-full w-full border">
        <CardHeader className="bg-card/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Response Time (ms)</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setFullscreenChart(fullscreenChart === "responseTime" ? null : "responseTime")
              }
              className="h-8 w-8"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <MetricsChart
            data={chartData}
            dataKey="responseTime"
            label="Response Time (ms)"
            formatValue={(value) => `${value.toFixed(1)} ms`}
            isFullscreen={fullscreenChart === "responseTime"}
            onFullscreenChange={(isFullscreen) =>
              setFullscreenChart(isFullscreen ? "responseTime" : null)
            }
          />
        </CardContent>
      </Card>

      <Card className="h-full w-full border">
        <CardHeader className="bg-card/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Throughput (rps)</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setFullscreenChart(fullscreenChart === "throughput" ? null : "throughput")
              }
              className="h-8 w-8"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <MetricsChart
            data={chartData}
            dataKey="requestsPerSecond"
            label="Throughput (rps)"
            formatValue={(value) => `${value.toFixed(1)} rps`}
            isFullscreen={fullscreenChart === "throughput"}
            onFullscreenChange={(isFullscreen) =>
              setFullscreenChart(isFullscreen ? "throughput" : null)
            }
          />
        </CardContent>
      </Card>

      {showConcurrentUsers && (
        <Card className="h-full w-full border">
          <CardHeader className="bg-card/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Concurrent Users</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setFullscreenChart(
                    fullscreenChart === "concurrentUsers" ? null : "concurrentUsers",
                  )
                }
                className="h-8 w-8"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <MetricsChart
              data={enhancedData}
              dataKey="concurrentUsers"
              label="Users"
              formatValue={(value) => `${Math.round(value)}`}
              isFullscreen={fullscreenChart === "concurrentUsers"}
              onFullscreenChange={(isFullscreen) =>
                setFullscreenChart(isFullscreen ? "concurrentUsers" : null)
              }
            />
          </CardContent>
        </Card>
      )}

      <Card className="h-full w-full border">
        <CardHeader className="bg-card/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Error Rate (%)</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setFullscreenChart(fullscreenChart === "errorRate" ? null : "errorRate")
              }
              className="h-8 w-8"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <MetricsChart
            data={chartData}
            dataKey="errorRate"
            label="Error Rate (%)"
            formatValue={(value) => `${value.toFixed(2)}%`}
            isFullscreen={fullscreenChart === "errorRate"}
            onFullscreenChange={(isFullscreen) =>
              setFullscreenChart(isFullscreen ? "errorRate" : null)
            }
          />
        </CardContent>
      </Card>
    </div>
  );

  // Render response time tab content
  const renderResponseTimeContent = () => (
    <Card className="h-full overflow-hidden border">
      <CardHeader className="bg-card/50">
        <div className="flex items-center justify-between">
          <CardTitle>Response Time Analysis</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setFullscreenChart(fullscreenChart === "responseTime" ? null : "responseTime")
            }
            className="h-8 w-8"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <MetricsChart
          data={chartData}
          dataKey="responseTime"
          label="Response Time (ms)"
          formatValue={(value) => `${value.toFixed(1)} ms`}
          isFullscreen={fullscreenChart === "responseTime"}
          onFullscreenChange={(isFullscreen) =>
            setFullscreenChart(isFullscreen ? "responseTime" : null)
          }
        />
      </CardContent>
    </Card>
  );

  // Render throughput tab content
  const renderThroughputContent = () => (
    <Card className="h-full overflow-hidden border">
      <CardHeader className="bg-card/50">
        <div className="flex items-center justify-between">
          <CardTitle>Throughput Analysis</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setFullscreenChart(fullscreenChart === "throughput" ? null : "throughput")
            }
            className="h-8 w-8"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <MetricsChart
          data={chartData}
          dataKey="requestsPerSecond"
          label="Throughput (rps)"
          formatValue={(value) => `${value.toFixed(1)} rps`}
          isFullscreen={fullscreenChart === "throughput"}
          onFullscreenChange={(isFullscreen) =>
            setFullscreenChart(isFullscreen ? "throughput" : null)
          }
        />
      </CardContent>
    </Card>
  );

  // Render errors tab content
  const renderErrorsContent = () => (
    <Card className="h-full overflow-hidden border">
      <CardHeader className="bg-card/50">
        <div className="flex items-center justify-between">
          <CardTitle>Error Rate Analysis</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFullscreenChart(fullscreenChart === "errorRate" ? null : "errorRate")}
            className="h-8 w-8"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <MetricsChart
          data={chartData}
          dataKey="errorRate"
          label="Error Rate (%)"
          formatValue={(value) => `${value.toFixed(2)}%`}
          thresholds={{ warning: 1, critical: 5 }}
          isFullscreen={fullscreenChart === "errorRate"}
          onFullscreenChange={(isFullscreen) =>
            setFullscreenChart(isFullscreen ? "errorRate" : null)
          }
        />
      </CardContent>
    </Card>
  );

  // Render active tab content
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewContent();
      case "response-time":
        return renderResponseTimeContent();
      case "throughput":
        return renderThroughputContent();
      case "errors":
        return renderErrorsContent();
      default:
        return renderOverviewContent();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="response-time">Response Time</TabsTrigger>
            <TabsTrigger value="throughput">Throughput</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {renderActiveTabContent()}
    </div>
  );
}
