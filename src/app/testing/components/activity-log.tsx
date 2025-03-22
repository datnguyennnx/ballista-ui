import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, AlertCircle, Info, User, Clock, ArrowUpRight } from "lucide-react";
import { useEffect, useState, useRef, useMemo } from "react";

interface Activity {
  id: string;
  message: string;
  timestamp: Date;
  type: "info" | "success" | "warning" | "error";
  isUserAction?: boolean;
}

interface ActivityLogProps {
  activities: string[] | Activity[];
  height?: number;
}

export function ActivityLog({ activities }: ActivityLogProps) {
  const [highlightedActivities, setHighlightedActivities] = useState<Record<string, boolean>>({});
  const processedIds = useRef<Set<string>>(new Set());

  // Check if we're using the new Activity format or legacy string format
  const isLegacyFormat = activities.length > 0 && typeof activities[0] === "string";

  // Function to parse legacy activity strings into structured format
  const parseActivity = (activity: string): Activity => {
    let type: "info" | "success" | "warning" | "error" = "info";
    let isUserAction = false;

    // Try to detect user actions
    if (
      activity.includes("started") ||
      activity.includes("Started") ||
      activity.includes("loaded") ||
      activity.includes("generated") ||
      activity.includes("Generate Demo") ||
      activity.includes("clicked")
    ) {
      isUserAction = true;
    }

    // Try to detect type from emoji or content
    if (
      activity.includes("✅") ||
      activity.includes("Completed") ||
      activity.includes("completed")
    ) {
      type = "success";
    } else if (
      activity.includes("❌") ||
      activity.includes("error") ||
      activity.includes("Error")
    ) {
      type = "error";
    } else if (
      activity.includes("⚠️") ||
      activity.includes("warning") ||
      activity.includes("Warning")
    ) {
      type = "warning";
    }

    return {
      id: Math.random().toString(36).substring(2),
      message: activity.replace(/^[✅❌🔄⚠️]\s*/, ""), // Remove leading emoji if present
      timestamp: new Date(),
      type,
      isUserAction,
    };
  };

  // Convert to consistent format - memoized to prevent recreating on every render
  const formattedActivities = useMemo(() => {
    return isLegacyFormat
      ? (activities as string[]).map(parseActivity)
      : (activities as Activity[]);
  }, [activities, isLegacyFormat]);

  // Track new activities and highlight them
  useEffect(() => {
    if (formattedActivities.length === 0) return;

    const newHighlights: Record<string, boolean> = {};
    let hasNewActivities = false;

    formattedActivities.forEach((activity) => {
      if (!processedIds.current.has(activity.id)) {
        newHighlights[activity.id] = true;
        processedIds.current.add(activity.id);
        hasNewActivities = true;
      }
    });

    if (hasNewActivities) {
      setHighlightedActivities(newHighlights);

      // Clear highlight after animation plays
      const timer = setTimeout(() => {
        setHighlightedActivities({});
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [formattedActivities]);

  // Get icon and color based on activity type
  const getActivityIcon = (activity: Activity) => {
    if (activity.isUserAction) {
      return <User className="h-4 w-4 text-slate-600" />;
    }

    switch (activity.type) {
      case "success":
        return <CheckCircle className="text-chart-3 h-4 w-4" />;
      case "warning":
        return <AlertCircle className="text-chart-4 h-4 w-4" />;
      case "error":
        return <AlertCircle className="text-chart-5 h-4 w-4" />;
      case "info":
      default:
        return <Info className="text-chart-2 h-4 w-4" />;
    }
  };

  // Extract status information from message (e.g., 100%, 50%, 0%)
  const extractStatus = (
    message: string,
  ): { prefix: string; status: string; suffix: string } | null => {
    const statusMatch = message.match(/(Load Test:)\s*(\d+%)\s*-\s*(.*)/i);
    if (statusMatch) {
      return {
        prefix: statusMatch[1],
        status: statusMatch[2],
        suffix: statusMatch[3],
      };
    }
    return null;
  };

  // Format the timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Format relative time (e.g., "2 min ago")
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 5) return "just now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return formatTime(date);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-shrink-0 items-center justify-between pb-2">
        <CardTitle className="text-lg">Recent Activities</CardTitle>
        {formattedActivities.length > 0 && (
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Clock className="h-3.5 w-3.5" />
            <span>Last update: {formatRelativeTime(formattedActivities[0].timestamp)}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-3">
        <ScrollArea className="h-full">
          <div className="space-y-3 pr-4">
            {formattedActivities.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No recent activities. Start a test to see activity logs.
              </p>
            ) : (
              formattedActivities.map((activity) => {
                const statusInfo = extractStatus(activity.message);

                return (
                  <div
                    key={activity.id}
                    className={`-ml-1 flex flex-col rounded-md py-2 pl-2 transition-colors ${
                      highlightedActivities[activity.id]
                        ? "animate-highlight-bg bg-accent/10"
                        : "bg-card/30"
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="mr-2 flex-shrink-0">{getActivityIcon(activity)}</div>
                      <div className="flex-grow">
                        {statusInfo ? (
                          <div className="flex flex-col">
                            <div className="flex items-baseline">
                              <span className="text-sm font-medium">{statusInfo.prefix}</span>
                              <span className="mr-1 ml-1 text-sm font-semibold">
                                {statusInfo.status}
                              </span>
                              <span className="text-sm">- {statusInfo.suffix}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm">{activity.message}</span>
                        )}
                      </div>
                      <div className="text-muted-foreground flex flex-shrink-0 items-center text-xs">
                        {highlightedActivities[activity.id] && (
                          <ArrowUpRight className="text-chart-3 mr-1 h-3 w-3 animate-pulse" />
                        )}
                        <span title={"timestamp"}>{formatRelativeTime(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
