"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, HelpCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TestState, LoadConfigType } from "../types/test-types";
import { Textarea } from "@/components/ui/textarea";
import { wsClient } from "@/lib/websocket";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TestConfigProps {
  loadConfig: LoadConfigType;
  setLoadConfig: (config: LoadConfigType) => void;
  startTest: () => void;
  loadTest: TestState;
  isFakeTestRunning: boolean;
  testType?: "load" | "stress" | "api";
}
export function TestConfig({
  loadConfig,
  setLoadConfig,
  startTest,
  loadTest,
  isFakeTestRunning,
  testType = "load",
}: TestConfigProps) {
  const isRunning = loadTest.status === "running" || isFakeTestRunning;
  const [isStarting, setIsStarting] = useState(false);
  const [headersString, setHeadersString] = useState<string>("{}");
  const [bodyString, setBodyString] = useState<string>("{}");
  const [connecting, setConnecting] = useState(false);

  const updateConfig = (key: keyof LoadConfigType, value: unknown) => {
    setLoadConfig({
      ...loadConfig,
      [key]: value,
    });
  };

  const updateHeaders = (headersJson: string) => {
    try {
      const headers = JSON.parse(headersJson);
      updateConfig("headers", headers);
      setHeadersString(headersJson);
    } catch {
      setHeadersString(headersJson);
    }
  };

  const updateBody = (bodyJson: string) => {
    try {
      const body = JSON.parse(bodyJson);
      updateConfig("body", body);
      setBodyString(bodyJson);
    } catch {
      setBodyString(bodyJson);
    }
  };

  const handleStartTest = async () => {
    if (isRunning) return;
    setIsStarting(true);

    try {
      // Connect to WebSocket first to ensure streaming connection is established
      try {
        setConnecting(true);
        // Only connect if not already connected
        if (!wsClient.isConnectedState()) {
          console.log("Establishing WebSocket connection before starting test...");
          try {
            await wsClient.connect();

            // Wait longer for the WebSocket to fully connect and stabilize
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Request time series history to initialize charts
            wsClient.requestTimeSeriesHistory();

            console.log("WebSocket connection established successfully");
          } catch (err) {
            console.warn("WebSocket connection failed, continuing with test anyway:", err);
            // We'll continue with the test even though WebSocket failed
          }
        } else {
          console.log("Using existing WebSocket connection");
          // Refresh time series data with existing connection
          wsClient.requestTimeSeriesHistory();
        }
      } catch (error) {
        console.warn("WebSocket connection attempt failed, continuing anyway:", error);
      } finally {
        setConnecting(false);
      }

      // Call the mock function for UI testing
      startTest();

      // Then call the actual API endpoint based on test type
      const endpoint = `/api/${testType}-test`;

      // Prepare the configuration based on test type
      let config;

      if (testType === "load") {
        config = {
          target_url: loadConfig.target_url,
          num_requests: 1000, // This could be made configurable
          concurrency: loadConfig.concurrentUsers,
          headers: loadConfig.headers,
          method: loadConfig.method,
          body: loadConfig.method !== "GET" ? loadConfig.body : undefined,
        };
      } else if (testType === "stress") {
        config = {
          target_url: loadConfig.target_url,
          duration_secs: loadConfig.duration,
          concurrency: loadConfig.concurrentUsers,
          headers: loadConfig.headers,
          method: loadConfig.method,
          body: loadConfig.method !== "GET" ? loadConfig.body : undefined,
        };
      } else if (testType === "api") {
        config = {
          target_url: loadConfig.target_url,
          test_suite_path: "/tests/default.json", // This could be made configurable
          headers: loadConfig.headers,
          method: loadConfig.method,
          body: loadConfig.method !== "GET" ? loadConfig.body : undefined,
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!data.success) {
        console.error("Error starting test:", data.message || "Failed to start test");
      } else {
        console.log(
          `${testType.charAt(0).toUpperCase() + testType.slice(1)} test has been initiated successfully.`,
        );
      }
    } catch (error) {
      console.error("Connection error: Could not connect to the testing server", error);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {testType.charAt(0).toUpperCase() + testType.slice(1)} Test Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {testType === "api" && (
          <div className="space-y-2">
            <Label htmlFor="url">Endpoint URL</Label>
            <Input
              id="url"
              value={loadConfig.target_url}
              onChange={(e) => updateConfig("target_url", e.target.value)}
              placeholder="https://example.com/endpoint"
              disabled={isRunning}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="method">HTTP Method</Label>
          <Select
            value={loadConfig.method}
            onValueChange={(value: string) => updateConfig("method", value)}
            disabled={isRunning}
          >
            <SelectTrigger id="method">
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
              <SelectItem value="HEAD">HEAD</SelectItem>
              <SelectItem value="OPTIONS">OPTIONS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="headers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="body" disabled={loadConfig.method === "GET"}>
              Body
            </TabsTrigger>
          </TabsList>

          <TabsContent value="headers" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="headers">Headers (JSON format)</Label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Headers Format Guide</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-muted-foreground text-sm">
                          Headers should be in JSON format. Common headers include:
                        </p>
                        <pre className="bg-muted rounded p-2 text-sm">
                          {JSON.stringify(
                            {
                              "Content-Type": "application/json",
                              Authorization: "Bearer your-token-here",
                              Accept: "application/json",
                              "User-Agent": "Load-Test-Client",
                            },
                            null,
                            2,
                          )}
                        </pre>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <Textarea
                  id="headers"
                  value={headersString}
                  onChange={(e) => updateHeaders(e.target.value)}
                  placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
                  disabled={isRunning}
                  className="h-48 font-mono text-sm"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="body" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="body">Request Body (JSON format)</Label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Body Format Guide</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-muted-foreground text-sm">
                          Request body should be in JSON format. Example structure:
                        </p>
                        <pre className="bg-muted rounded p-2 text-sm">
                          {JSON.stringify(
                            {
                              key: "value",
                              data: {
                                field1: "value1",
                                field2: "value2",
                              },
                            },
                            null,
                            2,
                          )}
                        </pre>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <Textarea
                  id="body"
                  value={bodyString}
                  onChange={(e) => updateBody(e.target.value)}
                  placeholder='{"key": "value", "data": {"field1": "value1"}}'
                  disabled={isRunning || loadConfig.method === "GET"}
                  className="h-48 font-mono text-sm"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col space-y-2">
          <Button
            onClick={handleStartTest}
            disabled={isRunning || isStarting}
            className="w-full"
            variant="default"
          >
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>{connecting ? "Connecting WebSocket" : "Starting Test"}</span>
              </>
            ) : (
              <span>Start Real Test (WebSocket)</span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
