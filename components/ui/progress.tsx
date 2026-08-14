"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  indicatorClassName?: string;
  showPercent?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, indicatorClassName, showPercent = false, ...props }, ref) => {
    const percentage = Math.min(Math.max(0, value), max);

    return (
      <div className="w-full space-y-1.5">
        <div
          ref={ref}
          className={cn(
            "relative h-2.5 w-full overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-800",
            className
          )}
          {...props}
        >
          <div
            className={cn(
              "h-full w-full flex-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 transition-all duration-300 ease-out rounded-full shadow-sm",
              indicatorClassName
            )}
            style={{ transform: `translateX(-${100 - percentage}%)` }}
          />
        </div>
        {showPercent && (
          <div className="flex justify-between text-[11px] font-semibold text-muted-foreground px-0.5">
            <span>Progress</span>
            <span>{Math.round(percentage)}%</span>
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };
