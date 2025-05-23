import { NextRequest, NextResponse } from "next/server";
import { StressTestConfig, TestResult, TestType, TestStatus } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const rawConfig = await request.json();
    const config: StressTestConfig = {
      target_url: rawConfig.target_url,
      duration_secs: Number(rawConfig.duration_secs) || 60,
      concurrency: Number(rawConfig.concurrency) || 10,
    };

    const response = await fetch("http://localhost:3001/api/stress-test", {
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
            test_type: TestType.Stress,
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
      message: "Stress test started successfully",
      data,
    });
  } catch (error) {
    console.error("Stress test error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to start stress test",
        data: {
          id: Date.now().toString(),
          test_type: TestType.Stress,
          status: TestStatus.Error,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: Date.now(),
        },
      },
      { status: 500 },
    );
  }
}
