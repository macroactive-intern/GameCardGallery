"use client";
import { useState } from "react";
import { Check, Copy, Trophy, Zap } from "lucide-react";
import { useTimerStore } from "@/lib/speedrun/store";
import { formatTime, formatDelta } from "@/lib/speedrun/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  userId: string | null;
  categoryId: string;
  categoryName: string;
  gameName: string;
};

export function RunSummary({ userId, categoryId, categoryName, gameName }: Props) {
  const splits = useTimerStore((s) => s.splits);
  const pbSplitTimes = useTimerStore((s) => s.pbSplitTimes);
  const reset = useTimerStore((s) => s.actions.reset);

  const [saving, setSaving] = useState(false);
  const [savedRunId, setSavedRunId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveError, setSaveError] = useState("");

  const totalTime = splits.at(-1)?.splitTime ?? 0;
  const pbTotal = pbSplitTimes?.reduce((a, b) => a + b, 0) ?? null;
  const isPB = pbTotal !== null && totalTime < pbTotal;
  const goldCount = splits.filter((s) => s.isGold).length;

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/speedrun/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          splitTimes: splits.map((s) => s.segmentTime),
          totalTime,
          goldSplits: splits.map((s) => s.isGold),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "Failed to save");
        return;
      }
      setSavedRunId(data.id as string);
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    if (!savedRunId) return;
    await navigator.clipboard.writeText(
      `${window.location.origin}/speedrun/run/${savedRunId}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {gameName} — {categoryName}
            </p>
            <CardTitle className="mt-1 font-mono text-4xl tabular-nums">
              {formatTime(totalTime)}
            </CardTitle>
          </div>
          <div className="flex flex-col items-end gap-1 pt-1 shrink-0">
            {isPB && (
              <span className="flex items-center gap-1 text-sm font-medium text-yellow-500">
                <Trophy className="h-4 w-4" /> New PB!
              </span>
            )}
            {goldCount > 0 && (
              <span className="flex items-center gap-1 text-sm text-yellow-400">
                <Zap className="h-4 w-4" />
                {goldCount} gold split{goldCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="divide-y rounded-md border text-sm">
          {splits.map((split, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-3 px-4 py-2",
                split.isGold && "bg-yellow-500/5",
              )}
            >
              <span className="flex-1 truncate font-medium">{split.name}</span>
              {split.isGold && (
                <Zap className="h-3.5 w-3.5 shrink-0 text-yellow-400" />
              )}
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
                {formatTime(split.segmentTime)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {!userId && (
            <Button asChild>
              <a href="/login">Sign in to save run</a>
            </Button>
          )}
          {userId && !savedRunId && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save run"}
            </Button>
          )}
          {savedRunId && (
            <Button variant="outline" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy share link
                </>
              )}
            </Button>
          )}
          {saveError && (
            <p className="w-full text-sm text-destructive">{saveError}</p>
          )}
          <Button variant="outline" onClick={reset}>
            Run again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
