"use client";

import { Zap } from "lucide-react";
import { useTimerStore } from "@/store/timerStore";
import { formatMs, formatDelta } from "@/lib/timer/formatter";
import { cn } from "@/lib/utils";

export function SplitTable() {
  const splits = useTimerStore((s) => s.splits);
  const currentSplitIndex = useTimerStore((s) => s.currentSplitIndex);
  const elapsedMs = useTimerStore((s) => s.elapsedMs);
  const status = useTimerStore((s) => s.status);

  if (splits.length === 0) return null;

  const prevElapsed =
    currentSplitIndex > 0 ? (splits[currentSplitIndex - 1]?.elapsed ?? 0) : 0;
  const liveSegmentMs = elapsedMs - prevElapsed;

  return (
    <div className="w-full overflow-hidden rounded-md border text-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2 text-left font-medium">Split</th>
            <th className="px-4 py-2 text-right font-medium">Segment</th>
            <th className="px-4 py-2 text-right font-medium">Time</th>
            <th className="px-4 py-2 text-right font-medium">Delta</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {splits.map((split, i) => {
            const done = split.elapsed !== null;
            const isCurrent =
              i === currentSplitIndex && status === "running";

            return (
              <tr
                key={i}
                className={cn(
                  "transition-colors",
                  isCurrent && "bg-accent",
                  done && split.isGold && "bg-yellow-500/5",
                  !done && !isCurrent && "text-muted-foreground/50",
                )}
              >
                {/* Split name */}
                <td className="flex items-center gap-2 px-4 py-2 font-medium">
                  {done && split.isGold && (
                    <Zap className="h-3.5 w-3.5 shrink-0 text-yellow-400" />
                  )}
                  <span className="truncate">{split.name}</span>
                </td>

                {/* Segment time */}
                <td className="px-4 py-2 text-right font-mono tabular-nums">
                  {done && split.segmentMs !== null
                    ? formatMs(split.segmentMs)
                    : isCurrent
                      ? formatMs(liveSegmentMs)
                      : "—"}
                </td>

                {/* Total elapsed */}
                <td className="px-4 py-2 text-right font-mono tabular-nums">
                  {done && split.elapsed !== null
                    ? formatMs(split.elapsed)
                    : isCurrent
                      ? formatMs(elapsedMs)
                      : "—"}
                </td>

                {/* Delta vs PB */}
                <td
                  className={cn(
                    "px-4 py-2 text-right font-mono tabular-nums text-xs",
                    done && split.deltaMs !== null && split.deltaMs < 0
                      ? "text-green-500"
                      : done && split.deltaMs !== null && split.deltaMs > 0
                        ? "text-red-500"
                        : "text-muted-foreground",
                  )}
                >
                  {done ? formatDelta(split.deltaMs) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
