"use client";
import { useEffect } from "react";
import { useTimerStore } from "@/lib/speedrun/store";
import { Button } from "@/components/ui/button";

export function Controls() {
  const status = useTimerStore((s) => s.status);
  const actions = useTimerStore((s) => s.actions);
  const splitNames = useTimerStore((s) => s.splitNames);
  const configured = splitNames.length > 0;

  useEffect(() => {
    if (!configured) return;

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.code === "Space") {
        e.preventDefault();
        if (status === "idle") actions.start();
        else if (status === "running") actions.split();
      } else if (e.code === "KeyZ") {
        if (status === "running" || status === "finished") actions.undoSplit();
      } else if (e.code === "KeyR") {
        if (status === "running" || status === "finished") actions.reset();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [status, actions, configured]);

  if (!configured) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {status === "idle" && (
        <Button onClick={() => actions.start()}>
          Start
          <kbd className="ml-2 rounded bg-primary-foreground/20 px-1.5 text-xs font-normal">
            Space
          </kbd>
        </Button>
      )}
      {status === "running" && (
        <>
          <Button onClick={() => actions.split()}>
            Split
            <kbd className="ml-2 rounded bg-primary-foreground/20 px-1.5 text-xs font-normal">
              Space
            </kbd>
          </Button>
          <Button variant="outline" onClick={() => actions.undoSplit()}>
            Undo
            <kbd className="ml-2 rounded bg-muted-foreground/20 px-1.5 text-xs font-normal">
              Z
            </kbd>
          </Button>
        </>
      )}
      {(status === "running" || status === "finished") && (
        <Button variant="destructive" onClick={() => actions.reset()}>
          Reset
          <kbd className="ml-2 rounded bg-destructive-foreground/20 px-1.5 text-xs font-normal">
            R
          </kbd>
        </Button>
      )}
    </div>
  );
}
