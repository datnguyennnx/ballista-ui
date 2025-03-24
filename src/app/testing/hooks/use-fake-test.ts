import { useState, useEffect } from "react";
import { TestState } from "../types/test-types";
import { TimeSeriesPoint } from "../types/time-series";
import { generateFakeTestData, createTestMetrics } from "../shared/mock-data";
import { LoadConfigType } from "../types/test-types";

export function useFakeTest(testType: "load" | "stress") {
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

  const runFakeTest = (
    setTestState: (state: TestState) => void,
    setTimeSeriesData: React.Dispatch<React.SetStateAction<TimeSeriesPoint[]>>,
    setActivities: React.Dispatch<React.SetStateAction<string[]>>,
    config: LoadConfigType,
  ) => {
    if (isFakeTestRunning) return;

    setIsFakeTestRunning(true);
    setTimeSeriesData([]);
    setTestState({ progress: 0, status: "running" });

    // Clear previous activities and add initial activity
    setActivities([
      `${testType === "load" ? "🔄" : "⚡"} ${testType.charAt(0).toUpperCase() + testType.slice(1)} Test: 0% - Started`,
      `Target URL: ${config.target_url}`,
      `Duration: ${config.duration}s, Ramp-up: ${config.rampUp}s`,
    ]);

    // Generate all data points upfront
    const fakeData = generateFakeTestData(testType);
    const totalPoints = fakeData.length;
    let currentIndex = 0;

    // Update at regular intervals to simulate real-time data
    const interval = setInterval(() => {
      if (currentIndex >= totalPoints) {
        clearInterval(interval);
        setFakeTestInterval(null);

        const finalMetrics = {
          requests_completed: testType === "load" ? 1000 : 10000,
          total_requests: testType === "load" ? 1000 : 10000,
          avg_response_time: fakeData[totalPoints - 1].responseTime,
          min_response_time: fakeData[totalPoints - 1].responseTime * 0.5,
          max_response_time: fakeData[totalPoints - 1].responseTime * 2,
          median_response_time: fakeData[totalPoints - 1].responseTime * 0.8,
          p95_response_time: fakeData[totalPoints - 1].responseTime * 1.5,
          status_codes:
            testType === "load"
              ? { 200: 980, 404: 10, 500: 10 }
              : { 200: 9800, 404: 100, 500: 100 },
          errors: Math.floor(fakeData[totalPoints - 1].errorRate * 10),
        };

        setTestState({
          progress: 100,
          status: "completed",
          metrics: finalMetrics,
        });

        // Add detailed completion activities
        setActivities((prev: string[]) => [
          `${testType === "load" ? "✅" : "🎉"} ${testType.charAt(0).toUpperCase() + testType.slice(1)} Test: 100% - Completed`,
          `Results: ${finalMetrics.requests_completed} requests, ${finalMetrics.errors} errors`,
          `Avg Response Time: ${Math.round(finalMetrics.avg_response_time)}ms`,
          `Success Rate: ${(((finalMetrics.requests_completed - finalMetrics.errors) / finalMetrics.requests_completed) * 100).toFixed(1)}%`,
          ...prev.slice(0, 1),
        ]);

        setIsFakeTestRunning(false);
        return;
      }

      // Add the next data point
      const dataPoint = fakeData[currentIndex];
      setTimeSeriesData((prev: TimeSeriesPoint[]) => [...prev, dataPoint]);

      // Update progress based on current index
      const progress = Math.min(99, Math.floor((currentIndex / totalPoints) * 100));

      // Update metrics based on current state
      const currentMetrics = createTestMetrics(progress, dataPoint, testType);

      setTestState({
        progress,
        status: "running",
        metrics: currentMetrics,
      });

      // Add detailed progress updates at key milestones
      if (progress % 25 === 0 && progress > 0) {
        const currentRPS = Math.round(dataPoint.requestsPerSecond);
        const currentRT = Math.round(dataPoint.responseTime);
        const currentErrors = Math.round(dataPoint.errorRate * 100);

        setActivities((prev: string[]) => [
          `${testType === "load" ? "🔄" : "⚡"} ${testType.charAt(0).toUpperCase() + testType.slice(1)} Test: ${progress}% - Running`,
          `Current RPS: ${currentRPS}, Response Time: ${currentRT}ms`,
          `Error Rate: ${currentErrors}%`,
          ...prev.slice(0, 2),
        ]);
      }

      currentIndex++;
    }, 1000);

    setFakeTestInterval(interval);
  };

  return {
    isFakeTestRunning,
    runFakeTest,
  };
}
