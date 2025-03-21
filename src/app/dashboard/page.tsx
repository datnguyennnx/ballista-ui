'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface TestMetrics {
  requests_completed: number;
  avg_response_time: number;
  errors: number;
}

interface TestUpdate {
  test_id: string;
  status: string;
  progress: number;
  metrics?: TestMetrics;
}

interface TestState {
  progress: number;
  metrics?: TestMetrics;
  status: string;
}

const defaultConfigs = {
  load: `{
  "url": "http://localhost:3001",
  "requests": 1000,
  "concurrency": 10
}`,
  stress: `{
  "sitemap": "http://localhost:3001/sitemap.xml",
  "duration": 60,
  "concurrency": 20
}`,
  api: `{
  "path": "./tests/api.json"
}`
};

export default function Home() {
  const [stressTest, setStressTest] = useState<TestState>({ progress: 0, status: 'idle' });
  const [loadTest, setLoadTest] = useState<TestState>({ progress: 0, status: 'idle' });
  const [apiTest, setApiTest] = useState<TestState>({ progress: 0, status: 'idle' });
  const [activities, setActivities] = useState<string[]>([]);
  
  // Configuration states
  const [loadConfig, setLoadConfig] = useState(defaultConfigs.load);
  const [stressConfig, setStressConfig] = useState(defaultConfigs.stress);
  const [apiConfig, setApiConfig] = useState(defaultConfigs.api);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001/ws');
    
    ws.onmessage = (event) => {
      try {
        const update: TestUpdate = JSON.parse(event.data);
        const activity = `${update.status === 'completed' ? '✅' : '🔄'} ${update.test_id}: ${update.progress.toFixed(0)}% - ${update.status}`;
        setActivities(prev => [activity, ...prev].slice(0, 4));
        
        if (update.test_id.includes('stress')) {
          setStressTest({
            progress: update.progress,
            metrics: update.metrics,
            status: update.status,
          });
        } else if (update.test_id.includes('load')) {
          setLoadTest({
            progress: update.progress,
            metrics: update.metrics,
            status: update.status,
          });
        } else if (update.test_id.includes('api')) {
          setApiTest({
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

  const startTest = async (type: string, config: string) => {
    try {
      const configData = JSON.parse(config);
      const response = await fetch(`/api/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      });
      const data = await response.json();
      console.log(`${type} started:`, data);
    } catch (error) {
      console.error(`Failed to start ${type}:`, error);
      setActivities(prev => [`❌ Failed to start ${type}: Invalid configuration`, ...prev].slice(0, 4));
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

  const renderTestCard = (
    title: string,
    type: 'stress-test' | 'load-test' | 'api-test',
    state: TestState,
    config: string,
    setConfig: (value: string) => void
  ) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={state.progress} className="mb-4" />
        <Textarea
          value={config}
          onChange={(e) => setConfig(e.target.value)}
          placeholder="Enter test configuration..."
          className="font-mono text-sm"
          rows={6}
        />
        <Button 
          onClick={() => startTest(type, config)}
          disabled={state.status === 'running'}
          className="w-full"
        >
          {state.status === 'running' ? 'Running...' : `Start ${title}`}
        </Button>
        {renderMetrics(state.metrics)}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {renderTestCard('Stress Test', 'stress-test', stressTest, stressConfig, setStressConfig)}
        {renderTestCard('Load Test', 'load-test', loadTest, loadConfig, setLoadConfig)}
        {renderTestCard('API Test', 'api-test', apiTest, apiConfig, setApiConfig)}
      </div>

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
  );
}
