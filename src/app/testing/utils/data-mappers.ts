import { TimeSeriesPoint } from "../types/time-series";
import { TimeSeriesData } from "../components/metrics-dashboard";

/**
 * Convert TimeSeriesPoint array to the TimeSeriesData format needed by MetricsDashboard
 */
export const mapTimeSeriesData = (data: TimeSeriesPoint[]): TimeSeriesData => {
  if (!data || data.length === 0) {
    return {
      responseTime: [],
      throughput: [],
      concurrentUsers: [],
      errorRate: [],
    };
  }

  return {
    responseTime: data.map((point) => ({
      timestamp: point.timestamp,
      value: point.responseTime,
    })),
    throughput: data.map((point) => ({
      timestamp: point.timestamp,
      value: point.requestsPerSecond,
    })),
    // Since TimeSeriesPoint doesn't have concurrentUsers,
    // we calculate a simulated value based on throughput
    concurrentUsers: data.map((point) => ({
      timestamp: point.timestamp,
      value: Math.floor(point.requestsPerSecond * (Math.random() * 2 + 3)), // simulate users based on throughput
    })),
    errorRate: data.map((point) => ({
      timestamp: point.timestamp,
      value: point.errorRate,
    })),
  };
};
