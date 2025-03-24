"use client";

import React, { useEffect, useState } from "react";
import { ConnectionState, wsClient, ConnectionStateHandler } from "@/lib/websocket";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, RefreshCw, WifiOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export function ConnectionStatus() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED,
  );
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);

  useEffect(() => {
    const connectionStateHandler: ConnectionStateHandler = (state, attempts) => {
      setConnectionState(state);
      if (attempts !== undefined) {
        setReconnectAttempts(attempts);
      }
      setIsReconnecting(state === ConnectionState.CONNECTING && (attempts || 0) > 0);
    };

    const unsubscribe = wsClient.subscribeToConnectionState(connectionStateHandler);

    return () => {
      unsubscribe();
    };
  }, []);

  const getStatusColor = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return "bg-green-500";
      case ConnectionState.CONNECTING:
        return "bg-amber-500 animate-pulse";
      case ConnectionState.UNSTABLE:
        return "bg-amber-500 animate-pulse";
      case ConnectionState.DISCONNECTED:
      default:
        return "bg-red-500";
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return "Connected";
      case ConnectionState.CONNECTING:
        return isReconnecting ? `Reconnecting (${reconnectAttempts})...` : "Connecting...";
      case ConnectionState.UNSTABLE:
        return "Unstable";
      case ConnectionState.DISCONNECTED:
      default:
        return "Not connected";
    }
  };

  const getStatusIcon = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case ConnectionState.CONNECTING:
        return <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />;
      case ConnectionState.UNSTABLE:
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case ConnectionState.DISCONNECTED:
      default:
        return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  const handleManualReconnect = () => {
    if (connectionState === ConnectionState.DISCONNECTED) {
      wsClient.connect().catch((err) => {
        console.error("Manual reconnection failed:", err);
      });
    }
  };

  const getTooltipText = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return "WebSocket connection established. Real-time updates are active.";
      case ConnectionState.CONNECTING:
        return isReconnecting
          ? `Attempting to reconnect (${reconnectAttempts}/${wsClient.getMaxReconnectAttempts()}). Please wait...`
          : "Establishing WebSocket connection. Please wait...";
      case ConnectionState.UNSTABLE:
        return "Connection is unstable. Some updates may be delayed.";
      case ConnectionState.DISCONNECTED:
      default:
        return reconnectAttempts >= wsClient.getMaxReconnectAttempts()
          ? "Connection failed after multiple attempts. Click to try again."
          : "WebSocket disconnected. Click to reconnect.";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex items-center space-x-2 rounded-md transition-all duration-300",
                connectionState === ConnectionState.DISCONNECTED && "hover:bg-red-100",
                connectionState === ConnectionState.CONNECTED && "hover:bg-green-100",
                connectionState === ConnectionState.CONNECTING && "hover:bg-amber-100",
                connectionState === ConnectionState.UNSTABLE && "hover:bg-amber-100",
              )}
              onClick={handleManualReconnect}
              disabled={connectionState === ConnectionState.CONNECTING}
            >
              {getStatusIcon()}
              <div
                className={cn(
                  "h-2 w-2 rounded-full transition-colors duration-500",
                  getStatusColor(),
                )}
              />
              <span className="text-sm font-medium transition-colors duration-300">
                {getStatusText()}
              </span>
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
