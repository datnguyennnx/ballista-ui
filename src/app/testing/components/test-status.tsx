import { Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TestStatusProps {
  isRunning: boolean;
  progress: number;
  onRunTest: () => void;
}

export function TestStatus({ isRunning, progress, onRunTest }: TestStatusProps) {
  // Format the progress as a whole number
  const progressFormatted = Math.round(progress || 0);

  return (
    <div className="flex gap-2">
      {isRunning && (
        <div className="bg-muted/50 hidden items-center gap-2 rounded-md px-3 py-1.5 text-sm sm:flex">
          <Activity className="text-chart-3 h-4 w-4 animate-pulse" />
          <span>Test running: {progressFormatted}%</span>
        </div>
      )}
      <Button
        variant={isRunning ? "secondary" : "outline"}
        onClick={onRunTest}
        disabled={isRunning}
        className="relative"
      >
        {isRunning ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Activity className="mr-2 h-4 w-4" />
        )}
        {isRunning ? "Running Test" : "Generate Demo Data"}
        {isRunning && (
          <span className="bg-primary/20 text-primary-foreground ml-2 rounded-full px-2 text-xs sm:hidden">
            {progressFormatted}%
          </span>
        )}
      </Button>
    </div>
  );
}
