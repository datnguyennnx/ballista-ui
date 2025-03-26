import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle, Clock, Loader2, Network } from "lucide-react";
import { useMemo } from "react";

interface Activity {
  id: string;
  message: string;
  type?: "success" | "error" | "loading" | "network";
}

interface ActivityLogProps {
  activities: string[] | Activity[];
  height?: number;
}

export function ActivityLog({ activities }: ActivityLogProps) {
  // Convert to consistent format - memoized to prevent recreating on every render
  const formattedActivities = useMemo(() => {
    // Determine activity type based on message content
    const determineActivityType = (message: string): Activity["type"] => {
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes("failed") || lowerMessage.includes("error")) return "error";
      if (
        lowerMessage.includes("started") ||
        lowerMessage.includes("completed") ||
        lowerMessage.includes("success")
      )
        return "success";
      if (lowerMessage.includes("preparing") || lowerMessage.includes("sending")) return "loading";
      if (lowerMessage.includes("request") || lowerMessage.includes("http")) return "network";
      return undefined;
    };

    // Function to parse legacy activity strings into structured format
    const parseActivity = (activity: string): Activity => ({
      id: Math.random().toString(36).substring(2),
      message: activity,
      type: determineActivityType(activity),
    });

    return activities.map((activity) =>
      typeof activity === "string" ? parseActivity(activity) : activity,
    );
  }, [activities]);

  // Get icon based on activity type
  const getActivityIcon = (type?: Activity["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "network":
        return <Network className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="flex h-fit flex-col">
      <CardHeader className="flex-shrink-0 border-b pb-2">
        <CardTitle className="text-lg font-semibold">Load Test Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="space-y-2 p-4">
            {formattedActivities.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No load test activities recorded yet. Start a test to see activity logs.
              </p>
            ) : (
              formattedActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="group bg-card/50 hover:bg-card/80 relative flex items-center gap-3 rounded-lg p-3 transition-all"
                >
                  <div className="flex-shrink-0">{getActivityIcon(activity.type)}</div>
                  <div className="min-w-0 flex-grow">
                    <p className="text-sm font-medium">{activity.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
