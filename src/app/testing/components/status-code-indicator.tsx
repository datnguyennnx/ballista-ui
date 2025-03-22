import { cn } from "@/lib/utils";

interface StatusCodeIndicatorProps {
  statusCodes: Record<number, number>;
  totalRequests: number;
}

export function StatusCodeIndicator({ statusCodes, totalRequests }: StatusCodeIndicatorProps) {
  if (Object.keys(statusCodes).length === 0) {
    return <p className="text-muted-foreground text-xs">No status codes recorded</p>;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {Object.entries(statusCodes).map(([code, count]) => {
          const percentage = (count / totalRequests) * 100;
          const colorClass = code.startsWith("2")
            ? "bg-chart-3 text-chart-3"
            : code.startsWith("5")
              ? "bg-chart-5 text-chart-5"
              : "bg-chart-4 text-chart-4";

          return (
            <div key={code} className="flex flex-col space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-block h-2.5 w-2.5 rounded-full",
                      colorClass.split(" ")[0],
                    )}
                  />
                  <span className="font-medium">{code}</span>
                </div>
                <span className="text-muted-foreground">{count}</span>
              </div>
              <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    colorClass.split(" ")[0],
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
