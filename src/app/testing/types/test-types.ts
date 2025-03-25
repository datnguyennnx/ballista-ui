import { TestMetrics } from "@/types/index";

/**
 * Load test state interface
 */
export interface TestState {
  progress: number;
  metrics?: TestMetrics;
  status: string;
}

/**
 * Load configuration interface
 */
export interface LoadConfigType {
  target_url: string;
  method: string;
  duration: number;
  rampUp: number;
  concurrentUsers: number;
  headers: Record<string, string>;
  body?: string;
  followRedirects: boolean;
}
