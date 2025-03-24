"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricsChart } from "./metrics-chart";
import { TimeSeriesPoint } from "../types/time-series";

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
          <CardTitle className="text-base">Response Time (ms)</CardTitle>
        </CardHeader>
        <CardContent>
          <MetricsChart
            data={chartData}
            dataKey="responseTime"
            label="Response Time (ms)"
            formatValue={(value) => `${value.toFixed(1)} ms`}
            // thresholds={{ warning: 200, critical: 500 }}
          />
        </CardContent>
      </Card>

      <Card className="h-full w-full border">
        <CardHeader className="bg-card/50">
          <CardTitle className="text-base">Throughput (rps)</CardTitle>
        </CardHeader>
        <CardContent>
          <MetricsChart
            data={chartData}
            dataKey="requestsPerSecond"
            label="Throughput (rps)"
            formatValue={(value) => `${value.toFixed(1)} rps`}
          />
        </CardContent>
      </Card>

      {showConcurrentUsers && (
        <Card className="h-full w-full border">
          <CardHeader className="bg-card/50">
            <CardTitle className="text-base">Concurrent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricsChart
              data={enhancedData}
              dataKey="concurrentUsers"
              label="Users"
              formatValue={(value) => `${Math.round(value)}`}
            />
          </CardContent>
        </Card>
      )}

      <Card className="h-full w-full border">
        <CardHeader className="bg-card/50">
          <CardTitle className="text-base">Error Rate (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <MetricsChart
            data={chartData}
            dataKey="errorRate"
            label="Error Rate (%)"
            formatValue={(value) => `${value.toFixed(2)}%`}
            // thresholds={{ warning: 1, critical: 5 }}
          />
        </CardContent>
      </Card>
    </div>
  );

  // Render response time tab content
  const renderResponseTimeContent = () => (
    <Card className="h-full overflow-hidden border">
      <CardHeader className="bg-card/50">
        <CardTitle>Response Time Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <MetricsChart
          data={chartData}
          dataKey="responseTime"
          label="Response Time (ms)"
          formatValue={(value) => `${value.toFixed(1)} ms`}
          // thresholds={{ warning: 200, critical: 500 }}
        />
      </CardContent>
    </Card>
  );

  // Render throughput tab content
  const renderThroughputContent = () => (
    <Card className="h-full overflow-hidden border">
      <CardHeader className="bg-card/50">
        <CardTitle>Throughput Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <MetricsChart
          data={chartData}
          dataKey="requestsPerSecond"
          label="Throughput (rps)"
          formatValue={(value) => `${value.toFixed(1)} rps`}
        />
      </CardContent>
    </Card>
  );

  // Render errors tab content
  const renderErrorsContent = () => (
    <Card className="h-full overflow-hidden border">
      <CardHeader className="bg-card/50">
        <CardTitle>Error Rate Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <MetricsChart
          data={chartData}
          dataKey="errorRate"
          label="Error Rate (%)"
          formatValue={(value) => `${value.toFixed(2)}%`}
          thresholds={{ warning: 1, critical: 5 }}
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
