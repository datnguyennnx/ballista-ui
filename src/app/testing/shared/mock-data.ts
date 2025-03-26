import { TestMetrics } from "@/types/index";
import { TimeSeriesPoint } from "../types/time-series";

/**
 * Generates a single mock data point for testing UI
 */
export function generateMockDataPoint(): TimeSeriesPoint {
  const now = Date.now();
  return {
    timestamp: now,
    requests_per_second: Math.floor(Math.random() * 50) + 10, // 10-60 req/s
    average_response_time: Math.floor(Math.random() * 100) + 50, // 50-150ms
    error_rate: Math.random() * 2, // 0-2%
  };
}

/**
 * Generates a complete set of fake test data with realistic patterns
 * @param testType 'load' | 'stress' | 'api' - Adjusts data characteristics for different test types
 */
export function generateFakeTestData(
  testType: "load" | "stress" | "api" = "load",
): TimeSeriesPoint[] {
  // Starting values for our metrics (adjusted per test type)
  let averageResponseTime = testType === "api" ? 40 : testType === "stress" ? 90 : 70;
  let requestsPerSecond = testType === "api" ? 10 : testType === "stress" ? 30 : 20;
  let errorRate = testType === "api" ? 0.2 : testType === "stress" ? 0.8 : 0.5;

  // Number of data points (more for stress test)
  const dataPoints = testType === "stress" ? 50 : 30;

  // Generate data points, one for each second of the "test"
  const now = Date.now();
  return Array.from({ length: dataPoints }).map((_, index) => {
    // Progress as percentage
    const progress = index / dataPoints;

    // Add some randomness but maintain a trend
    const timestamp = now + index * 1000; // 1 second apart

    // Adjust metrics based on test type and progress
    if (testType === "stress") {
      // Stress test - metrics worsen dramatically as progress increases
      const loadFactor = progress < 0.7 ? progress : progress * 2; // Increase load after 70%

      averageResponseTime = Math.max(
        20,
        Math.min(500, averageResponseTime + (Math.random() * 15 - 3) + loadFactor * 10),
      );
      requestsPerSecond = Math.max(5, Math.min(60, requestsPerSecond + (Math.random() * 6 - 3)));
      errorRate =
        progress > 0.8
          ? Math.min(10, errorRate + Math.random() * 2)
          : Math.max(0, errorRate + (Math.random() * 2 - 1));
    } else if (testType === "api") {
      // API test - more consistent metrics
      averageResponseTime = Math.max(
        20,
        Math.min(200, averageResponseTime + (Math.random() * 8 - 4)),
      );
      requestsPerSecond = Math.max(5, Math.min(30, requestsPerSecond + (Math.random() * 4 - 2)));
      errorRate =
        progress > 0.8
          ? Math.min(2, errorRate + Math.random())
          : Math.max(0, errorRate + (Math.random() * 0.4 - 0.3));
    } else {
      // Load test - gradual metric changes
      averageResponseTime = Math.max(
        20,
        Math.min(300, averageResponseTime + (Math.random() * 10 - 3)),
      );
      requestsPerSecond = Math.max(5, Math.min(60, requestsPerSecond + (Math.random() * 6 - 3)));

      // Occasional error spikes for load test
      if (Math.random() > 0.9) {
        errorRate = Math.min(5, errorRate + Math.random() * 2);
      } else {
        errorRate = Math.max(0, errorRate - Math.random() * 0.3);
      }
    }

    return {
      timestamp,
      requests_per_second: requestsPerSecond,
      average_response_time: averageResponseTime,
      error_rate: errorRate,
    };
  });
}

/**
 * Creates test metrics based on a test progress and current time series data
 * @param progress Test progress from 0-100
 * @param dataPoint Current time series data point
 * @param testType Test type to generate appropriate metrics
 */
export function createTestMetrics(
  progress: number,
  dataPoint: TimeSeriesPoint,
  testType: "load" | "stress" | "api" = "load",
): TestMetrics {
  const normalizedProgress = progress / 100;
  const totalRequests = testType === "api" ? 1000 : testType === "stress" ? 10000 : 1000;
  const completedRequests = Math.floor(normalizedProgress * totalRequests);

  // Vary status code distribution based on test type
  let statusCodes: Record<number, number> = {};

  if (testType === "stress") {
    // Stress test - more errors as load increases
    const errorFactor = normalizedProgress > 0.7 ? (normalizedProgress - 0.7) * 3 : 0;
    statusCodes = {
      200: Math.floor(completedRequests * (0.98 - errorFactor)),
      403: Math.floor(completedRequests * 0.01),
      404: Math.floor(completedRequests * 0.005),
      500: Math.floor(completedRequests * (0.005 + errorFactor)),
    };
  } else if (testType === "api") {
    // API test - variety of response codes
    statusCodes = {
      200: Math.floor(completedRequests * 0.9),
      201: Math.floor(completedRequests * 0.03),
      400: Math.floor(completedRequests * 0.01),
      401: Math.floor(completedRequests * 0.005),
      404: Math.floor(completedRequests * 0.005),
      500: Math.floor(completedRequests * 0.05 * dataPoint.error_rate),
    };
  } else {
    // Load test - mostly successful responses
    statusCodes = {
      200: Math.floor(completedRequests * 0.98),
      404: Math.floor(completedRequests * 0.01),
      500: Math.floor(completedRequests * 0.01),
    };
  }

  return {
    requests_completed: completedRequests,
    total_requests: totalRequests,
    average_response_time: dataPoint.average_response_time,
    min_response_time: dataPoint.average_response_time * 0.5,
    max_response_time: dataPoint.average_response_time * 2,
    error_rate: dataPoint.error_rate,
    requests_per_second: dataPoint.requests_per_second,
    status_codes: statusCodes,
  };
}
