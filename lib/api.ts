import { LoadTestConfig, StressTestConfig, ApiTestConfig, TestResponse } from '../types';

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new ApiError(response.status, error.message);
    }
    return response.json();
}

export async function makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const response = await fetch(endpoint, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    return handleResponse<T>(response);
}

export const api = {
    loadTest: (config: LoadTestConfig) => 
        makeRequest<TestResponse>('/api/load-test', {
            method: 'POST',
            body: JSON.stringify(config),
        }),

    stressTest: (config: StressTestConfig) =>
        makeRequest<TestResponse>('/api/stress-test', {
            method: 'POST',
            body: JSON.stringify(config),
        }),

    apiTest: (config: ApiTestConfig) =>
        makeRequest<TestResponse>('/api/api-test', {
            method: 'POST',
            body: JSON.stringify(config),
        }),

    health: () =>
        makeRequest<{ status: string }>('/api/health', {
            method: 'GET',
        }),
}; 