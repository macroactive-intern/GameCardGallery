"use client";
import { Zap } from "lucide-react";
import { useTimerStore } from "@/lib/speedrun/store";
import { formatTime, formatDelta } from "@/lib/speedrun/format";
import { cn } from "@/lib/utils";

export function SplitList() {
  const splits = useTimerStore((s) => s.splits);
  const currentSplitIndex = useTimerStore((s) => s.currentSplitIndex);
  const splitNames = useTimerStore((s) => s.splitNames);
  const elapsed = useTimerStore((s) => s.elapsed);
  const status = useTimerStore((s) => s.status);

  const prevSplitTime = splits.at(-1)?.splitTime ?? 0;
  const currentSegmentTime = elapsed - prevSplitTime;

  if (splitNames.length === 0) return null;

  return (
    <div className="w-full divide-y rounded-md border text-sm">
      {splitNames.map((name, i) => {
        const done = i < splits.length;
        const isCurrent = i === currentSplitIndex && status === "running";
        const split = done ? splits[i] : null;

        return (
          <div
            key={i}
            className={cn(
              "flex items-center gap-3 px-4 py-2",
              isCurrent && "bg-accent",
              !done && !isCurrent && "text-muted-foreground/60",
            )}
          >
            <span className="flex-1 truncate font-medium">{name}</span>

            {split?.isGold && (
              <Zap className="h-3.5 w-3.5 shrink-0 text-yellow-400" />
            )}

            {done && split && (
              <>
                {split.delta !== null && (
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      split.delta < 0 ? "text-green-500" : "text-red-500",
                    )}
                  >
                    {formatDelta(split.delta)}
                  </span>
                )}
                <span className="font-mono tabular-nums">
                  {formatTime(split.splitTime)}
                </span>
              </>
            )}

            {isCurrent && (
              <span className="font-mono tabular-nums text-muted-foreground">
                {formatTime(currentSegmentTime)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
