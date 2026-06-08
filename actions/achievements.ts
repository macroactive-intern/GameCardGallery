"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { unlockAchievementForUser } from "@/lib/achievements/service";
import { achievementEmitter } from "@/lib/achievements/emitter";

const templateIdSchema = z.string().cuid();

export async function unlockAchievement(templateId: string) {
  const session = await requireAuth();

  const parsed = templateIdSchema.safeParse(templateId);
  if (!parsed.success) return { error: "Invalid templateId" };

  const result = await unlockAchievementForUser(prisma, session.user.id, parsed.data);

  if ("success" in result) {
    revalidatePath("/achievements");
    achievementEmitter.emit(`unlock:${session.user.id}`, result);
  }

  return result;
}
