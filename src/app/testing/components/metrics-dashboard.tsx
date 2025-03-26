"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricsChart } from "./metrics-chart";
import { TimeSeriesPoint } from "../types/time-series";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";

interface MetricsDashboardProps {
  timeSeriesData: TimeSeriesPoint[];
  showConcurrentUsers?: boolean;
}

export function MetricsDashboard({
  timeSeriesData,
  showConcurrentUsers = false,
}: MetricsDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);

  // Create enhanced data points with concurrent users
  const dataPoints = useMemo(() => {
    if (!timeSeriesData || timeSeriesData.length === 0) return [];

    return timeSeriesData.map((point) => ({
      ...point,
      // Calculate concurrent users based on requests per second
      concurrentUsers: point.requests_per_second ? Math.round(point.requests_per_second * 1.5) : 0,
    }));
  }, [timeSeriesData]);

  // Render overview tab content
  const renderOverviewContent = () => (
    <div className="flex flex-col gap-4">
      <Card className="border">
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
            data={dataPoints}
            dataKey="average_response_time"
            label="Response Time"
            colorIndex={1}
            formatValue={(value) => `${value.toFixed(2)} ms`}
            thresholds={{ warning: 200, critical: 500 }}
            isFullscreen={fullscreenChart === "responseTime"}
            onFullscreenChange={(isFullscreen) =>
              setFullscreenChart(isFullscreen ? "responseTime" : null)
            }
          />
        </CardContent>
      </Card>
      <Card className="border">
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
            data={dataPoints}
            dataKey="requests_per_second"
            label="Throughput"
            colorIndex={2}
            formatValue={(value) => `${value.toFixed(2)} rps`}
            isFullscreen={fullscreenChart === "throughput"}
            onFullscreenChange={(isFullscreen) =>
              setFullscreenChart(isFullscreen ? "throughput" : null)
            }
          />
        </CardContent>
      </Card>
      {showConcurrentUsers && (
        <Card className="border">
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
              data={dataPoints}
              dataKey="concurrentUsers"
              label="Active Users"
              colorIndex={3}
              formatValue={(value) => `${Math.round(value)}`}
              isFullscreen={fullscreenChart === "concurrentUsers"}
              onFullscreenChange={(isFullscreen) =>
                setFullscreenChart(isFullscreen ? "concurrentUsers" : null)
              }
            />
          </CardContent>
        </Card>
      )}
      <Card className="border">
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
            data={dataPoints}
            dataKey="error_rate"
            label="Error Rate"
            colorIndex={4}
            formatValue={(value) => `${value.toFixed(2)}%`}
            thresholds={{ warning: 1, critical: 5 }}
            isFullscreen={fullscreenChart === "errorRate"}
            onFullscreenChange={(isFullscreen) =>
              setFullscreenChart(isFullscreen ? "errorRate" : null)
            }
          />
        </CardContent>
      </Card>
    </div>
  );

  // Render detailed view tabs
  const renderDetailedView = (
    dataKey: keyof TimeSeriesPoint,
    label: string,
    colorIndex: 1 | 2 | 3 | 4 | 5,
    formatValue: (value: number) => string,
    thresholds?: { warning?: number; critical?: number },
  ) => (
    <Card className="border">
      <CardHeader className="bg-card/50">
        <div className="flex items-center justify-between">
          <CardTitle>{label} Analysis</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFullscreenChart(fullscreenChart === dataKey ? null : dataKey)}
            className="h-8 w-8"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <MetricsChart
          data={dataPoints}
          dataKey={dataKey}
          label={label}
          colorIndex={colorIndex}
          formatValue={formatValue}
          thresholds={thresholds}
          isFullscreen={fullscreenChart === dataKey}
          onFullscreenChange={(isFullscreen) => setFullscreenChart(isFullscreen ? dataKey : null)}
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
        return renderDetailedView(
          "average_response_time",
          "Response Time",
          1,
          (value) => `${value.toFixed(2)} ms`,
          { warning: 200, critical: 500 },
        );
      case "throughput":
        return renderDetailedView(
          "requests_per_second",
          "Throughput",
          2,
          (value) => `${value.toFixed(2)} rps`,
        );
      case "errors":
        return renderDetailedView(
          "error_rate",
          "Error Rate",
          4,
          (value) => `${value.toFixed(2)}%`,
          { warning: 1, critical: 5 },
        );
      default:
        return renderOverviewContent();
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="response-time">Response Time</TabsTrigger>
          <TabsTrigger value="throughput">Throughput</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>
      </Tabs>

      {renderActiveTabContent()}
    </div>
  );
}
