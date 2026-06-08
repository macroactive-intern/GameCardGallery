export type LiveSplitEvent = {
  game: string;
  category: string;
  status: "idle" | "running" | "paused" | "finished";
  elapsedMs: number;
  currentSplitIndex: number;
  splits: Array<{ name: string; elapsed: number | null; segmentMs: number | null }>;
  updatedAt: number;
};

// Module-level store — suitable for dev/single-process. Replace with Redis for production.
const state = new Map<string, LiveSplitEvent>();
const listeners = new Map<string, Set<(e: LiveSplitEvent) => void>>();

export function publish(userId: string, event: LiveSplitEvent): void {
  state.set(userId, event);
  listeners.get(userId)?.forEach((cb) => cb(event));
}

export function getCurrent(userId: string): LiveSplitEvent | undefined {
  return state.get(userId);
}

export function subscribe(
  userId: string,
  cb: (e: LiveSplitEvent) => void,
): () => void {
  if (!listeners.has(userId)) listeners.set(userId, new Set());
  listeners.get(userId)!.add(cb);
  const current = state.get(userId);
  if (current) cb(current);
  return () => listeners.get(userId)?.delete(cb);
}
