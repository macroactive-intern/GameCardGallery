"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTimerStore } from "@/store/timerStore";

const STORAGE_KEY = "macroactive:hotkeys";

export interface HotkeyConfig {
  split: string;
  reset: string;
  pause: string;
  undo: string;
}

const defaultHotkeys: HotkeyConfig = {
  split: "Space",
  reset: "r",
  pause: "p",
  undo: "Backspace",
};

interface TimerActions {
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  split: () => number;
  setElapsed: (ms: number) => void;
}

function loadConfig(): HotkeyConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultHotkeys;
    return { ...defaultHotkeys, ...JSON.parse(raw) };
  } catch {
    return defaultHotkeys;
  }
}

function saveConfig(config: HotkeyConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore write errors
  }
}

function matches(key: string, e: KeyboardEvent): boolean {
  return e.key === key || e.code === key;
}

export function useHotkeys(timerActions: TimerActions): {
  hotkeys: HotkeyConfig;
  remap: (next: Partial<HotkeyConfig>) => void;
} {
  const [hotkeys, setHotkeys] = useState<HotkeyConfig>(defaultHotkeys);

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    setHotkeys(loadConfig());
  }, []);

  // Always-current refs so the keydown closure never goes stale
  const hotkeysRef = useRef(hotkeys);
  hotkeysRef.current = hotkeys;

  const actionsRef = useRef(timerActions);
  actionsRef.current = timerActions;

  const recordSplit = useTimerStore((s) => s.recordSplit);
  const undoSplit = useTimerStore((s) => s.undoSplit);
  const resetRun = useTimerStore((s) => s.resetRun);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      const keys = hotkeysRef.current;
      const actions = actionsRef.current;
      const { status, currentSplitIndex, splitStartTimes } =
        useTimerStore.getState();

      if (matches(keys.split, e)) {
        e.preventDefault();
        if (status === "idle") {
          actions.start();
        } else if (status === "running") {
          const elapsed = actions.split();
          recordSplit(elapsed);
        }
        return;
      }

      if (matches(keys.pause, e)) {
        e.preventDefault();
        if (status === "running") actions.pause();
        else if (status === "paused") actions.resume();
        return;
      }

      if (matches(keys.reset, e)) {
        e.preventDefault();
        actions.reset();
        resetRun();
        return;
      }

      if (matches(keys.undo, e)) {
        e.preventDefault();
        if (currentSplitIndex === 0) return;
        const restoredElapsed = splitStartTimes[currentSplitIndex - 1] ?? 0;
        undoSplit();
        actions.setElapsed(restoredElapsed);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [recordSplit, undoSplit, resetRun]);

  const remap = useCallback((next: Partial<HotkeyConfig>) => {
    setHotkeys((prev) => {
      const updated = { ...prev, ...next };
      saveConfig(updated);
      return updated;
    });
  }, []);

  return { hotkeys, remap };
}
