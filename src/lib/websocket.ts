import { TestUpdate } from "@/types/index";

type MessageHandler = (update: TestUpdate) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;
  private messageHandlers: Set<MessageHandler> = new Set();

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001/ws"}`);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onclose = () => {
          this.handleDisconnect();
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const update = JSON.parse(event.data) as TestUpdate;
            this.messageHandlers.forEach((handler) => handler(update));
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectTimeout * this.reconnectAttempts);
    }
  }

  subscribe(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsClient = new WebSocketClient();
