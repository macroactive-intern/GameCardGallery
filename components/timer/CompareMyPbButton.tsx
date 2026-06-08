"use client";

import { useState } from "react";
import { BarChart2, Zap } from "lucide-react";
import { formatMs, formatDelta } from "@/lib/timer/formatter";
import type { RunRecord } from "@/lib/runs/service";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Split {
  name: string;
  segmentMs: number | null;
}

interface Props {
  userId: string | null;
  game: string;
  category: string;
  splits: Split[];
}

type State = "idle" | "loading" | "loaded" | "none" | "error";

export function CompareMyPbButton({ userId, game, category, splits }: Props) {
  const [state, setState] = useState<State>("idle");
  const [pbRun, setPbRun] = useState<RunRecord | null>(null);

  async function handleCompare() {
    if (state === "loading" || state === "loaded") return;
    setState("loading");
    try {
      const res = await fetch(
        `/api/runs/pb?game=${encodeURIComponent(game)}&category=${encodeURIComponent(category)}`,
      );
      if (res.status === 401) {
        setState("idle");
        return;
      }
      if (!res.ok) {
        setState("error");
        return;
      }
      const data = (await res.json()) as { run: RunRecord | null };
      if (!data.run) {
        setState("none");
      } else {
        setPbRun(data.run);
        setState("loaded");
      }
    } catch {
      setState("error");
    }
  }

  if (!userId) {
    return (
      <p className="text-sm text-muted-foreground">
        <a href="/login" className="underline underline-offset-2">
          Sign in
        </a>{" "}
        to compare against your PB.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCompare}
        disabled={state === "loading" || state === "loaded"}
      >
        <BarChart2 className="mr-2 h-4 w-4" />
        {state === "loading"
          ? "Loading PB…"
          : state === "loaded"
            ? "Compared to your PB"
            : "Compare My PB"}
      </Button>

      {state === "none" && (
        <p className="text-sm text-muted-foreground">
          No previous PB found for this category.
        </p>
      )}

      {state === "error" && (
        <p className="text-sm text-destructive">Failed to load PB.</p>
      )}

      {state === "loaded" && pbRun && (
        <DeltaTable splits={splits} pbRun={pbRun} />
      )}
    </div>
  );
}

function DeltaTable({ splits, pbRun }: { splits: Split[]; pbRun: RunRecord }) {
  type PbSplit = { name: string; segmentMs: number | null };
  const pbSplits = Array.isArray(pbRun.splits)
    ? (pbRun.splits as PbSplit[])
    : [];

  return (
    <div className="overflow-hidden rounded-md border text-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2 text-left font-medium">Split</th>
            <th className="px-4 py-2 text-right font-medium">This run</th>
            <th className="px-4 py-2 text-right font-medium">Your PB</th>
            <th className="px-4 py-2 text-right font-medium">Delta</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {splits.map((split, i) => {
            const pbSeg = pbSplits[i]?.segmentMs ?? null;
            const thisSeg = split.segmentMs;
            const delta =
              thisSeg !== null && pbSeg !== null ? thisSeg - pbSeg : null;

            return (
              <tr
                key={i}
                className={cn(delta !== null && delta < 0 && "bg-yellow-500/5")}
              >
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2 font-medium">
                    {delta !== null && delta < 0 && (
                      <Zap className="h-3.5 w-3.5 shrink-0 text-yellow-400" />
                    )}
                    <span className="truncate">{split.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-right font-mono tabular-nums">
                  {thisSeg !== null ? formatMs(thisSeg) : "—"}
                </td>
                <td className="px-4 py-2 text-right font-mono tabular-nums text-muted-foreground">
                  {pbSeg !== null ? formatMs(pbSeg) : "—"}
                </td>
                <td
                  className={cn(
                    "px-4 py-2 text-right font-mono tabular-nums text-xs",
                    delta !== null && delta < 0 && "text-green-500",
                    delta !== null && delta > 0 && "text-red-500",
                    (delta === null || delta === 0) && "text-muted-foreground",
                  )}
                >
                  {formatDelta(delta)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="border-t px-4 py-2 text-xs text-muted-foreground">
        Your PB: {formatMs(pbRun.totalMs)}
      </div>
    </div>
  );
}
