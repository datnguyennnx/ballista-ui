"use client";

import { BarChart3 } from "lucide-react";
import { useApiTest } from "../hooks/use-api-test";
import { PageLayout } from "../components/page-layout";
import { MetricCards } from "../components/metric-cards";
import { TestStatus } from "../components/test-status";
import { MetricsDashboard } from "../components/metrics-dashboard";
import { TestConfig } from "../components/test-config";
import { ActivityLog } from "../components/activity-log";
import { mapTimeSeriesData } from "../utils/data-mappers";

export default function ApiTestPage() {
  const {
    apiTest,
    activities,
    timeSeriesData,
    isFakeTestRunning,
    apiConfig,
    setApiConfig,
    startTest,
    runFakeTest,
  } = useApiTest();

  // Extract data from apiTest
  const { progress, status, metrics } = apiTest;
  const isRunning = status === "running" || isFakeTestRunning;

  // Convert time series data to the format expected by MetricsDashboard
  const formattedTimeSeriesData = mapTimeSeriesData(timeSeriesData);

  return (
    <PageLayout
      title="API Testing"
      description="Test your API endpoints and validate responses"
      actionArea={<TestStatus isRunning={isRunning} progress={progress} onRunTest={runFakeTest} />}
      summaryArea={metrics && <MetricCards metrics={metrics} isRunning={isRunning} />}
      mainContent={<MetricsDashboard timeSeriesData={formattedTimeSeriesData} />}
      sidebarContent={
        <>
          <TestConfig
            loadConfig={apiConfig}
            setLoadConfig={setApiConfig}
            startTest={startTest}
            runFakeTest={runFakeTest}
            loadTest={apiTest}
            isFakeTestRunning={isFakeTestRunning}
            testType="api"
          />
          <ActivityLog activities={activities} />
        </>
      }
      mobileTabs={[
        {
          label: "Charts",
          value: "charts",
          icon: <BarChart3 className="h-4 w-4" />,
          content: <MetricsDashboard timeSeriesData={formattedTimeSeriesData} />,
        },
        {
          label: "Configuration",
          value: "config",
          content: (
            <TestConfig
              loadConfig={apiConfig}
              setLoadConfig={setApiConfig}
              startTest={startTest}
              runFakeTest={runFakeTest}
              loadTest={apiTest}
              isFakeTestRunning={isFakeTestRunning}
              testType="api"
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
