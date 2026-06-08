export function formatTime(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  const f = Math.floor(ms % 1_000);
  const ss = String(s).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const fff = String(f).padStart(3, "0");
  return h > 0 ? `${h}:${mm}:${ss}.${fff}` : `${mm}:${ss}.${fff}`;
}

export function formatDelta(ms: number): string {
  const sign = ms < 0 ? "−" : "+";
  return `${sign}${formatTime(Math.abs(ms))}`;
}
