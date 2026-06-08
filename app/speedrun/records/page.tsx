import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Trophy, Zap } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatTime } from "@/lib/speedrun/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Speedrun Records",
};

export const revalidate = 60;

export default async function RecordsPage() {
  const games = await prisma.speedrunGame.findMany({
    include: {
      categories: {
        include: {
          runs: {
            where: { userId: { not: null } },
            orderBy: { totalTime: "asc" },
            take: 5,
            include: { user: { select: { name: true } } },
          },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const gamesWithRecords = games
    .map((g) => ({
      id: g.id,
      name: g.name,
      categories: g.categories
        .filter((c) => c.runs.length > 0)
        .map((c) => {
          const splitNames = JSON.parse(c.splitNames) as string[];
          return {
            id: c.id,
            name: c.name,
            splitNames,
            runs: c.runs.map((r) => ({
              id: r.id,
              totalTime: r.totalTime,
              runner: r.user?.name ?? "Anonymous",
              createdAt: r.createdAt,
              splitTimes: JSON.parse(r.splitTimes) as number[],
              goldSplits: JSON.parse(r.goldSplits) as boolean[],
            })),
          };
        }),
    }))
    .filter((g) => g.categories.length > 0);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-10 sm:px-8">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/speedrun">
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

      {gamesWithRecords.length === 0 && (
        <div className="rounded-lg border p-12 text-center text-muted-foreground">
          No runs saved yet. Complete a run and save it to see records here.
        </div>
      )}

      {gamesWithRecords.map((game) => (
        <section key={game.id} className="space-y-4">
          <h2 className="text-xl font-semibold">{game.name}</h2>

          {game.categories.map((cat) => {
            const wr = cat.runs[0];
            const goldCount = wr.goldSplits.filter(Boolean).length;

            return (
              <Card key={cat.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-sm font-semibold">
                      {cat.name}
                    </CardTitle>
                    <div className="flex items-center gap-3 shrink-0">
                      {goldCount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-yellow-400">
                          <Zap className="h-3 w-3" />
                          {goldCount} gold
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-sm font-semibold text-yellow-500">
                        <Trophy className="h-3.5 w-3.5" />
                        {formatTime(wr.totalTime)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    by {wr.runner} ·{" "}
                    {new Date(wr.createdAt).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="divide-y rounded-md border text-xs">
                    {cat.splitNames.map((name, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-3 py-1.5"
                      >
                        <span className="flex-1 truncate text-muted-foreground">
                          {name}
                        </span>
                        {wr.goldSplits[i] && (
                          <Zap className="h-3 w-3 shrink-0 text-yellow-400" />
                        )}
                        <span className="font-mono tabular-nums">
                          {formatTime(wr.splitTimes[i] ?? 0)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {cat.runs.map((run, idx) => (
                      <Link
                        key={run.id}
                        href={`/speedrun/run/${run.id}`}
                        className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                      >
                        #{idx + 1} {run.runner} —{" "}
                        {formatTime(run.totalTime)}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      ))}
    </main>
  );
}
