import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ pbRun: null, goldTimes: null });
  }

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  if (!categoryId) {
    return NextResponse.json({ error: "categoryId required" }, { status: 400 });
  }

  const runs = await prisma.speedrunRun.findMany({
    where: { userId: session.user.id, categoryId },
    orderBy: { totalTime: "asc" },
    select: { splitTimes: true, totalTime: true },
  });

  if (runs.length === 0) {
    return NextResponse.json({ pbRun: null, goldTimes: null });
  }

  const pbRun = runs[0];
  const pbSplitTimes = JSON.parse(pbRun.splitTimes) as number[];

  const allSegments = runs.map((r) => JSON.parse(r.splitTimes) as number[]);
  const goldTimes = pbSplitTimes.map((_, i) =>
    Math.min(...allSegments.map((segs) => segs[i] ?? Number.MAX_SAFE_INTEGER)),
  );

  return NextResponse.json({
    pbRun: { splitTimes: pbSplitTimes, totalTime: pbRun.totalTime },
    goldTimes,
  });
}
