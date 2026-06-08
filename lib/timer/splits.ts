export type Split = {
  name: string;
  elapsed: number | null;
  segmentMs: number | null;
  pbSegmentMs: number | null;
  deltaMs: number | null;
  isGold: boolean;
};

export type FinalStats = {
  totalMs: number;
  isNewPb: boolean;
  pbImprovement: number | null;
  goldCount: number;
};

export function recordSplit(
  splits: Split[],
  index: number,
  elapsed: number,
  previousSplitElapsed: number,
  pbSegments?: Array<number | null>,
): Split[] {
  const segmentMs = elapsed - previousSplitElapsed;
  const pbSegmentMs = pbSegments?.[index] ?? null;
  const deltaMs = pbSegmentMs !== null ? segmentMs - pbSegmentMs : null;
  const isGold = pbSegmentMs !== null ? segmentMs < pbSegmentMs : false;

  const updated: Split = {
    ...splits[index],
    elapsed,
    segmentMs,
    pbSegmentMs,
    deltaMs,
    isGold,
  };

  const next = [...splits];
  next[index] = updated;
  return next;
}

export function computeFinalStats(
  splits: Split[],
  previousPb: number | null,
): FinalStats {
  const totalMs = splits.at(-1)?.elapsed ?? 0;
  const isNewPb = previousPb === null || totalMs < previousPb;
  const pbImprovement = previousPb !== null ? previousPb - totalMs : null;
  const goldCount = splits.filter((s) => s.isGold).length;

  return { totalMs, isNewPb, pbImprovement, goldCount };
}

function parseSegments(raw: unknown): number[] | null {
  let data: unknown = raw;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }

  if (!Array.isArray(data)) return null;

  const segments: number[] = [];
  for (const item of data) {
    if (typeof item === "number" && Number.isFinite(item) && item >= 0) {
      segments.push(item);
    } else if (item !== null && typeof item === "object" && "segmentMs" in item) {
      const seg = (item as { segmentMs: unknown }).segmentMs;
      if (typeof seg === "number" && Number.isFinite(seg) && seg >= 0) {
        segments.push(seg);
      }
    }
  }

  return segments.length > 0 ? segments : null;
}

export function loadPbs(runs: Array<{ totalMs: number; splits: unknown }>): {
  bestTotalMs: number | null;
  bestSegments: Array<number | null>;
} {
  if (runs.length === 0) {
    return { bestTotalMs: null, bestSegments: [] };
  }

  const bestTotalMs = Math.min(...runs.map((r) => r.totalMs));

  const allSegments = runs
    .map((r) => parseSegments(r.splits))
    .filter((s): s is number[] => s !== null);

  if (allSegments.length === 0) {
    return { bestTotalMs, bestSegments: [] };
  }

  const maxLen = Math.max(...allSegments.map((s) => s.length));
  const bestSegments: Array<number | null> = Array.from(
    { length: maxLen },
    (_, i) => {
      const times = allSegments
        .map((s) => s[i])
        .filter((t): t is number => t !== undefined);
      return times.length > 0 ? Math.min(...times) : null;
    },
  );

  return { bestTotalMs, bestSegments };
}
