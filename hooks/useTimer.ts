"use client";

import { useRef, useEffect } from "react";
import { TimerEngine } from "@/lib/timer/engine";
import { useTimerStore } from "@/store/timerStore";

export function useTimer() {
  const setElapsedInStore = useTimerStore((s) => s.setElapsed);
  const setStatus = useTimerStore((s) => s.setStatus);

  // Keep the tick callback up-to-date without reconstructing the engine
  const onTickRef = useRef<(elapsed: number) => void>(setElapsedInStore);
  onTickRef.current = setElapsedInStore;

  const engineRef = useRef<TimerEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new TimerEngine((elapsed) => {
      onTickRef.current(elapsed);
    });
  }

  // Cancel the rAF loop when the component unmounts
  useEffect(() => {
    return () => {
      engineRef.current?.reset();
    };
  }, []);

  const engine = engineRef.current;

  return {
    start: () => {
      engine.start();
      setStatus("running");
    },
    pause: () => {
      engine.pause();
      setStatus("paused");
    },
    resume: () => {
      engine.resume();
      setStatus("running");
    },
    reset: () => {
      engine.reset();
      setStatus("idle");
      setElapsedInStore(0);
    },
    split: (): number => engine.split(),
    setElapsed: (ms: number) => {
      engine.setElapsed(ms);
      setElapsedInStore(ms);
    },
  };
}
