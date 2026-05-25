import { GameForm } from "@/components/GameForm";

export default function NewGamePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-10 sm:px-8 lg:px-10">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Game Card Gallery
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Create a new game
        </h1>
      </header>

      <GameForm mode="create" />
    </main>
  );
}
