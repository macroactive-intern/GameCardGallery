import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getLeaderboard } from "@/lib/achievements/service";

const getCachedLeaderboard = unstable_cache(
  () => getLeaderboard(prisma),
  ["leaderboard"],
  { revalidate: 30 },
);

export async function GET() {
  await requireAuth();
  const leaderboard = await getCachedLeaderboard();
  return NextResponse.json(leaderboard);
}
