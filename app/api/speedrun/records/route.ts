import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const getRecords = unstable_cache(
  async () => {
    const games = await prisma.speedrunGame.findMany({
      include: {
        categories: {
          include: {
            runs: {
              where: { userId: { not: null } },
              orderBy: { totalTime: "asc" },
              take: 5,
              include: { user: { select: { name: true } } },
            },
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return games
      .map((g) => ({
        game: { id: g.id, name: g.name, slug: g.slug },
        categories: g.categories
          .filter((c) => c.runs.length > 0)
          .map((c) => {
            const splitNames = JSON.parse(c.splitNames) as string[];
            return {
              id: c.id,
              name: c.name,
              splitCount: splitNames.length,
              runs: c.runs.map((r) => ({
                id: r.id,
                totalTime: r.totalTime,
                runner: r.user?.name ?? "Anonymous",
                createdAt: r.createdAt,
                splitTimes: JSON.parse(r.splitTimes) as number[],
                goldSplits: JSON.parse(r.goldSplits) as boolean[],
                splitNames,
              })),
            };
          }),
      }))
      .filter((g) => g.categories.length > 0);
  },
  ["speedrun-records"],
  { revalidate: 60 },
);

export async function GET() {
  const records = await getRecords();
  return NextResponse.json(records);
}
