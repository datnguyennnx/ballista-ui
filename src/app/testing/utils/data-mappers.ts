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
