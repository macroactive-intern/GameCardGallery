"use client";

import { useState } from "react";
import { Check, Copy, Trophy, Zap } from "lucide-react";
import { useTimerStore } from "@/store/timerStore";
import { formatMs } from "@/lib/timer/formatter";
import type { FinalStats } from "@/lib/timer/splits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  stats: FinalStats;
  userId: string | null;
  game: string;
  category: string;
  onReset: () => void;
  onSaved?: (isWR: boolean) => void;
}

export function RunSummary({ stats, userId, game, category, onReset, onSaved }: Props) {
  const splits = useTimerStore((s) => s.splits);

  const [saving, setSaving] = useState(false);
  const [savedRunId, setSavedRunId] = useState<string | null>(null);
  const [isWR, setIsWR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game,
          category,
          totalMs: stats.totalMs,
          splits: splits.map((s) => ({ name: s.name, segmentMs: s.segmentMs })),
          goldSplits: splits.map((s) => s.isGold),
        }),
      });
      const data = (await res.json()) as { id?: string; isWR?: boolean; error?: string };
      if (!res.ok) {
        setSaveError(data.error ?? "Failed to save run");
        return;
      }
      setSavedRunId(data.id!);
      setIsWR(data.isWR ?? false);
      onSaved?.(data.isWR ?? false);
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
              {game} — {category}
            </p>
            <CardTitle className="mt-1 font-mono text-4xl tabular-nums">
              {formatMs(stats.totalMs)}
            </CardTitle>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 pt-1">
            {stats.isNewPb && (
              <span className="flex items-center gap-1 text-sm font-medium text-yellow-500">
                <Trophy className="h-4 w-4" />
                New PB!
              </span>
            )}
            {isWR && (
              <span className="flex items-center gap-1 text-sm font-medium text-purple-400">
                <Trophy className="h-4 w-4" />
                World Record!
              </span>
            )}
            {stats.goldCount > 0 && (
              <span className="flex items-center gap-1 text-sm text-yellow-400">
                <Zap className="h-4 w-4" />
                {stats.goldCount} gold split{stats.goldCount !== 1 ? "s" : ""}
              </span>
            )}
            {stats.pbImprovement !== null && (
              <span className="text-xs text-green-500">
                -{formatMs(stats.pbImprovement)} vs PB
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {!userId ? (
            <Button asChild>
              <a href="/login">Sign in to save run</a>
            </Button>
          ) : !savedRunId ? (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Run"}
            </Button>
          ) : (
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

          <Button variant="outline" onClick={onReset}>
            Run again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
