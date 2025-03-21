import type { NextApiRequest, NextApiResponse } from 'next';
import { LoadTestConfig, TestResult, ApiResponse, TestType, TestStatus } from '../../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<TestResult>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const rawConfig = req.body;
    const config: LoadTestConfig = {
      target_url: 'https://example.com',
      num_requests: Number(rawConfig.num_requests) || 1000,
      concurrency: Number(rawConfig.concurrency) || 10,
    };

    const response = await fetch('http://localhost:3001/api/load-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      return res.status(response.status).json({
        success: false,
        message: 'Backend error',
        data: {
          id: Date.now().toString(),
          test_type: TestType.Load,
          status: TestStatus.Error,
          error: errorText,
          timestamp: Date.now(),
        },
      });
    }

    const data: TestResult = await response.json();
    return res.status(200).json({
      success: true,
      message: 'Load test started successfully',
      data,
    });
  } catch (error) {
    console.error('Load test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start load test',
      data: {
        id: Date.now().toString(),
        test_type: TestType.Load,
        status: TestStatus.Error,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      },
    });
  }
} 