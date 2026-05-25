import { notFound } from "next/navigation";

import { deleteGameAction } from "@/actions/games";
import { GameForm } from "@/components/GameForm";
import { Button } from "@/components/ui/button";
import { getGameBySlug } from "@/lib/games";

type EditGamePageProps = {
  params: {
    slug: string;
  };
};

export default async function EditGamePage({ params }: EditGamePageProps) {
  const game = await getGameBySlug(params.slug);

  if (!game) {
    notFound();
  }

  const slug = game.slug;

  async function deleteGame() {
    "use server";

    const result = await deleteGameAction(slug);

    if ("error" in result) {
      throw new Error(result.error);
    }

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

        <form action={deleteGame}>
          <Button type="submit" variant="destructive">
            Delete game
          </Button>
        </form>
      </header>

      <GameForm game={game} mode="edit" />
    </main>
  );
}
