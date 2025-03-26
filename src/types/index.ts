// Test Types
export enum TestType {
  Load = "Load",
  Stress = "Stress",
  Api = "Api",
}

export enum TestStatus {
  Pending = "pending",
  Started = "started",
  Running = "running",
  Completed = "completed",
  Error = "error",
}

// Test Configurations
export interface LoadTestConfig {
  target_url: string;
  num_requests: number;
  concurrency: number;
}

export interface StressTestConfig {
  target_url: string;
  duration_secs: number;
  concurrency: number;
}

export interface ApiTestConfig {
  target_url: string;
  test_suite_path: string;
}

// Test Results and Updates
export interface TestMetrics {
  requests_completed: number;
  total_requests: number;
  average_response_time: number;
  min_response_time: number;
  max_response_time: number;
  error_rate: number;
  requests_per_second: number;
  status_codes: Record<number, number>; // Maps status code to count
}

export interface TestResult {
  id: string;
  test_type: TestType;
  status: TestStatus;
  metrics?: TestMetrics;
  error?: string;
  timestamp: number;
}

export interface TestUpdate {
  id: string;
  test_type: TestType;
  status: TestStatus;
  progress: number;
  metrics?: TestMetrics;
  error?: string;
  timestamp: number;
}

export interface TestState {
  progress: number;
  metrics?: TestMetrics;
  status: TestStatus;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}
