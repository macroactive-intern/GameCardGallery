"use client";

import { useTransition } from "react";

import { unlockAchievement } from "@/actions/achievements";
import { Button } from "@/components/ui/button";

type Props = {
  templateId: string;
  disabled?: boolean;
};

export function UnlockButton({ templateId, disabled }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await unlockAchievement(templateId);
    });
  }

  return (
    <Button disabled={disabled || isPending} onClick={handleClick} size="sm">
      {isPending ? "Unlocking…" : "Unlock"}
    </Button>
  );
}
