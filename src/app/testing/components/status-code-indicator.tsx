import { cn } from "@/lib/utils";

interface StatusCodeIndicatorProps {
  statusCodes: Record<number, number>;
  totalRequests: number;
}

export function StatusCodeIndicator({ statusCodes, totalRequests }: StatusCodeIndicatorProps) {
  if (Object.keys(statusCodes).length === 0) {
    return <p className="text-muted-foreground text-sm">No status codes recorded</p>;
  }

  return (
    <div className="space-y-3">
      {Object.entries(statusCodes).map(([code, count]) => {
        const percentage = (count / totalRequests) * 100;
        let colorClass;
        let statusText;

        switch (code[0]) {
          case "2":
            colorClass = "bg-chart-2";
            statusText = "Success";
            break;
          case "4":
            colorClass = "bg-chart-1";
            statusText = "Client Error";
            break;
          case "5":
            colorClass = "bg-chart-5";
            statusText = "Server Error";
            break;
          default:
            colorClass = "bg-chart-3";
            statusText = "Information";
        }

        return (
          <div key={code} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full", colorClass)} />
                <span className="font-medium">{code}</span>
                <span className="text-muted-foreground text-xs">{statusText}</span>
              </div>
              <span className="text-muted-foreground text-xs">
                {count} ({percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="bg-muted/30 h-1 w-full overflow-hidden rounded-full">
              <div
                className={cn("h-full rounded-full transition-all duration-500", colorClass)}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
