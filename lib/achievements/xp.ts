export function calculateLevel(totalXp: number): {
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
} {
  if (!Number.isFinite(totalXp)) {
    return { level: 1, xpIntoLevel: 0, xpToNextLevel: 100 };
  }

  let level = 1;
  let remaining = Math.max(0, Math.floor(totalXp));

  while (true) {
    const costToNext = 100 + (level - 1) * 50;
    if (remaining < costToNext) {
      return { level, xpIntoLevel: remaining, xpToNextLevel: costToNext };
    }
    remaining -= costToNext;
    level++;
  }
}
