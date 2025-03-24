import { useState, useEffect, useCallback } from "react";
import { wsClient } from "@/lib/websocket";
import { TestType, TestStatus } from "@/types/index";
import { TimeSeriesPoint } from "../types/time-series";
import { TestState } from "../types/test-types";

export function useWebSocket(testType: TestType) {
  const [isConnected, setIsConnected] = useState(false);
  const [activities, setActivities] = useState<string[]>([]);
  const [testState, setTestState] = useState<TestState>({ progress: 0, status: "idle" });
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[]>([]);
  const [lastTimestamp, setLastTimestamp] = useState<number>(0);

  // Monitor WebSocket connection state
  useEffect(() => {
    const unsubscribe = wsClient.subscribeToConnectionState((connectionState) => {
      const connected = connectionState === "connected";
      setIsConnected(connected);
      if (connected) {
        setActivities((prev) => ["Connected to test server", ...prev].slice(0, 4));
      } else if (connectionState === "disconnected" && testState.status === "running") {
        setTestState((prev) => ({
          ...prev,
          status: "interrupted",
        }));
        setActivities((prev) => ["Connection to test server lost", ...prev].slice(0, 4));
      } else if (connectionState === "disconnected") {
        setActivities((prev) => ["Disconnected from test server", ...prev].slice(0, 4));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [testState.status]);

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

  // Setup WebSocket handlers
  useEffect(() => {
    // Subscribe to test updates
    const unsubscribeTestUpdates = wsClient.subscribeToTestUpdates((update) => {
      if (!update || update.test_type !== testType) return;

      try {
        if (testState.status === "interrupted") {
          console.warn("Ignoring test update because connection was previously lost");
          return;
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
        setTestState((prev) => ({
          ...prev,
          status: "error",
        }));
        setActivities((prev) => ["Error processing test update", ...prev].slice(0, 4));
      }
    });

    // Subscribe to time series data
    const unsubscribeTimeSeries = wsClient.subscribeToTimeSeries((point) => {
      try {
        if (point && point.timestamp && point.timestamp > lastTimestamp) {
          setLastTimestamp(point.timestamp);
          setTimeSeriesData((prev) => {
            if (
              prev.length > 0 &&
              prev[0].requestsPerSecond === 0 &&
              prev[0].responseTime === 0 &&
              prev[0].timestamp !== point.timestamp
            ) {
              const updatedData = [prev[0], ...prev.slice(1).concat(point)];
              return updatedData.slice(-50);
            } else {
              return [...prev, point].slice(-50);
            }
          });
        }
      } catch (error) {
        console.error("Error processing time series data:", error, point);
      }
    });

    // Subscribe to time series history
    const unsubscribeTimeSeriesHistory = wsClient.subscribeToTimeSeriesHistory((points) => {
      try {
        if (Array.isArray(points) && points.length > 0) {
          const latestTimestamp = Math.max(
            ...points.filter((p) => p && typeof p.timestamp === "number").map((p) => p.timestamp),
          );

          if (testState.status === "idle" || testState.status === "starting") {
            if (!isNaN(latestTimestamp)) {
              setLastTimestamp(latestTimestamp);
            }
          } else if (testState.status === "running" && !isNaN(latestTimestamp)) {
            setLastTimestamp(latestTimestamp);
            if (points.length > 1) {
              const currentData = [...timeSeriesData];
              if (
                currentData.length === 1 &&
                currentData[0].requestsPerSecond === 0 &&
                currentData[0].responseTime === 0
              ) {
                setTimeSeriesData([currentData[0], ...points.slice(-49)]);
              } else {
                setTimeSeriesData(points.slice(-50));
              }
            }
          }
        }
      } catch (error) {
        console.error("Error processing time series history:", error, points);
      }
    });

    return () => {
      unsubscribeTestUpdates();
      unsubscribeTimeSeries();
      unsubscribeTimeSeriesHistory();
    };
  }, [lastTimestamp, timeSeriesData, testState.status, testState.progress, testType]);

  return {
    isConnected,
    activities,
    testState,
    timeSeriesData,
    lastTimestamp,
    connectWebSocket,
    setTestState,
    setActivities,
    setTimeSeriesData,
    setLastTimestamp,
  };
}
