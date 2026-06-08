import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Trophy, Zap } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getWorldRecords } from "@/lib/runs/service";
import { formatMs } from "@/lib/timer/formatter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Speedrun Records",
};

export const revalidate = 60;

export default async function RecordsPage() {
  const wrs = await getWorldRecords(prisma);

  // Group by game then category (getWorldRecords already sorts by game/category)
  const byGame = new Map<string, typeof wrs>();
  for (const run of wrs) {
    const key = run.game;
    if (!byGame.has(key)) byGame.set(key, []);
    byGame.get(key)!.push(run);
  }

  type SavedSplit = { name: string; segmentMs: number | null };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-10 sm:px-8">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/timer">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Timer
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Records</h1>
          <p className="text-sm text-muted-foreground">
            World records by game and category
          </p>
        </div>
      </header>

      {byGame.size === 0 && (
        <div className="rounded-lg border p-12 text-center text-muted-foreground">
          No runs saved yet. Complete a run and save it to see records here.
        </div>
      )}

      {Array.from(byGame.entries()).map(([gameName, runs]) => (
        <section key={gameName} className="space-y-4">
          <h2 className="text-xl font-semibold">{gameName}</h2>

          {runs.map((run) => {
            const splits = Array.isArray(run.splits)
              ? (run.splits as SavedSplit[])
              : [];
            const goldCount = run.goldSplits.filter(Boolean).length;
            const runner = run.runner ?? "Anonymous";

            return (
              <Card key={run.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-semibold">
                        {run.category}
                      </CardTitle>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        by {runner} ·{" "}
                        {new Date(run.createdAt).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      {goldCount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-yellow-400">
                          <Zap className="h-3 w-3" />
                          {goldCount} gold
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-sm font-semibold text-yellow-500">
                        <Trophy className="h-3.5 w-3.5" />
                        {formatMs(run.totalMs)}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                {splits.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="divide-y rounded-md border text-xs">
                      {splits.map((split, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-3 py-1.5"
                        >
                          <span className="flex-1 truncate text-muted-foreground">
                            {split.name}
                          </span>
                          {run.goldSplits[i] && (
                            <Zap className="h-3 w-3 shrink-0 text-yellow-400" />
                          )}
                          <span className="font-mono tabular-nums">
                            {split.segmentMs !== null
                              ? formatMs(split.segmentMs)
                              : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}

                <CardContent className="pt-2 pb-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/runs/${run.id}`}>View run</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>
      ))}
    </main>
  );
}
