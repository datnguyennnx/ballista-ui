import { TimeSeriesPoint, TimeSeriesData } from "../types/time-series";

/**
 * Convert TimeSeriesPoint array to the TimeSeriesData format needed by MetricsDashboard
 */
export const mapTimeSeriesData = (data: TimeSeriesPoint[]): TimeSeriesData => {
  if (!data || data.length === 0) {
    return {
      timestamps: [],
      responseTime: [],
      throughput: [],
      errorRate: [],
    };
  }

  return {
    timestamps: data.map((point) => point.timestamp),
    responseTime: data.map((point) => point.average_response_time),
    throughput: data.map((point) => point.requests_per_second),
    errorRate: data.map((point) => point.error_rate),
  };
};

/**
 * Convert a single TimeSeriesPoint to TimeSeriesData format
 */
export const mapSingleTimeSeriesPoint = (point: TimeSeriesPoint): TimeSeriesData => {
  return {
    timestamps: [point.timestamp],
    responseTime: [point.average_response_time],
    throughput: [point.requests_per_second],
    errorRate: [point.error_rate],
  };
};

/**
 * Convert backend TestMetrics to TimeSeriesPoint format
 */
export const mapTestMetricsToTimeSeriesPoint = (
  metrics: {
    requests_completed: number;
    total_requests: number;
    average_response_time: number;
    error_rate: number;
    requests_per_second: number;
  },
  timestamp: number = Date.now(),
): TimeSeriesPoint => {
  return {
    timestamp,
    requests_per_second: metrics.requests_per_second,
    average_response_time: metrics.average_response_time,
    error_rate: metrics.error_rate,
  };
};

/**
 * Convert backend TestMetrics array to TimeSeriesData format
 */
export const mapTestMetricsArrayToTimeSeriesData = (
  metrics: Array<{
    requests_completed: number;
    total_requests: number;
    average_response_time: number;
    error_rate: number;
    requests_per_second: number;
  }>,
  timestamps: number[] = metrics.map(() => Date.now()),
): TimeSeriesData => {
  if (!metrics || metrics.length === 0) {
    return {
      timestamps: [],
      responseTime: [],
      throughput: [],
      errorRate: [],
    };
  }

  return {
    timestamps,
    responseTime: metrics.map((m) => m.average_response_time),
    throughput: metrics.map((m) => m.requests_per_second),
    errorRate: metrics.map((m) => m.error_rate),
  };
};
