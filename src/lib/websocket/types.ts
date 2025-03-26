import { TestUpdate, TestMetrics } from "@/types/index";
import { TimeSeriesPoint } from "@/app/testing/types/time-series";

// Define the different types of WebSocket messages
export type WebSocketMessage =
  | { type: "test_update"; data: TestUpdate }
  | { type: "time_series"; data: TimeSeriesPoint }
  | { type: "time_series_history"; data: TimeSeriesPoint[] }
  | { type: "metrics_update"; data: TestMetrics };

// Connection states with more granularity
export enum ConnectionState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  UNSTABLE = "unstable",
}

// Handler type for each message type
export type TestUpdateHandler = (data: TestUpdate) => void;
export type TimeSeriesHandler = (data: TimeSeriesPoint) => void;
export type TimeSeriesHistoryHandler = (data: TimeSeriesPoint[]) => void;
export type MetricsUpdateHandler = (data: TestMetrics) => void;
export type ConnectionStateHandler = (state: ConnectionState, reconnectAttempts?: number) => void;

// Subscription type for new message handling system
export interface Subscription {
  unsubscribe: () => void;
  messageType?: string;
  callback?: (message: WebSocketMessage) => void;
}
