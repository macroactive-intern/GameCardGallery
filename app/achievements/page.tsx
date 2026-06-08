import Link from "next/link";
import { unstable_cache } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getAchievementOverview } from "@/lib/achievements/service";
import { calculateLevel } from "@/lib/achievements/xp";
import { UnlockNotification } from "@/components/achievements/UnlockNotification";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const getCachedLeaderboard = unstable_cache(
  async () => {
    console.log("[leaderboard] fetching from database");
    const rows = await prisma.userXp.findMany({
      take: 20,
      orderBy: { totalXp: "desc" },
      include: { user: { select: { name: true, image: true } } },
    });
    return rows.map((r) => ({
      userId: r.userId,
      name: r.user.name,
      image: r.user.image,
      totalXp: r.totalXp,
      ...calculateLevel(r.totalXp),
    }));
  },
  ["leaderboard"],
  { revalidate: 30 },
);

export default async function AchievementsPage() {
  const session = await requireAuth();
  const [overview, leaderboard] = await Promise.all([
    getAchievementOverview(prisma, session.user.id),
    getCachedLeaderboard(),
  ]);

  const { level, xpIntoLevel, xpToNextLevel } = overview.level;
  const xpPercent = Math.round((xpIntoLevel / xpToNextLevel) * 100);

  // Group templates by game
  const gameGroups: Record<string, { total: number; unlocked: number }> = {};
  for (const t of overview.templates) {
    if (!gameGroups[t.game]) gameGroups[t.game] = { total: 0, unlocked: 0 };
    gameGroups[t.game].total++;
    if (overview.unlockedIds.includes(t.id)) gameGroups[t.game].unlocked++;
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <UnlockNotification />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Achievements</h1>
        <span className="rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">
          Level {level}
        </span>
      </div>

      {/* XP progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{overview.totalXp} XP total</span>
          <span>
            {xpIntoLevel} / {xpToNextLevel} to level {level + 1}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {overview.unlockedCount} / {overview.totalTemplates} achievements
          unlocked
        </p>
      </div>

      {/* Games */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Games</h2>
        {Object.keys(gameGroups).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No achievement templates yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(gameGroups).map(([game, counts]) => (
              <Link
                key={game}
                href={`/achievements/${encodeURIComponent(game)}`}
                className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card className="h-full transition duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">{game}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {counts.unlocked} / {counts.total} unlocked
                    </p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.round((counts.unlocked / counts.total) * 100)}%`,
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Leaderboard */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Leaderboard</h2>
        {leaderboard.length === 0 ? (
          <p className="text-sm text-muted-foreground">No players yet.</p>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ol className="divide-y">
                {leaderboard.map((entry, i) => (
                  <li
                    key={entry.userId}
                    className="flex items-center justify-between px-6 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center text-sm font-medium text-muted-foreground">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {entry.name ?? "Anonymous"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Level {entry.level}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">
                      {entry.totalXp} XP
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
