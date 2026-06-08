import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getGameAchievements } from "@/lib/achievements/service";
import { parseRequiresIds } from "@/lib/achievements/prerequisites";
import { UnlockButton } from "@/components/achievements/UnlockButton";
import { UnlockNotification } from "@/components/achievements/UnlockNotification";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

type Props = {
  params: { game: string };
};

export default async function GameAchievementsPage({ params }: Props) {
  const session = await requireAuth();
  const game = decodeURIComponent(params.game);

  const templates = await getGameAchievements(prisma, session.user.id, game);

  if (templates.length === 0) notFound();

  const unlockedCount = templates.filter((t) => t.unlocked).length;

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <UnlockNotification />

      {/* Back link + header */}
      <div>
        <Link
          href="/achievements"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← All games
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{game}</h1>
          <span className="text-sm text-muted-foreground">
            {unlockedCount} / {templates.length} unlocked
          </span>
        </div>
      </div>

      {/* Achievement list */}
      <div className="space-y-4">
        {templates.map((t) => {
          const prereqIds = parseRequiresIds(t.requiresIds);
          const prereqTemplates = prereqIds
            .map((id) => templates.find((x) => x.id === id))
            .filter((x): x is NonNullable<typeof x> => Boolean(x));

          return (
            <Card
              key={t.id}
              className={t.unlocked ? "border-primary/50 bg-primary/5" : "opacity-80"}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">{t.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {t.description}
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {t.unlocked ? (
                      <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                        Unlocked
                      </span>
                    ) : (
                      <UnlockButton templateId={t.id} disabled={!t.canUnlock} />
                    )}
                    <span className="text-xs text-muted-foreground">
                      +{t.xpReward} XP
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-2 text-xs text-muted-foreground">
                {prereqTemplates.length > 0 && (
                  <p>
                    <span className="font-medium">Requires: </span>
                    {prereqTemplates.map((pre, i) => (
                      <span key={pre.id}>
                        {i > 0 && ", "}
                        <span className={pre.unlocked ? "text-primary" : "text-muted-foreground"}>
                          {pre.title}
                          {pre.unlocked ? " ✓" : " ✗"}
                        </span>
                      </span>
                    ))}
                  </p>
                )}

                {!t.unlocked && t.blockedBy.length > 0 && (
                  <p className="text-destructive">
                    <span className="font-medium">Blocked by: </span>
                    {t.blockedBy.map((b, i) => (
                      <span key={b.id}>
                        {i > 0 && ", "}
                        {b.title}
                      </span>
                    ))}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
