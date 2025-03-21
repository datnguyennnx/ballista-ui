'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { TestUpdate, TestType, TestStatus, TestMetrics } from "@/types/index";

interface TestState {
  progress: number;
  metrics?: TestMetrics;
  status: string;
}

const defaultConfig = `{
  "sitemap": "http://localhost:3001l",
  "duration": 60,
  "concurrency": 20
}`;

export default function StressTestPage() {
  const [stressTest, setStressTest] = useState<TestState>({ progress: 0, status: 'idle' });
  const [activities, setActivities] = useState<string[]>([]);
  const [stressConfig, setStressConfig] = useState(defaultConfig);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001/ws');
    
    ws.onmessage = (event) => {
      try {
        const update: TestUpdate = JSON.parse(event.data);
        
        if (update.test_type === TestType.Stress) {
          const activity = `${update.status === TestStatus.Completed ? '✅' : '🔄'} Stress Test: ${update.progress.toFixed(0)}% - ${update.status}`;
          setActivities(prev => [activity, ...prev].slice(0, 4));
          
          setStressTest({
            progress: update.progress,
            metrics: update.metrics,
            status: update.status,
          });
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    return () => ws.close();
  }, []);

  const startTest = async (config: string) => {
    try {
      const configData = JSON.parse(config);
      const response = await fetch(`/api/stress-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      });
      const data = await response.json();
      console.log('Stress test started:', data);
    } catch (error) {
      console.error('Failed to start stress test:', error);
      setActivities(prev => ['❌ Failed to start stress test: Invalid configuration', ...prev].slice(0, 4));
    }
  };

  const renderMetrics = (metrics?: TestMetrics) => {
    if (!metrics) return null;
    return (
      <div className="mt-4 space-y-2 text-sm">
        <div>Requests: {metrics.requests_completed}</div>
        <div>Avg Response: {metrics.avg_response_time.toFixed(2)}ms</div>
        <div>Errors: {metrics.errors}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Stress Testing</h1>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Stress Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={stressTest.progress} className="mb-4" />
            <Textarea
              value={stressConfig}
              onChange={(e) => setStressConfig(e.target.value)}
              placeholder="Enter test configuration..."
              className="font-mono text-sm"
              rows={6}
            />
            <Button 
              onClick={() => startTest(stressConfig)}
              disabled={stressTest.status === 'running'}
              className="w-full"
            >
              {stressTest.status === 'running' ? 'Running...' : 'Start Stress Test'}
            </Button>
            {renderMetrics(stressTest.metrics)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    📊
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{activity}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 