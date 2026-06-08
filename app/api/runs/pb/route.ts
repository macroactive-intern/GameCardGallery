import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { getUserPb } from "@/lib/runs/service";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ run: null }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game") ?? "";
  const category = searchParams.get("category") ?? "";
  if (!game || !category) {
    return NextResponse.json({ error: "game and category required" }, { status: 400 });
  }

  const run = await getUserPb(prisma, session.user.id, game, category);
  return NextResponse.json({ run });
}
