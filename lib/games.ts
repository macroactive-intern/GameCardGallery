import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  createGameSchema,
  gameSchema,
  updateGameSchema,
  type CreateGameInput,
  type Game,
  type UpdateGameInput,
} from "./gameSchema";

type CreateGameData = CreateGameInput;
type UpdateGameData = UpdateGameInput;

const gamesFilePath = path.join(process.cwd(), "data", "games.json");

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
  return games
    .map((game, index) => ({ game, index }))
    .sort((a, b) => {
      const featuredSort = Number(b.game.featured) - Number(a.game.featured);

      return featuredSort || a.index - b.index;
    })
    .map(({ game }) => game);
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

  try {
    await mkdir(path.dirname(gamesFilePath), { recursive: true });
    await writeFile(
      gamesFilePath,
      `${JSON.stringify(games, null, 2)}\n`,
      "utf8",
    );
  } catch {
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

export async function createGame(data: CreateGameData): Promise<Game> {
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
}

export async function updateGame(
  slug: string,
  data: UpdateGameData,
): Promise<Game | null> {
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
}

export async function deleteGame(slug: string): Promise<boolean> {
  const games = await readGames();
  const nextGames = games.filter((game) => game.slug !== slug);

  if (nextGames.length === games.length) {
    return false;
  }

  await writeGames(nextGames);

  return true;
}

export async function getRelatedGames(slug: string): Promise<Game[]> {
  const currentGame = await getGameBySlug(slug);

  if (!currentGame) {
    return [];
  }

  const games = await getGames();

  return games
    .filter(
      (game) => game.slug !== currentGame.slug && game.genre === currentGame.genre,
    )
    .slice(0, 4);
}
