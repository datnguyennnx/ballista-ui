import { useState, useEffect } from "react";
import { LoadConfigType, TestState } from "../types/test-types";
import { TimeSeriesPoint } from "../types/time-series";
import { generateFakeTestData, createTestMetrics } from "../shared/mock-data";

/**
 * Custom hook for API test page state management
 */
export function useApiTest() {
  // Test configuration state
  const [apiConfig, setApiConfig] = useState<LoadConfigType>({
    url: "https://api.example.com/users",
    method: "GET",
    duration: 60,
    rampUp: 5,
    concurrentUsers: 10,
    thinkTime: 100,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer {token}",
    },
    followRedirects: true,
  });

  // Test execution state
  const [apiTest, setApiTest] = useState<TestState>({
    progress: 0,
    status: "idle",
    metrics: {
      requests_completed: 0,
      total_requests: 1000,
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
   * Start an actual API test
   */
  const startTest = async () => {
    // Reset test state
    setApiTest({
      progress: 0,
      status: "starting",
      metrics: apiTest.metrics,
    });

    setActivities(["Preparing API test..."]);

    // Real API call would happen here
  };

  /**
   * Run a simulated API test with fake data
   */
  const runFakeTest = () => {
    if (isFakeTestRunning) return;

    // Reset test state
    setTimeSeriesData([]);
    setActivities(["Starting API test against " + apiConfig.url, "Loading test suite..."]);

    setApiTest({
      progress: 0,
      status: "running",
      metrics: {
        requests_completed: 0,
        total_requests: 1000,
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
    const allDataPoints = generateFakeTestData("api");

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
      const metrics = createTestMetrics(progress, currentDataPoint, "api");

      // Add activity logs at specific milestones
      if (progress === 15) {
        setActivities((prev) => [...prev, "Testing endpoint with " + apiConfig.method + " method"]);
      } else if (progress === 30) {
        setActivities((prev) => [...prev, "Verifying response schemas"]);
      } else if (progress === 50) {
        setActivities((prev) => [...prev, "Validating status codes"]);
      } else if (progress === 70) {
        setActivities((prev) => [...prev, "Checking authentication flows"]);
      } else if (progress === 85) {
        setActivities((prev) => [...prev, "Validating rate limiting behavior"]);
      }

      // Update test state
      setApiTest({
        progress,
        status: progress < 100 ? "running" : "completed",
        metrics,
      });

      // End test when complete
      if (progress >= 100) {
        clearInterval(interval);
        setFakeTestInterval(null);
        setIsFakeTestRunning(false);
        setActivities((prev) => [...prev, "API test completed successfully"]);
      }
    }, 300);

    setFakeTestInterval(interval);
  };

  return {
    apiTest,
    activities,
    timeSeriesData,
    isFakeTestRunning,
    apiConfig,
    setApiConfig,
    startTest,
    runFakeTest,
  };
}
