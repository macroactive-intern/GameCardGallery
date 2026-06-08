export function formatMs(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  const cs = Math.floor((ms % 1_000) / 10);

  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  const cc = String(cs).padStart(2, "0");

  return `${hh}:${mm}:${ss}.${cc}`;
}

export function formatDelta(ms: number | null | undefined): string {
  if (ms == null) return "—";
  const sign = ms < 0 ? "-" : "+";
  return `${sign}${formatMs(Math.abs(ms))}`;
}
