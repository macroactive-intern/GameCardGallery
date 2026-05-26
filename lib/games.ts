import {
  mkdir,
  open,
  readFile,
  rename,
  stat,
  unlink,
  writeFile,
} from "fs/promises";
import path from "path";
import {
  createGameSchema,
  gameSchema,
  updateGameSchema,
  type Game,
} from "./gameSchema";

const gamesFilePath = path.join(process.cwd(), "data", "games.json");
const lockFilePath = `${gamesFilePath}.lock`;
const writeLockTimeoutMs = 5_000;
const staleWriteLockMs = 30_000;
const writeLockRetryMs = 25;

export class GameDataError extends Error {
  constructor(message = "Unable to access game data.") {
    super(message);
    this.name = "GameDataError";
  }
}

export class DuplicateSlugError extends Error {
  constructor(slug: string) {
    super(`A game with the slug "${slug}" already exists.`);
    this.name = "DuplicateSlugError";
  }
}

function createSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function sortFeaturedFirst(games: Game[]): Game[] {
  return [...games].sort(
    (a, b) => Number(b.featured) - Number(a.featured),
  );
}

function assertUniqueSlugs(games: Game[]): void {
  const slugs = new Set<string>();

  for (const game of games) {
    if (slugs.has(game.slug)) {
      throw new DuplicateSlugError(game.slug);
    }

    slugs.add(game.slug);
  }
}

function assertSlugAvailable(
  games: Game[],
  slug: string,
  currentSlug?: string,
): void {
  const duplicate = games.some(
    (game) => game.slug === slug && game.slug !== currentSlug,
  );

  if (duplicate) {
    throw new DuplicateSlugError(slug);
  }
}

function isFileNotFoundError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

function isFileSystemError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function isLockAlreadyHeldError(
  error: unknown,
): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "EEXIST";
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function removeStaleWriteLock(): Promise<void> {
  try {
    const lockStats = await stat(lockFilePath);

    if (Date.now() - lockStats.mtimeMs > staleWriteLockMs) {
      await unlink(lockFilePath);
    }
  } catch (error) {
    if (!isFileNotFoundError(error)) {
      throw new GameDataError();
    }
  }
}

async function acquireWriteLock(): Promise<() => Promise<void>> {
  const startedAt = Date.now();

  await mkdir(path.dirname(gamesFilePath), { recursive: true });

  while (true) {
    try {
      const lockHandle = await open(lockFilePath, "wx");

      await lockHandle.close();

      return async () => {
        try {
          await unlink(lockFilePath);
        } catch (error) {
          if (!isFileNotFoundError(error)) {
            throw new GameDataError();
          }
        }
      };
    } catch (error) {
      if (!isLockAlreadyHeldError(error)) {
        throw new GameDataError();
      }

      await removeStaleWriteLock();

      if (Date.now() - startedAt >= writeLockTimeoutMs) {
        throw new GameDataError("Game data is busy. Please try again.");
      }

      await delay(writeLockRetryMs);
    }
  }
}

async function withGamesWriteLock<T>(operation: () => Promise<T>): Promise<T> {
  const releaseWriteLock = await acquireWriteLock();

  try {
    return await operation();
  } finally {
    await releaseWriteLock();
  }
}

async function readGames(): Promise<Game[]> {
  try {
    let file: string;

    try {
      file = await readFile(gamesFilePath, "utf8");
    } catch (error) {
      if (isFileNotFoundError(error)) {
        return [];
      }

      throw new GameDataError();
    }

    const games = gameSchema.array().parse(JSON.parse(file));

    assertUniqueSlugs(games);

    return games;
  } catch (error) {
    if (
      error instanceof SyntaxError ||
      error instanceof DuplicateSlugError ||
      isFileSystemError(error)
    ) {
      throw new GameDataError();
    }

    throw error;
  }
}

async function writeGames(games: Game[]): Promise<void> {
  assertUniqueSlugs(games);

  const temporaryFilePath = `${gamesFilePath}.${process.pid}.${Date.now()}.tmp`;

  try {
    await mkdir(path.dirname(gamesFilePath), { recursive: true });
    await writeFile(
      temporaryFilePath,
      `${JSON.stringify(games, null, 2)}\n`,
      "utf8",
    );
    await rename(temporaryFilePath, gamesFilePath);
  } catch {
    await unlink(temporaryFilePath).catch(() => undefined);
    throw new GameDataError();
  }
}

export async function getGames(): Promise<Game[]> {
  return sortFeaturedFirst(await readGames());
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  const games = await readGames();

  return games.find((game) => game.slug === slug) ?? null;
}

export async function createGame(data: unknown): Promise<Game> {
  return withGamesWriteLock(async () => {
    const games = await readGames();
    const parsedData = createGameSchema.parse(data);
    const slug = createSlug(parsedData.title);

    if (!slug) {
      throw new Error("Title must include at least one letter or number.");
    }

    assertSlugAvailable(games, slug);

    const game = gameSchema.parse({
      ...parsedData,
      slug,
    });

    await writeGames([...games, game]);

    return game;
  });
}

export async function updateGame(
  slug: string,
  data: unknown,
): Promise<Game | null> {
  return withGamesWriteLock(async () => {
    const games = await readGames();
    const gameIndex = games.findIndex((game) => game.slug === slug);

    if (gameIndex === -1) {
      return null;
    }

    const currentGame = games[gameIndex];
    const parsedData = updateGameSchema.parse(data);
    const nextSlug = parsedData.title
      ? createSlug(parsedData.title)
      : currentGame.slug;

    if (!nextSlug) {
      throw new Error("Title must include at least one letter or number.");
    }

    assertSlugAvailable(games, nextSlug, currentGame.slug);

    const updatedGame = gameSchema.parse({
      ...currentGame,
      ...parsedData,
      slug: nextSlug,
    });

    const updatedGames = games.with(gameIndex, updatedGame);

    await writeGames(updatedGames);

    return updatedGame;
  });
}

export async function deleteGame(slug: string): Promise<boolean> {
  return withGamesWriteLock(async () => {
    const games = await readGames();
    const nextGames = games.filter((game) => game.slug !== slug);

    if (nextGames.length === games.length) {
      return false;
    }

    await writeGames(nextGames);

    return true;
  });
}

export function getRelatedGames(currentGame: Game, games: Game[]): Game[] {
  return games
    .filter(
      (game) => game.slug !== currentGame.slug && game.genre === currentGame.genre,
    )
    .slice(0, 4);
}
