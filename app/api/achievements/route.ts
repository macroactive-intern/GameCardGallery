import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getAchievementOverview } from "@/lib/achievements/service";

export async function GET() {
  const session = await requireAuth();
  const overview = await getAchievementOverview(prisma, session.user.id);
  return NextResponse.json(overview);
}
