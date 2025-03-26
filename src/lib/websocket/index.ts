export * from "./types";
export { WebSocketClient } from "./client";

// Create and export a singleton instance
import { WebSocketClient } from "./client";
export const wsClient = new WebSocketClient(
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001/ws",
);
