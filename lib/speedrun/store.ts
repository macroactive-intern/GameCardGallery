"use client";
import { create } from "zustand";

export type SplitResult = {
  name: string;
  splitTime: number;
  segmentTime: number;
  pbSegmentTime: number | null;
  goldSegmentTime: number | null;
  delta: number | null;
  isGold: boolean;
};

export type TimerStatus = "idle" | "running" | "finished";

type State = {
  status: TimerStatus;
  startAnchor: number | null;
  elapsed: number;
  splits: SplitResult[];
  currentSplitIndex: number;
  splitNames: string[];
  pbSplitTimes: number[] | null;
  goldSplitTimes: number[] | null;
};

type Actions = {
  configure: (
    splitNames: string[],
    pbSplitTimes: number[] | null,
    goldSplitTimes: number[] | null,
  ) => void;
  start: () => void;
  split: () => void;
  undoSplit: () => void;
  reset: () => void;
  tick: (now: number) => void;
};

const BLANK: State = {
  status: "idle",
  startAnchor: null,
  elapsed: 0,
  splits: [],
  currentSplitIndex: 0,
  splitNames: [],
  pbSplitTimes: null,
  goldSplitTimes: null,
};

export const useTimerStore = create<State & { actions: Actions }>(
  (set, get) => ({
    ...BLANK,
    actions: {
      configure(splitNames, pbSplitTimes, goldSplitTimes) {
        set({ ...BLANK, splitNames, pbSplitTimes, goldSplitTimes });
      },

      start() {
        if (get().status !== "idle") return;
        set({ startAnchor: performance.now(), status: "running" });
      },

      split() {
        const {
          status,
          startAnchor,
          splits,
          currentSplitIndex,
          splitNames,
          pbSplitTimes,
          goldSplitTimes,
        } = get();
        if (status !== "running" || startAnchor === null) return;

        const elapsed = performance.now() - startAnchor;
        const prevSplitTime = splits.at(-1)?.splitTime ?? 0;
        const segmentTime = elapsed - prevSplitTime;
        const pbSegmentTime = pbSplitTimes?.[currentSplitIndex] ?? null;
        const goldSegmentTime = goldSplitTimes?.[currentSplitIndex] ?? null;

        const newSplit: SplitResult = {
          name: splitNames[currentSplitIndex],
          splitTime: elapsed,
          segmentTime,
          pbSegmentTime,
          goldSegmentTime,
          delta: pbSegmentTime !== null ? segmentTime - pbSegmentTime : null,
          isGold:
            goldSegmentTime !== null ? segmentTime < goldSegmentTime : false,
        };

        const newSplits = [...splits, newSplit];
        const nextIndex = currentSplitIndex + 1;
        const finished = nextIndex >= splitNames.length;

        set({
          splits: newSplits,
          currentSplitIndex: nextIndex,
          elapsed,
          status: finished ? "finished" : "running",
        });
      },

      undoSplit() {
        const { splits, status } = get();
        if (splits.length === 0 || status === "idle") return;
        const newSplits = splits.slice(0, -1);
        set({
          splits: newSplits,
          currentSplitIndex: newSplits.length,
          status: "running",
        });
      },

      reset() {
        const { splitNames, pbSplitTimes, goldSplitTimes } = get();
        set({ ...BLANK, splitNames, pbSplitTimes, goldSplitTimes });
      },

      tick(now) {
        const { status, startAnchor } = get();
        if (status !== "running" || startAnchor === null) return;
        set({ elapsed: now - startAnchor });
      },
    },
  }),
);
