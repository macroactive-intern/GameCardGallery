"use client";
import { useTimerStore } from "@/lib/speedrun/store";
import { formatTime } from "@/lib/speedrun/format";
import { cn } from "@/lib/utils";

export function TimerDisplay() {
  const status = useTimerStore((s) => s.status);
  const elapsed = useTimerStore((s) => s.elapsed);

  return (
    <div
      className={cn(
        "select-none font-mono text-7xl font-bold tabular-nums tracking-tight transition-colors",
        status === "finished" && "text-green-500",
        status === "idle" && "text-muted-foreground",
      )}
    >
      {formatTime(elapsed)}
    </div>
  );
}
