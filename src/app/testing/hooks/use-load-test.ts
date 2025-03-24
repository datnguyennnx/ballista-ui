import { useState } from "react";
import { TestType } from "@/types/index";
import { LoadConfigType } from "../types/test-types";
import { useWebSocket } from "./use-websocket";
import { useFakeTest } from "./use-fake-test";
import { wsClient } from "@/lib/websocket";

const defaultConfig: LoadConfigType = {
  target_url: "https://example.com",
  method: "GET",
  duration: 60,
  rampUp: 10,
  concurrentUsers: 100,
  thinkTime: 200,
  headers: {},
  followRedirects: true,
};

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
        status: "starting",
        metrics: loadTest.metrics,
      });

      // Reset time series data when starting a new test
      // Initialize with a starting point at [0, 0] to ensure chart begins at origin
      const startPoint = {
        timestamp: Date.now(),
        requestsPerSecond: 0,
        responseTime: 0,
        errorRate: 0,
        concurrentUsers: 0,
      };
      setTimeSeriesData([startPoint]);

      // Clear previous activities and add initial message
      setActivities(["Preparing load test..."]);

      // Request latest time series data
      wsClient.requestTimeSeriesHistory();

      // Convert from LoadConfigType to the API's expected format
      const apiConfigData = {
        target_url: loadConfig.target_url,
        num_requests: loadConfig.concurrentUsers * 10, // Example conversion
        concurrency: loadConfig.concurrentUsers,
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
    }
  };

  return {
    loadTest,
    activities,
    timeSeriesData,
    isFakeTestRunning,
    loadConfig,
    isConnected,
    setLoadConfig,
    startTest,
    runFakeTest: () => runFakeTest(setTestState, setTimeSeriesData, setActivities, loadConfig),
    connectWebSocket,
  };
}
