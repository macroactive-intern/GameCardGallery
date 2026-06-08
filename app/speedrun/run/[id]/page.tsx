import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Zap } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatTime } from "@/lib/speedrun/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { params: { id: string } };

async function getRun(id: string) {
  return prisma.speedrunRun.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      category: {
        include: { game: { select: { name: true } } },
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const run = await getRun(params.id);
  if (!run) return {};
  const runner = run.user?.name ?? "Anonymous";
  return {
    title: `${run.category.game.name} ${run.category.name} — ${formatTime(run.totalTime)} by ${runner}`,
  };
}

export default async function RunPage({ params }: Props) {
  const run = await getRun(params.id);
  if (!run) notFound();

  const splitNames = JSON.parse(run.category.splitNames) as string[];
  const splitTimes = JSON.parse(run.splitTimes) as number[];
  const goldSplits = JSON.parse(run.goldSplits) as boolean[];
  const runner = run.user?.name ?? "Anonymous";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-10 sm:px-8">
      <header className="flex items-start gap-4">
        <Button variant="ghost" size="sm" asChild className="mt-1 shrink-0">
          <Link href="/speedrun/records">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Records
          </Link>
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">
            {run.category.game.name} — {run.category.name}
          </p>
          <h1 className="mt-1 font-mono text-4xl font-bold tabular-nums tracking-tight">
            {formatTime(run.totalTime)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            by {runner} · {new Date(run.createdAt).toLocaleString()}
          </p>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Splits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y rounded-md border text-sm">
            {splitNames.map((name, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex-1 truncate font-medium">{name}</span>
                {goldSplits[i] && (
                  <Zap className="h-3.5 w-3.5 shrink-0 text-yellow-400" />
                )}
                <span className="font-mono tabular-nums">
                  {formatTime(splitTimes[i] ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <Button asChild>
          <Link href="/speedrun">Try this route</Link>
        </Button>
      </div>
    </main>
  );
}
