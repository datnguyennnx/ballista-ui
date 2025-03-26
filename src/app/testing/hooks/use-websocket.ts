import { useState, useEffect, useCallback } from "react";
import { wsClient } from "@/lib/websocket/index";
import { TestType, TestStatus } from "@/types/index";
import { TimeSeriesPoint, convertToChartData, ChartData } from "../types/time-series";
import { TestState } from "../types/test-types";
import { ConnectionState } from "@/lib/websocket/types";

const initialMetrics = {
  requests_completed: 0,
  total_requests: 0,
  average_response_time: 0,
  min_response_time: 0,
  max_response_time: 0,
  error_rate: 0,
  requests_per_second: 0,
  status_codes: {},
};

export function useWebSocket(testType: TestType) {
  const [isConnected, setIsConnected] = useState(false);
  const [activities, setActivities] = useState<string[]>([]);
  const [testState, setTestState] = useState<TestState>({
    progress: 0,
    status: "idle",
    metrics: initialMetrics,
  });
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[]>([]);
  const [chartData, setChartData] = useState<ChartData>({
    timestamps: [],
    throughput: [],
    responseTime: [],
    errorRate: [],
  });

  // Monitor WebSocket connection state
  useEffect(() => {
    const unsubscribe = wsClient.subscribeToConnectionState((connectionState) => {
      const connected = connectionState === ConnectionState.CONNECTED;
      setIsConnected(connected);

      if (connected) {
        setActivities((prev) => ["Connected to test server", ...prev].slice(0, 4));
        // Request historical data when reconnected
        wsClient.requestTimeSeriesHistory();
      } else if (
        connectionState === ConnectionState.DISCONNECTED &&
        testState.status === "running"
      ) {
        setTestState((prev) => ({
          ...prev,
          status: "interrupted",
        }));
        setActivities((prev) =>
          ["Connection to test server lost, attempting to reconnect...", ...prev].slice(0, 4),
        );
        // Attempt to reconnect
        wsClient.resetAndReconnect();
      } else if (connectionState === ConnectionState.DISCONNECTED) {
        setActivities((prev) =>
          ["Disconnected from test server, attempting to reconnect...", ...prev].slice(0, 4),
        );
        wsClient.resetAndReconnect();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [testState.status, testState.progress]);

  const connectWebSocket = useCallback(async () => {
    if (wsClient.isConnectedState()) return;

    try {
      setActivities((prev) => ["Connecting to test server...", ...prev].slice(0, 4));
      await wsClient.connect();
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      setActivities((prev) => ["Failed to connect to test server", ...prev].slice(0, 4));
    }
  }, []);

  // Setup WebSocket handlers with better error handling
  useEffect(() => {
    // Subscribe to test updates
    const unsubscribeTestUpdates = wsClient.subscribeToTestUpdates((update) => {
      if (!update || update.test_type !== testType) return;

      try {
        if (testState.status === "interrupted") {
          console.warn("Test was interrupted, but received update. Resuming...");
          setTestState((prev) => ({ ...prev, status: "running" }));
        }

        const progress = typeof update.progress === "number" ? update.progress.toFixed(0) : "0";
        const status = update.status || "unknown";
        const progressNumber = parseFloat(progress);

        let shouldLogActivity = false;
        let activity = `${testType} Test: ${progress}% - ${status}`;

        const prevProgress = testState.progress;
        const prevStatus = testState.status;

        if (status !== prevStatus) {
          shouldLogActivity = true;
          if (status === TestStatus.Completed) {
            activity = `${testType} Test completed successfully`;
          } else if (status === TestStatus.Error) {
            activity = `${testType} Test encountered an error`;
          } else if (status === TestStatus.Running && prevStatus === "starting") {
            activity = `${testType} Test is now running`;
          }
        } else if (
          (progressNumber === 0 && prevProgress !== 0) ||
          (progressNumber >= 25 && prevProgress < 25) ||
          (progressNumber >= 50 && prevProgress < 50) ||
          (progressNumber >= 75 && prevProgress < 75) ||
          (progressNumber >= 100 && prevProgress < 100)
        ) {
          shouldLogActivity = true;
          activity =
            progressNumber >= 100
              ? `${testType} Test: 100% complete`
              : `${testType} Test: ${progress}% complete`;
        }

        if (shouldLogActivity) {
          setActivities((prev) => [activity, ...prev].slice(0, 4));
        }

        setTestState({
          progress: typeof update.progress === "number" ? update.progress : 0,
          metrics: update.metrics || undefined,
          status: status,
        });
      } catch (error) {
        console.error("Error processing test update:", error, update);
        setActivities((prev) => [`Error processing test update: ${error}`, ...prev].slice(0, 4));
      }
    });

    // Subscribe to time series data with validation
    const unsubscribeTimeSeries = wsClient.subscribeToTimeSeries((point) => {
      try {
        if (point && isValidTimeSeriesPoint(point)) {
          setTimeSeriesData((prev) => {
            // Keep a sliding window of the last 50 points, sorted by timestamp
            const newData = [...prev, point].sort((a, b) => a.timestamp - b.timestamp).slice(-50);
            // Update chart data
            setChartData(convertToChartData(newData));
            return newData;
          });
        }
      } catch (error) {
        console.error("Error processing time series data:", error, point);
      }
    });

    return () => {
      unsubscribeTestUpdates();
      unsubscribeTimeSeries();
    };
  }, [testState.status, testState.progress, testType]);

  useEffect(() => {
    if (testState.progress === 100) {
      const unsubscribe = wsClient.subscribeToTimeSeries(() => {});
      unsubscribe();
    }
  }, [testState.progress]);

  // Helper function to validate time series data
  const isValidTimeSeriesPoint = (point: TimeSeriesPoint): boolean => {
    return (
      typeof point.timestamp === "number" &&
      typeof point.requests_per_second === "number" &&
      typeof point.average_response_time === "number" &&
      typeof point.error_rate === "number" &&
      point.timestamp > 0 &&
      point.requests_per_second >= 0 &&
      point.average_response_time >= 0 &&
      point.error_rate >= 0
    );
  };

  return {
    isConnected,
    activities,
    testState,
    timeSeriesData,
    chartData,
    connectWebSocket,
    setTestState,
    setActivities,
    setTimeSeriesData,
  };
}
