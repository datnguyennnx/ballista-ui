"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Inbox, BarChart, Code } from "lucide-react";
import Link from "next/link";

const testTypes = [
  {
    title: "Stress Test",
    description: "Test your application under heavy load over a period of time.",
    icon: BarChart,
    url: "/testing/stress",
  },
  {
    title: "Load Test",
    description: "Measure your application's response under specific load scenarios.",
    icon: Inbox,
    url: "/testing/load",
  },
  {
    title: "API Test",
    description: "Validate your API endpoints with automated testing.",
    icon: Code,
    url: "/testing/api",
  },
];

export default function TestingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Testing Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testTypes.map((test) => (
          <Card key={test.title}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <test.icon className="h-5 w-5" />
                <CardTitle>{test.title}</CardTitle>
              </div>
              <CardDescription>{test.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={test.url}>Go to {test.title}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
