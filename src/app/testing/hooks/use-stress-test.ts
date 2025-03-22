import { useState, useEffect } from "react";
import { LoadConfigType, TestState } from "../types/test-types";
import { TimeSeriesPoint } from "../types/time-series";
import { generateFakeTestData, createTestMetrics } from "../shared/mock-data";

/**
 * Custom hook for stress test page state management
 */
export function useStressTest() {
  // Test configuration state
  const [stressConfig, setStressConfig] = useState<LoadConfigType>({
    url: "https://api.example.com/stress-test",
    method: "GET",
    duration: 180,
    rampUp: 30,
    concurrentUsers: 1000,
    thinkTime: 500,
    headers: {},
    followRedirects: true,
  });

  // Test execution state
  const [stressTest, setStressTest] = useState<TestState>({
    progress: 0,
    status: "idle",
    metrics: {
      requests_completed: 0,
      total_requests: 10000,
      avg_response_time: 0,
      min_response_time: 0,
      max_response_time: 0,
      median_response_time: 0,
      p95_response_time: 0,
      status_codes: {},
      errors: 0,
    },
  });

  // Activity log messages
  const [activities, setActivities] = useState<string[]>([]);

  // Time series data for charts
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[]>([]);

  // Tracking fake test state
  const [isFakeTestRunning, setIsFakeTestRunning] = useState(false);
  const [fakeTestInterval, setFakeTestInterval] = useState<NodeJS.Timeout | null>(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (fakeTestInterval) {
        clearInterval(fakeTestInterval);
      }
    };
  }, [fakeTestInterval]);

  /**
   * Start an actual stress test
   */
  const startTest = async () => {
    // Reset test state
    setStressTest({
      progress: 0,
      status: "starting",
      metrics: stressTest.metrics,
    });

    setActivities(["Preparing stress test..."]);

    // Real API call would happen here
  };

  /**
   * Run a simulated stress test with fake data
   */
  const runFakeTest = () => {
    if (isFakeTestRunning) return;

    // Reset test state
    setTimeSeriesData([]);
    setActivities([
      "Starting stress test against " + stressConfig.url,
      "Configuring test parameters...",
    ]);

    setStressTest({
      progress: 0,
      status: "running",
      metrics: {
        requests_completed: 0,
        total_requests: 10000,
        avg_response_time: 0,
        min_response_time: 0,
        max_response_time: 0,
        median_response_time: 0,
        p95_response_time: 0,
        status_codes: { 200: 0 },
        errors: 0,
      },
    });

    setIsFakeTestRunning(true);

    // Generate all data points up front
    const allDataPoints = generateFakeTestData("stress");

    // Track progress
    let currentStep = 0;
    const totalSteps = 100;

    // Progress update interval
    const interval = setInterval(() => {
      // Update progress
      currentStep++;
      const progress = currentStep;

      // Get current data point based on progress
      const dataIndex = Math.min(
        Math.floor((currentStep / totalSteps) * allDataPoints.length),
        allDataPoints.length - 1,
      );
      const currentDataPoint = allDataPoints[dataIndex];

      // Add to time series
      setTimeSeriesData((prev) => [...prev, currentDataPoint]);

      // Update test metrics based on progress
      const metrics = createTestMetrics(progress, currentDataPoint, "stress");

      // Add activity logs at specific milestones
      if (progress === 10) {
        setActivities((prev) => [...prev, "Ramping up to initial load..."]);
      } else if (progress === 30) {
        setActivities((prev) => [
          ...prev,
          `Reached ${stressConfig.concurrentUsers / 3} concurrent users`,
        ]);
      } else if (progress === 50) {
        setActivities((prev) => [
          ...prev,
          `Reached ${stressConfig.concurrentUsers / 2} concurrent users`,
        ]);
      } else if (progress === 70) {
        setActivities((prev) => [...prev, "System under heavy load"]);
      } else if (progress === 90) {
        setActivities((prev) => [...prev, "Nearing test completion..."]);
      }

      // Update test state
      setStressTest({
        progress,
        status: progress < 100 ? "running" : "completed",
        metrics,
      });

      // End test when complete
      if (progress >= 100) {
        clearInterval(interval);
        setFakeTestInterval(null);
        setIsFakeTestRunning(false);
        setActivities((prev) => [...prev, "Stress test completed"]);
      }
    }, 300);

    setFakeTestInterval(interval);
  };

  return {
    stressTest,
    activities,
    timeSeriesData,
    isFakeTestRunning,
    stressConfig,
    setStressConfig,
    startTest,
    runFakeTest,
  };
}
