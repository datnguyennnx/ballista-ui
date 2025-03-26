"use client";

import { BarChart3 } from "lucide-react";
import { useStressTest } from "../hooks/use-stress-test";
import { PageLayout } from "../components/page-layout";
import { MetricCards } from "../components/metric-cards";
import { TestStatus } from "../components/test-status";
import { MetricsDashboard } from "../components/metrics-dashboard";
import { TestConfig } from "../components/test-config";
import { ActivityLog } from "../components/activity-log";

export default function StressTestPage() {
  const {
    stressTest,
    activities,
    timeSeriesData,
    isFakeTestRunning,
    stressConfig,
    setStressConfig,
    startTest,
    runFakeTest,
  } = useStressTest();

  // Extract data from stressTest
  const { progress, status, metrics } = stressTest;
  const isRunning = status === "running" || isFakeTestRunning;

  return (
    <PageLayout
      title="Stress Testing"
      description="Run stress tests to find the breaking point of your API"
      actionArea={<TestStatus isRunning={isRunning} progress={progress} onRunTest={runFakeTest} />}
      summaryArea={metrics && <MetricCards metrics={metrics} isRunning={isRunning} />}
      mainContent={<MetricsDashboard timeSeriesData={timeSeriesData} showConcurrentUsers={true} />}
      sidebarContent={
        <>
          <TestConfig
            loadConfig={stressConfig}
            setLoadConfig={setStressConfig}
            startTest={startTest}
            loadTest={stressTest}
            isFakeTestRunning={isFakeTestRunning}
            testType="stress"
          />
          <ActivityLog activities={activities} />
        </>
      }
      mobileTabs={[
        {
          label: "Charts",
          value: "charts",
          icon: <BarChart3 className="h-4 w-4" />,
          content: <MetricsDashboard timeSeriesData={timeSeriesData} showConcurrentUsers={true} />,
        },
        {
          label: "Configuration",
          value: "config",
          content: (
            <TestConfig
              loadConfig={stressConfig}
              setLoadConfig={setStressConfig}
              startTest={startTest}
              loadTest={stressTest}
              isFakeTestRunning={isFakeTestRunning}
              testType="stress"
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
