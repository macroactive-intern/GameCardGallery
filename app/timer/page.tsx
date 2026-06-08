import type { Metadata } from "next";
import Link from "next/link";
import { Timer } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { TimerClient } from "@/components/timer/TimerClient";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Speedrun Timer",
};

export default async function TimerPage() {
  const [session, games] = await Promise.all([
    auth(),
    prisma.speedrunGame.findMany({
      include: {
        categories: {
          select: { id: true, name: true, splitNames: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const initialGames = games.map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    categories: g.categories.map((c) => ({
      id: c.id,
      name: c.name,
      splitNames: JSON.parse(c.splitNames) as string[],
    })),
  }));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-10 sm:px-8">
      <header className="flex items-end justify-between">
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            <Timer className="h-4 w-4" />
            Speedrun Timer
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Timer</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/speedrun/records">Records</Link>
          </Button>
          {session?.user ? (
            <span className="text-sm text-muted-foreground">
              {session.user.name ?? session.user.email}
            </span>
          ) : (
            <Button size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </header>

      <TimerClient
        userId={session?.user?.id ?? null}
        initialGames={initialGames}
      />
    </main>
  );
}
