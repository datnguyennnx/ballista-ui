"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { TestState, LoadConfigType } from "../types/test-types";
import { Textarea } from "@/components/ui/textarea";
import { wsClient } from "@/lib/websocket";

interface TestConfigProps {
  loadConfig: LoadConfigType;
  setLoadConfig: (config: LoadConfigType) => void;
  startTest: () => void;
  runFakeTest: () => void;
  loadTest: TestState;
  isFakeTestRunning: boolean;
  testType?: "load" | "stress" | "api";
}

export function TestConfig({
  loadConfig,
  setLoadConfig,
  startTest,
  runFakeTest,
  loadTest,
  isFakeTestRunning,
  testType = "load",
}: TestConfigProps) {
  const isRunning = loadTest.status === "running" || isFakeTestRunning;
  const [isStarting, setIsStarting] = useState(false);
  const [headersString, setHeadersString] = useState<string>("{}");
  const [connecting, setConnecting] = useState(false);

  const updateConfig = (key: keyof LoadConfigType, value: unknown) => {
    setLoadConfig({
      ...loadConfig,
      [key]: value,
    });
  };

  const updateHeaders = (headersJson: string) => {
    try {
      // Try to parse headers as JSON
      const headers = JSON.parse(headersJson);
      updateConfig("headers", headers);
      setHeadersString(headersJson);
    } catch {
      // Just update the string value if it's not valid JSON yet
      setHeadersString(headersJson);
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

  // Determine which fields to show based on test type
  const showDuration = testType === "stress";
  const showRampUp = testType === "stress";
  const showThinkTime = testType === "stress";
  const showTestSuite = testType === "api";
  const showHttpMethod = testType === "api";
  const showRequestBody = loadConfig.method !== "GET";
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {testType.charAt(0).toUpperCase() + testType.slice(1)} Test Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {showHttpMethod && (
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
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="headers">Headers (JSON format)</Label>
          <Textarea
            id="headers"
            value={headersString}
            onChange={(e) => updateHeaders(e.target.value)}
            placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
            disabled={isRunning}
            className="h-24 font-mono text-sm"
          />
        </div>

        {showRequestBody && (
          <div className="space-y-2">
            <Label htmlFor="body">Request Body</Label>
            <Textarea
              id="body"
              value={loadConfig.body || ""}
              onChange={(e) => updateConfig("body", e.target.value)}
              placeholder='{"key": "value"}'
              disabled={isRunning}
              className="h-24 font-mono text-sm"
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="concurrent-users">Concurrent Users: {loadConfig.concurrentUsers}</Label>
          </div>
          <Slider
            id="concurrent-users"
            value={[loadConfig.concurrentUsers]}
            min={1}
            max={1000}
            step={1}
            onValueChange={(value: number[]) => updateConfig("concurrentUsers", value[0])}
            disabled={isRunning}
          />
        </div>

        {showDuration && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="duration">Test Duration: {loadConfig.duration}s</Label>
            </div>
            <Slider
              id="duration"
              value={[loadConfig.duration]}
              min={5}
              max={300}
              step={1}
              onValueChange={(value: number[]) => updateConfig("duration", value[0])}
              disabled={isRunning}
            />
          </div>
        )}

        {showRampUp && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ramp-up">Ramp Up Period: {loadConfig.rampUp}s</Label>
            </div>
            <Slider
              id="ramp-up"
              value={[loadConfig.rampUp]}
              min={0}
              max={60}
              step={1}
              onValueChange={(value: number[]) => updateConfig("rampUp", value[0])}
              disabled={isRunning}
            />
          </div>
        )}

        {showThinkTime && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="think-time">Think Time: {loadConfig.thinkTime}ms</Label>
            </div>
            <Slider
              id="think-time"
              value={[loadConfig.thinkTime]}
              min={0}
              max={2000}
              step={50}
              onValueChange={(value: number[]) => updateConfig("thinkTime", value[0])}
              disabled={isRunning}
            />
          </div>
        )}

        {showTestSuite && (
          <div className="space-y-2">
            <Label htmlFor="testSuite">Test Suite</Label>
            <Select
              disabled={isRunning}
              value="default"
              onValueChange={(value) => console.log(value)}
            >
              <SelectTrigger id="testSuite">
                <SelectValue placeholder="Select test suite" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default API Tests</SelectItem>
                <SelectItem value="advanced">Advanced API Tests</SelectItem>
                <SelectItem value="custom">Custom Tests</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

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

          <Button onClick={runFakeTest} disabled={isRunning} className="w-full" variant="outline">
            Run Simulated Test (Offline)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
