import { GameCard } from "@/components/GameCard";
import type { Game } from "@/lib/gameSchema";

type GameGridProps = {
  games: Game[];
};

export function GameGrid({ games }: GameGridProps) {
  if (games.length === 0) {
    return (
      <section className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
        No games found.
      </section>
    );
  }

  return (
    <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {games.map((game) => (
        <GameCard game={game} key={game.slug} />
      ))}
    </section>
  );
}
