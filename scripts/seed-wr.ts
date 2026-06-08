/**
 * Inserts a test game + category + WR run so the ghost delta can be exercised.
 * Run with:  npx tsx scripts/seed-wr.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GAME = "Super Mario Bros.";
const CATEGORY = "Any%";
const SPLIT_NAMES = ["World 1", "World 2", "World 3", "World 4", "Bowser"];

// Segment times for the "WR" in milliseconds — 5 splits, total 46_500
const WR_SEGMENTS = [10_200, 8_800, 9_400, 11_900, 6_200]; // total 46_500

async function main() {
  // Upsert game
  let game = await prisma.speedrunGame.findFirst({ where: { name: GAME } });
  if (!game) {
    game = await prisma.speedrunGame.create({
      data: { name: GAME, slug: "super-mario-bros" },
    });
    console.log("Created game:", game.name);
  } else {
    console.log("Found game:", game.name);
  }

  // Upsert category
  let category = await prisma.speedrunCategory.findFirst({
    where: { gameId: game.id, name: CATEGORY },
  });
  if (!category) {
    category = await prisma.speedrunCategory.create({
      data: {
        gameId: game.id,
        name: CATEGORY,
        splitNames: JSON.stringify(SPLIT_NAMES),
      },
    });
    console.log("Created category:", category.name);
  } else {
    console.log("Found category:", category.name);
  }

  // Build cumulative elapsed times from segments
  let elapsed = 0;
  const splits = SPLIT_NAMES.map((name, i) => {
    elapsed += WR_SEGMENTS[i];
    return { name, segmentMs: WR_SEGMENTS[i], elapsed };
  });
  const totalMs = elapsed;

  // Clear any existing runs for this category so WR logic is clean
  await prisma.speedrunRun.deleteMany({ where: { categoryId: category.id } });

  // Insert the WR run (no real userId — anonymous)
  const run = await prisma.speedrunRun.create({
    data: {
      categoryId: category.id,
      userId: null,
      splitTimes: JSON.stringify(splits.map((s) => ({ name: s.name, segmentMs: s.segmentMs }))),
      totalTime: totalMs,
      goldSplits: JSON.stringify(SPLIT_NAMES.map(() => false)),
      shareToken: crypto.randomUUID(),
      isWR: true,
    },
  });

  console.log(`\nWR run inserted:`);
  console.log(`  id:       ${run.id}`);
  console.log(`  total:    ${totalMs} ms  (${(totalMs / 1000).toFixed(2)} s)`);
  console.log(`  segments: ${WR_SEGMENTS.join(", ")} ms`);
  console.log(`\nTest the endpoint:`);
  console.log(
    `  curl "http://localhost:3005/api/runs/wr?game=Super+Mario+Bros.&category=Any%25"`,
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
