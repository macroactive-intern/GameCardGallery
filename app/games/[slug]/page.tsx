import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GameGrid } from "@/components/GameGrid";
import { getGameBySlug, getGames, getRelatedGames } from "@/lib/games";

type GamePageProps = {
  params: {
    slug: string;
  };
};

export async function generateStaticParams() {
  const games = await getGames();

  return games.map((game) => ({
    slug: game.slug,
  }));
}

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const game = await getGameBySlug(params.slug);

  if (!game) {
    return {
      title: "Game not found",
    };
  }

  return {
    title: game.title,
    description: game.description,
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const game = await getGameBySlug(params.slug);

  if (!game) {
    notFound();
  }

  const relatedGames = await getRelatedGames(game.slug);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-12 px-6 py-10 sm:px-8 lg:px-10">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)] lg:items-start">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
          <Image
            alt={`${game.title} cover`}
            className="object-cover"
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            src={game.coverUrl}
          />

          {game.featured ? (
            <span className="absolute left-4 top-4 rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
              Featured
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  {game.genre}
                </p>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {game.title}
                </h1>
              </div>

              <Link
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/games/${game.slug}/edit`}
              >
                Edit game
              </Link>
            </div>

            <p className="text-base leading-7 text-muted-foreground">
              {game.description}
            </p>
          </div>

          <dl className="grid gap-4 rounded-lg border bg-card p-5 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Platform</dt>
              <dd className="mt-1 font-medium">{game.platform}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Rating</dt>
              <dd className="mt-1 font-medium">{game.rating.toFixed(1)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Release year</dt>
              <dd className="mt-1 font-medium">{game.releaseYear}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2">
            {game.tags.map((tag) => (
              <span
                className="rounded-md bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Related games
          </h2>
          <p className="text-sm text-muted-foreground">
            More games in {game.genre}.
          </p>
        </div>

        <GameGrid games={relatedGames} />
      </section>
    </main>
  );
}
