import { useState, useEffect } from "react";
import { TestUpdate, TestType, TestStatus } from "@/types/index";
import { TimeSeriesPoint } from "../types/time-series";
import { TestState } from "../types/test-types";
import { generateFakeTestData, createTestMetrics } from "../shared/mock-data";
import { LoadConfigType } from "../types/test-types";

const defaultConfig: LoadConfigType = {
  url: "https://api.example.com/test",
  method: "GET",
  duration: 60,
  rampUp: 10,
  concurrentUsers: 100,
  thinkTime: 200,
  headers: {},
  followRedirects: true,
};

export function useLoadTest() {
  const [loadTest, setLoadTest] = useState<TestState>({ progress: 0, status: "idle" });
  const [activities, setActivities] = useState<string[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[]>([]);
  const [lastTimestamp, setLastTimestamp] = useState<number>(0);
  const [isFakeTestRunning, setIsFakeTestRunning] = useState(false);
  const [loadConfig, setLoadConfig] = useState<LoadConfigType>(defaultConfig);
  const [fakeTestInterval, setFakeTestInterval] = useState<NodeJS.Timeout | null>(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (fakeTestInterval) {
        clearInterval(fakeTestInterval);
      }
    };
  }, [fakeTestInterval]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001/ws");

    ws.onmessage = (event) => {
      try {
        const update: TestUpdate = JSON.parse(event.data);

        if (update.test_type === TestType.Load) {
          const activity = `${update.status === TestStatus.Completed ? "✅" : "🔄"} Load Test: ${update.progress.toFixed(0)}% - ${update.status}`;
          setActivities((prev) => [activity, ...prev].slice(0, 4));

          setLoadTest({
            progress: update.progress,
            metrics: update.metrics,
            status: update.status,
          });

          // Add time series data point if we have metrics
          if (update.metrics && update.timestamp > lastTimestamp) {
            setLastTimestamp(update.timestamp);

            // Calculate requests per second
            const requestsPerSecond =
              (update.metrics.requests_completed /
                (update.timestamp - (timeSeriesData[0]?.timestamp || update.timestamp))) *
              1000;

            // Calculate error rate
            const errorRate =
              (update.metrics.errors / update.metrics.requests_completed) * 100 || 0;

            const newPoint: TimeSeriesPoint = {
              timestamp: update.timestamp,
              responseTime: update.metrics.avg_response_time,
              requestsPerSecond,
              errorRate,
            };

            setTimeSeriesData((prev) => [...prev, newPoint].slice(-20)); // Keep last 20 points
          }
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    return () => ws.close();
  }, [lastTimestamp, timeSeriesData]);

  const startTest = async () => {
    try {
      // Reset test state
      setLoadTest({
        progress: 0,
        status: "starting",
        metrics: loadTest.metrics,
      });

      setActivities(["Preparing load test..."]);

      // Convert from LoadConfigType to the API's expected format
      const apiConfigData = {
        url: loadConfig.url,
        requests: loadConfig.concurrentUsers * 10, // Example conversion
        concurrency: loadConfig.concurrentUsers,
        method: loadConfig.method,
        duration: loadConfig.duration,
        headers: loadConfig.headers,
      };

      const response = await fetch(`/api/load-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiConfigData),
      });
      const data = await response.json();
      console.log("Load test started:", data);

      // Reset time series data when starting a new test
      setTimeSeriesData([]);
      setLastTimestamp(0);
    } catch (error) {
      console.error("Failed to start load test:", error);
      setActivities((prev) =>
        ["❌ Failed to start load test: Invalid configuration", ...prev].slice(0, 4),
      );
    }
  };

  // Function to run a simulated test with fake data
  const runFakeTest = () => {
    if (isFakeTestRunning) return;

    setIsFakeTestRunning(true);
    setTimeSeriesData([]);
    setLoadTest({ progress: 0, status: "running" });

    // Add initial activity
    setActivities(["🔄 Load Test: 0% - Started"]);

    // Generate all data points upfront
    const fakeData = generateFakeTestData("load");
    const totalPoints = fakeData.length;
    let currentIndex = 0;

    // Update at regular intervals to simulate real-time data
    const interval = setInterval(() => {
      if (currentIndex >= totalPoints) {
        clearInterval(interval);
        setFakeTestInterval(null);
        setLoadTest({
          progress: 100,
          status: "completed",
          metrics: {
            requests_completed: 1000,
            total_requests: 1000,
            avg_response_time: fakeData[totalPoints - 1].responseTime,
            min_response_time: fakeData[totalPoints - 1].responseTime * 0.5,
            max_response_time: fakeData[totalPoints - 1].responseTime * 2,
            median_response_time: fakeData[totalPoints - 1].responseTime * 0.8,
            p95_response_time: fakeData[totalPoints - 1].responseTime * 1.5,
            status_codes: { 200: 980, 404: 10, 500: 10 },
            errors: Math.floor(fakeData[totalPoints - 1].errorRate * 10),
          },
        });

        // Add completion activity
        setActivities((prev) => ["✅ Load Test: 100% - Completed", ...prev].slice(0, 4));

        setIsFakeTestRunning(false);
        return;
      }

      // Add the next data point
      const dataPoint = fakeData[currentIndex];
      setTimeSeriesData((prev) => [...prev, dataPoint]);

      // Update progress based on current index
      const progress = Math.min(99, Math.floor((currentIndex / totalPoints) * 100));

      // Update metrics based on current state
      const currentMetrics = createTestMetrics(progress, dataPoint, "load");

      setLoadTest({
        progress,
        status: "running",
        metrics: currentMetrics,
      });

      // Add progress update activity every 25%
      if (progress % 25 === 0 && progress > 0) {
        setActivities((prev) => [`🔄 Load Test: ${progress}% - Running`, ...prev].slice(0, 4));
      }

      currentIndex++;
    }, 1000);

    setFakeTestInterval(interval);
  };

  return {
    loadTest,
    activities,
    timeSeriesData,
    isFakeTestRunning,
    loadConfig,
    setLoadConfig,
    startTest,
    runFakeTest,
  };
}
