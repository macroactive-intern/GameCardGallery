import { create } from "zustand";
import { type Split, recordSplit as computeSplit } from "@/lib/timer/splits";

export type TimerStatus = "idle" | "running" | "paused" | "finished";

interface TimerState {
  status: TimerStatus;
  elapsedMs: number;
  game: string;
  category: string;
  splits: Split[];
  currentSplitIndex: number;
  splitStartTimes: number[];
}

interface TimerActions {
  setElapsed: (ms: number) => void;
  setStatus: (status: TimerStatus) => void;
  setGame: (game: string) => void;
  setCategory: (category: string) => void;
  setSplits: (splits: Split[]) => void;
  recordSplit: (elapsed: number, pbSegments?: Array<number | null>) => void;
  undoSplit: () => void;
  resetRun: () => void;
  finishRun: (elapsed: number) => void;
}

const initialState: TimerState = {
  status: "idle",
  elapsedMs: 0,
  game: "",
  category: "",
  splits: [],
  currentSplitIndex: 0,
  splitStartTimes: [0],
};

export const useTimerStore = create<TimerState & TimerActions>((set, get) => ({
  ...initialState,

  setElapsed: (ms) => {
    if (get().status === "finished") return;
    set({ elapsedMs: ms });
  },
  setStatus: (status) => set({ status }),
  setGame: (game) => set({ game }),
  setCategory: (category) => set({ category }),
  setSplits: (splits) => set({ splits, currentSplitIndex: 0, splitStartTimes: [0] }),

  recordSplit: (elapsed, pbSegments) => {
    const { splits, currentSplitIndex, splitStartTimes, status } = get();
    if (status !== "running") return;
    if (currentSplitIndex >= splits.length) return;

    const previousSplitElapsed = splitStartTimes[currentSplitIndex] ?? 0;
    // Fall back to each split's stored pbSegmentMs so hotkeys don't need to pass pbSegments explicitly
    const resolved = pbSegments ?? splits.map((s) => s.pbSegmentMs);
    const updated = computeSplit(splits, currentSplitIndex, elapsed, previousSplitElapsed, resolved);
    const nextIndex = currentSplitIndex + 1;
    const isLast = nextIndex === splits.length;

    set({
      splits: updated,
      currentSplitIndex: nextIndex,
      splitStartTimes: [...splitStartTimes, elapsed],
      ...(isLast && { status: "finished", elapsedMs: elapsed }),
    });
  },

  undoSplit: () => {
    const { splits, currentSplitIndex, splitStartTimes, status } = get();
    if (currentSplitIndex === 0) return;

    const newIndex = currentSplitIndex - 1;
    const restoredElapsed = splitStartTimes[newIndex] ?? 0;

    const cleared: Split = {
      ...splits[newIndex],
      elapsed: null,
      segmentMs: null,
      deltaMs: null,
      isGold: false,
    };
    const updatedSplits = [...splits];
    updatedSplits[newIndex] = cleared;

    set({
      splits: updatedSplits,
      currentSplitIndex: newIndex,
      elapsedMs: restoredElapsed,
      splitStartTimes: splitStartTimes.slice(0, newIndex + 1),
      status: status === "finished" ? "running" : status,
    });
  },

  resetRun: () =>
    set({
      ...initialState,
      game: get().game,
      category: get().category,
    }),

  finishRun: (elapsed) => {
    const { splits, currentSplitIndex, splitStartTimes } = get();
    if (currentSplitIndex !== splits.length - 1) return;

    const previousSplitElapsed = splitStartTimes[currentSplitIndex] ?? 0;
    const updated = computeSplit(splits, currentSplitIndex, elapsed, previousSplitElapsed);

    set({
      splits: updated,
      currentSplitIndex: splits.length,
      splitStartTimes: [...splitStartTimes, elapsed],
      elapsedMs: elapsed,
      status: "finished",
    });
  },
}));
