import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { createRun, getRunsByGameCategory } from "@/lib/runs/service";

const bodySchema = z.object({
  game: z.string().trim().min(1),
  category: z.string().trim().min(1),
  totalMs: z.number().int().positive(),
  splits: z.unknown(),
  goldSplits: z.array(z.boolean()).optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([]);

  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game") ?? "";
  const category = searchParams.get("category") ?? "";
  if (!game || !category) return NextResponse.json([]);

  const runs = await getRunsByGameCategory(prisma, game, category);
  return NextResponse.json(runs.filter((r) => r.userId === session!.user!.id));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const run = await createRun(prisma, {
      userId: session.user.id,
      ...parsed.data,
    });
    return NextResponse.json({ id: run.id, isWR: run.isWR }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save run";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
