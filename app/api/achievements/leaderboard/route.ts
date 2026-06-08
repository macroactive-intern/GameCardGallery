import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { calculateLevel } from "@/lib/achievements/xp";

async function getLeaderboard() {
  console.log("[leaderboard] fetching from database");

  const rows = await prisma.userXp.findMany({
    take: 20,
    orderBy: { totalXp: "desc" },
    include: {
      user: { select: { name: true, image: true } },
    },
  });

  return rows.map((row) => ({
    userId: row.userId,
    name: row.user.name,
    image: row.user.image,
    totalXp: row.totalXp,
    ...calculateLevel(row.totalXp),
  }));
}

const getCachedLeaderboard = unstable_cache(getLeaderboard, ["leaderboard"], {
  revalidate: 30,
});

export async function GET() {
  await requireAuth();
  const leaderboard = await getCachedLeaderboard();
  return NextResponse.json(leaderboard);
}
