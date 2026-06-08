export function calculateLevel(totalXp: number): {
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
} {
  let level = 1;
  let remaining = Math.max(0, totalXp);

  while (true) {
    const costToNext = 100 + (level - 1) * 50;
    if (remaining < costToNext) {
      return { level, xpIntoLevel: remaining, xpToNextLevel: costToNext };
    }
    remaining -= costToNext;
    level++;
  }
}
