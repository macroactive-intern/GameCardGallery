import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { publish, type LiveSplitEvent } from "@/lib/timer/liveStore";

const splitSchema = z.object({
  name: z.string(),
  elapsed: z.number().nullable(),
  segmentMs: z.number().nullable(),
});

const bodySchema = z.object({
  game: z.string(),
  category: z.string(),
  status: z.enum(["idle", "running", "paused", "finished"]),
  elapsedMs: z.number(),
  currentSplitIndex: z.number().int().nonnegative(),
  splits: z.array(splitSchema),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const event: LiveSplitEvent = { ...parsed.data, updatedAt: Date.now() };
  publish(session.user.id, event);

  return NextResponse.json({ ok: true });
}
