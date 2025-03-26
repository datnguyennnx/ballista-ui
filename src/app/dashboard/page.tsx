"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServerCrash, Gauge, Activity, Zap, ExternalLink, ArrowRight } from "lucide-react";

export default function TestingDashboard() {
  const router = useRouter();

  const testTypes = [
    {
      title: "Load Testing",
      description: "Test how your system performs under expected load conditions",
      icon: <Gauge className="h-5 w-5" />,
      href: "/testing/load",
      color: "bg-blue-500/10",
      textColor: "text-blue-500",
      feature: "Simulate real-world traffic patterns",
    },
    {
      title: "Stress Testing",
      description: "Find the breaking point of your system by gradually increasing load",
      icon: <Activity className="h-5 w-5" />,
      href: "/testing/stress",
      color: "bg-red-500/10",
      textColor: "text-red-500",
      feature: "Identify system capacity limits",
    },
    {
      title: "API Testing",
      description: "Validate your API endpoints and response schemas",
      icon: <ServerCrash className="h-5 w-5" />,
      href: "/testing/api",
      color: "bg-green-500/10",
      textColor: "text-green-500",
      feature: "Verify API contract compliance",
      comingSoon: true,
    },
    {
      title: "Real-time Performance",
      description: "Monitor your application's performance metrics in real-time",
      icon: <Activity className="h-5 w-5" />,
      href: "/dashboard",
      color: "bg-purple-500/10",
      textColor: "text-purple-500",
      feature: "Track live performance indicators",
      comingSoon: true,
    },
    {
      title: "Integration Testing",
      description: "Test how your systems work together under load",
      icon: <Zap className="h-5 w-5" />,
      href: "/dashboard",
      color: "bg-amber-500/10",
      textColor: "text-amber-500",
      feature: "Validate system interactions",
      comingSoon: true,
    },
    {
      title: "Documentation",
      description: "Learn how to use Ballista for performance testing",
      icon: <ExternalLink className="h-5 w-5" />,
      href: "/dashboard",
      color: "bg-gray-500/10",
      textColor: "text-gray-500",
      feature: "Read detailed usage instructions",
      external: true,
    },
  ];

  const handleNavigate = (href: string, external = false) => {
    if (external) {
      window.open(href, "_blank");
    } else {
      router.push(href);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Choose a test type to measure and improve your application&apos;s performance
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testTypes.map((test) => (
          <Card key={test.title} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="mb-2 flex items-center gap-2">
                <div className={`${test.color} ${test.textColor} rounded-md p-2`}>{test.icon}</div>
                {test.comingSoon && (
                  <span className="bg-muted text-muted-foreground rounded-full px-2 py-1 text-xs">
                    Coming Soon
                  </span>
                )}
              </div>
              <CardTitle className="text-xl">{test.title}</CardTitle>
              <CardDescription>{test.description}</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="bg-muted h-1 w-1 rounded-full" />
                <span>{test.feature}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => handleNavigate(test.href, test.external)}
                disabled={test.comingSoon}
              >
                {test.comingSoon
                  ? "Coming Soon"
                  : test.external
                    ? "View Documentation"
                    : "Run Tests"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
