import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiTestConfig, TestResult, ApiResponse, TestType, TestStatus } from '../../types';

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
      return res.status(response.status).json({
        success: false,
        message: 'Backend error',
        data: {
          id: Date.now().toString(),
          test_type: TestType.Api,
          status: TestStatus.Error,
          error: errorText,
          timestamp: Date.now(),
        },
      });
    }

    const data: TestResult = await response.json();
    return res.status(200).json({
      success: true,
      message: 'API test started successfully',
      data,
    });
  } catch (error) {
    console.error('API test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start API test',
      data: {
        id: Date.now().toString(),
        test_type: TestType.Api,
        status: TestStatus.Error,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      },
    });
  }
} 