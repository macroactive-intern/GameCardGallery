import { describe, it, expect } from "vitest";
import {
  recordSplit,
  computeFinalStats,
  loadPbs,
  type Split,
} from "@/lib/timer/splits";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSplits(names: string[]): Split[] {
  return names.map((name) => ({
    name,
    elapsed: null,
    segmentMs: null,
    pbSegmentMs: null,
    deltaMs: null,
    isGold: false,
  }));
}

// ── recordSplit ───────────────────────────────────────────────────────────────

describe("recordSplit", () => {
  it("records the first split correctly", () => {
    const splits = makeSplits(["World 1", "World 2"]);
    const result = recordSplit(splits, 0, 5_000, 0);

    expect(result[0].elapsed).toBe(5_000);
    expect(result[0].segmentMs).toBe(5_000);
  });

  it("records a later split with correct segment duration", () => {
    const splits = makeSplits(["W1", "W2", "W3"]);
    const after1 = recordSplit(splits, 0, 5_000, 0);
    const after2 = recordSplit(after1, 1, 12_000, 5_000);

    expect(after2[1].elapsed).toBe(12_000);
    expect(after2[1].segmentMs).toBe(7_000); // 12000 - 5000
  });

  it("calculates segment duration from previousSplitElapsed", () => {
    const splits = makeSplits(["A", "B"]);
    const result = recordSplit(splits, 1, 20_000, 8_000);

    expect(result[1].segmentMs).toBe(12_000); // 20000 - 8000
  });

  it("calculates delta vs PB when pbSegments provided", () => {
    const splits = makeSplits(["W1"]);
    const result = recordSplit(splits, 0, 5_000, 0, [6_000]);

    expect(result[0].pbSegmentMs).toBe(6_000);
    expect(result[0].deltaMs).toBe(-1_000); // 5000 - 6000 = -1000 (ahead)
  });

  it("calculates positive delta when behind PB", () => {
    const splits = makeSplits(["W1"]);
    const result = recordSplit(splits, 0, 7_000, 0, [6_000]);

    expect(result[0].deltaMs).toBe(1_000); // 7000 - 6000 = +1000 (behind)
  });

  it("detects gold split when segment beats PB", () => {
    const splits = makeSplits(["W1"]);
    const gold = recordSplit(splits, 0, 5_000, 0, [6_000]);
    const notGold = recordSplit(splits, 0, 7_000, 0, [6_000]);

    expect(gold[0].isGold).toBe(true);
    expect(notGold[0].isGold).toBe(false);
  });

  it("sets delta and isGold to null/false when no pbSegments", () => {
    const splits = makeSplits(["W1"]);
    const result = recordSplit(splits, 0, 5_000, 0);

    expect(result[0].deltaMs).toBeNull();
    expect(result[0].isGold).toBe(false);
  });

  it("does not mutate the input splits array", () => {
    const splits = makeSplits(["W1"]);
    const original = splits[0];
    recordSplit(splits, 0, 5_000, 0);

    expect(splits[0]).toBe(original);
    expect(splits[0].elapsed).toBeNull();
  });
});

// ── computeFinalStats ─────────────────────────────────────────────────────────

describe("computeFinalStats", () => {
  const finishedSplits: Split[] = [
    { name: "W1", elapsed: 5_000, segmentMs: 5_000, pbSegmentMs: null, deltaMs: null, isGold: false },
    { name: "W2", elapsed: 12_000, segmentMs: 7_000, pbSegmentMs: null, deltaMs: null, isGold: false },
  ];

  it("derives totalMs from the last split's elapsed", () => {
    const stats = computeFinalStats(finishedSplits, null);
    expect(stats.totalMs).toBe(12_000);
  });

  it("marks isNewPb true when there is no previous PB", () => {
    const stats = computeFinalStats(finishedSplits, null);
    expect(stats.isNewPb).toBe(true);
    expect(stats.pbImprovement).toBeNull();
  });

  it("marks isNewPb true when run beats the previous PB", () => {
    const stats = computeFinalStats(finishedSplits, 13_000);
    expect(stats.isNewPb).toBe(true);
    expect(stats.pbImprovement).toBe(1_000); // 13000 - 12000
  });

  it("marks isNewPb false when run is slower than the previous PB", () => {
    const stats = computeFinalStats(finishedSplits, 11_000);
    expect(stats.isNewPb).toBe(false);
    expect(stats.pbImprovement).toBe(-1_000); // 11000 - 12000
  });

  it("counts gold splits correctly", () => {
    const withGolds: Split[] = [
      { name: "W1", elapsed: 5_000, segmentMs: 5_000, pbSegmentMs: null, deltaMs: null, isGold: true },
      { name: "W2", elapsed: 12_000, segmentMs: 7_000, pbSegmentMs: null, deltaMs: null, isGold: true },
      { name: "W3", elapsed: 20_000, segmentMs: 8_000, pbSegmentMs: null, deltaMs: null, isGold: false },
    ];
    const stats = computeFinalStats(withGolds, null);
    expect(stats.goldCount).toBe(2);
  });
});

