"use client";

import { useTimerStore } from "@/store/timerStore";
import { formatMs } from "@/lib/timer/formatter";
import { cn } from "@/lib/utils";

export function TimerDisplay() {
  const status = useTimerStore((s) => s.status);
  const elapsedMs = useTimerStore((s) => s.elapsedMs);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "select-none font-mono text-7xl font-bold tabular-nums tracking-tight transition-colors",
          status === "running" && "text-foreground",
          status === "paused" && "text-yellow-500",
          status === "finished" && "text-green-500",
          status === "idle" && "text-muted-foreground",
        )}
      >
        {formatMs(elapsedMs)}
      </div>
      <span className="text-xs uppercase tracking-widest text-muted-foreground">
        {status}
      </span>
    </div>
  );
}
