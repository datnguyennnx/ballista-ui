import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  description?: string;
  statusColor?: string;
  isRunning?: boolean;
  footer?: React.ReactNode;
  additionalContent?: React.ReactNode;
}

export function MetricCard({
  title,
  value,
  description,
  statusColor,
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
