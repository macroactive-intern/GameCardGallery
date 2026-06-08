import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRunsByGameCategory } from "@/lib/runs/service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game") ?? "";
  const category = searchParams.get("category") ?? "";
  if (!game || !category) return NextResponse.json(null);

  const runs = await getRunsByGameCategory(prisma, game, category);
  const wr = runs.find((r) => r.isWR);
  if (!wr) return NextResponse.json(null);

  type SavedSplit = { name: string; segmentMs: number | null };
  const splits = Array.isArray(wr.splits) ? (wr.splits as SavedSplit[]) : [];

  return NextResponse.json({
    totalMs: wr.totalMs,
    segments: splits.map((s) => s.segmentMs),
  });
}
