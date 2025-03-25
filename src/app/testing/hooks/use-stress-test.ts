import { useState } from "react";
import { TestType } from "@/types/index";
import { LoadConfigType } from "../types/test-types";
import { useWebSocket } from "./use-websocket";
import { useFakeTest } from "./use-fake-test";
import { wsClient } from "@/lib/websocket";

const defaultConfig: LoadConfigType = {
  target_url: "https://example.com",
  method: "GET",
  duration: 180,
  rampUp: 30,
  concurrentUsers: 1000,
  headers: {},
  followRedirects: true,
};

/**
 * Custom hook for stress test page state management
 */
export function useStressTest() {
  const [stressConfig, setStressConfig] = useState<LoadConfigType>(defaultConfig);

  const {
    isConnected,
    activities,
    testState: stressTest,
    timeSeriesData,
    connectWebSocket,
    setTestState,
    setActivities,
    setTimeSeriesData,
  } = useWebSocket(TestType.Stress);

  const { isFakeTestRunning, runFakeTest } = useFakeTest("stress");

  const startTest = async () => {
    try {
      // Connect to WebSocket before starting test
      await connectWebSocket();

      // Reset test state
      setTestState({
        progress: 0,
        status: "starting",
        metrics: stressTest.metrics,
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
      setActivities(["Preparing stress test..."]);

      // Request latest time series data
      wsClient.requestTimeSeriesHistory();

      // Convert from LoadConfigType to the API's expected format
      const apiConfigData = {
        url: stressConfig.target_url,
        requests: stressConfig.concurrentUsers * 10, // Example conversion
        concurrency: stressConfig.concurrentUsers,
        method: stressConfig.method,
        duration: stressConfig.duration,
        headers: stressConfig.headers,
      };

      const response = await fetch(`/api/stress-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiConfigData),
      });
      const data = await response.json();
      console.log("Stress test started:", data);

      // Add HTTP status and response info to activities
      setActivities((prev) =>
        [`Stress test started (HTTP ${response.status} ${response.statusText})`, ...prev].slice(
          0,
          4,
        ),
      );
    } catch (error) {
      console.error("Failed to start stress test:", error);
      setActivities([
        `Failed to start stress test: ${error instanceof Error ? error.message : "Invalid configuration"}`,
      ]);
    }
  };

  return {
    stressTest,
    activities,
    timeSeriesData,
    isFakeTestRunning,
    stressConfig,
    isConnected,
    setStressConfig,
    startTest,
    runFakeTest: () => runFakeTest(setTestState, setTimeSeriesData, setActivities, stressConfig),
    connectWebSocket,
  };
}
