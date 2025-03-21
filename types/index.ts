// Test Types
export enum TestType {
    Load = 'Load',
    Stress = 'Stress',
    Api = 'Api',
}

export enum TestStatus {
    Started = 'Started',
    Running = 'Running',
    Completed = 'Completed',
    Error = 'Error',
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
    avg_response_time: number;
    min_response_time?: number;
    max_response_time?: number;
    median_response_time?: number;
    p95_response_time?: number;
    status_codes: Record<number, number>;
    errors: number;
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

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
} 