import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

const saveSchema = z.object({
  categoryId: z.string().min(1),
  splitTimes: z.array(z.number().int().nonnegative()),
  totalTime: z.number().int().positive(),
  goldSplits: z.array(z.boolean()),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required to save runs" },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { categoryId, splitTimes, totalTime, goldSplits } = parsed.data;

  const category = await prisma.speedrunCategory.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const shareToken = crypto.randomUUID();

  const run = await prisma.speedrunRun.create({
    data: {
      userId: session.user.id,
      categoryId,
      splitTimes: JSON.stringify(splitTimes),
      totalTime,
      goldSplits: JSON.stringify(goldSplits),
      shareToken,
    },
  });

  return NextResponse.json({ id: run.id, shareToken }, { status: 201 });
}
