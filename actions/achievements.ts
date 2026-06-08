"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { unlockAchievementForUser } from "@/lib/achievements/service";
import { achievementEmitter } from "@/lib/achievements/emitter";

export async function unlockAchievement(templateId: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  const result = await unlockAchievementForUser(prisma, userId, templateId);

  if ("success" in result) {
    revalidatePath("/achievements");
    achievementEmitter.emit(`unlock:${userId}`, result);
  }

  return result;
}
