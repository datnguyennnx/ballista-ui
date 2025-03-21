import { NextRequest, NextResponse } from 'next/server';
import { ApiTestConfig, TestResult, TestType, TestStatus } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const rawConfig = await request.json();
    const config: ApiTestConfig = {
      target_url: 'https://example.com',
      test_suite_path: rawConfig.test_suite_path || '/tests/default.json',
    };

    const response = await fetch('http://localhost:3001/api/api-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      return NextResponse.json(
        {
          success: false,
          message: 'Backend error',
          data: {
            id: Date.now().toString(),
            test_type: TestType.Api,
            status: TestStatus.Error,
            error: errorText,
            timestamp: Date.now(),
          },
        },
        { status: response.status }
      );
    }

    const data: TestResult = await response.json();
    return NextResponse.json({
      success: true,
      message: 'API test started successfully',
      data,
    });
  } catch (error) {
    console.error('API test error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to start API test',
        data: {
          id: Date.now().toString(),
          test_type: TestType.Api,
          status: TestStatus.Error,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        },
      },
      { status: 500 }
    );
  }
} 