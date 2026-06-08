import { EventEmitter } from "events";

// Module-level singleton — persists across requests in the Node.js dev server.
// SSE route handlers subscribe here; server actions emit here.
const g = globalThis as typeof globalThis & {
  __achievementEmitter?: EventEmitter;
};

export const achievementEmitter: EventEmitter =
  g.__achievementEmitter ?? (g.__achievementEmitter = new EventEmitter());

achievementEmitter.setMaxListeners(50);
