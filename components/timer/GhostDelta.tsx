"use client";

import { useTimerStore } from "@/store/timerStore";
import { formatDelta } from "@/lib/timer/formatter";

interface Props {
  wrSegments: Array<number | null>;
}

function buildCumulative(segments: Array<number | null>): Array<number | null> {
  const out: Array<number | null> = [0];
  let running = 0;
  for (const seg of segments) {
    if (seg === null) {
      out.push(null);
      break;
    }
    running += seg;
    out.push(running);
  }
  return out;
}

export function GhostDelta({ wrSegments }: Props) {
  const elapsedMs = useTimerStore((s) => s.elapsedMs);
  const currentSplitIndex = useTimerStore((s) => s.currentSplitIndex);
  const status = useTimerStore((s) => s.status);

  if (status === "idle" || status === "finished") return null;
  if (wrSegments.length === 0) return null;

  const cumulative = buildCumulative(wrSegments);
  const wrAt = cumulative[currentSplitIndex] ?? null;
  if (wrAt === null) return null;

  const delta = elapsedMs - wrAt;

  return (
    <div className="text-center text-sm font-mono tabular-nums">
      <span className="mr-1 text-xs text-muted-foreground">vs WR</span>
      <span className={delta < 0 ? "text-green-400" : "text-red-400"}>
        {formatDelta(delta)}
      </span>
    </div>
  );
}
