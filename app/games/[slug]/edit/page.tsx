import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteGameButton } from "@/components/DeleteGameButton";
import { GameForm } from "@/components/GameForm";
import { getGameBySlug } from "@/lib/games";

type EditGamePageProps = {
  params: {
    slug: string;
  };
};

export async function generateMetadata({
  params,
}: EditGamePageProps): Promise<Metadata> {
  const game = await getGameBySlug(params.slug);

  if (!game) {
    return {
      title: "Game not found",
    };
  }

  return {
    title: `Edit ${game.title}`,
    description: `Update details for ${game.title}.`,
  };
}

export default async function EditGamePage({ params }: EditGamePageProps) {
  const game = await getGameBySlug(params.slug);

  if (!game) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-10 sm:px-8 lg:px-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Edit game
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {game.title}
          </h1>
        </div>

        <DeleteGameButton slug={game.slug} />
      </header>

      <GameForm game={game} mode="edit" />
    </main>
  );
}
