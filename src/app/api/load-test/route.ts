import { NextRequest, NextResponse } from "next/server";
import { LoadTestConfig, TestResult, TestType, TestStatus } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const rawConfig = await request.json();
    const config: LoadTestConfig = {
      target_url: rawConfig.target_url,
      num_requests: Number(rawConfig.num_requests) || 1000,
      concurrency: Number(rawConfig.concurrency) || 10,
    };

    const response = await fetch("http://localhost:3001/api/load-test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", errorText);
      return NextResponse.json(
        {
          success: false,
          message: "Backend error",
          data: {
            id: Date.now().toString(),
            test_type: TestType.Load,
            status: TestStatus.Error,
            error: errorText,
            timestamp: Date.now(),
          },
        },
        { status: response.status },
      );
    }

    const data: TestResult = await response.json();
    return NextResponse.json({
      success: true,
      message: "Load test started successfully",
      data,
    });
  } catch (error) {
    console.error("Load test error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to start load test",
        data: {
          id: Date.now().toString(),
          test_type: TestType.Load,
          status: TestStatus.Error,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: Date.now(),
        },
      },
      { status: 500 },
    );
  }
}
