import {
  ConnectionState,
  TestUpdateHandler,
  TimeSeriesHandler,
  TimeSeriesHistoryHandler,
  ConnectionStateHandler,
  Subscription,
  WebSocketMessage,
  MetricsUpdateHandler,
} from "./types";

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: NodeJS.Timeout | undefined = undefined;
  private connectionStateHandlers: Set<ConnectionStateHandler> = new Set();
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private connectionStateDebounceTimer: NodeJS.Timeout | null = null;
  private stateChangeDebounceTime = 300; // Debounce time in ms for UI updates
  private pendingReconnect = false;
  private reconnectDelay = 1000;
  // Add heartbeat timer for connection health checks
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastHeartbeatResponse: number = Date.now();
  private heartbeatMissed = 0;
  private heartbeatTimeout = 30000; // 30 seconds timeout
  private heartbeatIntervalTime = 15000; // 15 seconds interval

  // For new subscription model
  private subscribers: Subscription[] = [];
  private subscriptions: Subscription[] = [];

  // Separate handlers for different message types
  private testUpdateHandlers: Set<TestUpdateHandler> = new Set();
  private timeSeriesHandlers: Set<TimeSeriesHandler> = new Set();
  private timeSeriesHistoryHandlers: Set<TimeSeriesHistoryHandler> = new Set();
  private metricsUpdateHandlers: Set<MetricsUpdateHandler> = new Set();
  // Message queue for storing messages during disconnection
  private messageQueue: WebSocketMessage[] = [];
  private maxQueueSize = 50;

  constructor(private url: string) {}

  connect(): Promise<void> {
    if (
      this.connectionState === ConnectionState.CONNECTED ||
      this.connectionState === ConnectionState.CONNECTING
    ) {
      if (this.connectionState === ConnectionState.CONNECTED) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          if (this.connectionState === ConnectionState.CONNECTED) {
            resolve();
          } else if (this.connectionState === ConnectionState.DISCONNECTED) {
            reject();
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        setTimeout(checkConnection, 100);
      });
    }

    this.setConnectionState(ConnectionState.CONNECTING);

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001/ws";
        this.ws = new WebSocket(wsUrl);

        // Set a connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.connectionState !== ConnectionState.CONNECTED) {
            this.ws?.close();
            this.setConnectionState(ConnectionState.DISCONNECTED);
            reject();
          }
        }, 5000);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          this.handleConnectionOpen();
          resolve();
        };

        this.ws.onclose = () => {
          clearTimeout(connectionTimeout);
          this.stopHeartbeat();

          if (this.connectionState === ConnectionState.DISCONNECTED) {
            return;
          }
          this.handleDisconnect();
        };

        this.ws.onerror = () => {
          clearTimeout(connectionTimeout);
          this.stopHeartbeat();

          if (this.connectionState === ConnectionState.CONNECTING) {
            this.setConnectionState(ConnectionState.DISCONNECTED);
            reject();
          } else {
            this.handleDisconnect();
          }
        };

        this.ws.onmessage = this.handleMessage.bind(this);
      } catch {
        this.setConnectionState(ConnectionState.DISCONNECTED);
        reject();
      }
    });
  }

  private handleMessage = (event: MessageEvent) => {
    if (typeof event.data === "string") {
      // Handle heartbeat messages
      if (event.data === "pong") {
        this.lastHeartbeatResponse = Date.now();
        this.heartbeatMissed = 0;
        return;
      }

      if (event.data === "ping") {
        this.sendRaw("pong");
        return;
      }

      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.debug("WS received message:", message.type);

        switch (message.type) {
          case "test_update":
            this.testUpdateHandlers.forEach((handler) => handler(message.data));
            break;
          case "time_series":
            this.timeSeriesHandlers.forEach((handler) => handler(message.data));
            break;
          case "time_series_history":
            this.timeSeriesHistoryHandlers.forEach((handler) => handler(message.data));
            break;
          case "metrics_update":
            this.metricsUpdateHandlers.forEach((handler) => handler(message.data));
            break;
          default:
            this.subscribers.forEach((subscriber) => {
              const wsMessage = message as { type: string };
              if (subscriber.messageType === wsMessage.type && subscriber.callback) {
                subscriber.callback(message);
              }
            });
        }
      } catch {
        // Silently ignore message parsing errors
        return;
      }
    }
  };

  // Send raw string message
  private sendRaw(message: string): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      this.ws.send(message);
      return true;
    } catch {
      // Silently handle send errors
      return false;
    }
  }

  // Start heartbeat to detect connection issues
  private startHeartbeat() {
    this.stopHeartbeat();
    this.lastHeartbeatResponse = Date.now();
    this.heartbeatMissed = 0;

    this.heartbeatInterval = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.stopHeartbeat();
        return;
      }

      // Check if we've received a response to our last heartbeat
      const elapsed = Date.now() - this.lastHeartbeatResponse;
      if (elapsed > 30000) {
        // 30 seconds without response
        this.heartbeatMissed++;

        if (this.heartbeatMissed >= 2) {
          this.reconnect();
          return;
        }
      }

      // Send heartbeat
      this.sendRaw("ping");
    }, 15000); // Send heartbeat every 15 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Force reconnection
  reconnect(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // Ignore errors when closing
      }
      this.ws = null;
    }

    this.stopHeartbeat();
    this.handleDisconnect();
  }

  handleConnectionOpen() {
    this.reconnectAttempts = 0;
    this.pendingReconnect = false;
    this.setConnectionState(ConnectionState.CONNECTED);

    // Start heartbeat mechanism
    this.startHeartbeat();

    // Request time series history when connection is established
    this.requestTimeSeriesHistory();

    // Resubscribe to all subscriptions
    this.subscriptions.forEach((subscription) => {
      this.sendSubscription(subscription);
    });

    // Process any messages that were queued during disconnection
    this.processQueuedMessages();
  }

  // Process messages queued during disconnection
  private processQueuedMessages() {
    if (this.messageQueue.length === 0) return;

    console.log(`Processing ${this.messageQueue.length} queued messages`);

    // Take a copy of the queue and clear it
    const queue = [...this.messageQueue];
    this.messageQueue = [];

    // Process each message
    queue.forEach((msg) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify(msg));
        } catch (error) {
          console.error("Failed to send queued message:", error);
        }
      }
    });
  }

  // Queue a message for sending when connection is restored
  queueMessage(message: unknown): boolean {
    // Add to queue if not connected
    this.messageQueue.push(message as WebSocketMessage);

    // Limit queue size to prevent memory issues
    if (this.messageQueue.length > this.maxQueueSize) {
      this.messageQueue.shift(); // Remove oldest message
    }

    return false;
  }

  sendSubscription(subscription: Subscription) {
    // Method to send subscription to server
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(subscription));
        return true;
      } catch (error) {
        console.error("Error sending subscription:", error);
        this.queueMessage(subscription);
        return false;
      }
    } else {
      // Queue the subscription for when we reconnect
      this.queueMessage(subscription);
      return false;
    }
  }

  handleDisconnect() {
    if (this.connectionState === ConnectionState.DISCONNECTED) {
      return;
    }

    console.log("WebSocket disconnected, scheduling reconnect");
    this.setConnectionState(ConnectionState.DISCONNECTED);
    this.stopHeartbeat();

    // Close WebSocket if it's still open
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // Ignore errors when closing
      }
      this.ws = null;
    }

    // Attempt to reconnect after a delay, with exponential backoff
    if (!this.reconnectTimeout && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(
        this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1),
        30000,
      );

      console.log(
        `Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`,
      );

      this.reconnectTimeout = setTimeout(() => {
        this.reconnectTimeout = undefined;
        if (this.connectionState === ConnectionState.DISCONNECTED) {
          console.log("Attempting to reconnect WebSocket");
          this.setConnectionState(ConnectionState.CONNECTING, this.reconnectAttempts);
          this.connect().catch((error) => {
            console.error("Reconnection failed:", error);
          });
        }
      }, delay);
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Maximum reconnection attempts reached, giving up");
      // Reset reconnect attempts after a longer timeout to allow future attempts
      setTimeout(() => {
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      }, 60000); // Reset after 1 minute
    }
  }

  // Improved message sending with queuing for offline/reconnecting scenarios
  send(message: unknown): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // Queue message for later if not connected
      this.queueMessage(message);
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      this.queueMessage(message);
      return false;
    }
  }

  // Set connection state with debounce for UI updates
  private setConnectionState(newState: ConnectionState, reconnectAttempts?: number): void {
    if (this.connectionState === newState) return;

    // Clear any pending debounce timer
    if (this.connectionStateDebounceTimer) {
      clearTimeout(this.connectionStateDebounceTimer);
      this.connectionStateDebounceTimer = null;
    }

    // Debounce state changes to avoid UI flicker
    this.connectionStateDebounceTimer = setTimeout(() => {
      this.connectionState = newState;

      // Notify all handlers of the state change
      this.connectionStateHandlers.forEach((handler) => {
        try {
          handler(newState, reconnectAttempts);
        } catch (err) {
          console.error("Error in connection state handler:", err);
        }
      });

      this.connectionStateDebounceTimer = null;
    }, this.stateChangeDebounceTime);
  }

  // Check if connected
  isConnectedState(): boolean {
    return this.connectionState === ConnectionState.CONNECTED;
  }

  // Check if the actual WebSocket connection is active
  isWebSocketOpen(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // Add a connection stability check method
  async checkConnectionStability(): Promise<boolean> {
    if (!this.isWebSocketOpen()) {
      return false;
    }

    let pingSuccess = false;

    try {
      // Set up a promise that resolves when we receive a pong
      const pongPromise = new Promise<boolean>((resolve) => {
        const handler = (event: MessageEvent) => {
          if (typeof event.data === "string" && event.data === "pong") {
            // Remove the handler to avoid memory leaks
            if (this.ws) {
              this.ws.removeEventListener("message", handler);
            }
            resolve(true);
          }
        };

        // Add a temporary event listener for the pong response
        if (this.ws) {
          this.ws.addEventListener("message", handler);
        }

        // Set a timeout to resolve with false if no pong is received
        setTimeout(() => {
          if (this.ws) {
            this.ws.removeEventListener("message", handler);
          }
          resolve(false);
        }, 5000);
      });

      // Send ping
      if (this.ws) {
        this.ws.send("ping");
      }

      // Wait for pong response
      pingSuccess = await pongPromise;
    } catch (error) {
      console.error("Error checking connection stability:", error);
      pingSuccess = false;
    }

    // If ping failed but we still think we're connected, update the state
    if (!pingSuccess && this.connectionState === ConnectionState.CONNECTED) {
      this.setConnectionState(ConnectionState.UNSTABLE);
      // Try to reconnect
      this.reconnect();
    } else if (pingSuccess && this.connectionState === ConnectionState.UNSTABLE) {
      // If ping succeeded but we thought connection was unstable, update state
      this.setConnectionState(ConnectionState.CONNECTED);
    }

    return pingSuccess;
  }

  // Reset the connection state and attempt to reconnect cleanly
  async resetAndReconnect(): Promise<void> {
    // Close any existing connection
    if (this.ws !== null) {
      try {
        this.ws.close();
      } catch {
        // Ignore errors
      }
      this.ws = null;
    }

    // Clear any pending reconnection attempts
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    // Reset counters
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    this.heartbeatMissed = 0;
    this.stopHeartbeat();

    // Clear message queue to avoid sending stale messages
    this.messageQueue = [];

    // Set state to connecting
    this.setConnectionState(ConnectionState.CONNECTING);

    // Attempt to connect
    return this.connect();
  }

  // Get current connection state
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  // Subscribe to different message types
  subscribeToTestUpdates(handler: TestUpdateHandler): () => void {
    this.testUpdateHandlers.add(handler);
    return () => this.testUpdateHandlers.delete(handler);
  }

  subscribeToTimeSeries(handler: TimeSeriesHandler): () => void {
    this.timeSeriesHandlers.add(handler);
    return () => this.timeSeriesHandlers.delete(handler);
  }

  subscribeToTimeSeriesHistory(handler: TimeSeriesHistoryHandler): () => void {
    this.timeSeriesHistoryHandlers.add(handler);
    return () => this.timeSeriesHistoryHandlers.delete(handler);
  }

  subscribeToConnectionState(handler: ConnectionStateHandler): () => void {
    this.connectionStateHandlers.add(handler);
    // Immediately call with current state
    handler(this.connectionState);
    return () => this.connectionStateHandlers.delete(handler);
  }

  // For backward compatibility
  subscribe(handler: TestUpdateHandler): () => void {
    return this.subscribeToTestUpdates(handler);
  }

  requestTimeSeriesHistory() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send("get_time_series");
    }
  }

  disconnect(): void {
    // Stop reconnection attempts
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    this.stopHeartbeat();

    // Clear message queue since we're intentionally disconnecting
    this.messageQueue = [];

    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // Ignore errors when closing
      }
      this.ws = null;
    }

    this.setConnectionState(ConnectionState.DISCONNECTED);
  }

  // Add a method to get the maximum reconnect attempts
  getMaxReconnectAttempts(): number {
    return this.maxReconnectAttempts;
  }

  // Add new subscription methods
  onMetricsUpdate(handler: MetricsUpdateHandler): Subscription {
    this.metricsUpdateHandlers.add(handler);
    return {
      unsubscribe: () => this.metricsUpdateHandlers.delete(handler),
    };
  }
}
