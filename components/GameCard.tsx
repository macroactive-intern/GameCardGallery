"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Game } from "@/lib/gameSchema";

type GameCardProps = {
  game: Game;
};

export function GameCard({ game }: GameCardProps) {
  const [hasImageError, setHasImageError] = useState(false);

  return (
    <Link
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      href={`/games/${game.slug}`}
    >
      <Card className="h-full overflow-hidden transition duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {hasImageError ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
              Cover image unavailable
            </div>
          ) : (
            <Image
              alt={`${game.title} cover`}
              className="object-cover transition duration-300 group-hover:scale-105"
              fill
              onError={() => setHasImageError(true)}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              src={game.coverUrl}
            />
          )}

          {game.featured ? (
            <span className="absolute left-3 top-3 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
              Featured
            </span>
          ) : null}
        </div>

        <CardHeader>
          <CardTitle className="line-clamp-2 text-lg">{game.title}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{game.genre}</p>
          <p>{game.platform}</p>
        </CardContent>

        <CardFooter>
          <p className="text-sm font-medium text-foreground">
            Rating {game.rating.toFixed(1)}
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
}
