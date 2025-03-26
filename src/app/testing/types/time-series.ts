export interface TimeSeriesPoint {
  timestamp: number;
  requests_per_second: number;
  average_response_time: number;
  error_rate: number;
  concurrentUsers?: number; // Optional field for enhanced data
}

// Helper function to ensure consistent property names and types
export function createTimeSeriesPoint(
  timestamp: number = Date.now(),
  requestsPerSecond: number = 0,
  averageResponseTime: number = 0,
  errorRate: number = 0,
): TimeSeriesPoint {
  return {
    timestamp,
    requests_per_second: requestsPerSecond,
    average_response_time: averageResponseTime,
    error_rate: errorRate,
  };
}

// For chart display
export interface ChartData {
  timestamps: number[];
  throughput: number[];
  responseTime: number[];
  errorRate: number[];
}

// Convert time series points to chart data
export function convertToChartData(points: TimeSeriesPoint[]): ChartData {
  return {
    timestamps: points.map((p) => p.timestamp),
    throughput: points.map((p) => p.requests_per_second),
    responseTime: points.map((p) => p.average_response_time),
    errorRate: points.map((p) => p.error_rate),
  };
}

export interface TimeSeriesData {
  timestamps: number[];
  responseTime: number[];
  throughput: number[];
  errorRate: number[];
}
