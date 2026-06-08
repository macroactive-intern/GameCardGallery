import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trophy, Zap } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getRunById } from "@/lib/runs/service";
import { formatMs } from "@/lib/timer/formatter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const run = await getRunById(prisma, params.id);
  if (!run) return {};
  return {
    title: `${run.game} — ${run.category} — ${formatMs(run.totalMs)}`,
  };
}

export default async function RunPage({ params }: Props) {
  const run = await getRunById(prisma, params.id);
  if (!run) notFound();

  type SavedSplit = { name: string; segmentMs: number | null };
  const savedSplits = Array.isArray(run.splits)
    ? (run.splits as SavedSplit[])
    : [];

  // Derive cumulative elapsed from segment times
  let cumulative = 0;
  const rows = savedSplits.map((split, i) => {
    cumulative += split.segmentMs ?? 0;
    return {
      name: split.name,
      segmentMs: split.segmentMs,
      elapsedMs: cumulative,
      isGold: run.goldSplits[i] ?? false,
    };
  });

  const runner = run.runner ?? "Anonymous";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-10 sm:px-8">
      <header className="flex items-start gap-4">
        <Button variant="ghost" size="sm" asChild className="mt-1 shrink-0">
          <Link href="/timer">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Timer
          </Link>
        </Button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {run.game} — {run.category}
            </p>
            {run.isWR && (
              <span className="flex items-center gap-1 text-xs font-medium text-purple-400">
                <Trophy className="h-3 w-3" />
                World Record
              </span>
            )}
          </div>

          <h1 className="mt-1 font-mono text-4xl font-bold tabular-nums tracking-tight">
            {formatMs(run.totalMs)}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            by {runner} ·{" "}
            {new Date(run.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
      </header>

      {rows.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Splits</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2 text-left font-medium">Split</th>
                  <th className="px-4 py-2 text-right font-medium">Segment</th>
                  <th className="px-4 py-2 text-right font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row, i) => (
                  <tr key={i} className={cn(row.isGold && "bg-yellow-500/5")}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2 font-medium">
                        {row.isGold && (
                          <Zap className="h-3.5 w-3.5 shrink-0 text-yellow-400" />
                        )}
                        <span className="truncate">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                      {row.segmentMs !== null ? formatMs(row.segmentMs) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                      {formatMs(row.elapsedMs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <div>
        <Button asChild>
          <Link href="/timer">Run this route</Link>
        </Button>
      </div>
    </main>
  );
}
