"use client";

import { BarChart3 } from "lucide-react";
import { useLoadTest } from "../hooks/use-load-test";
import { PageLayout } from "../components/page-layout";
import { MetricCards } from "../components/metric-cards";
import { TestStatus } from "../components/test-status";
import { MetricsDashboard } from "../components/metrics-dashboard";
import { TestConfig } from "../components/test-config";
import { ActivityLog } from "../components/activity-log";
import { mapTimeSeriesData } from "../utils/data-mappers";

export default function LoadTestPage() {
  const {
    loadTest,
    activities,
    timeSeriesData,
    isFakeTestRunning,
    loadConfig,
    setLoadConfig,
    startTest,
    runFakeTest,
  } = useLoadTest();

  // Extract data from loadTest
  const { progress, status, metrics } = loadTest;
  const isRunning = status === "running" || isFakeTestRunning;

  // Convert time series data to the format expected by MetricsDashboard
  const formattedTimeSeriesData = mapTimeSeriesData(timeSeriesData);

  return (
    <PageLayout
      title="Load Testing"
      description="Run performance tests against your API endpoints"
      actionArea={<TestStatus isRunning={isRunning} progress={progress} onRunTest={runFakeTest} />}
      summaryArea={metrics && <MetricCards metrics={metrics} isRunning={isRunning} />}
      mainContent={
        <div>
          <MetricsDashboard timeSeriesData={formattedTimeSeriesData} />
        </div>
      }
      sidebarContent={
        <>
          <TestConfig
            loadConfig={loadConfig}
            setLoadConfig={setLoadConfig}
            startTest={startTest}
            runFakeTest={runFakeTest}
            loadTest={loadTest}
            isFakeTestRunning={isFakeTestRunning}
            testType="load"
          />
          <ActivityLog activities={activities} />
        </>
      }
      mobileTabs={[
        {
          label: "Charts",
          value: "charts",
          icon: <BarChart3 className="h-4 w-4" />,
          content: (
            <div>
              <MetricsDashboard timeSeriesData={formattedTimeSeriesData} />
            </div>
          ),
        },
        {
          label: "Configuration",
          value: "config",
          content: (
            <TestConfig
              loadConfig={loadConfig}
              setLoadConfig={setLoadConfig}
              startTest={startTest}
              runFakeTest={runFakeTest}
              loadTest={loadTest}
              isFakeTestRunning={isFakeTestRunning}
              testType="load"
            />
          ),
        },
        {
          label: "Activities",
          value: "activities",
          content: <ActivityLog activities={activities} />,
        },
      ]}
    />
  );
}
