import { Prisma, PrismaClient } from "@prisma/client";
import { canUnlock, getBlockedBy, parseRequiresIds } from "./prerequisites";
import { calculateLevel } from "./xp";

export async function getAchievementOverview(
  prisma: PrismaClient,
  userId: string,
) {
  const [templates, unlocked, userXp] = await Promise.all([
    prisma.achievementTemplate.findMany({ orderBy: { game: "asc" } }),
    prisma.achievement.findMany({
      where: { userId },
      include: { template: true },
      orderBy: { unlockedAt: "desc" },
    }),
    prisma.userXp.findUnique({ where: { userId } }),
  ]);

  const unlockedIds = unlocked.map((a) => a.templateId);
  const totalXp = userXp?.totalXp ?? 0;

  return {
    templates,
    unlocked,
    unlockedIds,
    totalTemplates: templates.length,
    unlockedCount: unlocked.length,
    totalXp,
    level: calculateLevel(totalXp),
  };
}

export async function getGameAchievements(
  prisma: PrismaClient,
  userId: string,
  game: string,
) {
  const templates = await prisma.achievementTemplate.findMany({
    where: { game },
    orderBy: { title: "asc" },
  });

  const templateIds = templates.map((t) => t.id);

  const userAchievements = await prisma.achievement.findMany({
    where: { userId, templateId: { in: templateIds } },
    select: { templateId: true },
  });

  const unlockedIds = userAchievements.map((a) => a.templateId);

  return templates.map((t) => ({
    ...t,
    unlocked: unlockedIds.includes(t.id),
    canUnlock: canUnlock(t.id, templates, unlockedIds),
    blockedBy: getBlockedBy(t.id, templates, unlockedIds),
  }));
}

export async function getLeaderboard(prisma: PrismaClient) {
  const rows = await prisma.userXp.findMany({
    take: 20,
    orderBy: { totalXp: "desc" },
    include: { user: { select: { name: true, image: true } } },
  });

  return rows.map((row) => ({
    userId: row.userId,
    name: row.user.name,
    image: row.user.image,
    totalXp: row.totalXp,
    ...calculateLevel(row.totalXp),
  }));
}

export async function unlockAchievementForUser(
  prisma: PrismaClient,
  userId: string,
  templateId: string,
) {
  return prisma.$transaction(async (tx) => {
    const [template, userAchievements, userXp] = await Promise.all([
      tx.achievementTemplate.findUnique({ where: { id: templateId } }),
      tx.achievement.findMany({
        where: { userId },
        select: { templateId: true },
      }),
      tx.userXp.findUnique({ where: { userId } }),
    ]);

    if (!template) {
      return { error: "Achievement template not found" };
    }

    const unlockedIds = userAchievements.map((a) => a.templateId);
    const requiredIds = parseRequiresIds(template.requiresIds);

    if (requiredIds.length > 0) {
      const prereqTemplates = await tx.achievementTemplate.findMany({
        where: { id: { in: requiredIds } },
      });

      const allRelevant = [template, ...prereqTemplates];

      if (!canUnlock(templateId, allRelevant, unlockedIds)) {
        return {
          error: "Prerequisites not met",
          blockedBy: getBlockedBy(templateId, allRelevant, unlockedIds),
        };
      }
    }

    try {
      await tx.achievement.create({ data: { userId, templateId } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return { error: "Achievement already unlocked" };
      }
      throw error;
    }

    // currentLevel defaults to 1 for a brand-new user. Because calculateLevel(xpReward)
    // for any positive reward also returns level 1, levelledUp will be false on the very
    // first unlock. This is intentional: earning the first achievement is not a level-up.
    const currentLevel = userXp?.level ?? 1;
    const newTotalXp = (userXp?.totalXp ?? 0) + template.xpReward;
    const { level: newLevel } = calculateLevel(newTotalXp);

    await tx.userXp.upsert({
      where: { userId },
      create: { userId, totalXp: newTotalXp, level: newLevel },
      update: { totalXp: newTotalXp, level: newLevel },
    });

    const levelledUp = newLevel > currentLevel;

    return {
      success: true as const,
      achievement: template,
      xpReward: template.xpReward,
      levelledUp,
      newLevel: levelledUp ? newLevel : undefined,
    };
  });
}
