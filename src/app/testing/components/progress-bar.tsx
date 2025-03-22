import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  colorClass?: string;
  style?: React.CSSProperties;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  barClassName,
  colorClass = "bg-chart-3",
  style,
}: ProgressBarProps) {
  const percentage = Math.min(100, (value / max) * 100);

  return (
    <div className={cn("bg-muted mt-1 h-1.5 w-full overflow-hidden rounded-full", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", colorClass, barClassName)}
        style={{ width: `${percentage}%`, ...style }}
      />
    </div>
  );
}

export function MultiSegmentProgressBar({
  segments,
  className,
}: {
  segments: {
    value: number;
    colorClass: string;
  }[];
  className?: string;
}) {
  return (
    <div className={cn("mt-2 flex h-1.5 w-full overflow-hidden rounded-full", className)}>
      {segments.map((segment, index) => (
        <div
          key={index}
          className={cn("h-full transition-all duration-500", segment.colorClass)}
          style={{ width: `${segment.value}%` }}
        />
      ))}
    </div>
  );
}
