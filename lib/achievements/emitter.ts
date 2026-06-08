import { EventEmitter } from "events";

// WARNING: This emitter is process-local. SSE streams and server actions must
// execute on the same Node.js process. Do NOT use in multi-process deployments
// (PM2 cluster, Vercel, containerised horizontal scaling) without replacing this
// with a cross-process pub/sub transport (e.g. Redis Pub/Sub).
const g = globalThis as typeof globalThis & {
  __achievementEmitter?: EventEmitter;
};

export const achievementEmitter: EventEmitter =
  g.__achievementEmitter ?? (g.__achievementEmitter = new EventEmitter());

achievementEmitter.setMaxListeners(50);
