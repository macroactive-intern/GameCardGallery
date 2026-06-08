import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  gameName: z.string().trim().min(1).max(100),
  categoryName: z.string().trim().min(1).max(100),
  splitNames: z.array(z.string().trim().min(1).max(80)).min(1).max(50),
});

function toSlug(name: string, suffix?: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return suffix ? `${base}-${suffix}` : base;
}

export async function GET() {
  const games = await prisma.speedrunGame.findMany({
    include: {
      categories: {
        select: { id: true, name: true, splitNames: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    games.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      categories: g.categories.map((c) => ({
        id: c.id,
        name: c.name,
        splitNames: JSON.parse(c.splitNames) as string[],
      })),
    })),
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { gameName, categoryName, splitNames } = parsed.data;
  const baseSlug = toSlug(gameName);

  let game = await prisma.speedrunGame.findUnique({ where: { slug: baseSlug } });
  if (!game) {
    let slug = baseSlug;
    let attempt = 1;
    while (await prisma.speedrunGame.findUnique({ where: { slug } })) {
      slug = toSlug(gameName, String(attempt++));
    }
    game = await prisma.speedrunGame.create({ data: { name: gameName, slug } });
  }

  const existingCat = await prisma.speedrunCategory.findUnique({
    where: { gameId_name: { gameId: game.id, name: categoryName } },
  });
  if (existingCat) {
    return NextResponse.json(
      { error: "Category already exists for this game" },
      { status: 409 },
    );
  }

  const category = await prisma.speedrunCategory.create({
    data: {
      gameId: game.id,
      name: categoryName,
      splitNames: JSON.stringify(splitNames),
    },
  });

  return NextResponse.json(
    {
      game: { id: game.id, name: game.name, slug: game.slug },
      category: {
        id: category.id,
        name: category.name,
        splitNames,
      },
    },
    { status: 201 },
  );
}
