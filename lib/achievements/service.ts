import { Prisma, PrismaClient } from "@prisma/client";
import { canUnlock, getBlockedBy } from "./prerequisites";
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
  const [templates, userAchievements] = await Promise.all([
    prisma.achievementTemplate.findMany({
      where: { game },
      orderBy: { title: "asc" },
    }),
    prisma.achievement.findMany({
      where: { userId },
      select: { templateId: true },
    }),
  ]);

  const unlockedIds = userAchievements.map((a) => a.templateId);

  return templates.map((t) => ({
    ...t,
    unlocked: unlockedIds.includes(t.id),
    canUnlock: canUnlock(t.id, templates, unlockedIds),
    blockedBy: getBlockedBy(t.id, templates, unlockedIds),
  }));
}

export async function unlockAchievementForUser(
  prisma: PrismaClient,
  userId: string,
  templateId: string,
) {
  const [templates, userAchievements, userXp] = await Promise.all([
    prisma.achievementTemplate.findMany(),
    prisma.achievement.findMany({
      where: { userId },
      select: { templateId: true },
    }),
    prisma.userXp.findUnique({ where: { userId } }),
  ]);

  const unlockedIds = userAchievements.map((a) => a.templateId);
  const template = templates.find((t) => t.id === templateId);

  if (!template) {
    return { error: "Achievement template not found" };
  }

  if (!canUnlock(templateId, templates, unlockedIds)) {
    return {
      error: "Prerequisites not met",
      blockedBy: getBlockedBy(templateId, templates, unlockedIds),
    };
  }

  try {
    await prisma.achievement.create({ data: { userId, templateId } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Achievement already unlocked" };
    }
    throw error;
  }

  const currentLevel = userXp?.level ?? 1;
  const newTotalXp = (userXp?.totalXp ?? 0) + template.xpReward;
  const { level: newLevel } = calculateLevel(newTotalXp);

  await prisma.userXp.upsert({
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
}
