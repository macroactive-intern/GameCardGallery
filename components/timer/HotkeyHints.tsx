"use client";

import { useState, useEffect } from "react";
import type { HotkeyConfig } from "@/hooks/useHotkeys";
import { cn } from "@/lib/utils";

interface Props {
  hotkeys: HotkeyConfig;
  remap: (next: Partial<HotkeyConfig>) => void;
}

type HotkeyKey = keyof HotkeyConfig;

const LABELS: Record<HotkeyKey, string> = {
  split: "Split",
  pause: "Pause",
  reset: "Reset",
  undo: "Undo",
};

function displayKey(key: string): string {
  if (key === " " || key === "Space") return "Space";
  if (key === "Backspace") return "⌫";
  return key.length === 1 ? key.toUpperCase() : key;
}

export function HotkeyHints({ hotkeys, remap }: Props) {
  const [listening, setListening] = useState<HotkeyKey | null>(null);

  useEffect(() => {
    if (!listening) return;

    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === "Escape") {
        setListening(null);
        return;
      }
      // Prefer e.code for Space, e.key for everything else
      const value = e.code === "Space" ? "Space" : e.key;
      remap({ [listening]: value });
      setListening(null);
    };

    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, [listening, remap]);

  return (
    <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
      {(Object.keys(LABELS) as HotkeyKey[]).map((action) => (
        <button
          key={action}
          title="Click to remap"
          onClick={() => setListening((prev) => (prev === action ? null : action))}
          className={cn(
            "flex items-center gap-1.5 rounded-md border px-2 py-1 transition-colors hover:border-foreground/40 hover:text-foreground",
            listening === action &&
              "border-primary bg-primary/10 text-primary ring-1 ring-primary",
          )}
        >
          <span>{LABELS[action]}</span>
          <kbd
            className={cn(
              "rounded bg-muted px-1.5 py-0.5 font-mono font-medium",
              listening === action && "bg-primary/20",
            )}
          >
            {listening === action ? "…" : displayKey(hotkeys[action])}
          </kbd>
        </button>
      ))}
    </div>
  );
}
