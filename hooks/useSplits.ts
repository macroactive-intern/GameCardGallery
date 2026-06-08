"use client";

import { useTimerStore } from "@/store/timerStore";
import { computeFinalStats, type FinalStats } from "@/lib/timer/splits";

interface TimerActions {
  split: () => number;
  setElapsed: (ms: number) => void;
}

export function useSplits(
  timerActions: TimerActions,
  pbSegments?: Array<number | null>,
  pbMs: number | null = null,
) {
  const recordSplit = useTimerStore((s) => s.recordSplit);
  const undoSplit = useTimerStore((s) => s.undoSplit);
  const storeFinishRun = useTimerStore((s) => s.finishRun);
  const resetRun = useTimerStore((s) => s.resetRun);

  return {
    recordCurrentSplit: () => {
      const elapsed = timerActions.split();
      recordSplit(elapsed, pbSegments);
    },

    undoLastSplit: () => {
      const { currentSplitIndex, splitStartTimes } = useTimerStore.getState();
      if (currentSplitIndex === 0) return;
      const restoredElapsed = splitStartTimes[currentSplitIndex - 1] ?? 0;
      undoSplit();
      timerActions.setElapsed(restoredElapsed);
    },

    finishRun: (): FinalStats => {
      const elapsed = timerActions.split();
      storeFinishRun(elapsed);
      const { splits } = useTimerStore.getState();
      return computeFinalStats(splits, pbMs);
    },

    resetSplits: () => {
      resetRun();
    },
  };
}
