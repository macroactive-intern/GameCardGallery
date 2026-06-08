"use client";

import { useTransition, useState } from "react";

import { unlockAchievement } from "@/actions/achievements";
import { Button } from "@/components/ui/button";

type Props = {
  templateId: string;
  disabled?: boolean;
};

export function UnlockButton({ templateId, disabled }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await unlockAchievement(templateId);
      if ("error" in result) setError(result.error ?? "Something went wrong");
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button disabled={disabled || isPending} onClick={handleClick} size="sm">
        {isPending ? "Unlocking…" : "Unlock"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
