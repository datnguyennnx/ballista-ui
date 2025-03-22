export interface TimeSeriesPoint {
  timestamp: number;
  responseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  concurrentUsers?: number;
}

export interface TimeSeriesData {
  timestamps: number[];
  responseTime: number[];
  throughput: number[];
  concurrentUsers: number[];
  errorRate: number[];
}
