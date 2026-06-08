"use client";
import { useEffect, useRef } from "react";
import { useTimerStore } from "./store";

export function useTimerRaf() {
  const status = useTimerStore((s) => s.status);
  const tick = useTimerStore((s) => s.actions.tick);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (status !== "running") {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const loop = (now: number) => {
      tick(now);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [status, tick]);
}
