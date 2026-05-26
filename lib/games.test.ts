import { mkdir, mkdtemp, readFile, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Game } from "./gameSchema";

const baseGame = {
  platform: "PC",
  tags: ["strategy"],
  rating: 8.5,
  releaseYear: 2026,
  coverUrl: "https://picsum.photos/seed/game-test/800/600",
  description: "A long enough description for a test game entry.",
  featured: false,
};

const existingGames: Game[] = [
  {
    ...baseGame,
    slug: "standard-strategy",
    title: "Standard Strategy",
    genre: "Strategy",
  },
  {
    ...baseGame,
    slug: "featured-rpg",
    title: "Featured RPG",
    genre: "RPG",
    featured: true,
  },
  {
    ...baseGame,
    slug: "another-strategy",
    title: "Another Strategy",
    genre: "Strategy",
  },
];

async function loadGamesModule(initialGames: Game[] = []) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "game-store-"));
  const dataDir = path.join(tempDir, "data");
  const gamesPath = path.join(dataDir, "games.json");

  await mkdir(dataDir, { recursive: true });
  await writeFile(gamesPath, `${JSON.stringify(initialGames, null, 2)}\n`);
  vi.resetModules();
  vi.spyOn(process, "cwd").mockReturnValue(tempDir);

  const gamesModule = await import("./games");

  return {
    gamesModule,
    gamesPath,
    async readStoredGames() {
      return JSON.parse(await readFile(gamesPath, "utf8")) as Game[];
    },
    async cleanup() {
      vi.restoreAllMocks();
      await rm(tempDir, { recursive: true, force: true });
    },
  };
}

describe("games file store", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("sorts featured games first without losing non-featured order", async () => {
    const context = await loadGamesModule(existingGames);
    cleanup = context.cleanup;

    await expect(context.gamesModule.getGames()).resolves.toMatchObject([
      { slug: "featured-rpg" },
      { slug: "standard-strategy" },
      { slug: "another-strategy" },
    ]);
  });

  it("creates a game with a generated unique slug", async () => {
    const context = await loadGamesModule([]);
    cleanup = context.cleanup;

    const game = await context.gamesModule.createGame({
      ...baseGame,
      title: "New Strategy Game",
      genre: "Strategy",
    });

    expect(game.slug).toBe("new-strategy-game");
    await expect(context.readStoredGames()).resolves.toHaveLength(1);
  });

  it("rejects duplicate slugs", async () => {
    const context = await loadGamesModule(existingGames);
    cleanup = context.cleanup;

    await expect(
      context.gamesModule.createGame({
        ...baseGame,
        title: "Standard Strategy",
        genre: "Strategy",
      }),
    ).rejects.toBeInstanceOf(context.gamesModule.DuplicateSlugError);
  });

  it("serializes concurrent duplicate creates", async () => {
    const context = await loadGamesModule([]);
    cleanup = context.cleanup;
    const payload = {
      ...baseGame,
      title: "Concurrent Strategy",
      genre: "Strategy",
    };

    const results = await Promise.allSettled([
      context.gamesModule.createGame(payload),
      context.gamesModule.createGame(payload),
    ]);
    const fulfilledResults = results.filter(
      (result) => result.status === "fulfilled",
    );
    const rejectedResults = results.filter(
      (result) => result.status === "rejected",
    );

    expect(fulfilledResults).toHaveLength(1);
    expect(rejectedResults).toHaveLength(1);
    expect(await context.readStoredGames()).toHaveLength(1);
  });

  it("updates a game and prevents slug collisions", async () => {
    const context = await loadGamesModule(existingGames);
    cleanup = context.cleanup;

    await expect(
      context.gamesModule.updateGame("another-strategy", {
        title: "Standard Strategy",
      }),
    ).rejects.toBeInstanceOf(context.gamesModule.DuplicateSlugError);

    const updatedGame = await context.gamesModule.updateGame("another-strategy", {
      title: "Renamed Strategy",
      rating: 9.1,
    });

    expect(updatedGame).toMatchObject({
      slug: "renamed-strategy",
      title: "Renamed Strategy",
      rating: 9.1,
    });
  });

  it("derives related games from an existing in-memory list", async () => {
    const context = await loadGamesModule(existingGames);
    cleanup = context.cleanup;
    const currentGame = existingGames[0];

    expect(context.gamesModule.getRelatedGames(currentGame, existingGames)).toEqual([
      existingGames[2],
    ]);
  });
});
