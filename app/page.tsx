import Link from "next/link";

import { GameGrid } from "@/components/GameGrid";
import { Button } from "@/components/ui/button";
import { getGames } from "@/lib/games";

export default async function HomePage() {
  const games = await getGames();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10 sm:px-8 lg:px-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Game Card Gallery
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Explore the collection
          </h1>
        </div>

        <Button asChild>
          <Link href="/games/new">Create new game</Link>
        </Button>
      </header>

      <GameGrid games={games} />
    </main>
  );
}