// ── loadPbs ───────────────────────────────────────────────────────────────────

describe("loadPbs", () => {
  it("returns null bestTotalMs and empty segments for an empty run list", () => {
    const { bestTotalMs, bestSegments } = loadPbs([]);
    expect(bestTotalMs).toBeNull();
    expect(bestSegments).toEqual([]);
  });

  it("loads PBs from runs with plain number arrays", () => {
    const runs = [
      { totalMs: 10_000, splits: [5_000, 5_000] },
      { totalMs: 9_000, splits: [4_000, 5_000] },
    ];
    const { bestTotalMs, bestSegments } = loadPbs(runs);
    expect(bestTotalMs).toBe(9_000);
    expect(bestSegments).toEqual([4_000, 5_000]); // best per segment
  });

  it("loads PBs from runs with JSON-stringified number arrays", () => {
    const runs = [{ totalMs: 8_000, splits: JSON.stringify([3_000, 5_000]) }];
    const { bestTotalMs, bestSegments } = loadPbs(runs);
    expect(bestTotalMs).toBe(8_000);
    expect(bestSegments).toEqual([3_000, 5_000]);
  });

  it("loads PBs from runs with split objects containing segmentMs", () => {
    const runs = [
      {
        totalMs: 9_000,
        splits: [
          { name: "W1", segmentMs: 4_000 },
          { name: "W2", segmentMs: 5_000 },
        ],
      },
    ];
    const { bestTotalMs, bestSegments } = loadPbs(runs);
    expect(bestTotalMs).toBe(9_000);
    expect(bestSegments).toEqual([4_000, 5_000]);
  });

  it("picks the best segment time across multiple runs", () => {
    const runs = [
      { totalMs: 12_000, splits: [4_000, 8_000] },
      { totalMs: 11_000, splits: [6_000, 5_000] },
    ];
    const { bestSegments } = loadPbs(runs);
    expect(bestSegments[0]).toBe(4_000); // best of 4000 and 6000
    expect(bestSegments[1]).toBe(5_000); // best of 8000 and 5000
  });

  it("ignores runs with invalid/non-parseable split JSON safely", () => {
    const runs = [
      { totalMs: 10_000, splits: "not valid json {{" },
      { totalMs: 9_000, splits: [4_000, 5_000] },
    ];
    const { bestTotalMs, bestSegments } = loadPbs(runs);
    expect(bestTotalMs).toBe(9_000); // still picks up the valid run's total
    expect(bestSegments).toEqual([4_000, 5_000]);
  });

  it("ignores runs where splits is not an array", () => {
    const runs = [
      { totalMs: 10_000, splits: { not: "an array" } },
      { totalMs: 8_000, splits: [3_000, 5_000] },
    ];
    const { bestSegments } = loadPbs(runs);
    expect(bestSegments).toEqual([3_000, 5_000]);
  });

  it("handles segments with null segmentMs without crashing", () => {
    const runs = [
      {
        totalMs: 9_000,
        splits: [{ name: "W1", segmentMs: null }, { name: "W2", segmentMs: 5_000 }],
      },
    ];
    const { bestSegments } = loadPbs(runs);
    // null segmentMs is skipped by parseSegments
    expect(bestSegments).toEqual([5_000]);
  });
});
