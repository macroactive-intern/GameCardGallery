"use client";

import { useState, useTransition } from "react";

import { deleteGameAction } from "@/actions/games";
import { Button } from "@/components/ui/button";

type DeleteGameButtonProps = {
  slug: string;
};

export function DeleteGameButton({ slug }: DeleteGameButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);

    const confirmed = window.confirm(
      "Delete this game? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await deleteGameAction(slug);

        if ("error" in result) {
          setError(result.error);
        }
      } catch {
        setError("Unable to delete game. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button
        disabled={isPending}
        onClick={handleDelete}
        type="button"
        variant="destructive"
      >
        {isPending ? "Deleting..." : "Delete game"}
      </Button>

      {error ? (
        <p className="max-w-56 text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
