import { type PrismaClient, type Prisma } from "@prisma/client";
import { z } from "zod";

// ── Output types ──────────────────────────────────────────────────────────────

export type RunRecord = {
  id: string;
  userId: string | null;
  runner: string | null;
  game: string;
  gameSlug: string;
  category: string;
  totalMs: number;
  splits: unknown;
  goldSplits: boolean[];
  isWR: boolean;
  shareToken: string | null;
  createdAt: Date;
};

// ── Input validation ──────────────────────────────────────────────────────────

const createRunSchema = z.object({
  userId: z.string().nullish(),
  game: z.string().trim().min(1, "game is required"),
  category: z.string().trim().min(1, "category is required"),
  totalMs: z.number().int().positive("totalMs must be positive"),
  splits: z.unknown(),
  goldSplits: z.array(z.boolean()).optional().default([]),
});

export type CreateRunInput = z.input<typeof createRunSchema>;

function assertJsonSerializable(value: unknown): void {
  if (value === undefined) {
    throw new Error("splits must be JSON-serializable");
  }
  try {
    JSON.stringify(value);
  } catch {
    throw new Error("splits must be JSON-serializable");
  }
}

// ── Prisma include shape ──────────────────────────────────────────────────────

const RUN_INCLUDE = {
  user: { select: { name: true } },
  category: {
    include: {
      game: { select: { name: true, slug: true } },
    },
  },
} satisfies Prisma.SpeedrunRunInclude;

type RunRow = Prisma.SpeedrunRunGetPayload<{ include: typeof RUN_INCLUDE }>;

// ── Mapper ────────────────────────────────────────────────────────────────────

function toRunRecord(row: RunRow): RunRecord {
  let splits: unknown = null;
  let goldSplits: boolean[] = [];
  try {
    splits = JSON.parse(row.splitTimes);
  } catch {
    // leave as null
  }
  try {
    goldSplits = JSON.parse(row.goldSplits) as boolean[];
  } catch {
    // leave as empty
  }

  return {
    id: row.id,
    userId: row.userId,
    runner: row.user?.name ?? null,
    game: row.category.game.name,
    gameSlug: row.category.game.slug,
    category: row.category.name,
    totalMs: row.totalTime,
    splits,
    goldSplits,
    isWR: row.isWR,
    shareToken: row.shareToken,
    createdAt: row.createdAt,
  };
}

// ── Shared helper ─────────────────────────────────────────────────────────────

async function findCategoryId(
  prisma: PrismaClient,
  game: string,
  category: string,
): Promise<string | null> {
  const cat = await prisma.speedrunCategory.findFirst({
    where: { name: category, game: { name: game } },
    select: { id: true },
  });
  return cat?.id ?? null;
}

// ── Public functions ──────────────────────────────────────────────────────────

export async function createRun(
  prisma: PrismaClient,
  input: CreateRunInput,
): Promise<RunRecord> {
  const data = createRunSchema.parse(input);
  assertJsonSerializable(data.splits);

  const categoryId = await findCategoryId(prisma, data.game, data.category);
  if (!categoryId) {
    throw new Error(
      `Category "${data.category}" not found for game "${data.game}"`,
    );
  }

  const run = await prisma.speedrunRun.create({
    data: {
      userId: data.userId ?? null,
      categoryId,
      splitTimes: JSON.stringify(data.splits),
      totalTime: data.totalMs,
      goldSplits: JSON.stringify(data.goldSplits),
      shareToken: crypto.randomUUID(),
      isWR: false,
    },
    include: RUN_INCLUDE,
  });

  await updateWorldRecordForCategory(prisma, data.game, data.category);

  // Re-fetch so isWR reflects the updated flag
  const updated = await prisma.speedrunRun.findUniqueOrThrow({
    where: { id: run.id },
    include: RUN_INCLUDE,
  });

  return toRunRecord(updated);
}

export async function getRunById(
  prisma: PrismaClient,
  id: string,
): Promise<RunRecord | null> {
  const run = await prisma.speedrunRun.findUnique({
    where: { id },
    include: RUN_INCLUDE,
  });
  return run ? toRunRecord(run) : null;
}

export async function getRunsByGameCategory(
  prisma: PrismaClient,
  game: string,
  category: string,
): Promise<RunRecord[]> {
  const runs = await prisma.speedrunRun.findMany({
    where: { category: { name: category, game: { name: game } } },
    orderBy: { totalTime: "asc" },
    include: RUN_INCLUDE,
  });
  return runs.map(toRunRecord);
}

export async function getUserPb(
  prisma: PrismaClient,
  userId: string,
  game: string,
  category: string,
): Promise<RunRecord | null> {
  const run = await prisma.speedrunRun.findFirst({
    where: {
      userId,
      category: { name: category, game: { name: game } },
    },
    orderBy: { totalTime: "asc" },
    include: RUN_INCLUDE,
  });
  return run ? toRunRecord(run) : null;
}

export async function getWorldRecords(
  prisma: PrismaClient,
): Promise<RunRecord[]> {
  const runs = await prisma.speedrunRun.findMany({
    where: { isWR: true },
    include: RUN_INCLUDE,
  });
  return runs
    .map(toRunRecord)
    .sort(
      (a, b) =>
        a.game.localeCompare(b.game) || a.category.localeCompare(b.category),
    );
}

export async function updateWorldRecordForCategory(
  prisma: PrismaClient,
  game: string,
  category: string,
): Promise<void> {
  const categoryId = await findCategoryId(prisma, game, category);
  if (!categoryId) return;

  await prisma.$transaction(async (tx) => {
    const fastest = await tx.speedrunRun.findFirst({
      where: { categoryId },
      orderBy: { totalTime: "asc" },
      select: { id: true },
    });

    await tx.speedrunRun.updateMany({
      where: { categoryId },
      data: { isWR: false },
    });

    if (fastest) {
      await tx.speedrunRun.update({
        where: { id: fastest.id },
        data: { isWR: true },
      });
    }
  });
}
