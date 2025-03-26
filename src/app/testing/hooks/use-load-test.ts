import { useState, useEffect } from "react";
import { TestType, TestStatus } from "@/types/index";
import { LoadConfigType } from "../types/test-types";
import { useWebSocket } from "./use-websocket";
import { useFakeTest } from "./use-fake-test";
import { wsClient } from "@/lib/websocket/index";
import { createTimeSeriesPoint } from "../types/time-series";
import { mapTestMetricsToTimeSeriesPoint, mapTimeSeriesData } from "../utils/data-mappers";

const defaultConfig: LoadConfigType = {
  target_url: "https://example.com",
  method: "GET",
  duration: 60,
  rampUp: 10,
  concurrentUsers: 100,
  headers: {},
  followRedirects: true,
};

interface LoadTestRequest {
  target_url: string;
  num_requests: number;
  concurrent_users: number;
}

export function useLoadTest() {
  const [loadConfig, setLoadConfig] = useState<LoadConfigType>(defaultConfig);

  const {
    isConnected,
    activities,
    testState: loadTest,
    timeSeriesData,
    connectWebSocket,
    setTestState,
    setActivities,
    setTimeSeriesData,
  } = useWebSocket(TestType.Load);

  const { isFakeTestRunning, runFakeTest } = useFakeTest("load");

  const startTest = async () => {
    try {
      // Connect to WebSocket before starting test
      await connectWebSocket();

      // Reset test state
      setTestState({
        progress: 0,
        status: TestStatus.Started,
        metrics: loadTest.metrics,
      });

      // Reset time series data when starting a new test
      // Initialize with a starting point at [0, 0] to ensure chart begins at origin
      const initialPoint = createTimeSeriesPoint();
      setTimeSeriesData([initialPoint]);

      // Clear previous activities and add initial message
      setActivities(["Preparing load test..."]);

      // Request latest time series data
      wsClient.requestTimeSeriesHistory();

      // Convert from LoadConfigType to the API's expected format
      const apiConfigData: LoadTestRequest = {
        target_url: loadConfig.target_url,
        num_requests: loadConfig.concurrentUsers * 10, // Example conversion
        concurrent_users: loadConfig.concurrentUsers,
      };

      setActivities((prev) => [`Sending request to ${loadConfig.target_url}`, ...prev].slice(0, 4));

      const response = await fetch(`/api/load-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiConfigData),
      });

      const data = await response.json();
      console.log("Load test started:", data);

      // Add HTTP status and response info to activities
      setActivities((prev) =>
        [`Load test started (HTTP ${response.status} ${response.statusText})`, ...prev].slice(0, 4),
      );
    } catch (error) {
      console.error("Failed to start load test:", error);
      setActivities([
        `Failed to start load test: ${error instanceof Error ? error.message : "Invalid configuration"}`,
      ]);
      setTestState({
        progress: 0,
        status: TestStatus.Error,
        metrics: undefined,
      });
    }
  };

  // Update time series data when metrics change
  useEffect(() => {
    if (loadTest.metrics) {
      const timeSeriesPoint = mapTestMetricsToTimeSeriesPoint(loadTest.metrics);
      setTimeSeriesData((prev) => [...prev, timeSeriesPoint]);
    }
  }, [loadTest.metrics, setTimeSeriesData]);

  return {
    loadTest,
    activities,
    timeSeriesData,
    chartData: mapTimeSeriesData(timeSeriesData),
    isFakeTestRunning,
    loadConfig,
    isConnected,
    setLoadConfig,
    startTest,
    runFakeTest: () => runFakeTest(setTestState, setTimeSeriesData, setActivities, loadConfig),
    connectWebSocket,
  };
}
