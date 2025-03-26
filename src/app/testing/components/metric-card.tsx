import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number | ReactNode;
  statusColor?: string;
  description?: string | ReactNode;
  isRunning?: boolean;
  footer?: React.ReactNode;
  additionalContent?: ReactNode;
}

export function MetricCard({
  title,
  value,
  statusColor,
  description,
  isRunning = false,
  footer,
  additionalContent,
}: MetricCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-card/50">
        <CardDescription>{title}</CardDescription>
        <CardTitle className={cn("text-xl lg:text-2xl", statusColor)}>{value}</CardTitle>
      </CardHeader>
      <CardContent className="bg-muted/5">
        {description && (
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">{description}</p>
            {isRunning && <Activity className="text-chart-3 h-4 w-4 animate-pulse" />}
          </div>
        )}
        {footer}
        {additionalContent}
      </CardContent>
    </Card>
  );
}
