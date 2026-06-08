import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const run = await prisma.speedrunRun.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true } },
      category: {
        include: { game: { select: { name: true, slug: true } } },
      },
    },
  });

  if (!run) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const splitNames = JSON.parse(run.category.splitNames) as string[];
  const splitTimes = JSON.parse(run.splitTimes) as number[];
  const goldSplits = JSON.parse(run.goldSplits) as boolean[];

  return NextResponse.json({
    id: run.id,
    createdAt: run.createdAt,
    totalTime: run.totalTime,
    runner: run.user?.name ?? "Anonymous",
    game: run.category.game.name,
    category: run.category.name,
    splits: splitNames.map((name, i) => ({
      name,
      segmentTime: splitTimes[i] ?? 0,
      isGold: goldSplits[i] ?? false,
    })),
  });
}
